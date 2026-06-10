/**
 * probeDepositMT5 — Tests ALL deposit methods on Tritech API
 * to find which one actually works for the contest.1 group.
 *
 * Tests: deposit, depositwithbal, creditin, bonusin
 * Admin only.
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
  console.log(`[PROBE] ${label} → POST ${path} body=${JSON.stringify(body)}`);
  try {
    const res = await fetch(`${apiBase}${path}`, {
      method: 'POST', headers, body: JSON.stringify(body),
    });
    const text = await res.text();
    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = text || '(empty)'; }
    console.log(`[PROBE] ${label}: HTTP ${res.status}, body=${text.slice(0, 400)}`);
    return { label, status: res.status, response: parsed };
  } catch (e) {
    console.error(`[PROBE] ${label}: EXCEPTION — ${e.message}`);
    return { label, status: 'EXCEPTION', error: e.message };
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
    const { mt_login, amount } = body;
    if (!mt_login) return Response.json({ error: 'mt_login required' }, { status: 400 });

    const depositAmount = amount || 100000;

    const providers = await base44.asServiceRole.entities.TradingPlatformProvider.filter({ platform_name: 'mt5', is_active: true });
    const provider = providers[0];
    const apiBase = provider?.server_url;
    const apiKey = provider?.api_key;
    if (!apiBase || !apiKey) return Response.json({ error: 'MT5 credentials not configured' }, { status: 500 });

    const headers = mt5Headers(apiKey);
    const loginNum = parseInt(mt_login);

    // First check current balance
    const beforeRes = await fetch(`${apiBase}/api/v1/user/userget`, {
      method: 'POST', headers,
      body: JSON.stringify({ Login: loginNum, apikey: apiKey }),
    });
    const beforeData = beforeRes.ok ? await beforeRes.json() : {};
    const balBefore = parseFloat(beforeData?.data?.Balance ?? beforeData?.data?.balance ?? 0);
    console.log(`[BEFORE] login ${loginNum}: balance=${balBefore}`);

    // Try ALL deposit endpoints with different body schemas
    const results = await Promise.all([

      // 1. depositwithbal — current impl (broken for contest.1)
      probe(apiBase, headers, 'depositwithbal_current', '/api/v1/user/depositwithbal', {
        Login: loginNum,
        Balance: depositAmount,
        Comment: 'Test deposit v1',
        apikey: apiKey,
      }),

      // 2. deposit — different endpoint, may use different MT5 path
      probe(apiBase, headers, 'deposit_Login_Balance', '/api/v1/user/deposit', {
        Login: loginNum,
        Balance: depositAmount,
        Comment: 'Test deposit v2',
        apikey: apiKey,
      }),

      // 3. deposit with Amount field instead of Balance
      probe(apiBase, headers, 'deposit_Login_Amount', '/api/v1/user/deposit', {
        Login: loginNum,
        Amount: depositAmount,
        Comment: 'Test deposit v3',
        apikey: apiKey,
      }),

      // 4. creditin — MT5 credit operation (different from balance deposit)
      probe(apiBase, headers, 'creditin', '/api/v1/user/creditin', {
        Login: loginNum,
        Balance: depositAmount,
        Comment: 'Test credit in',
        apikey: apiKey,
      }),

      // 5. bonusin — bonus credit
      probe(apiBase, headers, 'bonusin', '/api/v1/user/bonusin', {
        Login: loginNum,
        Balance: depositAmount,
        Comment: 'Test bonus in',
        apikey: apiKey,
      }),

      // 6. depositwithbal with Amount instead of Balance
      probe(apiBase, headers, 'depositwithbal_Amount', '/api/v1/user/depositwithbal', {
        Login: loginNum,
        Amount: depositAmount,
        Comment: 'Test deposit v4',
        apikey: apiKey,
      }),

      // 7. deposit with integer Balance (no decimal)
      probe(apiBase, headers, 'deposit_integer', '/api/v1/user/deposit', {
        Login: loginNum,
        Balance: parseInt(depositAmount),
        Comment: 'Test deposit integer',
        apikey: apiKey,
      }),
    ]);

    // Wait 3 seconds then check balance again
    await new Promise(r => setTimeout(r, 3000));

    const afterRes = await fetch(`${apiBase}/api/v1/user/userget`, {
      method: 'POST', headers,
      body: JSON.stringify({ Login: loginNum, apikey: apiKey }),
    });
    const afterData = afterRes.ok ? await afterRes.json() : {};
    const balAfter = parseFloat(afterData?.data?.Balance ?? afterData?.data?.balance ?? 0);
    console.log(`[AFTER 3s] login ${loginNum}: balance=${balAfter}`);

    const balanceChanged = balAfter !== balBefore;
    const netDeposited = balAfter - balBefore;

    return Response.json({
      success: true,
      login: loginNum,
      balance_before: balBefore,
      balance_after_3s: balAfter,
      balance_changed: balanceChanged,
      net_deposited: netDeposited,
      diagnosis: balanceChanged
        ? `✅ DEPOSIT WORKED — balance went from ${balBefore} to ${balAfter} (+${netDeposited})`
        : `❌ NO BALANCE CHANGE — all deposit methods failed or are async pending`,
      results,
    });

  } catch (error) {
    console.error('[probeDepositMT5] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});