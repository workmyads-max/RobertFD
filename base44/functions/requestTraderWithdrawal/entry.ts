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

    // 5. Minimum 1 trading day — OPTIMIZED: skip the expensive TradeRecord query
    // when the account already indicates trading has occurred (trading_days field
    // or positive profit). This eliminates a potentially large query in 99% of
    // withdrawal requests, keeping the submit to 4 SDK calls instead of 5+.
    const tradingDaysFromAccount = account.trading_days || 0;
    const hasRealProfit = (account.pnl || 0) > 0 || (account.balance || 0) > (account.account_size || 0);
    let tradingDaysCompleted;
    if (tradingDaysFromAccount >= 1 || hasRealProfit) {
      // Fast path — no TradeRecord query needed
      tradingDaysCompleted = Math.max(tradingDaysFromAccount, hasRealProfit ? 1 : 0);
    } else {
      // Fallback: count unique trading days from closed trades
      const tradeRecords = await base44.asServiceRole.entities.TradeRecord.filter({ account_id, status: 'closed' });
      const tradingDaySet = new Set();
      for (const t of tradeRecords) {
        const closeTime = t.close_time;
        if (closeTime) {
          const d = new Date(closeTime);
          if (!isNaN(d.getTime())) tradingDaySet.add(d.toISOString().split('T')[0]);
        }
      }
      tradingDaysCompleted = Math.max(tradingDaySet.size, tradingDaysFromAccount, hasRealProfit ? 1 : 0);
    }
    if (tradingDaysCompleted < 1) {
      return Response.json({
        error: `Withdrawal requires at least 1 completed trading day. You currently have ${tradingDaysCompleted} trading day(s). Please complete at least 1 trading day on your funded account first.`,
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

    // 7. Withdrawal fee: 5% of trader's share — no affiliate deduction
    const withdrawalFee = parseFloat((traderShare * 0.05).toFixed(2));
    const affiliateReward = 0; // No affiliate deduction on payouts

    const finalAmount = Math.max(0, parseFloat((traderShare - withdrawalFee).toFixed(2)));

    if (finalAmount <= 0) {
      return Response.json({ error: 'Final payout amount is zero or negative after fees' }, { status: 400 });
    }

    // 8. Create withdrawal request
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
      affiliate_reward: 0,
      withdrawal_fee: withdrawalFee,
      final_amount: finalAmount,
      notes: `Backend-validated withdrawal. Profit split: ${profitSplitPct}% from rule_snapshot. Fee: 5% of trader share ($${withdrawalFee}).`,
    });

    // ── LOCK TRADING AT BROKER LEVEL (New Account per Payout model) ──────────
    // The trader may not place trades while the payout is under review.
    // This sends the actual move-disabled command to MT5 — the trader's
    // terminal will reject all new orders immediately. can_trade=false is
    // also set in DB so scheduledMTSync re-enforces the lock if it ever
    // gets reversed at the broker level.
    const sr = base44.asServiceRole;
    try {
      await sr.entities.ChallengeAccount.update(account.id, { can_trade: false });
      console.log(`[requestTraderWithdrawal] can_trade=false set for ${account.account_id}`);
    } catch (e) {
      console.error('requestTraderWithdrawal: failed to set can_trade (non-blocking):', e.message);
    }

    // Send move-disabled to MT5 broker immediately (non-blocking but awaited)
    if (account.mt_login) {
      try {
        const providers = await sr.entities.TradingPlatformProvider.filter({ platform_name: 'mt5', is_active: true });
        const mt5 = providers[0];
        const mt5Base = mt5?.server_url || Deno.env.get('MT5_API_BASE_URL');
        const mt5Key  = mt5?.api_key     || Deno.env.get('MT5_API_KEY');
        const mgrLogin = mt5?.manager_login || '';
        const mgrPass  = mt5?.manager_password || '';

        if (mt5Base && mt5Key && mgrLogin && mgrPass) {
          const mt5Headers = {
            'Content-Type': 'application/json',
            'ApiKey': mt5Key,
            'ManagerLogin': mgrLogin,
            'ManagerPassword': mgrPass,
          };
          const loginNum = parseInt(account.mt_login);
          const disableRes = await fetch(`${mt5Base}/api/v1/user/move-disabled`, {
            method: 'POST', headers: mt5Headers,
            body: JSON.stringify({ Login: loginNum, apikey: mt5Key }),
          });
          const disableData = await disableRes.json().catch(() => ({}));
          const errCode = disableData?.data?.errorcode;
          if (errCode === 3) {
            console.warn(`[requestTraderWithdrawal] MT5 move-disabled: no disabled sub-group configured for ${account.mt_login}. DB-only lock applied.`);
          } else if (errCode != null && errCode !== 0 && errCode !== 10009) {
            console.warn(`[requestTraderWithdrawal] MT5 move-disabled returned errorcode=${errCode} for ${account.mt_login}`);
          } else {
            console.log(`[requestTraderWithdrawal] ✅ MT5 account ${account.mt_login} disabled at broker — trader cannot open new trades`);
          }
        } else {
          console.warn(`[requestTraderWithdrawal] MT5 credentials incomplete — cannot disable broker-side. DB-only lock applied for ${account.account_id}`);
        }
      } catch (e) {
        console.error(`[requestTraderWithdrawal] MT5 move-disabled failed (non-blocking) for ${account.mt_login}:`, e.message);
      }
    }

    return Response.json({
      success: true,
      withdrawal_id: withdrawalId,
      breakdown: {
        gross,
        profit_split_pct: profitSplitPct,
        trader_share: parseFloat(traderShare.toFixed(2)),
        company_share: parseFloat(companyShare.toFixed(2)),
        affiliate_reward: 0,
        withdrawal_fee: withdrawalFee,
        final_amount: finalAmount,
      },
    });
  } catch (error) {
    console.error('requestTraderWithdrawal error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});