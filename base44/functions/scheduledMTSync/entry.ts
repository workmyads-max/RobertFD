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

    const allAccounts = await base44.asServiceRole.entities.ChallengeAccount.list('-created_date', 500);
    const activeAccounts = allAccounts.filter(a =>
      a.mt_login &&
      ['active', 'funded', 'passed'].includes(a.status) &&
      ['mt5', 'match_trader'].includes(a.platform)
    );

    // Pre-fetch credentials for both platforms to avoid repeated database lookups
    const mt5CredsRes = await base44.asServiceRole.functions.invoke('getPlatformCredentials', { platform: 'mt5' });
    const mtCredsRes = await base44.asServiceRole.functions.invoke('getPlatformCredentials', { platform: 'match_trader' });
    
    const mt5Creds = mt5CredsRes.data?.success ? mt5CredsRes.data : null;
    const mtCreds = mtCredsRes.data?.success ? mtCredsRes.data : null;

    const results = [];
    const BATCH_SIZE = 50;

    for (let batchStart = 0; batchStart < activeAccounts.length; batchStart += BATCH_SIZE) {
      const batch = activeAccounts.slice(batchStart, batchStart + BATCH_SIZE);

      const batchResults = await Promise.all(batch.map(async (acc) => {
        try {
          const isMT5 = acc.platform === 'mt5';
          const creds = isMT5 ? mt5Creds : mtCreds;

          if (!creds) {
            return { account_id: acc.account_id, ok: false, error: `Missing API credentials for ${acc.platform}` };
          }

          const apiBase = creds.server_url || (isMT5 
            ? Deno.env.get('MT5_API_BASE_URL')
            : Deno.env.get('MATCH_TRADER_BASE_URL'));
          const apiKey = creds.api_key;

          if (!apiBase || !apiKey) {
            return { account_id: acc.account_id, ok: false, error: `Invalid API config: ${acc.platform}` };
          }

          const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'api-key': apiKey,
          };

          const [infoRes, , histRes] = await Promise.all([
            fetch(`${apiBase}/accounts/${acc.mt_login}`, { headers }),
            fetch(`${apiBase}/accounts/${acc.mt_login}/positions`, { headers }),
            fetch(`${apiBase}/accounts/${acc.mt_login}/deals?limit=100`, { headers }),
          ]);

          let mtData = {};
          let deals = [];
          if (infoRes.ok) mtData = await infoRes.json();
          if (histRes.ok) { const d = await histRes.json(); deals = d?.deals || d || []; }

          const balance = mtData?.balance ?? acc.balance ?? 0;
          const equity = mtData?.equity ?? acc.equity ?? 0;
          const closedTrades = deals.filter(d => d.entry === 'OUT' || d.positionId);
          const wins = closedTrades.filter(d => (d.profit || 0) > 0).length;
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
                  const res1 = await fetch(`${apiBase}/accounts/${acc.mt_login}/disable`, {
                    method: 'PUT', headers,
                    body: JSON.stringify({ reason: disableReason }),
                  });
                  if (!res1.ok) {
                    await fetch(`${apiBase}/accounts/${acc.mt_login}`, {
                      method: 'PUT', headers,
                      body: JSON.stringify({ enabled: false, readonly: true, reason: disableReason }),
                    });
                  }
                  console.log(`[MT5-DISABLE] Account ${acc.mt_login} disabled at broker`);
                } catch (e) {
                  console.error(`[MT5-DISABLE] Failed for ${acc.mt_login}:`, e.message);
                }
              })();
            }
          }

          await base44.asServiceRole.entities.ChallengeAccount.update(acc.id, updates);

          // ── WRITE TRADERECORD ENTITIES FOR EACH CLOSED DEAL ───────────────
          // Upsert by trade_id — skip if already exists (idempotent)
          const existingTrades = await base44.asServiceRole.entities.TradeRecord.filter({ account_id: acc.account_id });
          const existingIds = new Set(existingTrades.map(t => t.trade_id));

          const newDeals = closedTrades.filter(d => {
            const tradeId = String(d.positionId || d.deal || d.id || '');
            return tradeId && !existingIds.has(tradeId);
          });

          if (newDeals.length > 0) {
            await Promise.all(newDeals.map(d => {
              const tradeId = String(d.positionId || d.deal || d.id || '');
              const pnl = parseFloat(d.profit ?? 0);
              return base44.asServiceRole.entities.TradeRecord.create({
                account_id: acc.account_id,
                user_email: acc.user_email,
                trade_id: tradeId,
                symbol: d.symbol || d.instrument || '',
                type: (d.type === 'SELL' || d.side === 'sell' || d.direction === 'SELL') ? 'SELL' : 'BUY',
                order_type: 'MARKET',
                lots: parseFloat(d.volume ?? d.lots ?? 0),
                entry: parseFloat(d.price ?? d.openPrice ?? d.entry ?? 0),
                close: parseFloat(d.closePrice ?? d.exitPrice ?? d.price ?? 0),
                sl: parseFloat(d.sl ?? d.stopLoss ?? 0) || undefined,
                tp: parseFloat(d.tp ?? d.takeProfit ?? 0) || undefined,
                pnl,
                status: 'closed',
                close_reason: d.comment || d.reason || 'close',
                open_time: d.openTime || d.time || new Date().toISOString(),
                close_time: d.closeTime || d.time || new Date().toISOString(),
              }).catch(() => null); // non-blocking per trade
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