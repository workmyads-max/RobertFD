/**
 * getLivePositions — Fetch open positions from MT5 for the current user's accounts.
 *
 * Uses Tritech API: /api/v1/deal/get-position (primary)
 * Fallback:         /api/v1/user/get-positions
 *
 * Ownership-verified: only returns positions for accounts belonging to the authenticated user.
 * Read-only: does not write any entities.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const accountId = body.account_id || null;

    // ── MT5 CREDENTIALS ───────────────────────────────────────────────────────
    const MT5_BASE = Deno.env.get('MT5_API_BASE_URL');
    const MT5_KEY  = Deno.env.get('MT5_API_KEY');
    if (!MT5_BASE || !MT5_KEY) {
      return Response.json({ success: false, positions: [], error: 'MT5 not configured' });
    }

    // ── OWNERSHIP: service role + case-insensitive email matching ─────────────
    // RLS exact-match (user_email = {{user.email}}) can hide the user's own accounts
    // when casing/whitespace differs. Service role bypasses RLS; we enforce ownership manually.
    const normalizedEmail = user.email.toLowerCase().trim();
    const allUserAccounts = await base44.asServiceRole.entities.ChallengeAccount.filter({ user_email: user.email }, '-created_date', 200);
    const activeAccounts = (allUserAccounts || []).filter(a =>
      (a.user_email || '').toLowerCase().trim() === normalizedEmail &&
      a.mt_login &&
      ['active', 'funded', 'passed'].includes(a.status) &&
      (!accountId || a.account_id === accountId)
    );

    if (activeAccounts.length === 0) {
      return Response.json({ success: true, positions: [] });
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MT5_KEY}`,
      'ApiKey': MT5_KEY,
    };

    const allPositions = [];

    await Promise.all(activeAccounts.map(async (acc) => {
      const loginNum = parseInt(acc.mt_login);
      let positions = [];

      // Primary: /api/v1/deal/get-position
      const posRes = await fetch(`${MT5_BASE}/api/v1/deal/get-position`, {
        method: 'POST', headers,
        body: JSON.stringify({ logins: [loginNum], groups: [], apikey: MT5_KEY, pageOffset: 0, pageSize: 500 }),
      }).catch(() => ({ ok: false }));

      if (posRes.ok) {
        const r = await posRes.json().catch(() => ({}));
        positions = r?.data || [];
      }

      // Fallback: /api/v1/user/get-positions
      if (!positions.length) {
        const fallbackRes = await fetch(`${MT5_BASE}/api/v1/user/get-positions`, {
          method: 'POST', headers,
          body: JSON.stringify({ login: loginNum }),
        }).catch(() => ({ ok: false }));
        if (fallbackRes.ok) {
          const r = await fallbackRes.json().catch(() => ({}));
          positions = r?.data || r?.positions || [];
        }
      }

      // Map Tritech get-position fields to standard format
      // Tritech: actionID 0=BUY, 1=SELL; volume in centi-lots (÷10000)
      positions.forEach(p => {
        const actionID = p.actionID ?? p.action ?? 0;
        const isSell   = actionID === 1 || actionID === 'SELL';
        const lots     = parseFloat(p.volume ?? 0) / 10000;
        const profit   = parseFloat(p.profit ?? 0);
        const storage  = parseFloat(p.storage ?? 0);

        allPositions.push({
          account_id:    acc.account_id,
          trade_id:      String(p.position ?? p.externalID ?? ''),
          symbol:        (p.symbol ?? '').toUpperCase(),
          type:          isSell ? 'SELL' : 'BUY',
          lots,
          entry:         parseFloat(p.priceOpen    ?? p.priceCurrent ?? 0),
          current_price: parseFloat(p.priceCurrent ?? p.priceOpen    ?? 0),
          sl:            parseFloat(p.priceSL ?? 0),
          tp:            parseFloat(p.priceTP ?? 0),
          pnl:           profit + storage,
          swap:          storage,
          status:        'open',
          open_time:     p.timeCreateDateTime ?? p.timeCreate ?? null,
        });
      });
    }));

    return Response.json({ success: true, positions: allPositions });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});