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

    // Payout reward commission — IDEMPOTENT: check by withdrawal_id
    if (w.account_id !== 'affiliate' && w.user_email) {
      const existingRewardComm = await sr.entities.AffiliateCommission.filter({
        withdrawal_id: w.id,
        commission_type: 'payout_reward',
      });

      if (existingRewardComm.length === 0) {
        const traderProfiles = await sr.entities.AffiliateProfile.filter({ user_email: w.user_email });
        const traderProfile = traderProfiles[0];
        if (traderProfile?.referred_by_email && affiliateReward > 0) {
          await sr.entities.AffiliateCommission.create({
            affiliate_email: traderProfile.referred_by_email,
            referred_email: w.user_email,
            commission_type: 'payout_reward',
            level: 1,
            source_amount: traderShare,
            commission_rate: parseFloat(((affiliateReward / traderShare) * 100).toFixed(2)),
            commission_amount: affiliateReward,
            withdrawal_id: w.id,
            account_id: w.account_id,
            status: 'approved',
            notes: `Payout reward from ${w.user_email} withdrawal approved by admin ${user.email}`,
          });
        }
      } else {
        console.log(`[adminApproveWithdrawal] Payout reward commission already exists for withdrawal ${w.id} — skipping duplicate`);
      }
    }

    // First payout certificate — IDEMPOTENT
    if (w.account_id !== 'affiliate' && w.user_email) {
      const existing = await sr.entities.Certificate.filter({ user_email: w.user_email, type: 'first_payout' });
      if (existing.length === 0) {
        await sr.entities.Certificate.create({
          certificate_id: `RF-CERT-${Date.now().toString(36).toUpperCase()}`,
          user_email: w.user_email,
          trader_name: w.user_email,
          type: 'first_payout',
          title: 'First Profit Payout',
          account_id: w.account_id,
          account_size: w.amount,
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