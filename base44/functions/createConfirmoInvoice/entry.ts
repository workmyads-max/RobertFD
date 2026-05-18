import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, currency, order_id, email, crypto_currency } = await req.json();
    
    // Get Confirmo config
    const gateways = await base44.asServiceRole.entities.PaymentGateway.filter({ 
      provider: 'confirmo',
      is_active: true 
    });
    
    if (!gateways || gateways.length === 0) {
      return Response.json({ error: 'Confirmo not configured' }, { status: 500 });
    }

    const gateway = gateways[0];
    const apiKey = gateway.api_key;
    const baseUrl = 'https://api.confirmo.com';

    // Create Confirmo invoice
    const response = await fetch(`${baseUrl}/api/v1/invoices`, {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount.toString(),
        currency: currency || 'USD',
        order_id: order_id,
        customer_email: email,
        cryptocurrencies: crypto_currency ? [crypto_currency] : ['BTC', 'ETH', 'USDT'],
        callback_url: `${Deno.env.get('BASE44_APP_URL')}/functions/confirmoWebhook`,
        success_url: `${Deno.env.get('BASE44_APP_URL')}/checkout/success?order_id=${order_id}`,
        cancel_url: `${Deno.env.get('BASE44_APP_URL')}/checkout/failure?order_id=${order_id}`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create invoice');
    }

    return Response.json({ 
      success: true, 
      invoice_id: data.id,
      invoice_url: data.url,
      qr_code: data.qr_code,
      addresses: data.addresses, // Contains crypto addresses
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});