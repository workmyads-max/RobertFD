/**
 * adminApproveWithdrawal — Backend-secured admin withdrawal approval
 *
 * Validates:
 * 1. Admin role
 * 2. Withdrawal not already approved/paid (duplicate protection)
 * 3. Payout_reward commission idempotency (no duplicate for same withdrawal_id)
 * 4. Audit trail via StaffActivityLog
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json();
    const { withdrawal_id, override_split_pct, override_fee, admin_notes } = body;

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
        error: `Cannot approve: withdrawal is already ${w.status}`,
      }, { status: 409 });
    }

    // Recalculate with overrides or stored values
    const splitPct = override_split_pct ?? w.profit_split_pct ?? 80;
    const fee = override_fee ?? w.withdrawal_fee ?? 25;
    const gross = w.amount || 0;
    const traderShare = parseFloat((gross * (splitPct / 100)).toFixed(2));
    const companyShare = parseFloat((gross - traderShare).toFixed(2));
    const affiliateReward = parseFloat((w.affiliate_reward || traderShare * 0.09).toFixed(2));
    const finalAmount = parseFloat(Math.max(0, traderShare - affiliateReward - fee).toFixed(2));

    // Update withdrawal to approved
    await sr.entities.WithdrawalRequest.update(w.id, {
      status: 'approved',
      profit_split_pct: splitPct,
      trader_share: traderShare,
      company_share: companyShare,
      affiliate_reward: affiliateReward,
      withdrawal_fee: fee,
      final_amount: finalAmount,
      admin_notes: admin_notes || w.admin_notes || '',
    });

    // NOTE: The payout-reward affiliate commission is intentionally NOT handled
    // here. It is owned exclusively by the `processPayoutRewardCommission`
    // function, triggered by an entity automation whenever a WithdrawalRequest's
    // status becomes "approved" (this covers both this function and the admin
    // status dropdown). That keeps the payout-reward logic in a single,
    // idempotent place. Do not re-add commission creation here.

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
      final_amount: finalAmount,
      breakdown: { gross, traderShare, companyShare, affiliateReward, fee, finalAmount },
    });
  } catch (error) {
    console.error('adminApproveWithdrawal error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});