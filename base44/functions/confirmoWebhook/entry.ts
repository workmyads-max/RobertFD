import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const body = await req.text();
    const event = JSON.parse(body);

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