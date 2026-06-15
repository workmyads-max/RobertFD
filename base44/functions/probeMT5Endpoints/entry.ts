/**
 * probeMT5Endpoints — Discovers which MT5 API endpoints exist on the broker bridge.
 * Admin-only. Tests common Tritech user management endpoints.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const MT5_BASE = Deno.env.get('MT5_API_BASE_URL');
    const MT5_KEY  = Deno.env.get('MT5_API_KEY');
    if (!MT5_BASE || !MT5_KEY) return Response.json({ error: 'MT5 creds missing' }, { status: 500 });

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MT5_KEY}`,
      'ApiKey': MT5_KEY,
    };

    // Probe all candidate user management endpoints with a dummy login
    const dummyLogin = 999999999;
    const body = (extra = {}) => JSON.stringify({ Login: dummyLogin, apikey: MT5_KEY, ...extra });

    const endpoints = [
      // Create variants
      ['POST', '/api/v1/user/usercreate'],
      ['POST', '/api/v1/user/create'],
      ['POST', '/api/v1/account/create'],
      ['POST', '/api/v1/user/add'],
      // Delete variants
      ['POST', '/api/v1/user/userdelete'],
      ['POST', '/api/v1/user/delete'],
      ['POST', '/api/v1/user/remove'],
      ['POST', '/api/v1/account/delete'],
      // Archive/disable variants  
      ['POST', '/api/v1/user/move-disabled'],
      ['POST', '/api/v1/user/disable'],
      ['POST', '/api/v1/user/archive'],
      ['POST', '/api/v1/user/block'],
      // Update/modify
      ['POST', '/api/v1/user/userupdate'],
      ['POST', '/api/v1/user/update'],
      ['POST', '/api/v1/user/usermodify'],
      // Known working
      ['POST', '/api/v1/user/userget'],
      ['POST', '/api/v1/user/getlist'],
    ];

    const results = await Promise.all(endpoints.map(async ([method, path]) => {
      try {
        const res = await fetch(`${MT5_BASE}${path}`, {
          method,
          headers,
          body: body(),
        });
        const text = await res.text();
        let parsed;
        try { parsed = JSON.parse(text); } catch { parsed = text.slice(0, 200); }
        return {
          path,
          status: res.status,
          exists: res.status !== 404,
          errorcode: parsed?.data?.errorcode ?? parsed?.errorcode ?? null,
          errormsg: parsed?.data?.errormsg ?? parsed?.errormsg ?? null,
          sample: typeof parsed === 'string' ? parsed.slice(0, 100) : JSON.stringify(parsed).slice(0, 150),
        };
      } catch (e) {
        return { path, status: 'EXCEPTION', exists: false, error: e.message };
      }
    }));

    const existing = results.filter(r => r.exists);
    const missing  = results.filter(r => !r.exists);

    return Response.json({
      success: true,
      mt5_base: MT5_BASE,
      summary: {
        total_probed: results.length,
        endpoints_found: existing.length,
        endpoints_missing: missing.length,
      },
      found: existing,
      missing: missing.map(r => r.path),
    });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});