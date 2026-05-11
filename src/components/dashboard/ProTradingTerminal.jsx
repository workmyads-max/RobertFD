import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Lock, BarChart2, BookOpen, List, Menu, X, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import DailyResetTimer from '../shared/DailyResetTimer';
import PhaseTransitionModal from '../shared/PhaseTransitionModal';

import useLivePrices            from '../terminal/useLivePrices';
import MarketWatch               from '../terminal/MarketWatch';
import TradingViewChart          from '../terminal/TradingViewChart';
import OrderPanel                from '../terminal/OrderPanel';
import ChallengeTracker          from '../terminal/ChallengeTracker';
import ChallengeTrackerDrawer    from '../terminal/ChallengeTrackerDrawer';
import PositionsTable            from '../terminal/PositionsTable';
import SessionBar                from '../terminal/SessionBar';
import { INSTRUMENTS, getAccountRules, calcPnl, calcRequiredMargin, isMarketOpen, getMarketClosedReason, calcTrailingDD } from '../terminal/terminalConfig';

const TF_OPTS = [
  { label: '1m', val: '1' }, { label: '5m', val: '5' }, { label: '15m', val: '15' },
  { label: '1h', val: '60' }, { label: '4h', val: '240' }, { label: '1D', val: 'D' },
];

// ── Account bar (scrollable on mobile) ───────────────────────────────────────
function AccountBar({ account, balance, equity, floatPnl, usedMargin, freeMargin, marginLevel, rules, accountBlocked, allAccounts, onAccountChange }) {
  const [showDropdown, setShowDropdown] = React.useState(false);
  const switchableAccounts = (allAccounts || []).filter(a => ['active','funded','passed'].includes(a.status) && a.id !== account?.id);

  const items = [
    { label: 'Account',   val: account?.account_id || 'N/A',   color: 'text-primary font-black' },
    { label: 'Balance',   val: `$${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: 'text-foreground' },
    { label: 'Equity',    val: `$${equity.toFixed(2)}`,          color: equity >= balance ? 'text-emerald-400' : 'text-red-400' },
    { label: 'Float P&L', val: `${floatPnl >= 0 ? '+' : ''}$${floatPnl.toFixed(2)}`, color: floatPnl >= 0 ? 'text-emerald-400' : 'text-red-400' },
    { label: 'Margin',    val: `$${usedMargin.toFixed(0)}`,      color: 'text-muted-foreground' },
    { label: 'Free Mgn',  val: `$${freeMargin.toFixed(0)}`,      color: freeMargin < 500 ? 'text-red-400' : 'text-foreground' },
    { label: 'Mgn Lvl',   val: `${isFinite(marginLevel) ? marginLevel.toFixed(0) : '∞'}%`, color: marginLevel > 200 || !isFinite(marginLevel) ? 'text-emerald-400' : marginLevel > 100 ? 'text-yellow-400' : 'text-red-400' },
    { label: 'Leverage',  val: `1:${rules?.leverage || 100}`,    color: 'text-primary' },
  ];

  return (
    <div className="flex items-stretch border-b border-white/[0.08] overflow-x-auto flex-shrink-0 relative"
      style={{ background: 'rgba(8,12,24,0.99)', scrollbarWidth: 'none' }}>
      {items.map((item, idx) => (
        item.label === 'Account' && switchableAccounts.length > 0 ? (
          <div key={item.label} className="relative flex flex-col px-2 md:px-3 py-2 md:py-2.5 border-r border-white/[0.04] flex-shrink-0 min-w-[64px]">
            <span className="text-[8px] md:text-[9px] font-mono text-slate-500 uppercase tracking-wider mb-0.5">{item.label}</span>
            <button onClick={() => setShowDropdown(v => !v)}
              className="text-[11px] md:text-[13px] font-mono font-black text-primary whitespace-nowrap flex items-center gap-1 hover:text-orange-300 transition-colors">
              {item.val} <span className="text-[9px]">▾</span>
            </button>
            {showDropdown && (
              <div className="absolute top-full left-0 z-50 mt-1 min-w-[160px] rounded-xl overflow-hidden shadow-2xl"
                style={{ background: 'rgba(8,12,24,0.99)', border: '1px solid rgba(255,92,0,0.3)' }}>
                {switchableAccounts.map(a => (
                  <button key={a.id} onClick={() => { onAccountChange(a); setShowDropdown(false); }}
                    className="w-full text-left px-3 py-2 text-[11px] font-mono text-slate-300 hover:text-white hover:bg-primary/10 transition-colors border-b border-white/[0.04] last:border-0">
                    <span className="font-bold text-primary">{a.account_id}</span>
                    <span className="text-slate-500 ml-1">${(a.account_size||0).toLocaleString()}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div key={item.label} className="flex flex-col px-2 md:px-3 py-2 md:py-2.5 border-r border-white/[0.04] flex-shrink-0 min-w-[64px]">
            <span className="text-[8px] md:text-[9px] font-mono text-slate-500 uppercase tracking-wider mb-0.5">{item.label}</span>
            <span className={`text-[11px] md:text-[13px] font-mono font-bold whitespace-nowrap ${item.color}`}>{item.val}</span>
          </div>
        )
      ))}
      {accountBlocked && (
        <div className="ml-auto flex items-center px-3 bg-red-900/30 border-l border-red-500/30 flex-shrink-0">
          <span className="text-[9px] font-bold text-red-400 animate-pulse whitespace-nowrap">⚠ SUSPENDED</span>
        </div>
      )}
    </div>
  );
}

function BreachBanner({ reason }) {
  return (
    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
      className="overflow-hidden flex-shrink-0"
      style={{ background: 'rgba(239,68,68,0.14)', borderBottom: '1px solid rgba(239,68,68,0.4)' }}>
      <div className="flex items-center gap-2 px-3 py-2">
        <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
        <span className="text-[10px] md:text-xs font-bold text-red-400 leading-tight">{reason}</span>
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
    <motion.div
      initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      className="absolute top-16 left-1/2 z-50 -translate-x-1/2 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl"
      style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', backdropFilter: 'blur(20px)', maxWidth: '90vw' }}>
      <span className="text-yellow-400 text-lg flex-shrink-0">🔒</span>
      <div>
        <div className="text-xs font-black text-yellow-300">Market Closed</div>
        <div className="text-[10px] text-yellow-400/80">{reason}</div>
      </div>
      <button onClick={onDismiss} className="ml-2 text-yellow-400/60 hover:text-yellow-400"><X className="w-3.5 h-3.5" /></button>
    </motion.div>
  );
}

// ── Load/save trades from entity DB ──────────────────────────────────────────
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

export default function ProTradingTerminal({ account: initialAccount, allAccounts = [] }) {
  const [account, setAccount] = React.useState(initialAccount);

  // Keep in sync if parent updates
  React.useEffect(() => { if (initialAccount) setAccount(initialAccount); }, [initialAccount?.id]);
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
  // dailyOpenBalance is the balance at the START of the trading day — fixed reference for daily DD
  const [dailyOpenBalance, setDailyOpenBalance] = useState(account?.balance || account?.account_size || 100000);
  const [marketClosedMsg, setMarketClosedMsg] = useState('');
  const [tradesLoaded,   setTradesLoaded]   = useState(false);
  const [phaseModal,     setPhaseModal]     = useState(null); // 'phase2' | 'funded'
  const lastResetDate = useRef(null);

  // Mobile layout state
  const [mobilePanel, setMobilePanel] = useState('chart'); // chart | order | positions | watch | tracker
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const accountId   = account?.id;
  const accountSize = account?.account_size || 100000;

  // ── Load persistent trades on mount ──────────────────────────────────────
  useEffect(() => {
    if (!accountId || tradesLoaded) return;
    loadTrades(accountId).then(({ positions: pos, pending, closed }) => {
      setPositions(pos);
      setPendingOrders(pending);
      setClosedTrades(closed);
      setTradesLoaded(true);
    }).catch(() => setTradesLoaded(true));
  }, [accountId, tradesLoaded]);

  // ── Restore balance from account entity ──────────────────────────────────
  useEffect(() => {
    if (account?.balance) {
      setSessionBalance(account.balance);
      // Only reset daily open balance if we haven't loaded trades yet (fresh mount)
      setDailyOpenBalance(prev => tradesLoaded ? prev : (account.balance || account?.account_size || 100000));
    }
  }, [account?.balance]);

  // ── Daily DD reset at 23:00 UTC (= 3:00 AM GMT+4) ────────────────────────
  useEffect(() => {
    const checkReset = () => {
      const now = new Date();
      const dateKey = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}`;
      if (now.getUTCHours() === 23 && now.getUTCMinutes() === 0) {
        if (lastResetDate.current !== dateKey) {
          lastResetDate.current = dateKey;
          // Snapshot today's opening balance for tomorrow's DD reference
          setDailyOpenBalance(sessionBalance);
          // Reset daily_drawdown_used in DB
          if (accountId) {
            base44.entities.ChallengeAccount.update(accountId, { daily_pnl: 0, daily_drawdown_used: 0 }).catch(() => {});
          }
        }
      }
    };
    const t = setInterval(checkReset, 30000);
    return () => clearInterval(t);
  }, [sessionBalance, accountId]);

  // ── Live derived values ───────────────────────────────────────────────────
  const floatPnl = positions.reduce((s, pos) => {
    const p  = prices[pos.symbol];
    const cp = p ? (pos.type === 'BUY' ? p.bid : p.ask) : pos.entry;
    return s + calcPnl(pos, cp);
  }, 0);
  const equity      = sessionBalance + floatPnl;
  const usedMargin  = positions.reduce((s, p) => s + (p.margin || 0), 0);
  const freeMargin  = equity - usedMargin;
  const marginLevel = usedMargin > 0 ? (equity / usedMargin) * 100 : Infinity;

  // ── Breach engine (FTMO-style) ────────────────────────────────────────────
  // Daily DD = drop from today's OPENING balance (not the original account size)
  // Max DD   = drop from original account size (absolute floor)
  useEffect(() => {
    if (accountBlocked || !tradesLoaded) return;

    // FTMO definition:
    // Daily DD % = (dailyOpenBalance - currentEquity) / accountSize * 100
    // Max DD %   = (accountSize - currentEquity) / accountSize * 100
    const dailyDD = ((dailyOpenBalance - equity) / accountSize) * 100;
    const maxDD   = ((accountSize - equity) / accountSize) * 100;

    // Only trigger if equity has actually dropped (positive values = loss)
    if (dailyDD < 0 && maxDD < 0) return; // equity is higher than reference — no breach

    let breached = false, reason = '';

    if (dailyDD >= rules.dailyDDLimit) {
      breached = true;
      reason = `DAILY DRAWDOWN LIMIT BREACHED: ${dailyDD.toFixed(2)}% ≥ ${rules.dailyDDLimit}% — Trading Disabled for today`;
    } else if (maxDD >= rules.maxDDLimit) {
      breached = true;
      reason = `MAX DRAWDOWN LIMIT BREACHED: ${maxDD.toFixed(2)}% ≥ ${rules.maxDDLimit}% — Account Failed`;
    } else if (marginLevel <= rules.stopOutLevel && positions.length > 0) {
      breached = true;
      reason = `STOP OUT: Margin level ${marginLevel.toFixed(1)}% ≤ ${rules.stopOutLevel}%`;
    }

    if (breached) {
      setAccountBlocked(true);
      setBreachReason(reason);

      // ── Force-close ALL open positions at current market price ────────────
      setPositions(prev => {
        if (prev.length === 0) return prev;
        let runningBalance = sessionBalance;
        const newClosed = prev.map(pos => {
          const p  = prices[pos.symbol];
          const cp = p ? (pos.type === 'BUY' ? p.bid : p.ask) : pos.entry;
          const pnl = calcPnl(pos, cp);
          runningBalance = parseFloat((runningBalance + pnl).toFixed(2));
          // Persist each close to DB
          if (pos.id && typeof pos.id === 'string' && pos.id.length > 10) {
            base44.entities.TradeRecord.update(pos.id, {
              status: 'closed', close: cp, pnl,
              close_reason: 'DD Breach — Force Close',
              close_time: new Date().toLocaleTimeString(),
            }).catch(() => {});
          }
          return { ...pos, close: cp, pnl, closeTime: new Date().toLocaleTimeString(), reason: 'DD Breach — Force Close' };
        });
        setSessionBalance(runningBalance);
        setClosedTrades(ct => [...newClosed, ...ct.slice(0, 199 - newClosed.length)]);
        return [];
      });

      // Also cancel all pending orders
      setPendingOrders(prev => {
        prev.forEach(o => {
          if (o.id && typeof o.id === 'string' && o.id.length > 10) {
            base44.entities.TradeRecord.update(o.id, { status: 'closed', close_reason: 'DD Breach — Cancelled' }).catch(() => {});
          }
        });
        return [];
      });

      if (accountId) {
        base44.entities.ChallengeAccount.update(accountId, {
          status: 'failed', equity, balance: sessionBalance,
          pnl: parseFloat((sessionBalance - accountSize).toFixed(2)),
          daily_drawdown_used: parseFloat(Math.max(0, dailyDD).toFixed(2)),
          max_drawdown_used: parseFloat(Math.max(0, maxDD).toFixed(2)),
        }).catch(() => {});
      }
    }

    // ── Phase transition check ─────────────────────────────────────────────
    // Phase 1 passed: profit target hit AND min trading days met
    const profitPct = ((sessionBalance - accountSize) / accountSize) * 100;
    const tradingDays = account?.trading_days || 0;
    const minDays = rules?.minTradingDays || 4;
    const profitTarget = rules?.profitTarget || 10;

    if (account?.phase === 'phase1' && account?.status === 'active' && !accountBlocked
      && profitTarget > 0 && profitPct >= profitTarget && tradingDays >= minDays) {
      setPhaseModal('phase2');
      if (accountId) {
        base44.entities.ChallengeAccount.update(accountId, { status: 'passed' }).catch(() => {});
      }
    }

    if (account?.phase === 'phase2' && account?.status === 'active' && !accountBlocked
      && profitTarget > 0 && profitPct >= profitTarget && tradingDays >= minDays) {
      setPhaseModal('funded');
      if (accountId) {
        base44.entities.ChallengeAccount.update(accountId, { status: 'passed' }).catch(() => {});
      }
    }
  }, [equity, dailyOpenBalance, accountSize, marginLevel, positions.length, tradesLoaded, accountBlocked]);

  // ── SL/TP auto-close ─────────────────────────────────────────────────────
  useEffect(() => {
    if (positions.length === 0) return;
    positions.forEach(pos => {
      const p = prices[pos.symbol];
      if (!p?.bid) return;
      const cp    = pos.type === 'BUY' ? p.bid : p.ask;
      const slHit = pos.sl && (pos.type === 'BUY' ? cp <= pos.sl : cp >= pos.sl);
      const tpHit = pos.tp && (pos.type === 'BUY' ? cp >= pos.tp : cp <= pos.tp);
      if (slHit || tpHit) closePosition(pos.id, cp, calcPnl(pos, cp), slHit ? 'SL' : 'TP');
    });
  }, [prices]);

  // ── Overnight / Weekend rule enforcement (Standard account) ───────────────
  useEffect(() => {
    if (!rules || positions.length === 0) return;
    const now = new Date();
    const utcDay  = now.getUTCDay();
    const utcHour = now.getUTCHours();
    const utcMin  = now.getUTCMinutes();
    const utcTime = utcHour + utcMin / 60;

    // Weekend: Saturday or Sunday (non-crypto) — force-close all Standard account positions
    const isWeekend = utcDay === 0 || utcDay === 6;
    if (!rules.weekendHolding && isWeekend) {
      positions.forEach(pos => {
        const inst = INSTRUMENTS.find(i => i.symbol === pos.symbol);
        if (inst?.type === 'crypto') return; // crypto 24/7, skip
        const p = prices[pos.symbol];
        const cp = p ? (pos.type === 'BUY' ? p.bid : p.ask) : pos.entry;
        closePosition(pos.id, cp, calcPnl(pos, cp), 'Weekend Close (Rule)');
      });
    }

    // Overnight: after 21:00 UTC, before 22:00 UTC — end of NY session
    if (!rules.overnightHolding && utcTime >= 21 && utcTime < 22) {
      positions.forEach(pos => {
        const inst = INSTRUMENTS.find(i => i.symbol === pos.symbol);
        if (inst?.type === 'crypto') return; // crypto exempt
        const p = prices[pos.symbol];
        const cp = p ? (pos.type === 'BUY' ? p.bid : p.ask) : pos.entry;
        closePosition(pos.id, cp, calcPnl(pos, cp), 'Overnight Close (Rule)');
      });
    }
  }, [rules?.overnightHolding, rules?.weekendHolding]);

  // ── Pending order trigger ─────────────────────────────────────────────────
  useEffect(() => {
    if (pendingOrders.length === 0) return;
    pendingOrders.forEach(order => {
      const p  = prices[order.symbol];
      if (!p?.bid) return;
      const cp = order.type === 'BUY' ? p.ask : p.bid;
      const ot = order.orderType || '';
      const triggered =
        (ot === 'BUY_LIMIT'  && cp <= order.entry) ||
        (ot === 'BUY_STOP'   && cp >= order.entry) ||
        (ot === 'SELL_LIMIT' && cp >= order.entry) ||
        (ot === 'SELL_STOP'  && cp <= order.entry);
      if (triggered) {
        const margin = calcRequiredMargin(order.symbol, order.lots, rules.leverage, cp);
        const newPos = { ...order, id: Date.now() + Math.random(), orderType: 'MARKET', margin, entry: cp };
        setPositions(prev => [...prev, newPos]);
        setPendingOrders(prev => prev.filter(o => o.id !== order.id));
        // Persist: update record status
        if (order.id && typeof order.id === 'string' && order.id.length > 10) {
          base44.entities.TradeRecord.update(order.id, { status: 'open', entry: cp, margin }).catch(() => {});
        }
      }
    });
  }, [prices]);

  // ── Sync DB ───────────────────────────────────────────────────────────────
  const syncAccountDB = useCallback((newBalance, closedArr, openArr, currentEquity) => {
    if (!accountId) return;
    const totalTrades = closedArr.length;
    const wins        = closedArr.filter(t => t.pnl > 0).length;
    const winRate     = totalTrades > 0 ? parseFloat(((wins / totalTrades) * 100).toFixed(1)) : 0;
    const totalPnl    = parseFloat((newBalance - accountSize).toFixed(2));
    const dailyDD     = parseFloat((Math.max(0, (dailyOpenBalance - currentEquity) / accountSize * 100)).toFixed(2));
    const maxDD       = parseFloat((Math.max(0, (accountSize - currentEquity) / accountSize * 100)).toFixed(2));
    // Track high water mark for Instant Light trailing DD
    const currentHWM  = account?.high_water_mark || accountSize;
    const newHWM      = Math.max(currentHWM, newBalance);
    base44.entities.ChallengeAccount.update(accountId, {
      balance: newBalance, equity: currentEquity, pnl: totalPnl,
      win_rate: winRate, total_trades: totalTrades,
      daily_drawdown_used: dailyDD, max_drawdown_used: maxDD,
      profit_target_progress: parseFloat((Math.max(0, totalPnl / accountSize * 100)).toFixed(2)),
      high_water_mark: newHWM,
    }).catch(() => {});
  }, [accountId, accountSize, dailyOpenBalance, account?.high_water_mark]);

  const closePosition = useCallback((id, cp, pnl, reason = 'Manual') => {
    setPositions(prev => {
      const pos = prev.find(p => p.id === id);
      if (!pos) return prev;
      const newBalance = parseFloat((sessionBalance + pnl).toFixed(2));
      setSessionBalance(newBalance);
      // Persist close in DB
      if (id && typeof id === 'string' && id.length > 10) {
        base44.entities.TradeRecord.update(id, {
          status: 'closed', close: cp, pnl,
          close_reason: reason, close_time: new Date().toLocaleTimeString(),
        }).catch(() => {});
      }
      setClosedTrades(ct => {
        const updated = [{ ...pos, close: cp, pnl, closeTime: new Date().toLocaleTimeString(), reason }, ...ct.slice(0, 199)];
        setTimeout(() => syncAccountDB(newBalance, updated, prev.filter(p => p.id !== id), newBalance + floatPnl - pnl), 100);
        return updated;
      });
      return prev.filter(p => p.id !== id);
    });
  }, [sessionBalance, floatPnl, syncAccountDB]);

  const handleBulkClose = (type) => {
    positions.forEach(pos => {
      const p   = prices[pos.symbol];
      const cp  = p ? (pos.type === 'BUY' ? p.bid : p.ask) : pos.entry;
      const pnl = calcPnl(pos, cp);
      if (type === 'all' || (type === 'profit' && pnl > 0) || (type === 'loss' && pnl <= 0)) {
        closePosition(pos.id, cp, pnl, 'Manual');
      }
    });
  };

  const handlePlaceOrder = useCallback(async (order) => {
    if (accountBlocked) return;

    // ── Market session validation ─────────────────────────────────────────
    if (!isMarketOpen(order.symbol)) {
      const reason = getMarketClosedReason(order.symbol);
      setMarketClosedMsg(reason || 'Market is closed');
      return;
    }

    if (order.orderType === 'MARKET') {
      // Persist to DB
      let dbId = null;
      if (accountId) {
        const user = await base44.auth.me().catch(() => null);
        const rec = await base44.entities.TradeRecord.create({
          account_id: accountId,
          user_email: user?.email || '',
          trade_id: `TRD-${Date.now()}`,
          symbol: order.symbol,
          type: order.type,
          order_type: 'MARKET',
          lots: order.lots,
          entry: order.entry,
          sl: order.sl || null,
          tp: order.tp || null,
          margin: order.margin || 0,
          status: 'open',
          open_time: new Date().toLocaleTimeString(),
        }).catch(() => null);
        dbId = rec?.id;
      }
      setPositions(prev => [...prev, { ...order, id: dbId || (Date.now() + Math.random()) }]);
    } else {
      let dbId = null;
      if (accountId) {
        const user = await base44.auth.me().catch(() => null);
        const rec = await base44.entities.TradeRecord.create({
          account_id: accountId,
          user_email: user?.email || '',
          trade_id: `TRD-${Date.now()}`,
          symbol: order.symbol,
          type: order.type,
          order_type: order.orderType,
          lots: order.lots,
          entry: order.entry,
          sl: order.sl || null,
          tp: order.tp || null,
          margin: order.margin || 0,
          status: 'pending',
          open_time: new Date().toLocaleTimeString(),
        }).catch(() => null);
        dbId = rec?.id;
      }
      setPendingOrders(prev => [...prev, { ...order, id: dbId || (Date.now() + Math.random()) }]);
    }
  }, [accountBlocked, accountId, isMarketOpen]);

  // ── Locked state ──────────────────────────────────────────────────────────
  if (!isActive) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8" style={{ background: '#07070b' }}>
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
          <Lock className="w-8 h-8 md:w-10 md:h-10 text-primary/40" />
        </div>
        <div className="text-xl md:text-2xl font-black text-foreground mb-2">XTrading Terminal Locked</div>
        <div className="text-sm text-muted-foreground mb-1">Active challenge account required</div>
        <div className="text-xs font-mono text-muted-foreground/40">Status: {account?.status || 'No account'}</div>
      </div>
    );
  }

  const currentPrice = prices[selectedSymbol];
  const selected     = INSTRUMENTS.find(i => i.symbol === selectedSymbol);

  // ═══════════════════════════════════════════════════════════════════════════
  // MOBILE LAYOUT
  // ═══════════════════════════════════════════════════════════════════════════
  const mobileTabs = [
    { id: 'chart',     icon: BarChart2,  label: 'Chart'   },
    { id: 'order',     icon: BookOpen,   label: 'Order'   },
    { id: 'positions', icon: List,       label: `Pos(${positions.length})` },
    { id: 'watch',     icon: Menu,       label: 'Watch'   },
    { id: 'tracker',   icon: RefreshCw,  label: 'Goals'   },
  ];

  return (
    <div className="flex flex-col h-full font-mono" style={{ background: '#0a0e1a' }}>

      {/* Phase Transition Modal */}
      <AnimatePresence>
        {phaseModal && (
          <PhaseTransitionModal
            type={phaseModal}
            account={account}
            onClose={() => setPhaseModal(null)}
          />
        )}
      </AnimatePresence>

      {/* Market Closed Toast */}
      <AnimatePresence>
        {marketClosedMsg && (
          <div className="relative">
            <MarketClosedToast reason={marketClosedMsg} onDismiss={() => setMarketClosedMsg('')} />
          </div>
        )}
      </AnimatePresence>

      {/* Account Bar */}
      <AccountBar
        account={account} balance={sessionBalance} equity={equity}
        floatPnl={floatPnl} usedMargin={usedMargin} freeMargin={freeMargin}
        marginLevel={isFinite(marginLevel) ? marginLevel : 9999}
        rules={rules} accountBlocked={accountBlocked}
        allAccounts={allAccounts}
        onAccountChange={(newAcc) => {
          setAccount(newAcc);
          setPositions([]); setPendingOrders([]); setClosedTrades([]);
          setSessionBalance(newAcc.balance || newAcc.account_size || 100000);
          setTradesLoaded(false);
          setAccountBlocked(newAcc.status === 'failed');
          setBreachReason('');
        }}
      />

      {/* Session Bar */}
      <div className="hidden md:block flex-shrink-0">
        <SessionBar />
      </div>

      {/* Breach Banner */}
      <AnimatePresence>
        {accountBlocked && breachReason && <BreachBanner reason={breachReason} />}
      </AnimatePresence>

      {/* ═══ DESKTOP LAYOUT (md+) ══════════════════════════════════════════ */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        {/* Market Watch */}
        <div className="w-40 lg:w-44 flex-shrink-0 border-r border-white/[0.06] overflow-hidden">
          <MarketWatch prices={prices} selectedSymbol={selectedSymbol} onSelect={setSelectedSymbol} />
        </div>

        {/* Chart column */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-white/[0.06]">
          {/* Chart toolbar */}
          <div className="flex items-center gap-1 px-3 py-1.5 border-b border-white/[0.08] flex-shrink-0 overflow-x-auto"
            style={{ background: 'rgba(10,14,26,0.98)' }}>
            <span className="text-[11px] font-black text-foreground mr-2">{selectedSymbol}</span>
            {currentPrice?.bid && (
              <>
                <span className="text-sm font-black text-primary mr-1">{currentPrice.bid.toFixed(selected?.digits)}</span>
                <span className={`text-[10px] font-bold mr-3 ${(currentPrice.pct || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {(currentPrice.pct || 0) >= 0 ? '▲' : '▼'} {Math.abs(currentPrice.pct || 0).toFixed(2)}%
                </span>
              </>
            )}
            {/* Market closed indicator */}
            {!isMarketOpen(selectedSymbol) && (
              <span className="text-[9px] px-2 py-0.5 rounded-full font-bold text-yellow-400 mr-2"
                style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
                🔒 Closed
              </span>
            )}
            <div className="flex items-center gap-0.5 ml-auto flex-shrink-0">
              {TF_OPTS.map(tf => (
                <button key={tf.val} onClick={() => setTimeframe(tf.val)}
                  className={`px-1.5 py-1 rounded text-[9px] font-bold transition ${timeframe === tf.val ? 'bg-primary/25 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}>
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="flex-1 overflow-hidden">
            <TradingViewChart symbol={selectedSymbol} timeframe={timeframe} />
          </div>

          {/* Positions Table */}
          <div className="h-44 lg:h-52 border-t border-white/[0.06] flex-shrink-0">
            <PositionsTable
              positions={positions} pendingOrders={pendingOrders} closedTrades={closedTrades}
              prices={prices} onClose={closePosition}
              onCancelPending={(id) => {
                base44.entities.TradeRecord.update(id, { status: 'closed', close_reason: 'Cancelled' }).catch(() => {});
                setPendingOrders(prev => prev.filter(o => o.id !== id));
              }}
              onBulkClose={handleBulkClose}
            />
          </div>
        </div>

        {/* Right panel — Order Panel only */}
        <div className="w-60 lg:w-68 flex-shrink-0 flex flex-col overflow-hidden border-l border-white/[0.06]">
          <div className="flex-1 overflow-hidden">
            <OrderPanel
              symbol={selectedSymbol} prices={prices} account={account} rules={rules}
              equity={equity} usedMargin={usedMargin} onPlaceOrder={handlePlaceOrder}
              accountBlocked={accountBlocked} marketOpen={isMarketOpen(selectedSymbol)}
            />
          </div>
        </div>
      </div>

      {/* ── Challenge Tracker — animated bottom drawer ── */}
      <div className="hidden md:block flex-shrink-0">
        <ChallengeTrackerDrawer
          account={account} rules={rules} balance={sessionBalance}
          equity={equity} dailyOpenBalance={dailyOpenBalance}
        />
      </div>

      {/* ═══ MOBILE LAYOUT ═════════════════════════════════════════════════ */}
      <div className="flex md:hidden flex-col flex-1 overflow-hidden">
        {/* Mobile panel content */}
        <div className="flex-1 overflow-hidden relative">
          {mobilePanel === 'chart' && (
            <div className="flex flex-col h-full">
              {/* Symbol + price bar */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] flex-shrink-0"
                style={{ background: 'rgba(5,5,9,0.98)' }}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-foreground">{selectedSymbol}</span>
                  {currentPrice?.bid && (
                    <>
                      <span className="text-sm font-black text-primary">{currentPrice.bid.toFixed(selected?.digits)}</span>
                      <span className={`text-[10px] font-bold ${(currentPrice.pct || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {(currentPrice.pct || 0) >= 0 ? '▲' : '▼'}{Math.abs(currentPrice.pct || 0).toFixed(2)}%
                      </span>
                    </>
                  )}
                  {!isMarketOpen(selectedSymbol) && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold text-yellow-400"
                      style={{ background: 'rgba(245,158,11,0.15)' }}>
                      🔒 Closed
                    </span>
                  )}
                </div>
                {/* Timeframe selector */}
                <div className="flex items-center gap-0.5">
                  {TF_OPTS.map(tf => (
                    <button key={tf.val} onClick={() => setTimeframe(tf.val)}
                      className={`px-1.5 py-0.5 rounded text-[8px] font-bold transition ${timeframe === tf.val ? 'bg-primary/25 text-primary' : 'text-muted-foreground'}`}>
                      {tf.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <TradingViewChart symbol={selectedSymbol} timeframe={timeframe} />
              </div>
            </div>
          )}

          {mobilePanel === 'order' && (
            <div className="h-full overflow-y-auto">
              <OrderPanel
                symbol={selectedSymbol} prices={prices} account={account} rules={rules}
                equity={equity} usedMargin={usedMargin} onPlaceOrder={handlePlaceOrder}
                accountBlocked={accountBlocked} marketOpen={isMarketOpen(selectedSymbol)}
              />
            </div>
          )}

          {mobilePanel === 'positions' && (
            <div className="h-full">
              <PositionsTable
                positions={positions} pendingOrders={pendingOrders} closedTrades={closedTrades}
                prices={prices} onClose={closePosition}
                onCancelPending={(id) => {
                  base44.entities.TradeRecord.update(id, { status: 'closed', close_reason: 'Cancelled' }).catch(() => {});
                  setPendingOrders(prev => prev.filter(o => o.id !== id));
                }}
                onBulkClose={handleBulkClose}
              />
            </div>
          )}

          {mobilePanel === 'watch' && (
            <div className="h-full overflow-y-auto">
              <MarketWatch prices={prices} selectedSymbol={selectedSymbol}
                onSelect={(sym) => { setSelectedSymbol(sym); setMobilePanel('chart'); }} />
            </div>
          )}

          {mobilePanel === 'tracker' && (
            <div className="h-full overflow-y-auto">
              <ChallengeTrackerDrawer account={account} rules={rules} balance={sessionBalance} equity={equity} dailyOpenBalance={dailyOpenBalance} />
            </div>
          )}
        </div>

        {/* Mobile bottom tab bar */}
        <div className="flex-shrink-0 border-t border-white/[0.08] flex"
          style={{ background: 'rgba(8,12,24,0.99)' }}>
          {mobileTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = mobilePanel === tab.id;
            return (
              <button key={tab.id} onClick={() => setMobilePanel(tab.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 transition-all ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                <Icon className="w-4 h-4" />
                <span className="text-[8px] font-mono">{tab.label}</span>
                {isActive && <div className="absolute bottom-0 w-6 h-0.5 bg-primary rounded-full" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}