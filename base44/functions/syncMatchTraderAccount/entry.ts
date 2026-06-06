/**
 * syncMatchTraderAccount — On-demand single-account sync.
 * Applies identical institutional DD enforcement as scheduledMTSync.
 *
 * DAILY DD: (daily_start_balance - equity) / daily_start_balance * 100
 * OVERALL DD: Math.max — persistent, never decreases
 * BREACH: Immediate — no waiting for automatedDDBreach
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function getMtHeaders() {
  const key = Deno.env.get('MATCH_TRADER_API_KEY');
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}`, 'api-key': key };
}

function getDDLimits(acc) {
  const dailyLimit = 5;
  const overallLimit = acc.challenge_type === 'instant_light' ? 6 : 10;
  return { dailyLimit, overallLimit };
}

function calcOverallDD(acc, equity, newHWM) {
  const accountSize = acc.account_size || 100000;
  if (acc.challenge_type === 'instant_light') {
    const hwm = newHWM || accountSize;
    return hwm > 0 ? Math.max(0, ((hwm - equity) / hwm) * 100) : 0;
  }
  return Math.max(0, ((accountSize - equity) / accountSize) * 100);
}

function calcDailyDD(acc, equity) {
  const base = acc.daily_start_balance || acc.account_size || 100000;
  return base > 0 ? Math.max(0, ((base - equity) / base) * 100) : 0;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { account_id, mt_login } = body;
    if (!mt_login) return Response.json({ error: 'mt_login required' }, { status: 400 });

    const MT_BASE = Deno.env.get('MATCH_TRADER_BASE_URL') || 'https://broker-api-demo.match-trader.com';
    const mtHeaders = getMtHeaders();

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
        account_id, trade_id: String(pos.id || pos.positionId),
      });
      const tradeData = {
        account_id, user_email: user.email,
        trade_id: String(pos.id || pos.positionId),
        symbol: pos.symbol,
        type: pos.side === 'BUY' || pos.action === 0 ? 'BUY' : 'SELL',
        order_type: 'MARKET',
        lots: pos.volume || pos.lots || 0,
        entry: pos.openPrice || pos.price || 0,
        sl: pos.stopLoss || null, tp: pos.takeProfit || null,
        pnl: pos.profit || pos.pnl || 0,
        status: 'open', open_time: pos.openTime || pos.time || '',
      };
      if (existing.length === 0) {
        await base44.asServiceRole.entities.TradeRecord.create(tradeData);
      } else {
        await base44.asServiceRole.entities.TradeRecord.update(existing[0].id, { pnl: tradeData.pnl, sl: tradeData.sl, tp: tradeData.tp });
      }
    }

    // Update account with institutional DD enforcement
    const accounts = await base44.asServiceRole.entities.ChallengeAccount.filter({ account_id });
    if (accounts.length > 0) {
      const acc = accounts[0];
      const accountSize = acc.account_size || 100000;
      const newHWM = Math.max(acc.high_water_mark || 0, balance);

      // ── TRUE INSTITUTIONAL DD ─────────────────────────────────────────────
      const currentOverallDD = calcOverallDD(acc, equity, newHWM);
      const currentDailyDD = calcDailyDD(acc, equity);

      // ── PERSISTENT — only ever increases ─────────────────────────────────
      const persistentOverallDD = parseFloat(Math.max(acc.max_drawdown_used || 0, currentOverallDD).toFixed(2));
      const persistentDailyDD = parseFloat(Math.max(acc.daily_drawdown_used || 0, currentDailyDD).toFixed(2));

      const { dailyLimit, overallLimit } = getDDLimits(acc);

      // ── BREACH FLAGS — written once, never cleared ────────────────────────
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
        balance, equity,
        pnl: parseFloat((balance - accountSize).toFixed(2)),
        win_rate: parseFloat(winRate.toFixed(1)),
        total_trades: closedTrades.length,
        max_drawdown_used: persistentOverallDD,
        daily_drawdown_used: persistentDailyDD,
        profit_target_progress: parseFloat(Math.max(0, (balance - accountSize) / accountSize * 100).toFixed(2)),
        high_water_mark: newHWM,
        last_synced_at: new Date().toISOString(),
        dd_breach_detected: breachDetected,
        ...(breachType && !acc.dd_breach_type && { dd_breach_type: breachType }),
        ...(breachTime && !acc.dd_breach_time && { dd_breach_time: breachTime }),
        ...(breachValue !== null && !acc.dd_breach_value && { dd_breach_value: breachValue }),
      };

      if (breachDetected && acc.status !== 'failed') {
        updates.status = 'failed';
        console.log(`[AUTO-FAIL] MT sync — ${account_id} failed (${breachType}: ${breachValue?.toFixed(2)}%)`);
      }

      await base44.asServiceRole.entities.ChallengeAccount.update(acc.id, updates);
    }

    return Response.json({ success: true, balance, equity, floatPnl, openPositions: positions.length, closedTrades: closedTrades.length, winRate: parseFloat(winRate.toFixed(1)) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});