import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Map challenge type + size to a Match Trader group name
function getGroupName(challengeType, accountSize, accountModel) {
  const model = accountModel === 'swing' ? 'SWING' : 'STD';
  const sizeK = accountSize / 1000;
  if (challengeType === 'two-step') return `FF_2STEP_${sizeK}K_${model}`;
  if (challengeType === 'instant') return `FF_INSTANT_${sizeK}K_${model}`;
  if (challengeType === 'instant_light') return `FF_INSTLIGHT_${sizeK}K_${model}`;
  return `FF_CHALLENGE_${sizeK}K`;
}

// Generate a secure password
function genPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
  let p = '';
  for (let i = 0; i < 12; i++) p += chars[Math.floor(Math.random() * chars.length)];
  return p;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { order_id, account_id, user_email, challenge_type, account_type, account_size, leverage, platform, rule_snapshot } = body;

    if (!['match_trader', 'mt5'].includes(platform)) {
      return Response.json({ error: 'Unsupported platform', skip: true });
    }

    // Fetch credentials from database first, fallback to env vars
    const credRes = await base44.asServiceRole.functions.invoke('getPlatformCredentials', { platform });
    if (!credRes.data?.success) {
      return Response.json({
        error: credRes.data?.error || `Failed to load ${platform} credentials`,
        status: 'missing_credentials',
      }, { status: 500 });
    }

    const { api_key, server_url, server_name } = credRes.data;
    const apiBase = server_url || (platform === 'mt5' 
      ? Deno.env.get('MT5_API_BASE_URL') 
      : Deno.env.get('MATCH_TRADER_BASE_URL') || 'https://broker-api-demo.match-trader.com');

    const apiHeaders = {
      'Content-Type': 'application/json',
      'api-key': api_key,
      'Authorization': `Bearer ${api_key}`,
    };

    const password = genPassword();
    const leverageValue = parseInt((leverage || '1:100').split(':')[1]) || 100;
    const groupName = getGroupName(challenge_type, account_size, account_type);

    console.log(`Provisioning MT account for ${user_email}, group: ${groupName}, leverage: ${leverageValue}`);

    // Step 1: Create the trading account on the broker API
    const createRes = await fetch(`${apiBase}/accounts`, {
      method: 'POST',
      headers: apiHeaders,
      body: JSON.stringify({
        login: user_email,
        password,
        email: user_email,
        group: groupName,
        leverage: leverageValue,
        balance: account_size,
        name: user_email.split('@')[0],
        currency: 'USD',
        sendEmail: false,
      }),
    });

    const responseText = await createRes.text();
    console.log(`MT API response (${createRes.status}):`, responseText);

    if (!createRes.ok) {
      // NEVER generate fake credentials — mark account as provisioning_failed and notify admin
      const accounts = await base44.asServiceRole.entities.ChallengeAccount.filter({ account_id });
      if (accounts.length > 0) {
        await base44.asServiceRole.entities.ChallengeAccount.update(accounts[0].id, {
          status: 'pending',
          mt_group: groupName,
          // Store error detail for admin visibility
          login_credentials: `PROVISIONING_FAILED: ${responseText.substring(0, 200)}`,
        });
      }
      return Response.json({
        success: false,
        error: 'Match Trader API error',
        details: responseText,
        account_id,
        status: 'provisioning_failed',
      }, { status: 502 });
    }

    let mtAccount;
    try {
      mtAccount = JSON.parse(responseText);
    } catch {
      return Response.json({ success: false, error: 'Invalid JSON response from MT API', details: responseText }, { status: 502 });
    }

    // Extract real login from API response
    const mtLogin = mtAccount?.login || mtAccount?.accountId || mtAccount?.id;
    if (!mtLogin) {
      return Response.json({ success: false, error: 'MT API did not return a login ID', details: mtAccount }, { status: 502 });
    }

    const mtServer = platform === 'mt5'
      ? (server_name || Deno.env.get('MT5_SERVER_NAME') || 'mt5-live.server.com')
      : 'broker-api-demo.match-trader.com';

    // Step 2: Update ChallengeAccount in CRM with REAL credentials
    const accounts = await base44.asServiceRole.entities.ChallengeAccount.filter({ account_id });
    if (accounts.length > 0) {
      await base44.asServiceRole.entities.ChallengeAccount.update(accounts[0].id, {
        status: 'active',
        platform: platform,
        mt_login: String(mtLogin),
        mt_password: password,
        mt_server: mtServer,
        mt_group: groupName,
        provisioned_at: new Date().toISOString(),
        login_credentials: `Login: ${mtLogin} | Password: ${password} | Server: ${mtServer}`,
        server: mtServer,
        // Write rule snapshot from order — immutable from this point forward
        ...(rule_snapshot ? { rule_snapshot } : {}),
      });
    }

    // Step 3: Update the Order to confirmed
    const orders = await base44.asServiceRole.entities.Order.filter({ order_id });
    if (orders.length > 0) {
      await base44.asServiceRole.entities.Order.update(orders[0].id, {
        payment_status: 'confirmed',
        account_id,
      });
    }

    console.log(`Successfully provisioned MT account: login=${mtLogin}, group=${groupName}`);

    return Response.json({
      success: true,
      mt_login: mtLogin,
      mt_server: mtServer,
      mt_group: groupName,
      platform: 'match_trader',
      account_id,
    });

  } catch (error) {
    console.error('Provisioning error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});