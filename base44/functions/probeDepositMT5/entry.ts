/**
 * probeDepositMT5 — Tests setting balance AT creation time via useradd Balance field
 * Admin only.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function mt5Headers(apiKey) {
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`, 'ApiKey': apiKey };
}
function genPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
  let p = 'A' + 'a' + '2' + '!';
  for (let i = 4; i < 12; i++) p += chars[Math.floor(Math.random() * chars.length)];
  return p.split('').sort(() => Math.random() - 0.5).join('');
}

async function createAndCheck(apiBase, headers, apiKey, label, body, depositAmount) {
  console.log(`\n[${label}] useradd body: ${JSON.stringify(body)}`);
  const res = await fetch(`${apiBase}/api/v1/user/useradd`, { method: 'POST', headers, body: JSON.stringify(body) });
  const text = await res.text();
  const data = JSON.parse(text);
  const login = data?.data?.login;
  console.log(`[${label}] useradd HTTP ${res.status}, login=${login}, raw=${text.slice(0, 400)}`);
  if (!login) return { label, status: res.status, error: 'no login', raw: data };

  // Wait 3s then check balance
  await new Promise(r => setTimeout(r, 3000));
  const checkRes = await fetch(`${apiBase}/api/v1/user/userget`, {
    method: 'POST', headers, body: JSON.stringify({ Login: login, apikey: apiKey }),
  });
  const checkData = checkRes.ok ? await checkRes.json() : {};
  const bal = parseFloat(checkData?.data?.Balance ?? checkData?.data?.balance ?? 0);
  console.log(`[${label}] balance after 3s: ${bal}`);
  return { label, login, balance_after_3s: bal, balance_worked: bal > 0 };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    try {
      const user = await base44.auth.me();
      if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    } catch { return Response.json({ error: 'Forbidden' }, { status: 403 }); }

    const body = await req.json();
    const depositAmount = body.amount || 100000;
    const groupName = body.group || 'HAR\\MAN15\\contest.1';

    const providers = await base44.asServiceRole.entities.TradingPlatformProvider.filter({ platform_name: 'mt5', is_active: true });
    const provider = providers[0];
    const apiBase = provider?.server_url;
    const apiKey = provider?.api_key;
    if (!apiBase || !apiKey) return Response.json({ error: 'MT5 credentials not configured' }, { status: 500 });

    const headers = mt5Headers(apiKey);
    const ts = Date.now();

    // Test: useradd WITH Balance field set at creation
    const r1 = await createAndCheck(apiBase, headers, apiKey, 'useradd_with_Balance', {
      Login: 0,
      MasterPassword: genPassword(),
      InvestorPassword: genPassword(),
      Name: 'probe_bal',
      Email: `probe_bal_${ts}@xfunded.com`,
      Group: groupName,
      Leverage: 100,
      Balance: depositAmount,    // <-- set balance at creation
      Country: 'AE',
      Comment: 'Balance at creation test',
      Status: 0,
      apikey: apiKey,
    }, depositAmount);

    // Test: useradd WITH Balance + Rights field (some MT5 managers need Rights=0x0000007f)
    const r2 = await createAndCheck(apiBase, headers, apiKey, 'useradd_Balance_Rights', {
      Login: 0,
      MasterPassword: genPassword(),
      InvestorPassword: genPassword(),
      Name: 'probe_rights',
      Email: `probe_rights_${ts}@xfunded.com`,
      Group: groupName,
      Leverage: 100,
      Balance: depositAmount,
      Rights: 127,              // standard trader rights
      Country: 'AE',
      Comment: 'Balance + Rights test',
      Status: 0,
      apikey: apiKey,
    }, depositAmount);

    const working = [r1, r2].filter(r => r.balance_worked);

    return Response.json({
      success: true,
      results: [r1, r2],
      diagnosis: working.length > 0
        ? `✅ BALANCE AT CREATION WORKS: ${working.map(r => `${r.label} login=${r.login} bal=${r.balance_after_3s}`).join(', ')}`
        : `❌ Balance field in useradd also does not work for this group`,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});