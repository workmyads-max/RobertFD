import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Clock, CheckSquare, XSquare, Trash2, AlertTriangle } from 'lucide-react';
import { INSTRUMENTS, calcPnl } from './terminalConfig';

function StatusBadge({ reason }) {
  const colors = {
    TP: { bg: 'rgba(16,185,129,0.18)', text: '#10b981', border: 'rgba(16,185,129,0.35)' },
    SL: { bg: 'rgba(239,68,68,0.18)', text: '#ef4444', border: 'rgba(239,68,68,0.35)' },
    Manual: { bg: 'rgba(148,163,184,0.12)', text: '#94a3b8', border: 'rgba(148,163,184,0.2)' },
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
  const [selectAll, setSelectAll] = useState(false);

  const totalPnl = positions.reduce((s, pos) => {
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
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedIds(new Set());
      setSelectAll(false);
    } else {
      const ids = tab === 'positions' ? new Set(positions.map(p => p.id)) : new Set(pendingOrders.map(o => o.id));
      setSelectedIds(ids);
      setSelectAll(true);
    }
  };

  const closeSelected = () => {
    positions.filter(p => selectedIds.has(p.id)).forEach(pos => {
      const p = prices[pos.symbol];
      const cp = p ? (pos.type === 'BUY' ? p.bid : p.ask) : pos.entry;
      onClose(pos.id, cp, calcPnl(pos, cp), 'Manual');
    });
    setSelectedIds(new Set());
    setSelectAll(false);
  };

  const cancelSelected = () => {
    pendingOrders.filter(o => selectedIds.has(o.id)).forEach(o => onCancelPending(o.id));
    setSelectedIds(new Set());
    setSelectAll(false);
  };

  const BG = 'rgba(10,14,26,0.98)';
  const BORDER = '1px solid rgba(255,255,255,0.07)';
  const TH = 'px-3 py-2 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap';
  const TD = 'px-3 py-2 whitespace-nowrap';

  return (
    <div className="h-full flex flex-col" style={{ background: BG, fontFamily: "'JetBrains Mono', monospace" }}>

      {/* ── Tab bar + bulk controls ── */}
      <div className="flex items-center border-b border-white/[0.07] flex-shrink-0 gap-0" style={{ background: 'rgba(8,12,22,0.99)' }}>
        {[
          { id: 'positions', label: 'Positions', count: positions.length, color: positions.length > 0 ? '#FF5C00' : undefined },
          { id: 'pending',   label: 'Orders',    count: pendingOrders.length, color: pendingOrders.length > 0 ? '#f59e0b' : undefined },
          { id: 'history',   label: 'History',   count: closedTrades.length },
        ].map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setSelectedIds(new Set()); setSelectAll(false); }}
            className={`px-4 py-2.5 text-[11px] font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              tab === t.id
                ? 'text-primary border-primary bg-primary/5'
                : 'text-slate-500 hover:text-slate-300 border-transparent hover:bg-white/[0.03]'
            }`}>
            {t.label}
            {t.count > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                style={{ background: t.color ? `${t.color}22` : 'rgba(255,255,255,0.07)', color: t.color || '#64748b', border: `1px solid ${t.color ? `${t.color}44` : 'transparent'}` }}>
                {t.count}
              </span>
            )}
          </button>
        ))}

        {/* Float P&L summary */}
        {tab === 'positions' && positions.length > 0 && (
          <div className="ml-3 flex items-center gap-1.5">
            <span className="text-[9px] text-slate-500 font-mono">Float P&L:</span>
            <span className={`text-[11px] font-black ${totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
            </span>
          </div>
        )}

        {/* Right-side bulk actions */}
        <div className="ml-auto flex items-center gap-1 pr-3">
          {tab === 'positions' && positions.length > 0 && (
            <>
              {selectedIds.size > 0 && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  onClick={closeSelected}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-bold text-red-400 transition-all"
                  style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <X className="w-3 h-3" /> Close {selectedIds.size}
                </motion.button>
              )}
              <button onClick={() => onBulkClose('profit')} disabled={profitPos.length === 0}
                className="px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all disabled:opacity-30"
                style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' }}
                title="Close all profitable positions">
                ✓ Profit ({profitPos.length})
              </button>
              <button onClick={() => onBulkClose('loss')} disabled={lossPos.length === 0}
                className="px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all disabled:opacity-30"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}
                title="Close all losing positions">
                ✗ Loss ({lossPos.length})
              </button>
              <button onClick={() => onBulkClose('all')}
                className="px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}
                title="Close all positions">
                Close All
              </button>
            </>
          )}
          {tab === 'pending' && pendingOrders.length > 0 && selectedIds.size > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              onClick={cancelSelected}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-bold text-red-400 transition-all"
              style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <Trash2 className="w-3 h-3" /> Cancel {selectedIds.size}
            </motion.button>
          )}
          {tab === 'pending' && pendingOrders.length > 0 && (
            <button onClick={() => pendingOrders.forEach(o => onCancelPending(o.id))}
              className="px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all"
              style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)' }}
              title="Cancel all pending orders">
              Cancel All
            </button>
          )}
        </div>
      </div>

      {/* ── Table content ── */}
      <div className="flex-1 overflow-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,92,0,0.2) transparent' }}>

        {/* OPEN POSITIONS */}
        {tab === 'positions' && (
          <table className="w-full text-[10px] font-mono min-w-[720px]">
            <thead>
              <tr style={{ background: 'rgba(8,12,22,0.95)', borderBottom: BORDER }}>
                <th className={TH} style={{ width: 28 }}>
                  <input type="checkbox" checked={selectAll} onChange={handleSelectAll}
                    className="w-3 h-3 accent-primary cursor-pointer" />
                </th>
                {['Symbol','Type','Lots','Entry','Current','P&L $','Margin','SL','TP','Time',''].map(h => (
                  <th key={h} className={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {positions.length === 0 ? (
                <tr><td colSpan={12} className="px-4 py-8 text-center text-slate-600 text-[11px]">
                  <div className="flex flex-col items-center gap-2">
                    <TrendingUp className="w-6 h-6 opacity-20" />
                    No open positions
                  </div>
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
                    className={`border-b transition-all cursor-default group ${isChecked ? 'bg-primary/5' : 'hover:bg-white/[0.02]'}`}
                    style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                    <td className={TD}>
                      <input type="checkbox" checked={isChecked} onChange={() => toggleSelect(pos.id)}
                        className="w-3 h-3 accent-primary cursor-pointer" />
                    </td>
                    <td className={`${TD} font-bold text-white`}>{pos.symbol}</td>
                    <td className={`${TD} font-black text-[11px] ${pos.type === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {pos.type === 'BUY' ? '▲' : '▼'} {pos.type}
                    </td>
                    <td className={`${TD} text-slate-300`}>{pos.lots}</td>
                    <td className={`${TD} text-slate-400`}>{pos.entry?.toFixed(inst?.digits)}</td>
                    <td className={`${TD} font-bold ${isProfit ? 'text-emerald-300' : 'text-red-300'}`}>{cp?.toFixed(inst?.digits)}</td>
                    <td className={`${TD} font-black text-[11px] ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                      <span className="px-1.5 py-0.5 rounded"
                        style={{ background: isProfit ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)' }}>
                        {isProfit ? '+' : ''}${pnl.toFixed(2)}
                      </span>
                    </td>
                    <td className={`${TD} text-slate-500`}>${pos.margin?.toFixed(0)}</td>
                    <td className={`${TD} text-red-400/70`}>{pos.sl || <span className="text-slate-700">—</span>}</td>
                    <td className={`${TD} text-emerald-400/70`}>{pos.tp || <span className="text-slate-700">—</span>}</td>
                    <td className={`${TD} text-slate-600`}>{pos.time}</td>
                    <td className={TD}>
                      <button onClick={() => onClose(pos.id, cp, pnl)}
                        className="w-5 h-5 flex items-center justify-center rounded transition-all opacity-0 group-hover:opacity-100"
                        style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
                        <X className="w-2.5 h-2.5 text-red-400" />
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
            {positions.length > 0 && (
              <tfoot>
                <tr style={{ background: 'rgba(8,12,22,0.9)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <td colSpan={6} className="px-3 py-1.5 text-[9px] text-slate-500">
                    {positions.length} position{positions.length !== 1 ? 's' : ''} · {profitPos.length} profit · {lossPos.length} loss
                  </td>
                  <td colSpan={6} className={`px-3 py-1.5 text-[11px] font-black text-right ${totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    Total Float: {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
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
              <tr style={{ background: 'rgba(8,12,22,0.95)', borderBottom: BORDER }}>
                <th className={TH} style={{ width: 28 }}>
                  <input type="checkbox" checked={selectAll} onChange={handleSelectAll}
                    className="w-3 h-3 accent-primary cursor-pointer" />
                </th>
                {['Type','Symbol','Lots','Order Price','Current','Diff','SL','TP','Placed','Cancel'].map(h => (
                  <th key={h} className={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pendingOrders.length === 0 ? (
                <tr><td colSpan={11} className="px-4 py-8 text-center text-slate-600 text-[11px]">
                  <div className="flex flex-col items-center gap-2">
                    <Clock className="w-6 h-6 opacity-20" />
                    No pending orders
                  </div>
                </td></tr>
              ) : pendingOrders.map(o => {
                const p = prices[o.symbol];
                const cp = p ? (o.type === 'BUY' ? p.ask : p.bid) : null;
                const inst = INSTRUMENTS.find(i => i.symbol === o.symbol);
                const diff = cp ? (cp - o.entry) : null;
                const isChecked = selectedIds.has(o.id);
                const orderTypeColors = {
                  BUY_LIMIT: '#10b981', BUY_STOP: '#34d399',
                  SELL_LIMIT: '#f87171', SELL_STOP: '#ef4444',
                };
                const otColor = orderTypeColors[o.orderType] || '#f59e0b';
                return (
                  <motion.tr key={o.id}
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className={`border-b transition-all group ${isChecked ? 'bg-yellow-500/5' : 'hover:bg-white/[0.02]'}`}
                    style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                    <td className={TD}>
                      <input type="checkbox" checked={isChecked} onChange={() => toggleSelect(o.id)}
                        className="w-3 h-3 accent-primary cursor-pointer" />
                    </td>
                    <td className={TD}>
                      <span className="px-2 py-0.5 rounded text-[9px] font-black"
                        style={{ background: `${otColor}18`, color: otColor, border: `1px solid ${otColor}35` }}>
                        {o.orderType?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className={`${TD} font-bold text-white`}>{o.symbol}</td>
                    <td className={`${TD} text-slate-300`}>{o.lots}</td>
                    <td className={`${TD} font-bold text-yellow-300`}>{o.entry?.toFixed(inst?.digits)}</td>
                    <td className={`${TD} text-slate-400`}>{cp?.toFixed(inst?.digits) || '—'}</td>
                    <td className={`${TD} ${diff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {diff != null ? `${diff > 0 ? '+' : ''}${diff.toFixed(inst?.digits)}` : '—'}
                    </td>
                    <td className={`${TD} text-red-400/70`}>{o.sl || <span className="text-slate-700">—</span>}</td>
                    <td className={`${TD} text-emerald-400/70`}>{o.tp || <span className="text-slate-700">—</span>}</td>
                    <td className={`${TD} text-slate-600`}>{o.time}</td>
                    <td className={TD}>
                      <button onClick={() => onCancelPending(o.id)}
                        className="w-5 h-5 flex items-center justify-center rounded transition-all opacity-0 group-hover:opacity-100"
                        style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
                        <X className="w-2.5 h-2.5 text-red-400" />
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
            {pendingOrders.length > 0 && (
              <tfoot>
                <tr style={{ background: 'rgba(8,12,22,0.9)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <td colSpan={11} className="px-3 py-1.5 text-[9px] text-slate-500">
                    {pendingOrders.length} order{pendingOrders.length !== 1 ? 's' : ''} waiting · triggers automatically when price is reached
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
              <tr style={{ background: 'rgba(8,12,22,0.95)', borderBottom: BORDER }}>
                {['Symbol','Type','Lots','Entry','Close','P&L $','Reason','Time'].map(h => (
                  <th key={h} className={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {closedTrades.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-600 text-[11px]">
                  <div className="flex flex-col items-center gap-2">
                    <TrendingDown className="w-6 h-6 opacity-20" />
                    No trade history
                  </div>
                </td></tr>
              ) : closedTrades.map((t, i) => {
                const inst = INSTRUMENTS.find(ii => ii.symbol === t.symbol);
                return (
                  <tr key={i} className="border-b hover:bg-white/[0.015]" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                    <td className={`${TD} font-bold text-white`}>{t.symbol}</td>
                    <td className={`${TD} font-black text-[11px] ${t.type === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {t.type === 'BUY' ? '▲' : '▼'} {t.type}
                    </td>
                    <td className={`${TD} text-slate-400`}>{t.lots}</td>
                    <td className={`${TD} text-slate-500`}>{t.entry?.toFixed(inst?.digits)}</td>
                    <td className={`${TD} text-slate-400`}>{t.close?.toFixed(inst?.digits)}</td>
                    <td className={TD}>
                      <span className={`px-1.5 py-0.5 rounded font-black text-[10px] ${t.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                        style={{ background: t.pnl >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }}>
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
              const totalHistPnl = closedTrades.reduce((s, t) => s + (t.pnl || 0), 0);
              return (
                <tfoot>
                  <tr style={{ background: 'rgba(8,12,22,0.9)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <td colSpan={5} className="px-3 py-1.5 text-[9px] text-slate-500">
                      {closedTrades.length} trades · Win rate: {closedTrades.length ? ((wins.length / closedTrades.length) * 100).toFixed(0) : 0}%
                    </td>
                    <td colSpan={3} className={`px-3 py-1.5 text-[11px] font-black text-right ${totalHistPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      Total: {totalHistPnl >= 0 ? '+' : ''}${totalHistPnl.toFixed(2)}
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