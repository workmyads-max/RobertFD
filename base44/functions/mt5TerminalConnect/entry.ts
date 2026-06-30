/**
 * mt5TerminalConnect — Verify an MT5 login belongs to the user and return
 * live account summary (balance, equity, margin, free margin, margin level).
 *
 * Security: the login must exist as a ChallengeAccount with user_email === current user.
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

    // ── Ownership verification (case-insensitive, service-role) ───────────────
    const normalizedEmail = (user.email || '').toLowerCase().trim();
    const accounts = await base44.asServiceRole.entities.ChallengeAccount.filter({ mt_login: mtLogin }, '-created_date', 50);
    const owned = (accounts || []).find(a => (a.user_email || '').toLowerCase().trim() === normalizedEmail);
    if (!owned) {
      return Response.json({ error: 'This MT5 login does not belong to your account.' }, { status: 403 });
    }

    // ── MT5 credentials ───────────────────────────────────────────────────────
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

    // ── Fetch account summary: /api/v1/user/userget ───────────────────────────
    let summary = null;
    try {
      const res = await fetch(`${MT5_BASE}/api/v1/user/userget`, {
        method: 'POST', headers,
        body: JSON.stringify({ Login: loginNum, apikey: MT5_KEY }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const u = data?.data || data;
        summary = {
          login:       parseInt(u?.login ?? u?.Login ?? loginNum),
          name:        u?.name ?? u?.Name ?? '',
          email:       u?.email ?? u?.Email ?? '',
          group:       u?.group ?? u?.Group ?? '',
          leverage:    parseInt(u?.leverage ?? u?.Leverage ?? 100),
          balance:     parseFloat(u?.balance ?? u?.Balance ?? 0),
          equity:      parseFloat(u?.equity ?? u?.Equity ?? 0),
          margin:      parseFloat(u?.margin ?? u?.Margin ?? 0),
          free_margin: parseFloat(u?.marginFree ?? u?.FreeMargin ?? u?.margin_free ?? 0),
          margin_level: parseFloat(u?.marginLevel ?? u?.MarginLevel ?? 0),
          currency:    u?.currency ?? u?.Currency ?? 'USD',
        };
      }
    } catch (_) { /* fall through */ }

    if (!summary) {
      // Fallback: use stored ChallengeAccount data
      summary = {
        login: loginNum,
        name: owned.account_id || '',
        email: owned.user_email || '',
        group: owned.mt_group || '',
        leverage: parseInt((owned.leverage || '1:100').replace('1:', '')) || 100,
        balance: owned.balance || owned.account_size || 0,
        equity: owned.equity || owned.balance || owned.account_size || 0,
        margin: 0,
        free_margin: owned.equity || owned.balance || owned.account_size || 0,
        margin_level: 0,
        currency: 'USD',
      };
    }

    return Response.json({
      success: true,
      account: summary,
      challenge: {
        account_id: owned.account_id,
        challenge_type: owned.challenge_type,
        account_size: owned.account_size,
        status: owned.status,
        phase: owned.phase,
        server: owned.mt_server || 'XyloMarkets-Server',
      },
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});