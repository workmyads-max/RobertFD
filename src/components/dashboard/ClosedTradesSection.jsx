import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, ChevronRight } from 'lucide-react';
import { useAccountTrades } from '@/hooks/useAccountTrades';

function formatDateTime(dt) {
  if (!dt) return '—';
  const d = new Date(dt);
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
}

function TradeDetailDrawer({ trade, onClose }) {
  const pnl = trade.pnl || 0;
  const isBuy = trade.type === 'BUY';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-md rounded-2xl p-6 space-y-4"
        style={{ background: '#14161f', border: '1px solid rgba(255,255,255,0.1)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${isBuy ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>
              {isBuy ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {trade.type}
            </span>
            <span className="text-base font-black text-white">{trade.symbol}</span>
          </div>
          <span className={`text-xl font-black font-mono ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
          </span>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            ['Open Time', formatDateTime(trade.open_time)],
            ['Close Time', formatDateTime(trade.close_time)],
            ['Open Price', trade.entry?.toFixed(5) || '—'],
            ['Close Price', trade.close?.toFixed(5) || '—'],
            ['Lots', (trade.lots || 0).toFixed(2)],
            ['Pips', trade.pips?.toFixed(1) || '—'],
            ['Gross P&L', `$${(trade.profit || 0).toFixed(2)}`],
            ['Commission', `$${(trade.commission || 0).toFixed(2)}`],
            ['Swap', `$${(trade.swap || 0).toFixed(2)}`],
            ['Trade ID', trade.trade_id || '—'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">{label}</div>
              <div className="text-xs font-mono font-semibold text-white/90">{value}</div>
            </div>
          ))}
        </div>

        <button onClick={onClose}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white/60 hover:text-white transition-colors"
          style={{ background: 'rgba(255,255,255,0.05)' }}>
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}

const PAGE_SIZE = 12;

// Accept pre-fetched trades from parent (AccountOverview) to avoid duplicate MT5 calls.
// Falls back to the resilient useAccountTrades hook when used standalone.
export default function ClosedTradesSection({ account, trades: propTrades, loading: propLoading }) {
  const { trades: hookTrades, isLoading: hookLoading } = useAccountTrades(account, { intervalMs: 60000 });
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [page, setPage] = useState(1);

  const isControlled = propTrades !== undefined;
  const trades = isControlled ? propTrades : hookTrades;
  const loading = isControlled ? (propLoading ?? false) : hookLoading;

  const totalPnl = trades.reduce((s, t) => s + (t.pnl || 0), 0);
  const winCount = trades.filter(t => (t.pnl || 0) > 0).length;
  const totalPages = Math.ceil(trades.length / PAGE_SIZE);
  const paginated = trades.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <div className="space-y-3">
        {/* Title row */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground">Closed Trades</h3>
          <div className="flex items-center gap-3">
            {trades.length > 0 && (
              <span className={`text-sm font-bold font-mono ${totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>

          {loading ? (
            <div className="flex items-center justify-center py-14">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : trades.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <p className="text-sm text-white/30">No closed trades in the last 90 days</p>
            </div>
          ) : (
            <>
              {/* Column headers */}
              <div className="grid gap-0 px-5 py-3 border-b"
                style={{ borderColor: 'rgba(255,255,255,0.05)', gridTemplateColumns: '48px 1fr 1fr 1fr 32px' }}>
                <div />
                <div className="text-[11px] text-white/35 font-medium">Open</div>
                <div className="text-[11px] text-white/35 font-medium">Symbol</div>
                <div className="text-[11px] text-white/35 font-medium text-right">PnL</div>
                <div />
              </div>

              {/* Trade rows */}
              <div>
                <AnimatePresence>
                  {paginated.map((trade, i) => {
                    const isBuy = trade.type === 'BUY';
                    const pnl = trade.pnl || 0;
                    const isProfit = pnl >= 0;

                    return (
                      <motion.div
                        key={trade.trade_id || i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: Math.min(i * 0.03, 0.3) }}
                        className="grid items-center px-5 py-4 border-b cursor-pointer hover:bg-white/[0.025] transition-colors"
                        style={{ borderColor: 'rgba(255,255,255,0.05)', gridTemplateColumns: '48px 1fr 1fr 1fr 32px' }}
                        onClick={() => setSelectedTrade(trade)}
                      >
                        {/* Direction icon */}
                        <div>
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isBuy ? 'bg-emerald-400/15' : 'bg-red-400/15'}`}>
                            {isBuy
                              ? <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                              : <ArrowDownRight className="w-4 h-4 text-red-400" />}
                          </div>
                        </div>

                        {/* Open time */}
                        <div>
                          {trade.open_time ? (
                            <>
                              <div className="text-xs text-white/70 font-mono">
                                {new Date(trade.open_time).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </div>
                              <div className="text-[10px] text-white/35 font-mono">
                                {new Date(trade.open_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                              </div>
                            </>
                          ) : <span className="text-xs text-white/30">—</span>}
                        </div>

                        {/* Symbol */}
                        <div className="text-sm font-black text-white">{trade.symbol || '—'}</div>

                        {/* PnL */}
                        <div className="text-right">
                          <span className={`text-sm font-black font-mono ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isProfit ? '+' : ''}${Math.abs(pnl).toFixed(2)}
                          </span>
                        </div>

                        {/* Arrow */}
                        <div className="flex justify-end">
                          <ChevronRight className="w-4 h-4 text-white/25" />
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1.5 px-5 py-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs text-white/40 hover:text-white/70 disabled:opacity-20 transition-colors"
                    style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                    ‹
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => setPage(p)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all"
                      style={{
                        background: page === p ? 'rgba(255,92,0,0.2)' : 'transparent',
                        border: `1px solid ${page === p ? 'rgba(255,92,0,0.5)' : 'rgba(255,255,255,0.08)'}`,
                        color: page === p ? '#FF5C00' : 'rgba(255,255,255,0.4)',
                      }}>
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs text-white/40 hover:text-white/70 disabled:opacity-20 transition-colors"
                    style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                    ›
                  </button>
                </div>
              )}

              {/* Footer summary */}
              <div className="flex flex-wrap items-center gap-4 px-5 py-3 text-xs font-mono text-white/35"
                style={{ background: 'rgba(0,0,0,0.15)' }}>
                <span>{trades.length} trades</span>
                <span className="text-emerald-400">{winCount} wins</span>
                <span className="text-red-400">{trades.length - winCount} losses</span>
                <span className="ml-auto">
                  Win rate: <strong className="text-white/60">{trades.length > 0 ? ((winCount / trades.length) * 100).toFixed(0) : 0}%</strong>
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Detail drawer */}
      <AnimatePresence>
        {selectedTrade && (
          <TradeDetailDrawer trade={selectedTrade} onClose={() => setSelectedTrade(null)} />
        )}
      </AnimatePresence>
    </>
  );
}