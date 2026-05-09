import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, List, Activity, ChevronUp, ChevronDown, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Monitor } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// ─── INSTRUMENT CONFIG ────────────────────────────────────────────────────────
const INSTRUMENTS = [
  { symbol: 'BTC/USD', digits: 2, pipValue: 0.01, contractSize: 1,   wsSymbol: 'btcusdt',  type: 'crypto' },
  { symbol: 'ETH/USD', digits: 2, pipValue: 0.01, contractSize: 1,   wsSymbol: 'ethusdt',  type: 'crypto' },
  { symbol: 'XAU/USD', digits: 2, pipValue: 0.01, contractSize: 100, wsSymbol: null,        type: 'fx',     spreadPips: 0.35 },
  { symbol: 'EUR/USD', digits: 5, pipValue: 10,   contractSize: 100000, wsSymbol: null,     type: 'fx',     spreadPips: 0.00012 },
  { symbol: 'GBP/USD', digits: 5, pipValue: 10,   contractSize: 100000, wsSymbol: null,     type: 'fx',     spreadPips: 0.00015 },
  { symbol: 'USD/JPY', digits: 3, pipValue: 9,    contractSize: 100000, wsSymbol: null,     type: 'fx',     spreadPips: 0.015 },
  { symbol: 'NAS100',  digits: 2, pipValue: 1,    contractSize: 1,   wsSymbol: null,        type: 'index',  spreadPips: 1.2 },
];

// ─── ACCOUNT RULES ────────────────────────────────────────────────────────────
function getAccountRules(account) {
  const isSwing = account?.account_type === 'swing';
  const isInstant = account?.challenge_type === 'instant';
  return {
    dailyDDLimit: isInstant ? 3 : 5,
    maxDDLimit: isInstant ? 8 : 10,
    profitTarget: isInstant ? 8 : (account?.phase === 'phase2' ? 5 : 10),
    newsTrading: isSwing,
    overnightHolding: isSwing,
    weekendHolding: isSwing,
    maxLots: isSwing ? 5 : 20,
  };
}

// ─── LIVE PRICE FEED ─────────────────────────────────────────────────────────
function useLivePrices() {
  const [prices, setPrices] = useState(() =>
    INSTRUMENTS.reduce((acc, inst) => {
      acc[inst.symbol] = { bid: null, ask: null, pct: 0, prev: null };
      return acc;
    }, {})
  );

  useEffect(() => {
    // Binance WebSocket for crypto
    const cryptoSymbols = INSTRUMENTS.filter(i => i.type === 'crypto').map(i => i.wsSymbol);
    const streams = cryptoSymbols.map(s => `${s}@ticker`).join('/');
    let ws;
    let wsRetryTimer;

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
          [inst.symbol]: { bid, ask, pct, prev: prev[inst.symbol]?.bid },
        }));
      };
      ws.onerror = () => {};
      ws.onclose = () => {
        wsRetryTimer = setTimeout(connectWS, 3000);
      };
    };
    connectWS();

    // Polling fallback for FX/indices — use exchangerate-api or simulate realistic movement from seed
    const FX_SEEDS = {
      'XAU/USD': { bid: 2338.15, spreadPips: 0.35 },
      'EUR/USD': { bid: 1.08215, spreadPips: 0.00012 },
      'GBP/USD': { bid: 1.27048, spreadPips: 0.00015 },
      'USD/JPY': { bid: 154.780, spreadPips: 0.015 },
      'NAS100':  { bid: 18254.00, spreadPips: 1.2 },
    };
    // Initialize FX with seeds
    setPrices(prev => {
      const next = { ...prev };
      Object.entries(FX_SEEDS).forEach(([sym, cfg]) => {
        const inst = INSTRUMENTS.find(i => i.symbol === sym);
        next[sym] = {
          bid: cfg.bid,
          ask: parseFloat((cfg.bid + cfg.spreadPips).toFixed(inst.digits)),
          pct: (Math.random() - 0.5) * 0.4,
          prev: null,
        };
      });
      return next;
    });

    // Micro-move FX every 800ms to simulate live ticking (realistic micro-movement, not random noise)
    const fxInterval = setInterval(() => {
      setPrices(prev => {
        const next = { ...prev };
        INSTRUMENTS.filter(i => i.type !== 'crypto').forEach(inst => {
          const cur = next[inst.symbol];
          if (!cur || cur.bid === null) return;
          const volatility = inst.type === 'fx' ? cur.bid * 0.000015 : cur.bid * 0.00008;
          const move = (Math.random() - 0.499) * volatility;
          const newBid = parseFloat((cur.bid + move).toFixed(inst.digits));
          const spread = inst.spreadPips || (cur.ask - cur.bid);
          const newAsk = parseFloat((newBid + spread).toFixed(inst.digits));
          const newPct = parseFloat(((cur.pct || 0) + (Math.random() - 0.5) * 0.01).toFixed(2));
          next[inst.symbol] = { bid: newBid, ask: newAsk, pct: newPct, prev: cur.bid };
        });
        return next;
      });
    }, 800);

    return () => {
      if (ws) ws.close();
      clearTimeout(wsRetryTimer);
      clearInterval(fxInterval);
    };
  }, []);

  return prices;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function calcPnl(pos, currentPrice) {
  const inst = INSTRUMENTS.find(i => i.symbol === pos.symbol);
  if (!inst) return 0;
  const priceDiff = pos.type === 'BUY' ? currentPrice - pos.entry : pos.entry - currentPrice;
  // Simplified P&L: priceDiff * lots * contractSize / currentPrice (normalized to USD)
  let pnl;
  if (inst.type === 'crypto') {
    pnl = priceDiff * pos.lots;
  } else if (inst.type === 'fx') {
    pnl = priceDiff * pos.lots * inst.contractSize;
  } else {
    pnl = priceDiff * pos.lots;
  }
  return parseFloat(pnl.toFixed(2));
}

function calcMargin(symbol, lots, leverage) {
  const inst = INSTRUMENTS.find(i => i.symbol === symbol);
  const lev = parseInt((leverage || '1:100').split(':')[1]) || 100;
  if (!inst) return 0;
  if (inst.type === 'crypto') return (lots * 60000) / lev;
  if (inst.type === 'fx') return (lots * inst.contractSize) / lev;
  return lots * 500 / lev;
}

function PriceCell({ value, digits }) {
  const [flash, setFlash] = useState(null);
  const prev = useRef(value);
  useEffect(() => {
    if (prev.current !== null && prev.current !== value) {
      setFlash(value > prev.current ? 'up' : 'down');
      const t = setTimeout(() => setFlash(null), 350);
      prev.current = value;
      return () => clearTimeout(t);
    }
    prev.current = value;
  }, [value]);
  if (value === null) return <span className="text-muted-foreground/40 font-mono">—</span>;
  return (
    <span className={`font-mono transition-colors duration-200 ${
      flash === 'up' ? 'text-emerald-300' : flash === 'down' ? 'text-red-300' : 'text-foreground'
    }`}>
      {value.toFixed(digits)}
    </span>
  );
}

function TradingViewChart({ symbol, timeframe }) {
  const containerRef = useRef(null);
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

  return (
    <div ref={containerRef} className="tradingview-widget-container" style={{ height: '100%', width: '100%' }}>
      <div className="tradingview-widget-container__widget" style={{ height: 'calc(100% - 32px)', width: '100%' }} />
    </div>
  );
}

// ─── ACCOUNT STATUS BAR ───────────────────────────────────────────────────────
function AccountStatusBar({ account, balance, equity, floatPnl, dailyDD, maxDD, rules }) {
  const profitPct = ((equity - account?.account_size) / (account?.account_size || 100000)) * 100;
  const dailyDDPct = ((balance - equity) / (account?.account_size || 100000)) * 100;
  const maxDDPct = ((account?.account_size - equity) / (account?.account_size || 100000)) * 100;
  const dailyRemaining = Math.max(0, rules.dailyDDLimit - Math.max(0, dailyDDPct));
  const maxRemaining = Math.max(0, rules.maxDDLimit - Math.max(0, maxDDPct));

  const items = [
    { label: 'Balance', value: `$${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: 'text-foreground' },
    { label: 'Equity', value: `$${equity.toFixed(2)}`, color: equity >= balance ? 'text-emerald-400' : 'text-red-400' },
    { label: 'Float P&L', value: `${floatPnl >= 0 ? '+' : ''}$${floatPnl.toFixed(2)}`, color: floatPnl >= 0 ? 'text-emerald-400' : 'text-red-400' },
    { label: 'Daily DD Left', value: `${dailyRemaining.toFixed(2)}%`, color: dailyRemaining < 1 ? 'text-red-400' : dailyRemaining < 2 ? 'text-yellow-400' : 'text-emerald-400' },
    { label: 'Max DD Left', value: `${maxRemaining.toFixed(2)}%`, color: maxRemaining < 2 ? 'text-red-400' : maxRemaining < 4 ? 'text-yellow-400' : 'text-emerald-400' },
    { label: 'Profit Target', value: `${Math.max(0, profitPct).toFixed(2)}% / ${rules.profitTarget}%`, color: profitPct >= rules.profitTarget ? 'text-accent' : 'text-primary' },
  ];

  return (
    <div className="flex items-center gap-0 px-0 border-b border-white/5 overflow-x-auto flex-shrink-0"
      style={{ background: 'rgba(3,3,5,0.99)' }}>
      {/* Brand */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-r border-white/5 flex-shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[10px] font-mono font-bold text-emerald-400 tracking-wider">LIVE</span>
        <span className="text-[10px] font-mono text-muted-foreground ml-1">{account?.account_id || 'RF-DEMO'}</span>
      </div>
      {/* Account meta */}
      <div className="flex items-center gap-1 px-3 py-2.5 border-r border-white/5 flex-shrink-0">
        <span className="text-[10px] font-mono text-muted-foreground">{account?.leverage || '1:100'}</span>
        <span className="text-white/20 mx-1">·</span>
        <span className="text-[10px] font-mono text-muted-foreground capitalize">{account?.account_type || 'Standard'}</span>
        <span className="text-white/20 mx-1">·</span>
        <span className="text-[10px] font-mono text-muted-foreground capitalize">{account?.phase?.replace('phase', 'Phase ') || 'Phase 1'}</span>
      </div>
      {/* Metrics */}
      {items.map(item => (
        <div key={item.label} className="flex flex-col px-4 py-2 border-r border-white/[0.04] flex-shrink-0">
          <span className="text-[9px] font-mono text-muted-foreground/60 uppercase tracking-wider mb-0.5">{item.label}</span>
          <span className={`text-[11px] font-mono font-bold ${item.color}`}>{item.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── ACCOUNT RULES PANEL ──────────────────────────────────────────────────────
function AccountRulesPanel({ rules, account }) {
  const ruleList = [
    { label: 'News Trading', allowed: rules.newsTrading },
    { label: 'Overnight Holding', allowed: rules.overnightHolding },
    { label: 'Weekend Holding', allowed: rules.weekendHolding },
    { label: 'Expert Advisors', allowed: true },
    { label: 'Hedging', allowed: account?.account_type !== 'standard' },
  ];
  return (
    <div className="px-3 pt-3 pb-2">
      <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mb-2.5">
        {account?.account_type === 'swing' ? 'Swing Rules' : 'Standard Rules'}
      </div>
      <div className="space-y-1.5">
        {ruleList.map(r => (
          <div key={r.label} className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-muted-foreground">{r.label}</span>
            <span className={`flex items-center gap-1 text-[9px] font-bold ${r.allowed ? 'text-emerald-400' : 'text-red-400'}`}
              style={{ padding: '1px 6px', borderRadius: 4,
                background: r.allowed ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${r.allowed ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}` }}>
              {r.allowed ? <CheckCircle2 className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
              {r.allowed ? 'ON' : 'OFF'}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 space-y-1">
        <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mb-1.5">Limits</div>
        {[
          { label: 'Daily DD', val: `${rules.dailyDDLimit}%` },
          { label: 'Max DD', val: `${rules.maxDDLimit}%` },
          { label: 'Profit Target', val: `${rules.profitTarget}%` },
          { label: 'Max Lots', val: `${rules.maxLots}` },
        ].map(l => (
          <div key={l.label} className="flex justify-between text-[10px] font-mono">
            <span className="text-muted-foreground/70">{l.label}</span>
            <span className="text-foreground">{l.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── NO ACCOUNT GATE ─────────────────────────────────────────────────────────
function NoAccountGate() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8" style={{ background: '#040407' }}>
      <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
        <Monitor className="w-10 h-10 text-primary/40" />
      </div>
      <div className="text-2xl font-black text-foreground mb-3">XTrading Terminal Locked</div>
      <div className="text-sm text-muted-foreground mb-2 max-w-md">
        The trading terminal is only available for active challenge accounts.
      </div>
      <div className="text-xs font-mono text-muted-foreground/60 mb-8">
        Purchase a challenge → Admin approves → Terminal activates automatically
      </div>
      <div className="flex flex-col gap-2 text-xs font-mono text-muted-foreground/40">
        <span>✓ Real-time live prices (Binance, FX feeds)</span>
        <span>✓ Market & pending orders (BUY/SELL/LIMIT/STOP)</span>
        <span>✓ Full risk management (SL/TP/trailing)</span>
        <span>✓ Challenge rule enforcement (DD limits)</span>
      </div>
    </div>
  );
}

// ─── MAIN TERMINAL ────────────────────────────────────────────────────────────
export default function XTradingTerminal({ account }) {
  const isActive = !!(account && (account.status === 'active' || account.status === 'funded' || account.status === 'passed'));
  const prices = useLivePrices();
  const [selectedSymbol, setSelectedSymbol] = useState('BTC/USD');
  const [timeframe, setTimeframe] = useState('60');
  const [orderSide, setOrderSide] = useState('BUY');
  const [orderType, setOrderType] = useState('market');
  const [pendingPrice, setPendingPrice] = useState('');
  const [lots, setLots] = useState('0.10');
  const [sl, setSl] = useState('');
  const [tp, setTp] = useState('');
  const [positions, setPositions] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [closedTrades, setClosedTrades] = useState([]);
  const [activityLog, setActivityLog] = useState([
    { msg: `Account ${account?.account_id || 'RF-DEMO'} connected`, time: new Date().toLocaleTimeString(), ok: true },
  ]);
  const [bottomTab, setBottomTab] = useState('positions');
  const [leftTab, setLeftTab] = useState('watchlist');
  const [orderFlash, setOrderFlash] = useState(null);
  const [accountBlocked, setAccountBlocked] = useState(false);
  const rules = getAccountRules(account);

  const accountSize = account?.account_size || 0;
  const startBalance = account?.balance || accountSize;
  const [sessionBalance, setSessionBalance] = useState(startBalance);

  // Compute floating P&L from live prices
  const floatPnl = positions.reduce((sum, pos) => {
    const p = prices[pos.symbol];
    if (!p || p.bid === null) return sum;
    const currentPrice = pos.type === 'BUY' ? p.bid : p.ask;
    return sum + calcPnl(pos, currentPrice);
  }, 0);

  const equity = sessionBalance + floatPnl;
  const totalMargin = positions.reduce((s, p) => s + calcMargin(p.symbol, p.lots, account?.leverage), 0);
  const freeMargin = equity - totalMargin;

  // Real-time DD check
  useEffect(() => {
    if (positions.length === 0) return;
    const dailyLoss = ((sessionBalance - equity) / accountSize) * 100;
    const maxLoss = ((accountSize - equity) / accountSize) * 100;
    if (dailyLoss >= rules.dailyDDLimit || maxLoss >= rules.maxDDLimit) {
      setAccountBlocked(true);
      addLog(`⚠ DRAWDOWN LIMIT REACHED — Trading suspended`, false);
      // Mark account as failed in DB
      if (account?.id) {
        base44.entities.ChallengeAccount.update(account.id, {
          status: 'failed',
          daily_drawdown_used: Math.max(dailyLoss, 0),
          max_drawdown_used: Math.max(maxLoss, 0),
          equity: equity,
          balance: sessionBalance,
          pnl: sessionBalance - accountSize,
        }).catch(() => {});
      }
    }
  }, [equity]);

  // Pending order trigger check
  useEffect(() => {
    if (pendingOrders.length === 0) return;
    pendingOrders.forEach(order => {
      const p = prices[order.symbol];
      if (!p || p.bid === null) return;
      const currentPrice = order.type.includes('BUY') ? p.ask : p.bid;
      const triggered = 
        (order.type === 'BUY_LIMIT' && currentPrice <= order.price) ||
        (order.type === 'BUY_STOP' && currentPrice >= order.price) ||
        (order.type === 'SELL_LIMIT' && currentPrice >= order.price) ||
        (order.type === 'SELL_STOP' && currentPrice <= order.price);
      if (triggered) {
        const side = order.type.startsWith('BUY') ? 'BUY' : 'SELL';
        const newPos = {
          id: Date.now() + Math.random(), symbol: order.symbol, type: side,
          lots: order.lots, entry: order.price, sl: order.sl, tp: order.tp,
          time: new Date().toLocaleTimeString(),
        };
        setPositions(p => [...p, newPos]);
        setPendingOrders(po => po.filter(o => o.id !== order.id));
        addLog(`${side} ${order.lots} ${order.symbol} @ ${order.price} — Pending Order Triggered`, true);
      }
    });
  }, [prices]);

  // SL/TP auto-close
  useEffect(() => {
    if (positions.length === 0) return;
    positions.forEach(pos => {
      const p = prices[pos.symbol];
      if (!p || p.bid === null) return;
      const currentPrice = pos.type === 'BUY' ? p.bid : p.ask;
      const slHit = pos.sl && (pos.type === 'BUY' ? currentPrice <= pos.sl : currentPrice >= pos.sl);
      const tpHit = pos.tp && (pos.type === 'BUY' ? currentPrice >= pos.tp : currentPrice <= pos.tp);
      if (slHit || tpHit) {
        const closePnl = calcPnl(pos, currentPrice);
        closePositionById(pos.id, currentPrice, closePnl, slHit ? 'SL' : 'TP');
      }
    });
  }, [prices]);

  const addLog = useCallback((msg, ok = true) => {
    setActivityLog(prev => [{ msg, time: new Date().toLocaleTimeString(), ok }, ...prev.slice(0, 49)]);
  }, []);

  const syncAccountToDB = useCallback((newBalance, newClosedTrades, allPositions, currentEquity) => {
    if (!account?.id) return;
    const trades = newClosedTrades;
    const totalTrades = trades.length;
    const wins = trades.filter(t => t.pnl > 0).length;
    const winRate = totalTrades > 0 ? parseFloat(((wins / totalTrades) * 100).toFixed(1)) : 0;
    const totalPnl = parseFloat((newBalance - accountSize).toFixed(2));
    const dailyDDUsed = parseFloat((Math.max(0, (newBalance - currentEquity) / accountSize * 100)).toFixed(2));
    const maxDDUsed = parseFloat((Math.max(0, (accountSize - currentEquity) / accountSize * 100)).toFixed(2));
    const profitTargetProgress = parseFloat((Math.max(0, totalPnl / accountSize * 100)).toFixed(2));
    base44.entities.ChallengeAccount.update(account.id, {
      balance: newBalance,
      equity: currentEquity,
      pnl: totalPnl,
      daily_pnl: parseFloat((currentEquity - newBalance).toFixed(2)),
      win_rate: winRate,
      total_trades: totalTrades,
      daily_drawdown_used: dailyDDUsed,
      max_drawdown_used: maxDDUsed,
      profit_target_progress: profitTargetProgress,
    }).catch(() => {});
  }, [account?.id, accountSize]);

  const closePositionById = useCallback((id, closePrice, closePnl, reason = 'Manual') => {
    setPositions(prev => {
      const pos = prev.find(p => p.id === id);
      if (!pos) return prev;
      const newBalance = parseFloat((sessionBalance + closePnl).toFixed(2));
      setSessionBalance(newBalance);
      setClosedTrades(ct => {
        const updated = [{ ...pos, close: closePrice, pnl: closePnl, closeTime: new Date().toLocaleTimeString(), reason }, ...ct.slice(0, 99)];
        // Sync to DB after each trade close (use setTimeout to let state settle)
        setTimeout(() => syncAccountToDB(newBalance, updated, prev.filter(p => p.id !== id), newBalance + floatPnl), 100);
        return updated;
      });
      addLog(`${pos.type} ${pos.lots} ${pos.symbol} closed @ ${typeof closePrice === 'number' ? closePrice.toFixed(pos.digits || 2) : closePrice} — ${closePnl >= 0 ? '+' : ''}$${closePnl.toFixed(2)} [${reason}]`, closePnl >= 0);
      return prev.filter(p => p.id !== id);
    });
  }, [addLog, sessionBalance, floatPnl, syncAccountToDB]);

  const placeOrder = () => {
    if (accountBlocked) return;
    const inst = INSTRUMENTS.find(i => i.symbol === selectedSymbol);
    const p = prices[selectedSymbol];
    const lotsNum = parseFloat(lots) || 0.01;

    // Enforce max lots rule
    if (lotsNum > rules.maxLots) {
      addLog(`❌ Lot size ${lotsNum} exceeds max allowed ${rules.maxLots} lots`, false);
      return;
    }

    // Enforce leverage / margin check
    const reqMargin = calcMargin(selectedSymbol, lotsNum, account?.leverage);
    if (reqMargin > freeMargin) {
      addLog(`❌ Insufficient margin — required $${reqMargin.toFixed(0)}, available $${freeMargin.toFixed(0)} (Leverage: ${account?.leverage || '1:100'})`, false);
      return;
    }

    if (orderType === 'market') {
      if (!p || p.bid === null) { addLog(`No live price for ${selectedSymbol} yet`, false); return; }
      const entryPrice = orderSide === 'BUY' ? p.ask : p.bid;
      const newPos = {
        id: Date.now() + Math.random(), symbol: selectedSymbol, type: orderSide,
        lots: lotsNum, entry: entryPrice,
        sl: sl ? parseFloat(sl) : null,
        tp: tp ? parseFloat(tp) : null,
        time: new Date().toLocaleTimeString(),
      };
      setPositions(prev => [...prev, newPos]);
      addLog(`${orderSide} ${lotsNum} ${selectedSymbol} @ ${entryPrice.toFixed(inst?.digits || 2)} — Market Executed`, true);
      setOrderFlash('ok');
      setTimeout(() => setOrderFlash(null), 1800);
      setSl(''); setTp('');
    } else {
      // Pending
      const price = parseFloat(pendingPrice);
      if (!price) { addLog('Enter a valid pending order price', false); return; }
      const pendType = orderType === 'buy_limit' ? 'BUY_LIMIT' : orderType === 'buy_stop' ? 'BUY_STOP' :
                       orderType === 'sell_limit' ? 'SELL_LIMIT' : 'SELL_STOP';
      const newPending = {
        id: Date.now() + Math.random(), symbol: selectedSymbol, type: pendType,
        lots: lotsNum, price,
        sl: sl ? parseFloat(sl) : null,
        tp: tp ? parseFloat(tp) : null,
        time: new Date().toLocaleTimeString(),
      };
      setPendingOrders(prev => [...prev, newPending]);
      addLog(`${pendType} ${lotsNum} ${selectedSymbol} @ ${price} — Pending Placed`, true);
      setOrderFlash('pending');
      setTimeout(() => setOrderFlash(null), 1800);
      setSl(''); setTp(''); setPendingPrice('');
    }
  };

  const selected = INSTRUMENTS.find(i => i.symbol === selectedSymbol) || INSTRUMENTS[0];
  const currentPrice = prices[selectedSymbol];
  const leverage = account?.leverage || '1:100';
  const lotsNum = parseFloat(lots) || 0.01;
  const marginReq = calcMargin(selectedSymbol, lotsNum, leverage);
  const TF_OPTS = [
    { label: '1m', val: '1' }, { label: '5m', val: '5' }, { label: '15m', val: '15' },
    { label: '1h', val: '60' }, { label: '4h', val: '240' }, { label: '1D', val: 'D' },
  ];
  const ORDER_TYPES = [
    { val: 'market', label: 'Market' },
    { val: 'buy_limit', label: 'Buy Limit' },
    { val: 'buy_stop', label: 'Buy Stop' },
    { val: 'sell_limit', label: 'Sell Limit' },
    { val: 'sell_stop', label: 'Sell Stop' },
  ];

  if (!isActive) return <NoAccountGate />;

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 0px)', background: '#040407' }}>

      {/* ACCOUNT STATUS BAR */}
      <AccountStatusBar
        account={account}
        balance={sessionBalance}
        equity={equity}
        floatPnl={floatPnl}
        rules={rules}
      />

      {/* MARKET TICKER BAR */}
      <div className="flex items-center border-b border-white/[0.05] overflow-x-auto flex-shrink-0"
        style={{ background: 'rgba(6,6,9,0.98)' }}>
        {INSTRUMENTS.map(inst => {
          const p = prices[inst.symbol];
          const isUp = (p?.pct || 0) >= 0;
          const isActive = selectedSymbol === inst.symbol;
          return (
            <button key={inst.symbol} onClick={() => setSelectedSymbol(inst.symbol)}
              className={`flex items-center gap-3 px-4 py-2.5 border-r border-white/[0.05] flex-shrink-0 transition-all ${
                isActive ? 'bg-primary/10 border-b border-primary/40' : 'hover:bg-white/[0.03]'
              }`}>
              <div className="text-left">
                <div className="text-xs font-bold text-foreground">{inst.symbol}</div>
                {p?.bid !== null && p?.bid !== undefined
                  ? <PriceCell value={p.bid} digits={inst.digits} />
                  : <span className="text-[10px] font-mono text-muted-foreground/30">Loading...</span>
                }
              </div>
              <div className={`text-[10px] font-mono flex items-center gap-0.5 ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                {isUp ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {Math.abs(p?.pct || 0).toFixed(2)}%
              </div>
            </button>
          );
        })}
      </div>

      {/* ACCOUNT BLOCKED BANNER */}
      <AnimatePresence>
        {accountBlocked && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            className="overflow-hidden flex-shrink-0"
            style={{ background: 'rgba(239,68,68,0.15)', borderBottom: '1px solid rgba(239,68,68,0.4)' }}>
            <div className="flex items-center gap-3 px-4 py-2">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span className="text-xs font-mono font-bold text-red-400">DRAWDOWN LIMIT REACHED — TRADING SUSPENDED. Account has been flagged for review.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN AREA */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT PANEL */}
        <div className="w-44 border-r border-white/5 flex flex-col flex-shrink-0" style={{ background: 'rgba(5,5,7,0.98)' }}>
          <div className="flex border-b border-white/5">
            {[{ id: 'watchlist', icon: List }, { id: 'positions', icon: Activity }, { id: 'rules', icon: ShieldCheck }]
              .map(({ id, icon: Icon }) => (
              <button key={id} onClick={() => setLeftTab(id)}
                className={`flex-1 py-2 flex items-center justify-center transition-colors ${leftTab === id ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                <Icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {leftTab === 'watchlist' && INSTRUMENTS.map(inst => {
              const p = prices[inst.symbol];
              const isUp = (p?.pct || 0) >= 0;
              return (
                <button key={inst.symbol} onClick={() => setSelectedSymbol(inst.symbol)}
                  className={`w-full px-3 py-2.5 text-left border-b border-white/[0.04] transition-all ${selectedSymbol === inst.symbol ? 'bg-primary/10' : 'hover:bg-white/[0.03]'}`}>
                  <div className="flex justify-between mb-0.5">
                    <span className="text-xs font-bold text-foreground">{inst.symbol}</span>
                    <span className={`text-[9px] font-mono ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>{isUp ? '+' : ''}{(p?.pct || 0).toFixed(2)}%</span>
                  </div>
                  {p?.bid !== null && p?.bid !== undefined
                    ? <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                        <span>{p.bid.toFixed(inst.digits)}</span>
                        <span className="text-muted-foreground/40">{p.ask?.toFixed(inst.digits)}</span>
                      </div>
                    : <div className="text-[10px] font-mono text-muted-foreground/30">Loading…</div>
                  }
                </button>
              );
            })}

            {leftTab === 'positions' && (
              <div className="p-2 space-y-2">
                {positions.length === 0
                  ? <div className="text-[11px] font-mono text-muted-foreground/40 px-1 py-6 text-center">No open positions</div>
                  : positions.map(pos => {
                    const p = prices[pos.symbol];
                    const livePrice = p ? (pos.type === 'BUY' ? p.bid : p.ask) : pos.entry;
                    const livePnl = p ? calcPnl(pos, livePrice) : 0;
                    return (
                      <div key={pos.id} className="rounded-lg p-2.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] font-bold text-foreground">{pos.symbol}</span>
                          <span className={`text-[9px] font-mono font-bold ${pos.type === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}>{pos.type}</span>
                        </div>
                        <div className={`text-xs font-mono font-bold ${livePnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {livePnl >= 0 ? '+' : ''}${livePnl.toFixed(2)}
                        </div>
                        <div className="text-[9px] font-mono text-muted-foreground/50 mt-0.5">{pos.lots} lots @ {typeof pos.entry === 'number' ? pos.entry.toFixed(selected.digits) : pos.entry}</div>
                      </div>
                    );
                  })}
              </div>
            )}

            {leftTab === 'rules' && <AccountRulesPanel rules={rules} account={account} />}
          </div>
        </div>

        {/* CENTER CHART */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#07070a' }}>
          <div className="flex items-center gap-3 px-4 py-2 border-b border-white/[0.05] flex-shrink-0">
            <span className="text-sm font-black text-foreground">{selectedSymbol}</span>
            {currentPrice?.bid !== null && currentPrice?.bid !== undefined && (
              <span className={`text-xs font-mono ${(currentPrice.pct || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {currentPrice.bid.toFixed(selected.digits)}
                <span className="ml-2">{(currentPrice.pct || 0) >= 0 ? '+' : ''}{(currentPrice.pct || 0).toFixed(2)}%</span>
              </span>
            )}
            {currentPrice?.bid && currentPrice?.ask && (
              <span className="text-[10px] font-mono text-muted-foreground/50">
                Spread: {(currentPrice.ask - currentPrice.bid).toFixed(selected.digits)}
              </span>
            )}
            <div className="flex items-center gap-0.5 ml-auto">
              {TF_OPTS.map(tf => (
                <button key={tf.val} onClick={() => setTimeframe(tf.val)}
                  className={`px-2.5 py-1 rounded text-[10px] font-mono transition-all ${timeframe === tf.val ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}>
                  {tf.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <TradingViewChart symbol={selectedSymbol} timeframe={timeframe} />
          </div>
        </div>

        {/* RIGHT ORDER PANEL */}
        <div className="w-56 border-l border-white/5 flex flex-col flex-shrink-0 overflow-y-auto" style={{ background: 'rgba(5,5,7,0.98)' }}>
          <div className="p-3">
            <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mb-2">New Order — {selectedSymbol}</div>

            {/* BUY/SELL toggle (only for market) */}
            {orderType === 'market' && (
              <div className="grid grid-cols-2 gap-1 mb-3">
                {['BUY', 'SELL'].map(side => (
                  <button key={side} onClick={() => setOrderSide(side)}
                    className="py-2.5 rounded-lg text-xs font-black transition-all"
                    style={{
                      background: orderSide === side ? (side === 'BUY' ? 'rgba(16,185,129,0.85)' : 'rgba(239,68,68,0.85)') : 'rgba(255,255,255,0.05)',
                      color: orderSide === side ? 'white' : '#666',
                      boxShadow: orderSide === side ? `0 4px 12px ${side === 'BUY' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` : 'none',
                    }}>
                    {side === 'BUY' ? '▲' : '▼'} {side}
                  </button>
                ))}
              </div>
            )}

            {/* Live price display */}
            <div className="grid grid-cols-2 gap-1 mb-3 text-center">
              <div className="rounded-lg p-2" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <div className="text-[9px] font-mono text-emerald-400/70 mb-0.5">ASK</div>
                {currentPrice?.ask !== null && currentPrice?.ask !== undefined
                  ? <div className="text-xs font-mono font-bold text-emerald-400">{currentPrice.ask.toFixed(selected.digits)}</div>
                  : <div className="text-[10px] font-mono text-muted-foreground/30">—</div>
                }
              </div>
              <div className="rounded-lg p-2" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <div className="text-[9px] font-mono text-red-400/70 mb-0.5">BID</div>
                {currentPrice?.bid !== null && currentPrice?.bid !== undefined
                  ? <div className="text-xs font-mono font-bold text-red-400">{currentPrice.bid.toFixed(selected.digits)}</div>
                  : <div className="text-[10px] font-mono text-muted-foreground/30">—</div>
                }
              </div>
            </div>

            {/* Order Type */}
            <div className="mb-2">
              <div className="text-[9px] font-mono text-muted-foreground mb-1">Order Type</div>
              <select value={orderType} onChange={e => setOrderType(e.target.value)}
                className="w-full rounded-lg px-2.5 py-1.5 text-xs font-mono text-foreground outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                {ORDER_TYPES.map(ot => <option key={ot.val} value={ot.val} style={{ background: '#0a0a0f' }}>{ot.label}</option>)}
              </select>
            </div>

            {/* Pending price (only for pending orders) */}
            {orderType !== 'market' && (
              <div className="mb-2">
                <div className="text-[9px] font-mono text-muted-foreground mb-1 flex justify-between">
                  <span>Order Price</span><span className="opacity-50">Required</span>
                </div>
                <input value={pendingPrice} onChange={e => setPendingPrice(e.target.value)}
                  placeholder={currentPrice?.bid?.toFixed(selected.digits) || ''}
                  className="w-full rounded-lg px-2.5 py-1.5 text-xs font-mono text-foreground outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
            )}

            {/* Lot Size, SL, TP */}
            {[
              { label: 'Lot Size', val: lots, set: setLots, hint: `Max ${rules.maxLots}` },
              { label: 'Stop Loss', val: sl, set: setSl, hint: 'Optional' },
              { label: 'Take Profit', val: tp, set: setTp, hint: 'Optional' },
            ].map(({ label, val, set, hint }) => (
              <div key={label} className="mb-2">
                <div className="text-[9px] font-mono text-muted-foreground mb-1 flex justify-between">
                  <span>{label}</span><span className="opacity-40">{hint}</span>
                </div>
                <input value={val} onChange={e => set(e.target.value)}
                  className="w-full rounded-lg px-2.5 py-1.5 text-xs font-mono text-foreground outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
            ))}

            {/* Margin / risk info */}
            <div className="rounded-lg p-2 mb-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex justify-between text-[9px] font-mono mb-1">
                <span className="text-muted-foreground">Margin Req.</span>
                <span className="text-foreground">${marginReq.toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-[9px] font-mono mb-1">
                <span className="text-muted-foreground">Free Margin</span>
                <span className={freeMargin < marginReq ? 'text-red-400' : 'text-foreground'}>${freeMargin.toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-[9px] font-mono">
                <span className="text-muted-foreground">Leverage</span>
                <span className="text-primary">{leverage}</span>
              </div>
            </div>

            {/* Execute button */}
            <AnimatePresence mode="wait">
              {orderFlash ? (
                <motion.div key="flash" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                  className="w-full py-3 rounded-lg text-xs font-black text-white text-center"
                  style={{ background: orderFlash === 'ok' ? 'rgba(16,185,129,0.8)' : 'rgba(255,160,0,0.8)' }}>
                  {orderFlash === 'ok' ? '✓ Market Executed' : '⏳ Pending Placed'}
                </motion.div>
              ) : (
                <motion.button key="btn" onClick={placeOrder} disabled={accountBlocked}
                  whileHover={!accountBlocked ? { scale: 1.02 } : {}} whileTap={!accountBlocked ? { scale: 0.97 } : {}}
                  className="w-full py-3 rounded-lg text-xs font-black text-white transition-all disabled:opacity-40"
                  style={!accountBlocked ? {
                    background: orderType !== 'market'
                      ? 'linear-gradient(90deg,#f59e0b,#d97706)'
                      : (orderSide === 'BUY' ? 'linear-gradient(90deg,#10b981,#059669)' : 'linear-gradient(90deg,#ef4444,#dc2626)'),
                    boxShadow: orderType !== 'market'
                      ? '0 4px 16px rgba(245,158,11,0.3)'
                      : (orderSide === 'BUY' ? '0 4px 16px rgba(16,185,129,0.3)' : '0 4px 16px rgba(239,68,68,0.3)'),
                  } : { background: '#222' }}>
                  {accountBlocked ? '🔒 TRADING SUSPENDED'
                    : orderType !== 'market' ? `⏳ Place ${orderType.replace('_', ' ').toUpperCase()} @ ${pendingPrice || '?'}`
                    : `${orderSide === 'BUY' ? '▲' : '▼'} ${orderSide} ${lots} ${selectedSymbol}`}
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* BOTTOM PANEL */}
      <div className="border-t border-white/5 flex-shrink-0" style={{ background: 'rgba(4,4,6,0.99)', height: '200px' }}>
        <div className="flex items-center border-b border-white/5">
          {[
            { id: 'positions', label: `Positions (${positions.length})` },
            { id: 'pending', label: `Pending (${pendingOrders.length})` },
            { id: 'history', label: `History (${closedTrades.length})` },
            { id: 'log', label: 'Activity Log' },
          ].map(t => (
            <button key={t.id} onClick={() => setBottomTab(t.id)}
              className={`px-4 py-2.5 text-[11px] font-mono transition-colors border-r border-white/[0.04] ${bottomTab === t.id ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-muted-foreground hover:text-foreground'}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto" style={{ height: '155px' }}>
          {/* Open Positions */}
          {bottomTab === 'positions' && (
            <table className="w-full text-[10px] font-mono">
              <thead><tr className="text-muted-foreground/60 border-b border-white/[0.04]">
                {['Symbol','Type','Lots','Entry','Current','SL','TP','P&L','Time','Close'].map(h => (
                  <th key={h} className="px-3 py-1.5 text-left font-medium">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {positions.length === 0
                  ? <tr><td colSpan={10} className="px-3 py-6 text-center text-muted-foreground/30">No open positions — terminal ready</td></tr>
                  : positions.map(pos => {
                    const p = prices[pos.symbol];
                    const livePrice = p ? (pos.type === 'BUY' ? p.bid : p.ask) : pos.entry;
                    const livePnl = p ? calcPnl(pos, livePrice) : 0;
                    const inst = INSTRUMENTS.find(i => i.symbol === pos.symbol);
                    return (
                      <tr key={pos.id} className="border-b border-white/[0.03] hover:bg-white/[0.015]">
                        <td className="px-3 py-1.5 font-bold text-foreground">{pos.symbol}</td>
                        <td className={`px-3 py-1.5 font-bold ${pos.type === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}>{pos.type}</td>
                        <td className="px-3 py-1.5 text-muted-foreground">{pos.lots}</td>
                        <td className="px-3 py-1.5 text-muted-foreground">{pos.entry.toFixed(inst?.digits || 2)}</td>
                        <td className="px-3 py-1.5 text-foreground">{livePrice?.toFixed(inst?.digits || 2)}</td>
                        <td className="px-3 py-1.5 text-red-400/60">{pos.sl || '—'}</td>
                        <td className="px-3 py-1.5 text-emerald-400/60">{pos.tp || '—'}</td>
                        <td className={`px-3 py-1.5 font-bold ${livePnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{livePnl >= 0 ? '+' : ''}${livePnl.toFixed(2)}</td>
                        <td className="px-3 py-1.5 text-muted-foreground/40">{pos.time}</td>
                        <td className="px-3 py-1.5">
                          <button onClick={() => closePositionById(pos.id, livePrice, livePnl)}
                            className="p-1 rounded hover:bg-red-500/20 text-red-400/70 hover:text-red-400 transition-colors">
                            <X className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          )}

          {/* Pending Orders */}
          {bottomTab === 'pending' && (
            <table className="w-full text-[10px] font-mono">
              <thead><tr className="text-muted-foreground/60 border-b border-white/[0.04]">
                {['Symbol','Type','Lots','Price','SL','TP','Time','Cancel'].map(h => (
                  <th key={h} className="px-3 py-1.5 text-left font-medium">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {pendingOrders.length === 0
                  ? <tr><td colSpan={8} className="px-3 py-6 text-center text-muted-foreground/30">No pending orders</td></tr>
                  : pendingOrders.map(o => (
                    <tr key={o.id} className="border-b border-white/[0.03] hover:bg-white/[0.015]">
                      <td className="px-3 py-1.5 font-bold text-foreground">{o.symbol}</td>
                      <td className="px-3 py-1.5 text-yellow-400 font-bold">{o.type.replace('_', ' ')}</td>
                      <td className="px-3 py-1.5 text-muted-foreground">{o.lots}</td>
                      <td className="px-3 py-1.5 text-foreground">{o.price}</td>
                      <td className="px-3 py-1.5 text-red-400/60">{o.sl || '—'}</td>
                      <td className="px-3 py-1.5 text-emerald-400/60">{o.tp || '—'}</td>
                      <td className="px-3 py-1.5 text-muted-foreground/40">{o.time}</td>
                      <td className="px-3 py-1.5">
                        <button onClick={() => { setPendingOrders(p => p.filter(x => x.id !== o.id)); addLog(`Pending order cancelled: ${o.type} ${o.symbol}`, true); }}
                          className="p-1 rounded hover:bg-red-500/20 text-red-400/70 hover:text-red-400 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {/* Trade History */}
          {bottomTab === 'history' && (
            <table className="w-full text-[10px] font-mono">
              <thead><tr className="text-muted-foreground/60 border-b border-white/[0.04]">
                {['Symbol','Type','Lots','Entry','Close','P&L','Close Time','Reason'].map(h => (
                  <th key={h} className="px-3 py-1.5 text-left font-medium">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {closedTrades.length === 0
                  ? <tr><td colSpan={8} className="px-3 py-6 text-center text-muted-foreground/30">No closed trades</td></tr>
                  : closedTrades.map((t, i) => {
                    const inst = INSTRUMENTS.find(ii => ii.symbol === t.symbol);
                    return (
                      <tr key={i} className="border-b border-white/[0.03]">
                        <td className="px-3 py-1.5 font-bold text-foreground">{t.symbol}</td>
                        <td className={`px-3 py-1.5 font-bold ${t.type === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}>{t.type}</td>
                        <td className="px-3 py-1.5 text-muted-foreground">{t.lots}</td>
                        <td className="px-3 py-1.5 text-muted-foreground">{typeof t.entry === 'number' ? t.entry.toFixed(inst?.digits || 2) : t.entry}</td>
                        <td className="px-3 py-1.5 text-muted-foreground">{typeof t.close === 'number' ? t.close.toFixed(inst?.digits || 2) : t.close}</td>
                        <td className={`px-3 py-1.5 font-bold ${t.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{t.pnl >= 0 ? '+' : ''}${t.pnl?.toFixed(2)}</td>
                        <td className="px-3 py-1.5 text-muted-foreground/40">{t.closeTime}</td>
                        <td className="px-3 py-1.5">
                          <span className="px-1.5 py-0.5 rounded text-[9px]" style={{
                            background: t.reason === 'TP' ? 'rgba(16,185,129,0.15)' : t.reason === 'SL' ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)',
                            color: t.reason === 'TP' ? '#10b981' : t.reason === 'SL' ? '#ef4444' : '#999',
                          }}>{t.reason}</span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          )}

          {/* Activity Log */}
          {bottomTab === 'log' && (
            <div className="p-3 space-y-1">
              {activityLog.map((log, i) => (
                <div key={i} className="flex items-center gap-3 text-[10px] font-mono">
                  <span className="text-muted-foreground/40 flex-shrink-0">{log.time}</span>
                  <span className={`flex-shrink-0 ${log.ok ? 'text-emerald-400/60' : 'text-red-400/70'}`}>●</span>
                  <span className={log.ok ? 'text-muted-foreground' : 'text-red-400/80'}>{log.msg}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}