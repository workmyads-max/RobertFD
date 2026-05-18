import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, currency, order_id, email } = await req.json();
    
    // Get Checkout.com config
    const gateways = await base44.asServiceRole.entities.PaymentGateway.filter({ 
      provider: 'checkout_com',
      is_active: true 
    });
    
    if (!gateways || gateways.length === 0) {
      return Response.json({ error: 'Checkout.com not configured' }, { status: 500 });
    }

    const gateway = gateways[0];
    const secretKey = gateway.secret_key;

    // Create Checkout.com payment session
    const response = await fetch('https://api.checkout.com/payment/sessions', {
      method: 'POST',
      headers: {
        'Authorization': secretKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency || 'USD',
        reference: order_id,
        customer: {
          email: email,
        },
        success_url: `${Deno.env.get('BASE44_APP_URL')}/checkout/success?order_id=${order_id}`,
        failure_url: `${Deno.env.get('BASE44_APP_URL')}/checkout/failure?order_id=${order_id}`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create payment session');
    }

    return Response.json({ 
      success: true, 
      session_id: data.id,
      redirect_url: data.redirect_url || `https://checkout.com/pay/${data.id}`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});