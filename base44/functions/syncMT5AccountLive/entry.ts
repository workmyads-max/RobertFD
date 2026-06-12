/**
 * syncMT5AccountLive — Real-time MT5 account sync for Account Overview
 * Fetches live balance, equity, open positions, and closed deals from MT5 API
 * Returns complete account data for immediate UI display
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const accountId = body.account_id;

    if (!accountId) {
      return Response.json({ error: 'account_id required' }, { status: 400 });
    }

    // Get account - try by entity ID first, then by account_id field
    let account;
    try {
      account = await base44.entities.ChallengeAccount.get(accountId);
    } catch {
      // Try finding by account_id field
      const accounts = await base44.entities.ChallengeAccount.filter({ account_id: accountId });
      account = accounts[0];
    }
    
    if (!account || account.user_email !== user.email) {
      return Response.json({ error: 'Account not found' }, { status: 404 });
    }

    // Get MT5 credentials
    const mt5Providers = await base44.asServiceRole.entities.TradingPlatformProvider.filter({ platform_name: 'mt5', is_active: true });
    const mt5Provider = mt5Providers[0];
    const MT5_BASE = mt5Provider?.server_url || Deno.env.get('MT5_API_BASE_URL');
    const MT5_KEY  = mt5Provider?.api_key    || Deno.env.get('MT5_API_KEY');

    if (!MT5_BASE || !MT5_KEY || !account.mt_login) {
      return Response.json({ 
        success: false, 
        error: 'MT5 not configured or account has no login',
        account: { ...account, balance: account.balance || account.account_size, equity: account.equity || account.balance },
        positions: [],
        trades: []
      });
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MT5_KEY}`,
      'ApiKey': MT5_KEY,
    };

    const loginNum = parseInt(account.mt_login);
    const fromDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const toDate = new Date().toISOString();

    // Fetch user info, open positions, and deal history in parallel
    const [infoRes, positionsRes, dealsRes] = await Promise.all([
      fetch(`${MT5_BASE}/api/v1/user/userget`, {
        method: 'POST', headers,
        body: JSON.stringify({ Login: loginNum, apikey: MT5_KEY }),
      }).catch(() => ({ ok: false })),
      fetch(`${MT5_BASE}/api/v1/deal/get-position`, {
        method: 'POST', headers,
        body: JSON.stringify({ logins: [loginNum], groups: [], apikey: MT5_KEY, pageOffset: 0, pageSize: 500 }),
      }).catch(() => ({ ok: false })),
      fetch(`${MT5_BASE}/api/v1/deal/get-deal-history`, {
        method: 'POST', headers,
        body: JSON.stringify({ 
          logins: [loginNum], 
          groups: [], 
          from: fromDate, 
          to: toDate, 
          dateFrom: fromDate, 
          dateTo: toDate,
          apikey: MT5_KEY, 
          pageOffset: 0, 
          pageSize: 500 
        }),
      }).catch(() => ({ ok: false })),
    ]);

    // Parse responses
    let mtData = {};
    if (infoRes.ok) {
      try {
        const r = await infoRes.json();
        mtData = r?.data || r?.User || r?.Data || r || {};
      } catch { /* empty */ }
    }

    // Parse open positions
    let positions = [];
    if (positionsRes.ok) {
      try {
        const r = await positionsRes.json();
        positions = r?.data || [];
      } catch { /* empty */ }
    }
    
    // If MT5 returns empty but account shows trades, fallback to database
    if (positions.length === 0 && account.total_trades > 0) {
      const dbPositions = await base44.entities.TradeRecord.filter({ account_id: account.account_id, status: 'open' });
      if (dbPositions.length > 0) {
        console.log(`[syncMT5AccountLive] MT5 returned empty, using ${dbPositions.length} positions from database`);
        positions = dbPositions.map(p => ({
          position: p.trade_id,
          symbol: p.symbol,
          action: p.type === 'BUY' ? 0 : 1,
          volume: p.lots * 10000,
          profit: p.pnl || 0,
          storage: 0,
          priceOpen: p.entry,
          priceCurrent: p.entry,
          timeCreate: p.open_time,
        }));
      }
    }

    // Parse closed deals
    let deals = [];
    if (dealsRes.ok) {
      try {
        const r = await dealsRes.json();
        deals = r?.data || [];
      } catch { /* empty */ }
    }

    // Use live API values, fallback to database
    const rawBalance = parseFloat(mtData?.Balance ?? mtData?.balance ?? 0);
    const rawEquity  = parseFloat(mtData?.Equity  ?? mtData?.equity  ?? 0);
    const balance = rawBalance > 0 ? rawBalance : (account.balance || account.account_size);
    const equity = rawEquity > 0 ? rawEquity : (account.equity || balance);
    
    // If MT5 shows no PnL but equity != balance, calculate from database positions
    if (positions.length === 0 && equity !== balance) {
      console.log(`[syncMT5AccountLive] MT5 shows no PnL but equity diff exists: ${equity - balance}`);
    }

    // Map open positions
    const openPositions = positions.map(p => {
      const actionID = p.actionID ?? p.action ?? 0;
      const isSell = actionID === 1 || actionID === 'SELL';
      const rawVol = parseFloat(p.volume ?? 0);
      const lots = rawVol / 10000;
      const profit = parseFloat(p.profit ?? 0);
      const storage = parseFloat(p.storage ?? 0);

      return {
        account_id: account.account_id,
        trade_id: String(p.position ?? p.externalID ?? Math.random()),
        symbol: (p.symbol ?? '').toUpperCase(),
        type: isSell ? 'SELL' : 'BUY',
        lots,
        entry: parseFloat(p.priceOpen ?? p.priceCurrent ?? 0),
        current_price: parseFloat(p.priceCurrent ?? p.priceOpen ?? 0),
        sl: parseFloat(p.priceSL ?? 0),
        tp: parseFloat(p.priceTP ?? 0),
        pnl: profit + storage,
        swap: storage,
        status: 'open',
        open_time: p.timeCreateDateTime ?? p.timeCreate ?? null,
      };
    });

    // Map closed deals
    const closedTrades = deals.filter(d => d.deal_id != null || d.Ticket != null).map(d => {
      const action = d.action ?? d.Action ?? 0;
      const isSell = action === 1 || action === 'SELL';
      const rawVol = parseFloat(d.volume ?? 0);
      const lots = rawVol / 10000;
      const pnl = parseFloat(d.profit ?? d.Profit ?? 0);
      
      const parseTime = (t) => {
        if (!t) return new Date().toISOString();
        if (typeof t === 'string' && t.includes('T')) return t;
        return new Date(parseInt(t) * (String(t).length <= 10 ? 1000 : 1)).toISOString();
      };

      return {
        account_id: account.account_id,
        user_email: account.user_email,
        trade_id: String(d.deal_id ?? d.Ticket ?? ''),
        symbol: (d.symbol ?? '').toUpperCase(),
        type: isSell ? 'SELL' : 'BUY',
        order_type: 'MARKET',
        lots,
        entry: parseFloat(d.openPrice ?? d.Price ?? 0),
        close: parseFloat(d.closePrice ?? 0),
        pnl,
        status: 'closed',
        close_reason: d.comment ?? 'close',
        open_time: parseTime(d.openTime ?? d.Time),
        close_time: parseTime(d.closeTime ?? d.TimeMsc ?? d.Time),
      };
    });

    // Calculate statistics
    const wins = closedTrades.filter(t => t.pnl > 0).length;
    const losses = closedTrades.filter(t => t.pnl < 0).length;
    const winRate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0;
    const totalPnl = closedTrades.reduce((s, t) => s + t.pnl, 0);
    const avgWin = wins > 0 ? closedTrades.filter(t => t.pnl > 0).reduce((s, t) => s + t.pnl, 0) / wins : 0;
    const avgLoss = losses > 0 ? Math.abs(closedTrades.filter(t => t.pnl < 0).reduce((s, t) => s + t.pnl, 0)) / losses : 0;

    return Response.json({
      success: true,
      account: {
        ...account,
        balance,
        equity,
        pnl: balance - account.account_size,
        daily_pnl: equity - (account.daily_start_balance || account.account_size),
      },
      positions: openPositions,
      trades: closedTrades,
      stats: {
        total_trades: closedTrades.length,
        wins,
        losses,
        win_rate: winRate,
        total_pnl: totalPnl,
        avg_win: avgWin,
        avg_loss: avgLoss,
        profit_factor: avgLoss > 0 ? (avgWin * wins) / (avgLoss * losses) : 0,
      }
    });

  } catch (error) {
    return Response.json({ error: error.message, success: false }, { status: 500 });
  }
});