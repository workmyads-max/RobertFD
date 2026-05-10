import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Lock, ChevronDown, ChevronUp, BarChart2, BookOpen, List, Menu, X, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

import useLivePrices            from '../terminal/useLivePrices';
import MarketWatch               from '../terminal/MarketWatch';
import TradingViewChart          from '../terminal/TradingViewChart';
import OrderPanel                from '../terminal/OrderPanel';
import ChallengeTracker          from '../terminal/ChallengeTracker';
import PositionsTable            from '../terminal/PositionsTable';
import SessionBar                from '../terminal/SessionBar';
import { INSTRUMENTS, getAccountRules, calcPnl, calcRequiredMargin, isMarketOpen, getMarketClosedReason } from '../terminal/terminalConfig';

const TF_OPTS = [
  { label: '1m', val: '1' }, { label: '5m', val: '5' }, { label: '15m', val: '15' },
  { label: '1h', val: '60' }, { label: '4h', val: '240' }, { label: '1D', val: 'D' },
];

// ── Account bar (scrollable on mobile) ───────────────────────────────────────
function AccountBar({ account, balance, equity, floatPnl, usedMargin, freeMargin, marginLevel, rules, accountBlocked }) {
  const items = [
    { label: 'Account',  val: account?.account_id || 'N/A',   color: 'text-primary font-black' },
    { label: 'Balance',  val: `$${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: 'text-foreground' },
    { label: 'Equity',   val: `$${equity.toFixed(2)}`,          color: equity >= balance ? 'text-emerald-400' : 'text-red-400' },
    { label: 'Float P&L',val: `${floatPnl >= 0 ? '+' : ''}$${floatPnl.toFixed(2)}`, color: floatPnl >= 0 ? 'text-emerald-400' : 'text-red-400' },
    { label: 'Margin',   val: `$${usedMargin.toFixed(0)}`,      color: 'text-muted-foreground' },
    { label: 'Free',     val: `$${freeMargin.toFixed(0)}`,      color: freeMargin < 500 ? 'text-red-400' : 'text-foreground' },
    { label: 'Lvl',      val: `${isFinite(marginLevel) ? marginLevel.toFixed(0) : '∞'}%`, color: marginLevel > 200 || !isFinite(marginLevel) ? 'text-emerald-400' : marginLevel > 100 ? 'text-yellow-400' : 'text-red-400' },
    { label: '1:',       val: `${rules?.leverage || 100}`,      color: 'text-primary' },
  ];

  return (
    <div className="flex items-stretch border-b border-white/[0.06] overflow-x-auto flex-shrink-0 scrollbar-hide"
      style={{ background: 'rgba(4,4,8,0.99)' }}>
      {items.map(item => (
        <div key={item.label} className="flex flex-col px-2 md:px-3 py-1.5 md:py-2 border-r border-white/[0.04] flex-shrink-0 min-w-[60px]">
          <span className="text-[7px] md:text-[8px] font-mono text-muted-foreground/50 uppercase tracking-wider mb-0.5">{item.label}</span>
          <span className={`text-[10px] md:text-[11px] font-mono font-semibold whitespace-nowrap ${item.color}`}>{item.val}</span>
        </div>
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
  const [marketClosedMsg, setMarketClosedMsg] = useState('');
  const [tradesLoaded,   setTradesLoaded]   = useState(false);

  // Mobile layout state
  const [mobilePanel, setMobilePanel] = useState('chart'); // chart | order | positions | watch
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
    if (account?.balance) setSessionBalance(account.balance);
  }, [account?.balance]);

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

  // ── Breach engine ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (accountBlocked || !tradesLoaded) return;
    const dailyDD = Math.abs(((sessionBalance - equity) / accountSize) * 100);
    const maxDD   = Math.abs(((accountSize - equity) / accountSize) * 100);
    let breached = false, reason = '';
    if (dailyDD >= rules.dailyDDLimit) {
      breached = true; reason = `DAILY DRAWDOWN LIMIT BREACHED: ${dailyDD.toFixed(2)}% ≥ ${rules.dailyDDLimit}% — Trading Disabled`;
    } else if (maxDD >= rules.maxDDLimit) {
      breached = true; reason = `MAX DRAWDOWN LIMIT BREACHED: ${maxDD.toFixed(2)}% ≥ ${rules.maxDDLimit}% — Account Failed`;
    } else if (marginLevel <= rules.stopOutLevel && positions.length > 0) {
      breached = true; reason = `STOP OUT: Margin level ${marginLevel.toFixed(1)}% ≤ ${rules.stopOutLevel}%`;
    }
    if (breached) {
      setAccountBlocked(true); setBreachReason(reason);
      if (accountId) {
        base44.entities.ChallengeAccount.update(accountId, {
          status: 'failed', equity, balance: sessionBalance,
          pnl: equity - accountSize, daily_drawdown_used: dailyDD, max_drawdown_used: maxDD,
        }).catch(() => {});
      }
    }
  }, [equity, sessionBalance, accountSize, marginLevel, positions.length, tradesLoaded]);

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
    const dailyDD     = parseFloat((Math.max(0, (sessionBalance - currentEquity) / accountSize * 100)).toFixed(2));
    const maxDD       = parseFloat((Math.max(0, (accountSize - currentEquity) / accountSize * 100)).toFixed(2));
    base44.entities.ChallengeAccount.update(accountId, {
      balance: newBalance, equity: currentEquity, pnl: totalPnl,
      win_rate: winRate, total_trades: totalTrades,
      daily_drawdown_used: dailyDD, max_drawdown_used: maxDD,
      profit_target_progress: parseFloat((Math.max(0, totalPnl / accountSize * 100)).toFixed(2)),
    }).catch(() => {});
  }, [accountId, accountSize, sessionBalance]);

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
  ];

  return (
    <div className="flex flex-col h-full font-mono" style={{ background: '#07070b' }}>

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
          <div className="flex items-center gap-1 px-3 py-1.5 border-b border-white/[0.06] flex-shrink-0 overflow-x-auto"
            style={{ background: 'rgba(5,5,9,0.98)' }}>
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
          <div className="h-36 lg:h-44 border-t border-white/[0.06] flex-shrink-0">
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

        {/* Right panel */}
        <div className="w-56 lg:w-64 flex-shrink-0 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden border-b border-white/[0.06]">
            <OrderPanel
              symbol={selectedSymbol} prices={prices} account={account} rules={rules}
              equity={equity} usedMargin={usedMargin} onPlaceOrder={handlePlaceOrder}
              accountBlocked={accountBlocked} marketOpen={isMarketOpen(selectedSymbol)}
            />
          </div>
          <div className="overflow-y-auto flex-shrink-0" style={{ maxHeight: '260px', background: '#07070b', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <ChallengeTracker account={account} rules={rules} balance={sessionBalance} equity={equity} />
          </div>
        </div>
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
        </div>

        {/* Mobile bottom tab bar */}
        <div className="flex-shrink-0 border-t border-white/[0.06] flex"
          style={{ background: 'rgba(4,4,8,0.99)' }}>
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