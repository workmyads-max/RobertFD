import { useState, useEffect, useRef } from 'react';
import { INSTRUMENTS, SEED_PRICES } from './terminalConfig';

// TwelveData API key storage key
const TWELVE_DATA_KEY_STORAGE = 'twelvedata_api_key';

export function getTwelveDataKey() {
  try { return localStorage.getItem(TWELVE_DATA_KEY_STORAGE) || ''; } catch { return ''; }
}
export function setTwelveDataKey(key) {
  try { localStorage.setItem(TWELVE_DATA_KEY_STORAGE, key); } catch {}
}

// Binance WS symbol map for crypto
const BINANCE_MAP = {
  'BTC/USD': 'btcusdt', 'ETH/USD': 'ethusdt', 'BNB/USD': 'bnbusdt',
  'SOL/USD': 'solusdt', 'XRP/USD': 'xrpusdt', 'ADA/USD': 'adausdt',
  'DOGE/USD': 'dogeusdt', 'LTC/USD': 'ltcusdt',
};
const BINANCE_REVERSE = Object.fromEntries(Object.entries(BINANCE_MAP).map(([k, v]) => [v.toUpperCase() + 'T', k]).concat(
  Object.entries(BINANCE_MAP).map(([k, v]) => [v.toUpperCase(), k])
));

export default function useLivePrices() {
  const [prices, setPrices] = useState(() => {
    const init = {};
    INSTRUMENTS.forEach(inst => {
      const bid = SEED_PRICES[inst.symbol] || 1;
      const ask = parseFloat((bid + (inst.spreadPips || 0)).toFixed(inst.digits));
      init[inst.symbol] = { bid, ask, pct: (Math.random() - 0.5) * 0.4, prev: null, high: bid * 1.005, low: bid * 0.995 };
    });
    return init;
  });

  const wsRef = useRef(null);

  useEffect(() => {
    // ── Binance WebSocket for all crypto ───────────────────────────────────
    const cryptoStreams = Object.values(BINANCE_MAP).map(s => `${s}@ticker`).join('/');

    const connectBinance = () => {
      const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${cryptoStreams}`);
      wsRef.current = ws;
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          const d = msg.data;
          if (!d?.s) return;
          const sym = BINANCE_REVERSE[d.s] || BINANCE_REVERSE[d.s + 'T'];
          if (!sym) return;
          const inst = INSTRUMENTS.find(i => i.symbol === sym);
          if (!inst) return;
          const bid = parseFloat(d.b);
          const ask = parseFloat(d.a);
          setPrices(prev => ({
            ...prev,
            [sym]: {
              bid, ask,
              pct: parseFloat(d.P),
              prev: prev[sym]?.bid,
              high: Math.max(prev[sym]?.high || bid, bid),
              low:  Math.min(prev[sym]?.low || bid, bid),
            },
          }));
        } catch {}
      };
      ws.onerror = () => {};
      ws.onclose = () => {
        setTimeout(connectBinance, 3000);
      };
    };
    connectBinance();

    // ── Simulated ticks for FX, metals, indices, stocks, commodities ───────
    // Realistic volatility per type
    const VOLATILITY = {
      fx:        (p) => p * 0.000008,
      metal:     (p) => p * 0.00005,
      index:     (p) => p * 0.00010,
      stock:     (p) => p * 0.00015,
      commodity: (p) => p * 0.00012,
    };

    const fxInterval = setInterval(() => {
      setPrices(prev => {
        const next = { ...prev };
        INSTRUMENTS.filter(i => i.type !== 'crypto').forEach(inst => {
          const cur = next[inst.symbol];
          if (!cur?.bid) return;
          const vol = (VOLATILITY[inst.type] || VOLATILITY.fx)(cur.bid);
          const move = (Math.random() - 0.499) * vol * 2;
          const newBid = Math.max(0.001, parseFloat((cur.bid + move).toFixed(inst.digits)));
          const newAsk = parseFloat((newBid + (inst.spreadPips || 0)).toFixed(inst.digits));
          // Drift pct slightly
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
      clearInterval(fxInterval);
    };
  }, []);

  return prices;
}