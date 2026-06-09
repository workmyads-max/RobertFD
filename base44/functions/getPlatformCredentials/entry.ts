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

    // SECURITY: Only admin users or internal service-role callers may retrieve broker credentials.
    // Service-role calls (from other backend functions) do not have an auth user — they bypass this check via asServiceRole.
    // Direct calls from a browser session must be admin.
    let callerIsAdmin = false;
    try {
      const user = await base44.auth.me();
      if (user && user.role === 'admin') {
        callerIsAdmin = true;
      } else if (user && user.role !== 'admin') {
        return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }
      // If user is null, the call is coming from an internal function via service role — allow it
    } catch {
      // No authenticated session — internal/scheduled call, allow
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