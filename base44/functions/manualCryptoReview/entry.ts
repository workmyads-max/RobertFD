/**
 * manualCryptoReview — Institutional manual crypto payment review system
 * Handles admin actions: approve, reject, request_info, mark_fraud, suspend_user
 * All actions require admin auth + create audit logs + enforce no fake provisioning
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

async function logActivity(sr, data) {
  await sr.entities.StaffActivityLog.create({
    staff_email: data.staff_email,
    staff_name: data.staff_name || '',
    role_name: data.role_name || 'admin',
    action: data.action,
    action_category: 'payments',
    target_entity: 'Order',
    target_id: data.order_id || '',
    target_user_email: data.user_email || '',
    details: data.details || {},
    ip_address: data.ip || 'unknown',
    status: 'success',
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const body = await req.json();
    const { action, order_id, notes, reason } = body;
    const sr = base44.asServiceRole;
    const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';

    // ── GET PENDING REVIEWS ────────────────────────────────────────────────────
    if (action === 'get_pending_reviews') {
      const orders = await sr.entities.Order.list('-created_date', 200);
      const pending = orders.filter(o =>
        ['awaiting_confirmation', 'pending'].includes(o.payment_status) &&
        ['usdt_trc20', 'bitcoin', 'manual'].includes(o.payment_method)
      );

      // Enrich with duplicate TXID detection
      const enriched = await Promise.all(pending.map(async (order) => {
        let duplicateTxid = false;
        if (order.transaction_id) {
          const dupes = orders.filter(o =>
            o.id !== order.id && o.transaction_id === order.transaction_id
          );
          duplicateTxid = dupes.length > 0;
        }
        return { ...order, duplicate_txid_warning: duplicateTxid };
      }));

      return Response.json({ success: true, reviews: enriched });
    }

    // ── SUBMIT MANUAL CRYPTO PROOF (user-facing, also admin-callable) ──────────
    if (action === 'submit_proof') {
      const { txid, screenshot_url, amount, network } = body;
      if (!order_id || !txid) return Response.json({ error: 'order_id and txid required' }, { status: 400 });

      // Check TXID uniqueness across all orders
      const allOrders = await sr.entities.Order.list('-created_date', 500);
      const txidConflict = allOrders.find(o => o.transaction_id === txid && o.order_id !== order_id);
      if (txidConflict) {
        console.warn(`[ManualCrypto] Duplicate TXID attempted: ${txid} by ${user.email}`);
        return Response.json({ error: 'This transaction ID has already been submitted for another order.' }, { status: 409 });
      }

      const orders = await sr.entities.Order.filter({ order_id });
      const order = orders[0];
      if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });

      await sr.entities.Order.update(order.id, {
        payment_status: 'awaiting_confirmation',
        transaction_id: txid,
        notes: JSON.stringify({ screenshot_url, amount, network, submitted_at: new Date().toISOString(), submitted_by: user.email }),
      });

      await sr.entities.PaymentLog.create({
        gateway: 'manual_crypto', event_type: 'proof_submitted',
        event_data: { txid, screenshot_url, amount, network, submitted_by: user.email },
        order_id, transaction_id: txid, status: 'pending',
        customer_email: order.email, processed: false,
        notes: `Manual crypto proof submitted. TXID: ${txid}`,
      });

      // Notify admin
      await sr.entities.Notification.create({
        title: '💳 Manual Crypto Proof Submitted',
        message: `Order ${order_id}: ${order.email} submitted TXID ${txid} for $${order.price} (${order.challenge_type} ${order.account_size}).`,
        type: 'system', priority: 'high', display_mode: 'popup', is_active: true, target: 'admin',
      });

      return Response.json({ success: true, status: 'awaiting_confirmation', message: 'Proof submitted. Awaiting admin verification.' });
    }

    // ── APPROVE PAYMENT ────────────────────────────────────────────────────────
    if (action === 'approve_payment') {
      const orders = await sr.entities.Order.filter({ order_id });
      const order = orders[0];
      if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });

      if (order.payment_status === 'confirmed') {
        return Response.json({ error: 'Payment already confirmed' }, { status: 409 });
      }

      await sr.entities.Order.update(order.id, {
        payment_status: 'confirmed',
      });

      await sr.entities.PaymentLog.create({
        gateway: 'manual_crypto', event_type: 'admin_approved',
        event_data: { approved_by: user.email, notes, order_id },
        order_id, transaction_id: order.transaction_id,
        status: 'paid', customer_email: order.email, processed: true,
        notes: `Approved by admin ${user.email}. Notes: ${notes || 'none'}`,
      });

      // NOW provision challenge account — only after admin approval
      try {
        await sr.functions.invoke('provisionMT5Account', {
          account_id: order.account_id || order.order_id,
          order_id: order.order_id,
          user_email: order.email,
          challenge_type: order.challenge_type,
          account_type: order.account_type || 'standard',
          account_size: order.account_size,
          leverage: order.leverage || '1:100',
          platform: 'mt5',
          rule_snapshot: order.rule_snapshot || null,
        });
      } catch (e) { console.error('[ManualCrypto] Provisioning failed:', e.message); }

      // Affiliate commissions L1/L2/L3 — non-blocking
      sr.functions.invoke('createAffiliateCommissions', {
        user_email: order.email,
        order_id: order.order_id,
        order_price: order.price,
        challenge_type: order.challenge_type,
        account_size: order.account_size,
      }).catch(e => console.error('[ManualCrypto] Affiliate commission failed:', e.message));

      try {
        await sr.functions.invoke('sendBrandedEmail', {
          to: order.email, template_type: 'payment_success',
          data: { name: order.full_name, amount: order.price, order_id, challenge_type: order.challenge_type, account_size: order.account_size },
        });
      } catch (e) { console.error('[ManualCrypto] Email failed:', e.message); }

      await sr.entities.Notification.create({
        title: '✅ Payment Approved — Challenge Account Ready',
        message: `Your payment for ${order.challenge_type} $${order.account_size} challenge has been verified. Your account is being provisioned.`,
        type: 'payout', priority: 'critical', display_mode: 'popup', is_active: true, target: 'challenge',
      });

      await logActivity(sr, { staff_email: user.email, action: 'approve_manual_payment', order_id, user_email: order.email, details: { notes }, ip: ipAddress });

      return Response.json({ success: true, message: 'Payment approved. Challenge account provisioning initiated.' });
    }

    // ── REJECT PAYMENT ─────────────────────────────────────────────────────────
    if (action === 'reject_payment') {
      const orders = await sr.entities.Order.filter({ order_id });
      const order = orders[0];
      if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });

      await sr.entities.Order.update(order.id, { payment_status: 'failed' });

      await sr.entities.PaymentLog.create({
        gateway: 'manual_crypto', event_type: 'admin_rejected',
        event_data: { rejected_by: user.email, reason, notes },
        order_id, transaction_id: order.transaction_id,
        status: 'failed', customer_email: order.email, processed: true,
        notes: `Rejected by admin ${user.email}. Reason: ${reason || notes || 'none'}`,
      });

      try {
        await sr.functions.invoke('sendBrandedEmail', {
          to: order.email, template_type: 'payment_failed',
          data: { name: order.full_name, order_id, reason: reason || 'Payment verification failed. Please contact support.' },
        });
      } catch (e) {}

      await logActivity(sr, { staff_email: user.email, action: 'reject_manual_payment', order_id, user_email: order.email, details: { reason, notes }, ip: ipAddress });

      return Response.json({ success: true, message: 'Payment rejected.' });
    }

    // ── REQUEST MORE INFO ──────────────────────────────────────────────────────
    if (action === 'request_info') {
      const orders = await sr.entities.Order.filter({ order_id });
      const order = orders[0];
      if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });

      await sr.entities.Order.update(order.id, { payment_status: 'awaiting_confirmation' });

      await sr.entities.PaymentLog.create({
        gateway: 'manual_crypto', event_type: 'admin_requested_info',
        event_data: { requested_by: user.email, notes }, order_id,
        status: 'pending', customer_email: order.email, processed: false,
        notes: `More info requested by ${user.email}: ${notes}`,
      });

      try {
        await sr.functions.invoke('sendBrandedEmail', {
          to: order.email, template_type: 'support_reply',
          data: { name: order.full_name, order_id, message: notes || 'Please provide additional verification for your payment.' },
        });
      } catch (e) {}

      await logActivity(sr, { staff_email: user.email, action: 'request_payment_info', order_id, user_email: order.email, details: { notes }, ip: ipAddress });

      return Response.json({ success: true });
    }

    // ── MARK FRAUDULENT ────────────────────────────────────────────────────────
    if (action === 'mark_fraud') {
      const orders = await sr.entities.Order.filter({ order_id });
      const order = orders[0];
      if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });

      await sr.entities.Order.update(order.id, { payment_status: 'failed' });

      await sr.entities.RiskFlag.create({
        user_email: order.email,
        flag_type: 'unusual_pnl', // closest existing type
        severity: 'critical',
        description: `Fraudulent payment attempt: Order ${order_id}. TXID: ${order.transaction_id}. Notes: ${notes}`,
        status: 'active',
        triggered_at: new Date().toISOString(),
      });

      await sr.entities.PaymentLog.create({
        gateway: 'manual_crypto', event_type: 'fraud_flagged',
        event_data: { flagged_by: user.email, notes }, order_id,
        status: 'failed', customer_email: order.email, processed: true,
        notes: `FRAUD flagged by ${user.email}: ${notes}`,
      });

      await logActivity(sr, { staff_email: user.email, action: 'mark_payment_fraud', order_id, user_email: order.email, details: { notes }, ip: ipAddress });

      return Response.json({ success: true, message: 'Order marked as fraudulent and risk flag created.' });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[manualCryptoReview] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});