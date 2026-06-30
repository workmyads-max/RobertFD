import React from 'react';
import { TrendingUp, AlertTriangle, Eye } from 'lucide-react';
import { KPICard, Panel, ExportButton } from './rcShared';

export default function RCBehavioral({ accounts, onView }) {
  const flagged = accounts.filter(a => a.evidence?.behavioral && (a.evidence.behavioral.revenge_count >= 1 || a.evidence.behavioral.overtrading_days >= 1));

  const totalRevenge = accounts.reduce((s, a) => s + (a.evidence?.behavioral?.revenge_count || 0), 0);
  const totalOvertrading = accounts.reduce((s, a) => s + (a.evidence?.behavioral?.overtrading_days || 0), 0);
  const totalEmotionalCost = accounts.reduce((s, a) => s + (a.evidence?.behavioral?.emotional_cost || 0), 0);

  // Peak risk hours
  const hourMap = new Array(24).fill(0);
  accounts.forEach(a => {
    (a.evidence?.behavioral?.peak_risk_hours || []).forEach(h => {
      if (h.hour >= 0 && h.hour < 24) hourMap[h.hour] += h.count;
    });
  });
  const maxHour = Math.max(1, ...hourMap);

  const exportData = flagged.map(a => ({
    email: a.user_email, account_id: a.account_id,
    revenge_count: a.evidence.behavioral.revenge_count,
    overtrading_days: a.evidence.behavioral.overtrading_days,
    emotional_cost: a.evidence.behavioral.emotional_cost,
    risk_score: a.risk_score,
  }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Risk Traders" value={flagged.length} icon={AlertTriangle} color="#ef4444" />
        <KPICard label="Revenge Incidents" value={totalRevenge} icon={TrendingUp} color="#f59e0b" />
        <KPICard label="Overtrading Days" value={totalOvertrading} icon={TrendingUp} color="#f59e0b" />
        <KPICard label="Emotional Cost" value={`$${Math.round(totalEmotionalCost)}`} icon={TrendingUp} color="#ef4444" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Panel title="Daily Behavioral Pattern (Peak Risk Hours)" icon={TrendingUp}>
          <div className="flex items-end gap-1 h-32">
            {hourMap.map((count, h) => (
              <div key={h} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t" style={{ height: `${(count / maxHour) * 100}%`, background: count > 0 ? '#ef4444' : 'rgba(255,255,255,0.05)', minHeight: count > 0 ? '4px' : '1px' }}
                  title={`${h}:00 - ${count} high-risk trades`} />
                {h % 3 === 0 && <span className="text-[8px] text-white/20">{h}</span>}
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Risk Factor Breakdown" icon={AlertTriangle}>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.06)' }}>
              <span className="text-white/60">Revenge Trading</span>
              <span className="text-white font-bold tabular">{totalRevenge} incidents</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'rgba(245,158,11,0.06)' }}>
              <span className="text-white/60">Overtrading Days</span>
              <span className="text-white font-bold tabular">{totalOvertrading} days</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.06)' }}>
              <span className="text-white/60">Emotional Cost</span>
              <span className="text-red-400 font-bold tabular">${Math.round(totalEmotionalCost)}</span>
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="Flagged Traders" icon={Eye} action={<ExportButton data={exportData} filename="behavioral_accounts.csv" />}>
        {flagged.length === 0 ? (
          <p className="text-xs text-white/30 py-6 text-center">No behavioral risk patterns detected.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  {['Trader', 'Revenge', 'Overtrading Days', 'Emotional Cost', ''].map(h => (
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
                    <td className="py-2.5 px-3 text-xs text-red-400 font-bold tabular">{a.evidence.behavioral.revenge_count}</td>
                    <td className="py-2.5 px-3 text-xs text-amber-400 tabular">{a.evidence.behavioral.overtrading_days}</td>
                    <td className="py-2.5 px-3 text-xs text-red-400 tabular">${Math.round(a.evidence.behavioral.emotional_cost)}</td>
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