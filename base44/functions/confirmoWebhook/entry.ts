import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

async function verifyConfirmoSignature(body, signature, secret) {
  if (!signature || !secret) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const rawSig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const expected = Array.from(new Uint8Array(rawSig)).map(b => b.toString(16).padStart(2, '0')).join('');
  return expected === signature;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const body = await req.text();
    const signature = req.headers.get('X-Confirmo-Signature') || req.headers.get('x-confirmo-signature');

    // Verify Confirmo signature if webhook secret is configured
    const gateways = await base44.asServiceRole.entities.PaymentGateway.filter({ provider: 'confirmo', is_active: true });
    const webhookSecret = gateways[0]?.webhook_secret;
    if (webhookSecret) {
      const isValid = await verifyConfirmoSignature(body, signature, webhookSecret);
      if (!isValid) {
        console.error('[SECURITY] Invalid Confirmo signature');
        await base44.asServiceRole.entities.PaymentLog.create({
          gateway: 'confirmo', event_type: 'signature_failure',
          event_data: { signature, body_preview: body.slice(0, 200) }, status: 'failed',
          notes: 'HMAC signature verification failed',
        });
        return Response.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    let event;
    try { event = JSON.parse(body); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

    // Idempotency
    const existing = await base44.asServiceRole.entities.PaymentLog.filter({ transaction_id: event.invoice_id, processed: true });
    if (existing.length > 0) return Response.json({ received: true, duplicate: true });

    // Log webhook event
    await base44.asServiceRole.entities.PaymentLog.create({
      gateway: 'confirmo',
      event_type: event.event,
      event_data: event,
      order_id: event.order_id,
      status: event.status,
    });

    const order = await base44.asServiceRole.entities.Order.filter({ 
      order_id: event.order_id 
    }).then(orders => orders[0]);

    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    // Handle different statuses
    if (event.event === 'invoice.payment_pending') {
      await base44.asServiceRole.entities.Order.update(order.id, {
        payment_status: 'pending',
        transaction_id: event.invoice_id,
      });
    } else if (event.event === 'invoice.payment_confirming') {
      await base44.asServiceRole.entities.Order.update(order.id, {
        payment_status: 'confirming',
      });
    } else if (event.event === 'invoice.paid') {
      await base44.asServiceRole.entities.Order.update(order.id, {
        payment_status: 'confirmed',
        transaction_id: event.invoice_id,
        payment_method: 'confirmo_crypto',
      });

      // Trigger account provisioning
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
      } catch (e) {
        console.error('Provisioning failed:', e);
      }

      // Send confirmation email
      await base44.functions.invoke('sendBrandedEmail', {
        to: order.email,
        template_type: 'payment_success',
        data: {
          name: order.full_name,
          amount: order.price,
          order_id: order.order_id,
          challenge_type: order.challenge_type,
          account_size: order.account_size,
        },
      });
    } else if (event.event === 'invoice.expired' || event.event === 'invoice.cancelled') {
      await base44.asServiceRole.entities.Order.update(order.id, {
        payment_status: 'expired',
      });
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Confirmo webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});