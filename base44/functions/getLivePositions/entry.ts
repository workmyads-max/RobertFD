/**
 * getLivePositions — Fetch open positions from MT5 for the current user's accounts.
 * Uses Tritech API: /api/v1/user/get-positions or /api/v1/order/get-open-orders
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const accountId = body.account_id;

    const mt5Providers = await base44.asServiceRole.entities.TradingPlatformProvider.filter({ platform_name: 'mt5', is_active: true });
    const mt5Provider = mt5Providers[0];
    const MT5_BASE = mt5Provider?.server_url || Deno.env.get('MT5_API_BASE_URL');
    const MT5_KEY  = mt5Provider?.api_key    || Deno.env.get('MT5_API_KEY');

    if (!MT5_BASE || !MT5_KEY) {
      return Response.json({ success: false, positions: [], error: 'MT5 not configured' });
    }

    // Get user's accounts
    const userAccounts = await base44.entities.ChallengeAccount.filter({ user_email: user.email });
    const activeAccounts = userAccounts.filter(a =>
      a.mt_login &&
      ['active', 'funded', 'passed'].includes(a.status) &&
      a.platform === 'mt5' &&
      (!accountId || a.account_id === accountId)
    );

    if (activeAccounts.length === 0) {
      return Response.json({ success: true, positions: [] });
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MT5_KEY}`,
      'ApiKey': MT5_KEY,
    };

    const allPositions = [];

    for (const acc of activeAccounts) {
      const loginNum = parseInt(acc.mt_login);

      // Confirmed working endpoint: /api/v1/deal/get-position with logins array + groups
      let positions = [];
      const posRes = await fetch(`${MT5_BASE}/api/v1/deal/get-position`, {
        method: 'POST', headers,
        body: JSON.stringify({ logins: [loginNum], groups: [], apikey: MT5_KEY, pageOffset: 0, pageSize: 500 }),
      }).catch(() => ({ ok: false }));

      if (posRes.ok) {
        try {
          const r = await posRes.json();
          positions = r?.data || [];
        } catch { /* empty */ }
      }

      // Map Tritech get-position fields to standard format
      // Tritech actionID: 0=BUY, 1=SELL; volume is raw points → /100000
      positions.forEach(p => {
        const actionID = p.actionID ?? p.action ?? 0;
        const isSell = actionID === 1 || actionID === 'SELL';
        const rawVol = parseFloat(p.volume ?? 0);
        const lots = rawVol / 100000;
        const profit = parseFloat(p.profit ?? 0);
        const storage = parseFloat(p.storage ?? 0);

        allPositions.push({
          account_id: acc.account_id,
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
        });
      });
    }

    return Response.json({ success: true, positions: allPositions });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});