/**
 * mt5RealtimeSync — Realtime MT5 equity fetch + server-side breach enforcement.
 *
 * Renamed from syncMatchTraderAccount (which contained zero MatchTrader code).
 * Called by LiveDDGuard (frontend) every 5 seconds for realtime monitoring.
 *
 * ARCHITECTURE:
 *   - Fetches live balance/equity from MT5 API (Tritech /api/v1/user/userget)
 *   - Performs ALL breach detection and enforcement SERVER-SIDE
 *   - Returns breach result to frontend for immediate modal display
 *   - Frontend NEVER makes the breach decision — only displays the result
 *
 * BREACH ENFORCEMENT (server-side, atomic):
 *   1. Update ChallengeAccount: status=failed, dd_breach_detected, dd_breach_type,
 *                               dd_breach_value, dd_breach_time
 *   2. Create RiskFlag (audit trail)
 *   3. Create Notification (user alert)
 *   4. Disable MT5 account broker-side (non-blocking)
 *
 * OWNERSHIP:
 *   - Authoritative writer for: status(failed), dd_breach_detected, dd_breach_type,
 *     dd_breach_value, dd_breach_time, balance(on breach), equity(on breach)
 *   - Does NOT write: statistics fields (win_rate, total_trades, pnl, profit_target_progress,
 *     daily_drawdown_used, max_drawdown_used outside breach) — scheduledMTSync owns those
 *
 * MUST NOT:
 *   - Create or update TradeRecords (scheduledMTSync owns that)
 *   - Update win_rate, total_trades, pnl history (scheduledMTSync owns that)
 *
 * Idempotent: already-breached accounts return immediately with breach_detected=true.
 * Ownership-verified: user must own the account.
 *
 * Environment variables used:
 *   MT5_API_BASE_URL — Tritech API base URL
 *   MT5_API_KEY      — Tritech API key
 *
 * External APIs called:
 *   POST ${MT5_API_BASE_URL}/api/v1/user/userget         (always)
 *   POST ${MT5_API_BASE_URL}/api/v1/user/move-disabled   (breach path only, non-blocking)
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ── DD helpers (inlined — no local imports in Deno) ───────────────────────────

function getDDLimits(acc) {
  const snap = acc.rule_snapshot || {};
  const dailyLimit   = snap.daily_dd_limit ?? 5;
  const overallLimit = snap.max_dd_limit ?? (acc.challenge_type === 'instant_light' ? 6 : 10);
  const isTrailing   = snap.trailing_dd ?? (acc.challenge_type === 'instant_light');
  return { dailyLimit, overallLimit, isTrailing };
}

/**
 * FTMO Maximum Loss (Overall DD) — STATIC FLOOR
 *
 * Minimum allowed equity = accountSize - (max_dd_limit% of accountSize)
 * e.g. 100K account: floor = $90,000 — ALWAYS, regardless of profits.
 * This floor NEVER changes even if balance grows to $200K.
 *
 * For trailing (instant_light only): floor rises with high water mark.
 */
function calcOverallDD(acc, equity, hwm) {
  const accountSize = acc.account_size || 100000;
  const isTrailing  = acc.rule_snapshot?.trailing_dd ?? (acc.challenge_type === 'instant_light');
  if (isTrailing) {
    return hwm > 0 ? Math.max(0, ((hwm - equity) / hwm) * 100) : 0;
  }
  // Static floor: always relative to original account size
  return Math.max(0, ((accountSize - equity) / accountSize) * 100);
}

/**
 * FTMO Daily Loss — DYNAMIC ALLOWANCE (correct industry formula)
 *
 * The daily allowance EXPANDS intraday when you bank profits:
 *   daily_loss_limit_$ = fixed_daily_limit_$ + max(realized_profit_today, 0)
 *   realized_profit_today = balance - daily_start_balance  (positive if profitable)
 *
 * Minimum daily equity = daily_start_balance - fixed_daily_limit_$
 *   (this floor is fixed at the start of each day, does NOT move intraday with profits)
 *
 * Breach condition:
 *   daily_loss_used = (daily_start_balance + realized_profit_today) - equity > daily_loss_limit_$
 *   i.e. equity < (daily_start_balance + realized_profit_today) - daily_loss_limit_$
 *   i.e. equity < daily_start_balance - fixed_daily_limit_$   ← simplified minimum equity
 *
 * BUT the correct breach check using %:
 *   daily_loss_used_$ = (daily_start_balance + max(balance - daily_start_balance, 0)) - equity
 *   daily_loss_limit_$ = fixed_daily_limit_pct * accountSize + max(balance - daily_start_balance, 0)
 *
 * Returns daily_loss_used as a % of accountSize for consistent comparison with dailyLimit%.
 */
function calcDailyDD(acc, balance, equity) {
  const accountSize       = acc.account_size || 100000;
  // SANITY: if daily_start_balance is corrupt (>50% off from account_size), use account_size
  const rawDSB = acc.daily_start_balance || 0;
  const dsbIsCorrupt = rawDSB > 0 && Math.abs(rawDSB - accountSize) / accountSize > 0.5;
  const dailyStartBalance = (rawDSB > 0 && !dsbIsCorrupt) ? rawDSB : accountSize;
  const fixedDailyLimitPct = (acc.rule_snapshot?.daily_dd_limit ?? 5);
  const fixedDailyLimit$   = accountSize * (fixedDailyLimitPct / 100);

  // Realized profit earned today (only positive counts — losses reduce balance but don't shrink allowance)
  const realizedProfitToday = Math.max(0, balance - dailyStartBalance);

  // Effective daily loss allowance in dollars (expands with intraday profit)
  const effectiveDailyLimit$ = fixedDailyLimit$ + realizedProfitToday;

  // Effective peak equity for today = start_balance + realized_profit_today
  const todayPeak = dailyStartBalance + realizedProfitToday;

  // Daily loss used in dollars (includes both closed + floating via equity)
  const dailyLossUsed$ = Math.max(0, todayPeak - equity);

  // Return as % of accountSize for comparison against dailyLimit%
  const dailyLossUsedPct = (dailyLossUsed$ / accountSize) * 100;
  const effectiveDailyLimitPct = (effectiveDailyLimit$ / accountSize) * 100;

  return {
    dailyLossUsedPct: parseFloat(dailyLossUsedPct.toFixed(4)),
    effectiveDailyLimitPct: parseFloat(effectiveDailyLimitPct.toFixed(4)),
    dailyLossUsed$: parseFloat(dailyLossUsed$.toFixed(2)),
    effectiveDailyLimit$: parseFloat(effectiveDailyLimit$.toFixed(2)),
    minDailyEquity: parseFloat((dailyStartBalance - fixedDailyLimit$).toFixed(2)),
    todayPeak: parseFloat(todayPeak.toFixed(2)),
    realizedProfitToday: parseFloat(realizedProfitToday.toFixed(2)),
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { account_id, mt_login } = body;
    if (!mt_login) return Response.json({ error: 'mt_login required' }, { status: 400 });

    // ── OWNERSHIP VERIFICATION ────────────────────────────────────────────────
    const accounts = await base44.entities.ChallengeAccount.filter({ account_id });
    const acc = accounts[0];
    if (!acc) return Response.json({ error: 'Account not found' }, { status: 404 });
    if (acc.user_email !== user.email) {
      return Response.json({ error: 'Forbidden: account does not belong to this user' }, { status: 403 });
    }

    // ── TRASHED ACCOUNT — never sync from MT5; its history is a frozen snapshot ─
    if (acc.is_trashed) {
      return Response.json({
        success: true,
        breach_detected: false,
        skipped: true,
        reason: 'Account is trashed — frozen snapshot, no MT5 sync',
      });
    }

    // ── ALREADY BREACHED — return immediately, nothing to enforce ─────────────
    if (acc.dd_breach_detected || acc.status === 'failed') {
      return Response.json({
        success: true,
        breach_detected: true,
        already_breached: true,
        breach_type: acc.dd_breach_type,
        breach_value: acc.dd_breach_value,
        balance: acc.balance,
        equity: acc.equity,
      });
    }

    // ── MT5 CREDENTIALS ───────────────────────────────────────────────────────
    const MT5_BASE = Deno.env.get('MT5_API_BASE_URL');
    const MT5_KEY  = Deno.env.get('MT5_API_KEY');
    if (!MT5_BASE || !MT5_KEY) {
      return Response.json({ error: 'MT5 credentials not configured' }, { status: 500 });
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MT5_KEY}`,
      'ApiKey': MT5_KEY,
    };
    const loginNum = parseInt(mt_login);

    // ── LIVE EQUITY FETCH (userget — fast, single call) ───────────────────────
    const infoRes = await fetch(`${MT5_BASE}/api/v1/user/userget`, {
      method: 'POST', headers,
      body: JSON.stringify({ Login: loginNum, apikey: MT5_KEY }),
    });

    let balance = null;
    let equity  = null;

    if (infoRes.ok) {
      const r   = await infoRes.json().catch(() => ({}));
      const mtd = r?.data || r?.User || r?.Data || r || {};
      balance = parseFloat(mtd?.Balance ?? mtd?.balance ?? 0) || null;
      equity  = parseFloat(mtd?.Equity  ?? mtd?.equity  ?? 0) || null;
    }

    // ── GLITCH PROTECTION ─────────────────────────────────────────────────────
    // If API returns 0 but DB has real data, keep DB values (transient MT5 API zero)
    if ((balance === 0 || balance === null) && (acc.balance || 0) > 0) {
      balance = acc.balance;
      equity  = acc.equity || acc.balance;
    }

    // If still no real data, skip enforcement cycle
    if (!equity || !balance || balance === 0 || equity === 0) {
      return Response.json({
        success: true,
        breach_detected: false,
        skipped: true,
        reason: 'zero_balance',
        balance: balance ?? acc.balance,
        equity:  equity  ?? acc.equity,
      });
    }

    // ── SERVER-SIDE BREACH DETECTION ──────────────────────────────────────────
    const accountSize = acc.account_size || 100000;

    // If rule_snapshot is missing, inject safe defaults so breach can still be enforced.
    // Missing snapshot = old account before the snapshot system — use standard 5%/10% limits.
    if (!acc.rule_snapshot) {
      acc.rule_snapshot = {
        daily_dd_limit: 5,
        max_dd_limit: 10,
        trailing_dd: acc.challenge_type === 'instant_light',
        phase1_target: 10,
        phase2_target: 5,
      };
      console.warn(`[mt5RealtimeSync] ${account_id} has no rule_snapshot — using default 5%/10% DD limits`);
    }

    // Glitch: balance < 1% of account size = API error
    if (balance > 0 && balance < accountSize * 0.01) {
      return Response.json({
        success: true,
        breach_detected: false,
        skipped: true,
        reason: 'api_glitch',
        balance,
        equity,
      });
    }

    const newHWM = Math.max(acc.high_water_mark || 0, balance);

    // ── OVERALL DD (static floor vs original account size) ────────────────────
    const currentOverallDD = calcOverallDD(acc, equity, newHWM);

    // ── DAILY DD (FTMO dynamic allowance formula) ─────────────────────────────
    const dailyCalc = calcDailyDD(acc, balance, equity);

    // Persistent overall DD: never decreases (Math.max), reset if corrupted
    const dbOverallDD = acc.max_drawdown_used || 0;
    const dbCorrupted = dbOverallDD >= 90;
    const persistentOverallDD = parseFloat((dbCorrupted ? currentOverallDD : Math.max(dbOverallDD, currentOverallDD)).toFixed(3));

    const { dailyLimit, overallLimit, isTrailing } = getDDLimits(acc);

    // ── BREACH DETECTION ──────────────────────────────────────────────────────
    // Overall: breached if persistentOverallDD >= limit (static floor never resets)
    // Daily: breached if dailyLossUsed$ > effectiveDailyLimit$ (dynamic, resets midnight)
    let breachType  = null;
    let breachValue = null;

    if (persistentOverallDD >= overallLimit) {
      breachType  = isTrailing ? 'trailing' : 'overall';
      breachValue = persistentOverallDD;
    } else if (dailyCalc.dailyLossUsed$ > dailyCalc.effectiveDailyLimit$) {
      breachType  = 'daily';
      // Report as % of accountSize for consistency
      breachValue = dailyCalc.dailyLossUsedPct;
    }

    // For display metrics
    const liveOverallDD = parseFloat(currentOverallDD.toFixed(3));
    const liveDailyDD   = parseFloat(dailyCalc.dailyLossUsedPct.toFixed(3));

    if (breachType) {
      // ── SERVER-SIDE ENFORCEMENT — atomic write ─────────────────────────────
      const breachTime = new Date().toISOString();
      const sr = base44.asServiceRole;

      await sr.entities.ChallengeAccount.update(acc.id, {
        status:            'failed',
        dd_breach_detected: true,
        dd_breach_type:    breachType,
        dd_breach_value:   parseFloat(breachValue.toFixed(2)),
        dd_breach_time:    breachTime,
        // Statistics fields intentionally omitted — scheduledMTSync owns all stats
      });

      // RiskFlag (non-blocking)
      const breachLabels = {
        daily:    'Daily drawdown limit exceeded',
        overall:  'Maximum drawdown limit exceeded',
        trailing: 'Trailing drawdown limit exceeded',
      };
      sr.entities.RiskFlag.create({
        user_email:   acc.user_email,
        account_id:   account_id,
        flag_type:    'unusual_dd_behavior',
        severity:     'critical',
        description:  `REALTIME BREACH (${breachType}): ${breachLabels[breachType]} — ${breachValue.toFixed(2)}% (equity: $${equity.toFixed(2)})`,
        status:       'active',
        triggered_at: breachTime,
      }).catch(() => {});

      // Notification (non-blocking) — MUST be user-scoped to prevent cross-user leakage
      sr.entities.Notification.create({
        user_email:   acc.user_email,
        title:        '🚫 Challenge Account Failed',
        message:      `Account ${account_id} breached: ${breachLabels[breachType]}. DD reached ${breachValue.toFixed(2)}%. Account has been automatically closed.`,
        type:         'market_alert',
        priority:     'critical',
        display_mode: 'sidebar',
        is_active:    true,
        target:       'challenge',
      }).catch(() => {});

      // MT5 broker-side disable (non-blocking)
      if (acc.mt_login) {
        (async () => {
          try {
            const res  = await fetch(`${MT5_BASE}/api/v1/user/move-disabled`, {
              method: 'POST', headers,
              body: JSON.stringify({ Login: loginNum, apikey: MT5_KEY }),
            });
            const data = await res.json().catch(() => ({}));
            const code = data?.data?.errorcode;
            if (code === 3) {
              console.warn(`[MT5-DISABLE] MT_RET_ERR_PARAMS for ${acc.mt_login} — no disabled sub-group configured. DB-only disable applied.`);
            } else {
              console.log(`[MT5-DISABLE] move-disabled ${acc.mt_login}: code=${code}`);
            }
          } catch (e) {
            console.error(`[MT5-DISABLE] Failed for ${acc.mt_login}:`, e.message);
          }
        })();
      }

      return Response.json({
        success: true,
        breach_detected:      true,
        breach_type:          breachType,
        breach_value:         parseFloat(breachValue.toFixed(2)),
        breach_time:          breachTime,
        balance,
        equity,
        live_overall_dd:      liveOverallDD,
        live_daily_dd:        liveDailyDD,
        is_trailing:          isTrailing,
        mt5_disable_initiated: !!acc.mt_login,
      });
    }

    // ── NO BREACH — return live equity for dashboard display ──────────────────
    // profit_target_progress uses BALANCE (closed trades only) — FTMO standard
    const balanceBasedProgress = parseFloat(Math.max(0, (balance - accountSize) / accountSize * 100).toFixed(2));

    return Response.json({
      success:         true,
      breach_detected: false,
      balance,
      equity,
      float_pnl:       equity - balance,
      profit_target_progress: balanceBasedProgress,
      live_overall_dd: liveOverallDD,
      live_daily_dd:   liveDailyDD,
      is_trailing:     isTrailing,
      account_size:    accountSize,
      high_water_mark: newHWM,
      daily_start_balance:      dailyCalc.todayPeak - dailyCalc.realizedProfitToday,
      daily_loss_used$:         dailyCalc.dailyLossUsed$,
      daily_loss_limit$:        dailyCalc.effectiveDailyLimit$,
      daily_loss_remaining$:    parseFloat((dailyCalc.effectiveDailyLimit$ - dailyCalc.dailyLossUsed$).toFixed(2)),
      min_daily_equity:         dailyCalc.minDailyEquity,
      realized_profit_today$:   dailyCalc.realizedProfitToday,
      today_peak_balance:       dailyCalc.todayPeak,
      // Overall: static floor
      min_overall_equity:       parseFloat((accountSize - accountSize * (overallLimit / 100)).toFixed(2)),
      overall_loss_remaining$:  parseFloat(((accountSize * overallLimit / 100) - Math.max(0, accountSize - equity)).toFixed(2)),
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});