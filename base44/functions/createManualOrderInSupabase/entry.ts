import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { createClient } from 'npm:@supabase/supabase-js@2.106.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Allow service role or authenticated users
    const user = await base44.auth.me().catch(() => null);
    const { order_id, email, orderData } = await req.json();
    
    // Require either authenticated user OR valid order data
    if (!order_id || !orderData || !email) {
      return Response.json({ error: 'Missing required fields: order_id, orderData, and email' }, { status: 400 });
    }
    
    // Create order in Base44 using service role (works for both guest and logged-in users)
    try {
      const base44Order = await base44.asServiceRole.entities.Order.create({
        order_id: order_id,
        challenge_type: orderData.challenge_type || 'two-step',
        account_type: orderData.account_type || 'standard',
        account_size: orderData.account_size || 0,
        platform: orderData.platform || 'xtrading',
        leverage: orderData.leverage || '1:100',
        price: orderData.price || 0,
        payment_method: orderData.payment_method || 'manual',
        payment_gateway: orderData.payment_gateway || 'manual',
        payment_address: orderData.payment_address || '',
        payment_status: ['usdt_trc20', 'bitcoin'].includes(orderData.payment_method) ? 'awaiting_confirmation' : 'pending',
        full_name: orderData.full_name || '',
        username: orderData.username || '',
        email: email,
        phone: orderData.phone || '',
        country: orderData.country || '',
        city: orderData.city || '',
        address: orderData.address || '',
        postal_code: orderData.postal_code || '',
        coupon_code: orderData.coupon_code || '',
        discount_amount: orderData.discount_amount || 0,
        affiliate_code: orderData.affiliate_code || '',
        rule_snapshot: orderData.rule_snapshot || null,
      });
      console.log('Base44 order created:', base44Order.order_id);
    } catch (e) {
      console.error('Failed to create Base44 order:', e.message);
      // Continue anyway - Supabase is the primary store
    }
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return Response.json({ error: 'Supabase not configured' }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // First, create or update user profile
    if (email) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        email,
        full_name: orderData.full_name || '',
        phone: orderData.phone || '',
        country: orderData.country || '',
        city: orderData.city || '',
        address: orderData.address || '',
        postal_code: orderData.postal_code || '',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' });
      
      if (profileError) {
        console.error('Failed to create/update profile:', profileError);
      }
    }
    
    // Create order in Supabase
    const { error: orderError } = await supabase.from('orders').insert({
      order_id,
      user_email: email,
      challenge_type: orderData.challenge_type || 'two-step',
      account_type: orderData.account_type || 'standard',
      account_size: orderData.account_size || 0,
      platform: orderData.platform || 'xtrading',
      leverage: orderData.leverage || '1:100',
      price: orderData.price || 0,
      payment_method: orderData.payment_method || 'manual',
      payment_gateway: orderData.payment_gateway || 'manual',
      payment_address: orderData.payment_address || '',
      payment_status: ['usdt_trc20', 'bitcoin'].includes(orderData.payment_method)
        ? 'awaiting_confirmation'
        : (orderData.payment_status || 'pending'),
      full_name: orderData.full_name || '',
      username: orderData.username || '',
      email: email,
      phone: orderData.phone || '',
      country: orderData.country || '',
      city: orderData.city || '',
      address: orderData.address || '',
      postal_code: orderData.postal_code || '',
      coupon_code: orderData.coupon_code || '',
      discount_amount: orderData.discount_amount || 0,
      affiliate_code: orderData.affiliate_code || '',
      rule_snapshot: orderData.rule_snapshot || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    
    if (orderError) {
      console.error('Failed to create order in Supabase:', orderError);
      return Response.json({ error: orderError.message, details: orderError }, { status: 500 });
    }
    
    console.log(`Order ${order_id} created in Supabase for user ${email}`);
    
    return Response.json({ 
      success: true, 
      message: 'Order synced to Supabase'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});