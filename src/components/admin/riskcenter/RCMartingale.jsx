import React from 'react';
import { Repeat, Eye } from 'lucide-react';
import { KPICard, Panel, RiskBadge, ExportButton, fmtMoney } from './rcShared';

export default function RCMartingale({ accounts, onView }) {
  const flagged = accounts.filter(a => a.evidence?.martingale && a.evidence.martingale.sequences > 0);

  const totalSeqs = flagged.reduce((s, a) => s + a.evidence.martingale.sequences, 0);
  const maxTrades = Math.max(0, ...flagged.map(a => a.evidence.martingale.max_trades_in_seq));
  const recovered = flagged.reduce((s, a) => s + a.evidence.martingale.recovered, 0);
  const unrecovered = flagged.reduce((s, a) => s + a.evidence.martingale.unrecovered, 0);

  const exportData = flagged.map(a => ({
    email: a.user_email, account_id: a.account_id,
    sequences: a.evidence.martingale.sequences,
    max_trades: a.evidence.martingale.max_trades_in_seq,
    recovered: a.evidence.martingale.recovered,
    unrecovered: a.evidence.martingale.unrecovered,
    risk_score: a.risk_score,
  }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Flagged Traders" value={flagged.length} icon={Repeat} color="#ef4444" />
        <KPICard label="Total Sequences" value={totalSeqs} icon={Repeat} color="#f59e0b" />
        <KPICard label="Max Trades in Seq" value={maxTrades} icon={Repeat} color="#dc2626" />
        <KPICard label="Unrecovered" value={unrecovered} sub={`${recovered} recovered`} icon={Repeat} color="#ef4444" />
      </div>

      <Panel title="Martingale Detection - Flagged Accounts" icon={Repeat} action={<ExportButton data={exportData} filename="martingale.csv" />}>
        {flagged.length === 0 ? (
          <p className="text-xs text-white/30 py-6 text-center">No martingale patterns detected. The system looks for lot-size increases of 1.8x+ after consecutive losses.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  {['Trader', 'Sequences', 'Max Trades', 'Recovered', 'Unrecovered', 'Level', ''].map(h => (
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
                    <td className="py-2.5 px-3 text-xs text-red-400 font-bold tabular">{a.evidence.martingale.sequences}</td>
                    <td className="py-2.5 px-3 text-xs text-amber-400 tabular">{a.evidence.martingale.max_trades_in_seq}</td>
                    <td className="py-2.5 px-3 text-xs text-emerald-400 tabular">{a.evidence.martingale.recovered}</td>
                    <td className="py-2.5 px-3 text-xs text-red-400 tabular">{a.evidence.martingale.unrecovered}</td>
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