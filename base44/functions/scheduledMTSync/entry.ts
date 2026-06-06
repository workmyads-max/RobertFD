/**
 * scheduledMTSync — Batch MT5/Match Trader sync with INSTITUTIONAL DD ENFORCEMENT
 *
 * CRITICAL RULES (FTMO/E8/FundedNext standard):
 * 1. max_drawdown_used is PERSISTENT — only ever increases, never decreases
 * 2. daily_drawdown_used is PERSISTENT within a trading day — only ever increases until daily reset
 * 3. Any DD breach immediately sets status='failed' and writes permanent breach flags
 * 4. Recovered equity CANNOT undo a breach — the worst DD is always stored
 * 5. Already-failed accounts are NEVER re-activated by a sync
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Returns the DD limits for a given account (challenge_type + account_type)
function getDDLimits(acc) {
  const dailyLimit = 5; // 5% for all types
  let overallLimit;
  if (acc.challenge_type === 'instant_light') {
    overallLimit = 6; // Trailing 6% for Instant Light
  } else {
    overallLimit = 10; // Standard 10% for Two-Step, Instant, Funded
  }
  return { dailyLimit, overallLimit };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const MT5_BASE = Deno.env.get('MT5_API_BASE_URL');
    const MT5_API_KEY = Deno.env.get('MT5_API_KEY');
    const MT_BASE = Deno.env.get('MATCH_TRADER_BASE_URL');
    const MT_API_KEY = Deno.env.get('MATCH_TRADER_API_KEY');

    const allAccounts = await base44.asServiceRole.entities.ChallengeAccount.list('-created_date', 500);
    const activeAccounts = allAccounts.filter(a =>
      a.mt_login &&
      ['active', 'funded', 'passed'].includes(a.status) &&
      ['mt5', 'match_trader'].includes(a.platform)
    );

    const results = [];
    const BATCH_SIZE = 50;

    for (let batchStart = 0; batchStart < activeAccounts.length; batchStart += BATCH_SIZE) {
      const batch = activeAccounts.slice(batchStart, batchStart + BATCH_SIZE);

      const batchResults = await Promise.all(batch.map(async (acc) => {
        try {
          const isMT5 = acc.platform === 'mt5';
          const apiBase = isMT5 ? MT5_BASE : MT_BASE;
          const apiKey = isMT5 ? MT5_API_KEY : MT_API_KEY;

          if (!apiBase || !apiKey) {
            return { account_id: acc.account_id, ok: false, error: `Missing API config for platform: ${acc.platform}` };
          }

          const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'api-key': apiKey,
          };

          const [infoRes, posRes, histRes] = await Promise.all([
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

          // ── INSTITUTIONAL DD CALCULATION ──────────────────────────────────────
          // Instant Light uses trailing DD from high water mark
          let currentOverallDD;
          if (acc.challenge_type === 'instant_light') {
            currentOverallDD = Math.max(0, ((newHWM - equity) / newHWM) * 100);
          } else {
            currentOverallDD = Math.max(0, ((accountSize - equity) / accountSize) * 100);
          }

          // Daily DD: from balance at start of day vs current equity
          // We use equity vs accountSize as proxy if daily_pnl not set
          const currentDailyDD = Math.max(0, ((balance - equity) / accountSize) * 100);

          // ── PERSISTENT DD STORAGE (FIX #1 + FIX #2) ──────────────────────────
          // CRITICAL: always take the WORST (highest) value ever seen — never overwrite with lower
          const persistentOverallDD = parseFloat(Math.max(acc.max_drawdown_used || 0, currentOverallDD).toFixed(2));
          const persistentDailyDD = parseFloat(Math.max(acc.daily_drawdown_used || 0, currentDailyDD).toFixed(2));

          const { dailyLimit, overallLimit } = getDDLimits(acc);

          // ── BREACH DETECTION (FIX #3) ─────────────────────────────────────────
          // Check persistent values — if either EVER reached the limit, breach fires
          let breachDetected = acc.dd_breach_detected || false;
          let breachType = acc.dd_breach_type || null;
          let breachTime = acc.dd_breach_time || null;
          let breachValue = acc.dd_breach_value || null;

          if (!breachDetected) {
            if (persistentOverallDD >= overallLimit) {
              breachDetected = true;
              breachType = acc.challenge_type === 'instant_light' ? 'trailing' : 'overall';
              breachTime = new Date().toISOString();
              breachValue = persistentOverallDD;
              console.log(`[DD-BREACH] ${acc.account_id} overall DD: ${persistentOverallDD.toFixed(2)}% >= ${overallLimit}%`);
            } else if (persistentDailyDD >= dailyLimit) {
              breachDetected = true;
              breachType = 'daily';
              breachTime = new Date().toISOString();
              breachValue = persistentDailyDD;
              console.log(`[DD-BREACH] ${acc.account_id} daily DD: ${persistentDailyDD.toFixed(2)}% >= ${dailyLimit}%`);
            }
          }

          const updates = {
            balance,
            equity,
            pnl: parseFloat((balance - accountSize).toFixed(2)),
            win_rate: parseFloat(winRate.toFixed(1)),
            total_trades: closedTrades.length,
            // PERSISTENT: only ever increases
            max_drawdown_used: persistentOverallDD,
            daily_drawdown_used: persistentDailyDD,
            profit_target_progress: parseFloat(Math.max(0, (balance - accountSize) / accountSize * 100).toFixed(2)),
            high_water_mark: newHWM,
            last_synced_at: new Date().toISOString(),
            // Breach flags — written once, never cleared by a sync
            dd_breach_detected: breachDetected,
            ...(breachType && { dd_breach_type: breachType }),
            ...(breachTime && { dd_breach_time: breachTime }),
            ...(breachValue !== null && { dd_breach_value: breachValue }),
          };

          // Fail immediately during sync — don't wait for automatedDDBreach (FIX #3)
          if (breachDetected && acc.status !== 'failed') {
            updates.status = 'failed';
            console.log(`[AUTO-FAIL] ${acc.account_id} failed during scheduledMTSync (${breachType} DD breach: ${breachValue?.toFixed(2)}%)`);
          }

          await base44.asServiceRole.entities.ChallengeAccount.update(acc.id, updates);

          return { account_id: acc.account_id, ok: true, balance, equity, overall_dd: persistentOverallDD, daily_dd: persistentDailyDD, breached: breachDetected };
        } catch (err) {
          return { account_id: acc.account_id, ok: false, error: err.message };
        }
      }));

      results.push(...batchResults);
    }

    return Response.json({ success: true, synced: results.length, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});