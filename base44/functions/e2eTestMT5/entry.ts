/**
 * e2eTestMT5 — Full Schema Deal History Probe
 *
 * Uses the correct Tritech API schema:
 * { groups, logins, from, to, actionTypes, orderTypes, orderStates, entryStates, isFilterPosition, apikey, dateFrom, dateTo, pageOffset, pageSize }
 *
 * Usage: { "mt_login": "900909613752" }
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function mt5Headers(apiKey) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
    'ApiKey': apiKey,
  };
}

async function probe(apiBase, headers, label, path, body) {
  const url = `${apiBase}${path}`;
  console.log(`[PROBE] ${label} → POST ${path}`);
  console.log(`[PROBE] ${label} body: ${JSON.stringify(body)}`);
  try {
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    const text = await res.text();
    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = text || '(empty)'; }
    const dealCount = Array.isArray(parsed?.data) ? parsed.data.length : null;
    const result = { status: res.status, deal_count: dealCount, response: typeof parsed === 'string' ? parsed.slice(0, 600) : parsed };
    console.log(`[PROBE] ${label}: HTTP ${res.status}, deals=${dealCount ?? 'N/A'}, body=${text.slice(0, 300)}`);
    return result;
  } catch (e) {
    console.error(`[PROBE] ${label}: EXCEPTION — ${e.message}`);
    return { status: 'EXCEPTION', error: e.message };
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    try {
      const user = await base44.auth.me();
      if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    } catch { return Response.json({ error: 'Forbidden' }, { status: 403 }); }

    const body = await req.json();
    const { mt_login } = body;
    if (!mt_login) return Response.json({ error: 'mt_login required' }, { status: 400 });

    const providers = await base44.asServiceRole.entities.TradingPlatformProvider.filter({ platform_name: 'mt5', is_active: true });
    const provider = providers[0];
    const apiBase = provider?.server_url;
    const apiKey = provider?.api_key;
    if (!apiBase || !apiKey) return Response.json({ error: 'MT5 credentials not configured' }, { status: 500 });

    const headers = mt5Headers(apiKey);
    const loginNum = parseInt(mt_login);

    // Get the account's group from DB
    const accounts = await base44.asServiceRole.entities.ChallengeAccount.filter({ mt_login: mt_login });
    const acc = accounts[0];
    const group = acc?.mt_group || '';

    // Date range — ISO format as shown in the schema
    const now = new Date();
    const past90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const fromISO = past90.toISOString();
    const toISO   = now.toISOString();

    console.log(`\n${'='.repeat(60)}\nFULL-SCHEMA DEAL HISTORY PROBE — login: ${loginNum}, group: ${group}\n${'='.repeat(60)}`);

    // Wide date range — from account creation to now
    const wideFrom = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
    const wideTo   = now.toISOString();

    const dealBase = {
      groups: group ? [group] : [],
      logins: [loginNum],
      from: wideFrom,
      to: wideTo,
      dateFrom: wideFrom,
      dateTo: wideTo,
      actionTypes: [],
      orderTypes: [],
      orderStates: [],
      entryStates: [],
      isFilterPosition: false,
      apikey: apiKey,
      pageOffset: 0,
      pageSize: 500,
    };

    // userget — confirmed working, gives us equity (open position PnL baked in)
    const usergetRes = await fetch(`${apiBase}/api/v1/user/userget`, {
      method: 'POST', headers,
      body: JSON.stringify({ Login: loginNum, apikey: apiKey }),
    });
    const usergetData = usergetRes.ok ? await usergetRes.json() : null;
    const liveEquity  = parseFloat(usergetData?.data?.Equity ?? usergetData?.data?.equity ?? 0);
    const liveBalance = parseFloat(usergetData?.data?.Balance ?? usergetData?.data?.balance ?? 0);
    console.log(`[userget] balance=${liveBalance}, equity=${liveEquity}, raw=${JSON.stringify(usergetData?.data).slice(0,200)}`);

    // getaccountsdrawdown — fix: Logins must be UInt64[] (array of numbers)
    const ddBodyFixed   = { Logins: [loginNum], apikey: apiKey };
    const ddBodyGroups  = { Logins: [loginNum], Groups: group ? [group] : [], apikey: apiKey };

    const [
      // ── CLOSED DEALS ──────────────────────────────────────────────────────
      r01,  // base full schema, wide date
      r02,  // entryStates=[1] OUT
      r03,  // entryStates=[0] IN (open deal legs)
      r04,  // entryStates=[0,1,2] all

      // ── DRAWDOWN / ACCOUNT STATE ──────────────────────────────────────────
      r05,  // getaccountsdrawdown — Logins (capital L, array)
      r06,  // getaccountsdrawdown — Logins + Groups
      r07,  // getaccountsdrawdown — login (lowercase)
      r08,  // getaccountsdrawdown — Login (singular)

      // ── ORDER/POSITION HISTORY ─────────────────────────────────────────────
      r09,  // /api/v1/order/get-order-history full schema
      r10,  // /api/v1/deal/get-positions (alternate path)
      r11,  // /api/v1/position/list
      r12,  // /api/v1/user/positions
    ] = await Promise.all([

      probe(apiBase, headers, '01_deal_history_base',
        '/api/v1/deal/get-deal-history', { ...dealBase }),

      probe(apiBase, headers, '02_entryStates_OUT',
        '/api/v1/deal/get-deal-history', { ...dealBase, entryStates: [1] }),

      probe(apiBase, headers, '03_entryStates_IN',
        '/api/v1/deal/get-deal-history', { ...dealBase, entryStates: [0] }),

      probe(apiBase, headers, '04_entryStates_all',
        '/api/v1/deal/get-deal-history', { ...dealBase, entryStates: [0, 1, 2] }),

      probe(apiBase, headers, '05_drawdown_Logins_array',
        '/api/v1/user/getaccountsdrawdown', ddBodyFixed),

      probe(apiBase, headers, '06_drawdown_Logins_Groups',
        '/api/v1/user/getaccountsdrawdown', ddBodyGroups),

      probe(apiBase, headers, '07_drawdown_login_lower',
        '/api/v1/user/getaccountsdrawdown', { login: loginNum, apikey: apiKey }),

      probe(apiBase, headers, '08_drawdown_Login_singular',
        '/api/v1/user/getaccountsdrawdown', { Login: loginNum, apikey: apiKey }),

      probe(apiBase, headers, '09_order_history',
        '/api/v1/order/get-order-history', { ...dealBase }),

      probe(apiBase, headers, '10_deal_get_positions',
        '/api/v1/deal/get-positions', { Login: loginNum, apikey: apiKey }),

      probe(apiBase, headers, '11_position_list',
        '/api/v1/position/list', { Login: loginNum, apikey: apiKey }),

      probe(apiBase, headers, '12_user_positions',
        '/api/v1/user/positions', { Login: loginNum, apikey: apiKey }),
    ]);

    const results = { r01, r02, r03, r04, r05, r06, r07, r08, r09, r10, r11, r12 };
    // Note: open position PnL is reflected via equity - balance delta from userget

    const working = Object.entries(results).filter(([, v]) => v.status === 200 && v.deal_count !== null && v.deal_count > 0);
    const ok200   = Object.entries(results).filter(([, v]) => v.status === 200);
    const errors  = Object.entries(results).filter(([, v]) => v.status !== 200);

    const diagnosis = working.length > 0
      ? `✅ WORKING (has data): ${working.map(([k, v]) => `${k} (${v.deal_count} records)`).join(', ')}`
      : ok200.length > 0
        ? `⚠️ HTTP 200 on ${ok200.length} variants but all empty — trades exist on MT5 but bridge returns nothing`
        : `❌ ALL FAILED`;

    console.log(`\nDIAGNOSIS: ${diagnosis}`);

    return Response.json({
      success: true,
      diagnosis,
      group_used: group,
      login_used: loginNum,
      userget_live: { balance: liveBalance, equity: liveEquity, open_pnl: parseFloat((liveEquity - liveBalance).toFixed(2)) },
      working_variants: working.map(([k, v]) => ({ key: k, count: v.deal_count, sample: v.response?.data?.[0] })),
      all_results: Object.fromEntries(
        Object.entries(results).map(([k, v]) => [k, { status: v.status, count: v.deal_count, response: v.response }])
      ),
    });

  } catch (error) {
    console.error('[e2eTestMT5] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});