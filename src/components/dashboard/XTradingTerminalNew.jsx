import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, TrendingUp, TrendingDown, Settings, Eye, EyeOff, Zap, AlertCircle, CheckCircle, Clock, Trash2, MoreVertical } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import AccountBreachAlert from './AccountBreachAlert';
import TradingSessionCards from './TradingSessionCards';

const INSTRUMENTS = [
  { symbol: 'BTC/USD', digits: 2, pipValue: 0.01, contractSize: 1, wsSymbol: 'btcusdt', type: 'crypto' },
  { symbol: 'ETH/USD', digits: 2, pipValue: 0.01, contractSize: 1, wsSymbol: 'ethusdt', type: 'crypto' },
  { symbol: 'EUR/USD', digits: 5, pipValue: 10, contractSize: 100000, wsSymbol: null, type: 'fx', spreadPips: 0.00012 },
  { symbol: 'GBP/USD', digits: 5, pipValue: 10, contractSize: 100000, wsSymbol: null, type: 'fx', spreadPips: 0.00015 },
  { symbol: 'XAU/USD', digits: 2, pipValue: 0.01, contractSize: 100, wsSymbol: null, type: 'fx', spreadPips: 0.35 },
  { symbol: 'NAS100', digits: 2, pipValue: 1, contractSize: 1, wsSymbol: null, type: 'index', spreadPips: 1.2 },
];

function useLivePrices() {
  const [prices, setPrices] = useState(() =>
    INSTRUMENTS.reduce((acc, inst) => {
      acc[inst.symbol] = { bid: null, ask: null, pct: 0, prev: null };
      return acc;
    }, {})
  );

  useEffect(() => {
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

    const FX_SEEDS = {
      'XAU/USD': { bid: 2338.15, spreadPips: 0.35 },
      'EUR/USD': { bid: 1.08215, spreadPips: 0.00012 },
      'GBP/USD': { bid: 1.27048, spreadPips: 0.00015 },
      'NAS100': { bid: 18254.00, spreadPips: 1.2 },
    };
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

function calcPnl(pos, currentPrice) {
  const inst = INSTRUMENTS.find(i => i.symbol === pos.symbol);
  if (!inst) return 0;
  const priceDiff = pos.type === 'BUY' ? currentPrice - pos.entry : pos.entry - currentPrice;
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

function calcMargin(symbol, lots, leverage, currentBid) {
  const inst = INSTRUMENTS.find(i => i.symbol === symbol);
  const lev = parseInt((leverage || '1:100').split(':')[1]) || 100;
  if (!inst) return 0;
  const REF_PRICES = {
    'BTC/USD': 65000, 'ETH/USD': 3200, 'XAU/USD': 2338,
    'EUR/USD': 1.082, 'GBP/USD': 1.270, 'NAS100': 18254,
  };
  const price = currentBid || REF_PRICES[symbol] || 1;
  if (inst.type === 'crypto') {
    return (lots * price) / lev;
  } else if (inst.type === 'fx') {
    const isUsdBase = symbol.startsWith('USD/');
    const contractValueUsd = isUsdBase ? lots * inst.contractSize : lots * inst.contractSize * price;
    return contractValueUsd / lev;
  } else {
    return (lots * price) / lev;
  }
}

function PriceChart({ symbol, prices }) {
  const inst = INSTRUMENTS.find(i => i.symbol === symbol);
  const p = prices[symbol];
  const [priceHistory, setPriceHistory] = useState([]);

  useEffect(() => {
    if (!p || p.bid === null) return;
    setPriceHistory(prev => {
      const updated = [...prev, { time: new Date().toLocaleTimeString(), price: p.bid }];
      return updated.slice(-60);
    });
  }, [p?.bid]);

  if (!p || p.bid === null || priceHistory.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-sm text-muted-foreground">Loading {symbol} data...</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8">
      <div className="text-center">
        <div className="text-5xl font-mono font-black text-primary mb-3">{p.bid.toFixed(inst?.digits || 2)}</div>
        <div className={`text-lg font-bold mb-6 ${(p.pct || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {(p.pct || 0) >= 0 ? '▲' : '▼'} {Math.abs(p.pct || 0).toFixed(2)}%
        </div>
        <div className="text-xs text-muted-foreground font-mono">
          {symbol} • Last {priceHistory.length} ticks
        </div>
      </div>
    </div>
  );
}

export default function XTradingTerminalNew({ account }) {
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
  const [activityLog, setActivityLog] = useState([{ msg: `Terminal connected`, time: new Date().toLocaleTimeString(), ok: true }]);
  const [selectedPos, setSelectedPos] = useState(null);
  const [accountBlocked, setAccountBlocked] = useState(false);
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  const rules = getAccountRules(account);

  const accountSize = account?.account_size || 100000;
  const startBalance = account?.balance || accountSize;
  const [sessionBalance, setSessionBalance] = useState(startBalance);

  const floatPnl = positions.reduce((sum, pos) => {
    const p = prices[pos.symbol];
    if (!p || p.bid === null) return sum;
    const currentPrice = pos.type === 'BUY' ? p.bid : p.ask;
    return sum + calcPnl(pos, currentPrice);
  }, 0);

  const equity = sessionBalance + floatPnl;
  const totalMargin = positions.reduce((s, p) => s + calcMargin(p.symbol, p.lots, account?.leverage, prices[p.symbol]?.bid), 0);
  const freeMargin = equity - totalMargin;

  useEffect(() => {
    if (positions.length === 0 || !accountSize || accountSize === 0) return;
    const dailyLoss = Math.abs(((sessionBalance - equity) / accountSize) * 100);
    const maxLoss = Math.abs(((accountSize - equity) / accountSize) * 100);
    const isBreached = dailyLoss >= rules.dailyDDLimit || maxLoss >= rules.maxDDLimit;
    
    if (isBreached && !accountBlocked) {
      setAccountBlocked(true);
      addLog(`⚠ DRAWDOWN LIMIT REACHED — Trading suspended`, false);
      if (account?.id) {
        base44.entities.ChallengeAccount.update(account.id, {
          status: 'failed',
          daily_drawdown_used: dailyLoss,
          max_drawdown_used: maxLoss,
          equity: equity,
          balance: sessionBalance,
          pnl: sessionBalance - accountSize,
        }).catch(() => {});
      }
    }
  }, [equity, sessionBalance, accountSize, rules.dailyDDLimit, rules.maxDDLimit, accountBlocked, account?.id, addLog]);

  const addLog = useCallback((msg, ok = true) => {
    setActivityLog(prev => [{ msg, time: new Date().toLocaleTimeString(), ok }, ...prev.slice(0, 49)]);
  }, []);

  const closePositionById = useCallback((id, closePrice, closePnl, reason = 'Manual') => {
    setPositions(prev => {
      const pos = prev.find(p => p.id === id);
      if (!pos) return prev;
      const newBalance = parseFloat((sessionBalance + closePnl).toFixed(2));
      setSessionBalance(newBalance);
      setClosedTrades(ct => [{ ...pos, close: closePrice, pnl: closePnl, closeTime: new Date().toLocaleTimeString(), reason }, ...ct.slice(0, 99)]);
      addLog(`${pos.type} ${pos.lots} ${pos.symbol} closed @ ${closePrice?.toFixed(2)} — ${closePnl >= 0 ? '+' : ''}$${closePnl.toFixed(2)}`, closePnl >= 0);
      return prev.filter(p => p.id !== id);
    });
  }, [addLog, sessionBalance]);

  const placeOrder = () => {
    if (accountBlocked) return;
    const inst = INSTRUMENTS.find(i => i.symbol === selectedSymbol);
    const p = prices[selectedSymbol];
    const lotsNum = parseFloat(lots) || 0.01;

    if (lotsNum > rules.maxLots) {
      addLog(`Lot size exceeds max ${rules.maxLots}`, false);
      return;
    }

    const reqMargin = calcMargin(selectedSymbol, lotsNum, account?.leverage, p?.bid);
    if (reqMargin > freeMargin) {
      addLog(`Insufficient margin`, false);
      return;
    }

    if (orderType === 'market') {
      if (!p || p.bid === null) return;
      const entryPrice = orderSide === 'BUY' ? p.ask : p.bid;
      const newPos = {
        id: Date.now() + Math.random(),
        symbol: selectedSymbol,
        type: orderSide,
        lots: lotsNum,
        entry: entryPrice,
        sl: sl ? parseFloat(sl) : null,
        tp: tp ? parseFloat(tp) : null,
        time: new Date().toLocaleTimeString(),
      };
      setPositions(prev => [...prev, newPos]);
      addLog(`${orderSide} ${lotsNum} ${selectedSymbol} @ ${entryPrice.toFixed(inst?.digits || 2)}`, true);
    } else {
      const price = parseFloat(pendingPrice);
      if (!price) return;
      const pendType = orderType === 'buy_limit' ? 'BUY_LIMIT' : orderType === 'buy_stop' ? 'BUY_STOP' : orderType === 'sell_limit' ? 'SELL_LIMIT' : 'SELL_STOP';
      const newPending = {
        id: Date.now() + Math.random(),
        symbol: selectedSymbol,
        type: pendType,
        lots: lotsNum,
        price,
        sl: sl ? parseFloat(sl) : null,
        tp: tp ? parseFloat(tp) : null,
        time: new Date().toLocaleTimeString(),
      };
      setPendingOrders(prev => [...prev, newPending]);
      addLog(`${pendType} ${lotsNum} ${selectedSymbol} @ ${price}`, true);
    }
    setSl('');
    setTp('');
    setPendingPrice('');
  };

  const selected = INSTRUMENTS.find(i => i.symbol === selectedSymbol) || INSTRUMENTS[0];
  const currentPrice = prices[selectedSymbol];
  const leverage = account?.leverage || '1:100';
  const lotsNum = parseFloat(lots) || 0.01;
  const marginReq = calcMargin(selectedSymbol, lotsNum, leverage, currentPrice?.bid);

  if (!isActive) {
    return (
      <div className="h-full flex flex-col items-center justify-center" style={{ background: 'linear-gradient(135deg, #030305, #0a0a0f)' }}>
        <AlertCircle className="w-16 h-16 text-primary/40 mb-4" />
        <div className="text-xl font-black text-foreground mb-2">Terminal Locked</div>
        <div className="text-sm text-muted-foreground">Only active challenge accounts can trade</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ background: '#030305' }}>
      {/* Compact Status Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="px-2 md:px-4 py-2 border-b flex items-center justify-between text-[10px] md:text-xs flex-wrap gap-2"
        style={{
          borderColor: 'rgba(255,255,255,0.08)',
          background: 'linear-gradient(90deg, rgba(255,92,0,0.05), rgba(0,0,0,0.2))',
          backdropFilter: 'blur(20px)',
        }}>
        <div className="flex items-center gap-4">
          <span className="font-mono font-black text-primary">{account?.account_id}</span>
          <div className="flex items-center gap-3 text-muted-foreground/70 font-mono text-[10px]">
            <span>{leverage}</span>
            <span>•</span>
            <span>${sessionBalance.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
            <span>•</span>
            <span className={equity >= sessionBalance ? 'text-emerald-400' : 'text-red-400'}>${equity.toFixed(2)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AccountBreachAlert account={account} />
          {accountBlocked && <span className="text-red-400 font-bold">⚠ SUSPENDED</span>}
        </div>
      </motion.div>

      {/* Main Area: Chart (Full Width) + Right Order Panel */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden gap-0">
        {/* Chart Area */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r relative"
          style={{
            borderColor: 'rgba(255,255,255,0.08)',
            background: 'linear-gradient(135deg, rgba(255,92,0,0.03), rgba(0,0,0,0.4))',
          }}>
          {/* Chart Header */}
          <div className="px-3 md:px-6 py-2 md:py-3 border-b flex items-center justify-between flex-wrap gap-2"
            style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(5,5,8,0.6)' }}>
            <div className="flex items-center gap-2 md:gap-4">
              <span className="text-sm md:text-base font-black text-foreground">{selectedSymbol}</span>
              {currentPrice?.bid !== null && (
                <>
                  <span className="text-2xl md:text-3xl font-mono font-black text-primary">{currentPrice?.bid?.toFixed(selected.digits)}</span>
                  <span className={`text-xs md:text-sm font-bold ${(currentPrice?.pct || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {(currentPrice?.pct || 0) >= 0 ? '▲' : '▼'} {Math.abs(currentPrice?.pct || 0).toFixed(2)}%
                  </span>
                </>
              )}
            </div>
            {/* Market Watch Mini */}
            <div className="flex items-center gap-1 overflow-x-auto flex-1 md:flex-none" style={{ maxWidth: '100%' }}>
              {INSTRUMENTS.map(inst => {
                const p = prices[inst.symbol];
                const isActive = selectedSymbol === inst.symbol;
                const isUp = (p?.pct || 0) >= 0;
                return (
                  <motion.button
                    key={inst.symbol}
                    onClick={() => setSelectedSymbol(inst.symbol)}
                    whileHover={{ scale: 1.05 }}
                    className={`px-2 md:px-3 py-1 rounded-lg text-[8px] md:text-[9px] font-mono transition-all flex-shrink-0 ${isActive ? 'bg-primary/20 border-primary/40' : 'hover:bg-white/5'}`}
                    style={{
                      border: `1px solid ${isActive ? 'rgba(255,92,0,0.5)' : 'rgba(255,255,255,0.1)'}`,
                    }}>
                    <div className="font-bold text-foreground">{inst.symbol}</div>
                    {p?.bid !== null && (
                      <span className={`ml-1.5 ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                        {p.bid.toFixed(inst.digits)}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Full Chart Area with Timeframes */}
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {/* Timeframe Controls */}
            <div className="px-6 py-3 flex items-center gap-2 border-b flex-wrap"
              style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(5,5,8,0.6)' }}>
              {[
                { label: '1m', val: '1' },
                { label: '5m', val: '5' },
                { label: '15m', val: '15' },
                { label: '1h', val: '60' },
                { label: '4h', val: '240' },
                { label: '1D', val: 'D' },
              ].map(tf => (
                <motion.button
                  key={tf.val}
                  onClick={() => {
                    setIsLoadingChart(true);
                    setTimeout(() => setIsLoadingChart(false), 600);
                    setTimeframe(tf.val);
                  }}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all font-mono ${
                    timeframe === tf.val
                      ? 'text-white'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  style={{
                    background: timeframe === tf.val
                      ? 'linear-gradient(135deg, rgba(255,92,0,0.8), rgba(255,92,0,0.6))'
                      : 'rgba(255,255,255,0.04)',
                    boxShadow: timeframe === tf.val
                      ? '0 4px 16px rgba(255,92,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
                      : 'none',
                    border: `1px solid ${timeframe === tf.val ? 'rgba(255,92,0,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  }}>
                  {tf.label}
                </motion.button>
              ))}
            </div>

            {/* Chart Display */}
            <div className="flex-1 relative overflow-hidden">
              <PriceChart symbol={selectedSymbol} prices={prices} />
            </div>
          </div>
        </motion.div>

        {/* Right Order Panel */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l flex flex-col overflow-hidden max-h-96 lg:max-h-none"
          style={{
            borderColor: 'rgba(255,255,255,0.08)',
            background: 'linear-gradient(135deg, rgba(255,92,0,0.06), rgba(204,255,0,0.01))',
            backdropFilter: 'blur(30px)',
          }}>
          <div className="p-2 md:p-3 border-b flex items-center justify-between text-xs md:text-sm"
            style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <h3 className="text-xs font-black text-foreground uppercase tracking-widest">Order Ticket</h3>
            <span className="text-[10px] font-mono text-muted-foreground/60">{account?.account_type}</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2 md:space-y-3">
            {/* BUY/SELL Toggle */}
            <div className="grid grid-cols-2 gap-1.5 md:gap-2">
              {['BUY', 'SELL'].map(side => (
                <motion.button key={side} onClick={() => setOrderSide(side)}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className={`py-2.5 rounded-xl text-xs font-black transition-all ${orderSide === side ? 'text-white' : 'text-muted-foreground'}`}
                  style={{
                    background: orderSide === side
                      ? (side === 'BUY' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)')
                      : 'rgba(255,255,255,0.05)',
                    boxShadow: orderSide === side
                      ? `0 4px 12px ${side === 'BUY' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`
                      : 'none',
                  }}>
                  {side === 'BUY' ? '▲' : '▼'} {side}
                </motion.button>
              ))}
            </div>

            {/* Current Price */}
            <div className="rounded-lg p-3" style={{
              background: 'linear-gradient(135deg, rgba(96,165,250,0.1), rgba(96,165,250,0.02))',
              border: '1px solid rgba(96,165,250,0.25)',
            }}>
              <div className="text-[9px] text-muted-foreground/60 font-mono uppercase mb-1">Price</div>
              <div className="text-2xl font-black text-foreground">{currentPrice?.bid?.toFixed(selected.digits) || '—'}</div>
            </div>

            {/* Order Type */}
            <div>
              <label className="text-[9px] font-mono text-muted-foreground/60 uppercase block mb-1.5">Type</label>
              <select value={orderType} onChange={e => setOrderType(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-xs text-foreground outline-none font-mono"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                {[{ val: 'market', label: 'Market' }, { val: 'buy_limit', label: 'Buy Limit' }, { val: 'sell_limit', label: 'Sell Limit' }].map(ot => (
                  <option key={ot.val} value={ot.val} style={{ background: '#0a0a0f' }}>{ot.label}</option>
                ))}
              </select>
            </div>

            {/* Lots */}
            <div>
              <label className="text-[9px] font-mono text-muted-foreground/60 uppercase block mb-1.5">Lots</label>
              <input value={lots} onChange={e => setLots(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-xs text-foreground outline-none font-mono"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
            </div>

            {/* SL/TP Row */}
            <div className="grid grid-cols-2 gap-2">
              {[{ label: 'SL', val: sl, set: setSl }, { label: 'TP', val: tp, set: setTp }].map(({ label, val, set }) => (
                <div key={label}>
                  <label className="text-[9px] font-mono text-muted-foreground/60 uppercase block mb-1">{label}</label>
                  <input value={val} onChange={e => set(e.target.value)}
                    className="w-full rounded-lg px-2.5 py-1.5 text-xs text-foreground outline-none font-mono"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>
              ))}
            </div>

            {/* Margin Info */}
            <div className="rounded-lg p-2.5 text-[9px] font-mono space-y-1" style={{
              background: 'linear-gradient(135deg, rgba(255,92,0,0.1), rgba(255,92,0,0.03))',
              border: '1px solid rgba(255,92,0,0.25)',
            }}>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Margin:</span>
                <span className="text-foreground font-bold">${marginReq.toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Free:</span>
                <span className={freeMargin < marginReq ? 'text-red-400' : 'text-emerald-400'}>${freeMargin.toFixed(0)}</span>
              </div>
            </div>

            {/* Execute Button */}
            <motion.button onClick={placeOrder} disabled={accountBlocked}
              whileHover={!accountBlocked ? { scale: 1.02 } : {}}
              className="w-full py-3 rounded-lg text-xs font-black text-white transition-all disabled:opacity-40 mt-4"
              style={{
                background: !accountBlocked
                  ? (orderSide === 'BUY' ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #ef4444, #dc2626)')
                  : '#333',
                boxShadow: !accountBlocked
                  ? `0 6px 20px ${orderSide === 'BUY' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`
                  : 'none',
              }}>
              {accountBlocked ? '🔒 SUSPENDED' : `${orderSide === 'BUY' ? '▲' : '▼'} TRADE`}
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Session Cards Section */}
      <div className="border-t px-2 md:px-4 py-3 md:py-4 flex-shrink-0" style={{ background: 'rgba(4,4,6,0.98)' }}>
        <TradingSessionCards account={account} positions={positions} pendingOrders={pendingOrders} />
      </div>

      {/* Bottom Positions Panel - Compact */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="border-t h-32 md:h-40 flex flex-col"
        style={{
          borderColor: 'rgba(255,255,255,0.08)',
          background: 'linear-gradient(135deg, rgba(255,92,0,0.08), rgba(204,255,0,0.02))',
          backdropFilter: 'blur(40px)',
        }}>
        <div className="px-2 md:px-4 py-1.5 md:py-2 border-b flex items-center justify-between text-[9px] md:text-xs font-mono"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <span className="font-black text-foreground">Open ({positions.length})</span>
          {positions.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
        </div>
        <div className="flex-1 overflow-x-auto p-1.5 md:p-2 flex gap-1.5 md:gap-2">
          {positions.length === 0 ? (
            <div className="w-full flex items-center justify-center">
              <span className="text-xs text-muted-foreground/40">No positions</span>
            </div>
          ) : (
            positions.map(pos => {
              const p = prices[pos.symbol];
              const livePrice = p ? (pos.type === 'BUY' ? p.bid : p.ask) : pos.entry;
              const livePnl = p ? calcPnl(pos, livePrice) : 0;
              const isProfit = livePnl >= 0;
              return (
                <motion.div key={pos.id}
                  whileHover={{ scale: 1.02 }}
                  className="flex-shrink-0 p-2 md:p-3 rounded-lg cursor-pointer group"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
                    border: '1px solid rgba(255,255,255,0.12)',
                    backdropFilter: 'blur(20px)',
                    minWidth: '160px',
                  }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-lg flex items-center justify-center text-[9px] font-black text-white"
                        style={{ background: pos.type === 'BUY' ? '#10b981' : '#ef4444' }}>
                        {pos.type === 'BUY' ? '▲' : '▼'}
                      </div>
                      <span className="text-xs font-bold text-foreground">{pos.symbol}</span>
                    </div>
                    <motion.button
                      onClick={e => { e.stopPropagation(); closePositionById(pos.id, livePrice, livePnl); }}
                      whileHover={{ scale: 1.1 }}
                      className="text-red-400/60 hover:text-red-400">
                      <X className="w-3 h-3" />
                    </motion.button>
                  </div>
                  <div className="text-[9px] font-mono text-muted-foreground/70 mb-1">{pos.lots} lots @ {typeof pos.entry === 'number' ? pos.entry.toFixed(selected.digits) : pos.entry}</div>
                  <div className={`text-sm font-black ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isProfit ? '+' : ''}${livePnl.toFixed(2)}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
}