/**
 * mt5TerminalPositions — Open positions for a specific MT5 login (verified ownership).
 * Also returns the live account summary on each call so the footer bar stays fresh.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const mtLogin = String(body.mt_login || '').trim();
    if (!mtLogin) return Response.json({ error: 'mt_login is required' }, { status: 400 });

    // ── Ownership verification ────────────────────────────────────────────────
    const normalizedEmail = (user.email || '').toLowerCase().trim();
    const accounts = await base44.asServiceRole.entities.ChallengeAccount.filter({ mt_login: mtLogin }, '-created_date', 50);
    const owned = (accounts || []).find(a => (a.user_email || '').toLowerCase().trim() === normalizedEmail);
    if (!owned) {
      return Response.json({ error: 'This MT5 login does not belong to your account.' }, { status: 403 });
    }

    const MT5_BASE = Deno.env.get('MT5_API_BASE_URL');
    const MT5_KEY  = Deno.env.get('MT5_API_KEY');
    if (!MT5_BASE || !MT5_KEY) {
      return Response.json({ error: 'MT5 not configured' }, { status: 500 });
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MT5_KEY}`,
      'ApiKey': MT5_KEY,
    };

    const loginNum = parseInt(mtLogin);

    // ── Positions: /api/v1/deal/get-position ──────────────────────────────────
    let positions: any[] = [];
    try {
      const res = await fetch(`${MT5_BASE}/api/v1/deal/get-position`, {
        method: 'POST', headers,
        body: JSON.stringify({ logins: [loginNum], groups: [], apikey: MT5_KEY, pageOffset: 0, pageSize: 500 }),
      });
      if (res.ok) {
        const r = await res.json().catch(() => ({}));
        positions = r?.data || [];
      }
    } catch (_) {}

    // Fallback: /api/v1/user/get-positions
    if (!positions.length) {
      try {
        const res = await fetch(`${MT5_BASE}/api/v1/user/get-positions`, {
          method: 'POST', headers,
          body: JSON.stringify({ login: loginNum }),
        });
        if (res.ok) {
          const r = await res.json().catch(() => ({}));
          positions = r?.data || r?.positions || [];
        }
      } catch (_) {}
    }

    // Map Tritech fields → standard format
    const mapped = positions.map((p: any) => {
      const actionID = p.actionID ?? p.action ?? 0;
      const isSell = actionID === 1 || actionID === 'SELL';
      const lots = parseFloat(p.volume ?? 0) / 10000;
      const profit = parseFloat(p.profit ?? 0);
      const storage = parseFloat(p.storage ?? 0);
      return {
        ticket:         String(p.position ?? p.externalID ?? p.Position ?? ''),
        symbol:         String(p.symbol ?? p.Symbol ?? '').toUpperCase(),
        type:           isSell ? 'SELL' : 'BUY',
        volume:         lots,
        open_price:     parseFloat(p.priceOpen ?? p.priceOpen ?? 0),
        current_price:  parseFloat(p.priceCurrent ?? p.priceOpen ?? 0),
        sl:             parseFloat(p.priceSL ?? 0),
        tp:             parseFloat(p.priceTP ?? 0),
        profit:         Math.round((profit + storage) * 100) / 100,
        swap:           Math.round(storage * 100) / 100,
        open_time:      p.timeCreateDateTime ?? p.timeCreate ?? null,
      };
    });

    // ── Account summary (same as connect) ────────────────────────────────────
    let summary: any = null;
    try {
      const res = await fetch(`${MT5_BASE}/api/v1/user/userget`, {
        method: 'POST', headers,
        body: JSON.stringify({ Login: loginNum, apikey: MT5_KEY }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const u = data?.data || data;
        summary = {
          balance:      parseFloat(u?.balance ?? u?.Balance ?? 0),
          equity:       parseFloat(u?.equity ?? u?.Equity ?? 0),
          margin:       parseFloat(u?.margin ?? u?.Margin ?? 0),
          free_margin:  parseFloat(u?.marginFree ?? u?.FreeMargin ?? u?.margin_free ?? 0),
          margin_level: parseFloat(u?.marginLevel ?? u?.MarginLevel ?? 0),
        };
      }
    } catch (_) {}

    if (!summary) {
      summary = {
        balance: owned.balance || owned.account_size || 0,
        equity: owned.equity || owned.balance || owned.account_size || 0,
        margin: 0,
        free_margin: owned.equity || owned.balance || owned.account_size || 0,
        margin_level: 0,
      };
    }

    const totalProfit = mapped.reduce((sum: number, p: any) => sum + p.profit, 0);

    return Response.json({
      success: true,
      positions: mapped,
      summary: {
        ...summary,
        total_profit: Math.round(totalProfit * 100) / 100,
        floating_equity: Math.round((summary.equity) * 100) / 100,
      },
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});