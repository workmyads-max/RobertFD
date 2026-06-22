/**
 * adminApproveWithdrawal — Backend-secured admin withdrawal processing
 *
 * Handles both APPROVE and REJECT actions.
 *
 * APPROVE:
 *   1. Admin role check
 *   2. Withdrawal not already approved/paid (duplicate protection)
 *   3. Recalculate with overrides (split %, fee)
 *   4. final_amount = trader_share - fee (NO affiliate deduction — the affiliate
 *      reward is a company-side expense handled by processPayoutRewardCommission)
 *   5. Send user notification (scoped to user_email, never null)
 *   6. First payout certificate (idempotent)
 *   7. Audit trail via StaffActivityLog
 *   8. Affiliate commission is delegated to the processPayoutRewardCommission
 *      entity automation (fires on status → "approved")
 *
 * REJECT:
 *   1. Set status to rejected
 *   2. Send user notification
 *   3. Audit trail
 *   4. NO affiliate commission
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json();
    const { withdrawal_id, action, override_split_pct, override_fee, admin_notes, rejection_reason } = body;

    if (!withdrawal_id) return Response.json({ error: 'withdrawal_id required' }, { status: 400 });

    const sr = base44.asServiceRole;

    // Fetch the withdrawal by internal entity id
    let w;
    try {
      w = await sr.entities.WithdrawalRequest.get(withdrawal_id);
    } catch {
      return Response.json({ error: 'Withdrawal not found' }, { status: 404 });
    }
    if (!w) return Response.json({ error: 'Withdrawal not found' }, { status: 404 });

    // Duplicate protection — cannot approve already approved/paid
    if (w.status === 'approved' || w.status === 'paid') {
      return Response.json({
        error: `Cannot process: withdrawal is already ${w.status}`,
      }, { status: 409 });
    }

    // ── REJECT ACTION ───────────────────────────────────────────────────────
    if (action === 'reject') {
      await sr.entities.WithdrawalRequest.update(w.id, {
        status: 'rejected',
        admin_notes: admin_notes || rejection_reason || w.admin_notes || '',
      });

      // Notify the user — scoped to their email, never null
      if (w.user_email) {
        await sr.entities.Notification.create({
          user_email: w.user_email,
          title: 'Withdrawal Request Update',
          message: `Your withdrawal request of $${(w.amount || 0).toLocaleString()} has been reviewed and was not approved. ${admin_notes || rejection_reason ? 'Reason: ' + (admin_notes || rejection_reason) : 'Please contact support if you have questions.'}`,
          type: 'system',
          priority: 'high',
          display_mode: 'popup',
          is_active: true,
          target: 'all',
        });
      }

      // Audit trail
      await sr.entities.StaffActivityLog.create({
        staff_email: user.email,
        staff_name: user.full_name || user.email,
        role_name: user.role,
        action: 'reject_withdrawal',
        action_category: 'payouts',
        target_entity: 'WithdrawalRequest',
        target_id: w.id,
        target_user_email: w.user_email,
        details: { withdrawal_id: w.id, amount: w.amount, reason: admin_notes || rejection_reason || '' },
        status: 'success',
      });

      return Response.json({ success: true, withdrawal_id: w.id, status: 'rejected' });
    }

    // ── APPROVE ACTION (default) ────────────────────────────────────────────

    // Recalculate with overrides or stored values
    const splitPct = override_split_pct ?? w.profit_split_pct ?? 80;
    const fee = override_fee ?? w.withdrawal_fee ?? 25;
    const gross = w.amount || 0;
    const traderShare = parseFloat((gross * (splitPct / 100)).toFixed(2));
    const companyShare = parseFloat((gross - traderShare).toFixed(2));
    // NO affiliate deduction from trader's payout — affiliate reward is a
    // company-side expense handled by processPayoutRewardCommission.
    const finalAmount = parseFloat(Math.max(0, traderShare - fee).toFixed(2));

    // Update withdrawal to approved
    await sr.entities.WithdrawalRequest.update(w.id, {
      status: 'approved',
      profit_split_pct: splitPct,
      trader_share: traderShare,
      company_share: companyShare,
      affiliate_reward: 0, // Set by processPayoutRewardCommission, not here
      withdrawal_fee: fee,
      final_amount: finalAmount,
      admin_notes: admin_notes || w.admin_notes || '',
    });

    // NOTE: The payout-reward affiliate commission is intentionally NOT handled
    // here. It is owned exclusively by the `processPayoutRewardCommission`
    // function, triggered by an entity automation whenever a WithdrawalRequest's
    // status becomes "approved". That keeps the payout-reward logic in a single,
    // idempotent place. Do not re-add commission creation here.

    // Notify the user — scoped to their email, never null
    if (w.user_email) {
      await sr.entities.Notification.create({
        user_email: w.user_email,
        title: '✅ Withdrawal Approved',
        message: `Your withdrawal request of $${(w.amount || 0).toLocaleString()} has been approved. You will receive $${finalAmount.toFixed(2)} via ${w.method?.replace('_', ' ').toUpperCase()}. Processing time: 1-3 business days.`,
        type: 'payout',
        priority: 'high',
        display_mode: 'popup',
        is_active: true,
        target: 'funded',
      });
    }

    // First payout certificate — IDEMPOTENT (one per user_email + type)
    if (w.account_id !== 'affiliate' && w.user_email) {
      const existing = await sr.entities.Certificate.filter({ user_email: w.user_email, type: 'first_payout' });
      if (existing.length === 0) {
        // Fetch trader full name + challenge_type from the account
        let traderName = w.user_email;
        let challengeType = '';
        try {
          const accs = await sr.entities.ChallengeAccount.filter({ account_id: w.account_id });
          if (accs[0]) challengeType = accs[0].challenge_type || '';
        } catch { /* keep defaults */ }
        try {
          const users = await sr.entities.User.filter({ email: w.user_email });
          if (users[0]?.full_name) traderName = users[0].full_name;
        } catch { /* keep email fallback */ }
        await sr.entities.Certificate.create({
          certificate_id: `XFT-CERT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
          user_email: w.user_email,
          trader_name: traderName,
          type: 'first_payout',
          title: 'First Withdrawal',
          account_id: w.account_id,
          account_size: w.amount,
          challenge_type: challengeType,
          issue_date: new Date().toISOString().split('T')[0],
          is_verified: true,
        });
      }
    }

    // Audit trail
    await sr.entities.StaffActivityLog.create({
      staff_email: user.email,
      staff_name: user.full_name || user.email,
      role_name: user.role,
      action: 'approve_withdrawal',
      action_category: 'payouts',
      target_entity: 'WithdrawalRequest',
      target_id: w.id,
      target_user_email: w.user_email,
      details: { withdrawal_id: w.id, gross, final_amount: finalAmount, split_pct: splitPct, fee },
      status: 'success',
    });

    return Response.json({
      success: true,
      withdrawal_id: w.id,
      status: 'approved',
      final_amount: finalAmount,
      breakdown: { gross, traderShare, companyShare, fee, finalAmount },
    });
  } catch (error) {
    console.error('adminApproveWithdrawal error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});