import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Edit2, TrendingUp, TrendingDown } from 'lucide-react';
import { INSTRUMENTS, calcPnl } from './terminalConfig';

export default function PositionsTable({ positions, pendingOrders, closedTrades, prices, onClose, onCancelPending, onBulkClose }) {
  const [tab, setTab] = useState('positions');

  const tabs = [
    { id: 'positions', label: `Positions (${positions.length})` },
    { id: 'pending',   label: `Pending (${pendingOrders.length})` },
    { id: 'history',   label: `History (${closedTrades.length})` },
  ];

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

  return (
    <div className="h-full flex flex-col" style={{ background: '#07070b' }}>
      {/* Tab bar + bulk actions */}
      <div className="flex items-center border-b border-white/[0.06] flex-shrink-0">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-[11px] font-mono border-r border-white/[0.04] transition ${tab === t.id ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-muted-foreground hover:text-foreground'}`}>
            {t.label}
          </button>
        ))}
        {tab === 'positions' && positions.length > 0 && (
          <div className="ml-auto flex items-center gap-1 px-3">
            <span className="text-[9px] font-mono text-muted-foreground mr-2">
              Float P&L: <span className={totalPnl >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>{totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}</span>
            </span>
            <button onClick={() => onBulkClose('profit')} disabled={profitPos.length === 0}
              className="px-2 py-0.5 rounded text-[9px] font-mono font-bold transition disabled:opacity-30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20">
              Close Profit ({profitPos.length})
            </button>
            <button onClick={() => onBulkClose('loss')} disabled={lossPos.length === 0}
              className="px-2 py-0.5 rounded text-[9px] font-mono font-bold transition disabled:opacity-30 text-red-400 bg-red-500/10 hover:bg-red-500/20">
              Close Loss ({lossPos.length})
            </button>
            <button onClick={() => onBulkClose('all')}
              className="px-2 py-0.5 rounded text-[9px] font-mono font-bold transition text-muted-foreground bg-white/5 hover:bg-white/10">
              Close All
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {/* Open Positions */}
        {tab === 'positions' && (
          <table className="w-full text-[10px] font-mono min-w-[700px]">
            <thead>
              <tr className="border-b border-white/[0.06] sticky top-0" style={{ background: '#07070b' }}>
                {['Symbol','Type','Lots','Entry','Current','P&L','Margin','SL','TP','Duration','×'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-muted-foreground/60 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {positions.length === 0 ? (
                <tr><td colSpan={11} className="px-4 py-6 text-center text-muted-foreground/30">No open positions</td></tr>
              ) : positions.map(pos => {
                const p   = prices[pos.symbol];
                const cp  = p ? (pos.type === 'BUY' ? p.bid : p.ask) : pos.entry;
                const pnl = calcPnl(pos, cp);
                const inst = INSTRUMENTS.find(i => i.symbol === pos.symbol);
                const dur  = pos.time;
                return (
                  <motion.tr key={pos.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="border-b border-white/[0.03] hover:bg-white/[0.015] group">
                    <td className="px-3 py-1.5 font-bold text-foreground">{pos.symbol}</td>
                    <td className={`px-3 py-1.5 font-black ${pos.type === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}>{pos.type}</td>
                    <td className="px-3 py-1.5 text-muted-foreground">{pos.lots}</td>
                    <td className="px-3 py-1.5 text-muted-foreground">{pos.entry.toFixed(inst?.digits)}</td>
                    <td className="px-3 py-1.5 text-foreground">{cp?.toFixed(inst?.digits)}</td>
                    <td className={`px-3 py-1.5 font-black ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}</td>
                    <td className="px-3 py-1.5 text-muted-foreground/60">${pos.margin?.toFixed(0)}</td>
                    <td className="px-3 py-1.5 text-red-400/60">{pos.sl || '—'}</td>
                    <td className="px-3 py-1.5 text-emerald-400/60">{pos.tp || '—'}</td>
                    <td className="px-3 py-1.5 text-muted-foreground/40">{dur}</td>
                    <td className="px-3 py-1.5">
                      <button onClick={() => onClose(pos.id, cp, pnl)}
                        className="w-5 h-5 flex items-center justify-center rounded hover:bg-red-500/20 text-red-400/50 hover:text-red-400 transition">
                        <X className="w-3 h-3" />
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pending Orders */}
        {tab === 'pending' && (
          <table className="w-full text-[10px] font-mono min-w-[600px]">
            <thead>
              <tr className="border-b border-white/[0.06] sticky top-0" style={{ background: '#07070b' }}>
                {['Symbol','Type','Lots','Price','SL','TP','Time','×'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-muted-foreground/60 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pendingOrders.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-6 text-center text-muted-foreground/30">No pending orders</td></tr>
              ) : pendingOrders.map(o => (
                <tr key={o.id} className="border-b border-white/[0.03] hover:bg-white/[0.015]">
                  <td className="px-3 py-1.5 font-bold text-foreground">{o.symbol}</td>
                  <td className="px-3 py-1.5 text-yellow-400 font-bold">{o.orderType?.replace('_', ' ')}</td>
                  <td className="px-3 py-1.5 text-muted-foreground">{o.lots}</td>
                  <td className="px-3 py-1.5 text-foreground">{o.entry}</td>
                  <td className="px-3 py-1.5 text-red-400/60">{o.sl || '—'}</td>
                  <td className="px-3 py-1.5 text-emerald-400/60">{o.tp || '—'}</td>
                  <td className="px-3 py-1.5 text-muted-foreground/40">{o.time}</td>
                  <td className="px-3 py-1.5">
                    <button onClick={() => onCancelPending(o.id)}
                      className="w-5 h-5 flex items-center justify-center rounded hover:bg-red-500/20 text-red-400/50 hover:text-red-400 transition">
                      <X className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* History */}
        {tab === 'history' && (
          <table className="w-full text-[10px] font-mono min-w-[600px]">
            <thead>
              <tr className="border-b border-white/[0.06] sticky top-0" style={{ background: '#07070b' }}>
                {['Symbol','Type','Lots','Entry','Close','P&L','Reason','Time'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-muted-foreground/60 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {closedTrades.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-6 text-center text-muted-foreground/30">No closed trades</td></tr>
              ) : closedTrades.map((t, i) => {
                const inst = INSTRUMENTS.find(ii => ii.symbol === t.symbol);
                return (
                  <tr key={i} className="border-b border-white/[0.03]">
                    <td className="px-3 py-1.5 font-bold text-foreground">{t.symbol}</td>
                    <td className={`px-3 py-1.5 font-black ${t.type === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}>{t.type}</td>
                    <td className="px-3 py-1.5 text-muted-foreground">{t.lots}</td>
                    <td className="px-3 py-1.5 text-muted-foreground">{t.entry?.toFixed(inst?.digits)}</td>
                    <td className="px-3 py-1.5 text-muted-foreground">{t.close?.toFixed(inst?.digits)}</td>
                    <td className={`px-3 py-1.5 font-black ${t.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{t.pnl >= 0 ? '+' : ''}${t.pnl?.toFixed(2)}</td>
                    <td className="px-3 py-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[8px]" style={{
                        background: t.reason === 'TP' ? 'rgba(16,185,129,0.15)' : t.reason === 'SL' ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)',
                        color: t.reason === 'TP' ? '#10b981' : t.reason === 'SL' ? '#ef4444' : '#888',
                      }}>{t.reason}</span>
                    </td>
                    <td className="px-3 py-1.5 text-muted-foreground/40">{t.closeTime}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}