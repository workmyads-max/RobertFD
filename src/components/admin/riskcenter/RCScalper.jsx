import React from 'react';
import { Crosshair, Eye } from 'lucide-react';
import { KPICard, Panel, RiskBadge, ExportButton } from './rcShared';

export default function RCScalper({ accounts, onView }) {
  const flagged = accounts.filter(a => a.evidence?.scalper && a.evidence.scalper.percentage >= 50);

  const totalScalps = flagged.reduce((s, a) => s + a.evidence.scalper.count, 0);
  const avgPct = flagged.length ? Math.round(flagged.reduce((s, a) => s + a.evidence.scalper.percentage, 0) / flagged.length) : 0;
  const worstPct = Math.max(0, ...flagged.map(a => a.evidence.scalper.percentage));

  const symbolMap = {};
  flagged.forEach(a => {
    (a.evidence?.scalper?.evidence || []).forEach(t => {
      symbolMap[t.symbol] = (symbolMap[t.symbol] || 0) + 1;
    });
  });
  const topSymbols = Object.entries(symbolMap).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const exportData = flagged.map(a => ({
    email: a.user_email, account_id: a.account_id,
    scalp_count: a.evidence.scalper.count,
    percentage: a.evidence.scalper.percentage,
    risk_score: a.risk_score,
  }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Scalpers Flagged" value={flagged.length} icon={Crosshair} color="#ef4444" />
        <KPICard label="Total Scalp Trades" value={totalScalps} icon={Crosshair} color="#f59e0b" />
        <KPICard label="Avg Scalp %" value={`${avgPct}%`} icon={Crosshair} color="#60a5fa" />
        <KPICard label="Worst Case" value={`${worstPct}%`} icon={Crosshair} color="#dc2626" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Panel title="Most Scalped Symbols" icon={Crosshair}>
          {topSymbols.length === 0 ? (
            <p className="text-xs text-white/30 py-4 text-center">No scalp trades recorded.</p>
          ) : (
            <div className="space-y-2">
              {topSymbols.map(([sym, count]) => (
                <div key={sym} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-white/70 w-20">{sym}</span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div className="h-full bg-primary rounded-full" style={{ width: `${(count / topSymbols[0][1]) * 100}%` }} />
                  </div>
                  <span className="text-[10px] text-white/40 tabular w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Detection Summary" icon={Crosshair}>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2 rounded" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <span className="text-white/50">Detection Threshold</span>
              <span className="text-white/70">50%+ trades held under 60s</span>
            </div>
            <div className="flex justify-between p-2 rounded" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <span className="text-white/50">Flagged Accounts</span>
              <span className="text-white/70">{flagged.length}</span>
            </div>
            <div className="flex justify-between p-2 rounded" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <span className="text-white/50">Total Scalp Trades</span>
              <span className="text-white/70">{totalScalps}</span>
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="Scalper Accounts" icon={Eye} action={<ExportButton data={exportData} filename="scalpers.csv" />}>
        {flagged.length === 0 ? (
          <p className="text-xs text-white/30 py-6 text-center">No scalping patterns detected among monitored accounts.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  {['Trader', 'Scalp Trades', 'Percentage', 'Level', ''].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-[10px] font-mono text-white/30 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {flagged.map(a => (
                  <tr key={a.account_id} className="border-b hover:bg-white/[0.02]" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
                    <td className="py-2.5 px-3">
                      <div className="text-xs text-white/70 truncate max-w-[160px]">{a.user_email}</div>
                      <div className="text-[10px] text-white/30 font-mono">{a.account_id}</div>
                    </td>
                    <td className="py-2.5 px-3 text-xs text-amber-400 font-bold tabular">{a.evidence.scalper.count}</td>
                    <td className="py-2.5 px-3 text-xs text-red-400 tabular">{a.evidence.scalper.percentage}%</td>
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