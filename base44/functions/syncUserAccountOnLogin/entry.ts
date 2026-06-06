/**
 * syncUserAccountOnLogin — On-demand sync for user's MT accounts
 *
 * INSTITUTIONAL DD ENFORCEMENT (same rules as scheduledMTSync):
 * 1. max_drawdown_used / daily_drawdown_used are PERSISTENT — Math.max only, never overwrite lower
 * 2. Any breach sets status='failed' immediately and writes permanent breach flags
 * 3. Once dd_breach_detected = true, it is NEVER cleared by a sync
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function getDDLimits(acc) {
  const dailyLimit = 5;
  const overallLimit = acc.challenge_type === 'instant_light' ? 6 : 10;
  return { dailyLimit, overallLimit };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const MT5_BASE = Deno.env.get('MT5_API_BASE_URL');
    const MT5_API_KEY = Deno.env.get('MT5_API_KEY');
    const MT_BASE = Deno.env.get('MATCH_TRADER_BASE_URL');
    const MT_API_KEY = Deno.env.get('MATCH_TRADER_API_KEY');

    const userAccounts = await base44.entities.ChallengeAccount.filter({ user_email: user.email });
    const activeAccounts = userAccounts.filter(a =>
      a.mt_login &&
      ['active', 'funded', 'passed'].includes(a.status) &&
      ['mt5', 'match_trader'].includes(a.platform)
    );

    if (activeAccounts.length === 0) {
      return Response.json({ success: true, synced: 0, message: 'No active MT accounts to sync' });
    }

    const results = [];

    for (const acc of activeAccounts) {
      try {
        const isMT5 = acc.platform === 'mt5';
        const apiBase = isMT5 ? MT5_BASE : MT_BASE;
        const apiKey = isMT5 ? MT5_API_KEY : MT_API_KEY;

        if (!apiBase || !apiKey) {
          results.push({ account_id: acc.account_id, ok: false, error: `Missing API config for ${acc.platform}` });
          continue;
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

        // ── INSTITUTIONAL DD CALCULATION ─────────────────────────────────────
        let currentOverallDD;
        if (acc.challenge_type === 'instant_light') {
          currentOverallDD = Math.max(0, ((newHWM - equity) / newHWM) * 100);
        } else {
          currentOverallDD = Math.max(0, ((accountSize - equity) / accountSize) * 100);
        }
        const currentDailyDD = Math.max(0, ((balance - equity) / accountSize) * 100);

        // ── PERSISTENT DD (FIX #1 + #2) — worst value ever, never overwrite lower ──
        const persistentOverallDD = parseFloat(Math.max(acc.max_drawdown_used || 0, currentOverallDD).toFixed(2));
        const persistentDailyDD = parseFloat(Math.max(acc.daily_drawdown_used || 0, currentDailyDD).toFixed(2));

        const { dailyLimit, overallLimit } = getDDLimits(acc);

        // ── BREACH FLAGS (FIX #4) — permanent once written ───────────────────
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
          } else if (persistentDailyDD >= dailyLimit) {
            breachDetected = true;
            breachType = 'daily';
            breachTime = new Date().toISOString();
            breachValue = persistentDailyDD;
          }
        }

        const updates = {
          balance,
          equity,
          pnl: parseFloat((balance - accountSize).toFixed(2)),
          win_rate: parseFloat(winRate.toFixed(1)),
          total_trades: closedTrades.length,
          max_drawdown_used: persistentOverallDD,
          daily_drawdown_used: persistentDailyDD,
          profit_target_progress: parseFloat(Math.max(0, (balance - accountSize) / accountSize * 100).toFixed(2)),
          high_water_mark: newHWM,
          last_synced_at: new Date().toISOString(),
          dd_breach_detected: breachDetected,
          ...(breachType && { dd_breach_type: breachType }),
          ...(breachTime && { dd_breach_time: breachTime }),
          ...(breachValue !== null && { dd_breach_value: breachValue }),
        };

        // Fail immediately during login sync (FIX #3)
        if (breachDetected && acc.status !== 'failed') {
          updates.status = 'failed';
          console.log(`[AUTO-FAIL] ${acc.account_id} failed on login sync (${breachType} DD: ${breachValue?.toFixed(2)}%)`);
        }

        await base44.entities.ChallengeAccount.update(acc.id, updates);

        results.push({ account_id: acc.account_id, ok: true, balance, equity, overall_dd: persistentOverallDD, daily_dd: persistentDailyDD, breached: breachDetected });
      } catch (err) {
        results.push({ account_id: acc.account_id, ok: false, error: err.message });
      }
    }

    return Response.json({ success: true, synced: results.filter(r => r.ok).length, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});