import React from 'react';
import { Zap, Eye } from 'lucide-react';
import { KPICard, Panel, RiskBadge, ExportButton } from './rcShared';

export default function RCHftMonitor({ accounts, onView }) {
  const hftAccounts = accounts.filter(a => a.evidence?.hft && (a.evidence.hft.max_tps > 1 || a.evidence.hft.sub_second_count > 0));

  const totalSubSecond = accounts.reduce((s, a) => s + (a.evidence?.hft?.sub_second_count || 0), 0);
  const maxTps = Math.max(0, ...accounts.map(a => a.evidence?.hft?.max_tps || 0));
  const avgHold = accounts.length ? Math.round(accounts.reduce((s, a) => s + (a.evidence?.hft?.avg_hold_sec || 0), 0) / accounts.length) : 0;
  const totalRapid = accounts.reduce((s, a) => s + (a.evidence?.hft?.rapid_trades?.length || 0), 0);

  // Trading frequency by hour
  const hourMap = new Array(24).fill(0);
  accounts.forEach(a => {
    (a.evidence?.hft?.rapid_trades || []).forEach(t => {
      const h = t.open_time ? new Date(t.open_time).getUTCHours() : -1;
      if (h >= 0) hourMap[h]++;
    });
  });
  const maxHour = Math.max(1, ...hourMap);

  const exportData = hftAccounts.map(a => ({
    email: a.user_email, account_id: a.account_id,
    max_tps: a.evidence.hft.max_tps, avg_hold_sec: a.evidence.hft.avg_hold_sec,
    sub_second_count: a.evidence.hft.sub_second_count,
    risk_score: a.risk_score, risk_level: a.risk_level,
  }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Max TPS" value={maxTps} icon={Zap} color="#ef4444" />
        <KPICard label="Sub-second Trades" value={totalSubSecond} icon={Zap} color="#f59e0b" />
        <KPICard label="Avg Hold" value={`${avgHold}s`} icon={Zap} color="#60a5fa" />
        <KPICard label="HFT Flagged" value={hftAccounts.length} sub={`${totalRapid} rapid trades`} icon={Zap} color="#dc2626" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Panel title="Trading Frequency by Hour (UTC)" icon={Zap}>
          <div className="flex items-end gap-1 h-32">
            {hourMap.map((count, h) => (
              <div key={h} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t" style={{ height: `${(count / maxHour) * 100}%`, background: count > 0 ? '#FF5C00' : 'rgba(255,255,255,0.05)', minHeight: count > 0 ? '4px' : '1px' }}
                  title={`${h}:00 - ${count} trades`} />
                {h % 3 === 0 && <span className="text-[8px] text-white/20">{h}</span>}
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Risk Level Distribution" icon={Zap}>
          <div className="space-y-2">
            {['critical', 'high', 'medium', 'low'].map(level => {
              const count = hftAccounts.filter(a => a.risk_level === level).length;
              return (
                <div key={level} className="flex items-center gap-3">
                  <RiskBadge level={level} />
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div className="h-full rounded-full" style={{ width: `${hftAccounts.length ? (count / hftAccounts.length) * 100 : 0}%`, background: level === 'critical' ? '#dc2626' : level === 'high' ? '#ef4444' : level === 'medium' ? '#f59e0b' : '#10b981' }} />
                  </div>
                  <span className="text-xs text-white/60 tabular w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      <Panel title="HFT Flagged Accounts" icon={Eye} action={<ExportButton data={exportData} filename="hft_accounts.csv" />}>
        {hftAccounts.length === 0 ? (
          <p className="text-xs text-white/30 py-6 text-center">No HFT patterns detected among monitored accounts.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  {['Trader', 'Max TPS', 'Avg Hold', 'Sub-second', 'Score', ''].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-[10px] font-mono text-white/30 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hftAccounts.map(a => (
                  <tr key={a.account_id} className="border-b hover:bg-white/[0.02]" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
                    <td className="py-2.5 px-3">
                      <div className="text-xs text-white/70 font-medium truncate max-w-[160px]">{a.user_email}</div>
                      <div className="text-[10px] text-white/30 font-mono">{a.account_id}</div>
                    </td>
                    <td className="py-2.5 px-3 text-xs text-red-400 font-bold tabular">{a.evidence.hft.max_tps}</td>
                    <td className="py-2.5 px-3 text-xs text-white/60 tabular">{a.evidence.hft.avg_hold_sec}s</td>
                    <td className="py-2.5 px-3 text-xs text-amber-400 font-bold tabular">{a.evidence.hft.sub_second_count}</td>
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