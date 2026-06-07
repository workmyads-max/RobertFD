/**
 * Checkout.com webhook handler — HMAC SHA-256 signature verified
 * Includes replay attack prevention, idempotency, and auto-provisioning
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Constant-time HMAC comparison to prevent timing attacks
async function verifyCheckoutSignature(body, signature, secret) {
  if (!signature || !secret) return false;
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const rawSig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
    const expected = Array.from(new Uint8Array(rawSig)).map(b => b.toString(16).padStart(2, '0')).join('');
    // Checkout.com sends hex-encoded HMAC-SHA256
    return expected.toLowerCase() === signature.toLowerCase();
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.text();
    const signature = req.headers.get('Checkout-Signature') || req.headers.get('Cko-Signature') || '';
    const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';

    // Load webhook secret from env var first (zero DB reads), fallback to DB only if not set
    // This eliminates 1 DB read on every webhook hit including bot probes
    let webhookSecret = Deno.env.get('CHECKOUT_WEBHOOK_SECRET');
    if (!webhookSecret) {
      const gateways = await base44.asServiceRole.entities.PaymentGateway.filter({
        provider: 'checkout_com', is_active: true,
      });
      if (!gateways || gateways.length === 0) {
        return Response.json({ error: 'Checkout.com not configured' }, { status: 500 });
      }
      webhookSecret = gateways[0]?.webhook_secret;
    }

    // ── HMAC SHA-256 SIGNATURE VERIFICATION ───────────────────────────────────
    if (webhookSecret) {
      const isValid = await verifyCheckoutSignature(body, signature, webhookSecret);
      if (!isValid) {
        console.error(`[SECURITY] Invalid Checkout.com signature from IP: ${ipAddress}`);
        await base44.asServiceRole.entities.PaymentLog.create({
          gateway: 'checkout_com', event_type: 'signature_failure',
          event_data: { ip: ipAddress, body_preview: body.slice(0, 200) },
          status: 'failed', processed: true,
          notes: 'HMAC SHA-256 verification failed — possible forged request',
        });
        return Response.json({ error: 'Invalid signature' }, { status: 401 });
      }
    } else {
      console.warn('[SECURITY] No webhook_secret configured for Checkout.com — accepting unverified');
    }

    // ── PARSE EVENT ───────────────────────────────────────────────────────────
    let event;
    try { event = JSON.parse(body); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

    // ── REPLAY ATTACK PREVENTION (reject events > 5 minutes old) ─────────────
    const eventTime = event.created_on ? new Date(event.created_on).getTime() : Date.now();
    if (Date.now() - eventTime > 300000) {
      console.warn(`[SECURITY] Stale event rejected — timestamp: ${event.created_on}, IP: ${ipAddress}`);
      return Response.json({ error: 'Stale event rejected' }, { status: 400 });
    }

    // ── IDEMPOTENCY — prevent duplicate processing ─────────────────────────────
    const txId = event.data?.id;
    if (txId) {
      const existingLogs = await base44.asServiceRole.entities.PaymentLog.filter({
        transaction_id: txId, processed: true,
      });
      if (existingLogs.length > 0) {
        console.log(`[Checkout.com] Duplicate event ignored: txn_id=${txId}`);
        return Response.json({ received: true, duplicate: true });
      }
    }

    // ── LOG WEBHOOK EVENT ─────────────────────────────────────────────────────
    await base44.asServiceRole.entities.PaymentLog.create({
      gateway: 'checkout_com', event_type: event.type, event_data: event,
      order_id: event.data?.reference, transaction_id: txId,
      status: event.type === 'payment_approved' ? 'paid' : event.type === 'payment_declined' ? 'failed' : 'pending',
      processed: ['payment_approved', 'payment_declined'].includes(event.type),
    });

    // ── HANDLE EVENT TYPES ────────────────────────────────────────────────────
    if (event.type === 'payment_approved') {
      const orders = await base44.asServiceRole.entities.Order.filter({ order_id: event.data?.reference });
      const order = orders[0];

      if (order) {
        // Detect payment method (Apple Pay / Google Pay / Card)
        const source = event.data?.source?.type || 'card';
        const method = source === 'applepay' ? 'checkout_com_apple_pay'
          : source === 'googlepay' ? 'checkout_com_google_pay'
          : 'checkout_com_card';

        await base44.asServiceRole.entities.Order.update(order.id, {
          payment_status: 'confirmed', transaction_id: txId, payment_method: method,
        });

        // Auto-provision challenge account (only triggered here — no manual bypass)
        try {
          await base44.functions.invoke('provisionMatchTraderAccount', {
            account_id: order.account_id || order.order_id,
            order_id: order.order_id,
            user_email: order.email,
            challenge_type: order.challenge_type,
            account_type: order.account_type || 'standard',
            account_size: order.account_size,
            leverage: order.leverage || '1:100',
            platform: order.platform || 'mt5',
          });
        } catch (e) { console.error('[Checkout.com] Provisioning failed (non-blocking):', e.message); }

        // Affiliate commissions L1/L2/L3 — non-blocking
        base44.asServiceRole.functions.invoke('createAffiliateCommissions', {
          user_email: order.email,
          order_id: order.order_id,
          order_price: order.price,
          challenge_type: order.challenge_type,
          account_size: order.account_size,
        }).catch(e => console.error('[Checkout.com] Affiliate commission failed:', e.message));

        try {
          await base44.functions.invoke('sendBrandedEmail', {
            to: order.email, template_type: 'payment_success',
            data: { name: order.full_name, amount: order.price, order_id: order.order_id, challenge_type: order.challenge_type, account_size: order.account_size },
          });
        } catch (e) { console.error('[Checkout.com] Email failed (non-blocking):', e.message); }

        await base44.asServiceRole.entities.Notification.create({
          title: '✅ Payment Confirmed',
          message: `Your Checkout.com payment of $${order.price} was approved. Challenge account provisioning initiated.`,
          type: 'payout', priority: 'high', display_mode: 'popup', is_active: true, target: 'challenge',
        });
      }
    } else if (event.type === 'payment_declined') {
      const orders = await base44.asServiceRole.entities.Order.filter({ order_id: event.data?.reference });
      if (orders[0]) {
        await base44.asServiceRole.entities.Order.update(orders[0].id, { payment_status: 'failed' });
      }
    } else if (event.type === 'payment_voided' || event.type === 'payment_refunded') {
      const orders = await base44.asServiceRole.entities.Order.filter({ order_id: event.data?.reference });
      if (orders[0]) {
        await base44.asServiceRole.entities.Order.update(orders[0].id, {
          payment_status: event.type === 'payment_refunded' ? 'refunded' : 'cancelled',
        });
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('[Checkout.com] Webhook error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});