/**
 * syncMatchTraderAccount — Live equity fetch for realtime DD monitoring.
 *
 * PURPOSE: Returns live balance, equity, and open positions from MT5 API.
 * Called by LiveDDGuard every few seconds for realtime enforcement.
 *
 * STRICT SCOPE — this function ONLY:
 *   - Fetches live balance/equity from MT5 API
 *   - Returns open positions for display
 *   - Returns live DD calculations for client-side breach detection
 *
 * MUST NOT:
 *   - Create or update TradeRecords
 *   - Update account statistics (win_rate, total_trades, pnl, etc.)
 *   - Update ChallengeAccount fields other than breach-related fields
 *   - Write to any entity (read-only MT5 API call)
 *
 * Breach writing is handled exclusively by realtimeBreachEnforce.
 * Statistics are handled exclusively by scheduledMTSync.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { account_id, mt_login } = body;
    if (!mt_login) return Response.json({ error: 'mt_login required' }, { status: 400 });

    // ── OWNERSHIP VERIFICATION ────────────────────────────────────────────────
    // Only allow fetching data for accounts belonging to the authenticated user.
    const accounts = await base44.entities.ChallengeAccount.filter({ account_id });
    const acc = accounts[0];
    if (!acc) return Response.json({ error: 'Account not found' }, { status: 404 });
    if (acc.user_email !== user.email) {
      return Response.json({ error: 'Forbidden: account does not belong to this user' }, { status: 403 });
    }

    // ── MT5 CREDENTIALS ───────────────────────────────────────────────────────
    const MT5_BASE = Deno.env.get('MT5_API_BASE_URL');
    const MT5_KEY  = Deno.env.get('MT5_API_KEY');
    if (!MT5_BASE || !MT5_KEY) {
      return Response.json({ error: 'MT5 credentials not configured' }, { status: 500 });
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MT5_KEY}`,
      'ApiKey': MT5_KEY,
    };
    const loginNum = parseInt(mt_login);

    // ── LIVE EQUITY FETCH (userget only — no deal history) ───────────────────
    const infoRes = await fetch(`${MT5_BASE}/api/v1/user/userget`, {
      method: 'POST', headers,
      body: JSON.stringify({ Login: loginNum, apikey: MT5_KEY }),
    });

    let balance = null;
    let equity = null;
    let mtData = {};

    if (infoRes.ok) {
      const r = await infoRes.json().catch(() => ({}));
      mtData = r?.data || r?.User || r?.Data || r || {};
      balance = parseFloat(mtData?.Balance ?? mtData?.balance ?? 0) || null;
      equity  = parseFloat(mtData?.Equity  ?? mtData?.equity  ?? 0) || null;
    }

    // ── GLITCH PROTECTION ────────────────────────────────────────────────────
    // If API returns 0 but DB has real data, fall back to DB values
    // (prevents false 100% DD breach from transient API zero)
    if ((balance === 0 || balance === null) && (acc.balance || 0) > 0) {
      balance = acc.balance;
      equity  = acc.equity || acc.balance;
    }

    // ── LIVE DD CALCULATIONS ──────────────────────────────────────────────────
    // Returned to client for display and breach detection logic in LiveDDGuard.
    // No persistence here — scheduledMTSync owns the persistent values.
    const accountSize = acc.account_size || 100000;
    const snap = acc.rule_snapshot || {};
    const isTrailing = snap.trailing_dd ?? (acc.challenge_type === 'instant_light');
    const hwm = acc.high_water_mark || accountSize;

    let liveOverallDD = 0;
    let liveDailyDD = 0;

    if (equity !== null && equity > 0) {
      if (isTrailing) {
        liveOverallDD = hwm > 0 ? Math.max(0, ((hwm - equity) / hwm) * 100) : 0;
      } else {
        liveOverallDD = Math.max(0, ((accountSize - equity) / accountSize) * 100);
      }
      const dailyBase = acc.daily_start_balance || accountSize;
      liveDailyDD = dailyBase > 0 ? Math.max(0, ((dailyBase - equity) / dailyBase) * 100) : 0;
    }

    return Response.json({
      success: true,
      balance,
      equity,
      float_pnl: equity !== null && balance !== null ? equity - balance : null,
      live_overall_dd: parseFloat(liveOverallDD.toFixed(3)),
      live_daily_dd: parseFloat(liveDailyDD.toFixed(3)),
      is_trailing: isTrailing,
      account_size: accountSize,
      high_water_mark: hwm,
      daily_start_balance: acc.daily_start_balance || accountSize,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});