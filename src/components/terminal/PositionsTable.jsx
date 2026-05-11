import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, TrendingUp, TrendingDown, Clock, Trash2, Scissors, CheckSquare, Square, TrendingDown as TrendDown, DollarSign } from 'lucide-react';
import { INSTRUMENTS, calcPnl } from './terminalConfig';

function StatusBadge({ reason }) {
  const colors = {
    TP:     { bg: 'rgba(16,185,129,0.18)',  text: '#10b981', border: 'rgba(16,185,129,0.35)' },
    SL:     { bg: 'rgba(239,68,68,0.18)',   text: '#ef4444', border: 'rgba(239,68,68,0.35)' },
    Manual: { bg: 'rgba(148,163,184,0.12)', text: '#94a3b8', border: 'rgba(148,163,184,0.2)' },
    Partial:{ bg: 'rgba(255,92,0,0.15)',    text: '#FF5C00', border: 'rgba(255,92,0,0.3)'   },
    'DD Breach':{ bg:'rgba(239,68,68,0.2)', text:'#ef4444',  border:'rgba(239,68,68,0.4)'   },
  };
  const c = colors[reason] || colors.Manual;
  return (
    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
      {reason}
    </span>
  );
}

export default function PositionsTable({ positions, pendingOrders, closedTrades, prices, onClose, onCancelPending, onBulkClose }) {
  const [tab, setTab] = useState('positions');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [partialLots, setPartialLots] = useState({});

  // ── Aggregates ─────────────────────────────────────────────────────────────
  const totalFloat = positions.reduce((s, pos) => {
    const p = prices[pos.symbol];
    const cp = p ? (pos.type === 'BUY' ? p.bid : p.ask) : pos.entry;
    return s + calcPnl(pos, cp);
  }, 0);
  const profitPos = positions.filter(pos => {
    const p = prices[pos.symbol];
    const cp = p ? (pos.type === 'BUY' ? p.bid : p.ask) : pos.entry;
    return calcPnl(pos, cp) > 0;
  });
  const lossPos = positions.filter(pos => {
    const p = prices[pos.symbol];
    const cp = p ? (pos.type === 'BUY' ? p.bid : p.ask) : pos.entry;
    return calcPnl(pos, cp) <= 0;
  });

  const toggleSelect = (id) => {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const allSelected = tab === 'positions'
    ? positions.length > 0 && positions.every(p => selectedIds.has(p.id))
    : pendingOrders.length > 0 && pendingOrders.every(o => selectedIds.has(o.id));
  const toggleAll = () => {
    if (allSelected) { setSelectedIds(new Set()); }
    else { setSelectedIds(new Set(tab === 'positions' ? positions.map(p => p.id) : pendingOrders.map(o => o.id))); }
  };
  const closeSelected = () => {
    positions.filter(p => selectedIds.has(p.id)).forEach(pos => {
      const p = prices[pos.symbol];
      const cp = p ? (pos.type === 'BUY' ? p.bid : p.ask) : pos.entry;
      onClose(pos.id, cp, calcPnl(pos, cp), 'Manual');
    });
    setSelectedIds(new Set());
  };
  const cancelSelected = () => {
    pendingOrders.filter(o => selectedIds.has(o.id)).forEach(o => onCancelPending(o.id));
    setSelectedIds(new Set());
  };

  const BG = 'rgba(10,14,26,0.98)';
  const TH = 'px-3 py-2 text-left text-[9px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap';
  const TD = 'px-3 py-2.5 whitespace-nowrap';

  return (
    <div className="h-full flex flex-col" style={{ background: BG, fontFamily: "'JetBrains Mono', monospace" }}>

      {/* ── TOP BAR: Tabs + always-visible bulk buttons ── */}
      <div className="flex-shrink-0" style={{ background: 'rgba(8,12,22,0.99)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>

        {/* Row 1: Tabs + float P&L */}
        <div className="flex items-center px-2 pt-1 gap-1">
          {[
            { id: 'positions', label: 'Positions', count: positions.length, activeColor: '#FF5C00' },
            { id: 'pending',   label: 'Orders',    count: pendingOrders.length, activeColor: '#f59e0b' },
            { id: 'history',   label: 'History',   count: closedTrades.length, activeColor: '#60a5fa' },
          ].map(t => (
            <button key={t.id}
              onClick={() => { setTab(t.id); setSelectedIds(new Set()); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-[11px] font-bold transition-all border-b-2"
              style={{
                background: tab === t.id ? `${t.activeColor}10` : 'transparent',
                borderColor: tab === t.id ? t.activeColor : 'transparent',
                color: tab === t.id ? t.activeColor : '#475569',
              }}>
              {t.label}
              {t.count > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[8px] font-black"
                  style={{
                    background: tab === t.id ? `${t.activeColor}25` : 'rgba(255,255,255,0.07)',
                    color: tab === t.id ? t.activeColor : '#64748b',
                  }}>
                  {t.count}
                </span>
              )}
            </button>
          ))}

          {/* Float P&L live */}
          {positions.length > 0 && (
            <motion.div
              key={Math.round(totalFloat * 10)}
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 0.3 }}
              className="ml-2 flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-black"
              style={{
                background: totalFloat >= 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                border: `1px solid ${totalFloat >= 0 ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
                color: totalFloat >= 0 ? '#10b981' : '#ef4444',
              }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: totalFloat >= 0 ? '#10b981' : '#ef4444' }} />
              Float: {totalFloat >= 0 ? '+' : ''}${totalFloat.toFixed(2)}
            </motion.div>
          )}
        </div>

        {/* Row 2: Always-visible bulk action buttons when positions exist */}
        {tab === 'positions' && positions.length > 0 && (
          <div className="flex items-center gap-1.5 px-3 pb-2 pt-1 flex-wrap">
            {/* Select all checkbox */}
            <button onClick={toggleAll}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#64748b' }}>
              {allSelected
                ? <CheckSquare className="w-3.5 h-3.5 text-primary" />
                : <Square className="w-3.5 h-3.5" />}
              {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select'}
            </button>

            {/* Close Selected — only when something is selected */}
            {selectedIds.size > 0 && (
              <motion.button initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                onClick={closeSelected}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black transition-all"
                style={{ background: 'rgba(239,68,68,0.18)', border: '1px solid rgba(239,68,68,0.45)', color: '#ef4444' }}>
                <X className="w-3 h-3" /> Close {selectedIds.size}
              </motion.button>
            )}

            <div className="w-px h-5 bg-white/[0.08] mx-0.5" />

            {/* ── Always visible MT5-style bulk buttons ── */}
            <button
              onClick={() => onBulkClose('profit')}
              disabled={profitPos.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', color: '#10b981' }}>
              <TrendingUp className="w-3 h-3" />
              Close Profit
              <span className="px-1.5 py-0.5 rounded-full text-[8px]"
                style={{ background: 'rgba(16,185,129,0.25)', color: '#10b981' }}>
                {profitPos.length}
              </span>
            </button>

            <button
              onClick={() => onBulkClose('loss')}
              disabled={lossPos.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: 'rgba(239,68,68,0.13)', border: '1px solid rgba(239,68,68,0.38)', color: '#ef4444' }}>
              <TrendingDown className="w-3 h-3" />
              Close Loss
              <span className="px-1.5 py-0.5 rounded-full text-[8px]"
                style={{ background: 'rgba(239,68,68,0.22)', color: '#ef4444' }}>
                {lossPos.length}
              </span>
            </button>

            <button
              onClick={() => onBulkClose('all')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black transition-all"
              style={{ background: 'rgba(255,92,0,0.15)', border: '1px solid rgba(255,92,0,0.42)', color: '#FF5C00' }}>
              <DollarSign className="w-3 h-3" />
              Close All
              <span className="px-1.5 py-0.5 rounded-full text-[8px]"
                style={{ background: 'rgba(255,92,0,0.25)', color: '#FF5C00' }}>
                {positions.length}
              </span>
            </button>
          </div>
        )}

        {tab === 'pending' && pendingOrders.length > 0 && (
          <div className="flex items-center gap-1.5 px-3 pb-2 pt-1">
            <button onClick={toggleAll}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#64748b' }}>
              {allSelected ? <CheckSquare className="w-3.5 h-3.5 text-primary" /> : <Square className="w-3.5 h-3.5" />}
              {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select'}
            </button>
            {selectedIds.size > 0 && (
              <motion.button initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                onClick={cancelSelected}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black"
                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444' }}>
                <Trash2 className="w-3 h-3" /> Cancel {selectedIds.size}
              </motion.button>
            )}
            <button onClick={() => pendingOrders.forEach(o => onCancelPending(o.id))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black"
              style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.35)', color: '#f59e0b' }}>
              <X className="w-3 h-3" /> Cancel All ({pendingOrders.length})
            </button>
          </div>
        )}
      </div>

      {/* ── Table ── */}
      <div className="flex-1 overflow-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,92,0,0.2) transparent' }}>

        {/* OPEN POSITIONS */}
        {tab === 'positions' && (
          <table className="w-full text-[10px] font-mono min-w-[760px]">
            <thead>
              <tr style={{ background: 'rgba(8,12,22,0.95)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <th className={TH} style={{ width: 30 }}>
                  <input type="checkbox" checked={allSelected} onChange={toggleAll}
                    className="w-3 h-3 accent-primary cursor-pointer" />
                </th>
                {['Symbol', 'Dir', 'Lots', 'Entry', 'Current', 'P&L', 'Margin', 'SL', 'TP', 'Time', 'Partial ✂', '✕'].map(h => (
                  <th key={h} className={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {positions.length === 0 ? (
                <tr><td colSpan={13} className="px-4 py-10 text-center text-slate-600 text-[11px]">
                  <TrendingUp className="w-7 h-7 opacity-15 mx-auto mb-2" />
                  No open positions — place a trade to get started
                </td></tr>
              ) : positions.map(pos => {
                const p   = prices[pos.symbol];
                const cp  = p ? (pos.type === 'BUY' ? p.bid : p.ask) : pos.entry;
                const pnl = calcPnl(pos, cp);
                const inst = INSTRUMENTS.find(i => i.symbol === pos.symbol);
                const isChecked = selectedIds.has(pos.id);
                const isProfit = pnl >= 0;
                return (
                  <motion.tr key={pos.id}
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className={`border-b group transition-all ${isChecked ? 'bg-primary/5' : 'hover:bg-white/[0.025]'}`}
                    style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                    <td className={TD}>
                      <input type="checkbox" checked={isChecked} onChange={() => toggleSelect(pos.id)}
                        className="w-3 h-3 accent-primary cursor-pointer" />
                    </td>
                    <td className={`${TD} font-black text-white text-[11px]`}>{pos.symbol}</td>
                    <td className={`${TD} font-black text-[11px]`}
                      style={{ color: pos.type === 'BUY' ? '#10b981' : '#ef4444' }}>
                      <span className="flex items-center gap-1">
                        {pos.type === 'BUY' ? '▲' : '▼'} {pos.type}
                      </span>
                    </td>
                    <td className={`${TD} text-slate-300`}>{pos.lots}</td>
                    <td className={`${TD} text-slate-500`}>{pos.entry?.toFixed(inst?.digits)}</td>
                    <td className={`${TD} font-bold`} style={{ color: isProfit ? '#6ee7b7' : '#fca5a5' }}>
                      {cp?.toFixed(inst?.digits)}
                    </td>
                    <td className={TD}>
                      <motion.span
                        key={Math.round(pnl * 100)}
                        initial={{ scale: 0.95 }} animate={{ scale: 1 }}
                        className="px-2 py-0.5 rounded-md text-[11px] font-black"
                        style={{
                          background: isProfit ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                          color: isProfit ? '#10b981' : '#ef4444',
                          border: `1px solid ${isProfit ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                        }}>
                        {isProfit ? '+' : ''}${pnl.toFixed(2)}
                      </motion.span>
                    </td>
                    <td className={`${TD} text-slate-500`}>${pos.margin?.toFixed(0)}</td>
                    <td className={`${TD}`} style={{ color: pos.sl ? '#f87171' : '#1e293b' }}>{pos.sl || '—'}</td>
                    <td className={`${TD}`} style={{ color: pos.tp ? '#6ee7b7' : '#1e293b' }}>{pos.tp || '—'}</td>
                    <td className={`${TD} text-slate-600`}>{pos.time}</td>
                    {/* Partial close — always visible now */}
                    <td className={TD}>
                      <div className="flex items-center gap-1">
                        <input
                          type="number" step="0.01" min="0.01" max={pos.lots}
                          placeholder={String(pos.lots)}
                          value={partialLots[pos.id] || ''}
                          onChange={e => setPartialLots(prev => ({ ...prev, [pos.id]: e.target.value }))}
                          onClick={e => e.stopPropagation()}
                          className="w-14 rounded px-1.5 py-1 text-[9px] font-mono text-white outline-none"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                        />
                        <button
                          onClick={() => {
                            const partLots = parseFloat(partialLots[pos.id]);
                            if (!partLots || partLots <= 0 || partLots > pos.lots) {
                              onClose(pos.id, cp, pnl, 'Manual'); return;
                            }
                            const partPnl = calcPnl({ ...pos, lots: partLots }, cp);
                            onClose(pos.id, cp, partPnl, 'Partial');
                            setPartialLots(prev => { const n = { ...prev }; delete n[pos.id]; return n; });
                          }}
                          title="Partial close at entered lots (or full close if empty)"
                          className="flex items-center gap-0.5 px-2 py-1 rounded text-[9px] font-black text-orange-300 transition-all hover:bg-orange-500/25"
                          style={{ background: 'rgba(255,92,0,0.12)', border: '1px solid rgba(255,92,0,0.3)' }}>
                          <Scissors className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    {/* Full close */}
                    <td className={TD}>
                      <button onClick={() => onClose(pos.id, cp, pnl)}
                        className="w-6 h-6 flex items-center justify-center rounded-lg transition-all hover:scale-110"
                        style={{ background: 'rgba(239,68,68,0.18)', border: '1px solid rgba(239,68,68,0.4)' }}>
                        <X className="w-3 h-3 text-red-400" />
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
            {positions.length > 0 && (
              <tfoot>
                <tr style={{ background: 'rgba(6,10,20,0.95)', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                  <td colSpan={6} className="px-3 py-2 text-[9px] text-slate-500">
                    {positions.length} open · {profitPos.length} profit · {lossPos.length} loss
                  </td>
                  <td colSpan={6} className="px-3 py-2 text-right">
                    <span className="text-[11px] font-black"
                      style={{ color: totalFloat >= 0 ? '#10b981' : '#ef4444' }}>
                      Float: {totalFloat >= 0 ? '+' : ''}${totalFloat.toFixed(2)}
                    </span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        )}

        {/* PENDING ORDERS */}
        {tab === 'pending' && (
          <table className="w-full text-[10px] font-mono min-w-[640px]">
            <thead>
              <tr style={{ background: 'rgba(8,12,22,0.95)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <th className={TH} style={{ width: 30 }}>
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} className="w-3 h-3 accent-primary cursor-pointer" />
                </th>
                {['Type', 'Symbol', 'Lots', 'Order Price', 'Current', 'Diff', 'SL', 'TP', 'Placed', '✕'].map(h => (
                  <th key={h} className={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pendingOrders.length === 0 ? (
                <tr><td colSpan={11} className="px-4 py-10 text-center text-slate-600 text-[11px]">
                  <Clock className="w-7 h-7 opacity-15 mx-auto mb-2" />
                  No pending orders
                </td></tr>
              ) : pendingOrders.map(o => {
                const p = prices[o.symbol];
                const cp = p ? (o.type === 'BUY' ? p.ask : p.bid) : null;
                const inst = INSTRUMENTS.find(i => i.symbol === o.symbol);
                const diff = cp ? cp - o.entry : null;
                const isChecked = selectedIds.has(o.id);
                const otColors = { BUY_LIMIT: '#10b981', BUY_STOP: '#34d399', SELL_LIMIT: '#f87171', SELL_STOP: '#ef4444' };
                const otColor = otColors[o.orderType] || '#f59e0b';
                return (
                  <motion.tr key={o.id} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className={`border-b group hover:bg-white/[0.025] ${isChecked ? 'bg-yellow-500/5' : ''}`}
                    style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                    <td className={TD}><input type="checkbox" checked={isChecked} onChange={() => toggleSelect(o.id)} className="w-3 h-3 accent-primary cursor-pointer" /></td>
                    <td className={TD}><span className="px-2 py-0.5 rounded text-[9px] font-black"
                      style={{ background: `${otColor}18`, color: otColor, border: `1px solid ${otColor}35` }}>{o.orderType?.replace('_', ' ')}</span></td>
                    <td className={`${TD} font-black text-white`}>{o.symbol}</td>
                    <td className={`${TD} text-slate-300`}>{o.lots}</td>
                    <td className={`${TD} font-bold text-yellow-300`}>{o.entry?.toFixed(inst?.digits)}</td>
                    <td className={`${TD} text-slate-400`}>{cp?.toFixed(inst?.digits) || '—'}</td>
                    <td className={`${TD}`} style={{ color: diff > 0 ? '#10b981' : '#ef4444' }}>
                      {diff != null ? `${diff > 0 ? '+' : ''}${diff.toFixed(inst?.digits)}` : '—'}
                    </td>
                    <td className={`${TD} text-red-400/70`}>{o.sl || '—'}</td>
                    <td className={`${TD} text-emerald-400/70`}>{o.tp || '—'}</td>
                    <td className={`${TD} text-slate-600`}>{o.time}</td>
                    <td className={TD}><button onClick={() => onCancelPending(o.id)}
                      className="w-6 h-6 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      style={{ background: 'rgba(239,68,68,0.18)', border: '1px solid rgba(239,68,68,0.4)' }}>
                      <X className="w-3 h-3 text-red-400" /></button></td>
                  </motion.tr>
                );
              })}
            </tbody>
            {pendingOrders.length > 0 && (
              <tfoot>
                <tr style={{ background: 'rgba(6,10,20,0.95)', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                  <td colSpan={11} className="px-3 py-2 text-[9px] text-slate-500">
                    {pendingOrders.length} order{pendingOrders.length !== 1 ? 's' : ''} waiting · triggers automatically at price
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        )}

        {/* HISTORY */}
        {tab === 'history' && (
          <table className="w-full text-[10px] font-mono min-w-[600px]">
            <thead>
              <tr style={{ background: 'rgba(8,12,22,0.95)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                {['Symbol', 'Type', 'Lots', 'Entry', 'Close', 'P&L', 'Reason', 'Time'].map(h => (
                  <th key={h} className={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {closedTrades.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-600 text-[11px]">
                  <TrendingDown className="w-7 h-7 opacity-15 mx-auto mb-2" />
                  No trade history yet
                </td></tr>
              ) : closedTrades.map((t, i) => {
                const inst = INSTRUMENTS.find(ii => ii.symbol === t.symbol);
                return (
                  <tr key={i} className="border-b hover:bg-white/[0.015]" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                    <td className={`${TD} font-black text-white text-[11px]`}>{t.symbol}</td>
                    <td className={`${TD} font-black text-[11px]`}
                      style={{ color: t.type === 'BUY' ? '#10b981' : '#ef4444' }}>
                      {t.type === 'BUY' ? '▲' : '▼'} {t.type}
                    </td>
                    <td className={`${TD} text-slate-400`}>{t.lots}</td>
                    <td className={`${TD} text-slate-500`}>{t.entry?.toFixed(inst?.digits)}</td>
                    <td className={`${TD} text-slate-400`}>{t.close?.toFixed(inst?.digits)}</td>
                    <td className={TD}>
                      <span className="px-2 py-0.5 rounded-md font-black text-[10px]"
                        style={{ background: t.pnl >= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: t.pnl >= 0 ? '#10b981' : '#ef4444' }}>
                        {t.pnl >= 0 ? '+' : ''}${t.pnl?.toFixed(2)}
                      </span>
                    </td>
                    <td className={TD}><StatusBadge reason={t.reason} /></td>
                    <td className={`${TD} text-slate-600`}>{t.closeTime}</td>
                  </tr>
                );
              })}
            </tbody>
            {closedTrades.length > 0 && (() => {
              const wins = closedTrades.filter(t => t.pnl > 0);
              const total = closedTrades.reduce((s, t) => s + (t.pnl || 0), 0);
              return (
                <tfoot>
                  <tr style={{ background: 'rgba(6,10,20,0.95)', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                    <td colSpan={5} className="px-3 py-2 text-[9px] text-slate-500">
                      {closedTrades.length} trades · Win: {closedTrades.length ? ((wins.length / closedTrades.length) * 100).toFixed(0) : 0}%
                    </td>
                    <td colSpan={3} className="px-3 py-2 text-right">
                      <span className="text-[11px] font-black" style={{ color: total >= 0 ? '#10b981' : '#ef4444' }}>
                        Total: {total >= 0 ? '+' : ''}${total.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              );
            })()}
          </table>
        )}
      </div>
    </div>
  );
}