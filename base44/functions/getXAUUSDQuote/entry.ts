/**
 * getXAUUSDQuote — Fetch live XAUUSD bid/ask from MT5 broker bridge.
 * Tries the Tritech symbol/tick endpoint. Falls back to userget on a known account.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

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

    let price = null, bid = null, ask = null, spread = null;

    // ── Attempt 1: /api/v1/symbol/get ──────────────────────────────────────
    try {
      const symRes = await fetch(`${MT5_BASE}/api/v1/symbol/get`, {
        method: 'POST', headers,
        body: JSON.stringify({ symbol: 'XAUUSD', apikey: MT5_KEY }),
      });
      if (symRes.ok) {
        const data = await symRes.json().catch(() => ({}));
        const sym = data?.data || data;
        if (sym?.bid && sym?.ask) {
          bid = parseFloat(sym.bid);
          ask = parseFloat(sym.ask);
          price = (bid + ask) / 2;
          spread = ((ask - bid) * 100).toFixed(1);
        }
      }
    } catch (_) { /* fall through */ }

    // ── Attempt 2: /api/v1/tick/last ───────────────────────────────────────
    if (!price) {
      try {
        const tickRes = await fetch(`${MT5_BASE}/api/v1/tick/last`, {
          method: 'POST', headers,
          body: JSON.stringify({ symbol: 'XAUUSD', apikey: MT5_KEY }),
        });
        if (tickRes.ok) {
          const data = await tickRes.json().catch(() => ({}));
          const tick = data?.data || data;
          bid = parseFloat(tick?.bid ?? tick?.Bid ?? 0);
          ask = parseFloat(tick?.ask ?? tick?.Ask ?? 0);
          if (bid > 0 && ask > 0) {
            price = (bid + ask) / 2;
            spread = ((ask - bid) * 100).toFixed(1);
          }
        }
      } catch (_) { /* fall through */ }
    }

    // ── Attempt 3: /api/v1/symbol/list ──────────────────────────────────────
    if (!price) {
      try {
        const listRes = await fetch(`${MT5_BASE}/api/v1/symbol/list`, {
          method: 'POST', headers,
          body: JSON.stringify({ apikey: MT5_KEY }),
        });
        if (listRes.ok) {
          const data = await listRes.json().catch(() => ({}));
          const symbols = data?.data || data?.symbols || [];
          const xau = Array.isArray(symbols) 
            ? symbols.find(s => (s.symbol || s.Symbol || s.name || '').toUpperCase() === 'XAUUSD')
            : null;
          if (xau) {
            bid = parseFloat(xau.bid ?? xau.Bid ?? 0);
            ask = parseFloat(xau.ask ?? xau.Ask ?? 0);
            if (bid > 0 && ask > 0) {
              price = (bid + ask) / 2;
              spread = ((ask - bid) * 100).toFixed(1);
            }
          }
        }
      } catch (_) { /* fall through */ }
    }

    // ── Attempt 4: /api/v1/symbols (alt path) ────────────────────────────────
    if (!price) {
      try {
        const res = await fetch(`${MT5_BASE}/api/v1/symbols`, {
          method: 'POST', headers,
          body: JSON.stringify({ symbol: 'XAUUSD', apikey: MT5_KEY }),
        });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          const d = data?.data || data;
          bid = parseFloat(d?.bid ?? d?.Bid ?? 0);
          ask = parseFloat(d?.ask ?? d?.Ask ?? 0);
          if (bid > 0 && ask > 0) { price = (bid + ask) / 2; spread = ((ask - bid) * 100).toFixed(1); }
        }
      } catch (_) {}
    }

    // ── Attempt 5: /api/v1/market/quote ─────────────────────────────────────
    if (!price) {
      try {
        const res = await fetch(`${MT5_BASE}/api/v1/market/quote`, {
          method: 'POST', headers,
          body: JSON.stringify({ symbols: ['XAUUSD'], apikey: MT5_KEY }),
        });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          const q = Array.isArray(data?.data) ? data.data[0] : data?.data || data;
          bid = parseFloat(q?.bid ?? q?.Bid ?? 0);
          ask = parseFloat(q?.ask ?? q?.Ask ?? 0);
          if (bid > 0 && ask > 0) { price = (bid + ask) / 2; spread = ((ask - bid) * 100).toFixed(1); }
        }
      } catch (_) {}
    }

    if (!price) {
      return Response.json({ success: false, error: 'Could not fetch XAUUSD from MT5' });
    }

    return Response.json({
      success: true,
      bid: Math.round(bid * 100) / 100,
      ask: Math.round(ask * 100) / 100,
      price: Math.round(price * 100) / 100,
      spread: spread + ' points',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});