import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Lock, Monitor, ChevronDown, Maximize2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

import useLivePrices            from '../terminal/useLivePrices';
import MarketWatch               from '../terminal/MarketWatch';
import TradingViewChart          from '../terminal/TradingViewChart';
import OrderPanel                from '../terminal/OrderPanel';
import ChallengeTracker          from '../terminal/ChallengeTracker';
import PositionsTable            from '../terminal/PositionsTable';
import SessionBar                from '../terminal/SessionBar';
import { INSTRUMENTS, getAccountRules, calcPnl, calcRequiredMargin } from '../terminal/terminalConfig';

const TF_OPTS = [
  { label: '1m', val: '1' }, { label: '5m', val: '5' }, { label: '15m', val: '15' },
  { label: '30m', val: '30' }, { label: '1h', val: '60' }, { label: '4h', val: '240' },
  { label: '1D', val: 'D' }, { label: '1W', val: 'W' },
];

function AccountBar({ account, balance, equity, floatPnl, usedMargin, freeMargin, marginLevel, rules, accountBlocked }) {
  const items = [
    { label: 'Account',     val: account?.account_id || 'N/A',                 color: 'text-primary font-black' },
    { label: 'Balance',     val: `$${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: 'text-foreground' },
    { label: 'Equity',      val: `$${equity.toFixed(2)}`,                       color: equity >= balance ? 'text-emerald-400' : 'text-red-400' },
    { label: 'Float P&L',   val: `${floatPnl >= 0 ? '+' : ''}$${floatPnl.toFixed(2)}`, color: floatPnl >= 0 ? 'text-emerald-400' : 'text-red-400' },
    { label: 'Used Margin', val: `$${usedMargin.toFixed(2)}`,                   color: 'text-muted-foreground' },
    { label: 'Free Margin', val: `$${freeMargin.toFixed(2)}`,                   color: freeMargin < 500 ? 'text-red-400' : 'text-foreground' },
    { label: 'Margin Lvl',  val: `${marginLevel.toFixed(1)}%`,                  color: marginLevel > 200 ? 'text-emerald-400' : marginLevel > 100 ? 'text-yellow-400' : 'text-red-400' },
    { label: 'Leverage',    val: `1:${rules?.leverage || 100}`,                 color: 'text-primary' },
    { label: 'Type',        val: rules?.accountType || 'Standard',              color: 'text-muted-foreground' },
  ];

  return (
    <div className="flex items-stretch border-b border-white/[0.06] overflow-x-auto flex-shrink-0"
      style={{ background: 'rgba(4,4,8,0.99)' }}>
      {items.map(item => (
        <div key={item.label} className="flex flex-col px-3 py-2 border-r border-white/[0.04] flex-shrink-0">
          <span className="text-[8px] font-mono text-muted-foreground/50 uppercase tracking-wider mb-0.5">{item.label}</span>
          <span className={`text-[11px] font-mono font-semibold ${item.color}`}>{item.val}</span>
        </div>
      ))}
      {accountBlocked && (
        <div className="ml-auto flex items-center px-4 bg-red-900/30 border-l border-red-500/30">
          <span className="text-[10px] font-bold text-red-400 animate-pulse">⚠ TRADING SUSPENDED</span>
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
      <div className="flex items-center gap-3 px-4 py-2.5">
        <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
        <span className="text-xs font-bold text-red-400">{reason}</span>
      </div>
    </motion.div>
  );
}

export default function ProTradingTerminal({ account }) {
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

  const accountSize = account?.account_size || 100000;

  // Live derived values
  const floatPnl = positions.reduce((s, pos) => {
    const p  = prices[pos.symbol];
    const cp = p ? (pos.type === 'BUY' ? p.bid : p.ask) : pos.entry;
    return s + calcPnl(pos, cp);
  }, 0);
  const equity      = sessionBalance + floatPnl;
  const usedMargin  = positions.reduce((s, p) => s + (p.margin || 0), 0);
  const freeMargin  = equity - usedMargin;
  const marginLevel = usedMargin > 0 ? (equity / usedMargin) * 100 : Infinity;

  // ── Breach engine ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (accountBlocked) return;
    const dailyDD = Math.abs(((sessionBalance - equity) / accountSize) * 100);
    const maxDD   = Math.abs(((accountSize - equity) / accountSize) * 100);

    let breached = false;
    let reason   = '';

    if (dailyDD >= rules.dailyDDLimit) {
      breached = true;
      reason   = `DAILY DRAWDOWN LIMIT BREACHED: ${dailyDD.toFixed(2)}% ≥ ${rules.dailyDDLimit}% — Trading Disabled`;
    } else if (maxDD >= rules.maxDDLimit) {
      breached = true;
      reason   = `MAX DRAWDOWN LIMIT BREACHED: ${maxDD.toFixed(2)}% ≥ ${rules.maxDDLimit}% — Account Failed`;
    } else if (marginLevel <= rules.stopOutLevel && positions.length > 0) {
      breached = true;
      reason   = `STOP OUT TRIGGERED: Margin level ${marginLevel.toFixed(1)}% ≤ ${rules.stopOutLevel}% — Positions force-closed`;
    }

    if (breached) {
      setAccountBlocked(true);
      setBreachReason(reason);
      if (account?.id) {
        base44.entities.ChallengeAccount.update(account.id, {
          status:              'failed',
          equity,
          balance:             sessionBalance,
          pnl:                 equity - accountSize,
          daily_drawdown_used: dailyDD,
          max_drawdown_used:   maxDD,
        }).catch(() => {});
      }
    }
  }, [equity, sessionBalance, accountSize, marginLevel, positions.length]);

  // ── SL/TP auto-close ──────────────────────────────────────────────────────
  useEffect(() => {
    if (positions.length === 0) return;
    positions.forEach(pos => {
      const p  = prices[pos.symbol];
      if (!p?.bid) return;
      const cp    = pos.type === 'BUY' ? p.bid : p.ask;
      const slHit = pos.sl && (pos.type === 'BUY' ? cp <= pos.sl : cp >= pos.sl);
      const tpHit = pos.tp && (pos.type === 'BUY' ? cp >= pos.tp : cp <= pos.tp);
      if (slHit || tpHit) {
        closePosition(pos.id, cp, calcPnl(pos, cp), slHit ? 'SL' : 'TP');
      }
    });
  }, [prices]);

  // ── Pending order trigger ─────────────────────────────────────────────────
  useEffect(() => {
    if (pendingOrders.length === 0) return;
    pendingOrders.forEach(order => {
      const p = prices[order.symbol];
      if (!p?.bid) return;
      const cp = order.type === 'BUY' ? p.ask : p.bid;
      const ot = order.orderType || '';
      const triggered =
        (ot === 'BUY_LIMIT'  && cp <= order.entry) ||
        (ot === 'BUY_STOP'   && cp >= order.entry) ||
        (ot === 'SELL_LIMIT' && cp >= order.entry) ||
        (ot === 'SELL_STOP'  && cp <= order.entry);
      if (triggered) {
        const newPos = { ...order, id: Date.now() + Math.random(), orderType: 'MARKET' };
        setPositions(prev => [...prev, newPos]);
        setPendingOrders(prev => prev.filter(o => o.id !== order.id));
      }
    });
  }, [prices]);

  // ── Sync to DB after position close ──────────────────────────────────────
  const syncDB = useCallback((newBalance, newClosed, newPositions, currentEquity) => {
    if (!account?.id) return;
    const totalTrades = newClosed.length;
    const wins        = newClosed.filter(t => t.pnl > 0).length;
    const winRate     = totalTrades > 0 ? parseFloat(((wins / totalTrades) * 100).toFixed(1)) : 0;
    const totalPnl    = parseFloat((newBalance - accountSize).toFixed(2));
    const dailyDD     = parseFloat((Math.max(0, (newBalance - currentEquity) / accountSize * 100)).toFixed(2));
    const maxDD       = parseFloat((Math.max(0, (accountSize - currentEquity) / accountSize * 100)).toFixed(2));
    base44.entities.ChallengeAccount.update(account.id, {
      balance:                newBalance,
      equity:                 currentEquity,
      pnl:                    totalPnl,
      win_rate:               winRate,
      total_trades:           totalTrades,
      daily_drawdown_used:    dailyDD,
      max_drawdown_used:      maxDD,
      profit_target_progress: parseFloat((Math.max(0, totalPnl / accountSize * 100)).toFixed(2)),
    }).catch(() => {});
  }, [account?.id, accountSize]);

  const closePosition = useCallback((id, cp, pnl, reason = 'Manual') => {
    setPositions(prev => {
      const pos = prev.find(p => p.id === id);
      if (!pos) return prev;
      const newBalance = parseFloat((sessionBalance + pnl).toFixed(2));
      setSessionBalance(newBalance);
      setClosedTrades(ct => {
        const updated = [{ ...pos, close: cp, pnl, closeTime: new Date().toLocaleTimeString(), reason }, ...ct.slice(0, 199)];
        setTimeout(() => syncDB(newBalance, updated, prev.filter(p => p.id !== id), newBalance + floatPnl), 100);
        return updated;
      });
      return prev.filter(p => p.id !== id);
    });
  }, [sessionBalance, floatPnl, syncDB]);

  const handleBulkClose = (type) => {
    positions.forEach(pos => {
      const p  = prices[pos.symbol];
      const cp = p ? (pos.type === 'BUY' ? p.bid : p.ask) : pos.entry;
      const pnl = calcPnl(pos, cp);
      if (type === 'all' || (type === 'profit' && pnl > 0) || (type === 'loss' && pnl <= 0)) {
        closePosition(pos.id, cp, pnl, 'Manual');
      }
    });
  };

  const handlePlaceOrder = (order) => {
    if (accountBlocked) return;
    if (order.orderType === 'MARKET') {
      setPositions(prev => [...prev, { ...order, id: Date.now() + Math.random() }]);
    } else {
      setPendingOrders(prev => [...prev, { ...order, id: Date.now() + Math.random() }]);
    }
  };

  // ── Locked State ──────────────────────────────────────────────────────────
  if (!isActive) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8" style={{ background: '#07070b' }}>
        <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-primary/40" />
        </div>
        <div className="text-2xl font-black text-foreground mb-2">XTrading Terminal Locked</div>
        <div className="text-sm text-muted-foreground mb-1">Active challenge account required</div>
        <div className="text-xs font-mono text-muted-foreground/40">Status: {account?.status || 'No account'}</div>
      </div>
    );
  }

  const currentPrice = prices[selectedSymbol];
  const selected     = INSTRUMENTS.find(i => i.symbol === selectedSymbol);

  return (
    <div className="flex flex-col h-full font-mono" style={{ background: '#07070b' }}>
      {/* Account Bar */}
      <AccountBar
        account={account}
        balance={sessionBalance}
        equity={equity}
        floatPnl={floatPnl}
        usedMargin={usedMargin}
        freeMargin={freeMargin}
        marginLevel={isFinite(marginLevel) ? marginLevel : 9999}
        rules={rules}
        accountBlocked={accountBlocked}
      />

      {/* Session Bar */}
      <SessionBar />

      {/* Breach Banner */}
      <AnimatePresence>
        {accountBlocked && breachReason && <BreachBanner reason={breachReason} />}
      </AnimatePresence>

      {/* Main 3-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left: Market Watch (fixed 180px) ── */}
        <div className="w-44 flex-shrink-0 border-r border-white/[0.06] overflow-hidden">
          <MarketWatch prices={prices} selectedSymbol={selectedSymbol} onSelect={setSelectedSymbol} />
        </div>

        {/* ── Center: Chart ── */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-white/[0.06]">
          {/* Chart toolbar */}
          <div className="flex items-center gap-1 px-3 py-1.5 border-b border-white/[0.06] flex-shrink-0 overflow-x-auto"
            style={{ background: 'rgba(5,5,9,0.98)' }}>
            <span className="text-[11px] font-black text-foreground mr-3">{selectedSymbol}</span>
            {currentPrice?.bid && (
              <>
                <span className="text-base font-black text-primary mr-2">{currentPrice.bid.toFixed(selected?.digits)}</span>
                <span className={`text-[10px] font-bold mr-4 ${(currentPrice.pct || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {(currentPrice.pct || 0) >= 0 ? '▲' : '▼'} {Math.abs(currentPrice.pct || 0).toFixed(2)}%
                </span>
              </>
            )}
            <div className="flex items-center gap-0.5 ml-auto flex-shrink-0">
              {TF_OPTS.map(tf => (
                <button key={tf.val} onClick={() => setTimeframe(tf.val)}
                  className={`px-2 py-1 rounded text-[9px] font-bold transition ${timeframe === tf.val ? 'bg-primary/25 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}>
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

          {/* TradingView Chart */}
          <div className="flex-1 overflow-hidden">
            <TradingViewChart symbol={selectedSymbol} timeframe={timeframe} />
          </div>

          {/* Positions Table */}
          <div className="h-40 border-t border-white/[0.06] flex-shrink-0">
            <PositionsTable
              positions={positions}
              pendingOrders={pendingOrders}
              closedTrades={closedTrades}
              prices={prices}
              onClose={closePosition}
              onCancelPending={(id) => setPendingOrders(prev => prev.filter(o => o.id !== id))}
              onBulkClose={handleBulkClose}
            />
          </div>
        </div>

        {/* ── Right panel: Order + Challenge ── */}
        <div className="w-64 flex-shrink-0 flex flex-col overflow-hidden">
          {/* Order Panel */}
          <div className="flex-1 overflow-hidden border-b border-white/[0.06]">
            <OrderPanel
              symbol={selectedSymbol}
              prices={prices}
              account={account}
              rules={rules}
              equity={equity}
              usedMargin={usedMargin}
              onPlaceOrder={handlePlaceOrder}
              accountBlocked={accountBlocked}
            />
          </div>

          {/* Challenge Tracker */}
          <div className="overflow-y-auto" style={{ maxHeight: '280px', background: '#07070b', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <ChallengeTracker
              account={account}
              rules={rules}
              balance={sessionBalance}
              equity={equity}
            />
          </div>
        </div>
      </div>
    </div>
  );
}