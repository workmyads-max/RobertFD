/**
 * getClosedTrades — Fetch closed deal history from MT5 for the authenticated user's account.
 * Uses Tritech API: /api/v1/deal/get-deal-history
 * Credentials loaded from TradingPlatformProvider entity.
 *
 * Tritech field reference (confirmed from live API):
 *   deal_id, login, symbol, type (0=BUY,1=SELL,2=BALANCE,...), volume (lots*10000),
 *   openPrice, closePrice, openTime (ISO), closeTime (ISO), profit, commission, storage
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { account_id, page_size = 200 } = body;

    // Load credentials from TradingPlatformProvider entity
    const providers = await base44.asServiceRole.entities.TradingPlatformProvider.filter({ platform_name: 'mt5', is_active: true });
    const provider = providers[0];
    const apiBase = provider?.server_url;
    const apiKey = provider?.api_key;
    const managerLogin = provider?.manager_login;
    const managerPassword = provider?.manager_password;

    if (!apiBase || !apiKey) {
      return Response.json({ success: false, trades: [], error: 'MT5 not configured' });
    }

    // Ownership check — use service role with case-insensitive email matching.
    // RLS exact-match (user_email = {{user.email}}) can hide the user's own accounts
    // when casing/whitespace differs. Service role bypasses RLS; we enforce ownership manually.
    const normalizedEmail = user.email.toLowerCase().trim();
    const allUserAccounts = await base44.asServiceRole.entities.ChallengeAccount.filter({ user_email: user.email }, '-created_date', 200);
    const account = (allUserAccounts || []).find(a =>
      (a.user_email || '').toLowerCase().trim() === normalizedEmail &&
      a.mt_login && (!account_id || a.account_id === account_id || a.mt_login === String(account_id))
    );

    if (!account?.mt_login) {
      return Response.json({ success: true, trades: [] });
    }

    const loginNum = parseInt(account.mt_login);

    const headers = {
      'Content-Type': 'application/json',
      'ApiKey': apiKey,
      'ManagerLogin': managerLogin || '',
      'ManagerPassword': managerPassword || '',
    };

    // Wide range: from 1 day before provisioning → tomorrow (ensures today's trades are included)
    const fromDate = account.provisioned_at
      ? new Date(new Date(account.provisioned_at).getTime() - 24 * 60 * 60 * 1000).toISOString()
      : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
    const toDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

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

    // type: 0=BUY, 1=SELL, 2=BALANCE/DEPOSIT, 3=CREDIT, etc. — keep only real trades (0 or 1)
    const tradingDeals = rawDeals.filter(d => d.type === 0 || d.type === 1);

    const trades = tradingDeals.map(d => {
      const isSell = d.type === 1;

      // volume is lots * 10000 (e.g. 2500 = 0.25 lots)
      const lots = parseFloat(d.volume ?? 0) / 10000;
      const profit = parseFloat(d.profit ?? 0);
      const commission = parseFloat(d.commission ?? 0);
      const swap = parseFloat(d.storage ?? 0);
      const netPnl = profit + commission + swap;

      const symbol = (d.symbol ?? '').toUpperCase();
      const openPrice = parseFloat(d.openPrice ?? 0);
      const closePrice = parseFloat(d.closePrice ?? 0);

      let pips = 0;
      if (openPrice && closePrice) {
        const diff = Math.abs(closePrice - openPrice);
        const pipSize = symbol.includes('JPY') ? 0.01 : symbol.includes('XAU') ? 0.1 : symbol.includes('BTC') || symbol.includes('ETH') ? 1 : 0.0001;
        pips = diff / pipSize;
      }

      return {
        trade_id: String(d.deal_id ?? ''),
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