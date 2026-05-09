import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, TrendingUp, TrendingDown, Settings, Eye, EyeOff, Zap, AlertCircle, CheckCircle, Clock, Trash2, MoreVertical } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import AccountBreachAlert from './AccountBreachAlert';

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

export default function XTradingTerminalNew({ account }) {
  const isActive = !!(account && (account.status === 'active' || account.status === 'funded' || account.status === 'passed'));
  const prices = useLivePrices();
  const [selectedSymbol, setSelectedSymbol] = useState('BTC/USD');
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
    if (positions.length === 0) return;
    const dailyLoss = ((sessionBalance - equity) / accountSize) * 100;
    const maxLoss = ((accountSize - equity) / accountSize) * 100;
    if (dailyLoss >= rules.dailyDDLimit || maxLoss >= rules.maxDDLimit) {
      setAccountBlocked(true);
      addLog(`DRAWDOWN LIMIT REACHED`, false);
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
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="px-6 py-4 border-b flex items-center justify-between"
        style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'linear-gradient(90deg, rgba(255,92,0,0.08), rgba(255,92,0,0.02))' }}>
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-sm font-black text-foreground">{account?.account_id}</span>
            <span className="text-xs text-muted-foreground font-mono">{leverage} • {account?.account_type} • {account?.phase?.replace('phase', 'Phase ')}</span>
          </div>
          <div className="h-8 w-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
          <div className="flex items-center gap-6 text-xs font-mono">
            <div>
              <div className="text-muted-foreground/60">Balance</div>
              <div className="text-lg font-black text-foreground">${sessionBalance.toLocaleString('en-US', { maximumFractionDigits: 2 })}</div>
            </div>
            <div>
              <div className="text-muted-foreground/60">Equity</div>
              <div className={`text-lg font-black ${equity >= sessionBalance ? 'text-emerald-400' : 'text-red-400'}`}>${equity.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-muted-foreground/60">Free Margin</div>
              <div className={`text-lg font-black ${freeMargin > 0 ? 'text-emerald-400' : 'text-red-400'}`}>${freeMargin.toFixed(2)}</div>
            </div>
          </div>
        </div>
        <AccountBreachAlert account={account} />
      </motion.div>

      {accountBlocked && (
        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="overflow-hidden"
          style={{ background: 'rgba(239,68,68,0.15)', borderBottom: '1px solid rgba(239,68,68,0.4)' }}>
          <div className="flex items-center gap-3 px-6 py-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-xs font-bold text-red-400">DRAWDOWN LIMIT REACHED — Trading Suspended</span>
          </div>
        </motion.div>
      )}

      {/* Main Trading Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left - Market Watch */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          className="w-56 border-r overflow-y-auto flex flex-col"
          style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(8,8,12,0.8)' }}>
          <div className="p-4 border-b sticky top-0" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <h3 className="text-xs font-black text-foreground uppercase tracking-widest">Market Watch</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {INSTRUMENTS.map(inst => {
              const p = prices[inst.symbol];
              const isActive = selectedSymbol === inst.symbol;
              const isUp = (p?.pct || 0) >= 0;
              return (
                <motion.button key={inst.symbol} onClick={() => setSelectedSymbol(inst.symbol)}
                  whileHover={{ x: 4 }}
                  className={`w-full px-3 py-3 border-b text-left transition-all ${isActive ? 'bg-primary/10' : 'hover:bg-white/5'}`}
                  style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-foreground">{inst.symbol}</span>
                    <span className={`text-[9px] font-bold ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isUp ? '▲' : '▼'} {Math.abs(p?.pct || 0).toFixed(2)}%
                    </span>
                  </div>
                  {p?.bid !== null && p?.bid !== undefined ? (
                    <div className="text-xs font-mono text-muted-foreground">
                      {p.bid.toFixed(inst.digits)}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground/30">Loading...</div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Center - Chart Placeholder */}
        <div className="flex-1 border-r flex items-center justify-center"
          style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'linear-gradient(135deg, rgba(255,92,0,0.05), rgba(0,0,0,0.3))' }}>
          <div className="text-center">
            <div className="text-sm font-black text-foreground mb-2">{selectedSymbol}</div>
            <div className="text-3xl font-mono font-black text-primary">{currentPrice?.bid?.toFixed(selected.digits) || '—'}</div>
            <div className="text-xs text-muted-foreground mt-2 font-mono">TradingView Integration Ready</div>
          </div>
        </div>

        {/* Right - Order Panel */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          className="w-72 border-l flex flex-col overflow-hidden"
          style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(8,8,12,0.8)' }}>
          <div className="p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <h3 className="text-xs font-black text-foreground uppercase tracking-widest">{selectedSymbol}</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Buy/Sell Toggle */}
            <div className="grid grid-cols-2 gap-2">
              {['BUY', 'SELL'].map(side => (
                <motion.button key={side} onClick={() => setOrderSide(side)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={`py-3 rounded-xl text-xs font-black transition-all ${orderSide === side ? 'text-white' : 'text-muted-foreground hover:text-foreground'}`}
                  style={{
                    background: orderSide === side ? (side === 'BUY' ? 'rgba(16,185,129,0.8)' : 'rgba(239,68,68,0.8)') : 'rgba(255,255,255,0.04)',
                    boxShadow: orderSide === side ? `0 4px 12px ${side === 'BUY' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` : 'none',
                  }}>
                  {side === 'BUY' ? '▲' : '▼'} {side}
                </motion.button>
              ))}
            </div>

            {/* Live Price */}
            <div className="rounded-lg p-3 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="text-[10px] text-muted-foreground/70 mb-1">Current Price</div>
              <div className="text-2xl font-black text-foreground">{currentPrice?.bid?.toFixed(selected.digits) || '—'}</div>
            </div>

            {/* Order Type & Inputs */}
            <div>
              <label className="text-[10px] font-bold text-muted-foreground/70 uppercase block mb-2">Order Type</label>
              <select value={orderType} onChange={e => setOrderType(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-xs text-foreground outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                {[{ val: 'market', label: 'Market' }, { val: 'buy_limit', label: 'Buy Limit' }, { val: 'sell_limit', label: 'Sell Limit' }].map(ot => (
                  <option key={ot.val} value={ot.val} style={{ background: '#0a0a0f' }}>{ot.label}</option>
                ))}
              </select>
            </div>

            {orderType !== 'market' && (
              <div>
                <label className="text-[10px] font-bold text-muted-foreground/70 uppercase block mb-2">Price</label>
                <input value={pendingPrice} onChange={e => setPendingPrice(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-xs text-foreground outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
            )}

            {[
              { label: 'Lots', val: lots, set: setLots },
              { label: 'Stop Loss', val: sl, set: setSl },
              { label: 'Take Profit', val: tp, set: setTp },
            ].map(({ label, val, set }) => (
              <div key={label}>
                <label className="text-[10px] font-bold text-muted-foreground/70 uppercase block mb-2">{label}</label>
                <input value={val} onChange={e => set(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-xs text-foreground outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
            ))}

            {/* Margin Info */}
            <div className="rounded-lg p-3" style={{ background: 'rgba(255,92,0,0.08)', border: '1px solid rgba(255,92,0,0.2)' }}>
              <div className="flex justify-between text-[9px] font-mono mb-1">
                <span className="text-muted-foreground">Margin Req</span>
                <span className="text-foreground font-bold">${marginReq.toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-[9px] font-mono">
                <span className="text-muted-foreground">Free Margin</span>
                <span className={`font-bold ${freeMargin < marginReq ? 'text-red-400' : 'text-emerald-400'}`}>${freeMargin.toFixed(0)}</span>
              </div>
            </div>

            {/* Execute Button */}
            <motion.button onClick={placeOrder} disabled={accountBlocked}
              whileHover={!accountBlocked ? { scale: 1.02 } : {}}
              whileTap={!accountBlocked ? { scale: 0.98 } : {}}
              className="w-full py-3 rounded-lg text-xs font-black text-white transition-all disabled:opacity-40"
              style={{
                background: !accountBlocked ? (orderSide === 'BUY' ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #ef4444, #dc2626)') : '#222',
                boxShadow: !accountBlocked ? (orderSide === 'BUY' ? '0 4px 16px rgba(16,185,129,0.3)' : '0 4px 16px rgba(239,68,68,0.3)') : 'none',
              }}>
              {accountBlocked ? '🔒 SUSPENDED' : `${orderSide === 'BUY' ? '▲' : '▼'} ${orderSide} ${lotsNum} ${selectedSymbol}`}
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Bottom Positions Panel */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="border-t h-48 flex flex-col"
        style={{
          borderColor: 'rgba(255,255,255,0.1)',
          background: 'linear-gradient(135deg, rgba(255,92,0,0.08), rgba(204,255,0,0.02), rgba(255,92,0,0.04))',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
        }}>
        <div className="px-6 py-3 border-b flex items-center justify-between"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <h4 className="text-xs font-black text-foreground uppercase tracking-widest">Open Positions ({positions.length})</h4>
          <div className="flex items-center gap-1">
            {positions.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {positions.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <span className="text-xs text-muted-foreground/40">No open positions</span>
            </div>
          ) : (
            positions.map(pos => {
              const p = prices[pos.symbol];
              const livePrice = p ? (pos.type === 'BUY' ? p.bid : p.ask) : pos.entry;
              const livePnl = p ? calcPnl(pos, livePrice) : 0;
              const isProfit = livePnl >= 0;
              return (
                <motion.div key={pos.id} onClick={() => setSelectedPos(pos.id)}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-4 rounded-xl flex items-center justify-between cursor-pointer group transition-all"
                  style={{
                    background: selectedPos === pos.id
                      ? 'linear-gradient(135deg, rgba(255,92,0,0.2), rgba(255,92,0,0.08))'
                      : 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
                    border: `1px solid ${selectedPos === pos.id ? 'rgba(255,92,0,0.4)' : 'rgba(255,255,255,0.12)'}`,
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    boxShadow: selectedPos === pos.id ? '0 8px 24px rgba(255,92,0,0.15)' : '0 4px 12px rgba(0,0,0,0.2)',
                  }}>
                  <div className="flex-1 text-xs">
                    <div className="flex items-center gap-2 mb-2">
                      <motion.div whileHover={{ scale: 1.1 }}
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black text-white"
                        style={{
                          background: pos.type === 'BUY' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)',
                          boxShadow: pos.type === 'BUY' ? '0 4px 12px rgba(16,185,129,0.3)' : '0 4px 12px rgba(239,68,68,0.3)',
                        }}>
                        {pos.type === 'BUY' ? '▲' : '▼'}
                      </motion.div>
                      <div>
                        <span className="font-bold text-foreground">{pos.symbol}</span>
                        <span className="text-muted-foreground/60 ml-2">•</span>
                        <span className="text-muted-foreground/80 ml-2 font-mono">{pos.lots} lots</span>
                      </div>
                    </div>
                    <div className="text-muted-foreground/70 font-mono text-[9px] ml-8">
                      Entry: {typeof pos.entry === 'number' ? pos.entry.toFixed(selected.digits) : pos.entry}
                    </div>
                  </div>
                  <div className="text-right flex items-end gap-3">
                    <div>
                      <div className={`text-base font-black ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}
                        style={{
                          textShadow: `0 0 12px ${isProfit ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
                        }}>
                        {isProfit ? '+' : ''}${livePnl.toFixed(2)}
                      </div>
                      <div className={`text-[9px] font-mono ${isProfit ? 'text-emerald-400/60' : 'text-red-400/60'}`}>
                        {((livePnl / sessionBalance) * 100).toFixed(2)}%
                      </div>
                    </div>
                    <motion.button whileHover={{ scale: 1.15, rotate: 90 }} whileTap={{ scale: 0.9 }}
                      onClick={e => { e.stopPropagation(); closePositionById(pos.id, livePrice, livePnl); }}
                      className="p-2 rounded-lg text-red-400/60 hover:text-red-400 transition-all group-hover:bg-red-500/10"
                      style={{ border: '1px solid rgba(239,68,68,0.2)' }}>
                      <X className="w-4 h-4" />
                    </motion.button>
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