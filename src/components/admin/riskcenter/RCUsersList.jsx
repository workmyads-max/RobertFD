import React, { useState } from 'react';
import { Search, Eye } from 'lucide-react';
import { RiskBadge, ExportButton, fmtMoney, getScoreColor } from './rcShared';

export default function RCUsersList({ accounts, isLoading, onView }) {
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');

  const filtered = accounts.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q || a.user_email?.toLowerCase().includes(q) || a.account_id?.toLowerCase().includes(q) || a.mt_login?.toLowerCase().includes(q);
    const matchRisk = riskFilter === 'all' || a.risk_level === riskFilter;
    return matchSearch && matchRisk;
  });

  const exportData = filtered.map(a => ({
    email: a.user_email, account_id: a.account_id, mt_login: a.mt_login,
    challenge_type: a.challenge_type, size: a.account_size,
    balance: a.balance, equity: a.equity,
    pnl: (a.balance || 0) - a.account_size,
    open_positions: a.open_positions,
    risk_score: a.risk_score, risk_level: a.risk_level,
    flags: (a.risk_flags || []).join('; '),
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 relative min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search email, account ID, or MT5 login..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
        </div>
        <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl text-xs text-white outline-none"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <option value="all">All Risk Levels</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <ExportButton data={exportData} filename="risk_users.csv" />
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                {['Trader', 'Balance', 'Equity', 'P&L', 'Positions', 'Score', 'Level', 'Actions'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-[10px] font-mono text-white/30 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="py-12 text-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-white/20 text-sm">No accounts match your filters.</td></tr>
              ) : filtered.map(acc => (
                <tr key={acc.account_id} className="border-b hover:bg-white/[0.02]" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
                  <td className="py-3 px-4">
                    <div className="text-xs font-bold text-white truncate max-w-[160px]">{acc.user_email}</div>
                    <div className="text-[10px] text-white/30 font-mono">{acc.account_id} · MT5 {acc.mt_login || '-'}</div>
                  </td>
                  <td className="py-3 px-4 text-xs text-white/70 tabular">{fmtMoney(acc.balance)}</td>
                  <td className="py-3 px-4 text-xs text-white/70 tabular">{fmtMoney(acc.equity)}</td>
                  <td className={`py-3 px-4 text-xs tabular font-medium ${((acc.balance || 0) - acc.account_size) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {((acc.balance || 0) - acc.account_size) >= 0 ? '+' : ''}{fmtMoney((acc.balance || 0) - acc.account_size)}
                  </td>
                  <td className="py-3 px-4 text-xs text-white/60 tabular">{acc.open_positions || 0}</td>
                  <td className="py-3 px-4">
                    <span className="text-base font-black tabular" style={{ color: getScoreColor(acc.risk_score) }}>{acc.risk_score || 0}</span>
                  </td>
                  <td className="py-3 px-4"><RiskBadge level={acc.risk_level} /></td>
                  <td className="py-3 px-4">
                    <button onClick={() => onView(acc)} className="p-1.5 rounded-lg hover:bg-white/[0.05]" title="View evidence">
                      <Eye className="w-4 h-4 text-primary" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}