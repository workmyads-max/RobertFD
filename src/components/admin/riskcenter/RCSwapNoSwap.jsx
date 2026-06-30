import React from 'react';
import { Clock, AlertTriangle, Eye, Calendar } from 'lucide-react';
import { KPICard, Panel, RiskBadge, ExportButton } from './rcShared';

export default function RCSwapNoSwap({ accounts, econEvents, onView }) {
  const swapFlagged = accounts.filter(a => a.evidence?.swap && a.evidence.swap.avoidance_rate >= 30);
  const newsFlagged = accounts.filter(a => a.evidence?.news && a.evidence.news.violations > 0);

  const totalNoSwap = swapFlagged.reduce((s, a) => s + a.evidence.swap.no_swap_count, 0);
  const avgAvoidRate = swapFlagged.length ? Math.round(swapFlagged.reduce((s, a) => s + a.evidence.swap.avoidance_rate, 0) / swapFlagged.length) : 0;
  const totalNewsVio = newsFlagged.reduce((s, a) => s + a.evidence.news.violations, 0);

  // Symbol-level no-swap risk table
  const symbolSwap = {};
  swapFlagged.forEach(a => {
    (a.evidence?.swap?.evidence || []).forEach(t => {
      symbolSwap[t.symbol] = (symbolSwap[t.symbol] || 0) + 1;
    });
  });
  const topSwapSymbols = Object.entries(symbolSwap).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const exportData = swapFlagged.map(a => ({
    email: a.user_email, no_swap_count: a.evidence.swap.no_swap_count,
    avoidance_rate: a.evidence.swap.avoidance_rate, risk_score: a.risk_score,
  }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Swap Avoiders" value={swapFlagged.length} icon={Clock} color="#f59e0b" />
        <KPICard label="No-Swap Trades" value={totalNoSwap} icon={Clock} color="#ef4444" />
        <KPICard label="Avg Avoidance" value={`${avgAvoidRate}%`} icon={Clock} color="#60a5fa" />
        <KPICard label="News Violations" value={totalNewsVio} sub={`${newsFlagged.length} traders`} icon={Calendar} color="#dc2626" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Panel title="Symbol-Level No-Swap Risk" icon={Clock}>
          {topSwapSymbols.length === 0 ? (
            <p className="text-xs text-white/30 py-4 text-center">No swap avoidance detected.</p>
          ) : (
            <div className="space-y-2">
              {topSwapSymbols.map(([sym, count]) => (
                <div key={sym} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-white/70 w-20">{sym}</span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(count / topSwapSymbols[0][1]) * 100}%` }} />
                  </div>
                  <span className="text-[10px] text-white/40 tabular w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Upcoming High-Impact Events" icon={Calendar}>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {(econEvents || []).slice(0, 10).map(ev => (
              <div key={ev.id} className="flex items-center gap-2 text-xs">
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white" style={{ background: '#ef4444' }}>{ev.currency}</span>
                <span className="text-white/60 truncate flex-1">{ev.title}</span>
                <span className="text-[10px] text-white/30">{ev.event_time?.slice(0, 16).replace('T', ' ')}</span>
              </div>
            ))}
            {(!econEvents || econEvents.length === 0) && <p className="text-xs text-white/30 py-4 text-center">No upcoming events.</p>}
          </div>
        </Panel>
      </div>

      <Panel title="Swap Avoidance - Flagged Accounts" icon={Clock} action={<ExportButton data={exportData} filename="swap_avoiders.csv" />}>
        {swapFlagged.length === 0 ? (
          <p className="text-xs text-white/30 py-6 text-center">No swap avoidance patterns detected.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  {['Trader', 'No-Swap Trades', 'Avoidance Rate', 'Avg Duration', 'Level', ''].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-[10px] font-mono text-white/30 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {swapFlagged.map(a => (
                  <tr key={a.account_id} className="border-b hover:bg-white/[0.02]" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
                    <td className="py-2.5 px-3">
                      <div className="text-xs text-white/70 truncate max-w-[140px]">{a.user_email}</div>
                      <div className="text-[10px] text-white/30 font-mono">{a.account_id}</div>
                    </td>
                    <td className="py-2.5 px-3 text-xs text-amber-400 font-bold tabular">{a.evidence.swap.no_swap_count}</td>
                    <td className="py-2.5 px-3 text-xs text-red-400 tabular">{a.evidence.swap.avoidance_rate}%</td>
                    <td className="py-2.5 px-3 text-xs text-white/50 tabular">{a.evidence.swap.avg_duration_hours}h</td>
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

      {newsFlagged.length > 0 && (
        <Panel title="News Trading Violations" icon={AlertTriangle}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  {['Trader', 'Violations', 'Level', ''].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-[10px] font-mono text-white/30 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {newsFlagged.map(a => (
                  <tr key={a.account_id} className="border-b hover:bg-white/[0.02]" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
                    <td className="py-2.5 px-3">
                      <div className="text-xs text-white/70 truncate max-w-[160px]">{a.user_email}</div>
                      <div className="text-[10px] text-white/30 font-mono">{a.account_id}</div>
                    </td>
                    <td className="py-2.5 px-3 text-xs text-red-400 font-bold tabular">{a.evidence.news.violations}</td>
                    <td className="py-2.5 px-3"><RiskBadge level={a.risk_level} /></td>
                    <td className="py-2.5 px-3">
                      <button onClick={() => onView(a)} className="p-1 rounded hover:bg-white/[0.05]"><Eye className="w-4 h-4 text-primary" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  );
}