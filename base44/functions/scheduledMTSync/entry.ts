import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const MT_BASE = Deno.env.get('MATCH_TRADER_BASE_URL') || 'https://broker-api-demo.match-trader.com';
const MT_API_KEY = Deno.env.get('MATCH_TRADER_API_KEY');

const mtHeaders = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${MT_API_KEY}`,
  'api-key': MT_API_KEY,
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all active Match Trader accounts that have an mt_login
    const accounts = await base44.asServiceRole.entities.ChallengeAccount.filter({ platform: 'match_trader' });
    const activeAccounts = accounts.filter(a => a.mt_login && ['active', 'funded', 'passed'].includes(a.status));

    const results = [];
    const BATCH_SIZE = 50;

    for (let batchStart = 0; batchStart < activeAccounts.length; batchStart += BATCH_SIZE) {
      const batch = activeAccounts.slice(batchStart, batchStart + BATCH_SIZE);

      const batchResults = await Promise.all(batch.map(async (acc) => {
        try {
          const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${MT_API_KEY}`,
            'api-key': MT_API_KEY,
          };

          const [infoRes, posRes, histRes] = await Promise.all([
            fetch(`${MT_BASE}/accounts/${acc.mt_login}`, { headers }),
            fetch(`${MT_BASE}/accounts/${acc.mt_login}/positions`, { headers }),
            fetch(`${MT_BASE}/accounts/${acc.mt_login}/deals?limit=100`, { headers }),
          ]);

          let mtData = {};
          let positions = [];
          let deals = [];

          if (infoRes.ok) mtData = await infoRes.json();
          if (posRes.ok) { const d = await posRes.json(); positions = d?.positions || d || []; }
          if (histRes.ok) { const d = await histRes.json(); deals = d?.deals || d || []; }

          const balance = mtData?.balance ?? acc.balance ?? 0;
          const equity = mtData?.equity ?? acc.equity ?? 0;
          const closedTrades = deals.filter(d => d.entry === 'OUT' || d.positionId);
          const wins = closedTrades.filter(d => (d.profit || 0) > 0).length;
          const winRate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0;
          const accountSize = acc.account_size || 100000;
          const maxDDUsed = Math.max(0, ((accountSize - equity) / accountSize) * 100);
          const newHWM = Math.max(acc.high_water_mark || 0, balance);

          // Auto-breach detection: fail account if DD exceeded
          const maxAllowedDD = 10; // default 10%
          const updates = {
            balance,
            equity,
            pnl: parseFloat((balance - accountSize).toFixed(2)),
            win_rate: parseFloat(winRate.toFixed(1)),
            total_trades: closedTrades.length,
            max_drawdown_used: parseFloat(maxDDUsed.toFixed(2)),
            profit_target_progress: parseFloat(Math.max(0, (balance - accountSize) / accountSize * 100).toFixed(2)),
            high_water_mark: newHWM,
            last_synced_at: new Date().toISOString(),
          };

          if (maxDDUsed >= maxAllowedDD && acc.status === 'active') {
            updates.status = 'failed';
            console.log(`[AUTO-BREACH] Account ${acc.account_id} breached max DD: ${maxDDUsed.toFixed(2)}%`);
          }

          await base44.asServiceRole.entities.ChallengeAccount.update(acc.id, updates);

          return { account_id: acc.account_id, ok: true, balance, equity, dd: maxDDUsed };
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