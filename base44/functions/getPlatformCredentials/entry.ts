/**
 * getPlatformCredentials — Retrieve MT5/TradeLocker API credentials from database.
 * Called by all backend functions — single source of truth for platform credentials.
 * Falls back to env vars only if no DB record exists.
 *
 * SECURITY: Admin or service-role callers only. Regular users are rejected with 403.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { platform } = body;

    if (!platform) {
      return Response.json({ error: 'platform required' }, { status: 400 });
    }

    // ── SECURITY: Multi-layer authorization ───────────────────────────────────
    // CRITICAL: Broker API credentials - NEVER allow anonymous access
    // Layer 1: Check for authenticated admin user (browser session)
    // Layer 2: Check for scheduler secret token (internal automation)
    // Layer 3: Reject ALL anonymous callers
    const schedulerToken = req.headers.get('X-Scheduler-Token');
    const expectedToken = Deno.env.get('SCHEDULER_SECRET_TOKEN');
    
    let authorized = false;
    try {
      const user = await base44.auth.me();
      if (user && user.role === 'admin') {
        authorized = true; // Admin user session
      }
    } catch {
      // No user session - will check scheduler token below
    }
    
    if (!authorized && schedulerToken && expectedToken && schedulerToken === expectedToken) {
      authorized = true; // Valid scheduler token
    }
    
    if (!authorized) {
      console.log(`[getPlatformCredentials] BLOCKED: Unauthorized attempt to access ${platform} credentials`);
      return Response.json({ 
        error: 'Forbidden: Admin authentication or valid scheduler token required',
        code: 'UNAUTHORIZED_ACCESS'
      }, { status: 403 });
    }

    // Try database first
    const providers = await base44.asServiceRole.entities.TradingPlatformProvider.filter({
      platform_name: platform,
      is_active: true,
    });

    if (providers.length > 0) {
      const provider = providers[0];
      console.log(`✅ Using database credentials for ${platform}`);
      return Response.json({
        success: true,
        source: 'database',
        api_key: provider.api_key,
        api_secret: provider.api_secret,
        server_url: provider.server_url,
        server_name: provider.server_name || null,
        demo_api_key: provider.demo_api_key,
        demo_api_secret: provider.demo_api_secret,
        demo_server_url: provider.demo_server_url,
      });
    }

    // Fallback to environment variables
    console.log(`ℹ️ No database credentials found for ${platform}. Trying environment variables...`);

    let api_key, api_secret, server_url, server_name, demo_api_key, demo_api_secret, demo_server_url;

    if (platform === 'mt5') {
      api_key = Deno.env.get('MT5_API_KEY');
      api_secret = Deno.env.get('MT5_API_SECRET');
      server_url = Deno.env.get('MT5_API_BASE_URL');
      server_name = Deno.env.get('MT5_SERVER_NAME');
      demo_api_key = Deno.env.get('MT5_DEMO_API_KEY');
      demo_api_secret = Deno.env.get('MT5_DEMO_API_SECRET');
      demo_server_url = Deno.env.get('MT5_DEMO_API_BASE_URL');
    } else if (platform === 'tradelocker') {
      api_key = Deno.env.get('TRADELOCKER_API_KEY');
      api_secret = Deno.env.get('TRADELOCKER_API_SECRET');
      server_url = Deno.env.get('TRADELOCKER_API_BASE_URL');
      server_name = Deno.env.get('TRADELOCKER_SERVER_NAME');
      demo_api_key = Deno.env.get('TRADELOCKER_DEMO_API_KEY');
      demo_api_secret = Deno.env.get('TRADELOCKER_DEMO_API_SECRET');
      demo_server_url = Deno.env.get('TRADELOCKER_DEMO_API_BASE_URL');
    }

    if (!api_key) {
      console.error(`❌ No credentials found for ${platform}`);
      return Response.json({
        success: false,
        error: `No ${platform.toUpperCase()} credentials configured. Add them in Admin > Platforms API.`,
      }, { status: 500 });
    }

    console.log(`✅ Using environment variable credentials for ${platform}`);
    return Response.json({
      success: true,
      source: 'environment',
      api_key,
      api_secret,
      server_url,
      server_name,
      demo_api_key,
      demo_api_secret,
      demo_server_url,
    });

  } catch (error) {
    console.error('getPlatformCredentials error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});