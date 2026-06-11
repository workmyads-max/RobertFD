import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, TrendingUp, TrendingDown, Clock } from 'lucide-react';

function fmt(n, d = 2) { return (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }); }

function fmtTime(seconds) {
  if (!seconds || seconds < 0) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function LiveTradeFeed({ account, trades, onRefresh }) {
  const openTrades = trades.filter(t => t.status === 'open').sort((a, b) => {
    const aTime = a.open_time ? new Date(a.open_time).getTime() : 0;
    const bTime = b.open_time ? new Date(b.open_time).getTime() : 0;
    return bTime - aTime;
  });

  const totalProfit = openTrades.reduce((s, t) => s + (t.pnl || 0), 0);

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}>
      <div className="flex items-center justify-between px-5 py-4 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,92,0,0.1)' }}>
            <RefreshCw className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-sm font-bold text-foreground">Live Trade Feed</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-bold font-mono ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {totalProfit >= 0 ? '+' : ''}${fmt(totalProfit)}
          </span>
          <button onClick={onRefresh}
            className="flex items-center gap-1.5 text-[10px] font-semibold text-white/40 hover:text-white/70 transition-colors">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
      </div>

      {openTrades.length === 0 ? (
        <div className="py-12 text-center text-sm text-white/30">No open positions</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {['TYPE/ID', 'TIME', 'LOTS', 'SYMBOL', 'PNL', 'PIPS', 'DURATION'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-white/30">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {openTrades.map((t, i) => {
                const isBuy = t.type === 'BUY';
                const openTime = t.open_time ? new Date(t.open_time) : null;
                const now = new Date();
                const durationSec = openTime ? Math.floor((now - openTime.getTime()) / 1000) : 0;
                return (
                  <tr key={t.trade_id || i}
                    className="border-b hover:bg-white/[0.02] transition-colors"
                    style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${isBuy ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        <span className="font-mono font-bold text-white/70">{isBuy ? 'BUY' : 'SELL'}</span>
                        <span className="font-mono text-[10px] text-white/40">{t.trade_id?.slice(0, 6)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-[10px] text-white/50">
                      {openTime ? openTime.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) + ' ' + openTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="px-5 py-3 font-mono text-white/60">{(t.lots || 0).toFixed(3)}</td>
                    <td className="px-5 py-3 font-bold text-white/80">{t.symbol}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono ${
                        (t.pnl || 0) >= 0 ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'
                      }`}>
                        {(t.pnl || 0) >= 0 ? '+' : ''}${fmt(t.pnl || 0)}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-[10px] text-white/50">0.0</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-white/50">
                        <Clock className="w-3 h-3" />
                        {fmtTime(durationSec)}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="px-5 py-3 border-t text-[10px] font-mono text-white/40"
        style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        Open positions: {openTrades.length}
      </div>
    </div>
  );
}