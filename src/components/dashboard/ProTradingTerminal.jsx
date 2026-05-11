import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, Lock, BarChart2, BookOpen, List, 
  Menu, X, RefreshCw, ChevronDown, Activity,
  TrendingUp, TrendingDown, Clock, Zap, CheckCircle2, Settings
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

import useLivePrices            from '../terminal/useLivePrices';
import MarketWatch               from '../terminal/MarketWatch';
import TradingViewChart          from '../terminal/TradingViewChart';
import OrderPanel                from '../terminal/OrderPanel';
import ChallengeTrackerDrawer    from '../terminal/ChallengeTrackerDrawer';
import PositionsTable            from '../terminal/PositionsTable';
import FloatingDailyPnL          from '../terminal/FloatingDailyPnL';
import SessionBar                from '../terminal/SessionBar';
import AccountStatusBanner       from '../terminal/AccountStatusBanner';
import PhaseTransitionModal      from '../shared/PhaseTransitionModal';
import { 
  INSTRUMENTS, getAccountRules, calcPnl, calcRequiredMargin, 
  isMarketOpen, getMarketClosedReason 
} from '../terminal/terminalConfig';

const TF_OPTS = [
  { label: '1m',  val: '1'   },
  { label: '5m',  val: '5'   },
  { label: '15m', val: '15'  },
  { label: '1h',  val: '60'  },
  { label: '4h',  val: '240' },
  { label: '1D',  val: 'D'   },
];

// ── Equity/Balance bar at the top ─────────────────────────────────────────────
function TopMetricsBar({ account, balance, equity, floatPnl, usedMargin, freeMargin, marginLevel, rules, accountBlocked, allAccounts, onAccountChange }) {
  const [showDrop, setShowDrop] = useState(false);
  const dropdownRef = useRef(null);
  const switchable = (allAccounts || []).filter(a => ['active','funded','passed'].includes(a.status));
  const pnlColor = floatPnl >= 0 ? '#00f5a0' : '#ef4444';

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDrop(false);
      }
    };
    if (showDrop) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDrop]);

  return (
    <div className="flex-shrink-0 border-b" style={{ background: 'rgba(8,10,20,0.98)', borderColor: 'rgba(255,255,255,0.07)' }}>
      {/* Mobile: 2-row compact layout */}
      <div className="flex md:hidden flex-col">
        {/* Row 1: Account + Balance + Equity */}
        <div className="flex items-center gap-0 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="relative flex items-center px-3 py-2 border-r flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="flex flex-col flex-1">
              <span className="text-[7px] font-mono text-slate-600 uppercase tracking-widest">Acct</span>
              <button onClick={(e) => { e.stopPropagation(); setShowDrop(v => !v); }}
                className="flex items-center gap-0.5 text-[11px] font-mono font-black text-orange-400 text-left">
                {account?.account_id || 'N/A'}
                {switchable.length > 0 && <ChevronDown className="w-2.5 h-2.5" />}
              </button>
            </div>
            {showDrop && (
              <div className="absolute top-full left-0 z-50 mt-1 rounded-xl overflow-hidden shadow-2xl min-w-[180px]"
                style={{ background: '#0d1117', border: '1px solid rgba(255,92,0,0.3)' }}>
                {switchable.map(a => (
                  <button key={a.id} onClick={(e) => { e.stopPropagation(); onAccountChange(a); setShowDrop(false); }}
                    className="w-full text-left px-3 py-2 text-[11px] font-mono hover:bg-orange-500/10 transition-colors border-b border-white/[0.04] last:border-0">
                    <span className="text-orange-400 font-bold">{a.account_id}</span>
                    <span className="text-slate-500 ml-2">${(a.account_size||0).toLocaleString()}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col px-3 py-2 border-r flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            <span className="text-[7px] font-mono text-slate-600 uppercase tracking-widest">Balance</span>
            <span className="text-[11px] font-mono font-bold text-slate-200 whitespace-nowrap">${balance.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
          </div>
          <div className="flex flex-col px-3 py-2 border-r flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            <span className="text-[7px] font-mono text-slate-600 uppercase tracking-widest">Equity</span>
            <span className={`text-[11px] font-mono font-bold whitespace-nowrap ${equity >= balance ? 'text-emerald-400' : 'text-red-400'}`}>${equity.toFixed(2)}</span>
          </div>
          <div className="flex flex-col px-3 py-2 flex-shrink-0">
            <span className="text-[7px] font-mono text-slate-600 uppercase tracking-widest">Float P&L</span>
            <span className="text-[11px] font-mono font-bold whitespace-nowrap" style={{ color: pnlColor }}>{floatPnl >= 0 ? '+' : ''}${floatPnl.toFixed(2)}</span>
          </div>
          {accountBlocked && (
            <div className="ml-auto px-3 flex items-center gap-1.5 flex-shrink-0" style={{ background: 'rgba(239,68,68,0.12)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[8px] font-bold text-red-400 uppercase tracking-wider whitespace-nowrap">Suspended</span>
            </div>
          )}
        </div>
        {/* Row 2: Margin stats */}
        <div className="flex items-center overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {[
            { label: 'Margin', val: `$${usedMargin.toFixed(0)}`, color: 'text-slate-400' },
            { label: 'Free', val: `$${freeMargin.toFixed(0)}`, color: freeMargin < 500 ? 'text-red-400' : 'text-slate-300' },
            { label: 'Lvl', val: `${isFinite(marginLevel) ? marginLevel.toFixed(0) : '∞'}%`, color: marginLevel > 200 || !isFinite(marginLevel) ? 'text-emerald-400' : marginLevel > 100 ? 'text-yellow-400' : 'text-red-400' },
            { label: 'Lev', val: `1:${rules?.leverage || 100}`, color: 'text-orange-400' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-1.5 px-3 py-1.5 border-r flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              <span className="text-[7px] font-mono text-slate-600 uppercase">{item.label}</span>
              <span className={`text-[10px] font-mono font-bold whitespace-nowrap ${item.color}`}>{item.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop: single row */}
      <div className="hidden md:flex items-center overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        <div className="relative flex items-center px-3 py-2 border-r flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }} ref={dropdownRef}>
           <div className="flex flex-col flex-1">
             <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Account</span>
             <button onClick={() => setShowDrop(v => !v)}
               className="flex items-center gap-1 text-[12px] font-mono font-black text-orange-400 hover:text-orange-300 transition-colors text-left">
               {account?.account_id || 'N/A'}
               {switchable.length > 0 && <ChevronDown className="w-3 h-3" />}
             </button>
           </div>
           {showDrop && (
             <div className="absolute top-full left-0 z-50 mt-1 rounded-xl overflow-hidden shadow-2xl min-w-[180px]"
               style={{ background: '#0d1117', border: '1px solid rgba(255,92,0,0.3)' }}>
               {switchable.map(a => (
                 <button key={a.id} onClick={() => { onAccountChange(a); setShowDrop(false); }}
                   className="w-full text-left px-3 py-2 text-[11px] font-mono hover:bg-orange-500/10 transition-colors border-b border-white/[0.04] last:border-0">
                   <span className="text-orange-400 font-bold">{a.account_id}</span>
                   <span className="text-slate-500 ml-2">${(a.account_size||0).toLocaleString()}</span>
                 </button>
               ))}
             </div>
           )}
         </div>
        {[
          { label: 'Balance',   val: `$${balance.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`, color: 'text-slate-200' },
          { label: 'Equity',    val: `$${equity.toFixed(2)}`, color: equity >= balance ? 'text-emerald-400' : 'text-red-400' },
          { label: 'Float P&L', val: `${floatPnl >= 0 ? '+' : ''}$${floatPnl.toFixed(2)}`, color: floatPnl >= 0 ? 'text-emerald-400' : 'text-red-400' },
          { label: 'Margin',    val: `$${usedMargin.toFixed(0)}`, color: 'text-slate-400' },
          { label: 'Free Margin', val: `$${freeMargin.toFixed(0)}`, color: freeMargin < 500 ? 'text-red-400' : 'text-slate-200' },
          { label: 'Margin Lvl', val: `${isFinite(marginLevel) ? marginLevel.toFixed(0) : '∞'}%`, color: marginLevel > 200 || !isFinite(marginLevel) ? 'text-emerald-400' : marginLevel > 100 ? 'text-yellow-400' : 'text-red-400' },
          { label: 'Leverage',  val: `1:${rules?.leverage || 100}`, color: 'text-orange-400' },
        ].map(item => (
          <div key={item.label} className="flex flex-col px-3 py-2 border-r flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-0.5">{item.label}</span>
            <span className={`text-[12px] font-mono font-bold whitespace-nowrap ${item.color}`}>{item.val}</span>
          </div>
        ))}
        {accountBlocked && (
          <div className="ml-auto px-4 flex items-center gap-2 flex-shrink-0" style={{ background: 'rgba(239,68,68,0.12)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[9px] font-bold text-red-400 uppercase tracking-wider whitespace-nowrap">Account Suspended</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Breach overlay ────────────────────────────────────────────────────────────
function BreachBanner({ reason }) {
  return (
    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
      className="overflow-hidden flex-shrink-0"
      style={{ background: 'linear-gradient(90deg, rgba(239,68,68,0.15), rgba(220,38,38,0.08))', borderBottom: '1px solid rgba(239,68,68,0.35)' }}>
      <div className="flex items-center gap-3 px-4 py-2">
        <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-3 h-3 text-red-400" />
        </div>
        <span className="text-[10px] font-bold text-red-300 leading-tight">{reason}</span>
      </div>
    </motion.div>
  );
}

// ── Market closed toast ───────────────────────────────────────────────────────
function MarketClosedToast({ reason, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, []);
  return (
    <motion.div initial={{ opacity: 0, y: -16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -16 }}
      className="absolute top-3 left-1/2 z-50 -translate-x-1/2 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl"
      style={{ background: 'rgba(10,13,24,0.97)', border: '1px solid rgba(245,158,11,0.4)', backdropFilter: 'blur(20px)', maxWidth: '90vw' }}>
      <Clock className="w-4 h-4 text-yellow-400 flex-shrink-0" />
      <div>
        <div className="text-xs font-black text-yellow-300">Market Closed</div>
        <div className="text-[10px] text-yellow-400/70">{reason}</div>
      </div>
      <button onClick={onDismiss} className="ml-2 text-yellow-400/50 hover:text-yellow-400 transition-colors">
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

// ── Load trades from DB ────────────────────────────────────────────────────────
async function loadTrades(accountId) {
  if (!accountId) return { positions: [], pending: [], closed: [] };
  const records = await base44.entities.TradeRecord.filter({ account_id: accountId });
  const positions = records.filter(r => r.status === 'open').map(r => ({
    id: r.id, symbol: r.symbol, type: r.type, orderType: 'MARKET',
    lots: r.lots, entry: r.entry, sl: r.sl || null, tp: r.tp || null,
    margin: r.margin || 0, time: r.open_time || '',
  }));
  const pending = records.filter(r => r.status === 'pending').map(r => ({
    id: r.id, symbol: r.symbol, type: r.type, orderType: r.order_type,
    lots: r.lots, entry: r.entry, sl: r.sl || null, tp: r.tp || null,
    margin: r.margin || 0, time: r.open_time || '',
  }));
  const closed = records.filter(r => r.status === 'closed').slice(0, 100).map(r => ({
    id: r.id, symbol: r.symbol, type: r.type, lots: r.lots,
    entry: r.entry, close: r.close, pnl: r.pnl || 0,
    reason: r.close_reason || 'Manual', closeTime: r.close_time || '',
  }));
  return { positions, pending, closed };
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ProTradingTerminal({ account: initialAccount, allAccounts = [], onAccountChange }) {
  const [account, setAccount] = useState(initialAccount);
  useEffect(() => { if (initialAccount) setAccount(initialAccount); }, [initialAccount?.id]);

  const isActive = !!(account && ['active', 'funded', 'passed'].includes(account.status));
  const prices   = useLivePrices();
  const rules    = getAccountRules(account);

  const [selectedSymbol, setSelectedSymbol] = useState('EUR/USD');
  const [timeframe,      setTimeframe]      = useState('60');
  const [positions,      setPositions]      = useState([]);
  const [pendingOrders,  setPendingOrders]  = useState([]);
  const [closedTrades,   setClosedTrades]   = useState([]);
  const [accountBlocked, setAccountBlocked] = useState(account?.status === 'failed');
  const [breachReason,   setBreachReason]   = useState('');
  const [sessionBalance, setSessionBalance] = useState(account?.balance || account?.account_size || 100000);
  const [dailyOpenBalance, setDailyOpenBalance] = useState(account?.balance || account?.account_size || 100000);
  const [marketClosedMsg, setMarketClosedMsg] = useState('');
  const [tradesLoaded,   setTradesLoaded]   = useState(false);
  const [phaseModal,     setPhaseModal]     = useState(null);
  const [mobilePanel,    setMobilePanel]    = useState('chart');
  const [lots,           setLots]           = useState(0.01);
  const lastResetDate = useRef(null);

  const accountId   = account?.id;
  const accountSize = account?.account_size || 100000;

  // Load trades
  useEffect(() => {
    if (!accountId || tradesLoaded) return;
    loadTrades(accountId).then(({ positions: pos, pending, closed }) => {
      setPositions(pos); setPendingOrders(pending); setClosedTrades(closed);
      setTradesLoaded(true);
    }).catch(() => setTradesLoaded(true));
  }, [accountId, tradesLoaded]);

  // Restore balance
  useEffect(() => {
    if (account?.balance) {
      setSessionBalance(account.balance);
      setDailyOpenBalance(prev => tradesLoaded ? prev : (account.balance || account?.account_size || 100000));
    }
  }, [account?.balance]);

  // Daily DD reset at 23:00 UTC
  useEffect(() => {
    const checkReset = () => {
      const now = new Date();
      const dateKey = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}`;
      if (now.getUTCHours() === 23 && now.getUTCMinutes() === 0 && lastResetDate.current !== dateKey) {
        lastResetDate.current = dateKey;
        setDailyOpenBalance(sessionBalance);
        if (accountId) base44.entities.ChallengeAccount.update(accountId, { daily_pnl: 0, daily_drawdown_used: 0 }).catch(() => {});
      }
    };
    const t = setInterval(checkReset, 30000);
    return () => clearInterval(t);
  }, [sessionBalance, accountId]);

  // Live metrics
  const floatPnl = positions.reduce((s, pos) => {
    const p = prices[pos.symbol];
    const cp = p ? (pos.type === 'BUY' ? p.bid : p.ask) : pos.entry;
    return s + calcPnl(pos, cp);
  }, 0);
  const equity      = sessionBalance + floatPnl;
  const usedMargin  = positions.reduce((s, p) => s + (p.margin || 0), 0);
  const freeMargin  = equity - usedMargin;
  const marginLevel = usedMargin > 0 ? (equity / usedMargin) * 100 : Infinity;

  // Breach engine
  useEffect(() => {
    if (accountBlocked || !tradesLoaded) return;
    const dailyDD = ((dailyOpenBalance - equity) / accountSize) * 100;
    const maxDD   = ((accountSize - equity) / accountSize) * 100;
    if (dailyDD < 0 && maxDD < 0) return;

    let breached = false, reason = '';
    if (dailyDD >= rules.dailyDDLimit) {
      breached = true; reason = `DAILY DRAWDOWN LIMIT: ${dailyDD.toFixed(2)}% ≥ ${rules.dailyDDLimit}% — Trading Disabled`;
    } else if (maxDD >= rules.maxDDLimit) {
      breached = true; reason = `MAX DRAWDOWN LIMIT: ${maxDD.toFixed(2)}% ≥ ${rules.maxDDLimit}% — Account Failed`;
    } else if (marginLevel <= rules.stopOutLevel && positions.length > 0) {
      breached = true; reason = `STOP OUT: Margin level ${marginLevel.toFixed(1)}% ≤ ${rules.stopOutLevel}%`;
    }

    if (breached) {
      setAccountBlocked(true); setBreachReason(reason);
      setPositions(prev => {
        let running = sessionBalance;
        const newClosed = prev.map(pos => {
          const p = prices[pos.symbol];
          const cp = p ? (pos.type === 'BUY' ? p.bid : p.ask) : pos.entry;
          const pnl = calcPnl(pos, cp);
          running = parseFloat((running + pnl).toFixed(2));
          if (pos.id && typeof pos.id === 'string' && pos.id.length > 10)
            base44.entities.TradeRecord.update(pos.id, { status: 'closed', close: cp, pnl, close_reason: 'DD Breach', close_time: new Date().toLocaleTimeString() }).catch(() => {});
          return { ...pos, close: cp, pnl, closeTime: new Date().toLocaleTimeString(), reason: 'DD Breach' };
        });
        setSessionBalance(running);
        setClosedTrades(ct => [...newClosed, ...ct.slice(0, 199 - newClosed.length)]);
        return [];
      });
      setPendingOrders(prev => { prev.forEach(o => { if (o.id?.length > 10) base44.entities.TradeRecord.update(o.id, { status: 'closed', close_reason: 'DD Breach' }).catch(() => {}); }); return []; });
      if (accountId) base44.entities.ChallengeAccount.update(accountId, { status: 'failed', equity, balance: sessionBalance }).catch(() => {});
    }

    // Phase transition
    const profitPct = ((sessionBalance - accountSize) / accountSize) * 100;
    const tradingDays = account?.trading_days || 0;
    if (account?.phase === 'phase1' && account?.status === 'active' && !accountBlocked && rules?.profitTarget > 0 && profitPct >= rules.profitTarget && tradingDays >= (rules?.minTradingDays || 4)) {
      setPhaseModal('phase2');
      if (accountId) base44.entities.ChallengeAccount.update(accountId, { status: 'passed' }).catch(() => {});
    }
    if (account?.phase === 'phase2' && account?.status === 'active' && !accountBlocked && rules?.profitTarget > 0 && profitPct >= rules.profitTarget && tradingDays >= (rules?.minTradingDays || 4)) {
      setPhaseModal('funded');
      if (accountId) base44.entities.ChallengeAccount.update(accountId, { status: 'passed' }).catch(() => {});
    }
  }, [equity, dailyOpenBalance, accountSize, marginLevel, positions.length, tradesLoaded, accountBlocked]);

  // SL/TP
  useEffect(() => {
    if (positions.length === 0) return;
    positions.forEach(pos => {
      const p = prices[pos.symbol];
      if (!p?.bid) return;
      const cp = pos.type === 'BUY' ? p.bid : p.ask;
      const slHit = pos.sl && (pos.type === 'BUY' ? cp <= pos.sl : cp >= pos.sl);
      const tpHit = pos.tp && (pos.type === 'BUY' ? cp >= pos.tp : cp <= pos.tp);
      if (slHit || tpHit) closePosition(pos.id, cp, calcPnl(pos, cp), slHit ? 'SL' : 'TP');
    });
  }, [prices]);

  // Pending order trigger
  useEffect(() => {
    if (pendingOrders.length === 0) return;
    pendingOrders.forEach(order => {
      const p = prices[order.symbol];
      if (!p?.bid) return;
      const cp = order.type === 'BUY' ? p.ask : p.bid;
      const ot = order.orderType || '';
      const triggered = (ot === 'BUY_LIMIT' && cp <= order.entry) || (ot === 'BUY_STOP' && cp >= order.entry) || (ot === 'SELL_LIMIT' && cp >= order.entry) || (ot === 'SELL_STOP' && cp <= order.entry);
      if (triggered) {
        const margin = calcRequiredMargin(order.symbol, order.lots, rules.leverage, cp);
        setPositions(prev => [...prev, { ...order, orderType: 'MARKET', margin, entry: cp }]);
        setPendingOrders(prev => prev.filter(o => o.id !== order.id));
        if (order.id?.length > 10) base44.entities.TradeRecord.update(order.id, { status: 'open', entry: cp, margin }).catch(() => {});
      }
    });
  }, [prices]);

  const syncDB = useCallback((newBalance, closedArr, openArr, currentEquity) => {
    if (!accountId) return;
    const totalTrades = closedArr.length;
    const wins = closedArr.filter(t => t.pnl > 0).length;
    base44.entities.ChallengeAccount.update(accountId, {
      balance: newBalance, equity: currentEquity,
      pnl: parseFloat((newBalance - accountSize).toFixed(2)),
      win_rate: totalTrades > 0 ? parseFloat(((wins / totalTrades) * 100).toFixed(1)) : 0,
      total_trades: totalTrades,
      daily_drawdown_used: parseFloat((Math.max(0, (dailyOpenBalance - currentEquity) / accountSize * 100)).toFixed(2)),
      max_drawdown_used: parseFloat((Math.max(0, (accountSize - currentEquity) / accountSize * 100)).toFixed(2)),
      profit_target_progress: parseFloat((Math.max(0, (newBalance - accountSize) / accountSize * 100)).toFixed(2)),
    }).catch(() => {});
  }, [accountId, accountSize, dailyOpenBalance]);

  const closePosition = useCallback((id, cp, pnl, reason = 'Manual') => {
    setPositions(prev => {
      const pos = prev.find(p => p.id === id);
      if (!pos) return prev;
      const newBalance = parseFloat((sessionBalance + pnl).toFixed(2));
      setSessionBalance(newBalance);

      // Partial close: if pnl was computed on partial lots (reason === 'Partial')
      // we still close the full position DB record but add a note
      if (id && typeof id === 'string' && id.length > 10) {
        base44.entities.TradeRecord.update(id, {
          status: 'closed', close: cp, pnl,
          close_reason: reason,
          close_time: new Date().toLocaleTimeString(),
        }).catch(() => {});
      }
      setClosedTrades(ct => {
        const updated = [{ ...pos, close: cp, pnl, closeTime: new Date().toLocaleTimeString(), reason }, ...ct.slice(0, 199)];
        setTimeout(() => syncDB(newBalance, updated, prev.filter(p => p.id !== id), newBalance + floatPnl - pnl), 100);
        return updated;
      });
      return prev.filter(p => p.id !== id);
    });
  }, [sessionBalance, floatPnl, syncDB]);

  const handleBulkClose = (type) => {
    positions.forEach(pos => {
      const p = prices[pos.symbol];
      const cp = p ? (pos.type === 'BUY' ? p.bid : p.ask) : pos.entry;
      const pnl = calcPnl(pos, cp);
      if (type === 'all' || (type === 'profit' && pnl > 0) || (type === 'loss' && pnl <= 0)) closePosition(pos.id, cp, pnl, 'Manual');
    });
  };

  const handlePlaceOrder = useCallback(async (order) => {
    if (accountBlocked) return;
    if (!isMarketOpen(order.symbol)) {
      setMarketClosedMsg(getMarketClosedReason(order.symbol) || 'Market is closed');
      return;
    }
    if (order.orderType === 'MARKET') {
      let dbId = null;
      if (accountId) {
        const user = await base44.auth.me().catch(() => null);
        const rec = await base44.entities.TradeRecord.create({ account_id: accountId, user_email: user?.email || '', trade_id: `TRD-${Date.now()}`, symbol: order.symbol, type: order.type, order_type: 'MARKET', lots: order.lots, entry: order.entry, sl: order.sl || null, tp: order.tp || null, margin: order.margin || 0, status: 'open', open_time: new Date().toLocaleTimeString() }).catch(() => null);
        dbId = rec?.id;
      }
      setPositions(prev => [...prev, { ...order, id: dbId || (Date.now() + Math.random()) }]);
    } else {
      let dbId = null;
      if (accountId) {
        const user = await base44.auth.me().catch(() => null);
        const rec = await base44.entities.TradeRecord.create({ account_id: accountId, user_email: user?.email || '', trade_id: `TRD-${Date.now()}`, symbol: order.symbol, type: order.type, order_type: order.orderType, lots: order.lots, entry: order.entry, sl: order.sl || null, tp: order.tp || null, margin: order.margin || 0, status: 'pending', open_time: new Date().toLocaleTimeString() }).catch(() => null);
        dbId = rec?.id;
      }
      setPendingOrders(prev => [...prev, { ...order, id: dbId || (Date.now() + Math.random()) }]);
    }
  }, [accountBlocked, accountId]);

  // ── Locked ────────────────────────────────────────────────────────────────
  if (!isActive) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8" style={{ background: '#080b15' }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'rgba(255,92,0,0.08)', border: '1px solid rgba(255,92,0,0.2)' }}>
          <Lock className="w-7 h-7 text-orange-500/40" />
        </div>
        <div className="text-xl font-black text-white/80 mb-1">Terminal Locked</div>
        <div className="text-sm text-slate-500 mb-1">Active challenge account required</div>
        <div className="text-[10px] font-mono text-slate-600">Status: {account?.status || 'No account'}</div>
      </div>
    );
  }

  const currentPrice = prices[selectedSymbol];
  const selected = INSTRUMENTS.find(i => i.symbol === selectedSymbol);
  const isUp = (currentPrice?.pct || 0) >= 0;

  const mobileTabs = [
    { id: 'chart',     icon: BarChart2, label: 'Chart' },
    { id: 'order',     icon: BookOpen,  label: 'Trade' },
    { id: 'positions', icon: List,      label: `${positions.length} Open` },
    { id: 'watch',     icon: Activity,  label: 'Watch' },
    { id: 'tracker',   icon: TrendingUp, label: 'Goals' },
  ];

  return (
    <div className="flex flex-col h-full min-h-0" style={{ background: '#080b15', fontFamily: "'JetBrains Mono', monospace" }}>

      {/* Phase Modal */}
      <AnimatePresence>
        {phaseModal && <PhaseTransitionModal type={phaseModal} account={account} onClose={() => setPhaseModal(null)} />}
      </AnimatePresence>

      {/* Market Closed Toast */}
      <AnimatePresence>
        {marketClosedMsg && (
          <div className="relative z-50">
            <MarketClosedToast reason={marketClosedMsg} onDismiss={() => setMarketClosedMsg('')} />
          </div>
        )}
      </AnimatePresence>

      {/* Top Metrics Bar */}
      <TopMetricsBar
        account={account} balance={sessionBalance} equity={equity}
        floatPnl={floatPnl} usedMargin={usedMargin} freeMargin={freeMargin}
        marginLevel={isFinite(marginLevel) ? marginLevel : 9999}
        rules={rules} accountBlocked={accountBlocked}
        allAccounts={allAccounts}
        onAccountChange={(a) => {
          if (a.id !== account?.id) {
            setAccount(a);
            setPositions([]);
            setPendingOrders([]);
            setClosedTrades([]);
            setSessionBalance(a.balance || a.account_size || 100000);
            setDailyOpenBalance(a.balance || a.account_size || 100000);
            setTradesLoaded(false);
            setAccountBlocked(a.status === 'failed');
            setBreachReason('');
            setSelectedSymbol('EUR/USD');
            setTimeframe('60');
            onAccountChange?.(a);
          }
        }}
      />

      {/* Session + Status */}
      <div className="hidden md:block flex-shrink-0">
        <SessionBar />
      </div>
      <AccountStatusBanner account={account} rules={rules} />

      {/* Breach Banner */}
      <AnimatePresence>
        {accountBlocked && breachReason && <BreachBanner reason={breachReason} />}
      </AnimatePresence>

      {/* ═══ DESKTOP ═══════════════════════════════════════════════════════════ */}
      <div className="hidden md:flex flex-col flex-1 overflow-hidden relative">
        {/* Floating Daily P&L box — visible when positions are open */}
        <FloatingDailyPnL
          floatPnl={floatPnl}
          dailyClosedPnl={sessionBalance - (account?.balance || accountSize)}
          accountSize={accountSize}
          dailyDDLimit={rules?.dailyDDLimit || 5}
          dailyOpenBalance={dailyOpenBalance}
          equity={equity}
          visible={positions.length > 0}
        />

        <div className="flex flex-1 overflow-hidden flex-col">
          {/* Top row: Market Watch | Chart Area + Order Panel — 25% height */}
          <div className="flex min-h-0 overflow-hidden" style={{ height: '25%', borderColor: 'rgba(255,255,255,0.06)' }}>
            {/* Left: Market Watch */}
            <div className="border-r flex-shrink-0" style={{ width: '15%', borderColor: 'rgba(255,255,255,0.06)' }}>
              <MarketWatch prices={prices} selectedSymbol={selectedSymbol} onSelect={setSelectedSymbol} />
            </div>

            {/* Center: Chart (toolbar + chart) — constrained height */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden max-h-full">
              {/* Chart toolbar — compact */}
              <div className="flex items-center gap-2 px-3 py-1.5 border-b flex-shrink-0"
                style={{ background: '#0a0d18', borderColor: 'rgba(255,255,255,0.06)' }}>
                
                {/* Symbol info */}
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <span className="text-[13px] font-black text-white">{selectedSymbol}</span>
                    <span className="text-[8px] text-slate-500 uppercase tracking-wider">{selected?.description}</span>
                  </div>
                  {currentPrice?.bid && (
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-black text-orange-400">{currentPrice.bid.toFixed(selected?.digits)}</span>
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${isUp ? 'text-emerald-400' : 'text-red-400'}`}
                        style={{ background: isUp ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }}>
                        {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {isUp ? '+' : ''}{(currentPrice.pct || 0).toFixed(2)}%
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">
                        <span className="text-red-400/80">{currentPrice.bid?.toFixed(selected?.digits)}</span>
                        {' / '}
                        <span className="text-emerald-400/80">{currentPrice.ask?.toFixed(selected?.digits)}</span>
                      </div>
                    </div>
                  )}
                  {!isMarketOpen(selectedSymbol) && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold text-yellow-400"
                      style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}>
                      <Clock className="w-2.5 h-2.5" /> Closed
                    </span>
                  )}
                </div>

                {/* Timeframe selector */}
                <div className="ml-auto flex items-center gap-0.5 p-0.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  {TF_OPTS.map(tf => (
                    <button key={tf.val} onClick={() => setTimeframe(tf.val)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${timeframe === tf.val ? 'text-orange-400' : 'text-slate-500 hover:text-slate-300'}`}
                      style={timeframe === tf.val ? { background: 'rgba(255,92,0,0.2)' } : {}}>
                      {tf.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chart — compressed to 48% height */}
              <div className="min-h-0 overflow-hidden" style={{ background: '#070b14', height: '48%', width: '100%' }}>
                <TradingViewChart symbol={selectedSymbol} timeframe={timeframe} />
              </div>
            </div>

            {/* Right: Order Panel */}
            <div className="flex-shrink-0 border-l flex flex-col" style={{ width: '320px', borderColor: 'rgba(255,255,255,0.06)' }}>
              <OrderPanel
                symbol={selectedSymbol} prices={prices} account={account} rules={rules}
                equity={equity} usedMargin={usedMargin} onPlaceOrder={handlePlaceOrder}
                accountBlocked={accountBlocked} marketOpen={isMarketOpen(selectedSymbol)}
              />
            </div>
          </div>

          {/* Bottom row: Full-width Positions Table — 75% height */}
          <div className="flex-1 overflow-hidden" style={{ marginTop: '-4px', height: '75%' }}>
            <PositionsTable
              positions={positions} pendingOrders={pendingOrders} closedTrades={closedTrades}
              prices={prices} onClose={closePosition}
              onCancelPending={(id) => { base44.entities.TradeRecord.update(id, { status: 'closed', close_reason: 'Cancelled' }).catch(() => {}); setPendingOrders(prev => prev.filter(o => o.id !== id)); }}
              onBulkClose={handleBulkClose}
            />
          </div>
        </div>
      </div>

      {/* ── Challenge Tracker (desktop) ── */}
      <div className="hidden md:block flex-shrink-0">
        <ChallengeTrackerDrawer account={account} rules={rules} balance={sessionBalance} equity={equity} dailyOpenBalance={dailyOpenBalance} />
      </div>

      {/* ═══ MOBILE ════════════════════════════════════════════════════════════ */}
      <div className="flex md:hidden flex-col flex-1 min-h-0 safe-top safe-bottom overflow-hidden">
        {/* Top: Symbol info */}
        <div className="flex-shrink-0 px-3 py-2 border-b flex items-center justify-between" style={{ background: 'rgba(6,8,16,0.98)', borderColor: 'rgba(255,92,0,0.15)' }}>
          <div>
            <div className="text-[10px] font-mono text-slate-500 uppercase">Symbol</div>
            <span className="text-sm font-black text-white">{selectedSymbol}</span>
          </div>
          {currentPrice?.bid && (
            <div className="text-right">
              <div className="text-xs font-black text-orange-400">{currentPrice.bid.toFixed(2)}</div>
              <div className={`text-[10px] font-mono ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>{isUp ? '+' : ''}{(currentPrice.pct || 0).toFixed(2)}%</div>
            </div>
          )}
        </div>

        {/* SELL/BUY Price Row with Lots Control */}
        <div className="flex-shrink-0 flex items-center h-12" style={{ background: 'rgba(6,8,16,0.98)' }}>
          <div className="flex-1 flex flex-col items-center justify-center h-full py-1" style={{ background: 'linear-gradient(135deg, #0066ff, #0052cc)' }}>
            <div className="text-[9px] font-mono text-white/80">SELL</div>
            <div className="text-sm font-black text-white">{currentPrice?.bid?.toFixed(2) || '0.00'}</div>
          </div>
          <div className="flex flex-col items-center justify-center px-3 py-2 gap-1" style={{ background: '#000' }}>
            <button onClick={() => setLots(Math.max(0.01, lots - 0.01))} className="text-white/60 hover:text-white">
              <ChevronDown className="w-3 h-3" />
            </button>
            <span className="text-xs font-bold text-white w-8 text-center">{lots.toFixed(2)}</span>
            <button onClick={() => setLots(lots + 0.01)} className="text-white/60 hover:text-white">
              <ChevronDown className="w-3 h-3 rotate-180" />
            </button>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center h-full py-1" style={{ background: 'linear-gradient(135deg, #00b981, #059669)' }}>
            <div className="text-[9px] font-mono text-white/80">BUY</div>
            <div className="text-sm font-black text-white">{currentPrice?.ask?.toFixed(2) || '0.00'}</div>
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="flex-shrink-0 flex border-b" style={{ background: 'rgba(6,8,16,0.98)', borderColor: 'rgba(255,92,0,0.15)' }}>
          {mobileTabs.map(tab => {
            const Icon = tab.icon;
            const active = mobilePanel === tab.id;
            return (
              <button key={tab.id} onClick={() => setMobilePanel(tab.id)}
                className={`flex-1 px-2 py-2 text-[10px] font-mono uppercase tracking-wider transition-all border-b-2 ${
                  active ? 'text-orange-400 border-orange-400' : 'text-slate-500 border-transparent'
                }`}>
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content area */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <AnimatePresence mode="wait">
            {mobilePanel === 'chart' && (
              <motion.div key="chart" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                <TradingViewChart symbol={selectedSymbol} timeframe={timeframe} />
              </motion.div>
            )}
            {mobilePanel === 'order' && (
              <motion.div key="order" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full overflow-y-auto">
                <OrderPanel
                  symbol={selectedSymbol} prices={prices} account={account} rules={rules}
                  equity={equity} usedMargin={usedMargin} onPlaceOrder={handlePlaceOrder}
                  accountBlocked={accountBlocked} marketOpen={isMarketOpen(selectedSymbol)}
                />
              </motion.div>
            )}
            {mobilePanel === 'positions' && (
              <motion.div key="positions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full overflow-y-auto">
                <PositionsTable
                  positions={positions} pendingOrders={pendingOrders} closedTrades={closedTrades}
                  prices={prices} onClose={closePosition}
                  onCancelPending={(id) => { base44.entities.TradeRecord.update(id, { status: 'closed', close_reason: 'Cancelled' }).catch(() => {}); setPendingOrders(prev => prev.filter(o => o.id !== id)); }}
                  onBulkClose={handleBulkClose}
                />
              </motion.div>
            )}
            {mobilePanel === 'watch' && (
              <motion.div key="watch" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full overflow-y-auto">
                <MarketWatch prices={prices} selectedSymbol={selectedSymbol} onSelect={setSelectedSymbol} />
              </motion.div>
            )}
            {mobilePanel === 'tracker' && (
              <motion.div key="tracker" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full overflow-y-auto">
                <ChallengeTrackerDrawer account={account} rules={rules} balance={sessionBalance} equity={equity} dailyOpenBalance={dailyOpenBalance} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}