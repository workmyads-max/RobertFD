import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Activity, RefreshCw, Clock, TrendingUp, TrendingDown, ChevronDown, ChevronRight } from 'lucide-react';
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

function formatDateTime(dt) {
  if (!dt) return '—';
  const d = new Date(dt);
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

// ─── Open position row (existing design) ─────────────────────────────────────
function OpenTradeRow({ trade }) {
  const isBuy = trade.type === 'BUY';
  const pnl = trade.pnl || 0;
  const isProfit = pnl >= 0;
  const [elapsed, setElapsed] = useState(formatDuration(trade.open_time));

  useEffect(() => {
    const interval = setInterval(() => setElapsed(formatDuration(trade.open_time)), 1000);
    return () => clearInterval(interval);
  }, [trade.open_time]);

  return (
    <motion.tr
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="border-b hover:bg-white/[0.02] transition-colors"
      style={{ borderColor: 'rgba(255,255,255,0.05)' }}
    >
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${isBuy ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>
            {isBuy ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trade.type}
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">{trade.trade_id}</span>
        </div>
      </td>
      <td className="px-3 py-3 text-xs font-mono text-muted-foreground whitespace-nowrap">
        {trade.open_time ? new Date(trade.open_time).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false }) : '—'}
      </td>
      <td className="px-3 py-3 text-xs font-mono text-foreground">{(trade.lots || 0).toFixed(2)}</td>
      <td className="px-3 py-3 text-xs font-bold text-foreground">{trade.symbol || '—'}</td>
      <td className="px-3 py-3">
        <span className={`text-sm font-bold font-mono ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
          {isProfit ? '+' : ''}${pnl.toFixed(2)}
        </span>
      </td>
      <td className="px-3 py-3 text-xs font-mono text-muted-foreground">—</td>
      <td className="px-3 py-3">
        <span className="text-[10px] font-mono text-yellow-400 flex items-center gap-1">
          <Clock className="w-3 h-3" />{elapsed}
        </span>
      </td>
    </motion.tr>
  );
}

// ─── Closed trade row (reference design) ─────────────────────────────────────
function ClosedTradeRow({ trade }) {
  const [expanded, setExpanded] = useState(false);
  const isBuy = trade.type === 'BUY';
  const pnl = trade.pnl || 0;
  const isProfit = pnl >= 0;

  return (
    <>
      <motion.tr
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="border-b hover:bg-white/[0.02] transition-colors cursor-pointer"
        style={{ borderColor: 'rgba(255,255,255,0.05)' }}
        onClick={() => setExpanded(e => !e)}
      >
        {/* Type + ID */}
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${isBuy ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>
              {isBuy ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {trade.type}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">{trade.trade_id}</span>
          </div>
        </td>
        {/* Open time */}
        <td className="px-4 py-3.5 text-xs font-mono text-muted-foreground whitespace-nowrap">
          {trade.close_time
            ? new Date(trade.close_time).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })
            : '—'}
        </td>
        {/* Lots */}
        <td className="px-4 py-3.5 text-xs font-bold font-mono text-foreground">{(trade.lots || 0).toFixed(2)}</td>
        {/* Symbol */}
        <td className="px-4 py-3.5 text-xs font-bold text-foreground">{trade.symbol || '—'}</td>
        {/* PnL */}
        <td className="px-4 py-3.5">
          <span className={`text-sm font-black font-mono px-2 py-0.5 rounded ${isProfit ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>
            {isProfit ? '+' : ''}${pnl.toFixed(2)}
          </span>
        </td>
        {/* Pips */}
        <td className="px-4 py-3.5 text-xs font-mono text-muted-foreground">
          {trade.pips != null ? trade.pips.toFixed(1) : '—'}
        </td>
        {/* Duration */}
        <td className="px-4 py-3.5 text-xs font-mono text-muted-foreground whitespace-nowrap">
          {trade.open_time && trade.close_time ? (() => {
            const ms = new Date(trade.close_time) - new Date(trade.open_time);
            const totalSec = Math.abs(Math.floor(ms / 1000));
            const h = Math.floor(totalSec / 3600);
            const m = Math.floor((totalSec % 3600) / 60);
            const s = totalSec % 60;
            return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
          })() : '—'}
        </td>
        {/* Expand */}
        <td className="px-3 py-3.5 text-muted-foreground">
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </td>
      </motion.tr>

      {/* Expanded detail row */}
      <AnimatePresence>
        {expanded && (
          <motion.tr
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="border-b"
            style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}
          >
            <td colSpan={8} className="px-6 py-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Open Time</div>
                  <div className="text-foreground">{formatDateTime(trade.open_time)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Close Time</div>
                  <div className="text-foreground">{formatDateTime(trade.close_time)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Open Price</div>
                  <div className="text-foreground">{(trade.entry || 0).toFixed(5)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Close Price</div>
                  <div className="text-foreground">{(trade.close || 0).toFixed(5)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Gross P&L</div>
                  <div className={trade.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}>${(trade.profit || 0).toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Commission</div>
                  <div className="text-muted-foreground">${(trade.commission || 0).toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Swap</div>
                  <div className="text-muted-foreground">${(trade.swap || 0).toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Net P&L</div>
                  <div className={`font-bold ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>${pnl.toFixed(2)}</div>
                </div>
              </div>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function LiveTradeFeed({ account }) {
  const [openPositions, setOpenPositions] = useState([]);
  const [closedTrades, setClosedTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [closedLoading, setClosedLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [tab, setTab] = useState('open');

  const fetchOpen = async () => {
    if (!account?.account_id) return;
    try {
      const posRes = await base44.functions.invoke('getLivePositions', { account_id: account.account_id });
      setOpenPositions(posRes?.data?.positions || []);
      setLastRefresh(new Date());
    } catch (e) {
      console.error('fetchOpen error', e);
    }
  };

  const fetchClosed = async () => {
    if (!account?.account_id) return;
    setClosedLoading(true);
    try {
      const res = await base44.functions.invoke('getClosedTrades', { account_id: account.account_id, page_size: 100 });
      setClosedTrades(res?.data?.trades || []);
    } catch (e) {
      console.error('fetchClosed error', e);
    } finally {
      setClosedLoading(false);
    }
  };

  useEffect(() => {
    if (!account?.account_id) return;
    setLoading(true);
    fetchOpen().finally(() => setLoading(false));
    fetchClosed();
    const interval = setInterval(fetchOpen, 15000);
    return () => clearInterval(interval);
  }, [account?.account_id]);

  // Fetch closed trades when tab switches to closed
  useEffect(() => {
    if (tab === 'closed' && closedTrades.length === 0 && account?.account_id) {
      fetchClosed();
    }
  }, [tab]);

  const floatingPnl = openPositions.reduce((s, p) => s + (p.pnl || 0), 0);
  const totalPnl = closedTrades.reduce((s, t) => s + (t.pnl || 0), 0);
  const winCount = closedTrades.filter(t => (t.pnl || 0) > 0).length;

  const openHeaders = ['Type / ID', 'Time', 'Lots', 'Symbol', 'P&L', 'Pips', 'Duration'];
  const closedHeaders = ['Type / ID', 'Time', 'Lots', 'Symbol', 'P&L', 'Pips', 'Duration', ''];

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">Live Trade Feed</span>
              {floatingPnl !== 0 && (
                <span className={`text-sm font-bold font-mono ${floatingPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {floatingPnl >= 0 ? '+' : ''}${floatingPnl.toFixed(2)}
                </span>
              )}
            </div>
            <div className="text-[10px] font-mono text-muted-foreground">
              {lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString()}` : 'Loading…'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-yellow-400/10 text-yellow-400">
              {openPositions.length} Open
            </span>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/5 text-muted-foreground">
              {closedTrades.length} Closed
            </span>
          </div>
          <button onClick={() => { fetchOpen(); if (tab === 'closed') fetchClosed(); }} disabled={loading}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground">
            <RefreshCw className={`w-3.5 h-3.5 ${loading || closedLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        {[
          { id: 'open', label: `Open (${openPositions.length})` },
          { id: 'closed', label: `Closed (${closedTrades.length})` },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-xs font-semibold transition-colors border-b-2 ${tab === t.id ? 'text-primary border-primary' : 'text-muted-foreground border-transparent hover:text-foreground'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Floating P&L banner */}
      {tab === 'open' && openPositions.length > 0 && floatingPnl !== 0 && (
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

      {/* Content */}
      {tab === 'open' && (
        <>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : openPositions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Activity className="w-8 h-8 text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground">No open positions</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {openHeaders.map(h => (
                      <th key={h} className="px-3 py-2.5 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {openPositions.map((t, i) => (
                      <OpenTradeRow key={t.trade_id || i} trade={t} />
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
          {/* Open positions count */}
          <div className="px-5 py-2.5 border-t text-xs font-mono text-muted-foreground"
            style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.1)' }}>
            Open positions: <strong className="text-foreground">{openPositions.length}</strong>
          </div>
        </>
      )}

      {tab === 'closed' && (
        <>
          {closedLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : closedTrades.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Activity className="w-8 h-8 text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground">No closed trades found</p>
              <p className="text-xs text-muted-foreground/50 mt-1">Closed deals from last 90 days</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {closedHeaders.map((h, i) => (
                      <th key={i} className="px-4 py-2.5 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {closedTrades.map((t, i) => (
                      <ClosedTradeRow key={t.trade_id || i} trade={t} />
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
              <span>Total: <strong className="text-foreground">{closedTrades.length}</strong></span>
              <span>Wins: <strong className="text-emerald-400">{winCount}</strong></span>
              <span>Losses: <strong className="text-red-400">{closedTrades.length - winCount}</strong></span>
              <span>Win Rate: <strong className="text-foreground">{closedTrades.length > 0 ? ((winCount / closedTrades.length) * 100).toFixed(1) : 0}%</strong></span>
              <span className="ml-auto">Net P&L: <strong className={totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>{totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}</strong></span>
            </div>
          )}
        </>
      )}
    </div>
  );
}