import React from 'react';
import { Server, Database, Activity } from 'lucide-react';
import { KPICard, Panel, fmtMoney } from './rcShared';

export default function RCDataCenter({ accounts, deviceLogs, econEvents }) {
  const totalAccounts = accounts.length;
  const totalTrades = accounts.reduce((s, a) => s + (a.total_trades || 0), 0);
  const totalOpen = accounts.reduce((s, a) => s + (a.open_positions || 0), 0);
  const totalExposure = accounts.reduce((s, a) => s + a.account_size, 0);
  const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0);
  const totalEquity = accounts.reduce((s, a) => s + (a.equity || 0), 0);

  // By challenge type
  const byType = {};
  accounts.forEach(a => {
    if (!byType[a.challenge_type]) byType[a.challenge_type] = { count: 0, balance: 0 };
    byType[a.challenge_type].count++;
    byType[a.challenge_type].balance += a.balance || 0;
  });

  // By status
  const byStatus = {};
  accounts.forEach(a => {
    byStatus[a.status] = (byStatus[a.status] || 0) + 1;
  });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Monitored Accounts" value={totalAccounts} icon={Server} color="#60a5fa" />
        <KPICard label="Total Trades" value={totalTrades} sub={`${totalOpen} open`} icon={Activity} color="#f59e0b" />
        <KPICard label="Total Balance" value={fmtMoney(totalBalance)} icon={Database} color="#10b981" />
        <KPICard label="Total Equity" value={fmtMoney(totalEquity)} icon={Database} color="#3b82f6" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Panel title="Accounts by Challenge Type" icon={Server}>
          <div className="space-y-2">
            {Object.entries(byType).map(([type, d]) => (
              <div key={type} className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <span className="text-xs text-white/70 capitalize">{type.replace(/_/g, ' ')}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/40 tabular">{d.count} accounts</span>
                  <span className="text-xs text-white/60 font-bold tabular">{fmtMoney(d.balance)}</span>
                </div>
              </div>
            ))}
            {Object.keys(byType).length === 0 && <p className="text-xs text-white/30 py-4 text-center">No accounts.</p>}
          </div>
        </Panel>

        <Panel title="Accounts by Status" icon={Activity}>
          <div className="space-y-2">
            {Object.entries(byStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <span className="text-xs text-white/70 capitalize">{status}</span>
                <span className="text-xs text-white/60 font-bold tabular">{count}</span>
              </div>
            ))}
            {Object.keys(byStatus).length === 0 && <p className="text-xs text-white/30 py-4 text-center">No accounts.</p>}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Panel title="Device Logs" icon={Server}>
          <div className="text-center py-3">
            <div className="text-3xl font-black text-white">{deviceLogs?.length || 0}</div>
            <div className="text-[10px] text-white/30 uppercase mt-1">Total Logs</div>
          </div>
        </Panel>
        <Panel title="Economic Events" icon={Activity}>
          <div className="text-center py-3">
            <div className="text-3xl font-black text-white">{econEvents?.length || 0}</div>
            <div className="text-[10px] text-white/30 uppercase mt-1">High-Impact Tracked</div>
          </div>
        </Panel>
        <Panel title="Total Exposure" icon={Database}>
          <div className="text-center py-3">
            <div className="text-3xl font-black text-white">{fmtMoney(totalExposure)}</div>
            <div className="text-[10px] text-white/30 uppercase mt-1">Account Sizes</div>
          </div>
        </Panel>
      </div>
    </div>
  );
}