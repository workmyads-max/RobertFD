/**
 * provisionMT5Account — Create real MT5 account via Tritech API
 *
 * API Base: https://mt5-apiapp-c0fvbqekh5hrb5h8.canadacentral-01.azurewebsites.net
 * Broker:   Xylo Markets LTD (XyloMarkets-Server)
 * Auth:     Manager Login + Password (required for useradd)
 *
 * Flow: useradd → depositwithbal → ChallengeAccount.create
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow service role internal calls (invoked from manualCryptoReview, etc.)
    // OR direct admin calls from the frontend
    let isAuthorized = false;
    try {
      const user = await base44.auth.me();
      if (user?.role === 'admin') isAuthorized = true;
    } catch (_) {}

    // Check for internal service-role invocation via Authorization header
    // base44.asServiceRole.functions.invoke passes a service token automatically
    const authHeader = req.headers.get('authorization') || '';
    if (authHeader.includes('service')) isAuthorized = true;

    // Also allow if called with a valid scheduler secret (internal automation)
    const internalSecret = req.headers.get('x-internal-secret');
    if (internalSecret && internalSecret === Deno.env.get('SCHEDULER_SECRET_TOKEN')) isAuthorized = true;

    if (!isAuthorized) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { account_id, order_id, user_email, challenge_type, account_type, account_size, leverage, rule_snapshot } = body;

    if (!user_email || !account_size) {
      return Response.json({ error: 'user_email and account_size are required' }, { status: 400 });
    }

    // Load MT5 credentials from TradingPlatformProvider
    const providers = await base44.asServiceRole.entities.TradingPlatformProvider.filter({ platform_name: 'mt5', is_active: true });
    const provider = providers[0];
    const apiBase = provider?.server_url;
    const apiKey = provider?.api_key;
    const managerLogin = provider?.manager_login;
    const managerPassword = provider?.manager_password;

    console.log(`[provisionMT5Account] Credentials: apiBase=${apiBase}, apiKey=${apiKey ? apiKey.slice(0, 8) + '...' : 'MISSING'}, managerLogin=${managerLogin}, managerPassword=${managerPassword ? managerPassword.slice(0, 3) + '***' : 'MISSING'}`);

    if (!apiBase || !apiKey || !managerLogin || !managerPassword) {
      return Response.json({ error: 'MT5 credentials incomplete' }, { status: 500 });
    }

    // Generate passwords
    const masterPassword = genPassword();
    const investorPassword = genPassword();
    const leverageInt = typeof leverage === 'string' ? parseInt(leverage.replace('1:', '')) : 100;
    const groupName = 'HAR\\MAN15\\contest.1';

    // Build custom account name: "100k Phase1 XFunded Trader 2 Step"
    const sizeK = account_size >= 1000000 ? `${account_size / 1000000}M` : `${account_size / 1000}K`;
    const phaseName = 'Phase1';
    const brandName = 'XFunded Trader';
    const stepName = challenge_type === 'two-step' ? '2 Step' : challenge_type === 'instant' ? 'Instant' : 'Light';
    const accountName = `${sizeK} ${phaseName} ${brandName} ${stepName}`;

    console.log(`[provisionMT5Account] Creating account: name="${accountName}", email=${user_email}, group=${groupName}, leverage=${leverageInt}`);

    // Create MT5 account with manager authentication
    const headers = {
      'Content-Type': 'application/json',
      'ApiKey': apiKey,
      'ManagerLogin': managerLogin,
      'ManagerPassword': managerPassword,
    };

    const createRes = await fetch(`${apiBase}/api/v1/user/useradd`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        Login: 0,
        MasterPassword: masterPassword,
        InvestorPassword: investorPassword,
        Name: accountName,
        Email: user_email,
        Group: groupName,
        Leverage: leverageInt,
        Country: 'AE',
        Comment: `${challenge_type || 'challenge'} ${account_size}`,
        Status: 0,
        apikey: apiKey,
      }),
    });

    const responseText = await createRes.text();
    console.log(`[provisionMT5Account] Status ${createRes.status}: ${responseText.slice(0, 300)}`);

    if (!createRes.ok) {
      throw new Error(`useradd failed (${createRes.status}): ${responseText}`);
    }

    const result = JSON.parse(responseText);
    const mtLogin = result?.data?.login;

    if (!mtLogin || parseInt(mtLogin) === 0) {
      throw new Error(`useradd returned no Login. Response: ${responseText}`);
    }

    console.log(`[provisionMT5Account] ✅ MT5 account created: login=${mtLogin}`);

    // Deposit initial balance
    if (account_size > 0) {
      const depRes = await fetch(`${apiBase}/api/v1/user/depositwithbal`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          Login: parseInt(mtLogin),
          profit: account_size,
          type: 2,
          comment: `Initial deposit`,
          apikey: apiKey,
        }),
      });
      const depText = await depRes.text();
      console.log(`[provisionMT5Account] Deposit: ${depText.slice(0, 200)}`);
    }

    // Save to ChallengeAccount
    const newAccount = await base44.asServiceRole.entities.ChallengeAccount.create({
      account_id: account_id || order_id || `MT5-${mtLogin}`,
      challenge_type: challenge_type || 'two-step',
      account_type: account_type || 'standard',
      account_size,
      platform: 'mt5',
      leverage: leverage || '1:100',
      status: 'active',
      phase: 'phase1',
      balance: account_size,
      equity: account_size,
      user_email,
      mt_login: String(mtLogin),
      mt_password: masterPassword,
      mt_server: 'XyloMarkets-Server',
      mt_group: groupName,
      login_credentials: `Login: ${mtLogin} | Password: ${masterPassword} | Server: XyloMarkets-Server`,
      server: 'XyloMarkets-Server',
      provisioned_at: new Date().toISOString(),
      high_water_mark: account_size,
      daily_start_balance: account_size,
      rule_snapshot: rule_snapshot || null,
    });

    return Response.json({
      success: true,
      message: 'MT5 account provisioned via Tritech API (Xylo Markets)',
      account_id: newAccount.id,
      mt_login: String(mtLogin),
      mt_server: 'XyloMarkets-Server',
    });

  } catch (error) {
    console.error('[provisionMT5Account] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});