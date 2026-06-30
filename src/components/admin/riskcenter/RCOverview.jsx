import React from 'react';
import { Activity, Users, TrendingUp, Crosshair, DollarSign, Zap } from 'lucide-react';
import { KPICard, Panel, RiskBadge, fmtMoney, getScoreColor } from './rcShared';

export default function RCOverview({ accounts, summary, isLoading, onView }) {
  const totalNetPnL = summary.total_net_pnl || 0;
  const totalOpen = summary.total_open_positions || 0;
  const dist = summary.risk_distribution || {};

  // Symbol exposure from open positions
  const symbolExposure = {};
  accounts.forEach(a => {
    (a.open_positions_list || []).forEach(p => {
      if (!symbolExposure[p.symbol]) symbolExposure[p.symbol] = { count: 0, volume: 0 };
      symbolExposure[p.symbol].count++;
      symbolExposure[p.symbol].volume += p.lots || 0;
    });
  });
  const topSymbols = Object.entries(symbolExposure).sort((a, b) => b[1].volume - a[1].volume).slice(0, 8);

  // Profitable vs losing accounts
  const profitable = accounts.filter(a => (a.balance || 0) > a.account_size);
  const losing = accounts.filter(a => (a.balance || 0) < a.account_size);

  // Top performers
  const topPerformers = [...accounts].sort((a, b) => (b.balance - b.account_size) - (a.balance - a.account_size)).slice(0, 5);

  // Buy vs sell from open positions
  let buys = 0, sells = 0;
  accounts.forEach(a => (a.open_positions_list || []).forEach(p => { p.type === 'BUY' ? buys++ : sells++; }));

  if (isLoading || accounts.length === 0) {
    return <div className="text-center py-12 text-white/30 text-sm">No monitored accounts yet. New accounts provisioned after the risk center went live will appear here automatically.</div>;
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Total Exposure" value={fmtMoney(accounts.reduce((s, a) => s + a.account_size, 0))} sub={`${accounts.length} accounts`} icon={DollarSign} color="#3b82f6" />
        <KPICard label="Net P&L" value={fmtMoney(totalNetPnL)} sub={`${profitable.length} profitable`} icon={TrendingUp} color={totalNetPnL >= 0 ? '#10b981' : '#ef4444'} />
        <KPICard label="Open Positions" value={totalOpen} sub={`${buys}B / ${sells}S`} icon={Activity} color="#f59e0b" />
        <KPICard label="High Risk" value={dist.high + dist.critical} sub={`${dist.critical} critical`} icon={Zap} color="#ef4444" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Panel title="Risk Distribution" icon={Activity}>
          <div className="space-y-3">
            {['critical', 'high', 'medium', 'low'].map(level => (
              <div key={level} className="flex items-center gap-3">
                <RiskBadge level={level} />
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div className="h-full rounded-full" style={{ width: `${accounts.length ? (dist[level] / accounts.length) * 100 : 0}%`, background: level === 'critical' ? '#dc2626' : level === 'high' ? '#ef4444' : level === 'medium' ? '#f59e0b' : '#10b981' }} />
                </div>
                <span className="text-xs text-white/60 tabular w-8 text-right">{dist[level] || 0}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Symbol Exposure" icon={Crosshair}>
          {topSymbols.length === 0 ? (
            <p className="text-xs text-white/30 py-4 text-center">No open positions across monitored accounts.</p>
          ) : (
            <div className="space-y-2">
              {topSymbols.map(([sym, d]) => (
                <div key={sym} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-white/70 w-20">{sym}</span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (d.volume / topSymbols[0][1].volume) * 100)}%` }} />
                  </div>
                  <span className="text-[10px] text-white/40 tabular w-12 text-right">{d.count} pos</span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Top Performing Traders" icon={TrendingUp}>
          <div className="space-y-1.5">
            {topPerformers.map((a, i) => (
              <button key={a.account_id} onClick={() => onView(a)} className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/[0.03] text-left">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-white/20 font-mono w-4">{i + 1}</span>
                  <div>
                    <div className="text-xs text-white/70 font-medium truncate max-w-[140px]">{a.user_email}</div>
                    <div className="text-[10px] text-white/30">{a.challenge_type} · {fmtMoney(a.account_size)}</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-400 tabular">+{fmtMoney((a.balance - a.account_size))}</span>
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="Overall Risk Assessment" icon={Activity}>
          <div className="text-center py-4">
            <div className="text-4xl font-black mb-1" style={{ color: getScoreColor(Math.round(accounts.reduce((s, a) => s + (a.risk_score || 0), 0) / accounts.length)) }}>
              {Math.round(accounts.reduce((s, a) => s + (a.risk_score || 0), 0) / accounts.length)}
            </div>
            <div className="text-xs text-white/40">Average Risk Score</div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg p-3" style={{ background: 'rgba(16,185,129,0.06)' }}>
                <div className="text-white/40 text-[10px]">Profitable</div>
                <div className="text-emerald-400 font-bold text-lg tabular">{profitable.length}</div>
              </div>
              <div className="rounded-lg p-3" style={{ background: 'rgba(239,68,68,0.06)' }}>
                <div className="text-white/40 text-[10px]">Losing</div>
                <div className="text-red-400 font-bold text-lg tabular">{losing.length}</div>
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}