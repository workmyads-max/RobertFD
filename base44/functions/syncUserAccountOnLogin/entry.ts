/**
 * syncUserAccountOnLogin — On-demand sync triggered when user opens dashboard.
 * Uses Tritech MT5 API — queries by LOGIN NUMBER only (no groups dependency).
 *
 * DAILY DD: (daily_start_balance - equity) / daily_start_balance * 100
 * OVERALL DD: Math.max — persistent, never decreases
 * BREACH: Immediate — status='failed' written in same update as breach flags
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function getDDLimits(acc) {
  const snap = acc.rule_snapshot || {};
  const dailyLimit = snap.daily_dd_limit ?? 5;
  const overallLimit = snap.max_dd_limit ?? (acc.challenge_type === 'instant_light' ? 6 : 10);
  const isTrailing = snap.trailing_dd ?? (acc.challenge_type === 'instant_light');
  return { dailyLimit, overallLimit, isTrailing };
}

function calcOverallDD(acc, equity, newHWM) {
  const accountSize = acc.account_size || 100000;
  const isTrailing = acc.rule_snapshot?.trailing_dd ?? (acc.challenge_type === 'instant_light');
  if (isTrailing) {
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

    // Fetch MT5 credentials — prefer DB, fallback to env
    const mt5Providers = await base44.asServiceRole.entities.TradingPlatformProvider.filter({ platform_name: 'mt5', is_active: true });
    const mt5Provider = mt5Providers[0];
    const MT5_BASE = mt5Provider?.server_url || Deno.env.get('MT5_API_BASE_URL');
    const MT5_KEY  = mt5Provider?.api_key    || Deno.env.get('MT5_API_KEY');

    if (!MT5_BASE || !MT5_KEY) {
      return Response.json({ success: false, error: 'MT5 credentials not configured' }, { status: 500 });
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MT5_KEY}`,
      'ApiKey': MT5_KEY,
    };

    // Fetch only this user's active accounts
    const userAccounts = await base44.entities.ChallengeAccount.filter({ user_email: user.email });
    const activeAccounts = userAccounts.filter(a =>
      a.mt_login &&
      ['active', 'funded', 'passed'].includes(a.status) &&
      a.platform === 'mt5'
    );

    if (activeAccounts.length === 0) {
      return Response.json({ success: true, synced: 0, message: 'No active MT5 accounts to sync' });
    }

    const results = [];

    for (const acc of activeAccounts) {
      try {
        const loginNum = parseInt(acc.mt_login);
        const fromDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
        const toDate   = new Date().toISOString();

        // Query by LOGIN NUMBER ONLY — no groups dependency
        const [infoRes, histRes] = await Promise.all([
          fetch(`${MT5_BASE}/api/v1/user/userget`, {
            method: 'POST', headers,
            body: JSON.stringify({ Login: loginNum, apikey: MT5_KEY }),
          }),
          fetch(`${MT5_BASE}/api/v1/deal/get-deal-history`, {
            method: 'POST', headers,
            body: JSON.stringify({
              logins: [loginNum],   // ← login-based, NOT groups
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
              apikey: MT5_KEY,
              pageOffset: 0,
              pageSize: 500,
            }),
          }).catch(() => ({ ok: false })),
        ]);

        let mtData = {};
        let deals = [];

        if (infoRes.ok) {
          const r = await infoRes.json().catch(() => ({}));
          mtData = r?.data || r?.User || r?.Data || r || {};
        }
        if (histRes.ok) {
          const r = await histRes.json().catch(() => ({}));
          const dealArr = r?.data || r?.Deals || r?.Data || r;
          deals = Array.isArray(dealArr) ? dealArr : [];
        }

        const rawBalance = parseFloat(mtData?.Balance ?? mtData?.balance ?? 0);
        const rawEquity  = parseFloat(mtData?.Equity  ?? mtData?.equity  ?? 0);
        const balance = rawBalance > 0 ? rawBalance : (acc.balance || acc.account_size || 0);
        const equity  = rawEquity  > 0 ? rawEquity  : (rawBalance > 0 ? rawBalance : (acc.equity || acc.balance || acc.account_size || 0));

        // Closed deals: MT5 Entry field 1 = OUT (close)
        const closedTrades = deals.filter(d => d.Entry === 1 || d.entry === 1 || d.Entry === 'OUT' || d.entry === 'OUT');
        const wins = closedTrades.filter(d => (d.Profit ?? d.profit ?? 0) > 0).length;
        const winRate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0;
        const accountSize = acc.account_size || 100000;
        const newHWM = Math.max(acc.high_water_mark || 0, balance);

        const currentOverallDD = calcOverallDD(acc, equity, newHWM);
        const currentDailyDD   = calcDailyDD(acc, equity);
        const persistentOverallDD = parseFloat(Math.max(acc.max_drawdown_used || 0, currentOverallDD).toFixed(2));
        const persistentDailyDD   = parseFloat(Math.max(acc.daily_drawdown_used || 0, currentDailyDD).toFixed(2));

        const { dailyLimit, overallLimit } = getDDLimits(acc);

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
          ...(breachType && !acc.dd_breach_type && { dd_breach_type: breachType }),
          ...(breachTime && !acc.dd_breach_time && { dd_breach_time: breachTime }),
          ...(breachValue !== null && !acc.dd_breach_value && { dd_breach_value: breachValue }),
        };

        if (breachDetected && acc.status !== 'failed') {
          updates.status = 'failed';
          console.log(`[LOGIN-SYNC-FAIL] ${acc.account_id} → failed (${breachType}: ${breachValue?.toFixed(2)}%)`);
        }

        // Write new trade records (idempotent)
        if (closedTrades.length > 0) {
          const existingTrades = await base44.entities.TradeRecord.filter({ account_id: acc.account_id });
          const existingIds = new Set(existingTrades.map(t => t.trade_id));
          const newDeals = closedTrades.filter(d => {
            const tid = String(d.Ticket || d.PositionID || d.positionId || d.deal || d.id || '');
            return tid && !existingIds.has(tid);
          });
          if (newDeals.length > 0) {
            await Promise.all(newDeals.map(d => {
              const tid = String(d.Ticket || d.PositionID || d.positionId || d.deal || d.id || '');
              return base44.entities.TradeRecord.create({
                account_id: acc.account_id,
                user_email: acc.user_email,
                trade_id: tid,
                symbol: d.Symbol || d.symbol || '',
                type: (d.Action === 1 || d.type === 'SELL' || d.side === 'sell') ? 'SELL' : 'BUY',
                order_type: 'MARKET',
                lots: parseFloat(d.Volume ?? d.volume ?? 0),
                entry: parseFloat(d.Price ?? d.price ?? 0),
                close: parseFloat(d.PriceClose ?? d.closePrice ?? d.Price ?? 0),
                pnl: parseFloat(d.Profit ?? d.profit ?? 0),
                status: 'closed',
                close_reason: d.Comment || d.comment || 'close',
                open_time: d.Time ? new Date(parseInt(d.Time) * 1000).toISOString() : new Date().toISOString(),
                close_time: d.TimeMsc ? new Date(parseInt(d.TimeMsc) / 1000).toISOString() : new Date().toISOString(),
              }).catch(() => null);
            }));
          }
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