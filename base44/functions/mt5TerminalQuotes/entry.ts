/**
 * mt5TerminalQuotes — Live bid/ask for a list of symbols from the MT5 price feed.
 * Tries the batch symbol/list endpoint first, then falls back to per-symbol tick/last.
 *
 * Returns: [{ symbol, bid, ask, spread, timestamp }]
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const symbols: string[] = (body.symbols || []).map((s: string) => String(s).toUpperCase());

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

    const now = new Date().toISOString();
    const quotes: any[] = [];

    // ── Attempt 1: /api/v1/symbol/list (batch — all symbols at once) ──────────
    let listMap: Record<string, any> = {};
    try {
      const res = await fetch(`${MT5_BASE}/api/v1/symbol/list`, {
        method: 'POST', headers,
        body: JSON.stringify({ apikey: MT5_KEY }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const arr = data?.data || data?.symbols || [];
        if (Array.isArray(arr)) {
          for (const s of arr) {
            const sym = String(s.symbol || s.Symbol || s.name || '').toUpperCase();
            if (sym) listMap[sym] = s;
          }
        }
      }
    } catch (_) {}

    // If the batch endpoint returned all requested symbols, use them
    if (Object.keys(listMap).length > 0) {
      for (const sym of symbols) {
        const s = listMap[sym];
        if (s) {
          const bid = parseFloat(s.bid ?? s.Bid ?? 0);
          const ask = parseFloat(s.ask ?? s.Ask ?? 0);
          if (bid > 0 && ask > 0) {
            quotes.push({
              symbol: sym,
              bid: Math.round(bid * 100000) / 100000,
              ask: Math.round(ask * 100000) / 100000,
              spread: Math.round((ask - bid) * 100000) / 100000,
              timestamp: now,
            });
          }
        }
      }
      if (quotes.length === symbols.length) {
        return Response.json({ success: true, quotes });
      }
    }

    // ── Attempt 2: per-symbol /api/v1/symbol/get ──────────────────────────────
    await Promise.all(symbols.map(async (sym) => {
      if (quotes.find(q => q.symbol === sym)) return; // already have it
      let bid = 0, ask = 0;
      try {
        const res = await fetch(`${MT5_BASE}/api/v1/symbol/get`, {
          method: 'POST', headers,
          body: JSON.stringify({ symbol: sym, apikey: MT5_KEY }),
        });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          const d = data?.data || data;
          bid = parseFloat(d?.bid ?? d?.Bid ?? 0);
          ask = parseFloat(d?.ask ?? d?.Ask ?? 0);
        }
      } catch (_) {}

      // Fallback: /api/v1/tick/last
      if (bid === 0 || ask === 0) {
        try {
          const res = await fetch(`${MT5_BASE}/api/v1/tick/last`, {
            method: 'POST', headers,
            body: JSON.stringify({ symbol: sym, apikey: MT5_KEY }),
          });
          if (res.ok) {
            const data = await res.json().catch(() => ({}));
            const d = data?.data || data;
            bid = parseFloat(d?.bid ?? d?.Bid ?? 0);
            ask = parseFloat(d?.ask ?? d?.Ask ?? 0);
          }
        } catch (_) {}
      }

      if (bid > 0 && ask > 0) {
        quotes.push({
          symbol: sym,
          bid: Math.round(bid * 100000) / 100000,
          ask: Math.round(ask * 100000) / 100000,
          spread: Math.round((ask - bid) * 100000) / 100000,
          timestamp: now,
        });
      }
    }));

    return Response.json({ success: true, quotes });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});