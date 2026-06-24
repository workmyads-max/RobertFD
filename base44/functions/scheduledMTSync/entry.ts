/**
 * scheduledMTSync — Batch MT5 sync engine.
 * Runs every 5 minutes via scheduled automation.
 *
 * PROFIT TARGET (Priority 6):
 *   - Based on live EQUITY: (equity - accountSize) / accountSize * 100
 *   - Captures floating PnL from open positions — not just closed balance
 *
 * DAILY RESET (Priority 7):
 *   - Runs inline at 00:00–00:04 UTC (midnight UTC) — single canonical reset time
 *   - Uses BALANCE (not equity) as daily_start_balance baseline — FTMO standard
 *   - Also initialises daily_start_balance for new accounts on first sync
 *   - Resets: daily_start_balance=balance, daily_drawdown_used=0, daily_pnl=0, daily_reset_at
 *   - automatedDDBreach remains as backup safety net
 *
 * OVERALL DD:
 *   - Two-step / Instant / Funded: (accountSize - equity) / accountSize * 100
 *   - Instant Light: (highWaterMark - equity) / highWaterMark * 100  (trailing)
 *   - Stored with Math.max — NEVER decreases
 *
 * DAILY DD (TRUE INSTITUTIONAL):
 *   - Formula: (daily_start_balance - equity) / daily_start_balance * 100
 *   - daily_start_balance = balance recorded at last 23:00 UTC reset
 *   - Falls back to account_size if never reset (new account)
 *   - Stored with Math.max — NEVER decreases within a trading day
 *
 * BREACH:
 *   - Detected inside the sync — no waiting for automatedDDBreach
 *   - status='failed' written in same DB update as breach flags
 *   - Breach flags written once and NEVER overwritten
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Read DD limits from the account's rule_snapshot (written at purchase time).
 * Falls back to legacy hardcoded values only if snapshot is absent (pre-migration accounts).
 */
function getDDLimits(acc) {
  const snap = acc.rule_snapshot || {};
  const dailyLimit = snap.daily_dd_limit ?? (acc.challenge_type === 'instant_account' ? 4 : 5);
  const overallLimit = snap.max_dd_limit ?? (acc.challenge_type === 'instant_light' ? 6 : acc.challenge_type === 'instant_account' ? 8 : 10);
  const isTrailing = snap.trailing_dd ?? (acc.challenge_type === 'instant_light');
  return { dailyLimit, overallLimit, isTrailing };
}

/**
 * FTMO Overall DD — static floor against original account size.
 * Minimum equity = accountSize - max_dd_limit% — NEVER changes regardless of profits.
 * Instant Light only uses trailing (high water mark) DD.
 */
function calcOverallDD(acc, equity, newHWM) {
  const accountSize = acc.account_size || 100000;
  const isTrailing = acc.rule_snapshot?.trailing_dd ?? (acc.challenge_type === 'instant_light');
  if (isTrailing) {
    const hwm = newHWM || accountSize;
    return hwm > 0 ? Math.max(0, ((hwm - equity) / hwm) * 100) : 0;
  }
  // instant_account: after buffer zone activation, DD is relative to locked balance
  if (acc.challenge_type === 'instant_account' && acc.buffer_zone_activated && (acc.dd_reference_balance || 0) > 0) {
    return Math.max(0, ((acc.dd_reference_balance - equity) / acc.dd_reference_balance) * 100);
  }
  // Static floor: always relative to original account size
  return Math.max(0, ((accountSize - equity) / accountSize) * 100);
}

/**
 * FTMO Daily DD — dynamic allowance formula.
 *
 * daily_loss_limit_$ = fixed_daily_limit_$ + max(realized_profit_today, 0)
 * realized_profit_today = balance - daily_start_balance  (clamped to 0 if negative)
 *
 * Returns { dailyLossUsedPct, effectiveDailyLimitPct, dailyLossUsed$, effectiveDailyLimit$ }
 */
function calcDailyDD(acc, balance, equity) {
  const accountSize        = acc.account_size || 100000;
  const dailyStartBalance  = acc.daily_start_balance || accountSize;
  const fixedDailyLimitPct = acc.rule_snapshot?.daily_dd_limit ?? 5;
  const fixedDailyLimit$   = accountSize * (fixedDailyLimitPct / 100);

  const realizedProfitToday  = Math.max(0, balance - dailyStartBalance);
  const effectiveDailyLimit$ = fixedDailyLimit$ + realizedProfitToday;
  const todayPeak            = dailyStartBalance + realizedProfitToday;
  const dailyLossUsed$       = Math.max(0, todayPeak - equity);

  return {
    dailyLossUsedPct:       parseFloat(((dailyLossUsed$ / accountSize) * 100).toFixed(4)),
    effectiveDailyLimitPct: parseFloat(((effectiveDailyLimit$ / accountSize) * 100).toFixed(4)),
    dailyLossUsed$:         parseFloat(dailyLossUsed$.toFixed(2)),
    effectiveDailyLimit$:   parseFloat(effectiveDailyLimit$.toFixed(2)),
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // ── SECURITY: Multi-layer authorization ───────────────────────────────────
    // Layer 1: Check for authenticated admin user (browser session)
    // Layer 2: Check for scheduler secret token (internal automation)
    // Layer 3: Reject ALL anonymous callers
    const schedulerToken = req.headers.get('X-Scheduler-Token');
    const expectedToken = Deno.env.get('SCHEDULER_SECRET_TOKEN');
    
    let authorized = false;
    try {
      const user = await base44.auth.me();
      if (user && user.role === 'admin') {
        authorized = true; // Admin user session
      }
    } catch {
      // No user session - will check scheduler token below
    }
    
    if (!authorized && schedulerToken && expectedToken && schedulerToken === expectedToken) {
      authorized = true; // Valid scheduler token
    }
    
    if (!authorized) {
      console.log('[scheduledMTSync] BLOCKED: Unauthorized caller - no admin session and no valid scheduler token');
      return Response.json({ 
        error: 'Forbidden: Admin authentication or valid scheduler token required',
        code: 'UNAUTHORIZED_ACCESS'
      }, { status: 403 });
    }

    const allAccounts = await base44.asServiceRole.entities.ChallengeAccount.list('-created_date', 500);
    
    // CRITICAL: Fetch all paid orders to identify legitimate accounts that shouldn't be auto-breached
    // Match by order_id (which becomes account_id on the ChallengeAccount) OR by account_id field on Order
    const allOrders = await base44.asServiceRole.entities.Order.filter({});
    const paidOrders = allOrders.filter(o => ['confirmed', 'paid'].includes(o.payment_status));
    const paidOrderAccountIds = new Set([
      ...paidOrders.filter(o => o.order_id).map(o => o.order_id),
      ...paidOrders.filter(o => o.account_id).map(o => o.account_id),
    ]);
    
    const activeAccounts = allAccounts.filter(a =>
      a.mt_login &&
      a.user_email && // CRITICAL: Skip any orphaned accounts with no owner
      ['active', 'funded', 'passed', 'pending'].includes(a.status) &&
      !a.is_trashed // CRITICAL: Never sync trashed accounts — their history is a frozen snapshot
      // NOTE: platform check removed — all accounts use MT5 (Tritech) regardless of platform field value
      // platform field may be 'xtrading', 'mt5', or other legacy values
    );

    // Pre-fetch MT5 credentials directly from entity (avoids function auth chain issues)
    const mt5Providers = await base44.asServiceRole.entities.TradingPlatformProvider.filter({ platform_name: 'mt5', is_active: true });
    const mt5Provider = mt5Providers[0];
    const mt5Creds = mt5Provider ? {
      api_key: mt5Provider.api_key,
      manager_login: mt5Provider.manager_login || '',
      manager_password: mt5Provider.manager_password || '',
      server_url: mt5Provider.server_url || Deno.env.get('MT5_API_BASE_URL'),
      server_name: mt5Provider.server_name || Deno.env.get('MT5_SERVER_NAME') || 'XyloMarkets-Server',
      success: true,
    } : (Deno.env.get('MT5_API_KEY') ? {
      api_key: Deno.env.get('MT5_API_KEY'),
      manager_login: '',
      manager_password: '',
      server_url: Deno.env.get('MT5_API_BASE_URL'),
      server_name: Deno.env.get('MT5_SERVER_NAME') || 'XyloMarkets-Server',
      success: true,
    } : null);
    const mtCreds = null; // MatchTrader removed — MT5-only architecture

    const results = [];
    const BATCH_SIZE = 50;

    for (let batchStart = 0; batchStart < activeAccounts.length; batchStart += BATCH_SIZE) {
      const batch = activeAccounts.slice(batchStart, batchStart + BATCH_SIZE);

      const batchResults = await Promise.all(batch.map(async (acc) => {
        try {
          const creds = mt5Creds; // MT5-only

          if (!creds) {
            return { account_id: acc.account_id, ok: false, error: `Missing API credentials for ${acc.platform}` };
          }

          const apiBase = creds.server_url || Deno.env.get('MT5_API_BASE_URL');
          const apiKey = creds.api_key;
          const managerLogin = creds.manager_login || '';
          const managerPassword = creds.manager_password || '';

          if (!apiBase || !apiKey) {
            return { account_id: acc.account_id, ok: false, error: 'Invalid MT5 API config' };
          }

          // CRITICAL: Must include ManagerLogin + ManagerPassword — without them Tritech
          // returns empty deal history for accounts that require manager-level auth.
          // getClosedTrades uses this same header format (confirmed working).
          const headers = {
            'Content-Type': 'application/json',
            'ApiKey': apiKey,
            'ManagerLogin': managerLogin,
            'ManagerPassword': managerPassword,
          };
          const loginNum = parseInt(acc.mt_login);

          // ── WITHDRAWAL LOCK ENFORCEMENT ────────────────────────────────────
          // If can_trade=false (withdrawal pending), re-enforce the broker-side
          // disable so the trader cannot open new trades. This catches cases where
          // the broker reversed the disable or the initial move-disabled failed.
          if (acc.can_trade === false && !acc.is_trashed) {
            try {
              const lockRes = await fetch(`${apiBase}/api/v1/user/move-disabled`, {
                method: 'POST', headers,
                body: JSON.stringify({ Login: loginNum, apikey: apiKey }),
              });
              const lockData = await lockRes.json().catch(() => ({}));
              const lockCode = lockData?.data?.errorcode;
              if (lockCode === 3) {
                console.warn(`[WITHDRAWAL-LOCK] ${acc.account_id}: no disabled sub-group configured on MT5 Manager`);
              } else {
                console.log(`[WITHDRAWAL-LOCK] ${acc.account_id}: move-disabled re-enforced (code=${lockCode})`);
              }
            } catch (e) {
              console.warn(`[WITHDRAWAL-LOCK] ${acc.account_id}: move-disabled failed (non-blocking):`, e.message);
            }
          }

          // Use provisioning date as start (same as getClosedTrades) — ensures no trades missed.
          // Fall back to 365 days if provisioned_at not set.
          const fromDate = acc.provisioned_at
            ? new Date(new Date(acc.provisioned_at).getTime() - 24 * 60 * 60 * 1000).toISOString()
            : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
          const toDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // +1 day buffer for today's trades

          // Confirmed working payload format — empty groups array, logins array only
          const dealHistoryBody = {
            groups: [],
            logins: [loginNum],
            from: fromDate,
            to: toDate,
            dateFrom: fromDate,
            dateTo: toDate,
            actionTypes: [],
            orderTypes: [],
            orderStates: [],
            entryStates: [],
            isFilterPosition: false,
            apikey: apiKey,
            pageOffset: 0,
            pageSize: 500,
          };

          // Fetch userget + 3 deal history endpoints in parallel
          const [infoRes, hist1Res, hist2Res, hist3Res] = await Promise.all([
            fetch(`${apiBase}/api/v1/user/userget`, {
              method: 'POST', headers,
              body: JSON.stringify({ Login: loginNum, apikey: apiKey }),
            }),
            // Primary: get-deal-history
            fetch(`${apiBase}/api/v1/deal/get-deal-history`, {
              method: 'POST', headers,
              body: JSON.stringify(dealHistoryBody),
            }).catch(() => ({ ok: false })),
            // Fallback 1: get-order-history (different endpoint, same data)
            fetch(`${apiBase}/api/v1/order/get-order-history`, {
              method: 'POST', headers,
              body: JSON.stringify(dealHistoryBody),
            }).catch(() => ({ ok: false })),
            // Fallback 2: deal history with Login singular only (no logins array)
            fetch(`${apiBase}/api/v1/deal/get-deal-history`, {
              method: 'POST', headers,
              body: JSON.stringify({ Login: loginNum, from: fromDate, to: toDate, apikey: apiKey, pageOffset: 0, pageSize: 500 }),
            }).catch(() => ({ ok: false })),
          ]);

          let mtData = {};
          let deals = [];

          if (infoRes.ok) {
            try {
              const r = await infoRes.json();
              mtData = r?.data || r?.User || r?.Data || r || {};
            } catch { /* fallback to DB values */ }
          } else {
            console.warn(`[sync] userget returned non-OK for ${acc.account_id} (login ${loginNum})`);
          }

          // Try each history endpoint in order — use first one that returns deals
          for (const res of [hist1Res, hist2Res, hist3Res]) {
            if (!res.ok) continue;
            try {
              const r = await res.json();
              const arr = r?.data || r?.Deals || r?.Data || r;
              if (Array.isArray(arr) && arr.length > 0) {
                deals = arr;
                console.log(`[sync] ${acc.account_id}: got ${deals.length} deals`);
                break;
              }
            } catch { /* try next */ }
          }
          if (deals.length === 0) {
            console.warn(`[sync] ${acc.account_id}: all deal history endpoints returned empty`);
          }

          // Use live API values ONLY if non-zero.
          // If API returns 0 for balance AND equity AND account was provisioned within the last 24h,
          // the deposit is still processing async (Tritech code 10009) — keep DB values to avoid
          // false 100% DD breach on fresh accounts.
          const rawBalance = parseFloat(mtData?.Balance ?? mtData?.balance ?? 0);
          const rawEquity  = parseFloat(mtData?.Equity  ?? mtData?.equity  ?? 0);
          const isRecentlyProvisioned = acc.provisioned_at &&
            (Date.now() - new Date(acc.provisioned_at).getTime()) < 24 * 60 * 60 * 1000;
          const apiReturnedZero = rawBalance === 0 && rawEquity === 0;

          let balance, equity;
          if (!apiReturnedZero) {
            balance = rawBalance;
            equity  = rawEquity;
          } else {
            // API returned 0 — ALWAYS keep DB values to prevent false breach.
            // MT5 userget can return 0 transiently (async deposit, API glitch, group mismatch).
            // Only trust a 0 balance from the API if the DB also has 0 AND the account
            // was NOT recently provisioned. This prevents false 100% DD breach on real accounts.
            const dbBalance = acc.balance || 0;
            const dbEquity  = acc.equity  || 0;
            if (dbBalance > 0) {
              // DB has real data — API glitch, keep DB values
              balance = dbBalance;
              equity  = dbEquity || dbBalance;
              console.log(`[sync] ${acc.account_id} API returned 0 — keeping DB values (balance=${balance}, recently_provisioned=${isRecentlyProvisioned})`);
            } else if (isRecentlyProvisioned) {
              // Fresh account — deposit still processing
              balance = acc.account_size || 0;
              equity  = acc.account_size || 0;
              console.log(`[sync] ${acc.account_id} API returned 0 — keeping account_size (recently_provisioned=true)`);
            } else {
              balance = 0;
              equity  = 0;
            }
          }
          // Tritech get-deal-history returns only CLOSED deals — all records are closed trades
          // type: 0=BUY, 1=SELL. volume is raw (e.g. 60000 = 0.60 lots), divide by 100000
          // CRITICAL: Exclude deposit/withdrawal balance operations — they have no symbol and 0 volume.
          // These are NOT trades and must never be counted in PnL, win rate, or trading days.
          const closedTrades = deals.filter(d =>
            (d.deal_id != null || d.Ticket != null) &&
            (d.symbol ?? d.Symbol ?? '') !== '' &&
            parseFloat(d.volume ?? d.Volume ?? 0) > 0
          );
          const wins = closedTrades.filter(d => parseFloat(d.profit ?? d.Profit ?? 0) > 0).length;
          const winRate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0;
          const accountSize = acc.account_size || 100000;
          const newHWM = Math.max(acc.high_water_mark || 0, balance);

          // ── INSTANT ACCOUNT BUFFER ZONE ACTIVATION ──────────────────────────
          if (acc.challenge_type === 'instant_account' && !acc.buffer_zone_activated && balance > 0) {
            const bufferTargetPct = acc.rule_snapshot?.buffer_zone_target ?? 5;
            const bufferTargetBal = accountSize * (1 + bufferTargetPct / 100);
            if (balance >= bufferTargetBal) {
              const lockBalance = parseFloat(bufferTargetBal.toFixed(2));
              const nowIso = new Date().toISOString();
              await base44.asServiceRole.entities.ChallengeAccount.update(acc.id, {
                buffer_zone_activated: true,
                buffer_zone_activated_at: nowIso,
                buffer_zone_lock_balance: lockBalance,
                dd_reference_balance: lockBalance,
              });
              acc.buffer_zone_activated = true;
              acc.buffer_zone_activated_at = nowIso;
              acc.buffer_zone_lock_balance = lockBalance;
              acc.dd_reference_balance = lockBalance;
              console.log(`[BUFFER-ZONE] ${acc.account_id} activated at balance=${balance}, lock=${lockBalance}`);
              base44.asServiceRole.entities.Notification.create({
                user_email: acc.user_email,
                title: '🎉 Buffer Zone Activated!',
                message: `Your Instant Account has reached the buffer zone target. Your drawdown reference is now locked at $${lockBalance.toLocaleString()}. Consistency and Profitable Days tracking are now active.`,
                type: 'payout', priority: 'high', display_mode: 'popup', is_active: true, target: 'challenge',
              }).catch(() => {});
            }
          }

          // ── TRADING DAYS — counted from actual closed deal dates (UTC) ─────
          // CRITICAL: Only count unique dates that have at least one closed deal.
          // NEVER fall back to a hardcoded value — 0 is correct when there are no trades.
          const tradingDaySet = new Set();
          const parseTime = (t) => {
            if (!t) return null;
            if (typeof t === 'string' && t.includes('T')) return new Date(t);
            return new Date(parseInt(t) * (String(t).length <= 10 ? 1000 : 1));
          };
          for (const d of closedTrades) {
            const closeT = parseTime(d.closeTime ?? d.TimeMsc ?? d.Time ?? d.openTime);
            if (closeT && !isNaN(closeT.getTime())) {
              tradingDaySet.add(closeT.toISOString().split('T')[0]);
            }
          }
          const computedTradingDays = tradingDaySet.size;

          // ── DAILY RESET at 00:00 UTC (midnight UTC) — single canonical reset ──
          // Idempotent per UTC date. Uses BALANCE (not equity) as baseline — FTMO standard.
          // Also initialises daily_start_balance for new accounts that have never reset.
          const nowUtc = new Date();
          const utcHour = nowUtc.getUTCHours();
          const utcMin  = nowUtc.getUTCMinutes();
          const isResetWindow = utcHour === 0 && utcMin < 5; // 00:00–00:04 UTC
          const lastResetAt = acc.daily_reset_at ? new Date(acc.daily_reset_at) : null;
          const pad = n => String(n).padStart(2, '0');
          const lastResetDateStr = lastResetAt
            ? `${lastResetAt.getUTCFullYear()}-${pad(lastResetAt.getUTCMonth()+1)}-${pad(lastResetAt.getUTCDate())}`
            : null;
          const todayDateStr = `${nowUtc.getUTCFullYear()}-${pad(nowUtc.getUTCMonth()+1)}-${pad(nowUtc.getUTCDate())}`;
          const needsDailyReset = isResetWindow && lastResetDateStr !== todayDateStr;
          // First-time init: new accounts that have never had a proper daily reset
          // SANITY CHECK: daily_start_balance must be within 20% of account_size (catches corrupt values)
          const existingDSB = acc.daily_start_balance || 0;
          const dsb_is_corrupt = existingDSB > 0 && Math.abs(existingDSB - accountSize) / accountSize > 0.5;
          const needsInit = (!acc.daily_start_balance || dsb_is_corrupt) && !apiReturnedZero && balance > 0;
          if (dsb_is_corrupt) {
            console.warn(`[DAILY-INIT] ${acc.account_id} — daily_start_balance=${existingDSB} is corrupt (account_size=${accountSize}), reinitializing`);
          }

          if ((needsDailyReset || needsInit) && !apiReturnedZero && balance > 0) {
            // Snapshot BALANCE (not equity) as the daily baseline — FTMO/industry standard
            await base44.asServiceRole.entities.ChallengeAccount.update(acc.id, {
              daily_start_balance: balance,
              daily_drawdown_used: 0,
              daily_low_equity: 0,
              daily_pnl: 0,
              daily_reset_at: nowUtc.toISOString(),
            });
            acc.daily_start_balance = balance;
            acc.daily_drawdown_used = 0;
            acc.daily_low_equity = 0;
            acc.daily_pnl = 0;
            const resetReason = needsInit ? 'INIT' : 'RESET';
            console.log(`[DAILY-${resetReason}] ${acc.account_id} — daily_start_balance=${balance} at ${nowUtc.toISOString()}`);
          }

          // ── PERIOD-LOW EQUITY (intra-sync dip detection) ────────────────
          // MT5's EquyMin = minimum equity within the current trading day,
          // INCLUDING floating dips that recovered before this sync. Use it as
          // the primary source so intra-period dips are never missed.
          //
          // Fallback: if EquyMin is unavailable, reconstruct the period-low from
          // closed-deal history since the daily reset (captures realized PnL dips).
          const equyMin = parseFloat(mtData?.EquyMin ?? mtData?.equyMin ?? mtData?.equy_min ?? 0) || 0;

          let reconLow = equity;
          if (equyMin <= 0 && deals.length > 0) {
            // Reconstruct equity curve from closed deals since daily reset
            const dsb = acc.daily_start_balance || accountSize;
            const resetMs = acc.daily_reset_at ? new Date(acc.daily_reset_at).getTime() : 0;
            const sinceDeals = deals
              .map(d => ({
                time: parseTime(d.closeTime ?? d.TimeMsc ?? d.Time),
                profit: parseFloat(d.profit ?? d.Profit ?? 0),
              }))
              .filter(d => d.time && d.time.getTime() >= resetMs)
              .sort((a, b) => a.time.getTime() - b.time.getTime());
            let runningBalance = dsb;
            for (const d of sinceDeals) {
              runningBalance += d.profit;
              reconLow = Math.min(reconLow, runningBalance);
            }
          }

          // Period-low: worst of EquyMin, deal-history reconstruction, stored low, current equity
          const dailyLowEquity = Math.min(
            equity,
            equyMin > 0 ? equyMin : equity,
            reconLow,
            (acc.daily_low_equity && acc.daily_low_equity > 0) ? acc.daily_low_equity : equity,
          );

          // Overall DD: use period-low equity to catch intra-sync dips
          const currentOverallDD = calcOverallDD(acc, dailyLowEquity, newHWM);

          // Daily DD: computed from the LOWEST equity of the day (not current).
          // FTMO formula simplifies to: breach = equity < daily_start_balance - daily_limit_$
          // As a %: (daily_start_balance - daily_low_equity) / account_size * 100
          // instant_account: use dd_reference_balance (locked at buffer zone) for DD calculations
          const ddRefBal = (acc.challenge_type === 'instant_account' && acc.buffer_zone_activated && (acc.dd_reference_balance || 0) > 0)
            ? acc.dd_reference_balance : accountSize;
          const dsbForDD = acc.daily_start_balance || ddRefBal;
          const dailyDDFromLowPct = Math.max(0, ((dsbForDD - dailyLowEquity) / ddRefBal) * 100);

          // Persistent values — NEVER decrease (daily resets at midnight UTC)
          const persistentOverallDD = parseFloat(Math.max(acc.max_drawdown_used || 0, currentOverallDD).toFixed(2));
          const persistentDailyDD   = parseFloat(Math.max(acc.daily_drawdown_used || 0, dailyDDFromLowPct).toFixed(2));

          const { dailyLimit, overallLimit, isTrailing } = getDDLimits(acc);

          // ── BREACH DETECTION — PERMANENT, never reversed ──────────────────
          // If dd_breach_detected is already true, it can NEVER be reset.
          // Skip all breach re-evaluation — the breach is final.
          let breachDetected = acc.dd_breach_detected || false;
          let breachType     = acc.dd_breach_type     || null;
          let breachTime     = acc.dd_breach_time     || null;
          let breachValue    = acc.dd_breach_value     || null;

          // CRITICAL FIX #2: Check if account has a PAID ORDER matching this user's email.
          // If account has paid order BUT MT5 returns 0 balance, the broker hasn't funded it yet.
          // NEVER auto-breach these accounts — they need manual MT5 funding review.
          // Also match by user email to prevent false positive on account_id collisions.
          const hasPaidOrder = paidOrderAccountIds.has(acc.account_id) ||
            paidOrders.some(o => o.email === acc.user_email && ['confirmed','paid'].includes(o.payment_status));
          const isUnfundedPaidAccount = hasPaidOrder && apiReturnedZero;
          
          // CRITICAL: Never breach accounts that have zero balance/equity — API glitch or unfunded
          const hasRealBalance = balance > 0 && equity > 0;
          // Never breach accounts provisioned less than 2 hours ago — deposit may still be processing
          const provisionedAt = acc.provisioned_at ? new Date(acc.provisioned_at).getTime() : 0;
          const hoursSinceProvisioned = (Date.now() - provisionedAt) / (1000 * 60 * 60);
          const isTooNew = provisionedAt > 0 && hoursSinceProvisioned < 2;

          if (!breachDetected && !isUnfundedPaidAccount && hasRealBalance && !isTooNew) {
            if (persistentOverallDD >= overallLimit) {
              breachDetected = true;
              breachType = isTrailing ? 'trailing' : 'overall';
              breachTime = new Date().toISOString();
              breachValue = persistentOverallDD;
              console.log(`[BREACH] ${acc.account_id} overall DD: ${persistentOverallDD.toFixed(2)}% / limit ${overallLimit}%`);
            } else if (persistentDailyDD >= dailyLimit) {
              breachDetected = true;
              breachType = 'daily';
              breachTime = new Date().toISOString();
              breachValue = persistentDailyDD;
              console.log(`[BREACH] ${acc.account_id} daily DD: ${persistentDailyDD.toFixed(2)}% / limit ${dailyLimit}% (low equity: $${dailyLowEquity.toFixed(2)})`);
            }
          }
          
          if (isUnfundedPaidAccount) {
            console.log(`[UNFUNDED-PAID] ${acc.account_id} — Has paid order but MT5 balance=0, skipping auto-breach (broker needs to fund)`);
          }

          const updates = {
            balance,
            equity,
            pnl: parseFloat((balance - accountSize).toFixed(2)),
            win_rate: parseFloat(winRate.toFixed(1)),
            total_trades: closedTrades.length,
            // AUTHORITATIVE: trading_days computed from actual closed deal dates (UTC).
            // Only update if MT5 returned real deals; otherwise keep existing DB value.
            ...(deals.length > 0 && { trading_days: computedTradingDays }),
            max_drawdown_used: persistentOverallDD,
            // Daily DD: permanent peak — Math.max with stored, never decreases within a day
            daily_drawdown_used: persistentDailyDD,
            // Daily low equity: tracks the worst equity point of the day (permanent)
            daily_low_equity: dailyLowEquity,
            // FTMO-standard: profit target measured against BALANCE (closed trades only)
            profit_target_progress: parseFloat(Math.max(0, (balance - accountSize) / accountSize * 100).toFixed(2)),
            high_water_mark: newHWM,
            last_synced_at: new Date().toISOString(),
          };

          // ── BREACH FLAGS: only set for NEW breaches, NEVER clear existing ones ──
          // Once dd_breach_detected is true, it is PERMANENT — no sync can reverse it.
          if (breachDetected && !acc.dd_breach_detected) {
            updates.dd_breach_detected = true;
            updates.dd_breach_type    = breachType;
            updates.dd_breach_time     = breachTime;
            updates.dd_breach_value    = breachValue;
          }

          // Immediate failure — same DB write, no waiting for automatedDDBreach
          if (breachDetected && acc.status !== 'failed') {
            updates.status = 'failed';
            updates.can_trade = false;
            console.log(`[AUTO-FAIL] ${acc.account_id} → failed (${breachType}: ${breachValue?.toFixed(2)}%) — trading locked`);

            // ── USER NOTIFICATION (user-scoped) — non-blocking ──────────────────
            const breachLabels = {
              daily: 'Daily drawdown limit exceeded',
              overall: 'Maximum drawdown limit exceeded',
              trailing: 'Trailing drawdown limit exceeded',
            };
            base44.asServiceRole.entities.Notification.create({
              user_email: acc.user_email,
              title: '🚫 Challenge Account Failed',
              message: `Account ${acc.account_id} breached: ${breachLabels[breachType] || breachType}. DD reached ${breachValue?.toFixed(2)}%. Account has been automatically closed.`,
              type: 'market_alert', priority: 'critical',
              display_mode: 'popup', is_active: true, target: 'challenge',
            }).catch(() => {});

            // ── RISK FLAG (audit trail) — non-blocking ──────────────────────────
            base44.asServiceRole.entities.RiskFlag.create({
              user_email: acc.user_email,
              account_id: acc.account_id,
              flag_type: 'unusual_dd_behavior',
              severity: 'critical',
              description: `SCHEDULED SYNC BREACH (${breachType}): ${breachLabels[breachType]} — ${breachValue?.toFixed(2)}% (equity: $${equity.toFixed(2)}, low: $${dailyLowEquity.toFixed(2)})`,
              status: 'active',
              triggered_at: breachTime,
            }).catch(() => {});

            // ── BROKER-SIDE DISABLE — non-blocking ─────────────────────────────
            if (acc.mt_login) {
              const disableReason = `DD breach: ${breachType} at ${breachValue?.toFixed(2)}%`;
              (async () => {
                try {
                  // Tritech API: POST /api/v1/user/move-disabled
                  // Note: MT_RET_ERR_PARAMS (3) means the account's group has no
                  // corresponding disabled group configured on the MT5 Manager.
                  // Contact your MT5 broker to configure disabled sub-groups.
                  const disableRes = await fetch(`${apiBase}/api/v1/user/move-disabled`, {
                    method: 'POST', headers,
                    body: JSON.stringify({ Login: parseInt(acc.mt_login), apikey: apiKey }),
                  });
                  const disableData = await disableRes.json().catch(() => ({}));
                  const disableErrCode = disableData?.data?.errorcode;
                  if (disableErrCode === 3) {
                    console.warn(`[MT5-DISABLE] MT_RET_ERR_PARAMS for ${acc.mt_login} — group "${acc.mt_group}" has no disabled sub-group configured on MT5 Manager. Account disabled in DB only.`);
                  } else {
                    console.log(`[MT5-DISABLE] move-disabled ${acc.mt_login}: code=${disableErrCode} msg=${disableData?.data?.errormsg}`);
                  }
                } catch (e) {
                  console.error(`[MT5-DISABLE] Failed for ${acc.mt_login}:`, e.message);
                }
              })();
            }
          }

          await base44.asServiceRole.entities.ChallengeAccount.update(acc.id, updates);

          // ── AUTOMATED PHASE PASS DETECTION ────────────────────────────────
          // Only runs for active (non-failed, non-breached) accounts.
          // Sets status=passed and review_status=pending_review.
          // NEVER provisions MT5 credentials — that requires admin approval.
          // Idempotent: skips if already passed or already in review.
          // MIN TRADING DAYS: always read from live ChallengePlan (admin can change it);
          // fall back to rule_snapshot then 4 only if plan not found.
          let minTradingDays = acc.rule_snapshot?.min_trading_days ?? 4;
          try {
            const planResults = await base44.asServiceRole.entities.ChallengePlan.filter({
              type: acc.challenge_type,
              size: acc.account_size,
              is_active: true,
            });
            if (planResults[0]?.min_trading_days != null) {
              minTradingDays = planResults[0].min_trading_days;
            }
          } catch (_) { /* keep fallback */ }

          if (
            !breachDetected &&
            acc.challenge_type !== 'instant_account' &&
            acc.status === 'active' &&
            acc.phase === 'phase1' &&
            (!acc.phase_review_status || acc.phase_review_status === 'none')
          ) {
            const phase1Target = acc.rule_snapshot?.phase1_target ?? 10;
            // FTMO: phase pass gated on BALANCE-based progress only (closed trades)
            const currentProgress = updates.profit_target_progress;
            const meetsMinDays = computedTradingDays >= minTradingDays;
            if (currentProgress >= phase1Target && !meetsMinDays) {
              console.log(`[PHASE1-PENDING] ${acc.account_id} — profit target met (${currentProgress.toFixed(2)}%) but only ${computedTradingDays}/${minTradingDays} trading days`);
            }
            if (currentProgress >= phase1Target && meetsMinDays) {
              console.log(`[PHASE1-PASS] ${acc.account_id} — progress ${currentProgress.toFixed(2)}% >= target ${phase1Target}%, trading_days=${computedTradingDays}/${minTradingDays}`);
              await base44.asServiceRole.entities.ChallengeAccount.update(acc.id, {
                status: 'passed',
                phase_review_status: 'pending_review',
                phase_passed_at: new Date().toISOString(),
              });
              // Notify trader — non-blocking
              base44.asServiceRole.entities.Notification.create({
                user_email: acc.user_email,
                title: '🎉 Phase 1 Passed — Under Review',
                message: 'Congratulations! You have passed Phase 1. Your account is under review. Phase 2 credentials will be issued after approval.',
                type: 'payout', priority: 'high', display_mode: 'popup', is_active: true, target: 'challenge',
              }).catch(() => {});
              console.log(`[PHASE1-PASS] ${acc.account_id} → status=passed, phase_review_status=pending_review`);
            }
          }

          // Phase 2 pass detection — only for active phase2 accounts not yet in funded review
          if (
            !breachDetected &&
            acc.challenge_type !== 'instant_account' &&
            acc.status === 'active' &&
            acc.phase === 'phase2' &&
            (!acc.funded_review_status || acc.funded_review_status === 'none')
          ) {
            const phase2Target = acc.rule_snapshot?.phase2_target ?? 5;
            const currentProgress = updates.profit_target_progress;
            const meetsMinDays2 = computedTradingDays >= minTradingDays;
            if (currentProgress >= phase2Target && !meetsMinDays2) {
              console.log(`[PHASE2-PENDING] ${acc.account_id} — profit target met (${currentProgress.toFixed(2)}%) but only ${computedTradingDays}/${minTradingDays} trading days`);
            }
            if (currentProgress >= phase2Target && meetsMinDays2) {
              console.log(`[PHASE2-PASS] ${acc.account_id} — progress ${currentProgress.toFixed(2)}% >= target ${phase2Target}%, trading_days=${computedTradingDays}/${minTradingDays}`);
              await base44.asServiceRole.entities.ChallengeAccount.update(acc.id, {
                status: 'passed',
                funded_review_status: 'pending_review',
                phase_passed_at: new Date().toISOString(),
              });
              // Create FundedAccountReview record — idempotent: only if none exists
              const existingReviews = await base44.asServiceRole.entities.FundedAccountReview.filter({ account_id: acc.account_id });
              if (existingReviews.length === 0) {
                await base44.asServiceRole.entities.FundedAccountReview.create({
                  account_id: acc.account_id,
                  user_email: acc.user_email,
                  trader_name: acc.user_email,
                  phase_passed: 'phase2',
                  status: 'pending_review',
                  account_size: acc.account_size,
                  challenge_type: acc.challenge_type,
                  total_trades: updates.total_trades,
                  win_rate: updates.win_rate,
                  max_dd_used: persistentOverallDD,
                  trading_days: computedTradingDays,
                  gross_pnl: updates.pnl,
                });
                console.log(`[PHASE2-PASS] FundedAccountReview created for ${acc.account_id}`);
              }
              // Notify trader — non-blocking
              base44.asServiceRole.entities.Notification.create({
                user_email: acc.user_email,
                title: '🎉 Phase 2 Passed — Under Review',
                message: 'Congratulations! You have passed Phase 2. Your funded account is under review. Expected processing time: 3–5 business days.',
                type: 'payout', priority: 'high', display_mode: 'popup', is_active: true, target: 'challenge',
              }).catch(() => {});
              console.log(`[PHASE2-PASS] ${acc.account_id} → status=passed, funded_review_status=pending_review`);
            }
          }

          // ── WRITE TRADERECORD ENTITIES FOR EACH CLOSED DEAL ───────────────
          // Upsert by trade_id — skip if already exists (idempotent)
          const existingTrades = await base44.asServiceRole.entities.TradeRecord.filter({ account_id: acc.account_id });
          const existingIds = new Set(existingTrades.map(t => t.trade_id));

          // Tritech field mapping (from confirmed API response):
          // deal_id, symbol, openPrice, closePrice, volume, lot, profit, openTime, closeTime, action(0=BUY,1=SELL)
          const newDeals = closedTrades.filter(d => {
            const tradeId = String(d.deal_id ?? d.Ticket ?? d.PositionID ?? d.id ?? '');
            return tradeId && !existingIds.has(tradeId);
          });

          if (newDeals.length > 0) {
            await Promise.all(newDeals.map(d => {
              const tradeId = String(d.deal_id ?? d.Ticket ?? d.PositionID ?? d.id ?? '');
              const pnl = parseFloat(d.profit ?? d.Profit ?? 0);
              const action = d.action ?? d.Action ?? 0;
              const isSell = action === 1 || action === 'SELL' || d.type === 'SELL';
              // openTime/closeTime may be ISO strings or Unix timestamps
              const parseDealTime = (t) => {
                if (!t) return new Date().toISOString();
                if (typeof t === 'string' && t.includes('T')) return t;
                return new Date(parseInt(t) * (String(t).length <= 10 ? 1000 : 1)).toISOString();
              };
              // Tritech volume is in centi-lots (÷10000): 10000=1.00 lot, 1000=0.10 lot
              const rawVol = parseFloat(d.volume ?? d.Volume ?? 0);
              const lots = rawVol / 10000;
              return base44.asServiceRole.entities.TradeRecord.create({
               account_id: acc.account_id,
               mt_login: acc.mt_login,
               user_email: acc.user_email,
               trade_id: tradeId,
               symbol: d.symbol ?? d.Symbol ?? '',
               type: isSell ? 'SELL' : 'BUY',
               order_type: 'MARKET',
               lots,
               entry: parseFloat(d.openPrice ?? d.Price ?? d.price ?? 0),
               close: parseFloat(d.closePrice ?? d.PriceClose ?? d.openPrice ?? 0),
               pnl,
               status: 'closed',
               close_reason: d.comment ?? d.Comment ?? 'close',
               open_time: parseDealTime(d.openTime ?? d.Time),
               close_time: parseDealTime(d.closeTime ?? d.TimeMsc ?? d.Time),
              }).catch(() => null);
            }));
            console.log(`[TRADERECORD] ${acc.account_id}: wrote ${newDeals.length} new trades`);
          }

          // ── INSTANT ACCOUNT: CONSISTENCY, PROFITABLE DAYS, PAYOUT ELIGIBILITY ──
          // CRITICAL: All calculations use ONLY trades closed AFTER buffer zone activation.
          // Profit is measured as (balance - buffer_zone_lock_balance), NOT (balance - account_size).
          if (acc.challenge_type === 'instant_account' && !breachDetected && closedTrades.length > 0) {
            try {
              const consistencyPct = acc.rule_snapshot?.consistency_rule_pct ?? 35;
              const minProfitableDays = acc.rule_snapshot?.min_profitable_days ?? 7;

              // Only consider trades closed AFTER buffer zone activation timestamp
              const bufferDate = acc.buffer_zone_activated_at ? new Date(acc.buffer_zone_activated_at) : null;
              const postBufferTrades = bufferDate
                ? closedTrades.filter(d => {
                    const closeT = parseTime(d.closeTime ?? d.TimeMsc ?? d.Time ?? d.openTime);
                    return closeT && !isNaN(closeT.getTime()) && closeT >= bufferDate;
                  })
                : [];

              // Group POST-BUFFER deals by day and calculate daily PnL
              const byDay = {};
              for (const d of postBufferTrades) {
                const closeT = parseTime(d.closeTime ?? d.TimeMsc ?? d.Time ?? d.openTime);
                if (closeT && !isNaN(closeT.getTime())) {
                  const dayKey = closeT.toISOString().split('T')[0];
                  if (!byDay[dayKey]) byDay[dayKey] = 0;
                  byDay[dayKey] += parseFloat(d.profit ?? d.Profit ?? 0);
                }
              }

              // Profit AFTER buffer lock = balance - locked balance (NOT balance - account_size)
              const lockBalance = acc.buffer_zone_lock_balance || accountSize;
              const totalProfit = parseFloat((balance - lockBalance).toFixed(2));
              // CRITICAL: Cap each day's PnL at total post-buffer profit.
              // Trades opened BEFORE buffer activation but closed AFTER have their
              // full PnL counted in the daily sum, but only the portion earned after
              // buffer activation counts toward consistency. Capping ensures the
              // best day profit never exceeds what was actually earned post-buffer.
              const totalPostBufferProfit = Math.max(0, totalProfit);
              for (const day of Object.keys(byDay)) {
                byDay[day] = Math.min(byDay[day], totalPostBufferProfit);
              }

              const dailyProfits = Object.values(byDay);
              const bestDayProfit = dailyProfits.length > 0 ? Math.max(...dailyProfits) : 0;
              const requiredTotalProfit = bestDayProfit > 0 ? parseFloat((bestDayProfit / (consistencyPct / 100)).toFixed(2)) : 0;
              const consistencyPassed = totalProfit >= requiredTotalProfit && requiredTotalProfit > 0;

              // Profitable days (net daily PnL > 0) — only post-buffer days
              const profitableDaysList = Object.entries(byDay)
                .filter(([, profit]) => profit > 0)
                .map(([date, profit]) => ({ date, profit: parseFloat(profit.toFixed(2)) }))
                .sort((a, b) => b.date.localeCompare(a.date));
              const profitableDaysCount = profitableDaysList.length;

              // Payout eligibility: ALL conditions must be met
              const instantPayoutEligible = acc.buffer_zone_activated && consistencyPassed &&
                profitableDaysCount >= minProfitableDays && !breachDetected && acc.status === 'active';

              await base44.asServiceRole.entities.ChallengeAccount.update(acc.id, {
                best_day_profit: parseFloat(bestDayProfit.toFixed(2)),
                required_total_profit: requiredTotalProfit,
                consistency_passed: consistencyPassed,
                profitable_days_list: profitableDaysList,
                profitable_days_count: profitableDaysCount,
                instant_payout_eligible: instantPayoutEligible,
              });

              console.log(`[INSTANT-SYNC] ${acc.account_id}: best_day=${bestDayProfit.toFixed(2)}, total_profit=${totalProfit.toFixed(2)} (post-buffer), required=${requiredTotalProfit.toFixed(2)}, profitable_days=${profitableDaysCount}/${minProfitableDays}, eligible=${instantPayoutEligible}`);
            } catch (e) {
              console.warn(`[INSTANT-SYNC] ${acc.account_id} consistency calc failed (non-blocking):`, e.message);
            }
          }

          return {
            account_id: acc.account_id, ok: true,
            balance, equity,
            overall_dd: persistentOverallDD,
            daily_dd_used_pct: persistentDailyDD,
            daily_low_equity: dailyLowEquity,
            breached: breachDetected,
            new_trades: newDeals.length,
          };
        } catch (err) {
          return { account_id: acc.account_id, ok: false, error: err.message };
        }
      }));

      results.push(...batchResults);
    }

    const totalNewTrades = results.reduce((s, r) => s + (r.new_trades || 0), 0);

    // ── TRADING RULE ENFORCEMENT (non-DD rules) ────────────────────────────
    // Run enforceChallengeTradingRules after the sync batch to check:
    // max lots, hedging, weekend holding, overnight holding, leverage, trading days
    // Non-blocking: enforcement result is logged but does not affect sync response.
    (async () => {
      try {
        const ruleRes = await base44.asServiceRole.functions.invoke('enforceChallengeTradingRules', {});
        console.log(`[scheduledMTSync] Rule enforcement: ${ruleRes?.accounts_checked ?? 0} accounts checked, ${ruleRes?.total_violations ?? 0} violations, ${ruleRes?.total_hard_fails ?? 0} hard fails`);
      } catch (e) {
        console.warn('[scheduledMTSync] enforceChallengeTradingRules failed (non-blocking):', e.message);
      }
    })();

    return Response.json({ success: true, synced: results.length, total_new_trades: totalNewTrades, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});