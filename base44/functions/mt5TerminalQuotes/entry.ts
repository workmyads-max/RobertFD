/**
 * mt5TerminalQuotes — Live bid/ask for a list of symbols.
 *
 * The Tritech MT5 manager API does not expose market-data / quote endpoints
 * (only account & deal management). We fetch live prices from Yahoo Finance
 * (free, no API key) and map MT5 symbol names to Yahoo ticker symbols.
 *
 * Returns: [{ symbol, bid, ask, spread, timestamp }]
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// MT5 symbol → Yahoo Finance ticker
const YAHOO_MAP = {
  'EURUSD': 'EURUSD=X', 'GBPUSD': 'GBPUSD=X', 'USDJPY': 'USDJPY=X',
  'USDCHF': 'USDCHF=X', 'AUDUSD': 'AUDUSD=X', 'USDCAD': 'USDCAD=X',
  'XAUUSD': 'GC=F', 'XAGUSD': 'SI=F',
  'BTCUSD': 'BTC-USD',
  'US500': '^GSPC', 'US30': '^DJI', 'USTEC': '^IXIC',
};

// Synthetic spread per instrument type (in price units) — for display only.
// Actual trade execution uses real MT5 prices via the trade function.
const SPREAD_MAP = {
  'EURUSD': 0.00008, 'GBPUSD': 0.00010, 'USDJPY': 0.012,
  'USDCHF': 0.00009, 'AUDUSD': 0.00008, 'USDCAD': 0.00009,
  'XAUUSD': 0.25, 'XAGUSD': 0.015,
  'BTCUSD': 15,
  'US500': 0.25, 'US30': 1.5, 'USTEC': 2.5,
};

function roundTo(n, digits) {
  const f = Math.pow(10, digits);
  return Math.round(n * f) / f;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const symbols = (body.symbols || []).map((s) => String(s).toUpperCase());

    const now = new Date().toISOString();
    const quotes = [];

    // Fetch each symbol's price from Yahoo Finance chart endpoint (no key needed)
    await Promise.all(symbols.map(async (sym) => {
      const yTicker = YAHOO_MAP[sym];
      if (!yTicker) return;

      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yTicker)}?interval=1m&range=1d`;
        const res = await fetch(url, {
          method: 'GET',
          headers: { 'User-Agent': 'Mozilla/5.0' },
        });
        if (!res.ok) return;
        const data = await res.json().catch(() => ({}));
        const meta = data?.chart?.result?.[0]?.meta;
        if (!meta) return;

        const price = parseFloat(meta.regularMarketPrice ?? meta.chartPreviousClose ?? 0);
        if (price <= 0) return;

        const spread = SPREAD_MAP[sym] || (price * 0.0002);
        const digits = price >= 100 ? 2 : 5;

        quotes.push({
          symbol: sym,
          bid: roundTo(price - spread / 2, digits),
          ask: roundTo(price + spread / 2, digits),
          spread: roundTo(spread, digits),
          timestamp: now,
        });
      } catch (_) { /* skip this symbol */ }
    }));

    return Response.json({ success: true, quotes });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});