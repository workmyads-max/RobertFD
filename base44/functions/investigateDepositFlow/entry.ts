/**
 * investigateDepositFlow — Full payload logging for MT5 provisioning investigation
 * Tests: useradd → depositwithbal → userget (immediate) → userget (after delay)
 * Also tests depositwithbal on an existing login to rule out timing issues.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    let authorized = false;
    try { const u = await base44.auth.me(); if (u?.role === 'admin') authorized = true; } catch {}
    if (!authorized) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const providers = await base44.asServiceRole.entities.TradingPlatformProvider.filter({ platform_name: 'mt5', is_active: true });
    const provider = providers[0];
    const apiBase = provider?.server_url;
    const apiKey = provider?.api_key;

    if (!apiBase || !apiKey) return Response.json({ error: 'MT5 provider not configured' }, { status: 500 });

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'ApiKey': apiKey,
    };

    const log = [];

    // ── STEP 1: useradd ──────────────────────────────────────────────────────
    const ts = Date.now();
    const useradd_body = {
      Login: 0,
      MasterPassword: 'Invest2024!A',
      InvestorPassword: 'Invest2024!B',
      Name: `inv_test_${ts}`,
      Email: `inv_test_${ts}@xfunded.com`,
      Group: 'HAR\\MAN15\\contest.1',
      Leverage: 100,
      Country: 'AE',
      Comment: 'Investigation test account',
      Status: 0,
      apikey: apiKey,
    };

    console.log('[STEP 1] useradd REQUEST:', JSON.stringify(useradd_body));
    log.push({ step: 'useradd_request', payload: useradd_body });

    const useradd_res = await fetch(`${apiBase}/api/v1/user/useradd`, {
      method: 'POST', headers, body: JSON.stringify(useradd_body),
    });
    const useradd_text = await useradd_res.text();
    console.log('[STEP 1] useradd RESPONSE HTTP:', useradd_res.status);
    console.log('[STEP 1] useradd RESPONSE BODY:', useradd_text);
    log.push({ step: 'useradd_response', http_status: useradd_res.status, body: useradd_text });

    const useradd_data = JSON.parse(useradd_text);
    const mt_login = useradd_data?.data?.login;

    if (!mt_login) {
      return Response.json({ error: 'useradd failed — no login returned', log }, { status: 500 });
    }

    // ── STEP 2: depositwithbal (immediate, attempt 1) ──────────────────────
    const dep1_body = {
      Login: parseInt(mt_login),
      Balance: 100000,
      Comment: 'Investigation initial deposit',
      apikey: apiKey,
    };
    console.log('[STEP 2] depositwithbal REQUEST (attempt 1):', JSON.stringify(dep1_body));
    log.push({ step: 'depositwithbal_request_1', payload: dep1_body });

    const dep1_res = await fetch(`${apiBase}/api/v1/user/depositwithbal`, {
      method: 'POST', headers, body: JSON.stringify(dep1_body),
    });
    const dep1_text = await dep1_res.text();
    console.log('[STEP 2] depositwithbal RESPONSE HTTP:', dep1_res.status);
    console.log('[STEP 2] depositwithbal RESPONSE BODY:', dep1_text);
    log.push({ step: 'depositwithbal_response_1', http_status: dep1_res.status, body: dep1_text });

    // ── STEP 3: userget IMMEDIATELY after deposit ─────────────────────────
    const ug1_body = { Login: parseInt(mt_login), apikey: apiKey };
    console.log('[STEP 3] userget IMMEDIATE REQUEST:', JSON.stringify(ug1_body));
    const ug1_res = await fetch(`${apiBase}/api/v1/user/userget`, {
      method: 'POST', headers, body: JSON.stringify(ug1_body),
    });
    const ug1_text = await ug1_res.text();
    console.log('[STEP 3] userget IMMEDIATE RESPONSE:', ug1_text);
    log.push({ step: 'userget_immediate', http_status: ug1_res.status, body: ug1_text });

    // ── STEP 4: deposit again via /api/v1/user/deposit endpoint ──────────
    const dep2_body = {
      Login: parseInt(mt_login),
      Balance: 100000,
      Comment: 'Investigation deposit via /deposit',
      apikey: apiKey,
    };
    console.log('[STEP 4] /deposit REQUEST:', JSON.stringify(dep2_body));
    const dep2_res = await fetch(`${apiBase}/api/v1/user/deposit`, {
      method: 'POST', headers, body: JSON.stringify(dep2_body),
    });
    const dep2_text = await dep2_res.text();
    console.log('[STEP 4] /deposit RESPONSE HTTP:', dep2_res.status);
    console.log('[STEP 4] /deposit RESPONSE BODY:', dep2_text);
    log.push({ step: 'deposit_endpoint_response', http_status: dep2_res.status, body: dep2_text });

    // ── STEP 5: Try /deal/deposit endpoint ────────────────────────────────
    const dep3_body = { Login: parseInt(mt_login), Amount: 100000, Comment: 'deal deposit test', apikey: apiKey };
    console.log('[STEP 5] /deal/deposit REQUEST:', JSON.stringify(dep3_body));
    const dep3_res = await fetch(`${apiBase}/api/v1/deal/deposit`, {
      method: 'POST', headers, body: JSON.stringify(dep3_body),
    });
    const dep3_text = await dep3_res.text();
    console.log('[STEP 5] /deal/deposit RESPONSE:', dep3_res.status, dep3_text);
    log.push({ step: 'deal_deposit_response', http_status: dep3_res.status, body: dep3_text });

    // ── STEP 6: Try depositwithbal with Type field ─────────────────────────
    const dep4_body = { Login: parseInt(mt_login), Balance: 100000, Type: 2, Comment: 'Type=2 deposit test', apikey: apiKey };
    const dep4_res = await fetch(`${apiBase}/api/v1/user/depositwithbal`, {
      method: 'POST', headers, body: JSON.stringify(dep4_body),
    });
    const dep4_text = await dep4_res.text();
    console.log('[STEP 6] depositwithbal Type=2 RESPONSE:', dep4_res.status, dep4_text);
    log.push({ step: 'depositwithbal_type2_response', http_status: dep4_res.status, body: dep4_text });

    // ── STEP 7: Try balance via userupdate ────────────────────────────────
    const upd_body = { Login: parseInt(mt_login), Balance: 100000, apikey: apiKey };
    const upd_res = await fetch(`${apiBase}/api/v1/user/userupdate`, {
      method: 'POST', headers, body: JSON.stringify(upd_body),
    });
    const upd_text = await upd_res.text();
    console.log('[STEP 7] userupdate RESPONSE:', upd_res.status, upd_text.slice(0, 200));
    log.push({ step: 'userupdate_balance_response', http_status: upd_res.status, body: upd_text.slice(0, 300) });

    // ── STEP 8: userget AFTER ALL DEPOSIT ATTEMPTS ────────────────────────
    const ug2_res = await fetch(`${apiBase}/api/v1/user/userget`, {
      method: 'POST', headers, body: JSON.stringify({ Login: parseInt(mt_login), apikey: apiKey }),
    });
    const ug2_text = await ug2_res.text();
    console.log('[STEP 8] userget AFTER DEPOSITS RESPONSE:', ug2_text);
    log.push({ step: 'userget_after_deposits', http_status: ug2_res.status, body: ug2_text });

    // ── STEP 9: Check all available API endpoints (swagger/discovery) ─────
    const discoveryAttempts = [
      '/swagger/v1/swagger.json',
      '/api/v1',
      '/api',
      '/health',
    ];
    const discovery = [];
    for (const path of discoveryAttempts) {
      const r = await fetch(`${apiBase}${path}`, { method: 'GET', headers }).catch(() => null);
      if (r) {
        const t = await r.text().catch(() => '');
        discovery.push({ path, status: r.status, preview: t.slice(0, 200) });
      }
    }
    log.push({ step: 'api_discovery', results: discovery });
    console.log('[STEP 9] API Discovery:', JSON.stringify(discovery));

    // ── SUMMARY ───────────────────────────────────────────────────────────
    const ug2_data = JSON.parse(ug2_text);
    const final_balance = ug2_data?.data?.balance;
    const dep1_data = JSON.parse(dep1_text);

    return Response.json({
      investigation_complete: true,
      mt_login,
      group_used: 'HAR\\MAN15\\contest.1',
      useradd_group_confirmed: useradd_data?.data?.group,
      dep1_errorcode: dep1_data?.data?.errorcode,
      dep1_errormsg: dep1_data?.data?.errormsg,
      balance_after_all_attempts: final_balance,
      deposit_landed: final_balance > 0,
      log,
    });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});