/**
 * mt5TerminalTrade — Execute trade actions on the user's MT5 account.
 *
 * Actions:
 *   buy    → open market BUY   { mt_login, symbol, volume, sl?, tp? }
 *   sell   → open market SELL  { mt_login, symbol, volume, sl?, tp? }
 *   close  → close position    { mt_login, position_id }
 *
 * Security: login must belong to the authenticated user. Manager credentials
 * loaded from TradingPlatformProvider (required for trade execution).
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { action } = body;
    const mtLogin = String(body.mt_login || '').trim();
    if (!mtLogin) return Response.json({ error: 'mt_login is required' }, { status: 400 });
    if (!['buy', 'sell', 'close'].includes(action)) {
      return Response.json({ error: 'Invalid action. Use buy, sell, or close.' }, { status: 400 });
    }

    // ── Ownership verification ────────────────────────────────────────────────
    const normalizedEmail = (user.email || '').toLowerCase().trim();
    const accounts = await base44.asServiceRole.entities.ChallengeAccount.filter({ mt_login: mtLogin }, '-created_date', 50);
    const owned = (accounts || []).find(a => (a.user_email || '').toLowerCase().trim() === normalizedEmail);
    if (!owned) {
      return Response.json({ error: 'This MT5 login does not belong to your account.' }, { status: 403 });
    }

    // ── Block trading if account is not in an active/tradeable state ───────────
    if (!['active', 'funded', 'passed'].includes(owned.status)) {
      return Response.json({ error: `Account status is "${owned.status}". Trading is not available.` }, { status: 403 });
    }
    if (owned.can_trade === false) {
      return Response.json({ error: 'Trading is disabled on this account.' }, { status: 403 });
    }

    // ── Load credentials from TradingPlatformProvider (needs manager creds) ────
    const providers = await base44.asServiceRole.entities.TradingPlatformProvider.filter({ platform_name: 'mt5', is_active: true });
    const provider = providers[0];
    const apiBase = provider?.server_url || Deno.env.get('MT5_API_BASE_URL');
    const apiKey  = provider?.api_key   || Deno.env.get('MT5_API_KEY');
    const managerLogin = provider?.manager_login;
    const managerPassword = provider?.manager_password;

    if (!apiBase || !apiKey || !managerLogin || !managerPassword) {
      return Response.json({ error: 'MT5 trade credentials not fully configured.' }, { status: 500 });
    }

    const headers = {
      'Content-Type': 'application/json',
      'ApiKey': apiKey,
      'ManagerLogin': String(managerLogin),
      'ManagerPassword': String(managerPassword),
    };

    const loginNum = parseInt(mtLogin);
    const isBuy = action === 'buy';
    const isSell = action === 'sell';
    let resultData: any = null;
    let lastError = '';

    if (isBuy || isSell) {
      const symbol = String(body.symbol || '').toUpperCase();
      const volume = parseFloat(body.volume || 0);
      const sl = body.sl ? parseFloat(body.sl) : 0;
      const tp = body.tp ? parseFloat(body.tp) : 0;
      if (!symbol || volume <= 0) {
        return Response.json({ error: 'symbol and a positive volume are required' }, { status: 400 });
      }
      // Tritech volume is in centi-lots (×10000)
      const volCentiLots = Math.round(volume * 10000);
      const tradeBody = {
        Login: loginNum,
        Symbol: symbol,
        Volume: volCentiLots,
        Action: isBuy ? 0 : 1, // 0=BUY, 1=SELL
        Price: 0, // market order
        Slippage: 10,
        SL: sl,
        TP: tp,
        Comment: 'XFunded WebTerminal',
        apikey: apiKey,
      };

      // Try common Tritech trade endpoints in order
      const tradeEndpoints = [
        '/api/v1/deal/market-order',
        '/api/v1/deal/create',
        '/api/v1/trade/market-order',
        '/api/v1/trade/create',
        '/api/v1/deal/order',
      ];

      for (const ep of tradeEndpoints) {
        try {
          const res = await fetch(`${apiBase}${ep}`, {
            method: 'POST', headers,
            body: JSON.stringify(tradeBody),
          });
          const text = await res.text();
          let parsed: any;
          try { parsed = JSON.parse(text); } catch { parsed = { raw: text.slice(0, 300) }; }

          if (res.ok && !parsed?.error && !parsed?.data?.errorcode) {
            resultData = { endpoint: ep, response: parsed };
            break;
          }
          lastError = parsed?.data?.errormsg || parsed?.errormsg || parsed?.error || text.slice(0, 200);
          // 404 → try next endpoint; other errors → stop
          if (res.status !== 404) break;
        } catch (e) {
          lastError = e.message;
        }
      }
    }

    if (action === 'close') {
      const positionId = String(body.position_id || '');
      if (!positionId) {
        return Response.json({ error: 'position_id is required to close' }, { status: 400 });
      }
      const closeBody = {
        Login: loginNum,
        Position: parseInt(positionId) || positionId,
        apikey: apiKey,
      };

      const closeEndpoints = [
        '/api/v1/deal/close-position',
        '/api/v1/deal/close',
        '/api/v1/trade/close',
      ];

      for (const ep of closeEndpoints) {
        try {
          const res = await fetch(`${apiBase}${ep}`, {
            method: 'POST', headers,
            body: JSON.stringify(closeBody),
          });
          const text = await res.text();
          let parsed: any;
          try { parsed = JSON.parse(text); } catch { parsed = { raw: text.slice(0, 300) }; }

          if (res.ok && !parsed?.error && !parsed?.data?.errorcode) {
            resultData = { endpoint: ep, response: parsed };
            break;
          }
          lastError = parsed?.data?.errormsg || parsed?.errormsg || parsed?.error || text.slice(0, 200);
          if (res.status !== 404) break;
        } catch (e) {
          lastError = e.message;
        }
      }
    }

    if (!resultData) {
      return Response.json({
        success: false,
        error: lastError || 'Trade execution failed — no compatible MT5 trade endpoint responded.',
        hint: 'The broker bridge may not expose a trade-execution endpoint. Contact your MT5 API provider to enable market-order execution.',
      }, { status: 502 });
    }

    return Response.json({
      success: true,
      action,
      mt_login: mtLogin,
      result: resultData,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});