/**
 * probeDealEndpoints — discover which trade execution endpoints exist on Tritech bridge
 * One-time diagnostic tool. Can be deleted after use.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

  const MT5_BASE = Deno.env.get('MT5_API_BASE_URL');
  const MT5_KEY  = Deno.env.get('MT5_API_KEY');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${MT5_KEY}`,
    'ApiKey': MT5_KEY,
  };

  // Use login 900909614215 from the user's screenshot
  const body = await req.json().catch(() => ({}));
  const testLogin = body.test_login || 900909614215;

  const endpoints = [
    // Deal endpoints
    { path: '/api/v1/deal/open', payload: { Login: testLogin, Symbol: 'EURUSD', Action: 0, Volume: 100, Price: 0, apikey: MT5_KEY } },
    { path: '/api/v1/deal/opendeal', payload: { Login: testLogin, Symbol: 'EURUSD', Action: 0, Volume: 100, apikey: MT5_KEY } },
    { path: '/api/v1/deal/openposition', payload: { Login: testLogin, Symbol: 'EURUSD', Action: 0, Volume: 100, apikey: MT5_KEY } },
    { path: '/api/v1/deal/close', payload: { Login: testLogin, Position: 1, apikey: MT5_KEY } },
    { path: '/api/v1/deal/closedeal', payload: { Login: testLogin, Position: 1, apikey: MT5_KEY } },
    { path: '/api/v1/deal/get-position', payload: { logins: [testLogin], groups: [], apikey: MT5_KEY, pageOffset: 0, pageSize: 10 } },
    { path: '/api/v1/deal/getdeal', payload: { Login: testLogin, apikey: MT5_KEY } },
    // Order endpoints
    { path: '/api/v1/order/open', payload: { Login: testLogin, Symbol: 'EURUSD', Action: 0, Volume: 100, apikey: MT5_KEY } },
    { path: '/api/v1/order/close', payload: { Login: testLogin, Position: 1, apikey: MT5_KEY } },
    // Trade endpoints
    { path: '/api/v1/trade/open', payload: { Login: testLogin, Symbol: 'EURUSD', Action: 0, Volume: 100, apikey: MT5_KEY } },
    { path: '/api/v1/trade/close', payload: { Login: testLogin, Position: 1, apikey: MT5_KEY } },
    // Manager endpoints
    { path: '/api/v1/manager/opentrade', payload: { Login: testLogin, Symbol: 'EURUSD', Action: 0, Volume: 100, apikey: MT5_KEY } },
    { path: '/api/v1/user/opentrade', payload: { Login: testLogin, Symbol: 'EURUSD', Action: 0, Volume: 100, apikey: MT5_KEY } },
    { path: '/api/v1/user/openposition', payload: { Login: testLogin, Symbol: 'EURUSD', Action: 0, Volume: 100, apikey: MT5_KEY } },
    { path: '/api/v1/position/open', payload: { Login: testLogin, Symbol: 'EURUSD', Action: 0, Volume: 100, apikey: MT5_KEY } },
  ];

  const results = await Promise.all(endpoints.map(async ({ path, payload }) => {
    try {
      const res = await fetch(`${MT5_BASE}${path}`, {
        method: 'POST', headers,
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let parsed = {};
      try { parsed = JSON.parse(text); } catch {}
      return {
        path,
        http_status: res.status,
        exists: res.status !== 404 && res.status !== 405,
        response_preview: text.slice(0, 300),
        errorcode: parsed?.data?.errorcode,
        errormsg: parsed?.data?.errormsg,
        resultCode: parsed?.resultCode,
      };
    } catch (e) {
      return { path, exists: false, error: e.message };
    }
  }));

  const found = results.filter(r => r.exists);
  const missing = results.filter(r => !r.exists);

  return Response.json({ success: true, mt5_base: MT5_BASE, found, missing });
});