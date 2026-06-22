/**
 * clearFalseRiskFlags — One-time cleanup for false auto-generated risk states.
 *
 * As of 2026-06-22 the risk engine is ADMIN-REVIEW-ONLY. Non-DD detections
 * (HFT, IP, behavioral, EA/bot, "unusual DD behavior / approaching limit",
 * account-passing-suspected) must NEVER auto-fail, auto-review, suspend, or
 * show a user-facing warning. This function clears the leftover false states
 * created by the previous (wrong) automatic behavior so affected accounts can
 * trade normally again.
 *
 * What it does (service role, admin-only):
 *   1. Resolves all active RiskFlag records whose flag_type is a NON-breach
 *      detection type AND whose account is NOT actually failed. These are the
 *      false "approaching limit" / behavioral flags. Real-breach flags on
 *      failed accounts are left intact.
 *   2. Clears can_trade=false on any non-failed account that the risk engine
 *      had suspended (can_trade is only meaningful when admin manually sets it).
 *   3. Clears account_passing_suspected and resets risk_flags to [] on
 *      non-failed accounts (admin risk center repopulates from new scans).
 *
 * What it does NOT do:
 *   - Touch accounts whose status === 'failed' (real DD breaches stay failed).
 *   - Touch dd_breach_detected / dd_breach_type / dd_breach_time / dd_breach_value.
 *   - Touch auth, payments, MT5 sync, or any other business logic.
 *
 * Admin-only: requires an authenticated admin session.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Non-breach detection types that previously caused false auto-flags/reviews.
const NON_BREACH_FLAG_TYPES = new Set([
  'unusual_dd_behavior',
  'hft_detected',
  'hft_detection',
  'arbitrage_detected',
  'arbitrage',
  'bot_detected',
  'ea_bot_detected',
  'inconsistent_behavior',
  'account_passing_suspected',
  'consistency_manipulation',
  'suspicious_lot_sizing',
  'hedge_abuse',
  'ultra_fast_scalping',
  'ultra_scalping',
  'copy_trading_signal',
  'toxic_flow',
  'overnight_violation',
  'synthetic_arbitrage',
  'news_trading_violation',
  'weekend_holding_violation',
  'martingale_grid',
  'repetitive_pattern',
  'high_frequency_trading',
  'max_lots',
  'hedging',
  'weekend_holding',
  'overnight_holding',
  'leverage_exceeded',
  'ip_kyc_conflict',
]);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    const sr = base44.asServiceRole;

    // Fetch all accounts once
    const allAccounts = await sr.entities.ChallengeAccount.list('-created_date', 1000);
    const failedAccountIds = new Set(
      allAccounts.filter(a => a.status === 'failed').map(a => a.account_id)
    );
    const nonFailedAccounts = allAccounts.filter(a => a.status !== 'failed');

    // 1. Resolve false non-breach RiskFlags on accounts that are NOT failed
    const allFlags = await sr.entities.RiskFlag.filter({ status: 'active' });
    const falseFlags = allFlags.filter(f =>
      NON_BREACH_FLAG_TYPES.has(f.flag_type) && !failedAccountIds.has(f.account_id)
    );
    let flagsResolved = 0;
    await Promise.all(falseFlags.map(f =>
      sr.entities.RiskFlag.update(f.id, {
        status: 'false_positive',
        resolved_at: new Date().toISOString(),
        resolved_by: user.email,
        notes: 'Auto-resolved: non-breach detection, admin-review-only policy (2026-06-22).',
      }).then(() => { flagsResolved++; }).catch(() => {})
    ));

    // 2. Clear can_trade=false + account_passing_suspected + risk_flags on non-failed accounts
    let accountsCleared = 0;
    await Promise.all(nonFailedAccounts.map(async (acc) => {
      const needsClear = acc.can_trade === false ||
        acc.account_passing_suspected === true ||
        (Array.isArray(acc.risk_flags) && acc.risk_flags.length > 0);
      if (!needsClear) return;
      const patch = {};
      if (acc.can_trade === false) patch.can_trade = true;
      if (acc.account_passing_suspected === true) patch.account_passing_suspected = false;
      if (Array.isArray(acc.risk_flags) && acc.risk_flags.length > 0) patch.risk_flags = [];
      await sr.entities.ChallengeAccount.update(acc.id, patch).then(() => { accountsCleared++; }).catch(() => {});
    }));

    return Response.json({
      success: true,
      total_accounts: allAccounts.length,
      failed_accounts_preserved: failedAccountIds.size,
      false_flags_resolved: flagsResolved,
      accounts_cleared: accountsCleared,
      message: 'Cleared false non-breach risk flags and restored can_trade on non-failed accounts. Real DD-breach failures are preserved.',
    });
  } catch (error) {
    console.error('clearFalseRiskFlags error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});