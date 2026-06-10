/**
 * e2eTestMT5 — Phase 4: Probe userget, getaccountsdrawdown, deal endpoints, and move-disabled investigation
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
    const { mt_login } = body;
    if (!mt_login) return Response.json({ error: 'mt_login required' }, { status: 400 });

    const providers = await base44.asServiceRole.entities.TradingPlatformProvider.filter({ platform_name: 'mt5', is_active: true });
    const provider = providers[0];
    const apiBase = provider?.server_url;
    const apiKey = provider?.api_key;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'ApiKey': apiKey,
    };
    const loginNum = parseInt(mt_login);
    const results = {};

    // ── TEST 1: userget (proper user lookup) ──────────────────────────────
    const usergetRes = await fetch(`${apiBase}/api/v1/user/userget`, {
      method: 'POST', headers,
      body: JSON.stringify({ Login: loginNum, apikey: apiKey }),
    });
    const usergetText = await usergetRes.text();
    results.userget = { status: usergetRes.status, body: (() => { try { return JSON.parse(usergetText); } catch { return usergetText; }})() };
    console.log(`[userget] ${usergetRes.status}: ${usergetText.slice(0,500)}`);

    // ── TEST 2: getaccountsdrawdown ────────────────────────────────────────
    const ddRes = await fetch(`${apiBase}/api/v1/user/getaccountsdrawdown`, {
      method: 'POST', headers,
      body: JSON.stringify({ Login: [loginNum], apikey: apiKey }),
    });
    const ddText = await ddRes.text();
    results.getaccountsdrawdown = { status: ddRes.status, body: (() => { try { return JSON.parse(ddText); } catch { return ddText; }})() };
    console.log(`[getaccountsdrawdown] ${ddRes.status}: ${ddText.slice(0,400)}`);

    // ── TEST 3: get-account-details (fresh — check if deposit applied) ─────
    const detRes = await fetch(`${apiBase}/api/v1/user/get-account-details`, {
      method: 'POST', headers,
      body: JSON.stringify({ Login: loginNum, apikey: apiKey }),
    });
    const detText = await detRes.text();
    const detData = JSON.parse(detText);
    results.account_details_now = {
      balance: detData?.data?.balance,
      equity: detData?.data?.equity,
      totalDeposit: detData?.data?.totalDeposit,
      group: detData?.data?.group,
    };
    console.log(`[get-account-details] balance=${detData?.data?.balance} equity=${detData?.data?.equity} totalDeposit=${detData?.data?.totalDeposit}`);

    // ── TEST 4: deal/get-deal-details (by position ID) ─────────────────────
    const dealRes = await fetch(`${apiBase}/api/v1/deal/get-deal-details`, {
      method: 'POST', headers,
      body: JSON.stringify({ Login: loginNum, apikey: apiKey }),
    });
    const dealText = await dealRes.text();
    results.get_deal_details = { status: dealRes.status, body: (() => { try { return JSON.parse(dealText); } catch { return dealText; }})() };
    console.log(`[get-deal-details] ${dealRes.status}: ${dealText.slice(0,400)}`);

    // ── TEST 5: get-deal-history with correct ISO format ──────────────────
    const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').split('.')[0];
    const to = new Date().toISOString().replace('T', ' ').split('.')[0];
    const histRes2 = await fetch(`${apiBase}/api/v1/deal/get-deal-history`, {
      method: 'POST', headers,
      body: JSON.stringify({ Login: loginNum, From: from, To: to, apikey: apiKey }),
    });
    const histText2 = await histRes2.text();
    results.deal_history_datetime_noms = { status: histRes2.status, body: histText2.slice(0,400) };
    console.log(`[deal-history no-ms] ${histRes2.status}: ${histText2.slice(0,400)}`);

    // ── TEST 6: get-position endpoint ──────────────────────────────────────
    const posRes = await fetch(`${apiBase}/api/v1/deal/get-position`, {
      method: 'POST', headers,
      body: JSON.stringify({ Login: loginNum, apikey: apiKey }),
    });
    const posText = await posRes.text();
    results.get_position = { status: posRes.status, body: (() => { try { return JSON.parse(posText); } catch { return posText; }})() };
    console.log(`[get-position] ${posRes.status}: ${posText.slice(0,400)}`);

    // ── TEST 7: move-disabled — try with Status field ─────────────────────
    const disRes2 = await fetch(`${apiBase}/api/v1/user/move-disabled`, {
      method: 'POST', headers,
      body: JSON.stringify({ Login: loginNum, Status: 0, apikey: apiKey }),
    });
    const disText2 = await disRes2.text();
    results.move_disabled_with_status = { status: disRes2.status, body: (() => { try { return JSON.parse(disText2); } catch { return disText2; }})() };
    console.log(`[move-disabled+status] ${disRes2.status}: ${disText2.slice(0,300)}`);

    // ── TEST 8: get-server-time ────────────────────────────────────────────
    const timeRes = await fetch(`${apiBase}/api/v1/user/get-server-time`, {
      method: 'POST', headers,
      body: JSON.stringify({ apikey: apiKey }),
    });
    const timeText = await timeRes.text();
    results.server_time = { status: timeRes.status, body: (() => { try { return JSON.parse(timeText); } catch { return timeText; }})() };
    console.log(`[get-server-time] ${timeRes.status}: ${timeText.slice(0,300)}`);

    return Response.json({ success: true, mt_login: loginNum, results });
  } catch (error) {
    console.error('[e2eTestMT5] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});