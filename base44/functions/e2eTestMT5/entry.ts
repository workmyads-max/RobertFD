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

    // Build the correct full schema body as documented
    const fullSchemaBase = {
      groups: group ? [group] : [],
      logins: [loginNum],
      from: fromISO,
      to: toISO,
      dateFrom: fromISO,
      dateTo: toISO,
      actionTypes: [],
      orderTypes: [],
      orderStates: [],
      entryStates: [],
      isFilterPosition: false,
      apikey: apiKey,
      pageOffset: 0,
      pageSize: 100,
    };

    const [
      // 1. Full schema — all arrays empty, isFilterPosition false
      r01,
      // 2. Full schema — isFilterPosition true (closed only)
      r02,
      // 3. Full schema — entryStates [1] = OUT (closed deals)
      r03,
      // 4. Full schema — actionTypes [0,1] (buy+sell)
      r04,
      // 5. Full schema — no groups array (login only)
      r05,
      // 6. Full schema — pageSize 0 (unlimited)
      r06,
      // 7. Full schema — orderStates [2] (filled/closed)
      r07,
      // 8. Full schema on /api/v1/deal/get-deal-details
      r08,
    ] = await Promise.all([

      probe(apiBase, headers, '01_full_schema_base',
        '/api/v1/deal/get-deal-history',
        { ...fullSchemaBase }),

      probe(apiBase, headers, '02_isFilterPosition_true',
        '/api/v1/deal/get-deal-history',
        { ...fullSchemaBase, isFilterPosition: true }),

      probe(apiBase, headers, '03_entryStates_OUT',
        '/api/v1/deal/get-deal-history',
        { ...fullSchemaBase, entryStates: [1] }),

      probe(apiBase, headers, '04_actionTypes_buy_sell',
        '/api/v1/deal/get-deal-history',
        { ...fullSchemaBase, actionTypes: [0, 1] }),

      probe(apiBase, headers, '05_no_groups',
        '/api/v1/deal/get-deal-history',
        { ...fullSchemaBase, groups: [] }),

      probe(apiBase, headers, '06_pageSize_zero',
        '/api/v1/deal/get-deal-history',
        { ...fullSchemaBase, pageSize: 0 }),

      probe(apiBase, headers, '07_orderStates_filled',
        '/api/v1/deal/get-deal-history',
        { ...fullSchemaBase, orderStates: [2] }),

      probe(apiBase, headers, '08_get_deal_details',
        '/api/v1/deal/get-deal-details',
        { ...fullSchemaBase }),
    ]);

    const results = { r01, r02, r03, r04, r05, r06, r07, r08 };

    const working = Object.entries(results).filter(([, v]) => v.status === 200 && v.deal_count !== null && v.deal_count > 0);
    const partial = Object.entries(results).filter(([, v]) => v.status === 200);
    const errors  = Object.entries(results).filter(([, v]) => v.status !== 200);

    const diagnosis = working.length > 0
      ? `✅ WORKING: ${working.map(([k, v]) => `${k} (${v.deal_count} deals)`).join(', ')}`
      : partial.length > 0
        ? `⚠️ HTTP 200 but 0 deals in all variants — check responses for structure`
        : `❌ ALL FAILED — HTTP 500/404 on all variants`;

    console.log(`\nDIAGNOSIS: ${diagnosis}`);
    console.log(`Group used: ${group}`);

    return Response.json({
      success: true,
      diagnosis,
      group_used: group,
      login_used: loginNum,
      full_schema_used: fullSchemaBase,
      working_variants: working.map(([k, v]) => ({ key: k, deals: v.deal_count })),
      all_200s: partial.map(([k, v]) => ({ key: k, status: v.status, deals: v.deal_count, response: v.response })),
      errors: errors.map(([k, v]) => ({ key: k, status: v.status })),
      results,
    });

  } catch (error) {
    console.error('[e2eTestMT5] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});