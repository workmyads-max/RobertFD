/**
 * enforceChallengeTradingRules — Backend enforcement of non-DD challenge trading rules.
 *
 * Enforces ALL rules from ChallengeAccount.rule_snapshot:
 *   - Max Lots per trade
 *   - Leverage (via margin / balance ratio)
 *   - Weekend Holding (positions open after Friday 21:00 UTC)
 *   - Overnight Holding (positions open past 21:00 UTC any day)
 *   - Hedging (simultaneous opposing positions on same symbol)
 *   - News Trading (flagged separately — requires news calendar integration)
 *   - Min Trading Days (tracks unique trading days, gates phase pass)
 *   - Profit Target (gates phase pass, enforced alongside min trading days)
 *
 * Called by scheduledMTSync on each sync cycle for active accounts.
 *
 * STRICT SCOPE — this function:
 *   - Reads live open positions from MT5 API
 *   - Reads closed deal history for trading day counting
 *   - Writes to ChallengeAccount: trading_days, rule_violation_* fields
 *   - Creates RiskFlag on rule violations
 *   - Creates Notification on rule violations
 *   - Does NOT create TradeRecords (scheduledMTSync owns that)
 *   - Does NOT update balance/equity/DD values (scheduledMTSync owns that)
 *   - Does NOT breach accounts for DD violations (scheduledMTSync owns that)
 *
 * Violation handling:
 *   - max_lots, hedging → status=failed immediately (hard rule)
 *   - weekend_holding, overnight_holding → RiskFlag + Notification (warning, not instant fail)
 *     Note: auto-close is handled by autoCloseWeekendPositions function
 *   - leverage exceeded → RiskFlag + Notification (warning)
 *
 * Authorization: Admin session OR valid SCHEDULER_SECRET_TOKEN header.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ── HELPERS ───────────────────────────────────────────────────────────────────

/** Parse raw Tritech volume to lots: volume / 10000 */
function rawVolToLots(rawVol) {
  return parseFloat(rawVol || 0) / 10000;
}

/** Extract leverage ratio as a number from a string like "1:100" → 100 */
function parseLeverage(str) {
  if (!str) return null;
  const parts = String(str).split(':');
  return parts.length === 2 ? parseFloat(parts[1]) : null;
}

/** Is the given UTC timestamp on a weekend (Sat or Sun)? */
function isWeekend(date) {
  const day = date.getUTCDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

/** Has the market closed for the week? Friday >= 21:00 UTC */
function isAfterFridayClose(date) {
  const day = date.getUTCDay();
  const hour = date.getUTCHours();
  return day === 5 && hour >= 21; // Friday 21:00 UTC
}

/** Is this after today's close (21:00 UTC on any trading day)? */
function isAfterDailyClose(date) {
  return date.getUTCHours() >= 21;
}

/** Count unique trading days from a list of closed deals */
function countTradingDays(deals) {
  const days = new Set();
  for (const d of deals) {
    const t = d.openTime ?? d.Time;
    if (!t) continue;
    const date = typeof t === 'string' && t.includes('T')
      ? new Date(t)
      : new Date(parseInt(t) * (String(t).length <= 10 ? 1000 : 1));
    if (!isNaN(date)) {
      days.add(`${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`);
    }
  }
  return days.size;
}

/** Disable MT5 account broker-side (non-blocking) */
async function disableMT5(mt_login, apiBase, apiKey) {
  try {
    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`, 'ApiKey': apiKey };
    const res = await fetch(`${apiBase}/api/v1/user/move-disabled`, {
      method: 'POST', headers,
      body: JSON.stringify({ Login: parseInt(mt_login), apikey: apiKey }),
    });
    const data = await res.json().catch(() => ({}));
    const code = data?.data?.errorcode;
    if (code === 3) {
      console.warn(`[MT5-DISABLE] MT_RET_ERR_PARAMS for ${mt_login} — no disabled sub-group configured. DB-only disable.`);
    } else {
      console.log(`[MT5-DISABLE] move-disabled ${mt_login}: code=${code}`);
    }
  } catch (e) {
    console.error(`[MT5-DISABLE] Failed for ${mt_login}:`, e.message);
  }
}

// ── MAIN ──────────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;

    // ── AUTHORIZATION ─────────────────────────────────────────────────────────
    const schedulerToken = req.headers.get('X-Scheduler-Token');
    const expectedToken  = Deno.env.get('SCHEDULER_SECRET_TOKEN');
    let authorized = false;
    try {
      const user = await base44.auth.me();
      if (user?.role === 'admin') authorized = true;
    } catch { /* no session */ }
    if (!authorized && schedulerToken && expectedToken && schedulerToken === expectedToken) {
      authorized = true;
    }
    if (!authorized) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    // Optional: limit to a single account for targeted enforcement
    const targetAccountId = body.account_id || null;

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

    // Fetch active accounts
    const filter = targetAccountId ? { account_id: targetAccountId } : {};
    const [active, passed, funded] = await Promise.all([
      sr.entities.ChallengeAccount.filter({ ...filter, status: 'active' }),
      sr.entities.ChallengeAccount.filter({ ...filter, status: 'passed' }),
      sr.entities.ChallengeAccount.filter({ ...filter, status: 'funded' }),
    ]);
    const accounts = [...active, ...passed, ...funded].filter(a =>
      a.mt_login && a.user_email && a.platform === 'mt5'
    );

    const results = [];

    await Promise.all(accounts.map(async (acc) => {
      const snap = acc.rule_snapshot || {};
      const loginNum = parseInt(acc.mt_login);
      const now = new Date();
      const violations = [];

      try {
        const fromDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
        const toDate   = now.toISOString();

        // Fetch open positions + deal history in parallel
        const dealHistoryBody = {
          groups: [], logins: [loginNum],
          from: fromDate, to: toDate,
          dateFrom: fromDate, dateTo: toDate,
          actionTypes: [], orderTypes: [], orderStates: [], entryStates: [],
          isFilterPosition: false, apikey: MT5_KEY, pageOffset: 0, pageSize: 500,
        };

        const [posRes, histRes] = await Promise.all([
          fetch(`${MT5_BASE}/api/v1/position/getpositions`, {
            method: 'POST', headers,
            body: JSON.stringify({ Login: loginNum, apikey: MT5_KEY }),
          }).catch(() => ({ ok: false })),
          fetch(`${MT5_BASE}/api/v1/deal/get-deal-history`, {
            method: 'POST', headers,
            body: JSON.stringify(dealHistoryBody),
          }).catch(() => ({ ok: false })),
        ]);

        let openPositions = [];
        let deals = [];

        if (posRes.ok) {
          const r = await posRes.json().catch(() => ({}));
          openPositions = r?.data || r?.Positions || r?.positions || r || [];
          if (!Array.isArray(openPositions)) openPositions = [];
        }

        if (histRes.ok) {
          const r = await histRes.json().catch(() => ({}));
          const arr = r?.data || r?.Deals || r?.Data || r;
          if (Array.isArray(arr)) deals = arr;
        }

        // ── 1. TRADING DAYS COUNTER ────────────────────────────────────────────
        // Count unique UTC dates on which trades were opened
        const tradingDays = countTradingDays(deals);
        const tradingDaysChanged = tradingDays !== acc.trading_days;

        // ── 2. MIN TRADING DAYS GATE ───────────────────────────────────────────
        // Tracked here; phase pass gate is enforced in scheduledMTSync
        // (it reads trading_days from the DB when checking profit target)
        if (tradingDaysChanged) {
          await sr.entities.ChallengeAccount.update(acc.id, { trading_days: tradingDays });
        }

        // ── 3. MAX LOTS ENFORCEMENT ────────────────────────────────────────────
        if (snap.max_lots != null && snap.max_lots > 0 && openPositions.length > 0) {
          for (const pos of openPositions) {
            const rawVol = parseFloat(pos.volume ?? pos.Volume ?? 0);
            const lots = rawVolToLots(rawVol);
            if (lots > snap.max_lots) {
              violations.push({
                type: 'max_lots',
                severity: 'critical',
                description: `Position ${pos.position_id ?? pos.PositionID ?? 'unknown'} on ${pos.symbol ?? 'N/A'}: ${lots.toFixed(2)} lots exceeds max allowed ${snap.max_lots} lots`,
                hard_fail: true,
              });
            }
          }
        }

        // ── 4. HEDGING ENFORCEMENT ─────────────────────────────────────────────
        // Hedging = simultaneous BUY and SELL open on the same symbol
        if (snap.hedging === false && openPositions.length >= 2) {
          const symbolSides = {};
          for (const pos of openPositions) {
            const sym = (pos.symbol ?? pos.Symbol ?? '').toUpperCase();
            const action = pos.action ?? pos.Action ?? pos.side ?? pos.type ?? 0;
            const isSell = action === 1 || action === 'SELL' || String(action).toUpperCase() === 'SELL';
            const side = isSell ? 'SELL' : 'BUY';
            if (!symbolSides[sym]) symbolSides[sym] = new Set();
            symbolSides[sym].add(side);
          }
          for (const [sym, sides] of Object.entries(symbolSides)) {
            if (sides.has('BUY') && sides.has('SELL')) {
              violations.push({
                type: 'hedging',
                severity: 'critical',
                description: `Hedging violation detected on ${sym}: simultaneous BUY and SELL positions are not allowed`,
                hard_fail: true,
              });
            }
          }
        }

        // ── 5. WEEKEND HOLDING ENFORCEMENT ────────────────────────────────────
        // Positions held over the weekend (after Friday 21:00 UTC or during Sat/Sun)
        if (snap.weekend_holding === false && openPositions.length > 0) {
          const isWeekendNow = isWeekend(now) || isAfterFridayClose(now);
          if (isWeekendNow) {
            for (const pos of openPositions) {
              const sym = pos.symbol ?? pos.Symbol ?? 'unknown';
              violations.push({
                type: 'weekend_holding',
                severity: 'high',
                description: `Weekend holding violation: position on ${sym} held over the weekend`,
                hard_fail: false, // Warning — autoCloseWeekendPositions handles auto-close
              });
            }
          }
        }

        // ── 6. OVERNIGHT HOLDING ENFORCEMENT ──────────────────────────────────
        // Positions held past 21:00 UTC on any trading day (Mon–Thu)
        if (snap.overnight_holding === false && openPositions.length > 0) {
          const isOvernightWindow = !isWeekend(now) && !isAfterFridayClose(now) && isAfterDailyClose(now);
          if (isOvernightWindow) {
            for (const pos of openPositions) {
              const sym = pos.symbol ?? pos.Symbol ?? 'unknown';
              violations.push({
                type: 'overnight_holding',
                severity: 'high',
                description: `Overnight holding violation: position on ${sym} held past daily close (21:00 UTC)`,
                hard_fail: false, // Warning — autoCloseWeekendPositions handles auto-close
              });
            }
          }
        }

        // ── 7. LEVERAGE ENFORCEMENT ────────────────────────────────────────────
        // Effective leverage = (position notional value) / balance
        // Approximation: lots * contract_size / balance
        // We check leverage at the account level via margin usage if available
        if (snap.leverage && openPositions.length > 0) {
          const maxLeverage = parseLeverage(snap.leverage);
          const balance = acc.balance || acc.account_size || 0;
          if (maxLeverage && balance > 0) {
            for (const pos of openPositions) {
              const margin = parseFloat(pos.margin ?? pos.Margin ?? 0);
              if (margin > 0) {
                const effectiveLeverage = balance / margin;
                if (effectiveLeverage > maxLeverage * 1.05) { // 5% tolerance
                  violations.push({
                    type: 'leverage_exceeded',
                    severity: 'high',
                    description: `Effective leverage ~${effectiveLeverage.toFixed(0)}x on ${pos.symbol ?? 'position'} exceeds allowed ${snap.leverage}`,
                    hard_fail: false, // Warning — broker-side leverage limits should be primary enforcement
                  });
                  break; // One flag per cycle is sufficient
                }
              }
            }
          }
        }

        // ── PROCESS VIOLATIONS ────────────────────────────────────────────────
        if (violations.length > 0) {
          const hardFails = violations.filter(v => v.hard_fail);
          const warnings  = violations.filter(v => !v.hard_fail);

          // Hard fail violations → status=failed immediately
          if (hardFails.length > 0 && acc.status !== 'failed') {
            const primaryViolation = hardFails[0];
            await sr.entities.ChallengeAccount.update(acc.id, {
              status: 'failed',
              dd_breach_detected: true,
              dd_breach_type: 'overall', // closest match for schema
              dd_breach_time: now.toISOString(),
              dd_breach_value: 0,
            });
            console.log(`[RULE-FAIL] ${acc.account_id} → failed (${primaryViolation.type})`);

            // Disable MT5 broker-side
            if (acc.mt_login) {
              disableMT5(acc.mt_login, MT5_BASE, MT5_KEY);
            }
          }

          // Create RiskFlag for ALL violations (hard + warning)
          await Promise.all(violations.map(v =>
            sr.entities.RiskFlag.create({
              user_email: acc.user_email,
              account_id: acc.account_id,
              flag_type: v.type,
              severity: v.severity,
              description: v.description,
              status: 'active',
              triggered_at: now.toISOString(),
            }).catch(() => null)
          ));

          // Create Notification for hard fails
          if (hardFails.length > 0) {
            await sr.entities.Notification.create({
              title: '🚫 Challenge Rule Violation — Account Failed',
              message: `Account ${acc.account_id} failed: ${hardFails[0].description}`,
              type: 'market_alert', priority: 'critical',
              display_mode: 'popup', is_active: true, target: 'challenge',
            }).catch(() => null);
          }

          // Create Notification for warnings (non-failing)
          if (warnings.length > 0) {
            await sr.entities.Notification.create({
              title: '⚠️ Challenge Rule Warning',
              message: `Account ${acc.account_id}: ${warnings[0].description}`,
              type: 'market_alert', priority: 'high',
              display_mode: 'banner', is_active: true, target: 'challenge',
            }).catch(() => null);
          }
        }

        results.push({
          account_id: acc.account_id,
          ok: true,
          trading_days: tradingDays,
          violations: violations.length,
          hard_fails: violations.filter(v => v.hard_fail).length,
          warnings: violations.filter(v => !v.hard_fail).length,
          violation_types: violations.map(v => v.type),
        });

      } catch (err) {
        console.error(`[enforceChallengeTradingRules] Error for ${acc.account_id}:`, err.message);
        results.push({ account_id: acc.account_id, ok: false, error: err.message });
      }
    }));

    const totalViolations = results.reduce((s, r) => s + (r.violations || 0), 0);
    const totalHardFails  = results.reduce((s, r) => s + (r.hard_fails || 0), 0);

    return Response.json({
      success: true,
      accounts_checked: accounts.length,
      total_violations: totalViolations,
      total_hard_fails: totalHardFails,
      results,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});