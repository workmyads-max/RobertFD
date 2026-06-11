import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Activity, RefreshCw, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';

function formatDuration(openTime) {
  if (!openTime) return '—';
  const ms = Date.now() - new Date(openTime).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function TradeRow({ trade, isOpen }) {
  const isBuy = trade.type === 'BUY';
  const pnl = trade.pnl || 0;
  const isProfit = pnl >= 0;
  const [elapsed, setElapsed] = useState(isOpen ? formatDuration(trade.open_time) : null);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => setElapsed(formatDuration(trade.open_time)), 1000);
    return () => clearInterval(interval);
  }, [isOpen, trade.open_time]);

  return (
    <motion.tr
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="border-b hover:bg-white/[0.02] transition-colors"
      style={{ borderColor: 'rgba(255,255,255,0.05)' }}
    >
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          {isOpen && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />}
          <span className="text-xs font-bold text-foreground font-mono">{trade.symbol || '—'}</span>
        </div>
      </td>
      <td className="px-3 py-3">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${isBuy ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>
          {isBuy ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trade.type}
        </span>
      </td>
      <td className="px-3 py-3 text-xs font-mono text-muted-foreground">
        {(trade.lots || 0).toFixed(2)}
      </td>
      <td className="px-3 py-3 text-xs font-mono text-muted-foreground">
        {(trade.entry || 0).toFixed(5)}
      </td>
      <td className="px-3 py-3 text-xs font-mono text-muted-foreground">
        {isOpen ? <span className="text-yellow-400/70 text-[10px]">Running…</span> : (trade.close || 0).toFixed(5)}
      </td>
      <td className="px-3 py-3">
        <span className={`text-xs font-bold font-mono ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
          {isProfit ? '+' : ''}${pnl.toFixed(2)}
        </span>
      </td>
      <td className="px-3 py-3">
        {isOpen ? (
          <span className="text-[10px] font-mono text-yellow-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />{elapsed}
          </span>
        ) : (
          <span className="text-[10px] font-mono text-muted-foreground">
            {trade.close_time ? new Date(trade.close_time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
          </span>
        )}
      </td>
      <td className="px-3 py-3">
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isOpen ? 'bg-yellow-400/10 text-yellow-400' : isProfit ? 'bg-emerald-400/10 text-emerald-400' : 'bg-red-400/10 text-red-400'}`}>
          {isOpen ? 'OPEN' : 'CLOSED'}
        </span>
      </td>
    </motion.tr>
  );
}

export default function LiveTradeFeed({ account }) {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [tab, setTab] = useState('all'); // all | open | closed

  const fetchTrades = async () => {
    if (!account?.account_id) return;
    setLoading(true);
    try {
      const records = await base44.entities.TradeRecord.filter({ account_id: account.account_id });
      setTrades(records);
      setLastRefresh(new Date());
    } catch (e) {
      console.error('LiveTradeFeed fetch error', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrades();
    const interval = setInterval(fetchTrades, 30000);
    return () => clearInterval(interval);
  }, [account?.account_id]);

  // Derive open positions from equity ≠ balance
  const balance = account?.balance || 0;
  const equity = account?.equity || balance;
  const floatingPnl = equity - balance;
  const hasOpenPositions = Math.abs(floatingPnl) > 0.01;

  // Filter out deposit/withdrawal system entries (no symbol or zero lots and no price)
  const realTrades = trades.filter(t => t.symbol && t.symbol.length > 0 && (t.lots > 0 || t.entry > 0));
  const closedTrades = realTrades.filter(t => t.status === 'closed');
  const openTrades = realTrades.filter(t => t.status === 'open');

  // If equity ≠ balance but no open trades in DB, show a synthetic open position row
  const syntheticOpen = hasOpenPositions && openTrades.length === 0 ? [{
    id: 'synthetic',
    symbol: 'Open Position',
    type: floatingPnl >= 0 ? 'BUY' : 'SELL',
    lots: 0,
    entry: 0,
    close: 0,
    pnl: floatingPnl,
    status: 'open',
    open_time: account?.last_synced_at,
  }] : openTrades;

  const allTrades = [...syntheticOpen, ...closedTrades].sort((a, b) => {
    const aTime = new Date(a.close_time || a.open_time || 0);
    const bTime = new Date(b.close_time || b.open_time || 0);
    return bTime - aTime;
  });

  const displayTrades = tab === 'open'
    ? syntheticOpen
    : tab === 'closed'
    ? closedTrades
    : allTrades;

  const totalPnl = closedTrades.reduce((s, t) => s + (t.pnl || 0), 0);
  const winCount = closedTrades.filter(t => (t.pnl || 0) > 0).length;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="text-sm font-bold text-foreground">Live Trade Feed</div>
            <div className="text-[10px] font-mono text-muted-foreground">
              {lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString()}` : 'Loading…'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Stats pills */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-yellow-400/10 text-yellow-400">
              {syntheticOpen.length} Open
            </span>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/5 text-muted-foreground">
              {closedTrades.length} Closed
            </span>
            {totalPnl !== 0 && (
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${totalPnl >= 0 ? 'bg-emerald-400/10 text-emerald-400' : 'bg-red-400/10 text-red-400'}`}>
                {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
              </span>
            )}
          </div>
          <button onClick={fetchTrades} disabled={loading}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        {[
          { id: 'all', label: `All (${allTrades.length})` },
          { id: 'open', label: `Open (${syntheticOpen.length})` },
          { id: 'closed', label: `Closed (${closedTrades.length})` },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-xs font-semibold transition-colors border-b-2 ${tab === t.id ? 'text-primary border-primary' : 'text-muted-foreground border-transparent hover:text-foreground'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Floating P&L banner if open positions exist */}
      {hasOpenPositions && (tab === 'all' || tab === 'open') && (
        <div className="flex items-center justify-between px-5 py-2.5 border-b"
          style={{ background: floatingPnl >= 0 ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)', borderColor: 'rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            {floatingPnl >= 0 ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> : <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
            Floating P&L (live from MT5)
          </div>
          <span className={`text-sm font-black font-mono ${floatingPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {floatingPnl >= 0 ? '+' : ''}${floatingPnl.toFixed(2)}
          </span>
        </div>
      )}

      {/* Table */}
      {loading && trades.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : displayTrades.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Activity className="w-8 h-8 text-muted-foreground/20 mb-3" />
          <p className="text-sm text-muted-foreground">No {tab === 'open' ? 'open positions' : tab === 'closed' ? 'closed trades' : 'trades'} yet</p>
          <p className="text-xs text-muted-foreground/50 mt-1">Trades sync every 30 seconds from MT5</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {['Symbol', 'Side', 'Lots', 'Open', 'Close', 'P&L', 'Time', 'Status'].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {displayTrades.map((t, i) => (
                  <TradeRow key={t.id || t.trade_id || i} trade={t} isOpen={t.status === 'open'} />
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}

      {/* Summary footer */}
      {closedTrades.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 px-5 py-3 border-t text-xs font-mono text-muted-foreground"
          style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.15)' }}>
          <span>Total Closed: <strong className="text-foreground">{closedTrades.length}</strong></span>
          <span>Wins: <strong className="text-emerald-400">{winCount}</strong></span>
          <span>Losses: <strong className="text-red-400">{closedTrades.length - winCount}</strong></span>
          <span>Win Rate: <strong className="text-foreground">{closedTrades.length > 0 ? ((winCount / closedTrades.length) * 100).toFixed(1) : 0}%</strong></span>
          <span className="ml-auto">Net P&L: <strong className={totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>{totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}</strong></span>
        </div>
      )}
    </div>
  );
}