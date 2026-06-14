/**
 * getClosedTrades — Fetch closed deal history from MT5 for the authenticated user's account.
 * Uses Tritech API: /api/v1/deal/get-deal-history
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { account_id, page_size = 100 } = body;

    const providers = await base44.asServiceRole.entities.TradingPlatformProvider.filter({ platform_name: 'mt5', is_active: true });
    const provider = providers[0];
    const apiBase = provider?.server_url;
    const apiKey = provider?.api_key;
    if (!apiBase || !apiKey) {
      return Response.json({ success: false, trades: [], error: 'MT5 not configured' });
    }

    // Ownership check — find the MT5 login for this account (any status)
    const userAccounts = await base44.entities.ChallengeAccount.filter({ user_email: user.email });
    const account = userAccounts.find(a =>
      a.mt_login && (!account_id || a.account_id === account_id || a.mt_login === String(account_id))
    );

    if (!account?.mt_login) {
      return Response.json({ success: true, trades: [] });
    }

    const loginNum = parseInt(account.mt_login);
    const headers = { 'Content-Type': 'application/json', 'ApiKey': apiKey };

    // Last 90 days
    const fromDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const toDate = new Date().toISOString();

    const dealRes = await fetch(`${apiBase}/api/v1/deal/get-deal-history`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        groups: [],
        logins: [loginNum],
        from: fromDate,
        to: toDate,
        dateFrom: fromDate,
        dateTo: toDate,
        actionTypes: [],
        orderTypes: [],
        orderStates: [],
        entryStates: [],
        isFilterPosition: false,
        apikey: apiKey,
        pageOffset: 0,
        pageSize: page_size,
      }),
    });

    if (!dealRes.ok) {
      const txt = await dealRes.text();
      return Response.json({ success: false, trades: [], error: `MT5 error ${dealRes.status}: ${txt.slice(0, 200)}` });
    }

    const dealData = await dealRes.json().catch(() => ({}));
    const rawDeals = dealData?.data || [];

    const trades = rawDeals.map(d => {
      // type: 0=BUY, 1=SELL
      const isSell = (d.type ?? 0) === 1;
      const lots = parseFloat(d.volume ?? 0) / 10000;
      const profit = parseFloat(d.profit ?? 0);
      const commission = parseFloat(d.commission ?? 0);
      const swap = parseFloat(d.storage ?? 0);
      const netPnl = profit + commission + swap;

      const symbol = (d.symbol ?? '').toUpperCase();
      const openPrice = parseFloat(d.openPrice ?? 0);
      const closePrice = parseFloat(d.closePrice ?? 0);

      // Pips calculation
      let pips = 0;
      if (openPrice && closePrice) {
        const diff = Math.abs(closePrice - openPrice);
        const pipSize = symbol.includes('JPY') || symbol.includes('XAU') ? 0.01 : 0.0001;
        pips = diff / pipSize;
      }

      return {
        trade_id: String(d.deal_id ?? d.dealId ?? ''),
        symbol,
        type: isSell ? 'SELL' : 'BUY',
        lots,
        entry: openPrice,
        close: closePrice,
        pnl: netPnl,
        profit,
        commission,
        swap,
        pips: parseFloat(pips.toFixed(1)),
        open_time: d.openTime ?? null,
        close_time: d.closeTime ?? null,
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