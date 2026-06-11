/**
 * probeDealHistory — Test deal history with exact payload format (empty groups, logins array)
 * Admin only.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    try {
      const user = await base44.auth.me();
      if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    } catch { return Response.json({ error: 'Forbidden' }, { status: 403 }); }

    const body = await req.json();
    const loginNum = parseInt(body.login || 900909613752);

    const providers = await base44.asServiceRole.entities.TradingPlatformProvider.filter({ platform_name: 'mt5', is_active: true });
    const provider = providers[0];
    const apiBase = provider?.server_url;
    const apiKey = provider?.api_key;
    if (!apiBase || !apiKey) return Response.json({ error: 'MT5 credentials not configured' }, { status: 500 });

    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`, 'ApiKey': apiKey };

    // Exact payload format from user — empty groups array, logins array
    const dealPayload = {
      groups: [],
      logins: [loginNum],
      from: "2026-01-01T00:00:00Z",
      to: "2026-06-12T23:59:59Z",
      actionTypes: [],
      orderTypes: [],
      orderStates: [],
      entryStates: [],
      isFilterPosition: false,
      apikey: apiKey,
      dateFrom: "2026-01-01T00:00:00Z",
      dateTo: "2026-06-12T23:59:59Z",
      pageOffset: 0,
      pageSize: 100,
    };

    // Also test userget for this login
    const [usergetRes, dealRes] = await Promise.all([
      fetch(`${apiBase}/api/v1/user/userget`, {
        method: 'POST', headers,
        body: JSON.stringify({ Login: loginNum, apikey: apiKey }),
      }),
      fetch(`${apiBase}/api/v1/deal/get-deal-history`, {
        method: 'POST', headers,
        body: JSON.stringify(dealPayload),
      }),
    ]);

    const usergetData = usergetRes.ok ? await usergetRes.json() : { error: `HTTP ${usergetRes.status}` };
    const dealData = dealRes.ok ? await dealRes.json() : { error: `HTTP ${dealRes.status}`, body: await dealRes.text() };

    const deals = dealData?.data || dealData?.Deals || [];

    return Response.json({
      login: loginNum,
      userget: {
        status: usergetRes.status,
        balance: usergetData?.data?.Balance ?? usergetData?.balance,
        equity: usergetData?.data?.Equity ?? usergetData?.equity,
        group: usergetData?.data?.Group ?? usergetData?.group,
        raw: usergetData,
      },
      deal_history: {
        status: dealRes.status,
        total: deals.length,
        sample: deals.slice(0, 3),
        raw_first: dealData,
      },
      payload_used: dealPayload,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});