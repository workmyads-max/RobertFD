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
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { account_id, mt_login } = body;

    if (!mt_login) return Response.json({ error: 'mt_login required' }, { status: 400 });

    // Fetch account info from MT
    const [infoRes, posRes, histRes] = await Promise.all([
      fetch(`${MT_BASE}/accounts/${mt_login}`, { headers: mtHeaders }),
      fetch(`${MT_BASE}/accounts/${mt_login}/positions`, { headers: mtHeaders }),
      fetch(`${MT_BASE}/accounts/${mt_login}/deals?limit=200`, { headers: mtHeaders }),
    ]);

    let mtData = {};
    let positions = [];
    let deals = [];

    if (infoRes.ok) mtData = await infoRes.json();
    if (posRes.ok) { const d = await posRes.json(); positions = d?.positions || d || []; }
    if (histRes.ok) { const d = await histRes.json(); deals = d?.deals || d || []; }

    const balance = mtData?.balance ?? 0;
    const equity = mtData?.equity ?? 0;
    const floatPnl = equity - balance;
    const closedTrades = deals.filter(d => d.entry === 'OUT' || d.positionId);
    const wins = closedTrades.filter(d => (d.profit || 0) > 0).length;
    const winRate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0;

    // Sync open positions as TradeRecords
    for (const pos of positions) {
      const existing = await base44.asServiceRole.entities.TradeRecord.filter({
        account_id,
        trade_id: String(pos.id || pos.positionId),
      });
      const tradeData = {
        account_id,
        user_email: user.email,
        trade_id: String(pos.id || pos.positionId),
        symbol: pos.symbol,
        type: pos.side === 'BUY' || pos.action === 0 ? 'BUY' : 'SELL',
        order_type: 'MARKET',
        lots: pos.volume || pos.lots || 0,
        entry: pos.openPrice || pos.price || 0,
        sl: pos.stopLoss || null,
        tp: pos.takeProfit || null,
        pnl: pos.profit || pos.pnl || 0,
        status: 'open',
        open_time: pos.openTime || pos.time || '',
      };
      if (existing.length === 0) {
        await base44.asServiceRole.entities.TradeRecord.create(tradeData);
      } else {
        await base44.asServiceRole.entities.TradeRecord.update(existing[0].id, { pnl: tradeData.pnl, sl: tradeData.sl, tp: tradeData.tp });
      }
    }

    // Update ChallengeAccount with live metrics
    const accounts = await base44.asServiceRole.entities.ChallengeAccount.filter({ account_id });
    if (accounts.length > 0) {
      const acc = accounts[0];
      const accountSize = acc.account_size || 100000;
      const maxDDUsed = Math.max(0, ((accountSize - equity) / accountSize) * 100);
      await base44.asServiceRole.entities.ChallengeAccount.update(acc.id, {
        balance,
        equity,
        pnl: parseFloat((balance - accountSize).toFixed(2)),
        win_rate: parseFloat(winRate.toFixed(1)),
        total_trades: closedTrades.length,
        max_drawdown_used: parseFloat(maxDDUsed.toFixed(2)),
        profit_target_progress: parseFloat(Math.max(0, (balance - accountSize) / accountSize * 100).toFixed(2)),
        last_synced_at: new Date().toISOString(),
      });
    }

    return Response.json({
      success: true,
      balance, equity, floatPnl,
      openPositions: positions.length,
      closedTrades: closedTrades.length,
      winRate: parseFloat(winRate.toFixed(1)),
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});