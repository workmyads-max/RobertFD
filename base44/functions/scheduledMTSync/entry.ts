/**
 * scheduledMTSync — Batch MT5/Match Trader sync
 * Runs every 5 minutes via scheduled automation.
 *
 * INSTITUTIONAL DD ENFORCEMENT (FTMO/E8/FundedNext standard):
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
 *   - Closed profits do NOT increase daily DD allowance
 *
 * BREACH:
 *   - Detected inside the sync — no waiting for automatedDDBreach
 *   - status='failed' written in same DB update as breach flags
 *   - Breach flags (dd_breach_detected, dd_breach_type, dd_breach_time, dd_breach_value)
 *     are written once and NEVER overwritten
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Read DD limits from the account's rule_snapshot (written at purchase time).
 * Falls back to legacy hardcoded values only if snapshot is absent (pre-migration accounts).
 */
function getDDLimits(acc) {
  const snap = acc.rule_snapshot || {};
  const dailyLimit = snap.daily_dd_limit ?? 5;
  const overallLimit = snap.max_dd_limit ?? (acc.challenge_type === 'instant_light' ? 6 : 10);
  const isTrailing = snap.trailing_dd ?? (acc.challenge_type === 'instant_light');
  return { dailyLimit, overallLimit, isTrailing };
}

/**
 * Calculate current overall DD%.
 * Instant Light uses trailing DD from high water mark.
 */
function calcOverallDD(acc, equity, newHWM) {
  const accountSize = acc.account_size || 100000;
  // Use snapshot trailing_dd flag; fall back to challenge_type check for pre-migration accounts
  const isTrailing = acc.rule_snapshot?.trailing_dd ?? (acc.challenge_type === 'instant_light');
  if (isTrailing) {
    const hwm = newHWM || accountSize;
    return hwm > 0 ? Math.max(0, ((hwm - equity) / hwm) * 100) : 0;
  }
  return Math.max(0, ((accountSize - equity) / accountSize) * 100);
}

/**
 * Calculate current daily DD%.
 * Uses daily_start_balance as the base — true institutional formula.
 * daily_start_balance is set at 23:00 UTC daily reset and never changes intraday.
 */
function calcDailyDD(acc, equity) {
  const base = acc.daily_start_balance || acc.account_size || 100000;
  return base > 0 ? Math.max(0, ((base - equity) / base) * 100) : 0;
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
    const activeAccounts = allAccounts.filter(a =>
      a.mt_login &&
      ['active', 'funded', 'passed'].includes(a.status) &&
      a.platform === 'mt5'
    );

    // Pre-fetch MT5 credentials directly from entity (avoids function auth chain issues)
    const mt5Providers = await base44.asServiceRole.entities.TradingPlatformProvider.filter({ platform_name: 'mt5', is_active: true });
    const mt5Provider = mt5Providers[0];
    const mt5Creds = mt5Provider ? {
      api_key: mt5Provider.api_key,
      server_url: mt5Provider.server_url || Deno.env.get('MT5_API_BASE_URL'),
      server_name: mt5Provider.server_name || Deno.env.get('MT5_SERVER_NAME') || 'XyloMarkets-Server',
      success: true,
    } : (Deno.env.get('MT5_API_KEY') ? {
      api_key: Deno.env.get('MT5_API_KEY'),
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

          if (!apiBase || !apiKey) {
            return { account_id: acc.account_id, ok: false, error: 'Invalid MT5 API config' };
          }

          const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`, 'ApiKey': apiKey };
          const loginNum = parseInt(acc.mt_login);
          // ISO date format required by the full Tritech schema
          const fromDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
          const toDate = new Date().toISOString();

          // PRIMARY: userget — confirmed working, returns balance/equity
          // SECONDARY: get-deal-history — queried by LOGIN NUMBER ONLY (no groups dependency)
          const [infoRes, histRes] = await Promise.all([
            fetch(`${apiBase}/api/v1/user/userget`, {
              method: 'POST', headers,
              body: JSON.stringify({ Login: loginNum, apikey: apiKey }),
            }),
            fetch(`${apiBase}/api/v1/deal/get-deal-history`, {
              method: 'POST', headers,
              body: JSON.stringify({
                logins: [loginNum],   // ← login-based query, NOT groups
                groups: [],           // empty — do not filter by group
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
              }),
            }).catch(() => ({ ok: false })),
          ]);

          let mtData = {};
          let deals = [];
          if (infoRes.ok) {
            try {
              const r = await infoRes.json();
              // Tritech userget response: { data: { balance, equity, ... }, resultCode: "200" }
              mtData = r?.data || r?.User || r?.Data || r || {};
            } catch { /* use empty mtData, will fallback to DB values */ }
          } else {
            console.warn(`[sync] userget returned non-OK for ${acc.account_id} (login ${loginNum})`);
          }
          if (histRes.ok) {
            try {
              const r = await histRes.json();
              // Tritech deal history: { data: [...deals], resultCode: "200" }
              const dealArr = r?.data || r?.Deals || r?.Data || r;
              deals = Array.isArray(dealArr) ? dealArr : [];
            } catch { /* no trades this cycle */ }
          } else {
            console.warn(`[sync] get-deal-history returned non-OK for ${acc.account_id} — skipping trade records this cycle`);
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
          } else if (isRecentlyProvisioned || (acc.balance || 0) > 0) {
            // Async deposit pending OR API temporarily returning 0 — keep DB value
            balance = acc.balance || acc.account_size || 0;
            equity  = acc.equity  || acc.balance || acc.account_size || 0;
            console.log(`[sync] ${acc.account_id} API returned 0 — keeping DB values (balance=${balance}, recently_provisioned=${isRecentlyProvisioned})`);
          } else {
            balance = 0;
            equity  = 0;
          }
          // MT5 deal Entry field: 0=IN (open), 1=OUT (close), 2=INOUT
          const closedTrades = deals.filter(d => d.Entry === 1 || d.entry === 1 || d.Entry === 'OUT' || d.entry === 'OUT');
          const wins = closedTrades.filter(d => (d.Profit ?? d.profit ?? 0) > 0).length;
          const winRate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0;
          const accountSize = acc.account_size || 100000;
          const newHWM = Math.max(acc.high_water_mark || 0, balance);

          // ── TRUE INSTITUTIONAL DD CALCULATIONS ─────────────────────────────
          const currentOverallDD = calcOverallDD(acc, equity, newHWM);
          const currentDailyDD = calcDailyDD(acc, equity);

          // ── PERSISTENT DD — only ever increases (Math.max) ─────────────────
          const persistentOverallDD = parseFloat(Math.max(acc.max_drawdown_used || 0, currentOverallDD).toFixed(2));
          const persistentDailyDD = parseFloat(Math.max(acc.daily_drawdown_used || 0, currentDailyDD).toFixed(2));

          const { dailyLimit, overallLimit } = getDDLimits(acc);

          // ── BREACH DETECTION — fires in same sync, no delay ────────────────
          // Once breachDetected is true, it is NEVER set to false again
          let breachDetected = acc.dd_breach_detected || false;
          let breachType = acc.dd_breach_type || null;
          let breachTime = acc.dd_breach_time || null;
          let breachValue = acc.dd_breach_value || null;

          if (!breachDetected) {
            if (persistentOverallDD >= overallLimit) {
              breachDetected = true;
              breachType = (acc.rule_snapshot?.trailing_dd ?? acc.challenge_type === 'instant_light') ? 'trailing' : 'overall';
              breachTime = new Date().toISOString();
              breachValue = persistentOverallDD;
              console.log(`[BREACH] ${acc.account_id} overall DD: ${persistentOverallDD.toFixed(2)}% / limit ${overallLimit}%`);
            } else if (persistentDailyDD >= dailyLimit) {
              breachDetected = true;
              breachType = 'daily';
              breachTime = new Date().toISOString();
              breachValue = persistentDailyDD;
              console.log(`[BREACH] ${acc.account_id} daily DD: ${persistentDailyDD.toFixed(2)}% / limit ${dailyLimit}%`);
            }
          }

          const updates = {
            balance,
            equity,
            pnl: parseFloat((balance - accountSize).toFixed(2)),
            win_rate: parseFloat(winRate.toFixed(1)),
            total_trades: closedTrades.length,
            max_drawdown_used: persistentOverallDD,   // PERSISTENT — Math.max
            daily_drawdown_used: persistentDailyDD,   // PERSISTENT — Math.max
            profit_target_progress: parseFloat(Math.max(0, (balance - accountSize) / accountSize * 100).toFixed(2)),
            high_water_mark: newHWM,
            last_synced_at: new Date().toISOString(),
            dd_breach_detected: breachDetected,
            // Breach flags written ONCE — spread operator skips nulls
            ...(breachType && !acc.dd_breach_type && { dd_breach_type: breachType }),
            ...(breachTime && !acc.dd_breach_time && { dd_breach_time: breachTime }),
            ...(breachValue !== null && !acc.dd_breach_value && { dd_breach_value: breachValue }),
          };

          // Immediate failure — same DB write, no waiting for automatedDDBreach
          if (breachDetected && acc.status !== 'failed') {
            updates.status = 'failed';
            console.log(`[AUTO-FAIL] ${acc.account_id} → failed (${breachType}: ${breachValue?.toFixed(2)}%)`);

            // ── BROKER-SIDE DISABLE — non-blocking ─────────────────────────────
            if (acc.platform === 'mt5' && acc.mt_login) {
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
          if (
            !breachDetected &&
            acc.status === 'active' &&
            acc.phase === 'phase1' &&
            (!acc.phase_review_status || acc.phase_review_status === 'none')
          ) {
            const phase1Target = acc.rule_snapshot?.phase1_target ?? 10;
            const currentProgress = updates.profit_target_progress;
            if (currentProgress >= phase1Target) {
              console.log(`[PHASE1-PASS] ${acc.account_id} — progress ${currentProgress.toFixed(2)}% >= target ${phase1Target}%`);
              await base44.asServiceRole.entities.ChallengeAccount.update(acc.id, {
                status: 'passed',
                phase_review_status: 'pending_review',
                phase_passed_at: new Date().toISOString(),
              });
              // Notify trader — non-blocking
              base44.asServiceRole.entities.Notification.create({
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
            acc.status === 'active' &&
            acc.phase === 'phase2' &&
            (!acc.funded_review_status || acc.funded_review_status === 'none')
          ) {
            const phase2Target = acc.rule_snapshot?.phase2_target ?? 5;
            const currentProgress = updates.profit_target_progress;
            if (currentProgress >= phase2Target) {
              console.log(`[PHASE2-PASS] ${acc.account_id} — progress ${currentProgress.toFixed(2)}% >= target ${phase2Target}%`);
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
                  trading_days: acc.trading_days || 0,
                  gross_pnl: updates.pnl,
                });
                console.log(`[PHASE2-PASS] FundedAccountReview created for ${acc.account_id}`);
              }
              // Notify trader — non-blocking
              base44.asServiceRole.entities.Notification.create({
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

          // Tritech deal identifiers: Ticket (deal ID) or PositionID
          const newDeals = closedTrades.filter(d => {
            const tradeId = String(d.Ticket || d.PositionID || d.positionId || d.deal || d.id || '');
            return tradeId && !existingIds.has(tradeId);
          });

          if (newDeals.length > 0) {
            await Promise.all(newDeals.map(d => {
              const tradeId = String(d.Ticket || d.PositionID || d.positionId || d.deal || d.id || '');
              const pnl = parseFloat(d.Profit ?? d.profit ?? 0);
              // MT5 Action: 0=BUY, 1=SELL; Time is Unix timestamp (seconds)
              return base44.asServiceRole.entities.TradeRecord.create({
                account_id: acc.account_id,
                user_email: acc.user_email,
                trade_id: tradeId,
                symbol: d.Symbol || d.symbol || d.instrument || '',
                type: (d.Action === 1 || d.type === 'SELL' || d.side === 'sell') ? 'SELL' : 'BUY',
                order_type: 'MARKET',
                lots: parseFloat(d.Volume ?? d.volume ?? d.lots ?? 0),
                entry: parseFloat(d.Price ?? d.price ?? d.openPrice ?? 0),
                close: parseFloat(d.PriceClose ?? d.closePrice ?? d.Price ?? d.price ?? 0),
                pnl,
                status: 'closed',
                close_reason: d.Comment || d.comment || d.reason || 'close',
                open_time: d.Time ? new Date(parseInt(d.Time) * 1000).toISOString() : (d.openTime || new Date().toISOString()),
                close_time: d.TimeMsc ? new Date(parseInt(d.TimeMsc) / 1000).toISOString() : (d.Time ? new Date(parseInt(d.Time) * 1000).toISOString() : new Date().toISOString()),
              }).catch(() => null);
            }));
            console.log(`[TRADERECORD] ${acc.account_id}: wrote ${newDeals.length} new trades`);
          }

          return {
            account_id: acc.account_id, ok: true,
            balance, equity,
            overall_dd: persistentOverallDD, daily_dd: persistentDailyDD,
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
    return Response.json({ success: true, synced: results.length, total_new_trades: totalNewTrades, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});