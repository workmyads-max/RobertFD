import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const MT_BASE = 'https://broker-api-demo.match-trader.com';
const MT_API_KEY = Deno.env.get('MATCH_TRADER_API_KEY') || 'EWpgx-jtNvPTvPJXQMfa6Eppx-sRuXWPtkEr6iPMXeo=';

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

    for (const acc of activeAccounts) {
      try {
        const [infoRes, posRes, histRes] = await Promise.all([
          fetch(`${MT_BASE}/accounts/${acc.mt_login}`, { headers: mtHeaders }),
          fetch(`${MT_BASE}/accounts/${acc.mt_login}/positions`, { headers: mtHeaders }),
          fetch(`${MT_BASE}/accounts/${acc.mt_login}/deals?limit=100`, { headers: mtHeaders }),
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

        // High water mark for Instant Light
        const newHWM = Math.max(acc.high_water_mark || 0, balance);

        await base44.asServiceRole.entities.ChallengeAccount.update(acc.id, {
          balance,
          equity,
          pnl: parseFloat((balance - accountSize).toFixed(2)),
          win_rate: parseFloat(winRate.toFixed(1)),
          total_trades: closedTrades.length,
          max_drawdown_used: parseFloat(maxDDUsed.toFixed(2)),
          profit_target_progress: parseFloat(Math.max(0, (balance - accountSize) / accountSize * 100).toFixed(2)),
          high_water_mark: newHWM,
          last_synced_at: new Date().toISOString(),
        });

        results.push({ account_id: acc.account_id, ok: true, balance, equity });
      } catch (err) {
        results.push({ account_id: acc.account_id, ok: false, error: err.message });
      }
    }

    return Response.json({ success: true, synced: results.length, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});