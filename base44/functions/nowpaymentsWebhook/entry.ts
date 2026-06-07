/**
 * NOWPayments IPN (Instant Payment Notification) webhook handler
 * Verifies HMAC-SHA512 signature, tracks blockchain confirmations,
 * and provisions challenge accounts only after confirmed payment.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

async function verifyNowPaymentsSignature(body, signature, ipcSecret) {
  if (!signature || !ipcSecret) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(ipcSecret), { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']
  );
  // NOWPayments signs the sorted JSON payload
  const sorted = JSON.stringify(JSON.parse(body), Object.keys(JSON.parse(body)).sort());
  const rawSig = await crypto.subtle.sign('HMAC', key, encoder.encode(sorted));
  const expected = Array.from(new Uint8Array(rawSig)).map(b => b.toString(16).padStart(2, '0')).join('');
  return expected.toLowerCase() === signature.toLowerCase();
}

async function provisionAfterPayment(base44, order) {
  try {
    await base44.asServiceRole.functions.invoke('provisionMatchTraderAccount', {
      account_id: order.account_id || order.order_id,
      order_id: order.order_id,
      user_email: order.email,
      challenge_type: order.challenge_type,
      account_type: order.account_type || 'standard',
      account_size: order.account_size,
      leverage: order.leverage || '1:100',
      platform: order.platform || 'mt5',
    });
  } catch (e) {
    console.error('[NOWPayments] Provisioning failed (non-blocking):', e.message);
  }
  try {
    await base44.asServiceRole.functions.invoke('sendBrandedEmail', {
      to: order.email,
      template_type: 'payment_success',
      data: { name: order.full_name, amount: order.price, order_id: order.order_id, challenge_type: order.challenge_type, account_size: order.account_size },
    });
  } catch (e) { console.error('[NOWPayments] Email failed (non-blocking):', e.message); }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.text();
    const signature = req.headers.get('x-nowpayments-sig');

    // Load gateway config for IPN secret
    const gateways = await base44.asServiceRole.entities.PaymentGateway.filter({ provider: 'nowpayments', is_active: true });
    const gateway = gateways[0];
    const ipcSecret = gateway?.webhook_secret;

    // Signature verification
    if (ipcSecret) {
      const isValid = await verifyNowPaymentsSignature(body, signature, ipcSecret);
      if (!isValid) {
        console.error('[SECURITY] Invalid NOWPayments IPN signature');
        await base44.asServiceRole.entities.PaymentLog.create({
          gateway: 'nowpayments', event_type: 'signature_failure',
          event_data: { signature, body_preview: body.slice(0, 200) }, status: 'failed',
          notes: 'HMAC-SHA512 signature verification failed',
        });
        return Response.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    let ipn;
    try { ipn = JSON.parse(body); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

    const orderId = ipn.order_id;
    const paymentId = String(ipn.payment_id || ipn.id);
    const paymentStatus = ipn.payment_status; // waiting|confirming|confirmed|finished|failed|refunded
    const confirmations = ipn.confirmations_count || 0;

    console.log(`[NOWPayments] IPN: order=${orderId} status=${paymentStatus} confirmations=${confirmations}`);

    // Idempotency check
    const existing = await base44.asServiceRole.entities.PaymentLog.filter({ transaction_id: paymentId, processed: true });
    if (existing.length > 0) return Response.json({ received: true, duplicate: true });

    // Log the IPN
    await base44.asServiceRole.entities.PaymentLog.create({
      gateway: 'nowpayments', event_type: `payment.${paymentStatus}`,
      event_data: ipn, order_id: orderId, transaction_id: paymentId,
      status: ['finished', 'confirmed'].includes(paymentStatus) ? 'paid' : paymentStatus === 'failed' ? 'failed' : 'confirming',
      amount: parseFloat(ipn.price_amount || 0),
      currency: ipn.price_currency || 'USD',
      crypto_currency: ipn.pay_currency,
      confirmations, customer_email: ipn.customer_email,
      processed: ['finished', 'failed', 'refunded'].includes(paymentStatus),
    });

    // Find order
    if (!orderId) return Response.json({ received: true });
    const orders = await base44.asServiceRole.entities.Order.filter({ order_id: orderId });
    const order = orders[0];
    if (!order) { console.warn(`[NOWPayments] Order not found: ${orderId}`); return Response.json({ received: true }); }

    if (paymentStatus === 'waiting' || paymentStatus === 'confirming') {
      await base44.asServiceRole.entities.Order.update(order.id, {
        payment_status: 'confirming', transaction_id: paymentId,
      });
    } else if (paymentStatus === 'finished' || paymentStatus === 'confirmed') {
      // Verify amount matches (allow 1% tolerance for crypto volatility)
      const paidAmount = parseFloat(ipn.price_amount || 0);
      if (paidAmount > 0 && Math.abs(paidAmount - order.price) / order.price > 0.01) {
        console.warn(`[NOWPayments] Amount mismatch: expected ${order.price}, got ${paidAmount}`);
        await base44.asServiceRole.entities.Order.update(order.id, {
          payment_status: 'awaiting_confirmation',
          transaction_id: paymentId,
        });
        await base44.asServiceRole.entities.Notification.create({
          title: '⚠️ Payment Amount Mismatch',
          message: `Order ${orderId}: expected $${order.price}, received $${paidAmount}. Manual review required.`,
          type: 'system', priority: 'high', display_mode: 'popup', is_active: true, target: 'admin',
        });
        return Response.json({ received: true });
      }

      await base44.asServiceRole.entities.Order.update(order.id, {
        payment_status: 'confirmed', transaction_id: paymentId,
        payment_method: 'nowpayments',
      });
      await provisionAfterPayment(base44, order);

      await base44.asServiceRole.entities.Notification.create({
        title: '✅ NOWPayments Payment Confirmed',
        message: `Order ${orderId} paid. Challenge account provisioning initiated.`,
        type: 'payout', priority: 'high', display_mode: 'popup', is_active: true, target: 'challenge',
      });
    } else if (paymentStatus === 'failed' || paymentStatus === 'expired') {
      await base44.asServiceRole.entities.Order.update(order.id, { payment_status: 'failed' });
    } else if (paymentStatus === 'refunded') {
      await base44.asServiceRole.entities.Order.update(order.id, { payment_status: 'refunded' });
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('[NOWPayments] Webhook error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});