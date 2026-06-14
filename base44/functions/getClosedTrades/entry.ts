/**
 * getClosedTrades — Fetch closed deal history from MT5 for the authenticated user's account.
 * Uses Tritech API: /api/v1/deal/get-deal (deal history)
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { account_id, page = 0, page_size = 50 } = body;

    const MT5_BASE = Deno.env.get('MT5_API_BASE_URL');
    const MT5_KEY  = Deno.env.get('MT5_API_KEY');
    if (!MT5_BASE || !MT5_KEY) {
      return Response.json({ success: false, trades: [], error: 'MT5 not configured' });
    }

    // Ownership check
    const userAccounts = await base44.entities.ChallengeAccount.filter({ user_email: user.email });
    const account = userAccounts.find(a =>
      a.mt_login && ['active', 'funded', 'passed'].includes(a.status) &&
      (!account_id || a.account_id === account_id)
    );

    if (!account) {
      return Response.json({ success: true, trades: [] });
    }

    const loginNum = parseInt(account.mt_login);
    const headers = {
      'Content-Type': 'application/json',
      'ApiKey': MT5_KEY,
    };

    // Fetch deal history (closed trades) - last 90 days
    const fromDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const toDate = new Date().toISOString();

    const dealRes = await fetch(`${MT5_BASE}/api/v1/deal/get-deal`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        login: loginNum,
        fromDate,
        toDate,
        pageOffset: page * page_size,
        pageSize: page_size,
        apikey: MT5_KEY,
      }),
    });

    if (!dealRes.ok) {
      const txt = await dealRes.text();
      return Response.json({ success: false, trades: [], error: `MT5 error: ${txt.slice(0, 200)}` });
    }

    const dealData = await dealRes.json().catch(() => ({}));
    const rawDeals = dealData?.data || dealData?.deals || [];

    // Filter to only closing deals (entry == 1 = OUT, action 0=BUY 1=SELL)
    // Tritech entry: 0=IN (open), 1=OUT (close), 2=INOUT, 3=OUT_BY
    const closingDeals = rawDeals.filter(d => {
      const entry = d.entry ?? d.entryType ?? 0;
      return entry === 1 || entry === 3 || entry === 'OUT' || entry === 'OUT_BY';
    });

    const trades = closingDeals.map(d => {
      const actionID = d.action ?? d.actionID ?? 0;
      const isSell = actionID === 1 || actionID === 'SELL';
      const lots = parseFloat(d.volume ?? 0) / 10000;
      const profit = parseFloat(d.profit ?? 0);
      const commission = parseFloat(d.commission ?? 0);
      const swap = parseFloat(d.storage ?? d.swap ?? 0);
      const netPnl = profit + commission + swap;

      // Calculate pips
      const symbol = (d.symbol ?? '').toUpperCase();
      const priceOpen = parseFloat(d.priceOpen ?? d.price ?? 0);
      const priceClose = parseFloat(d.price ?? priceOpen);
      let pips = 0;
      if (priceOpen && priceClose) {
        const diff = Math.abs(priceClose - priceOpen);
        // JPY pairs: pip = 0.01, others: pip = 0.0001
        const pipSize = symbol.includes('JPY') ? 0.01 : 0.0001;
        pips = diff / pipSize;
      }

      return {
        trade_id: String(d.deal ?? d.position ?? d.externalID ?? ''),
        position_id: String(d.position ?? ''),
        symbol,
        type: isSell ? 'SELL' : 'BUY',
        lots,
        entry: priceOpen,
        close: priceClose,
        pnl: netPnl,
        profit,
        commission,
        swap,
        pips: parseFloat(pips.toFixed(1)),
        open_time: d.timeOpenDateTime ?? d.timeCreate ?? null,
        close_time: d.timeDateTime ?? d.time ?? null,
        status: 'closed',
      };
    });

    // Sort newest first
    trades.sort((a, b) => new Date(b.close_time || 0) - new Date(a.close_time || 0));

    return Response.json({ success: true, trades, total: trades.length });

  } catch (error) {
    console.error('[getClosedTrades]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});