import { useState, useEffect, useRef } from 'react';
import { INSTRUMENTS, SEED_PRICES } from './terminalConfig';

const TWELVE_DATA_KEY_STORAGE = 'twelvedata_api_key';

export function getTwelveDataKey() {
  try { return localStorage.getItem(TWELVE_DATA_KEY_STORAGE) || ''; } catch { return ''; }
}
export function setTwelveDataKey(key) {
  try { localStorage.setItem(TWELVE_DATA_KEY_STORAGE, key); } catch {}
}

// TwelveData symbol map (their format)
const TWELVE_SYMBOLS = {
  // Forex
  'EUR/USD': 'EUR/USD', 'GBP/USD': 'GBP/USD', 'USD/JPY': 'USD/JPY',
  'AUD/USD': 'AUD/USD', 'USD/CHF': 'USD/CHF', 'USD/CAD': 'USD/CAD',
  'NZD/USD': 'NZD/USD', 'EUR/GBP': 'EUR/GBP', 'EUR/JPY': 'EUR/JPY',
  'GBP/JPY': 'GBP/JPY', 'AUD/JPY': 'AUD/JPY', 'USD/MXN': 'USD/MXN',
  // Metals
  'XAU/USD': 'XAU/USD', 'XAG/USD': 'XAG/USD',
  // Indices
  'NAS100': 'NDX', 'US30': 'DJI', 'SPX500': 'SPX', 'GER40': 'DAX',
  'UK100': 'FTSE', 'FRA40': 'CAC40',
  // Stocks
  'AAPL': 'AAPL', 'TSLA': 'TSLA', 'AMZN': 'AMZN', 'MSFT': 'MSFT',
  'GOOGL': 'GOOGL', 'META': 'META', 'NFLX': 'NFLX', 'NVDA': 'NVDA',
  'AMD': 'AMD', 'BABA': 'BABA', 'DIS': 'DIS', 'JPM': 'JPM',
  // Commodities
  'OIL': 'WTI', 'BRENT': 'BRENT', 'NGAS': 'NATURAL_GAS',
};

// Binance WebSocket for crypto (real-time, free, no key needed)
const BINANCE_MAP = {
  'BTC/USD': 'btcusdt', 'ETH/USD': 'ethusdt', 'BNB/USD': 'bnbusdt',
  'SOL/USD': 'solusdt', 'XRP/USD': 'xrpusdt', 'ADA/USD': 'adausdt',
  'DOGE/USD': 'dogeusdt', 'LTC/USD': 'ltcusdt',
};
const BINANCE_REVERSE = {};
Object.entries(BINANCE_MAP).forEach(([sym, bSym]) => {
  BINANCE_REVERSE[bSym.toUpperCase()] = sym;
});

export default function useLivePrices() {
  const [prices, setPrices] = useState(() => {
    const init = {};
    INSTRUMENTS.forEach(inst => {
      const bid = SEED_PRICES[inst.symbol] || 1;
      const ask = parseFloat((bid + (inst.spreadPips || 0)).toFixed(inst.digits));
      init[inst.symbol] = { bid, ask, pct: 0, prev: null, high: bid * 1.005, low: bid * 0.995 };
    });
    return init;
  });

  const wsRef = useRef(null);
  const tdWsRef = useRef(null);
  const fxIntervalRef = useRef(null);

  useEffect(() => {
    // ── 1. Binance WebSocket for crypto (always real, no key needed) ──────────
    const cryptoStreams = Object.values(BINANCE_MAP).map(s => `${s}@ticker`).join('/');
    const connectBinance = () => {
      const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${cryptoStreams}`);
      wsRef.current = ws;
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          const d = msg.data;
          if (!d?.s) return;
          const rawSym = d.s.replace('USDT', '').replace('USD', '');
          const sym = BINANCE_REVERSE[d.s.replace('USDT', 'USDT')] || BINANCE_REVERSE[d.s];
          if (!sym) {
            // try direct match
            const found = Object.entries(BINANCE_MAP).find(([, v]) => v.toUpperCase() === d.s.toLowerCase().replace('usdt', 'usdt').toUpperCase());
            if (!found) return;
          }
          const matchedSym = Object.entries(BINANCE_MAP).find(([, v]) => v.toUpperCase() + '' === d.s.toLowerCase().replace('usdt', 'USDT').toUpperCase().replace('USDT', 'USDT') || v + '@ticker' === d.s.toLowerCase() + '@ticker');
          const finalSym = sym || (matchedSym && matchedSym[0]);
          if (!finalSym) return;
          const inst = INSTRUMENTS.find(i => i.symbol === finalSym);
          if (!inst) return;
          const bid = parseFloat(d.b);
          const ask = parseFloat(d.a);
          if (!bid || !ask) return;
          setPrices(prev => ({
            ...prev,
            [finalSym]: {
              bid, ask,
              pct: parseFloat(d.P) || 0,
              prev: prev[finalSym]?.bid,
              high: Math.max(prev[finalSym]?.high || bid, bid),
              low:  Math.min(prev[finalSym]?.low  || bid, bid),
            },
          }));
        } catch {}
      };
      ws.onerror = () => {};
      ws.onclose = () => setTimeout(connectBinance, 3000);
    };
    connectBinance();

    // ── 2. TwelveData WebSocket for FX, metals, stocks, indices ──────────────
    const apiKey = getTwelveDataKey();
    if (apiKey) {
      const tdSymbols = Object.entries(TWELVE_SYMBOLS)
        .filter(([sym]) => INSTRUMENTS.find(i => i.symbol === sym && i.type !== 'crypto'))
        .map(([, tdSym]) => tdSym);

      const connectTwelveData = () => {
        const ws = new WebSocket(`wss://ws.twelvedata.com/v1/quotes/price?apikey=${apiKey}`);
        tdWsRef.current = ws;

        ws.onopen = () => {
          ws.send(JSON.stringify({
            action: 'subscribe',
            params: { symbols: tdSymbols.join(',') },
          }));
        };

        ws.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data.event !== 'price') return;
            const tdSym = data.symbol;
            // Reverse-map TwelveData symbol → our symbol
            const ourSym = Object.entries(TWELVE_SYMBOLS).find(([, v]) => v === tdSym)?.[0];
            if (!ourSym) return;
            const inst = INSTRUMENTS.find(i => i.symbol === ourSym);
            if (!inst) return;
            const bid = parseFloat(data.price);
            if (!bid) return;
            const ask = parseFloat((bid + (inst.spreadPips || 0)).toFixed(inst.digits));
            setPrices(prev => ({
              ...prev,
              [ourSym]: {
                bid, ask,
                pct: prev[ourSym]?.pct || 0,
                prev: prev[ourSym]?.bid,
                high: Math.max(prev[ourSym]?.high || bid, bid),
                low:  Math.min(prev[ourSym]?.low  || bid, bid),
              },
            }));
          } catch {}
        };

        ws.onerror = () => {};
        ws.onclose = () => setTimeout(connectTwelveData, 5000);
      };

      connectTwelveData();

      // Also do an initial REST fetch to seed prices immediately
      const fetchInitialPrices = async () => {
        const symbolList = Object.entries(TWELVE_SYMBOLS)
          .filter(([sym]) => INSTRUMENTS.find(i => i.symbol === sym && i.type !== 'crypto'))
          .map(([, tdSym]) => tdSym)
          .join(',');

        try {
          const res = await fetch(`https://api.twelvedata.com/price?symbol=${symbolList}&apikey=${apiKey}`);
          const data = await res.json();

          // data may be a single object {price} or map of {SYMBOL: {price}}
          const applyPrice = (tdSym, priceVal) => {
            const ourSym = Object.entries(TWELVE_SYMBOLS).find(([, v]) => v === tdSym)?.[0];
            if (!ourSym) return;
            const inst = INSTRUMENTS.find(i => i.symbol === ourSym);
            if (!inst) return;
            const bid = parseFloat(priceVal);
            if (!bid) return;
            const ask = parseFloat((bid + (inst.spreadPips || 0)).toFixed(inst.digits));
            setPrices(prev => ({
              ...prev,
              [ourSym]: {
                bid, ask,
                pct: prev[ourSym]?.pct || 0,
                prev: prev[ourSym]?.bid,
                high: Math.max(prev[ourSym]?.high || bid, bid),
                low:  Math.min(prev[ourSym]?.low  || bid, bid),
              },
            }));
          };

          if (data && typeof data === 'object') {
            if (data.price) {
              // Single symbol response
              const singleSym = symbolList.split(',')[0];
              applyPrice(singleSym, data.price);
            } else {
              Object.entries(data).forEach(([sym, val]) => {
                if (val?.price) applyPrice(sym, val.price);
              });
            }
          }
        } catch {}
      };

      fetchInitialPrices();

      // Refresh non-real-time prices every 10s via REST (for free tier)
      const tdRestInterval = setInterval(fetchInitialPrices, 10000);
      return () => {
        wsRef.current?.close();
        tdWsRef.current?.close();
        clearInterval(tdRestInterval);
        if (fxIntervalRef.current) clearInterval(fxIntervalRef.current);
      };
    }

    // ── 3. Fallback: simulated ticks for non-crypto when no API key ──────────
    const VOLATILITY = {
      fx:        (p) => p * 0.000008,
      metal:     (p) => p * 0.00005,
      index:     (p) => p * 0.00010,
      stock:     (p) => p * 0.00015,
      commodity: (p) => p * 0.00012,
    };

    fxIntervalRef.current = setInterval(() => {
      setPrices(prev => {
        const next = { ...prev };
        INSTRUMENTS.filter(i => i.type !== 'crypto').forEach(inst => {
          const cur = next[inst.symbol];
          if (!cur?.bid) return;
          const vol = (VOLATILITY[inst.type] || VOLATILITY.fx)(cur.bid);
          const move = (Math.random() - 0.499) * vol * 2;
          const newBid = Math.max(0.001, parseFloat((cur.bid + move).toFixed(inst.digits)));
          const newAsk = parseFloat((newBid + (inst.spreadPips || 0)).toFixed(inst.digits));
          const pct = parseFloat(((cur.pct || 0) + (Math.random() - 0.5) * 0.005).toFixed(3));
          next[inst.symbol] = {
            bid: newBid, ask: newAsk, pct,
            prev: cur.bid,
            high: Math.max(cur.high || newBid, newBid),
            low:  Math.min(cur.low  || newBid, newBid),
          };
        });
        return next;
      });
    }, 500);

    return () => {
      wsRef.current?.close();
      if (fxIntervalRef.current) clearInterval(fxIntervalRef.current);
    };
  }, []);

  return prices;
}