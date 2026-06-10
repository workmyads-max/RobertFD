/**
 * e2eTestMT5 — Deal History Deep Diagnostic
 *
 * Modes:
 *   1. { "mt_login": "900909613752" }
 *      → Tests all date formats on contest.1 group account
 *
 *   2. { "mt_login": "900909613752", "create_liveg_account": true }
 *      → Creates a temp $1000 account on HAR\MAN15\LiveG.1
 *      → Tests deal-history on BOTH groups side-by-side
 *      → Proves whether failure is group-specific
 *
 *   3. { "mt_login": "900909613752", "second_login": "<existing LiveG.1 login>" }
 *      → Tests both logins without creating a new account
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function mt5Headers(apiKey) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
    'ApiKey': apiKey,
  };
}

async function testDealHistory(apiBase, apiKey, loginNum, label) {
  const headers = mt5Headers(apiKey);
  const now = new Date();
  const past90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const past7  = new Date(Date.now() -  7 * 24 * 60 * 60 * 1000);

  // Confirm group first
  let group = 'unknown';
  let balance = 0;
  try {
    const ug = await fetch(`${apiBase}/api/v1/user/userget`, {
      method: 'POST', headers,
      body: JSON.stringify({ Login: loginNum, apikey: apiKey }),
    });
    const ugData = await ug.json();
    group   = ugData?.data?.group || 'unknown';
    balance = ugData?.data?.balance || 0;
  } catch (e) {
    group = 'ERROR: ' + e.message;
  }
  console.log(`[${label}] group=${group}, balance=${balance}`);

  // Date format variants — all known string patterns
  const variants = [
    { name: 'space_90d',      From: past90.toISOString().replace('T',' ').split('.')[0], To: now.toISOString().replace('T',' ').split('.')[0] },
    { name: 'space_7d',       From: past7.toISOString().replace('T',' ').split('.')[0],  To: now.toISOString().replace('T',' ').split('.')[0] },
    { name: 'iso_Z_90d',      From: past90.toISOString(), To: now.toISOString() },
    { name: 'iso_noZ_90d',    From: past90.toISOString().replace('Z',''), To: now.toISOString().replace('Z','') },
    { name: 'date_only_90d',  From: past90.toISOString().split('T')[0], To: now.toISOString().split('T')[0] },
    { name: 'no_dates',       From: undefined, To: undefined },
  ];

  const deal_history = {};
  for (const v of variants) {
    const reqBody = v.From !== undefined
      ? { Login: loginNum, From: v.From, To: v.To, apikey: apiKey }
      : { Login: loginNum, apikey: apiKey };

    console.log(`[${label}] deal-history/${v.name} — body: ${JSON.stringify(reqBody)}`);
    try {
      const res = await fetch(`${apiBase}/api/v1/deal/get-deal-history`, {
        method: 'POST', headers, body: JSON.stringify(reqBody),
      });
      const text = await res.text();
      let parsed; try { parsed = JSON.parse(text); } catch { parsed = text || '(empty body)'; }
      const count = Array.isArray(parsed?.data) ? parsed.data.length : null;
      deal_history[v.name] = {
        status: res.status,
        request: reqBody,
        deal_count: count,
        response_preview: typeof parsed === 'string' ? parsed.slice(0,200) : parsed,
      };
      console.log(`[${label}] ${v.name}: HTTP ${res.status}, deals=${count ?? 'N/A'}, body=${text.slice(0,150)}`);
    } catch (e) {
      deal_history[v.name] = { status: 'EXCEPTION', error: e.message };
    }
  }

  // Also test get-position (open trades)
  let open_positions = {};
  try {
    const res = await fetch(`${apiBase}/api/v1/deal/get-position`, {
      method: 'POST', headers, body: JSON.stringify({ Login: loginNum, apikey: apiKey }),
    });
    const text = await res.text();
    let parsed; try { parsed = JSON.parse(text); } catch { parsed = text; }
    open_positions = { status: res.status, count: Array.isArray(parsed?.data) ? parsed.data.length : null, data: parsed?.data };
    console.log(`[${label}] get-position: HTTP ${res.status}, open=${open_positions.count}`);
  } catch (e) {
    open_positions = { status: 'EXCEPTION', error: e.message };
  }

  // Determine working formats
  const working = Object.entries(deal_history)
    .filter(([, v]) => v.status === 200 && v.deal_count !== null)
    .map(([k, v]) => ({ format: k, deals: v.deal_count }));

  return { group, balance, deal_history, open_positions, working_formats: working };
}

async function createLiveGAccount(apiBase, apiKey) {
  const headers = mt5Headers(apiKey);
  const liveGroup = 'HAR\\MAN15\\LiveG.1';
  const pass = 'TmpTest1!' + Math.floor(Math.random() * 9000 + 1000);

  console.log(`[createLiveG] Creating temp account on ${liveGroup}`);
  const res = await fetch(`${apiBase}/api/v1/user/useradd`, {
    method: 'POST', headers,
    body: JSON.stringify({
      Login: 0,
      MasterPassword: pass,
      InvestorPassword: pass + 'I',
      Name: 'diagtest_liveg',
      Email: 'diagtest_liveg@xfundedtrader.com',
      Group: liveGroup,
      Leverage: 100,
      Country: 'AE',
      Comment: 'Temp diagnostic account — delete after test',
      Status: 0,
      apikey: apiKey,
    }),
  });
  const text = await res.text();
  console.log(`[createLiveG] useradd ${res.status}: ${text.slice(0, 300)}`);
  if (!res.ok) throw new Error(`useradd failed (${res.status}): ${text}`);

  const data = JSON.parse(text);
  const login = data?.data?.login || data?.Login || data?.login;
  if (!login) throw new Error(`useradd returned no login: ${text}`);

  // Deposit $1000 so deal-history has something to query
  const depRes = await fetch(`${apiBase}/api/v1/user/depositwithbal`, {
    method: 'POST', headers,
    body: JSON.stringify({ Login: parseInt(login), Balance: 1000, Comment: 'Diag deposit', apikey: apiKey }),
  });
  const depText = await depRes.text();
  console.log(`[createLiveG] depositwithbal ${depRes.status}: ${depText.slice(0, 200)}`);

  return { login: String(login), password: pass, group: liveGroup };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    try {
      const user = await base44.auth.me();
      if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    } catch { return Response.json({ error: 'Forbidden' }, { status: 403 }); }

    const body = await req.json();
    const { mt_login, second_login, create_liveg_account } = body;
    if (!mt_login) return Response.json({ error: 'mt_login required' }, { status: 400 });

    const providers = await base44.asServiceRole.entities.TradingPlatformProvider.filter({ platform_name: 'mt5', is_active: true });
    const provider = providers[0];
    const apiBase = provider?.server_url;
    const apiKey = provider?.api_key;
    if (!apiBase || !apiKey) return Response.json({ error: 'MT5 credentials not configured' }, { status: 500 });

    console.log(`\n${'='.repeat(60)}\nDEAL HISTORY DIAGNOSTIC\nAPI: ${apiBase}\n${'='.repeat(60)}`);

    // Primary account (contest.1)
    const primaryResult = await testDealHistory(apiBase, apiKey, parseInt(mt_login), `contest_${mt_login}`);

    // Secondary — either provided login or create a fresh LiveG.1 account
    let secondaryResult = null;
    let createdAccount = null;

    if (second_login) {
      secondaryResult = await testDealHistory(apiBase, apiKey, parseInt(second_login), `secondary_${second_login}`);
    } else if (create_liveg_account) {
      try {
        createdAccount = await createLiveGAccount(apiBase, apiKey);
        console.log(`\n[LiveG.1 created] login=${createdAccount.login}, group=${createdAccount.group}`);
        secondaryResult = await testDealHistory(apiBase, apiKey, parseInt(createdAccount.login), `liveg_${createdAccount.login}`);
      } catch (e) {
        secondaryResult = { error: e.message, note: 'LiveG.1 account creation failed — group may not exist on this server' };
        console.error(`[createLiveG] FAILED: ${e.message}`);
      }
    }

    // Diagnosis
    const primaryWorking   = primaryResult.working_formats?.length > 0;
    const secondaryWorking = secondaryResult?.working_formats?.length > 0;

    let diagnosis;
    if (!secondaryResult) {
      diagnosis = primaryWorking
        ? `✅ deal-history WORKS on ${primaryResult.group} with: ${primaryResult.working_formats.map(f=>f.format).join(', ')}`
        : `❌ deal-history FAILS on ALL formats for group [${primaryResult.group}] — HTTP 500 empty body = broker-side bridge crash`;
    } else if (!primaryWorking && secondaryWorking) {
      diagnosis = `🔴 GROUP-SPECIFIC: deal-history FAILS on [${primaryResult.group}] but WORKS on [${secondaryResult.group}]. Confirmed Tritech bridge limitation for contest group type.`;
    } else if (!primaryWorking && !secondaryWorking) {
      diagnosis = `🔴 GLOBAL: deal-history FAILS on BOTH groups. Bridge-level or server-level issue — not group-specific.`;
    } else if (primaryWorking && secondaryWorking) {
      diagnosis = `✅ deal-history WORKS on BOTH groups.`;
    } else {
      diagnosis = `⚠️ Inconclusive — check detailed results.`;
    }

    console.log(`\nDIAGNOSIS: ${diagnosis}`);

    return Response.json({
      success: true,
      diagnosis,
      primary:   { login: mt_login,      ...primaryResult },
      secondary: secondaryResult ? { login: second_login || createdAccount?.login, ...secondaryResult } : null,
      created_account: createdAccount,
    });

  } catch (error) {
    console.error('[e2eTestMT5] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});