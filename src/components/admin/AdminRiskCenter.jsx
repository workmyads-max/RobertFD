import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, AlertOctagon, Activity, User, BarChart3, RefreshCw,
  TrendingDown, Play, Loader2, Eye, Flag, ChevronRight, AlertTriangle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const SEVERITY_COLORS = {
  critical: { bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.3)', text: '#a855f7' },
  high:     { bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.3)',  text: '#ef4444' },
  medium:   { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', text: '#f59e0b' },
  low:      { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)', text: '#60a5fa' },
};

function RiskScore({ score }) {
  const color = score >= 60 ? '#ef4444' : score >= 30 ? '#f59e0b' : '#10b981';
  const w = Math.min(100, score);
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${w}%`, background: color }} />
      </div>
      <span className="text-xs font-bold font-mono" style={{ color }}>{score}</span>
    </div>
  );
}

function TraderRow({ account, flags, onClick }) {
  const accountFlags = flags.filter(f => f.account_id === account.account_id);
  const critFlags = accountFlags.filter(f => f.severity === 'critical').length;
  const highFlags = accountFlags.filter(f => f.severity === 'high').length;
  const riskScore = Math.min(100, critFlags * 30 + highFlags * 20 + accountFlags.filter(f => f.severity === 'medium').length * 10);

  return (
    <motion.tr
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="border-b cursor-pointer hover:bg-white/[0.02] transition-colors"
      style={{ borderColor: 'rgba(255,255,255,0.05)' }}
      onClick={() => onClick(account)}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
            style={{ background: 'rgba(255,255,255,0.08)' }}>
            {(account.user_email || '?')[0].toUpperCase()}
          </div>
          <div>
            <div className="text-xs font-bold text-white">{account.user_email}</div>
            <div className="text-[10px] font-mono text-white/30">{account.account_id}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-xs font-mono text-white/60">${(account.account_size || 0).toLocaleString()}</td>
      <td className="px-4 py-3 text-xs font-mono text-white/60 capitalize">{account.challenge_type}</td>
      <td className="px-4 py-3 text-xs font-mono text-white/60">{account.total_trades || 0}</td>
      <td className="px-4 py-3 text-xs font-mono text-white/60">{(account.win_rate || 0).toFixed(1)}%</td>
      <td className="px-4 py-3 text-xs font-mono text-red-400">{(account.max_drawdown_used || 0).toFixed(1)}%</td>
      <td className="px-4 py-3">
        <div className="w-24"><RiskScore score={riskScore} /></div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          {critFlags > 0 && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono text-purple-400" style={{ background: 'rgba(168,85,247,0.15)' }}>{critFlags}C</span>}
          {highFlags > 0 && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono text-red-400" style={{ background: 'rgba(239,68,68,0.15)' }}>{highFlags}H</span>}
          {accountFlags.length === 0 && <span className="text-[10px] font-mono text-emerald-400">Clean</span>}
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`px-2 py-0.5 rounded text-[9px] font-mono capitalize ${
          account.status === 'active' ? 'text-emerald-400' :
          account.status === 'funded' ? 'text-blue-400' :
          account.status === 'failed' ? 'text-red-400' : 'text-white/40'
        }`} style={{ background: 'rgba(255,255,255,0.05)' }}>{account.status}</span>
      </td>
      <td className="px-4 py-3">
        <ChevronRight className="w-4 h-4 text-white/20" />
      </td>
    </motion.tr>
  );
}

function AccountModal({ account, flags, onClose, onClearFlag }) {
  if (!account) return null;
  const accountFlags = flags.filter(f => f.account_id === account.account_id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl"
        style={{ background: '#0e0f14', border: '1px solid rgba(255,255,255,0.12)' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            {account.user_email}
          </h2>
          <button onClick={onClose} className="text-white/40 hover:text-white text-sm px-3 py-1.5 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.06)' }}>Close</button>
        </div>

        <div className="p-6 space-y-5">
          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Account Size', value: `$${(account.account_size || 0).toLocaleString()}` },
              { label: 'Platform', value: account.platform || 'N/A' },
              { label: 'Phase', value: account.phase || 'phase1' },
              { label: 'Total Trades', value: account.total_trades || 0 },
              { label: 'Win Rate', value: `${(account.win_rate || 0).toFixed(1)}%` },
              { label: 'Max DD Used', value: `${(account.max_drawdown_used || 0).toFixed(2)}%` },
              { label: 'Balance', value: `$${(account.balance || 0).toFixed(2)}` },
              { label: 'PnL', value: `$${(account.pnl || 0).toFixed(2)}` },
              { label: 'Trading Days', value: account.trading_days || 0 },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="text-[9px] font-mono text-white/30 uppercase mb-1">{s.label}</div>
                <div className="text-sm font-bold text-white">{s.value}</div>
              </div>
            ))}
          </div>

          {/* MT5 credentials if available */}
          {account.mt_login && (
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,92,0,0.06)', border: '1px solid rgba(255,92,0,0.15)' }}>
              <div className="text-[10px] font-mono text-primary uppercase mb-2">MT5 Credentials</div>
              <div className="grid grid-cols-3 gap-3 text-xs font-mono">
                <div><span className="text-white/40">Login: </span><span className="text-white">{account.mt_login}</span></div>
                <div><span className="text-white/40">Server: </span><span className="text-white">{account.mt_server || 'N/A'}</span></div>
                <div><span className="text-white/40">Group: </span><span className="text-white">{account.mt_group || 'N/A'}</span></div>
              </div>
            </div>
          )}

          {/* Active risk flags */}
          {accountFlags.length > 0 && (
            <div>
              <div className="text-[10px] font-mono text-white/30 uppercase mb-3">Active Risk Flags ({accountFlags.length})</div>
              <div className="space-y-2">
                {accountFlags.map(flag => {
                  const c = SEVERITY_COLORS[flag.severity] || SEVERITY_COLORS.low;
                  return (
                    <div key={flag.id} className="flex items-start justify-between gap-3 rounded-xl p-3"
                      style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <AlertOctagon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: c.text }} />
                        <div>
                          <div className="text-xs font-bold text-white capitalize">{flag.flag_type?.replace(/_/g, ' ')}</div>
                          <div className="text-[11px] text-white/50 mt-0.5">{flag.description}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded" style={{ background: c.border + '50', color: c.text }}>{flag.severity}</span>
                        <button onClick={() => onClearFlag(flag.id)}
                          className="text-[10px] font-semibold text-white/40 hover:text-white transition-colors">Clear</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminRiskCenter() {
  const qc = useQueryClient();
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [scanning, setScanning] = useState(false);

  const { data: accounts = [], isLoading: accsLoading } = useQuery({
    queryKey: ['all-challenge-accounts-risk'],
    queryFn: () => base44.entities.ChallengeAccount.list('-created_date', 200),
    refetchInterval: 30000,
  });

  const { data: flags = [], refetch: refetchFlags } = useQuery({
    queryKey: ['all-risk-flags-active'],
    queryFn: () => base44.entities.RiskFlag.filter({ status: 'active' }),
    refetchInterval: 15000,
  });

  const activeAccounts = accounts.filter(a => ['active', 'passed', 'funded'].includes(a.status));

  const clearFlagMutation = useMutation({
    mutationFn: (flagId) => base44.entities.RiskFlag.update(flagId, { status: 'resolved' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['all-risk-flags-active'] }); refetchFlags(); toast.success('Flag cleared'); },
  });

  const runAdvancedScan = async () => {
    setScanning(true);
    try {
      const res = await base44.functions.invoke('advancedRiskScoring', { scan_all: true });
      qc.invalidateQueries({ queryKey: ['all-risk-flags-active'] });
      toast.success(`Scan complete: ${res.data?.violations_found || 0} violations found across ${res.data?.accounts_scanned || 0} accounts`);
    } catch (e) {
      toast.error('Scan failed: ' + e.message);
    } finally {
      setScanning(false);
    }
  };

  const criticalFlags = flags.filter(f => f.severity === 'critical').length;
  const highFlags = flags.filter(f => f.severity === 'high').length;
  const affectedAccounts = new Set(flags.map(f => f.account_id)).size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <Shield className="w-5 h-5 text-red-400" />
            </div>
            Institutional Risk Center
          </h1>
          <p className="text-sm text-white/30 font-mono mt-1">Real-time risk monitoring across all traders</p>
        </div>
        <button onClick={runAdvancedScan} disabled={scanning}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-all"
          style={{ background: 'linear-gradient(90deg,rgba(239,68,68,0.3),rgba(239,68,68,0.2))', border: '1px solid rgba(239,68,68,0.35)' }}>
          {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {scanning ? 'Scanning All Accounts...' : 'Run Full Risk Scan'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Accounts', value: activeAccounts.length, color: '#60a5fa', icon: Activity },
          { label: 'Critical Flags', value: criticalFlags, color: '#a855f7', icon: AlertOctagon },
          { label: 'High Risk Flags', value: highFlags, color: '#ef4444', icon: Flag },
          { label: 'Affected Traders', value: affectedAccounts, color: '#f59e0b', icon: User },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-2xl p-5" style={{ background: `${s.color}08`, border: `1px solid ${s.color}20` }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono text-white/30 uppercase">{s.label}</span>
                <Icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <div className="text-3xl font-black text-white">{s.value}</div>
            </div>
          );
        })}
      </div>

      {/* Trader table */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="px-5 py-3 flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <span className="text-[10px] font-mono text-white/30 uppercase">Trader Risk Monitor ({activeAccounts.length} active)</span>
        </div>
        {accsLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Trader', 'Size', 'Type', 'Trades', 'Win Rate', 'Max DD', 'Risk Score', 'Flags', 'Status', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-mono text-white/20 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeAccounts.map(acc => (
                  <TraderRow key={acc.id} account={acc} flags={flags} onClick={setSelectedAccount} />
                ))}
                {activeAccounts.length === 0 && (
                  <tr><td colSpan={10} className="px-4 py-12 text-center text-white/30 text-sm">No active accounts</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Account detail modal */}
      {selectedAccount && (
        <AccountModal
          account={selectedAccount}
          flags={flags}
          onClose={() => setSelectedAccount(null)}
          onClearFlag={(id) => clearFlagMutation.mutate(id)}
        />
      )}
    </div>
  );
}