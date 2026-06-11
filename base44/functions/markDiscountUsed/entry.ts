/**
 * markDiscountUsed - Mark first-time discount as used when order is placed
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { order_id } = body;

    if (!order_id) {
      return Response.json({ error: 'Order ID required' }, { status: 400 });
    }

    // Find user's discount record
    const discounts = await base44.asServiceRole.entities.FirstTimeDiscount.filter({ user_email: user.email });
    
    if (discounts.length === 0) {
      return Response.json({ error: 'No discount record found' }, { status: 404 });
    }

    const discount = discounts[0];
    
    if (discount.is_used) {
      return Response.json({ error: 'Discount already used', order_id: discount.order_id }, { status: 400 });
    }

    // Mark as used
    await base44.asServiceRole.entities.FirstTimeDiscount.update(discount.id, {
      is_used: true,
      used_at: new Date().toISOString(),
      order_id: order_id,
    });

    return Response.json({ 
      success: true, 
      message: 'Discount marked as used',
      discount_code: discount.discount_code,
      discount_percent: discount.discount_percent,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});