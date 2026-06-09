/**
 * provisionMT5Account — Create MT5 trading account after payment confirmation.
 * 
 * ⚠️ CRITICAL: This function requires REAL MT5 infrastructure.
 * 
 * CURRENT STATUS: SIMULATED (no real MT5 integration)
 * 
 * To make this production-ready, you need:
 * 1. MT5 Manager API access from your broker (not REST API)
 * 2. Options:
 *    - MetaApi Cloud Bridge: https://metaapi.cloud/docs/manager/
 *    - FINXSOL MT5 API: https://finxsol.com/mt5-api/
 *    - Custom bridge service wrapping MT5 Manager DLL
 * 
 * Required credentials from broker:
 * - MT5 Manager login + password
 * - MT5 Server host + port
 * - Direct database access (MSSQL) OR Manager API bridge
 * 
 * MT5 does NOT provide a native REST API.
 * The fake endpoints (/accounts/{login}, /disable, etc.) do not exist.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // ── SECURITY: Multi-layer authorization ───────────────────────────────────
    const schedulerToken = req.headers.get('X-Scheduler-Token');
    const expectedToken = Deno.env.get('SCHEDULER_SECRET_TOKEN');
    
    let authorized = false;
    try {
      const user = await base44.auth.me();
      if (user && user.role === 'admin') {
        authorized = true;
      }
    } catch {}
    
    if (!authorized && schedulerToken && expectedToken && schedulerToken === expectedToken) {
      authorized = true;
    }
    
    if (!authorized) {
      return Response.json({ 
        error: 'Forbidden: Admin or scheduler token required',
        code: 'UNAUTHORIZED_ACCESS'
      }, { status: 403 });
    }

    const body = await req.json();
    const {
      account_id,
      order_id,
      user_email,
      challenge_type,
      account_type,
      account_size,
      leverage,
      platform,
      rule_snapshot,
    } = body;

    if (!user_email || !account_size) {
      return Response.json({ error: 'user_email and account_size required' }, { status: 400 });
    }

    // ── CHECK FOR EXISTING ACCOUNT (idempotency) ──────────────────────────────
    const existing = await base44.asServiceRole.entities.ChallengeAccount.filter({
      user_email,
      status: ['pending', 'active', 'funded'],
    });
    
    if (existing.length > 0) {
      console.log(`[provisionMT5Account] Account already exists for ${user_email}`);
      return Response.json({ 
        success: true, 
        message: 'Account already provisioned',
        account_id: existing[0].account_id,
      });
    }

    // ── GET MT5 CREDENTIALS FROM DATABASE ─────────────────────────────────────
    const providers = await base44.asServiceRole.entities.TradingPlatformProvider.filter({
      platform_name: 'mt5',
      is_active: true,
    });

    if (providers.length === 0) {
      console.error('[provisionMT5Account] NO MT5 PROVIDER CONFIGURED');
      return Response.json({
        success: false,
        error: 'MT5 provider not configured. Admin must add MT5 credentials in Admin > Platform API.',
        action_required: 'Configure MT5 credentials in Admin > Platform API > MetaTrader 5',
      }, { status: 500 });
    }

    const provider = providers[0];
    
    // ── ⚠️ SIMULATED MT5 ACCOUNT CREATION ─────────────────────────────────────
    // REAL IMPLEMENTATION REQUIRED:
    // 
    // Option 1: MetaApi Cloud
    // const mt5Res = await fetch('https://api.metaapi.cloud/v1/trading/accounts', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${provider.api_key}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     group: `funded_firms\\${challenge_type}\\${account_size}`,
    //     balance: account_size,
    //     leverage: parseInt(leverage.replace('1:', '')),
    //   }),
    // });
    // const mt5Data = await mt5Res.json();
    // const mt_login = mt5Data.login;
    // const mt_password = generated_password;
    // const mt_server = provider.server_name;
    //
    // Option 2: Direct MT5 Database (MSSQL)
    // - Insert into mt5.trades accounts table
    // - Requires broker database access
    //
    // Option 3: FINXSOL or similar bridge service
    
    // SIMULATED for now (REMOVE THIS when real MT5 is integrated)
    const generatedPassword = Math.random().toString(36).slice(-10) + 'Aa1!';
    const mt_login = Math.floor(10000000 + Math.random() * 90000000).toString();
    const mt_server = provider.server_name || 'FundedFirms-Live';
    
    console.log(`[provisionMT5Account] ⚠️ SIMULATED: Creating MT5 account ${mt_login} for ${user_email}`);
    console.log('[provisionMT5Account] ⚠️ WARNING: No real MT5 integration — credentials are simulated');

    // ── CREATE CHALLENGE ACCOUNT IN DATABASE ──────────────────────────────────
    const newAccount = await base44.asServiceRole.entities.ChallengeAccount.create({
      account_id: account_id || order_id || `MT5-${mt_login}`,
      challenge_type,
      account_type: account_type || 'standard',
      account_size,
      platform: 'mt5',
      leverage,
      status: 'pending',
      phase: 'phase1',
      balance: account_size,
      equity: account_size,
      pnl: 0,
      user_email,
      mt_login,
      mt_password: generatedPassword,
      mt_server,
      mt_group: `funded_firms\\${challenge_type}\\${account_size}`,
      provisioned_at: new Date().toISOString(),
      rule_snapshot: rule_snapshot || null,
    });

    console.log(`[provisionMT5Account] ✅ Account created: ${newAccount.id}`);

    // ── NOTIFY USER ───────────────────────────────────────────────────────────
    await base44.asServiceRole.entities.Notification.create({
      title: '🎉 Trading Account Ready',
      message: `Your MT5 account (${mt_login}) has been provisioned. Login credentials are available in My Accounts.`,
      type: 'payout',
      priority: 'high',
      display_mode: 'popup',
      is_active: true,
      target: 'challenge',
    });

    return Response.json({
      success: true,
      message: 'MT5 account provisioned successfully',
      account_id: newAccount.id,
      mt_login,
      // ⚠️ In production, NEVER return password in API response
      // Send via secure email instead
      warning: 'SIMULATED — No real MT5 integration',
    });

  } catch (error) {
    console.error('[provisionMT5Account] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});