import { useState, useEffect } from 'react';
import { INSTRUMENTS, SEED_PRICES } from './terminalConfig';

export default function useLivePrices() {
  const [prices, setPrices] = useState(() => {
    const init = {};
    INSTRUMENTS.forEach(inst => {
      const bid = SEED_PRICES[inst.symbol] || 1;
      const ask = parseFloat((bid + inst.spreadPips).toFixed(inst.digits));
      init[inst.symbol] = { bid, ask, pct: 0, prev: null, high: bid * 1.005, low: bid * 0.995 };
    });
    return init;
  });

  useEffect(() => {
    // Binance WS for crypto
    const cryptoInsts = INSTRUMENTS.filter(i => i.type === 'crypto');
    const streamMap = { 'BTC/USD': 'btcusdt', 'ETH/USD': 'ethusdt' };
    const streams = cryptoInsts.map(i => `${streamMap[i.symbol]}@ticker`).join('/');
    let ws;
    let wsTimer;

    const connectWS = () => {
      ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);
      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        const d = msg.data;
        if (!d?.s) return;
        const sym = d.s === 'BTCUSDT' ? 'BTC/USD' : d.s === 'ETHUSDT' ? 'ETH/USD' : null;
        if (!sym) return;
        const inst = INSTRUMENTS.find(i => i.symbol === sym);
        const bid = parseFloat(d.b);
        const ask = parseFloat(d.a);
        setPrices(prev => ({
          ...prev,
          [sym]: {
            bid, ask,
            pct: parseFloat(d.P),
            prev: prev[sym]?.bid,
            high: Math.max(prev[sym]?.high || bid, bid),
            low:  Math.min(prev[sym]?.low  || bid, bid),
          },
        }));
      };
      ws.onerror = () => {};
      ws.onclose = () => { wsTimer = setTimeout(connectWS, 3000); };
    };
    connectWS();

    // Simulated tick for FX, metals, indices
    const fxInterval = setInterval(() => {
      setPrices(prev => {
        const next = { ...prev };
        INSTRUMENTS.filter(i => i.type !== 'crypto').forEach(inst => {
          const cur = next[inst.symbol];
          if (!cur?.bid) return;
          const vol = inst.type === 'index' ? cur.bid * 0.00012 : inst.type === 'metal' ? cur.bid * 0.00008 : cur.bid * 0.000012;
          const move = (Math.random() - 0.499) * vol * 2;
          const newBid = parseFloat((cur.bid + move).toFixed(inst.digits));
          const newAsk = parseFloat((newBid + inst.spreadPips).toFixed(inst.digits));
          const pct    = parseFloat(((cur.pct || 0) + (Math.random() - 0.5) * 0.008).toFixed(3));
          next[inst.symbol] = {
            bid:  newBid,
            ask:  newAsk,
            pct,
            prev: cur.bid,
            high: Math.max(cur.high, newBid),
            low:  Math.min(cur.low,  newBid),
          };
        });
        return next;
      });
    }, 400);

    return () => {
      ws?.close();
      clearTimeout(wsTimer);
      clearInterval(fxInterval);
    };
  }, []);

  return prices;
}