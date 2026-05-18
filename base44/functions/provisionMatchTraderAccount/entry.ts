import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const MT_BASE = 'https://broker-api-demo.match-trader.com';
const MT_API_KEY = Deno.env.get('MATCH_TRADER_API_KEY') || 'EWpgx-jtNvPTvPJXQMfa6Eppx-sRuXWPtkEr6iPMXeo=';

const mtHeaders = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${MT_API_KEY}`,
  'api-key': MT_API_KEY,
};

// Map challenge type + size to a Match Trader group name
function getGroupName(challengeType, accountSize, accountModel) {
  const model = accountModel === 'swing' ? 'swing' : 'std';
  const sizeK = accountSize / 1000;
  if (challengeType === 'two-step') return `FF_2STEP_${sizeK}K_${model.toUpperCase()}`;
  if (challengeType === 'instant') return `FF_INSTANT_${sizeK}K_${model.toUpperCase()}`;
  if (challengeType === 'instant_light') return `FF_INSTLIGHT_${sizeK}K_${model.toUpperCase()}`;
  return `FF_CHALLENGE_${sizeK}K`;
}

// Generate a random secure password
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
    const { order_id, account_id, user_email, challenge_type, account_type, account_size, leverage, platform } = body;

    // Only provision for match_trader platform
    if (platform !== 'match_trader') {
      return Response.json({ error: 'Not a Match Trader order', skip: true });
    }

    const password = genPassword();
    const leverageValue = parseInt((leverage || '1:100').split(':')[1]) || 100;
    const groupName = getGroupName(challenge_type, account_size, account_type);

    // Step 1: Create the trading account on Match Trader
    const createRes = await fetch(`${MT_BASE}/accounts`, {
      method: 'POST',
      headers: mtHeaders,
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

    let mtAccount = null;
    if (createRes.ok) {
      mtAccount = await createRes.json();
    } else {
      const errText = await createRes.text();
      console.error('MT create error:', errText);
      // Still store the attempt so admin can retry
      mtAccount = {
        login: `MT-PENDING-${Date.now()}`,
        server: 'broker-api-demo.match-trader.com',
        error: errText,
        provisioned: false,
      };
    }

    const mtLogin = mtAccount?.login || mtAccount?.accountId || `MT-${Date.now()}`;
    const mtServer = 'mt.fundedfirms.com';

    // Step 2: Update ChallengeAccount in CRM with credentials
    const accounts = await base44.asServiceRole.entities.ChallengeAccount.filter({ account_id });
    if (accounts.length > 0) {
      const acc = accounts[0];
      await base44.asServiceRole.entities.ChallengeAccount.update(acc.id, {
        status: 'active',
        platform: 'match_trader',
        login_credentials: `Login: ${mtLogin} | Password: ${password}`,
        server: mtServer,
        mt_login: mtLogin,
        mt_password: password,
        mt_server: mtServer,
        provisioned_at: new Date().toISOString(),
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

    return Response.json({
      success: true,
      mt_login: mtLogin,
      mt_password: password,
      mt_server: mtServer,
      mt_group: groupName,
      platform: 'match_trader',
      account_id,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});