/**
 * getLivePositions — Fetch open positions from MT5 for the current user's accounts.
 * Uses Tritech API: /api/v1/user/get-positions or /api/v1/order/get-open-orders
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const accountId = body.account_id;

    const mt5Providers = await base44.asServiceRole.entities.TradingPlatformProvider.filter({ platform_name: 'mt5', is_active: true }).catch(() => []);
    const mt5Provider = mt5Providers[0];
    const MT5_BASE = mt5Provider?.server_url || Deno.env.get('MT5_API_BASE_URL');
    const MT5_KEY  = mt5Provider?.api_key    || Deno.env.get('MT5_API_KEY');

    console.log('MT5 Config:', { 
      from_db: !!mt5Provider, 
      server_url: MT5_BASE ? 'configured' : 'missing', 
      api_key: MT5_KEY ? 'configured' : 'missing' 
    });

    if (!MT5_BASE || !MT5_KEY) {
      console.error('MT5 not configured - missing server_url or api_key');
      return Response.json({ 
        success: false, 
        positions: [], 
        error: 'MT5 not configured',
        debug: { 
          has_provider: !!mt5Provider,
          has_server_url: !!MT5_BASE,
          has_api_key: !!MT5_KEY
        }
      });
    }

    // Get user's accounts - check for mt_login regardless of platform field
    const userAccounts = await base44.entities.ChallengeAccount.filter({ user_email: user.email });
    console.log('User accounts found:', userAccounts.length, 'for email:', user.email);
    
    const activeAccounts = userAccounts.filter(a => {
      const hasMtLogin = !!a.mt_login;
      const isActiveStatus = ['active', 'funded', 'passed'].includes(a.status);
      const matchesAccountId = !accountId || a.account_id === accountId;
      
      if (!hasMtLogin) console.log('Account missing mt_login:', a.account_id, 'status:', a.status);
      if (!isActiveStatus) console.log('Account inactive status:', a.account_id, 'status:', a.status);
      
      return hasMtLogin && isActiveStatus && matchesAccountId;
    });

    console.log('Active MT5 accounts:', activeAccounts.length);
    if (activeAccounts.length === 0) {
      console.log('No active MT5 accounts found for user:', user.email, 'total accounts:', userAccounts.length);
      return Response.json({ 
        success: true, 
        positions: [], 
        debug: { 
          message: 'No active MT5 accounts', 
          userAccounts: userAccounts.length,
          accounts: userAccounts.map(a => ({ 
            account_id: a.account_id, 
            status: a.status, 
            has_mt_login: !!a.mt_login,
            mt_login: a.mt_login 
          }))
        } 
      });
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MT5_KEY}`,
      'ApiKey': MT5_KEY,
    };

    const allPositions = [];

    for (const acc of activeAccounts) {
      const loginNum = parseInt(acc.mt_login);
      console.log('Fetching positions for MT5 login:', loginNum, 'account_id:', acc.account_id);

      // Try multiple endpoints for better reliability
      let positions = [];
      
      // Primary: /api/v1/deal/get-position
      const posRes = await fetch(`${MT5_BASE}/api/v1/deal/get-position`, {
        method: 'POST', headers,
        body: JSON.stringify({ logins: [loginNum], groups: [], apikey: MT5_KEY, pageOffset: 0, pageSize: 500 }),
      }).catch(err => {
        console.error('MT5 API error:', err);
        return { ok: false };
      });

      if (posRes.ok) {
        try {
          const r = await posRes.json();
          positions = r?.data || [];
          console.log('Got positions from /api/v1/deal/get-position:', positions.length);
        } catch (e) {
          console.error('Error parsing MT5 response:', e);
        }
      } else {
        console.error('MT5 API /api/v1/deal/get-position failed, status:', posRes.status);
        // Fallback: try /api/v1/user/get-positions
        const fallbackRes = await fetch(`${MT5_BASE}/api/v1/user/get-positions`, {
          method: 'POST', headers,
          body: JSON.stringify({ login: loginNum }),
        }).catch(() => ({ ok: false }));
        
        if (fallbackRes.ok) {
          try {
            const r = await fallbackRes.json();
            positions = r?.data || r?.positions || [];
            console.log('Got positions from fallback endpoint:', positions.length);
          } catch (e) {
            console.error('Error parsing fallback response:', e);
          }
        }
      }

      // Map Tritech get-position fields to standard format
      // Tritech actionID: 0=BUY, 1=SELL; volume is in centi-lots (÷10000)
      // Verified: 10000 = 1.00 lot, 1000 = 0.10 lot, 1 = 0.0001 lot
      positions.forEach(p => {
        const actionID = p.actionID ?? p.action ?? 0;
        const isSell = actionID === 1 || actionID === 'SELL';
        const rawVol = parseFloat(p.volume ?? 0);
        const lots = rawVol / 10000;
        const profit = parseFloat(p.profit ?? 0);
        const storage = parseFloat(p.storage ?? 0);

        allPositions.push({
          account_id: acc.account_id,
          trade_id: String(p.position ?? p.externalID ?? Math.random()),
          symbol: (p.symbol ?? '').toUpperCase(),
          type: isSell ? 'SELL' : 'BUY',
          lots,
          entry: parseFloat(p.priceOpen ?? p.priceCurrent ?? 0),
          current_price: parseFloat(p.priceCurrent ?? p.priceOpen ?? 0),
          sl: parseFloat(p.priceSL ?? 0),
          tp: parseFloat(p.priceTP ?? 0),
          pnl: profit + storage,
          swap: storage,
          status: 'open',
          open_time: p.timeCreateDateTime ?? p.timeCreate ?? null,
        });
      });
    }

    return Response.json({ success: true, positions: allPositions });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});