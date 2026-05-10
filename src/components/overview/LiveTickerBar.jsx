import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const TICKER_SYMBOLS = [
  { symbol: 'BTC/USD', wsSymbol: 'btcusdt', type: 'crypto', seed: 65420 },
  { symbol: 'ETH/USD', wsSymbol: 'ethusdt', type: 'crypto', seed: 3185 },
  { symbol: 'XAU/USD', wsSymbol: null, type: 'metal', seed: 2338.15 },
  { symbol: 'EUR/USD', wsSymbol: null, type: 'fx', seed: 1.08215, digits: 5 },
  { symbol: 'GBP/USD', wsSymbol: null, type: 'fx', seed: 1.27048, digits: 5 },
  { symbol: 'USD/JPY', wsSymbol: null, type: 'fx', seed: 154.78, digits: 3 },
  { symbol: 'NAS100',  wsSymbol: null, type: 'index', seed: 18254 },
  { symbol: 'US30',    wsSymbol: null, type: 'index', seed: 39810 },
  { symbol: 'SPX500',  wsSymbol: null, type: 'index', seed: 5210 },
  { symbol: 'AUD/USD', wsSymbol: null, type: 'fx', seed: 0.67234, digits: 5 },
  { symbol: 'USD/CHF', wsSymbol: null, type: 'fx', seed: 0.89450, digits: 5 },
  { symbol: 'XAG/USD', wsSymbol: null, type: 'metal', seed: 27.45 },
];

function TickerItem({ item }) {
  const [prev, setPrev] = useState(item.price);
  const [flash, setFlash] = useState(null);

  useEffect(() => {
    if (item.price !== prev) {
      setFlash(item.price > prev ? 'up' : 'down');
      setPrev(item.price);
      const t = setTimeout(() => setFlash(null), 600);
      return () => clearTimeout(t);
    }
  }, [item.price]);

  const isUp = (item.pct || 0) >= 0;
  const digits = item.digits || 2;
  const priceStr = item.price?.toFixed(digits) || '—';

  return (
    <div className="flex items-center gap-2 px-4 flex-shrink-0 border-r border-white/[0.04]">
      <span className="text-[10px] font-mono text-white/40 tracking-wider">{item.symbol}</span>
      <motion.span
        key={priceStr}
        initial={{ opacity: 0.7 }}
        animate={{ opacity: 1 }}
        className="text-[11px] font-bold font-mono transition-colors"
        style={{
          color: flash === 'up' ? '#00f5a0' : flash === 'down' ? '#f87171' : 'rgba(255,255,255,0.85)',
        }}
      >
        {priceStr}
      </motion.span>
      <span className={`text-[9px] font-mono font-bold ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
        {isUp ? '▲' : '▼'}{Math.abs(item.pct || 0).toFixed(2)}%
      </span>
    </div>
  );
}

export default function LiveTickerBar() {
  const [prices, setPrices] = useState(() =>
    TICKER_SYMBOLS.reduce((acc, s) => {
      acc[s.symbol] = { symbol: s.symbol, price: s.seed, pct: (Math.random() - 0.5) * 1.2, digits: s.digits };
      return acc;
    }, {})
  );

  useEffect(() => {
    // Crypto via Binance WS
    const cryptoSyms = TICKER_SYMBOLS.filter(s => s.wsSymbol);
    const streams = cryptoSyms.map(s => `${s.wsSymbol}@miniTicker`).join('/');
    let ws;
    const connectWS = () => {
      try {
        ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);
        ws.onmessage = (e) => {
          const msg = JSON.parse(e.data);
          const d = msg.data;
          if (!d || !d.s) return;
          const sym = TICKER_SYMBOLS.find(s => s.wsSymbol === d.s.toLowerCase());
          if (!sym) return;
          setPrices(prev => ({
            ...prev,
            [sym.symbol]: {
              symbol: sym.symbol,
              price: parseFloat(d.c),
              pct: parseFloat(d.P),
              digits: sym.digits || 2,
            },
          }));
        };
        ws.onerror = () => {};
        ws.onclose = () => { setTimeout(connectWS, 3000); };
      } catch {}
    };
    connectWS();

    // Non-crypto simulation
    const interval = setInterval(() => {
      setPrices(prev => {
        const next = { ...prev };
        TICKER_SYMBOLS.filter(s => !s.wsSymbol).forEach(sym => {
          const cur = next[sym.symbol];
          if (!cur) return;
          const volatility = sym.type === 'fx' ? cur.price * 0.00008 : sym.type === 'metal' ? cur.price * 0.0002 : cur.price * 0.0003;
          const move = (Math.random() - 0.499) * volatility;
          const newPrice = parseFloat((cur.price + move).toFixed(sym.digits || 2));
          const newPct = parseFloat(((cur.pct || 0) + (Math.random() - 0.5) * 0.02).toFixed(2));
          next[sym.symbol] = { ...cur, price: newPrice, pct: newPct };
        });
        return next;
      });
    }, 900);

    return () => {
      if (ws) ws.close();
      clearInterval(interval);
    };
  }, []);

  const items = Object.values(prices);
  const doubled = [...items, ...items]; // for seamless loop

  return (
    <div className="w-full overflow-hidden border-b border-white/[0.04] relative"
      style={{ background: 'rgba(4,8,18,0.98)', height: '36px' }}>
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(90deg, rgba(4,8,18,1), transparent)' }} />
      <div className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(-90deg, rgba(4,8,18,1), transparent)' }} />

      <div className="ticker-scroll flex items-center h-full" style={{ width: 'max-content' }}>
        {doubled.map((item, i) => (
          <TickerItem key={`${item.symbol}-${i}`} item={item} />
        ))}
      </div>
    </div>
  );
}