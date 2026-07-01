/**
 * forceCloseMT5Positions — Force-close ALL open positions on an MT5 login at market price.
 *
 * Called by mt5RealtimeSync (live) and automatedDDBreach (scheduled) BEFORE the
 * existing move-disabled call, so open positions are liquidated while the login
 * is still in an active group (a disabled group may reject close calls).
 *
 * Flow:  get-position (list open)  →  close-position-by-login (per ticket, market)
 *
 * Authorization: internal service-role invocation (from breach functions) OR admin
 * session OR valid scheduler token. Never callable anonymously.
 *
 * Idempotent: if no positions are open, returns closed=0. Re-calls are a no-op
 * (a second close on an already-closed ticket returns an error code, counted as failed
 * but harmless).
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // ── Authorization (mirrors provisionMT5Account pattern) ────────────────────
    let authorized = false;
    try {
      const user = await base44.auth.me();
      if (user?.role === 'admin') authorized = true;
    } catch (_) {}
    const authHeader = req.headers.get('authorization') || '';
    if (authHeader.includes('service')) authorized = true;
    const internalSecret = req.headers.get('x-internal-secret');
    if (internalSecret && internalSecret === Deno.env.get('SCHEDULER_SECRET_TOKEN')) authorized = true;
    if (!authorized) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const mtLogin = String(body.mt_login || '').trim();
    if (!mtLogin) return Response.json({ error: 'mt_login required' }, { status: 400 });

    const sr = base44.asServiceRole;

    // ── Load manager credentials (close-position-by-login needs manager auth) ─
    const providers = await sr.entities.TradingPlatformProvider.filter({ platform_name: 'mt5', is_active: true });
    const provider = providers[0];
    const apiBase = provider?.server_url || Deno.env.get('MT5_API_BASE_URL');
    const apiKey = provider?.api_key || Deno.env.get('MT5_API_KEY');
    const managerLogin = provider?.manager_login;
    const managerPassword = provider?.manager_password;
    if (!apiBase || !apiKey) return Response.json({ error: 'MT5 credentials not configured' }, { status: 500 });

    const headers = {
      'Content-Type': 'application/json',
      'ApiKey': apiKey,
      ...(managerLogin && managerPassword
        ? { 'ManagerLogin': String(managerLogin), 'ManagerPassword': String(managerPassword) }
        : {}),
    };
    const loginNum = parseInt(mtLogin);

    // ── 1. Fetch open positions (same shape as getLivePositions) ──────────────
    let positions = [];
    const posRes = await fetch(`${apiBase}/api/v1/deal/get-position`, {
      method: 'POST', headers,
      body: JSON.stringify({ logins: [loginNum], groups: [], apikey: apiKey, pageOffset: 0, pageSize: 500 }),
    }).catch(() => ({ ok: false }));
    if (posRes.ok) {
      const r = await posRes.json().catch(() => ({}));
      positions = r?.data || [];
    }
    if (!positions.length) {
      const fb = await fetch(`${apiBase}/api/v1/user/get-positions`, {
        method: 'POST', headers,
        body: JSON.stringify({ login: loginNum }),
      }).catch(() => ({ ok: false }));
      if (fb.ok) {
        const r = await fb.json().catch(() => ({}));
        positions = r?.data || r?.positions || [];
      }
    }

    if (!positions.length) {
      return Response.json({ success: true, closed: 0, failed: 0, total: 0, note: 'No open positions' });
    }

    // ── 2. Close each open position at market price ───────────────────────────
    const results = await Promise.all(positions.map(async (p) => {
      const ticket = p.position ?? p.externalID ?? p.Position ?? p.ticket;
      try {
        const closeRes = await fetch(`${apiBase}/api/v1/deal/close-position-by-login`, {
          method: 'POST', headers,
          body: JSON.stringify({ Login: loginNum, Position: parseInt(ticket) || ticket, apikey: apiKey }),
        });
        const text = await closeRes.text();
        let parsed;
        try { parsed = JSON.parse(text); } catch { parsed = { raw: text.slice(0, 200) }; }
        const errCode = parsed?.data?.errorcode ?? parsed?.errorcode;
        if (closeRes.ok && !errCode) return { ticket: String(ticket), ok: true };
        return { ticket: String(ticket), ok: false, error: parsed?.data?.errormsg || parsed?.errormsg || text.slice(0, 150) };
      } catch (e) {
        return { ticket: String(ticket), ok: false, error: e.message };
      }
    }));

    const closed = results.filter(r => r.ok).length;
    const failed = results.filter(r => !r.ok).length;
    const errors = results.filter(r => !r.ok).map(r => ({ ticket: r.ticket, error: r.error }));

    return Response.json({ success: true, closed, failed, total: positions.length, errors });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});