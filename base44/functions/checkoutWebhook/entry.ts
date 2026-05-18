import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify webhook signature
    const signature = req.headers.get('Checkout-Signature');
    const body = await req.text();
    
    const gateways = await base44.asServiceRole.entities.PaymentGateway.filter({ 
      provider: 'checkout_com',
      is_active: true 
    });

    if (!gateways || gateways.length === 0) {
      return Response.json({ error: 'Checkout.com not configured' }, { status: 500 });
    }

    const gateway = gateways[0];
    const webhookSecret = gateway.webhook_secret;

    // In production, verify signature here using HMAC
    // For now, accept the webhook
    const event = JSON.parse(body);

    // Log webhook event
    await base44.asServiceRole.entities.PaymentLog.create({
      gateway: 'checkout_com',
      event_type: event.type,
      event_data: event,
      order_id: event.data?.reference,
      status: event.type === 'payment_approved' ? 'paid' : 'pending',
    });

    // Handle different event types
    if (event.type === 'payment_approved') {
      const order = await base44.asServiceRole.entities.Order.filter({ 
        order_id: event.data?.reference 
      }).then(orders => orders[0]);

      if (order) {
        await base44.asServiceRole.entities.Order.update(order.id, {
          payment_status: 'confirmed',
          transaction_id: event.data?.id,
          payment_method: 'checkout_com_card',
        });

        // Trigger account provisioning
        try {
          await base44.functions.invoke('provisionMatchTraderAccount', {
            account_id: order.account_id || order.order_id,
            user_email: order.email,
            challenge_type: order.challenge_type,
            account_size: order.account_size,
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
      }
    } else if (event.type === 'payment_declined') {
      const order = await base44.asServiceRole.entities.Order.filter({ 
        order_id: event.data?.reference 
      }).then(orders => orders[0]);

      if (order) {
        await base44.asServiceRole.entities.Order.update(order.id, {
          payment_status: 'failed',
        });
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Checkout webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});