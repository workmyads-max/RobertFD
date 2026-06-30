import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

// ── Crypto via Binance (real-time, free) ──────────────────────────────────────
const BINANCE_MAP = {
  'BTC/USD': 'btcusdt',
  'ETH/USD': 'ethusdt',
  'BNB/USD': 'bnbusdt',
  'SOL/USD': 'solusdt',
  'XRP/USD': 'xrpusdt',
};

// ── Non-crypto: seed prices + simulate (real data from TwelveData if key set) ─
const NON_CRYPTO = [
  { symbol: 'XAU/USD', seed: 2338.15, digits: 2, vol: 0.00018 },
  { symbol: 'XAG/USD', seed: 27.45,   digits: 3, vol: 0.00022 },
  { symbol: 'EUR/USD', seed: 1.08215,  digits: 5, vol: 0.000006 },
  { symbol: 'GBP/USD', seed: 1.27048,  digits: 5, vol: 0.000008 },
  { symbol: 'USD/JPY', seed: 154.78,   digits: 3, vol: 0.00004 },
  { symbol: 'AUD/USD', seed: 0.67234,  digits: 5, vol: 0.000006 },
  { symbol: 'NAS100',  seed: 18254,    digits: 1, vol: 0.00012 },
  { symbol: 'US30',    seed: 39810,    digits: 1, vol: 0.00010 },
  { symbol: 'SPX500',  seed: 5210,     digits: 2, vol: 0.00008 },
  { symbol: 'GER40',   seed: 18100,    digits: 1, vol: 0.00010 },
  { symbol: 'OIL',     seed: 78.42,    digits: 2, vol: 0.00020 },
  { symbol: 'BRENT',   seed: 82.15,    digits: 2, vol: 0.00020 },
];

const TWELVE_DATA_KEY_STORAGE = 'twelvedata_api_key';
const getTwelveDataKey = () => { try { return localStorage.getItem(TWELVE_DATA_KEY_STORAGE) || ''; } catch { return ''; } };

const TWELVE_SYMBOLS = {
  'EUR/USD': 'EUR/USD', 'GBP/USD': 'GBP/USD', 'USD/JPY': 'USD/JPY',
  'AUD/USD': 'AUD/USD', 'XAU/USD': 'XAU/USD', 'XAG/USD': 'XAG/USD',
  'NAS100': 'NDX', 'US30': 'DJI', 'SPX500': 'SPX', 'GER40': 'DAX',
  'OIL': 'WTI', 'BRENT': 'BRENT',
};

function TickerItem({ item }) {
  const [flash, setFlash] = useState(null);
  const prevPrice = useRef(item.price);

  useEffect(() => {
    if (item.price !== prevPrice.current) {
      setFlash(item.price > prevPrice.current ? 'up' : 'down');
      prevPrice.current = item.price;
      const t = setTimeout(() => setFlash(null), 500);
      return () => clearTimeout(t);
    }
  }, [item.price]);

  const isUp = (item.pct || 0) >= 0;
  const priceStr = item.price?.toFixed(item.digits || 2) || '-';

  return (
    <div className="flex items-center gap-2 px-4 flex-shrink-0 border-r border-white/[0.05]">
      <span className="text-[10px] font-mono font-semibold text-white/50">{item.symbol}</span>
      <span className="text-[11px] font-bold font-mono transition-all duration-150"
        style={{ color: flash === 'up' ? '#00f5a0' : flash === 'down' ? '#f87171' : 'rgba(255,255,255,0.88)' }}>
        {priceStr}
      </span>
      <span className={`text-[9px] font-mono font-bold ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
        {isUp ? '▲' : '▼'}{Math.abs(item.pct || 0).toFixed(2)}%
      </span>
    </div>
  );
}

export default function LiveTickerBar() {
  const [prices, setPrices] = useState(() => {
    const init = {};
    // crypto seeds
    const cryptoSeeds = { 'BTC/USD': 65420, 'ETH/USD': 3185, 'BNB/USD': 380, 'SOL/USD': 170, 'XRP/USD': 0.62 };
    Object.entries(cryptoSeeds).forEach(([sym, seed]) => {
      init[sym] = { symbol: sym, price: seed, pct: 0, digits: 2 };
    });
    // non-crypto seeds
    NON_CRYPTO.forEach(s => {
      init[s.symbol] = { symbol: s.symbol, price: s.seed, pct: (Math.random() - 0.5) * 0.8, digits: s.digits };
    });
    return init;
  });

  const wsRef = useRef(null);
  const tdWsRef = useRef(null);

  useEffect(() => {
    // ── Binance real-time crypto ──────────────────────────────────────────────
    const streams = Object.values(BINANCE_MAP).map(s => `${s}@miniTicker`).join('/');
    const connectBinance = () => {
      const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);
      wsRef.current = ws;
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          const d = msg.data;
          if (!d?.s) return;
          const sym = Object.entries(BINANCE_MAP).find(([, v]) => v === d.s.toLowerCase())?.[0];
          if (!sym) return;
          setPrices(prev => ({
            ...prev,
            [sym]: { symbol: sym, price: parseFloat(d.c), pct: parseFloat(d.P), digits: 2 },
          }));
        } catch {}
      };
      ws.onerror = () => {};
      ws.onclose = () => setTimeout(connectBinance, 3000);
    };
    connectBinance();

    // ── TwelveData WS for FX/metals/indices (if key available) ───────────────
    const apiKey = getTwelveDataKey();
    if (apiKey) {
      const tdSyms = Object.values(TWELVE_SYMBOLS).join(',');
      const connectTD = () => {
        const ws = new WebSocket(`wss://ws.twelvedata.com/v1/quotes/price?apikey=${apiKey}`);
        tdWsRef.current = ws;
        ws.onopen = () => ws.send(JSON.stringify({ action: 'subscribe', params: { symbols: tdSyms } }));
        ws.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data.event !== 'price') return;
            const ourSym = Object.entries(TWELVE_SYMBOLS).find(([, v]) => v === data.symbol)?.[0];
            if (!ourSym) return;
            const nc = NON_CRYPTO.find(s => s.symbol === ourSym);
            const price = parseFloat(data.price);
            if (!price) return;
            setPrices(prev => ({
              ...prev,
              [ourSym]: {
                symbol: ourSym, price,
                pct: prev[ourSym]?.pct || 0,
                digits: nc?.digits || 2,
              },
            }));
          } catch {}
        };
        ws.onerror = () => {};
        ws.onclose = () => setTimeout(connectTD, 5000);
      };
      connectTD();

      // Also seed from REST
      fetch(`https://api.twelvedata.com/price?symbol=${Object.values(TWELVE_SYMBOLS).join(',')}&apikey=${apiKey}`)
        .then(r => r.json()).then(data => {
          if (!data || typeof data !== 'object') return;
          Object.entries(data).forEach(([tdSym, val]) => {
            const ourSym = Object.entries(TWELVE_SYMBOLS).find(([, v]) => v === tdSym)?.[0];
            if (!ourSym || !val?.price) return;
            const nc = NON_CRYPTO.find(s => s.symbol === ourSym);
            setPrices(prev => ({
              ...prev,
              [ourSym]: { symbol: ourSym, price: parseFloat(val.price), pct: prev[ourSym]?.pct || 0, digits: nc?.digits || 2 },
            }));
          });
        }).catch(() => {});
    }

    // ── Fallback simulation for non-crypto when no TwelveData key ────────────
    const interval = setInterval(() => {
      setPrices(prev => {
        const next = { ...prev };
        NON_CRYPTO.forEach(s => {
          const cur = next[s.symbol];
          if (!cur) return;
          const move = (Math.random() - 0.499) * s.seed * s.vol * 2;
          const newP = Math.max(0.001, parseFloat((cur.price + move).toFixed(s.digits)));
          const newPct = parseFloat(((cur.pct || 0) + (Math.random() - 0.5) * 0.015).toFixed(3));
          next[s.symbol] = { ...cur, price: newP, pct: newPct };
        });
        return next;
      });
    }, 800);

    return () => {
      wsRef.current?.close();
      tdWsRef.current?.close();
      clearInterval(interval);
    };
  }, []);

  const items = Object.values(prices);
  const doubled = [...items, ...items];

  return (
    <div className="w-full overflow-hidden border-b border-white/[0.05] relative"
      style={{ background: 'rgba(6,10,20,0.98)', height: '34px' }}>
      <div className="absolute left-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(90deg, rgba(6,10,20,1), transparent)' }} />
      <div className="absolute right-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(-90deg, rgba(6,10,20,1), transparent)' }} />
      <div className="ticker-scroll flex items-center h-full" style={{ width: 'max-content' }}>
        {doubled.map((item, i) => (
          <TickerItem key={`${item.symbol}-${i}`} item={item} />
        ))}
      </div>
    </div>
  );
}