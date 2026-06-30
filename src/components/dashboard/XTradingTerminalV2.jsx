import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ChevronUp, ChevronDown, CheckCircle2, AlertTriangle, 
  TrendingUp, TrendingDown, Activity, Settings, Menu, Home,
  BarChart3, ShoppingCart, Clock, Lock, Zap
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

// ─── INSTRUMENT CONFIG ────────────────────────────────────────────────────────
const INSTRUMENTS = [
  { symbol: 'BTC/USD', digits: 2, pipValue: 0.01, contractSize: 1,   wsSymbol: 'btcusdt',  type: 'crypto' },
  { symbol: 'ETH/USD', digits: 2, pipValue: 0.01, contractSize: 1,   wsSymbol: 'ethusdt',  type: 'crypto' },
  { symbol: 'XAU/USD', digits: 2, pipValue: 0.01, contractSize: 100, wsSymbol: null,        type: 'fx' },
  { symbol: 'EUR/USD', digits: 5, pipValue: 10,   contractSize: 100000, wsSymbol: null,     type: 'fx' },
  { symbol: 'GBP/USD', digits: 5, pipValue: 10,   contractSize: 100000, wsSymbol: null,     type: 'fx' },
  { symbol: 'USD/JPY', digits: 3, pipValue: 9,    contractSize: 100000, wsSymbol: null,     type: 'fx' },
  { symbol: 'NAS100',  digits: 2, pipValue: 1,    contractSize: 1,   wsSymbol: null,        type: 'index' },
];

function getAccountRules(account) {
  const isInstant = account?.challenge_type === 'instant';
  return {
    dailyDDLimit: isInstant ? 3 : 5,
    maxDDLimit: isInstant ? 8 : 10,
    profitTarget: isInstant ? 8 : (account?.phase === 'phase2' ? 5 : 10),
    maxLots: 20,
  };
}

function useLivePrices() {
  const [prices, setPrices] = useState(() =>
    INSTRUMENTS.reduce((acc, inst) => {
      acc[inst.symbol] = { bid: null, ask: null, pct: 0 };
      return acc;
    }, {})
  );

  useEffect(() => {
    const cryptoSymbols = INSTRUMENTS.filter(i => i.type === 'crypto').map(i => i.wsSymbol);
    const streams = cryptoSymbols.map(s => `${s}@ticker`).join('/');
    let ws;

    const connectWS = () => {
      ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);
      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        const d = msg.data;
        if (!d || !d.s) return;
        const inst = INSTRUMENTS.find(i => i.wsSymbol === d.s.toLowerCase());
        if (!inst) return;
        const bid = parseFloat(d.b);
        const ask = parseFloat(d.a);
        const pct = parseFloat(d.P);
        setPrices(prev => ({
          ...prev,
          [inst.symbol]: { bid, ask, pct },
        }));
      };
      ws.onclose = () => setTimeout(connectWS, 3000);
    };
    connectWS();

    const FX_SEEDS = {
      'XAU/USD': 2338.15, 'EUR/USD': 1.08215, 'GBP/USD': 1.27048,
      'USD/JPY': 154.780, 'NAS100': 18254.00,
    };

    setPrices(prev => {
      const next = { ...prev };
      Object.entries(FX_SEEDS).forEach(([sym, bid]) => {
        const inst = INSTRUMENTS.find(i => i.symbol === sym);
        next[sym] = {
          bid,
          ask: parseFloat((bid + 0.01).toFixed(inst.digits)),
          pct: (Math.random() - 0.5) * 0.4,
        };
      });
      return next;
    });

    const fxInterval = setInterval(() => {
      setPrices(prev => {
        const next = { ...prev };
        INSTRUMENTS.filter(i => i.type !== 'crypto').forEach(inst => {
          const cur = next[inst.symbol];
          if (!cur || cur.bid === null) return;
          const volatility = inst.type === 'fx' ? cur.bid * 0.000015 : cur.bid * 0.00008;
          const move = (Math.random() - 0.499) * volatility;
          const newBid = parseFloat((cur.bid + move).toFixed(inst.digits));
          const newAsk = parseFloat((newBid + 0.01).toFixed(inst.digits));
          const newPct = parseFloat(((cur.pct || 0) + (Math.random() - 0.5) * 0.01).toFixed(2));
          next[inst.symbol] = { bid: newBid, ask: newAsk, pct: newPct };
        });
        return next;
      });
    }, 800);

    return () => {
      if (ws) ws.close();
      clearInterval(fxInterval);
    };
  }, []);

  return prices;
}

function calcPnl(pos, currentPrice) {
  const inst = INSTRUMENTS.find(i => i.symbol === pos.symbol);
  if (!inst) return 0;
  const priceDiff = pos.type === 'BUY' ? currentPrice - pos.entry : pos.entry - currentPrice;
  let pnl = inst.type === 'crypto' ? priceDiff * pos.lots : priceDiff * pos.lots * inst.contractSize;
  return parseFloat(pnl.toFixed(2));
}

function TradingViewChart({ symbol, timeframe }) {
  const containerRef = useRef(null);
  const tvSymbol = {
    'BTC/USD': 'BITSTAMP:BTCUSD', 'ETH/USD': 'BITSTAMP:ETHUSD',
    'XAU/USD': 'OANDA:XAUUSD', 'EUR/USD': 'OANDA:EURUSD',
    'GBP/USD': 'OANDA:GBPUSD', 'USD/JPY': 'OANDA:USDJPY',
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
      autosize: true, symbol: tvSymbol, interval: timeframe,
      timezone: 'Etc/UTC', theme: 'dark', style: '1', locale: 'en',
      backgroundColor: '#07070a', gridColor: 'rgba(255,255,255,0.04)',
      hide_top_toolbar: false, hide_legend: false, save_image: false,
      calendar: false, hide_volume: false,
      support_host: 'https://www.tradingview.com',
    });
    containerRef.current.appendChild(script);
    return () => { if (containerRef.current) containerRef.current.innerHTML = ''; };
  }, [tvSymbol, timeframe]);

  return <div ref={containerRef} className="h-full w-full" />;
}

// ─── NO ACCOUNT GATE ─────────────────────────────────────────────────────────
function NoAccountGate() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center h-full p-8 text-center" 
      style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #15101a 100%)' }}>
      <motion.div 
        animate={{ y: [0, -10, 0] }} 
        transition={{ duration: 3, repeat: Infinity }}
        className="w-20 h-20 rounded-3xl mb-6 flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, rgba(255,92,0,0.1), rgba(204,255,0,0.05))' }}>
        <Lock className="w-10 h-10 text-orange-500/40" />
      </motion.div>
      <h2 className="text-2xl font-black text-white mb-3">Terminal Locked</h2>
      <p className="text-sm text-slate-400 mb-6">Active challenge account required to trade</p>
      <div className="text-xs font-mono text-slate-500 space-y-1">
        <p>✓ Real-time live prices</p>
        <p>✓ Market & pending orders</p>
        <p>✓ Full risk management</p>
      </div>
    </motion.div>
  );
}

// ─── MODERN DESKTOP LAYOUT ────────────────────────────────────────────────────
export default function XTradingTerminalV2({ account }) {
  const isActive = !!(account && ['active', 'funded', 'passed'].includes(account?.status));
  const prices = useLivePrices();
  const rules = getAccountRules(account);
  const accountSize = account?.account_size || 100000;

  const [selectedSymbol, setSelectedSymbol] = useState('EUR/USD');
  const [timeframe, setTimeframe] = useState('60');
  const [orderSide, setOrderSide] = useState('BUY');
  const [lots, setLots] = useState('0.10');
  const [positions, setPositions] = useState([]);
  const [closedTrades, setClosedTrades] = useState([]);
  const [sessionBalance, setSessionBalance] = useState(account?.balance || accountSize);
  const [mobileTab, setMobileTab] = useState('chart');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const floatPnl = positions.reduce((sum, pos) => {
    const p = prices[pos.symbol];
    if (!p?.bid) return sum;
    const currentPrice = pos.type === 'BUY' ? p.bid : p.ask;
    return sum + calcPnl(pos, currentPrice);
  }, 0);

  const equity = sessionBalance + floatPnl;
  const dailyDD = ((sessionBalance - equity) / accountSize) * 100;
  const maxDD = ((accountSize - equity) / accountSize) * 100;
  const accountBlocked = maxDD >= rules.maxDDLimit || dailyDD >= rules.dailyDDLimit;

  const currentPrice = prices[selectedSymbol];
  const selected = INSTRUMENTS.find(i => i.symbol === selectedSymbol);

  if (!isActive) return <NoAccountGate />;

  const TF_OPTS = [
    { label: '1m', val: '1' }, { label: '5m', val: '5' }, { label: '15m', val: '15' },
    { label: '1h', val: '60' }, { label: '4h', val: '240' }, { label: '1D', val: 'D' },
  ];

  const closeTrade = (pos) => {
    const p = prices[pos.symbol];
    const closePrice = pos.type === 'BUY' ? p.bid : p.ask;
    const pnl = calcPnl(pos, closePrice);
    const newBalance = parseFloat((sessionBalance + pnl).toFixed(2));
    setSessionBalance(newBalance);
    setClosedTrades(prev => [{ ...pos, close: closePrice, pnl, closeTime: new Date().toLocaleTimeString() }, ...prev.slice(0, 99)]);
    setPositions(prev => prev.filter(p => p.id !== pos.id));
  };

  const placeOrder = () => {
    if (accountBlocked) return;
    const p = prices[selectedSymbol];
    if (!p?.bid) return;
    const lotsNum = parseFloat(lots) || 0.01;
    const entryPrice = orderSide === 'BUY' ? p.ask : p.bid;
    const newPos = {
      id: Date.now() + Math.random(),
      symbol: selectedSymbol,
      type: orderSide,
      lots: lotsNum,
      entry: entryPrice,
      time: new Date().toLocaleTimeString(),
    };
    setPositions(prev => [...prev, newPos]);
  };

  return (
    <div className="flex flex-col h-screen" style={{ background: '#0a0a0f' }}>
      {/* ─── HEADER BAR ───── */}
      <motion.div 
        initial={{ y: -60 }}
        animate={{ y: 0 }}
        className="flex items-center justify-between px-4 md:px-6 py-3 border-b flex-shrink-0"
        style={{ borderColor: 'rgba(255,92,0,0.15)', background: 'rgba(5,5,8,0.98)' }}>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 hover:bg-white/5 rounded-lg transition"
          >
            <Menu className="w-5 h-5 text-white" />
          </button>
          <div>
            <div className="text-xs font-mono text-slate-500 uppercase">Account</div>
            <div className="text-sm font-black text-white">{account?.account_id || 'DEMO'}</div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6 text-xs font-mono">
          <div className="text-center">
            <div className="text-slate-500">Balance</div>
            <div className="font-bold text-white">${sessionBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <div className="text-center">
            <div className="text-slate-500">Equity</div>
            <div className={`font-bold ${equity >= sessionBalance ? 'text-emerald-400' : 'text-red-400'}`}>${equity.toFixed(2)}</div>
          </div>
          <div className="text-center">
            <div className="text-slate-500">Float P&L</div>
            <div className={`font-bold ${floatPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{floatPnl >= 0 ? '+' : ''}${floatPnl.toFixed(2)}</div>
          </div>
        </div>

        <button className="p-2 hover:bg-white/5 rounded-lg transition">
          <Settings className="w-5 h-5 text-slate-400" />
        </button>
      </motion.div>

      {/* ─── MAIN CONTENT ───── */}
      <div className="flex flex-1 overflow-hidden gap-0">
        {/* ─── LEFT SIDEBAR ───── */}
        <AnimatePresence>
          {(sidebarOpen || window.innerWidth >= 768) && (
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="w-72 border-r flex flex-col flex-shrink-0 hidden md:flex overflow-hidden"
              style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(5,5,7,0.98)' }}
            >
              {/* Market Watch */}
              <div className="p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                <h3 className="text-xs font-bold text-white uppercase mb-3 tracking-wider">Market Watch</h3>
                <div className="space-y-2">
                  {INSTRUMENTS.map(inst => {
                    const p = prices[inst.symbol];
                    const isUp = (p?.pct || 0) >= 0;
                    const isSelected = selectedSymbol === inst.symbol;
                    return (
                      <motion.button
                        key={inst.symbol}
                        onClick={() => setSelectedSymbol(inst.symbol)}
                        whileHover={{ scale: 1.02 }}
                        className="w-full p-3 rounded-xl transition-all text-left"
                        style={{
                          background: isSelected ? 'rgba(255,92,0,0.15)' : 'rgba(255,255,255,0.03)',
                          border: isSelected ? '1px solid rgba(255,92,0,0.4)' : '1px solid rgba(255,255,255,0.05)',
                        }}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-bold text-white">{inst.symbol}</span>
                          <span className={`text-[10px] font-mono font-bold ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isUp ? '+' : ''}{(p?.pct || 0).toFixed(2)}%
                          </span>
                        </div>
                        <div className="text-sm font-mono font-bold text-white">
                          {p?.bid ? p.bid.toFixed(inst.digits) : '-'}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Open Positions */}
              <div className="p-4 border-b flex-1 overflow-y-auto" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                <h3 className="text-xs font-bold text-white uppercase mb-3 tracking-wider">Positions ({positions.length})</h3>
                {positions.length === 0 ? (
                  <div className="text-xs text-slate-500 text-center py-8">No open positions</div>
                ) : (
                  <div className="space-y-2">
                    {positions.map(pos => {
                      const p = prices[pos.symbol];
                      const livePrice = p ? (pos.type === 'BUY' ? p.bid : p.ask) : pos.entry;
                      const livePnl = calcPnl(pos, livePrice);
                      return (
                        <motion.div
                          key={pos.id}
                          layout
                          className="p-3 rounded-lg"
                          style={{ background: 'rgba(255,255,255,0.04)' }}
                        >
                          <div className="flex justify-between mb-2">
                            <span className="text-xs font-bold text-white">{pos.symbol}</span>
                            <span className={`text-[10px] font-bold ${pos.type === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}>
                              {pos.type}
                            </span>
                          </div>
                          <div className={`text-sm font-bold ${livePnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {livePnl >= 0 ? '+' : ''}${livePnl.toFixed(2)}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1">{pos.lots} lots @ {pos.entry.toFixed(2)}</div>
                          <button
                            onClick={() => closeTrade(pos)}
                            className="mt-2 w-full py-1.5 rounded-lg text-xs font-bold bg-red-500/20 text-red-400 hover:bg-red-500/30 transition"
                          >
                            Close
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── CENTER CHART ───── */}
        <motion.div className="flex-1 flex flex-col overflow-hidden">
          {/* Chart Header */}
          <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            <div>
              <h2 className="text-lg md:text-xl font-black text-white">{selectedSymbol}</h2>
              {currentPrice?.bid && (
                <p className="text-xs text-slate-500 mt-0.5">
                  {currentPrice.bid.toFixed(selected?.digits)} 
                  <span className={`ml-2 ${(currentPrice.pct || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {(currentPrice.pct || 0) >= 0 ? '+' : ''}{(currentPrice.pct || 0).toFixed(2)}%
                  </span>
                </p>
              )}
            </div>

            {/* Timeframe selector */}
            <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
              {TF_OPTS.map(tf => (
                <motion.button
                  key={tf.val}
                  onClick={() => setTimeframe(tf.val)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    timeframe === tf.val 
                      ? 'text-orange-400' 
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                  style={timeframe === tf.val ? { background: 'rgba(255,92,0,0.2)' } : {}}
                >
                  {tf.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="flex-1 overflow-hidden">
            <TradingViewChart symbol={selectedSymbol} timeframe={timeframe} />
          </div>
        </motion.div>

        {/* ─── RIGHT ORDER PANEL ───── */}
        <motion.div
          initial={{ x: 400 }}
          animate={{ x: 0 }}
          className="w-80 border-l flex flex-col flex-shrink-0 overflow-y-auto hidden md:flex"
          style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(5,5,7,0.98)' }}
        >
          <div className="p-6">
            <h3 className="text-sm font-black text-white uppercase mb-6 tracking-wider">
              Place Order
            </h3>

            {/* Price Display */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { label: 'ASK', value: currentPrice?.ask, color: 'emerald' },
                { label: 'BID', value: currentPrice?.bid, color: 'red' },
              ].map(item => (
                <motion.div
                  key={item.label}
                  whileHover={{ scale: 1.02 }}
                  className="p-4 rounded-xl text-center"
                  style={{
                    background: `rgba(${item.color === 'emerald' ? '16,185,129' : '239,68,68'},0.1)`,
                    border: `1px solid rgba(${item.color === 'emerald' ? '16,185,129' : '239,68,68'},0.3)`,
                  }}
                >
                  <div className="text-xs font-mono mb-1" style={{ color: item.color === 'emerald' ? '#10b981' : '#ef4444' }}>
                    {item.label}
                  </div>
                  <div className="text-lg font-bold text-white">
                    {item.value ? item.value.toFixed(selected?.digits) : '-'}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* BUY/SELL Toggle */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              {['BUY', 'SELL'].map(side => (
                <motion.button
                  key={side}
                  onClick={() => setOrderSide(side)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="py-3 rounded-xl font-bold text-sm transition-all"
                  style={{
                    background: orderSide === side 
                      ? (side === 'BUY' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)')
                      : 'rgba(255,255,255,0.05)',
                    color: orderSide === side ? 'white' : '#999',
                    boxShadow: orderSide === side 
                      ? `0 8px 24px ${side === 'BUY' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`
                      : 'none',
                  }}
                >
                  {side === 'BUY' ? '▲' : '▼'} {side}
                </motion.button>
              ))}
            </div>

            {/* Lot Size */}
            <div className="mb-6">
              <label className="text-xs font-bold text-slate-400 mb-2 block">Lot Size</label>
              <input
                value={lots}
                onChange={e => setLots(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-white font-mono text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>

            {/* Execute Button */}
            <motion.button
              onClick={placeOrder}
              disabled={accountBlocked}
              whileHover={!accountBlocked ? { scale: 1.02 } : {}}
              whileTap={!accountBlocked ? { scale: 0.95 } : {}}
              className="w-full py-4 rounded-xl font-black text-white transition-all disabled:opacity-50"
              style={{
                background: accountBlocked
                  ? '#222'
                  : (orderSide === 'BUY' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)'),
                boxShadow: accountBlocked
                  ? 'none'
                  : (orderSide === 'BUY' ? '0 12px 32px rgba(16,185,129,0.4)' : '0 12px 32px rgba(239,68,68,0.4)'),
              }}
            >
              {accountBlocked ? '🔒 Trading Suspended' : `${orderSide} ${lots} ${selectedSymbol}`}
            </motion.button>

            {accountBlocked && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 rounded-xl text-xs"
                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}
              >
                <p className="text-red-400 font-bold">Drawdown Limit Reached</p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ─── MOBILE BOTTOM TABS ───── */}
      <motion.div
        initial={{ y: 60 }}
        animate={{ y: 0 }}
        className="md:hidden flex border-t flex-shrink-0"
        style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(5,5,8,0.98)' }}
      >
        {[
          { id: 'chart', icon: BarChart3, label: 'Chart' },
          { id: 'watch', icon: Activity, label: 'Watch' },
          { id: 'positions', icon: TrendingUp, label: `Trades (${positions.length})` },
          { id: 'order', icon: ShoppingCart, label: 'Order' },
        ].map(tab => (
          <motion.button
            key={tab.id}
            onClick={() => setMobileTab(tab.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex-1 py-3 flex flex-col items-center gap-1 transition-colors ${
              mobileTab === tab.id ? 'text-orange-400' : 'text-slate-500'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span className="text-[10px] font-bold">{tab.label}</span>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}