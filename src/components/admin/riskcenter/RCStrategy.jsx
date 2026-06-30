import React from 'react';
import { BarChart3, Gauge, Eye, Layers } from 'lucide-react';
import { KPICard, Panel, RiskBadge, ExportButton, fmtMoney } from './rcShared';

export default function RCStrategy({ accounts, onView, tab }) {
  // tab = undefined (strategy+concentration) or "margin"
  if (tab === 'margin') return <MarginLeverage accounts={accounts} onView={onView} />;

  // ── Strategy & Concentration ──────────────────────────────────────────────
  const concentrationFlagged = accounts.filter(a => a.evidence?.concentration && a.evidence.concentration.concentration_pct >= 70);

  // Aggregate symbol exposure
  const symbolVol = {};
  accounts.forEach(a => {
    (a.evidence?.concentration?.top_symbols || []).forEach(s => {
      symbolVol[s.symbol] = (symbolVol[s.symbol] || 0) + s.volume;
    });
  });
  const topSymbols = Object.entries(symbolVol).sort((a, b) => b[1] - a[1]).slice(0, 10);

  // Strategy patterns: lot size distribution
  const lotSizes = {};
  accounts.forEach(a => {
    (a.open_positions_list || []).forEach(p => {
      const key = p.lots <= 0.1 ? 'micro (0.01-0.1)' : p.lots <= 1 ? 'small (0.1-1)' : p.lots <= 5 ? 'medium (1-5)' : 'large (5+)';
      lotSizes[key] = (lotSizes[key] || 0) + 1;
    });
  });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Concentrated" value={concentrationFlagged.length} sub="70%+ in one symbol" icon={Layers} color="#ef4444" />
        <KPICard label="Active Symbols" value={Object.keys(symbolVol).length} icon={BarChart3} color="#60a5fa" />
        <KPICard label="Total Volume" value={Object.values(symbolVol).reduce((s, v) => s + v, 0).toFixed(1) + ' lots'} icon={BarChart3} color="#f59e0b" />
        <KPICard label="Top Symbol %" value={`${concentrationFlagged.length ? Math.max(...concentrationFlagged.map(a => a.evidence.concentration.concentration_pct)) : 0}%`} icon={Layers} color="#dc2626" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Panel title="Symbol Concentration" icon={Layers}>
          {topSymbols.length === 0 ? (
            <p className="text-xs text-white/30 py-4 text-center">No open positions to analyze.</p>
          ) : (
            <div className="space-y-2">
              {topSymbols.map(([sym, vol]) => (
                <div key={sym} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-white/70 w-20">{sym}</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div className="h-full bg-primary rounded-full" style={{ width: `${(vol / topSymbols[0][1]) * 100}%` }} />
                  </div>
                  <span className="text-[10px] text-white/40 tabular w-12 text-right">{vol.toFixed(1)}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Lot Size Distribution" icon={BarChart3}>
          <div className="space-y-2">
            {Object.entries(lotSizes).map(([key, count]) => (
              <div key={key} className="flex items-center gap-3">
                <span className="text-xs text-white/60 w-32">{key}</span>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div className="h-full bg-primary rounded-full" style={{ width: `${(count / Math.max(1, ...Object.values(lotSizes))) * 100}%` }} />
                </div>
                <span className="text-[10px] text-white/40 tabular w-8 text-right">{count}</span>
              </div>
            ))}
            {Object.keys(lotSizes).length === 0 && <p className="text-xs text-white/30 py-4 text-center">No positions to analyze.</p>}
          </div>
        </Panel>
      </div>

      <Panel title="Concentrated Accounts" icon={Eye}>
        {concentrationFlagged.length === 0 ? (
          <p className="text-xs text-white/30 py-6 text-center">No concentration risk detected.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  {['Trader', 'Top Symbol', 'Concentration', 'Level', ''].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-[10px] font-mono text-white/30 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {concentrationFlagged.map(a => (
                  <tr key={a.account_id} className="border-b hover:bg-white/[0.02]" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
                    <td className="py-2.5 px-3">
                      <div className="text-xs text-white/70 truncate max-w-[140px]">{a.user_email}</div>
                      <div className="text-[10px] text-white/30 font-mono">{a.account_id}</div>
                    </td>
                    <td className="py-2.5 px-3 text-xs text-white/60 font-mono">{a.evidence.concentration.top_symbols[0]?.symbol || '-'}</td>
                    <td className="py-2.5 px-3 text-xs text-amber-400 font-bold tabular">{a.evidence.concentration.concentration_pct}%</td>
                    <td className="py-2.5 px-3"><RiskBadge level={a.risk_level} /></td>
                    <td className="py-2.5 px-3">
                      <button onClick={() => onView(a)} className="p-1 rounded hover:bg-white/[0.05]"><Eye className="w-4 h-4 text-primary" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

function MarginLeverage({ accounts, onView }) {
  const flagged = accounts.filter(a => a.evidence?.margin && a.evidence.margin.lot_to_size_ratio >= 0.5);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Flagged" value={flagged.length} sub="excessive leverage" icon={Gauge} color="#ef4444" />
        <KPICard label="Max Lots (All)" value={Math.max(0, ...accounts.map(a => a.evidence?.margin?.max_lots || 0))} icon={Gauge} color="#dc2626" />
        <KPICard label="Avg Ratio" value={accounts.length ? (accounts.reduce((s, a) => s + (a.evidence?.margin?.lot_to_size_ratio || 0), 0) / accounts.length).toFixed(2) : '0'} icon={Gauge} color="#f59e0b" />
        <KPICard label="Total Exposure" value={fmtMoney(accounts.reduce((s, a) => s + a.account_size, 0))} icon={Gauge} color="#60a5fa" />
      </div>

      <Panel title="Margin & Leverage - Excessive Usage" icon={Gauge}>
        {flagged.length === 0 ? (
          <p className="text-xs text-white/30 py-6 text-center">No excessive leverage usage detected.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  {['Trader', 'Account Size', 'Max Lots', 'Lot/Size Ratio', 'Level', ''].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-[10px] font-mono text-white/30 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {flagged.map(a => (
                  <tr key={a.account_id} className="border-b hover:bg-white/[0.02]" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
                    <td className="py-2.5 px-3">
                      <div className="text-xs text-white/70 truncate max-w-[140px]">{a.user_email}</div>
                      <div className="text-[10px] text-white/30 font-mono">{a.account_id}</div>
                    </td>
                    <td className="py-2.5 px-3 text-xs text-white/60 tabular">{fmtMoney(a.account_size)}</td>
                    <td className="py-2.5 px-3 text-xs text-amber-400 font-bold tabular">{a.evidence.margin.max_lots}</td>
                    <td className="py-2.5 px-3 text-xs text-red-400 tabular">{a.evidence.margin.lot_to_size_ratio}</td>
                    <td className="py-2.5 px-3"><RiskBadge level={a.risk_level} /></td>
                    <td className="py-2.5 px-3">
                      <button onClick={() => onView(a)} className="p-1 rounded hover:bg-white/[0.05]"><Eye className="w-4 h-4 text-primary" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}