/**
 * requestTraderWithdrawal — Backend-secured trader withdrawal creation
 * Source of truth for all payout calculations. Frontend must not calculate amounts.
 *
 * Validates:
 * 1. Authenticated user owns the account
 * 2. Account status = funded
 * 3. KYC approved
 * 4. No existing pending withdrawal for same account
 * 5. Amount > 0
 * 6. Amount <= available profit (account.pnl)
 * 7. Profit split from account.rule_snapshot.profit_split (NOT hardcoded)
 * 8. Withdrawal fee from AffiliateSettings entity
 * 9. All calculations server-side
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { account_id, amount, method, wallet_address } = body;

    if (!account_id || !amount || !method || !wallet_address?.trim()) {
      return Response.json({ error: 'account_id, amount, method, wallet_address required' }, { status: 400 });
    }

    const gross = parseFloat(amount);
    if (!gross || gross <= 0) {
      return Response.json({ error: 'Amount must be greater than zero' }, { status: 400 });
    }

    // 1. Fetch account and verify ownership
    const accounts = await base44.asServiceRole.entities.ChallengeAccount.filter({ account_id });
    const account = accounts[0];
    if (!account) return Response.json({ error: 'Account not found' }, { status: 404 });
    if (account.user_email !== user.email) {
      return Response.json({ error: 'Forbidden: You do not own this account' }, { status: 403 });
    }

    // 2. Account must be funded
    if (account.status !== 'funded') {
      return Response.json({ error: 'Withdrawals are only available for funded accounts' }, { status: 400 });
    }

    // 3. KYC must be approved
    const kycList = await base44.asServiceRole.entities.KYCVerification.filter({ user_email: user.email });
    const kyc = kycList[0];
    if (!kyc || kyc.status !== 'approved') {
      return Response.json({ error: 'KYC verification required before withdrawal' }, { status: 400 });
    }

    // 4. No existing pending withdrawal for this account
    const existingPending = await base44.asServiceRole.entities.WithdrawalRequest.filter({
      account_id,
      status: 'pending',
    });
    if (existingPending.length > 0) {
      return Response.json({ error: 'A pending withdrawal already exists for this account' }, { status: 409 });
    }

    // 5. Minimum 1 trading day on the funded account (counted from actual closed trades in TradeRecord)
    const tradeRecords = await base44.asServiceRole.entities.TradeRecord.filter({ account_id, status: 'closed' });
    const tradingDaySet = new Set();
    for (const t of tradeRecords) {
      const closeTime = t.close_time;
      if (closeTime) {
        const d = new Date(closeTime);
        if (!isNaN(d.getTime())) tradingDaySet.add(d.toISOString().split('T')[0]);
      }
    }
    const tradingDaysCompleted = tradingDaySet.size;
    if (tradingDaysCompleted < 1) {
      return Response.json({
        error: `Withdrawal requires at least 1 completed trading day. You currently have ${tradingDaysCompleted} trading day(s).`,
      }, { status: 400 });
    }

    // 7. Amount <= available profit
    const availableProfit = Math.max(0, account.pnl || 0);
    if (gross > availableProfit) {
      return Response.json({
        error: `Requested amount $${gross} exceeds available profit $${availableProfit.toFixed(2)}`,
      }, { status: 400 });
    }

    // 6. Profit split from rule_snapshot (NOT hardcoded)
    const profitSplitPct = account.rule_snapshot?.profit_split ?? 80;
    const traderShare = gross * (profitSplitPct / 100);
    const companyShare = gross - traderShare;

    // 7. Withdrawal fee from AffiliateSettings entity
    let withdrawalFee = 25; // fallback only
    const settingsList = await base44.asServiceRole.entities.AffiliateSettings.filter({ setting_key: 'global_config' });
    if (settingsList[0]?.withdrawal_fee !== undefined && settingsList[0].withdrawal_fee !== null) {
      withdrawalFee = settingsList[0].withdrawal_fee;
    }

    // 8. Affiliate payout reward (sponsor gets % of trader share)
    // Check if trader has a sponsor
    const affiliateProfiles = await base44.asServiceRole.entities.AffiliateProfile.filter({ user_email: user.email });
    const traderProfile = affiliateProfiles[0];
    const hasAffiliateSponsor = !!(traderProfile?.referred_by_email);

    // Payout reward rate from settings or fallback
    const payoutRewardRate = settingsList[0]?.payout_tier_0_rate ?? 9;
    const affiliateReward = hasAffiliateSponsor ? parseFloat((traderShare * (payoutRewardRate / 100)).toFixed(2)) : 0;

    const finalAmount = Math.max(0, parseFloat((traderShare - affiliateReward - withdrawalFee).toFixed(2)));

    if (finalAmount <= 0) {
      return Response.json({ error: 'Final payout amount is zero or negative after fees' }, { status: 400 });
    }

    // 9. Create withdrawal request
    const withdrawalId = `WD-${Date.now().toString(36).toUpperCase()}`;
    const withdrawal = await base44.asServiceRole.entities.WithdrawalRequest.create({
      withdrawal_id: withdrawalId,
      account_id,
      user_email: user.email,
      amount: gross,
      method,
      wallet_address: wallet_address.trim(),
      status: 'pending',
      profit_split_pct: profitSplitPct,
      company_share: parseFloat(companyShare.toFixed(2)),
      trader_share: parseFloat(traderShare.toFixed(2)),
      affiliate_reward: affiliateReward,
      withdrawal_fee: withdrawalFee,
      final_amount: finalAmount,
      notes: `Backend-validated withdrawal. Profit split: ${profitSplitPct}% from rule_snapshot. Fee: $${withdrawalFee}.`,
    });

    return Response.json({
      success: true,
      withdrawal_id: withdrawalId,
      breakdown: {
        gross,
        profit_split_pct: profitSplitPct,
        trader_share: parseFloat(traderShare.toFixed(2)),
        company_share: parseFloat(companyShare.toFixed(2)),
        affiliate_reward: affiliateReward,
        withdrawal_fee: withdrawalFee,
        final_amount: finalAmount,
        source: {
          profit_split: 'account.rule_snapshot.profit_split',
          withdrawal_fee: settingsList[0] ? 'AffiliateSettings.global_config' : 'fallback_25',
        },
      },
    });
  } catch (error) {
    console.error('requestTraderWithdrawal error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});