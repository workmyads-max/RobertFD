import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';

function fmtPrice(n) {
  if (!n || isNaN(n)) return '--';
  return n >= 100 ? n.toFixed(2) : n.toFixed(5);
}

export default function MT5PositionsBar({ positions, summary, onClose, loading }) {
  const [tab, setTab] = useState('open');

  const openCount = positions.length;
  const totalProfit = positions.reduce((s, p) => s + (p.profit || 0), 0);

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex items-center gap-1 px-3 pt-2 flex-shrink-0">
        {[
          { id: 'open', label: `Open (${openCount})` },
          { id: 'pending', label: 'Pending' },
          { id: 'closed', label: 'Closed' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${tab === t.id ? 'text-white' : 'text-muted-foreground hover:text-foreground'}`}
            style={tab === t.id ? { background: 'rgba(255,92,0,0.12)' } : {}}>
            {t.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-3">
          <span className="text-[10px] text-muted-foreground">Total:</span>
          <span className={`text-xs font-bold tabular ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(2)} USD
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto mt-1">
        {tab === 'open' && openCount === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-muted-foreground py-6">
            No open positions
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[9px] uppercase tracking-wider text-muted-foreground" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                <th className="text-left px-3 py-1.5 font-medium">ID</th>
                <th className="text-left px-2 py-1.5 font-medium">Symbol</th>
                <th className="text-left px-2 py-1.5 font-medium">Side</th>
                <th className="text-right px-2 py-1.5 font-medium">Vol</th>
                <th className="text-right px-2 py-1.5 font-medium hidden sm:table-cell">Open</th>
                <th className="text-right px-2 py-1.5 font-medium hidden sm:table-cell">Current</th>
                <th className="text-right px-2 py-1.5 font-medium hidden md:table-cell">Swap</th>
                <th className="text-right px-2 py-1.5 font-medium">Profit</th>
                <th className="text-center px-2 py-1.5 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {positions.map(p => (
                <tr key={p.ticket} className="hover:bg-white/[0.02]" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                  <td className="px-3 py-1.5 text-muted-foreground font-mono tabular">{p.ticket}</td>
                  <td className="px-2 py-1.5 font-bold text-white">{p.symbol}</td>
                  <td className="px-2 py-1.5">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${p.type === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}
                      style={{ background: p.type === 'BUY' ? 'rgba(0,200,83,0.1)' : 'rgba(244,67,54,0.1)' }}>
                      {p.type}
                    </span>
                  </td>
                  <td className="px-2 py-1.5 text-right tabular text-white">{p.volume?.toFixed(2)}</td>
                  <td className="px-2 py-1.5 text-right tabular text-muted-foreground hidden sm:table-cell">{fmtPrice(p.open_price)}</td>
                  <td className="px-2 py-1.5 text-right tabular text-muted-foreground hidden sm:table-cell">{fmtPrice(p.current_price)}</td>
                  <td className="px-2 py-1.5 text-right tabular text-muted-foreground hidden md:table-cell">{p.swap?.toFixed(2)}</td>
                  <td className={`px-2 py-1.5 text-right tabular font-bold ${(p.profit || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {(p.profit || 0) >= 0 ? '+' : ''}{(p.profit || 0).toFixed(2)}
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <button onClick={() => onClose(p.ticket)} disabled={loading}
                      className="inline-flex items-center justify-center w-6 h-6 rounded text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition-colors">
                      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer stats */}
      <div className="flex items-center gap-4 px-3 py-2 flex-shrink-0 overflow-x-auto"
        style={{ borderTop: '1px solid hsl(var(--border))', background: 'hsl(var(--input))' }}>
        <Stat label="Equity" value={summary?.equity ? summary.equity.toFixed(2) : '--'} />
        <Stat label="Free Margin" value={summary?.free_margin ? summary.free_margin.toFixed(2) : '--'} />
        <Stat label="Balance" value={summary?.balance ? summary.balance.toFixed(2) : '--'} />
        <Stat label="Margin" value={summary?.margin ? summary.margin.toFixed(2) : '--'} />
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-muted-foreground uppercase tracking-wider whitespace-nowrap">Margin Lvl</span>
          <div className="flex items-center gap-1.5">
            <div className="w-12 h-1.5 rounded-full overflow-hidden" style={{ background: 'hsl(var(--border))' }}>
              <div className="h-full rounded-full" style={{
                width: `${Math.min(100, (summary?.margin_level || 0) / 30)}%`,
                background: (summary?.margin_level || 0) >= 100 ? '#00c853' : (summary?.margin_level || 0) >= 50 ? '#ffd700' : '#f44336',
              }} />
            </div>
            <span className="text-[10px] font-bold tabular text-white">{summary?.margin_level ? summary.margin_level.toFixed(0) : '--'}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="flex items-center gap-1.5 whitespace-nowrap">
      <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className="text-[10px] font-bold tabular text-white">{value}</span>
    </div>
  );
}