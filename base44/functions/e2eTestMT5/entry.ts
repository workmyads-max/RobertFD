/**
 * e2eTestMT5 — Account-Number-Wise Trade Data Probe
 *
 * Tries every known Tritech endpoint variant that accepts an account/login number,
 * using different field names, casing, and body structures.
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

async function probe(apiBase, headers, apiKey, label, path, body) {
  const url = `${apiBase}${path}`;
  console.log(`[PROBE] ${label} → POST ${path} | body: ${JSON.stringify(body)}`);
  try {
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    const text = await res.text();
    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = text || '(empty)'; }
    const dealCount = Array.isArray(parsed?.data) ? parsed.data.length : null;
    const result = { status: res.status, deal_count: dealCount, response: typeof parsed === 'string' ? parsed.slice(0, 400) : parsed };
    console.log(`[PROBE] ${label}: HTTP ${res.status}, deals=${dealCount ?? 'N/A'}, preview=${text.slice(0, 200)}`);
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

    // Standard date range
    const From = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').split('.')[0];
    const To   = new Date().toISOString().replace('T', ' ').split('.')[0];

    console.log(`\n${'='.repeat(60)}\nACCOUNT-NUMBER-WISE PROBE — login: ${loginNum}\n${'='.repeat(60)}`);

    // Run all probes in parallel for speed
    const [
      // ── FIELD NAME VARIANTS for deal/history ─────────────────────────────
      r01, r02, r03, r04, r05,
      // ── ACCOUNT field instead of Login ───────────────────────────────────
      r06, r07,
      // ── Different endpoint paths ──────────────────────────────────────────
      r08, r09, r10, r11, r12, r13,
      // ── GET method variants ───────────────────────────────────────────────
    ] = await Promise.all([

      // 1. Login (int) + From/To — standard
      probe(apiBase, headers, apiKey, '01_login_int_from_to',
        '/api/v1/deal/get-deal-history',
        { Login: loginNum, From, To, apikey: apiKey }),

      // 2. login (lowercase) + From/To
      probe(apiBase, headers, apiKey, '02_login_lower',
        '/api/v1/deal/get-deal-history',
        { login: loginNum, From, To, apikey: apiKey }),

      // 3. AccountId field
      probe(apiBase, headers, apiKey, '03_accountid_field',
        '/api/v1/deal/get-deal-history',
        { AccountId: loginNum, From, To, apikey: apiKey }),

      // 4. account field (lowercase)
      probe(apiBase, headers, apiKey, '04_account_lower',
        '/api/v1/deal/get-deal-history',
        { account: loginNum, From, To, apikey: apiKey }),

      // 5. Login as string instead of int
      probe(apiBase, headers, apiKey, '05_login_string',
        '/api/v1/deal/get-deal-history',
        { Login: String(loginNum), From, To, apikey: apiKey }),

      // 6. AccountNumber field
      probe(apiBase, headers, apiKey, '06_account_number_field',
        '/api/v1/deal/get-deal-history',
        { AccountNumber: loginNum, From, To, apikey: apiKey }),

      // 7. UserId field
      probe(apiBase, headers, apiKey, '07_userid_field',
        '/api/v1/deal/get-deal-history',
        { UserId: loginNum, From, To, apikey: apiKey }),

      // 8. Different path: /api/v1/history/deals
      probe(apiBase, headers, apiKey, '08_history_deals_path',
        '/api/v1/history/deals',
        { Login: loginNum, From, To, apikey: apiKey }),

      // 9. /api/v1/deal/history
      probe(apiBase, headers, apiKey, '09_deal_history_alt_path',
        '/api/v1/deal/history',
        { Login: loginNum, From, To, apikey: apiKey }),

      // 10. /api/v1/trade/get-history
      probe(apiBase, headers, apiKey, '10_trade_get_history',
        '/api/v1/trade/get-history',
        { Login: loginNum, From, To, apikey: apiKey }),

      // 11. /api/v1/trade/history
      probe(apiBase, headers, apiKey, '11_trade_history',
        '/api/v1/trade/history',
        { Login: loginNum, From, To, apikey: apiKey }),

      // 12. get-deal-history with Logins (array)
      probe(apiBase, headers, apiKey, '12_logins_array',
        '/api/v1/deal/get-deal-history',
        { Logins: [loginNum], From, To, apikey: apiKey }),

      // 13. /api/v1/deal/get-closed-positions
      probe(apiBase, headers, apiKey, '13_get_closed_positions',
        '/api/v1/deal/get-closed-positions',
        { Login: loginNum, From, To, apikey: apiKey }),
    ]);

    const results = { r01, r02, r03, r04, r05, r06, r07, r08, r09, r10, r11, r12, r13 };

    // Find any that returned 200 with actual data
    const working = Object.entries(results).filter(([, v]) => v.status === 200 && v.deal_count !== null);
    const partial = Object.entries(results).filter(([, v]) => v.status === 200 && v.deal_count === null);
    const notFound = Object.entries(results).filter(([, v]) => v.status === 404);
    const errors   = Object.entries(results).filter(([, v]) => v.status === 500 || v.status === 400);

    const diagnosis = working.length > 0
      ? `✅ FOUND WORKING VARIANT(S): ${working.map(([k]) => k).join(', ')}`
      : partial.length > 0
        ? `⚠️ HTTP 200 but no data array in: ${partial.map(([k]) => k).join(', ')} — check full response`
        : `❌ ALL VARIANTS FAILED. 404s: ${notFound.length}, 500/400s: ${errors.length}. Bridge does not expose deal history by account number.`;

    console.log(`\nDIAGNOSIS: ${diagnosis}`);

    return Response.json({
      success: true,
      diagnosis,
      working_variants: working.map(([k, v]) => ({ key: k, deals: v.deal_count })),
      partial_200s: partial.map(([k, v]) => ({ key: k, response: v.response })),
      results,
    });

  } catch (error) {
    console.error('[e2eTestMT5] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});