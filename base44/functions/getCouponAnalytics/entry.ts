import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

/**
 * getCouponAnalytics - Admin-only.
 * Returns per-coupon performance: total sales, discount given, unique users,
 * order count, and a per-user breakdown (email, orders, total spent).
 * Data is derived from the Order entity (service role) merged with Coupon definitions.
 */
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    // Fetch all orders + coupons (service role bypasses RLS)
    const allOrders = await base44.asServiceRole.entities.Order.list('-created_date', 5000);
    const allCoupons = await base44.asServiceRole.entities.Coupon.list('-created_date', 500);

    // Group orders by coupon_code
    const orderMap = {};
    allOrders.forEach(o => {
      if (!o.coupon_code) return;
      const code = String(o.coupon_code).toUpperCase().trim();
      if (!orderMap[code]) orderMap[code] = { uses: 0, total_sales: 0, total_discount: 0, users: {}, orders: [] };
      const entry = orderMap[code];
      entry.uses++;
      entry.total_sales += Number(o.price) || 0;
      entry.total_discount += Number(o.discount_amount) || 0;
      const email = String(o.email || '').toLowerCase().trim();
      if (email) {
        if (!entry.users[email]) entry.users[email] = { email, count: 0, total_spent: 0, last_order: o.created_date };
        entry.users[email].count++;
        entry.users[email].total_spent += Number(o.price) || 0;
        if (o.created_date && (!entry.users[email].last_order || new Date(o.created_date) > new Date(entry.users[email].last_order))) {
          entry.users[email].last_order = o.created_date;
        }
      }
      entry.orders.push({
        email: o.email,
        order_id: o.order_id,
        price: Number(o.price) || 0,
        discount_amount: Number(o.discount_amount) || 0,
        payment_status: o.payment_status,
        created_date: o.created_date,
      });
    });

    const seen = new Set();
    const analytics = [];

    // Merge coupon definitions with order data
    allCoupons.forEach(c => {
      const code = String(c.code).toUpperCase().trim();
      seen.add(code);
      const data = orderMap[code] || { uses: 0, total_sales: 0, total_discount: 0, users: {}, orders: [] };
      analytics.push({
        code,
        name: c.name || c.code,
        discount_type: c.discount_type,
        discount_value: c.discount_value,
        is_active: c.is_active,
        is_public: c.is_public !== false,
        expires_at: c.expires_at,
        max_uses: c.max_uses || 0,
        stored_uses_count: c.uses_count || 0,
        order_uses: data.uses,
        total_sales: data.total_sales,
        total_discount: data.total_discount,
        unique_users: Object.keys(data.users).length,
        users: Object.values(data.users).sort((a, b) => b.total_spent - a.total_spent),
      });
    });

    // Add codes from orders that have no Coupon record (e.g. NEW25 first-time discount)
    Object.keys(orderMap).forEach(code => {
      if (seen.has(code)) return;
      const data = orderMap[code];
      analytics.push({
        code,
        name: code === 'NEW25' ? 'First-Time Discount' : code,
        discount_type: 'percentage',
        discount_value: code === 'NEW25' ? 10 : 0,
        is_active: true,
        is_public: code === 'NEW25',
        expires_at: null,
        max_uses: 0,
        stored_uses_count: 0,
        order_uses: data.uses,
        total_sales: data.total_sales,
        total_discount: data.total_discount,
        unique_users: Object.keys(data.users).length,
        users: Object.values(data.users).sort((a, b) => b.total_spent - a.total_spent),
      });
    });

    analytics.sort((a, b) => b.total_sales - a.total_sales);

    return Response.json({ success: true, analytics });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}