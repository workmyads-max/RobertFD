import { useState, useEffect, useRef } from 'react';
import { INSTRUMENTS, SEED_PRICES } from './terminalConfig';

// Legacy exports kept for AdminTerminalControl compatibility
const TWELVE_DATA_KEY_STORAGE = 'twelvedata_api_key';
export function getTwelveDataKey() { try { return localStorage.getItem(TWELVE_DATA_KEY_STORAGE) || ''; } catch { return ''; } }
export function setTwelveDataKey(key) { try { localStorage.setItem(TWELVE_DATA_KEY_STORAGE, key); } catch {} }

// ── Binance WebSocket for all crypto (free, no key) ───────────────────────────
const BINANCE_MAP = {
  'BTC/USD': 'btcusdt', 'ETH/USD': 'ethusdt', 'BNB/USD': 'bnbusdt',
  'SOL/USD': 'solusdt', 'XRP/USD': 'xrpusdt', 'ADA/USD': 'adausdt',
  'DOGE/USD': 'dogeusdt', 'LTC/USD': 'ltcusdt',
};
const BINANCE_REVERSE = Object.fromEntries(
  Object.entries(BINANCE_MAP).map(([sym, b]) => [b.toUpperCase(), sym])
);

// ── Free public price REST APIs (no CORS issues, no key needed) ───────────────
// Uses exchangerate-api.com for FX and metals via open-access endpoints
// Plus several fallback sources

async function fetchFxPrices() {
  try {
    // Free open-access FX rates (no key needed)
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    const data = await res.json();
    if (!data?.rates) return null;
    const r = data.rates;
    return {
      'EUR/USD': r.USD / r.EUR,
      'GBP/USD': r.USD / r.GBP,
      'USD/JPY': r.JPY,
      'AUD/USD': r.USD / r.AUD,
      'USD/CHF': r.CHF,
      'USD/CAD': r.CAD,
      'NZD/USD': r.USD / r.NZD,
      'EUR/GBP': r.GBP / r.EUR,
      'EUR/JPY': r.JPY / r.EUR,
      'GBP/JPY': r.JPY / r.GBP,
      'AUD/JPY': r.JPY / r.AUD,
      'USD/MXN': r.MXN,
    };
  } catch {
    return null;
  }
}

async function fetchMetalPrices() {
  try {
    // Free gold/silver prices via frankfurter (no key needed)
    const res = await fetch('https://api.frankfurter.app/latest?from=XAU&to=USD');
    const data = await res.json();
    const goldUsd = data?.rates?.USD;
    if (!goldUsd) return null;
    // Silver roughly ~1/80 of gold
    return {
      'XAU/USD': goldUsd,
      'XAG/USD': parseFloat((goldUsd / 82).toFixed(3)),
    };
  } catch {
    return null;
  }
}

async function fetchCryptoPricesRest() {
  try {
    const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT', 'DOGEUSDT', 'LTCUSDT'];
    const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=${JSON.stringify(symbols)}`);
    const data = await res.json();
    const result = {};
    data.forEach(t => {
      const ourSym = BINANCE_REVERSE[t.symbol];
      if (ourSym) {
        result[ourSym] = {
          price: parseFloat(t.lastPrice),
          pct: parseFloat(t.priceChangePercent),
        };
      }
    });
    return result;
  } catch {
    return null;
  }
}

// ── Simulate realistic ticks around a real price ──────────────────────────────
const VOLATILITY = {
  fx:        p => p * 0.000006,
  metal:     p => p * 0.00008,
  index:     p => p * 0.00012,
  stock:     p => p * 0.00018,
  commodity: p => p * 0.00010,
  crypto:    p => p * 0.00020,
};

export default function useLivePrices() {
  const [prices, setPrices] = useState(() => {
    const init = {};
    INSTRUMENTS.forEach(inst => {
      const bid = SEED_PRICES[inst.symbol] || 1;
      const ask = parseFloat((bid + (inst.spreadPips || 0)).toFixed(inst.digits));
      init[inst.symbol] = { bid, ask, pct: 0, prev: null, high: bid * 1.002, low: bid * 0.998 };
    });
    return init;
  });

  const wsRef    = useRef(null);
  const tickRef  = useRef(null);
  const mounted  = useRef(true);

  // Apply a real price to a symbol
  const applyPrice = (sym, realBid, pct = null) => {
    if (!mounted.current) return;
    const inst = INSTRUMENTS.find(i => i.symbol === sym);
    if (!inst || !realBid || isNaN(realBid)) return;
    const ask = parseFloat((realBid + (inst.spreadPips || 0)).toFixed(inst.digits));
    const bid = parseFloat(realBid.toFixed(inst.digits));
    setPrices(prev => ({
      ...prev,
      [sym]: {
        bid, ask,
        pct: pct !== null ? pct : (prev[sym]?.pct || 0),
        prev: prev[sym]?.bid,
        high: Math.max(prev[sym]?.high || bid, bid),
        low:  Math.min(prev[sym]?.low  || bid, bid),
      },
    }));
  };

  useEffect(() => {
    mounted.current = true;

    // ── 1. Binance WebSocket - crypto real-time ───────────────────────────────
    const streams = Object.values(BINANCE_MAP).map(s => `${s}@ticker`).join('/');
    const connectBinance = () => {
      try {
        const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);
        wsRef.current = ws;
        ws.onmessage = (e) => {
          try {
            const { data: d } = JSON.parse(e.data);
            if (!d?.s) return;
            const sym = BINANCE_REVERSE[d.s];
            if (!sym) return;
            const bid = parseFloat(d.b);
            const pct = parseFloat(d.P);
            if (bid > 0) applyPrice(sym, bid, pct);
          } catch {}
        };
        ws.onerror = () => {};
        ws.onclose = () => { if (mounted.current) setTimeout(connectBinance, 4000); };
      } catch {}
    };
    connectBinance();

    // ── 2. Fetch real FX + metal prices on load & every 30s ──────────────────
    const loadRealPrices = async () => {
      const [fxData, metalData] = await Promise.all([fetchFxPrices(), fetchMetalPrices()]);
      if (fxData) {
        Object.entries(fxData).forEach(([sym, price]) => applyPrice(sym, price));
      }
      if (metalData) {
        Object.entries(metalData).forEach(([sym, price]) => applyPrice(sym, price));
      }
    };
    loadRealPrices();
    const restInterval = setInterval(loadRealPrices, 30000);

    // ── 3. Realistic tick simulation for all instruments ──────────────────────
    // Adds micro-movements so prices feel live even between REST fetches
    tickRef.current = setInterval(() => {
      if (!mounted.current) return;
      setPrices(prev => {
        const next = { ...prev };
        INSTRUMENTS.forEach(inst => {
          const cur = next[inst.symbol];
          if (!cur?.bid) return;
          const vol = (VOLATILITY[inst.type] || VOLATILITY.fx)(cur.bid);
          const move = (Math.random() - 0.499) * vol * 2;
          const newBid = Math.max(0.00001, parseFloat((cur.bid + move).toFixed(inst.digits)));
          const newAsk = parseFloat((newBid + (inst.spreadPips || 0)).toFixed(inst.digits));
          next[inst.symbol] = {
            bid: newBid, ask: newAsk,
            pct: cur.pct || 0,
            prev: cur.bid,
            high: Math.max(cur.high || newBid, newBid),
            low:  Math.min(cur.low  || newBid, newBid),
          };
        });
        return next;
      });
    }, 400);

    return () => {
      mounted.current = false;
      wsRef.current?.close();
      clearInterval(restInterval);
      clearInterval(tickRef.current);
    };
  }, []);

  return prices;
}