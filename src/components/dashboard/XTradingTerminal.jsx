import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, Activity, BarChart3, List, Clock, Bell, ChevronUp, ChevronDown, Maximize2, Minimize2 } from 'lucide-react';

const INSTRUMENTS = [
  { symbol: 'BTC/USD', bid: 67420.50, ask: 67445.00, change: +1820, pct: +2.77, digits: 2 },
  { symbol: 'XAU/USD', bid: 2338.42, ask: 2338.90, change: +12.4, pct: +0.53, digits: 2 },
  { symbol: 'EUR/USD', bid: 1.08312, ask: 1.08318, change: +0.0012, pct: +0.11, digits: 5 },
  { symbol: 'NAS100',  bid: 18204.00, ask: 18208.00, change: -48, pct: -0.26, digits: 2 },
  { symbol: 'ETH/USD', bid: 3124.50, ask: 3125.80, change: +64.2, pct: +2.10, digits: 2 },
  { symbol: 'GBP/USD', bid: 1.26841, ask: 1.26849, change: -0.0024, pct: -0.19, digits: 5 },
  { symbol: 'USD/JPY', bid: 154.820, ask: 154.860, change: +0.38, pct: +0.25, digits: 3 },
];

const INIT_POSITIONS = [
  { id: 1, symbol: 'BTC/USD', type: 'BUY', lots: 0.5, entry: 65600, current: 67420.50, sl: 64000, tp: 70000, pnl: 910, time: '09:14:22' },
  { id: 2, symbol: 'EUR/USD', type: 'SELL', lots: 2.0, entry: 1.08450, current: 1.08312, sl: 1.09000, tp: 1.07500, pnl: 276, time: '10:32:05' },
  { id: 3, symbol: 'XAU/USD', type: 'BUY', lots: 1.0, entry: 2350.00, current: 2338.42, sl: 2300.00, tp: 2400.00, pnl: -115.8, time: '11:45:18' },
];

const HISTORY = [
  { id: 'h1', symbol: 'BTC/USD', type: 'BUY', lots: 0.3, entry: 64100, close: 66800, pnl: 810, time: 'May 8 14:22' },
  { id: 'h2', symbol: 'EUR/USD', type: 'SELL', lots: 1.5, entry: 1.0920, close: 1.0870, pnl: 750, time: 'May 8 11:10' },
  { id: 'h3', symbol: 'NAS100', type: 'BUY', lots: 0.2, entry: 18050, close: 17980, pnl: -140, time: 'May 7 16:05' },
];

function useTickPrices(init) {
  const [prices, setPrices] = useState(init);
  useEffect(() => {
    const id = setInterval(() => {
      setPrices(p => p.map(inst => {
        const move = (Math.random() - 0.48) * inst.bid * 0.0002;
        const newBid = parseFloat((inst.bid + move).toFixed(inst.digits));
        const spread = inst.ask - inst.bid;
        const newAsk = parseFloat((newBid + spread).toFixed(inst.digits));
        const newPct = parseFloat((inst.pct + (Math.random() - 0.5) * 0.02).toFixed(2));
        return { ...inst, bid: newBid, ask: newAsk, pct: newPct };
      }));
    }, 600);
    return () => clearInterval(id);
  }, []);
  return prices;
}

function PriceCell({ value, prev, digits }) {
  const [flash, setFlash] = useState(null);
  useEffect(() => {
    if (prev !== undefined && prev !== value) {
      setFlash(value > prev ? 'up' : 'down');
      const t = setTimeout(() => setFlash(null), 400);
      return () => clearTimeout(t);
    }
  }, [value, prev]);
  return (
    <span className={`font-mono transition-colors duration-300 ${
      flash === 'up' ? 'text-emerald-400' : flash === 'down' ? 'text-red-400' : 'text-foreground'
    }`}>
      {typeof value === 'number' ? value.toFixed(digits) : value}
    </span>
  );
}

function TradingViewChart({ symbol, timeframe }) {
  const containerRef = useRef(null);
  const widgetRef = useRef(null);

  const tvSymbol = {
    'BTC/USD': 'BITSTAMP:BTCUSD',
    'ETH/USD': 'BITSTAMP:ETHUSD',
    'XAU/USD': 'OANDA:XAUUSD',
    'EUR/USD': 'OANDA:EURUSD',
    'GBP/USD': 'OANDA:GBPUSD',
    'USD/JPY': 'OANDA:USDJPY',
    'NAS100': 'NASDAQ:QQQ',
  }[symbol] || 'BITSTAMP:BTCUSD';

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: tvSymbol,
      interval: timeframe,
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      backgroundColor: '#07070a',
      gridColor: 'rgba(255,255,255,0.04)',
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      calendar: false,
      hide_volume: false,
      support_host: 'https://www.tradingview.com',
    });
    containerRef.current.appendChild(script);
    widgetRef.current = containerRef.current;
    return () => { if (containerRef.current) containerRef.current.innerHTML = ''; };
  }, [tvSymbol, timeframe]);

  return (
    <div className="tradingview-widget-container" ref={containerRef} style={{ height: '100%', width: '100%' }}>
      <div className="tradingview-widget-container__widget" style={{ height: 'calc(100% - 32px)', width: '100%' }} />
    </div>
  );
}

export default function XTradingTerminal({ account }) {
  const prices = useTickPrices(INSTRUMENTS);
  const prevPrices = useRef(INSTRUMENTS);
  const [selected, setSelected] = useState(INSTRUMENTS[0]);
  const [timeframe, setTimeframe] = useState('60');
  const [orderSide, setOrderSide] = useState('BUY');
  const [orderType, setOrderType] = useState('market');
  const [lots, setLots] = useState('0.10');
  const [sl, setSl] = useState('');
  const [tp, setTp] = useState('');
  const [positions, setPositions] = useState(INIT_POSITIONS);
  const [bottomTab, setBottomTab] = useState('positions');
  const [leftTab, setLeftTab] = useState('watchlist');
  const [orderPlaced, setOrderPlaced] = useState(false);

  const balance = account?.balance || 100000;
  const floatPnl = positions.reduce((s, p) => s + p.pnl, 0);
  const equity = balance + floatPnl;
  const margin = positions.length * 1350;
  const freeMargin = equity - margin;

  const currentInst = prices.find(p => p.symbol === selected.symbol) || selected;

  useEffect(() => {
    const id = setInterval(() => {
      setPositions(pp => pp.map(pos => {
        const inst = prices.find(p => p.symbol === pos.symbol);
        if (!inst) return pos;
        const newCurrent = pos.type === 'BUY' ? inst.bid : inst.ask;
        const move = pos.type === 'BUY' ? (newCurrent - pos.entry) : (pos.entry - newCurrent);
        const pnl = parseFloat((move * pos.lots * 100).toFixed(2));
        return { ...pos, current: newCurrent, pnl };
      }));
    }, 700);
    return () => clearInterval(id);
  }, [prices]);

  useEffect(() => {
    prevPrices.current = prices;
  }, [prices]);

  const placeOrder = () => {
    const inst = prices.find(p => p.symbol === selected.symbol) || selected;
    const entryPrice = orderSide === 'BUY' ? inst.ask : inst.bid;
    const newPos = {
      id: Date.now(), symbol: selected.symbol, type: orderSide,
      lots: parseFloat(lots) || 0.1, entry: entryPrice, current: entryPrice,
      sl: parseFloat(sl) || null, tp: parseFloat(tp) || null, pnl: 0,
      time: new Date().toLocaleTimeString(),
    };
    setPositions(p => [...p, newPos]);
    setOrderPlaced(true);
    setTimeout(() => setOrderPlaced(false), 2000);
    setSl(''); setTp('');
  };

  const closePosition = (id) => setPositions(p => p.filter(pos => pos.id !== id));

  const TF_OPTS = [
    { label: '1m', val: '1' }, { label: '5m', val: '5' }, { label: '15m', val: '15' },
    { label: '1h', val: '60' }, { label: '4h', val: '240' }, { label: '1D', val: 'D' },
  ];

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 0px)' }}>

      {/* TOP BAR — account info + market ticker */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 flex-shrink-0 flex-wrap gap-2"
        style={{ background: 'rgba(4,4,6,0.99)' }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono text-emerald-400 font-bold">RF XTRADING</span>
          </div>
          <span className="text-xs font-mono text-muted-foreground hidden sm:block">
            {account?.account_id || 'RF-LIVE'} · {account?.account_type || 'Standard'} · {account?.leverage || '1:100'}
          </span>
        </div>
        <div className="flex items-center gap-5 text-[11px] font-mono">
          <span className="text-muted-foreground">Balance: <span className="text-foreground font-bold">${balance.toLocaleString()}</span></span>
          <span className="text-muted-foreground">Equity: <span className={equity >= balance ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>${equity.toFixed(2)}</span></span>
          <span className="text-muted-foreground">Float: <span className={floatPnl >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>{floatPnl >= 0 ? '+' : ''}${floatPnl.toFixed(2)}</span></span>
          <span className="text-muted-foreground hidden md:block">Free Margin: <span className="text-foreground">${freeMargin.toLocaleString()}</span></span>
        </div>
      </div>

      {/* MARKET BAR */}
      <div className="flex items-center gap-0 px-2 border-b border-white/5 overflow-x-auto flex-shrink-0"
        style={{ background: 'rgba(6,6,9,0.98)' }}>
        {prices.map((inst, idx) => {
          const prev = prevPrices.current[idx];
          const isUp = inst.pct >= 0;
          return (
            <button key={inst.symbol} onClick={() => setSelected(inst)}
              className={`flex items-center gap-3 px-4 py-2 border-r border-white/[0.05] flex-shrink-0 transition-all ${
                selected.symbol === inst.symbol ? 'bg-primary/10' : 'hover:bg-white/[0.03]'
              }`}>
              <div>
                <div className="text-xs font-bold text-foreground">{inst.symbol}</div>
                <div className={`text-[10px] font-mono ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                  <PriceCell value={inst.bid} prev={prev?.bid} digits={inst.digits} />
                </div>
              </div>
              <div className={`text-[10px] font-mono flex items-center gap-0.5 ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                {isUp ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {Math.abs(inst.pct).toFixed(2)}%
              </div>
            </button>
          );
        })}
      </div>

      {/* MAIN AREA */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT PANEL */}
        <div className="w-44 border-r border-white/5 flex flex-col flex-shrink-0" style={{ background: 'rgba(5,5,7,0.98)' }}>
          <div className="flex border-b border-white/5">
            {[
              { id: 'watchlist', icon: List },
              { id: 'positions', icon: Activity },
              { id: 'alerts', icon: Bell },
            ].map(({ id, icon: Icon }) => (
              <button key={id} onClick={() => setLeftTab(id)}
                className={`flex-1 py-2 flex items-center justify-center transition-colors ${leftTab === id ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                <Icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {leftTab === 'watchlist' && prices.map(inst => {
              const isUp = inst.pct >= 0;
              const isActive = selected.symbol === inst.symbol;
              return (
                <button key={inst.symbol} onClick={() => setSelected(inst)}
                  className={`w-full px-3 py-2.5 text-left border-b border-white/[0.04] transition-all ${isActive ? 'bg-primary/10' : 'hover:bg-white/[0.03]'}`}>
                  <div className="flex justify-between mb-0.5">
                    <span className="text-xs font-bold text-foreground">{inst.symbol}</span>
                    <span className={`text-[9px] font-mono ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>{isUp ? '+' : ''}{inst.pct.toFixed(2)}%</span>
                  </div>
                  <div className="text-[11px] font-mono text-muted-foreground">{inst.bid.toFixed(inst.digits)}</div>
                </button>
              );
            })}

            {leftTab === 'positions' && (
              <div className="p-2 space-y-2">
                {positions.length === 0 ? (
                  <div className="text-[11px] font-mono text-muted-foreground px-1 py-4 text-center">No open positions</div>
                ) : positions.map(pos => (
                  <div key={pos.id} className="rounded-lg p-2.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex justify-between mb-1">
                      <span className="text-[10px] font-bold text-foreground">{pos.symbol}</span>
                      <span className={`text-[9px] font-mono font-bold ${pos.type === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}>{pos.type}</span>
                    </div>
                    <div className={`text-xs font-mono font-bold ${pos.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {pos.pnl >= 0 ? '+' : ''}${pos.pnl.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {leftTab === 'alerts' && (
              <div className="px-3 py-4 text-[11px] font-mono text-muted-foreground text-center">No alerts set</div>
            )}
          </div>
        </div>

        {/* CENTER — TradingView chart */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#07070a' }}>
          {/* Chart toolbar */}
          <div className="flex items-center gap-3 px-4 py-2 border-b border-white/[0.05] flex-shrink-0">
            <span className="text-sm font-black text-foreground">{selected.symbol}</span>
            <span className={`text-xs font-mono ${currentInst.pct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {currentInst.bid.toFixed(currentInst.digits)}
              <span className="ml-2">{currentInst.pct >= 0 ? '+' : ''}{currentInst.pct.toFixed(2)}%</span>
            </span>
            <div className="flex items-center gap-0.5 ml-auto">
              {TF_OPTS.map(tf => (
                <button key={tf.val} onClick={() => setTimeframe(tf.val)}
                  className={`px-2.5 py-1 rounded text-[10px] font-mono transition-all ${timeframe === tf.val ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}>
                  {tf.label}
                </button>
              ))}
            </div>
          </div>
          {/* TradingView Widget */}
          <div className="flex-1 overflow-hidden">
            <TradingViewChart symbol={selected.symbol} timeframe={timeframe} />
          </div>
        </div>

        {/* RIGHT — Order Panel */}
        <div className="w-52 border-l border-white/5 flex flex-col flex-shrink-0 overflow-y-auto" style={{ background: 'rgba(5,5,7,0.98)' }}>
          <div className="p-3 border-b border-white/5">
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">New Order</div>

            {/* Buy/Sell */}
            <div className="grid grid-cols-2 gap-1 mb-3">
              {['BUY', 'SELL'].map(side => (
                <button key={side} onClick={() => setOrderSide(side)}
                  className="py-2.5 rounded-lg text-xs font-black transition-all"
                  style={{
                    background: orderSide === side ? (side === 'BUY' ? 'rgba(16,185,129,0.85)' : 'rgba(239,68,68,0.85)') : 'rgba(255,255,255,0.05)',
                    color: orderSide === side ? 'white' : '#555',
                    boxShadow: orderSide === side ? `0 4px 12px ${side === 'BUY' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` : 'none',
                  }}>
                  {side === 'BUY' ? '▲' : '▼'} {side}
                </button>
              ))}
            </div>

            {/* Price display */}
            <div className="grid grid-cols-2 gap-1 mb-3 text-center">
              <div className="rounded-lg p-2" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <div className="text-[9px] font-mono text-emerald-400/70 mb-0.5">ASK</div>
                <div className="text-xs font-mono font-bold text-emerald-400">{currentInst.ask.toFixed(currentInst.digits)}</div>
              </div>
              <div className="rounded-lg p-2" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <div className="text-[9px] font-mono text-red-400/70 mb-0.5">BID</div>
                <div className="text-xs font-mono font-bold text-red-400">{currentInst.bid.toFixed(currentInst.digits)}</div>
              </div>
            </div>

            {/* Order type */}
            <div className="flex gap-1 mb-3">
              {['market', 'limit'].map(t => (
                <button key={t} onClick={() => setOrderType(t)}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-mono capitalize transition-all ${orderType === t ? 'bg-white/10 text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                  {t}
                </button>
              ))}
            </div>

            {/* Inputs */}
            {[
              { label: 'Lot Size', val: lots, set: setLots, hint: '0.01 - 10.00' },
              { label: 'Stop Loss', val: sl, set: setSl, hint: 'Optional' },
              { label: 'Take Profit', val: tp, set: setTp, hint: 'Optional' },
            ].map(({ label, val, set, hint }) => (
              <div key={label} className="mb-2">
                <div className="text-[9px] font-mono text-muted-foreground mb-1 flex justify-between">
                  <span>{label}</span><span className="opacity-50">{hint}</span>
                </div>
                <input value={val} onChange={e => set(e.target.value)}
                  className="w-full rounded-lg px-2.5 py-1.5 text-xs font-mono text-foreground outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
            ))}

            {/* Margin info */}
            <div className="rounded-lg p-2 mb-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex justify-between text-[9px] font-mono text-muted-foreground mb-1">
                <span>Margin Required</span><span className="text-foreground">~${(parseFloat(lots || 0) * 1340).toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-[9px] font-mono text-muted-foreground">
                <span>Est. Risk</span><span className="text-yellow-400">~{(parseFloat(lots || 0) * 0.8).toFixed(1)}%</span>
              </div>
            </div>

            {/* Execute button */}
            <AnimatePresence mode="wait">
              {orderPlaced ? (
                <motion.div key="ok" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                  className="w-full py-2.5 rounded-lg text-xs font-black text-white text-center"
                  style={{ background: 'rgba(16,185,129,0.8)' }}>
                  ✓ Order Placed!
                </motion.div>
              ) : (
                <motion.button key="btn" onClick={placeOrder}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  className="w-full py-2.5 rounded-lg text-xs font-black text-white transition-all"
                  style={{
                    background: orderSide === 'BUY' ? 'linear-gradient(90deg,#10b981,#059669)' : 'linear-gradient(90deg,#ef4444,#dc2626)',
                    boxShadow: orderSide === 'BUY' ? '0 4px 16px rgba(16,185,129,0.3)' : '0 4px 16px rgba(239,68,68,0.3)',
                  }}>
                  {orderSide === 'BUY' ? '▲' : '▼'} {orderSide} {lots} {selected.symbol}
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Account metrics */}
          <div className="p-3 space-y-2">
            <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mb-2">Account Rules</div>
            {[
              { label: 'Daily DD', value: `${account?.daily_drawdown_used || 1.2}%`, limit: '5%', warn: (account?.daily_drawdown_used || 1.2) > 4 },
              { label: 'Max DD', value: `${account?.max_drawdown_used || 2.1}%`, limit: '10%', warn: (account?.max_drawdown_used || 2.1) > 8 },
              { label: 'Profit', value: `${account?.profit_target_progress || 4.28}%`, limit: '10%', warn: false },
              { label: 'Positions', value: positions.length, limit: '∞', warn: false },
            ].map(({ label, value, limit, warn }) => (
              <div key={label} className="flex justify-between text-[10px] font-mono">
                <span className="text-muted-foreground">{label}</span>
                <span className={warn ? 'text-red-400 font-bold' : 'text-foreground'}>{value} <span className="text-muted-foreground/40">/ {limit}</span></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM — Positions & History */}
      <div className="border-t border-white/5 flex-shrink-0" style={{ background: 'rgba(4,4,6,0.99)', height: '200px' }}>
        <div className="flex items-center border-b border-white/5">
          {[
            { id: 'positions', label: `Positions (${positions.length})` },
            { id: 'history', label: 'History' },
            { id: 'account', label: 'Account Log' },
          ].map(t => (
            <button key={t.id} onClick={() => setBottomTab(t.id)}
              className={`px-4 py-2.5 text-[11px] font-mono transition-colors ${bottomTab === t.id ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto" style={{ height: '155px' }}>
          {bottomTab === 'positions' && (
            <table className="w-full text-[10px] font-mono">
              <thead>
                <tr className="text-muted-foreground border-b border-white/[0.04]">
                  {['Symbol', 'Type', 'Lots', 'Entry', 'Current', 'SL', 'TP', 'P&L', 'Time', ''].map(h => (
                    <th key={h} className="px-3 py-1.5 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {positions.length === 0 ? (
                  <tr><td colSpan={10} className="px-3 py-4 text-center text-muted-foreground/50">No open positions</td></tr>
                ) : positions.map(pos => (
                  <tr key={pos.id} className="border-b border-white/[0.03] hover:bg-white/[0.015] transition-colors">
                    <td className="px-3 py-1.5 font-bold text-foreground">{pos.symbol}</td>
                    <td className={`px-3 py-1.5 font-bold ${pos.type === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}>{pos.type}</td>
                    <td className="px-3 py-1.5 text-muted-foreground">{pos.lots}</td>
                    <td className="px-3 py-1.5 text-muted-foreground">{typeof pos.entry === 'number' ? pos.entry.toFixed(2) : pos.entry}</td>
                    <td className="px-3 py-1.5 text-foreground">{typeof pos.current === 'number' ? pos.current.toFixed(2) : pos.current}</td>
                    <td className="px-3 py-1.5 text-red-400/60">{pos.sl || '—'}</td>
                    <td className="px-3 py-1.5 text-emerald-400/60">{pos.tp || '—'}</td>
                    <td className={`px-3 py-1.5 font-bold ${pos.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{pos.pnl >= 0 ? '+' : ''}${pos.pnl.toFixed(2)}</td>
                    <td className="px-3 py-1.5 text-muted-foreground/50">{pos.time}</td>
                    <td className="px-3 py-1.5">
                      <button onClick={() => closePosition(pos.id)} className="p-1 rounded hover:bg-red-500/20 text-red-400 transition-colors"><X className="w-3 h-3" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {bottomTab === 'history' && (
            <table className="w-full text-[10px] font-mono">
              <thead>
                <tr className="text-muted-foreground border-b border-white/[0.04]">
                  {['Symbol', 'Type', 'Lots', 'Entry', 'Close', 'P&L', 'Date'].map(h => (
                    <th key={h} className="px-3 py-1.5 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HISTORY.map(h => (
                  <tr key={h.id} className="border-b border-white/[0.03]">
                    <td className="px-3 py-1.5 font-bold text-foreground">{h.symbol}</td>
                    <td className={`px-3 py-1.5 font-bold ${h.type === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}>{h.type}</td>
                    <td className="px-3 py-1.5 text-muted-foreground">{h.lots}</td>
                    <td className="px-3 py-1.5 text-muted-foreground">{h.entry}</td>
                    <td className="px-3 py-1.5 text-muted-foreground">{h.close}</td>
                    <td className={`px-3 py-1.5 font-bold ${h.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{h.pnl >= 0 ? '+' : ''}${h.pnl}</td>
                    <td className="px-3 py-1.5 text-muted-foreground/50">{h.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {bottomTab === 'account' && (
            <div className="p-3 space-y-1.5">
              {[
                { msg: 'Account connected successfully', time: '09:00:01', type: 'ok' },
                { msg: 'BUY 0.5 BTC/USD @ 65600.00 — Executed', time: '09:14:22', type: 'ok' },
                { msg: 'SELL 2.0 EUR/USD @ 1.08450 — Executed', time: '10:32:05', type: 'ok' },
                { msg: 'BUY 1.0 XAU/USD @ 2350.00 — Executed', time: '11:45:18', type: 'ok' },
              ].map((log, i) => (
                <div key={i} className="flex items-center gap-3 text-[10px] font-mono">
                  <span className="text-muted-foreground/50">{log.time}</span>
                  <span className="text-emerald-400/60">●</span>
                  <span className="text-muted-foreground">{log.msg}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}