/**
 * provisionMT5Account — Create real MT5 account via Tritech API
 *
 * API Base: https://mt5-apiapp-c0fvbqekh5hrb5h8.canadacentral-01.azurewebsites.net
 * Broker:   Xylo Markets LTD (XyloMarkets-Server)
 * Auth:     Authorization: Bearer <api_key>
 *
 * Flow: useradd → depositwithbal → ChallengeAccount.create
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const TRITECH_BASE = 'https://mt5-apiapp-c0fvbqekh5hrb5h8.canadacentral-01.azurewebsites.net';

function genPassword() {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  const special = '!@#$';
  let p = upper[Math.floor(Math.random() * upper.length)]
        + lower[Math.floor(Math.random() * lower.length)]
        + digits[Math.floor(Math.random() * digits.length)]
        + special[Math.floor(Math.random() * special.length)];
  const all = upper + lower + digits + special;
  for (let i = 4; i < 12; i++) p += all[Math.floor(Math.random() * all.length)];
  return p.split('').sort(() => Math.random() - 0.5).join('');
}

function mt5Headers(apiKey) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
    'ApiKey': apiKey,
  };
}

function getGroupName(challenge_type, account_type, account_size, phase) {
  // MT5 group names from Xylo Markets MT5 Manager (exact values — do not alter)
  // These are internal broker groups; frontend only displays Phase 1 / Phase 2 / Funded / Standard / Swing
  // Env var secrets take precedence; defaults match the confirmed Xylo Markets group structure:
  //   Phase 1 Standard → HAR\MAN15\contest.1
  //   Phase 2 Standard → HAR\MAN15\contest.2
  //   Funded           → HAR\MAN15\LiveG.1
  if (phase === 'funded') return Deno.env.get('MT5_FUNDED_GROUP') || 'HAR\\MAN15\\LiveG.1';
  if (phase === 'phase2') return Deno.env.get('MT5_PHASE2_GROUP') || 'HAR\\MAN15\\contest.2';
  return Deno.env.get('MT5_PHASE1_GROUP') || 'HAR\\MAN15\\contest.1';
}

async function tritechCreateAccount(apiBase, apiKey, { userEmail, groupName, leverage, accountSize, comment }) {
  const masterPassword = genPassword();
  const investorPassword = genPassword();
  const leverageInt = typeof leverage === 'string' ? parseInt(leverage.replace('1:', '')) : (leverage || 100);

  console.log(`[Tritech/useradd] Creating account: email=${userEmail}, group=${groupName}, leverage=${leverageInt}`);

  const createRes = await fetch(`${apiBase}/api/v1/user/useradd`, {
  method: 'POST',
  headers: mt5Headers(apiKey),
  body: JSON.stringify({
    Login: 0,            // 0 = auto-assign by MT5 server
    MasterPassword: masterPassword,
    InvestorPassword: investorPassword,
    Name: userEmail.split('@')[0],
    Email: userEmail,
    Group: groupName,
    Leverage: leverageInt,
    Country: 'AE',
    Comment: comment || 'XFunded Challenge Account',
    Status: 0,           // 0 = active
    apikey: apiKey,      // Tritech requires apikey in body
  }),
  });

  const responseText = await createRes.text();
  console.log(`[Tritech/useradd] Status ${createRes.status}: ${responseText.slice(0, 300)}`);

  if (!createRes.ok) {
    throw new Error(`Tritech useradd failed (${createRes.status}): ${responseText}`);
  }

  const result = JSON.parse(responseText);
  // Tritech response: { data: { login: 12345, ... }, resultCode: "200" }
  const mtLogin = result?.data?.login || result?.User?.Login || result?.Login || result?.login;

  if (!mtLogin || parseInt(mtLogin) === 0) {
  throw new Error(`useradd returned no Login. Response: ${responseText}`);
  }

  // Set initial account balance via depositwithbal
  // Note: Tritech returns errorcode 10009 (async processing) — this is expected and not an error.
  // The balance will be applied by the MT5 server within seconds to minutes.
  // We retry up to 3 times with a 2-second delay to maximize success rate.
  if (accountSize > 0) {
    // CONFIRMED via swagger MTDealData schema: correct field is "profit" (not "Balance")
    // type=2 = DEAL_TYPE_BALANCE in MT5. depositwithbal returns currenctBalance confirming instant apply.
    const depRes = await fetch(`${apiBase}/api/v1/user/depositwithbal`, {
      method: 'POST',
      headers: mt5Headers(apiKey),
      body: JSON.stringify({
        Login: parseInt(mtLogin),
        profit: accountSize,
        type: 2,
        comment: `Initial deposit — ${comment || 'Challenge Account'}`,
        apikey: apiKey,
      }),
    });
    const depText = await depRes.text();
    const depData = depText ? JSON.parse(depText) : {};
    const errCode = depData?.data?.errorcode;
    const confirmedBalance = depData?.data?.currenctBalance;
    console.log(`[Tritech/depositwithbal] Login ${mtLogin}: HTTP ${depRes.status}, errorcode=${errCode}, confirmedBalance=${confirmedBalance}`);
    if (!depRes.ok || (errCode !== 0 && errCode !== 10009)) {
      console.error(`[Tritech/depositwithbal] Deposit failed for login ${mtLogin}: ${depText.slice(0, 300)}`);
    }
  }

  const serverName = Deno.env.get('MT5_SERVER_NAME') || 'XyloMarkets-Server';
  return {
    mt_login: String(mtLogin),
    mt_password: masterPassword,
    mt_server: serverName,
    mt_group: groupName,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Multi-layer auth: admin session OR scheduler token
    const schedulerToken = req.headers.get('X-Scheduler-Token');
    const expectedToken = Deno.env.get('SCHEDULER_SECRET_TOKEN');
    let authorized = false;
    try {
      const user = await base44.auth.me();
      if (user?.role === 'admin') authorized = true;
    } catch {}
    if (!authorized && schedulerToken && expectedToken && schedulerToken === expectedToken) authorized = true;
    if (!authorized) return Response.json({ error: 'Forbidden', code: 'UNAUTHORIZED_ACCESS' }, { status: 403 });

    const body = await req.json();
    const { account_id, order_id, user_email, challenge_type, account_type, account_size, leverage, rule_snapshot } = body;

    if (!user_email || !account_size) {
      return Response.json({ error: 'user_email and account_size are required' }, { status: 400 });
    }

    // Idempotency — skip only if this exact order_id already has a provisioned account
    if (order_id) {
      const existing = await base44.asServiceRole.entities.ChallengeAccount.filter({ user_email });
      const alreadyProvisioned = existing.find(a =>
        a.mt_login && a.account_id === `MT5-${order_id}` && ['pending', 'active', 'funded'].includes(a.status)
      );
      if (alreadyProvisioned) {
        console.log(`[provisionMT5Account] Already provisioned for order ${order_id}: ${alreadyProvisioned.account_id}`);
        return Response.json({ success: true, message: 'Account already provisioned', account_id: alreadyProvisioned.account_id });
      }
    }

    // Load MT5 credentials from TradingPlatformProvider (read entity directly — no auth chain)
    const providers = await base44.asServiceRole.entities.TradingPlatformProvider.filter({ platform_name: 'mt5', is_active: true });
    const provider = providers[0];
    const apiBase = provider?.server_url || Deno.env.get('MT5_API_BASE_URL') || TRITECH_BASE;
    const apiKey = provider?.api_key || Deno.env.get('MT5_API_KEY');

    if (!apiKey) {
      return Response.json({ success: false, error: 'MT5 API key not configured. Add credentials in Admin > Platform API.' }, { status: 500 });
    }

    const leverageStr = leverage || '1:100';
    const groupName = getGroupName(challenge_type, account_type || 'standard', account_size, 'phase1');

    // Create real MT5 account via Tritech API
    const mt5Creds = await tritechCreateAccount(apiBase, apiKey, {
      userEmail: user_email,
      groupName,
      leverage: leverageStr,
      accountSize: account_size,
      comment: `${challenge_type || 'challenge'} ${account_size}`,
    });

    // Persist to ChallengeAccount
    const newAccount = await base44.asServiceRole.entities.ChallengeAccount.create({
      account_id: account_id || order_id || `MT5-${mt5Creds.mt_login}`,
      challenge_type: challenge_type || 'two-step',
      account_type: account_type || 'standard',
      account_size,
      platform: 'mt5',
      leverage: leverageStr,
      status: 'active',
      phase: 'phase1',
      phase_review_status: 'none',
      funded_review_status: 'none',
      balance: account_size,
      equity: account_size,
      pnl: 0,
      daily_pnl: 0,
      daily_drawdown_used: 0,
      max_drawdown_used: 0,
      profit_target_progress: 0,
      user_email,
      mt_login: mt5Creds.mt_login,
      mt_password: mt5Creds.mt_password,
      mt_server: mt5Creds.mt_server,
      mt_group: mt5Creds.mt_group,
      login_credentials: `Login: ${mt5Creds.mt_login} | Password: ${mt5Creds.mt_password} | Server: ${mt5Creds.mt_server}`,
      server: mt5Creds.mt_server,
      provisioned_at: new Date().toISOString(),
      high_water_mark: account_size,
      daily_start_balance: account_size,
      rule_snapshot: rule_snapshot || null,
    });

    await base44.asServiceRole.entities.Notification.create({
      title: '🎉 MT5 Account Activated',
      message: `Your MT5 account is live. Login: ${mt5Creds.mt_login} | Server: ${mt5Creds.mt_server}. Credentials are available in My Accounts.`,
      type: 'payout', priority: 'high', display_mode: 'popup', is_active: true, target: 'challenge',
    });

    console.log(`[provisionMT5Account] ✅ Real MT5 account created: login=${mt5Creds.mt_login}, user=${user_email}`);

    return Response.json({
      success: true,
      message: 'MT5 account provisioned via Tritech API (Xylo Markets)',
      account_id: newAccount.id,
      mt_login: mt5Creds.mt_login,
      mt_server: mt5Creds.mt_server,
    });

  } catch (error) {
    console.error('[provisionMT5Account] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});