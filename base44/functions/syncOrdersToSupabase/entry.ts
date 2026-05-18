import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { createClient } from 'npm:@supabase/supabase-js@2.106.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return Response.json({ error: 'Supabase not configured' }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get all orders from Base44
    const orders = await base44.asServiceRole.entities.Order.list();
    
    console.log(`Found ${orders.length} orders to sync`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Sync each order to Supabase
    for (const order of orders) {
      try {
        // Check if order already exists in Supabase
        const { data: existing } = await supabase
          .from('orders')
          .select('id')
          .eq('order_id', order.order_id)
          .single();
        
        if (existing) {
          console.log(`Order ${order.order_id} already exists in Supabase, skipping...`);
          continue;
        }
        
        // Insert order into Supabase
        const { error } = await supabase.from('orders').insert({
          order_id: order.order_id,
          user_email: order.email,
          challenge_type: order.challenge_type,
          account_type: order.account_type || 'standard',
          account_size: order.account_size,
          platform: order.platform || 'xtrading',
          leverage: order.leverage || '1:100',
          price: order.price,
          payment_method: order.payment_method || 'manual',
          payment_gateway: order.payment_gateway || 'manual',
          payment_address: order.payment_address,
          payment_status: order.payment_status || 'pending',
          full_name: order.full_name,
          username: order.username,
          email: order.email,
          phone: order.phone,
          country: order.country,
          city: order.city,
          address: order.address,
          postal_code: order.postal_code,
          transaction_id: order.transaction_id,
          account_id: order.account_id,
          coupon_code: order.coupon_code,
          discount_amount: order.discount_amount || 0,
          affiliate_code: order.affiliate_code,
          created_at: order.created_date,
          updated_at: order.updated_date,
        });
        
        if (error) {
          console.error(`Failed to sync order ${order.order_id}:`, error);
          errorCount++;
        } else {
          console.log(`Successfully synced order ${order.order_id}`);
          successCount++;
        }
      } catch (err) {
        console.error(`Error processing order ${order.order_id}:`, err);
        errorCount++;
      }
    }
    
    return Response.json({
      success: true,
      message: `Synced ${successCount} orders, ${errorCount} errors`,
      synced: successCount,
      errors: errorCount,
      total: orders.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});