import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, AlertTriangle, Activity, Globe, FileText, 
  Search, Filter, Download, Eye, AlertCircle, RefreshCw,
  Zap, Bot, GitBranch, TrendingUp, Users, Lock, Trash2
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCard } from '@/components/ui/alert-card';

const TABS = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'hft', label: 'HFT Detection', icon: Zap },
  { id: 'bot', label: 'EA/Bot', icon: Bot },
  { id: 'arbitrage', label: 'Arbitrage', icon: GitBranch },
  { id: 'ip', label: 'IP & Device', icon: Globe },
  { id: 'behavior', label: 'Behavioral', icon: TrendingUp },
  { id: 'exposure', label: 'Firm Exposure', icon: Activity },
  { id: 'kyc', label: 'KYC Review', icon: FileText },
];

const RISK_CFG = {
  low: { label: 'Low Risk', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  medium: { label: 'Medium Risk', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  high: { label: 'High Risk', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  critical: { label: 'Critical', color: '#7f1d1d', bg: 'rgba(127,29,29,0.15)' }
};

export default function AdminRiskCenter() {
  const [activeTab, setActiveTab] = useState('overview');
  const [search, setSearch] = useState('');
  const qc = useQueryClient();

  const { data: accounts = [] } = useQuery({
    queryKey: ['risk-accounts'],
    queryFn: async () => {
      const all = await base44.entities.ChallengeAccount.filter({}, '-created_date', 200);
      return all.filter(a => a.status !== 'failed');
    },
    refetchInterval: 30000,
  });

  const highRisk = accounts.filter(a => (a.risk_score || 0) >= 61).length;
  const critical = accounts.filter(a => (a.risk_score || 0) >= 81).length;

  const filtered = accounts.filter(a =>
    a.user_email?.toLowerCase().includes(search.toLowerCase()) ||
    a.account_id?.toLowerCase().includes(search.toLowerCase())
  );

  const handleScan = async () => {
    try {
      await base44.functions.invoke('automatedRiskScan', {});
      qc.invalidateQueries({ queryKey: ['risk-accounts'] });
      alert('Risk scan completed');
    } catch (e) {
      alert('Scan failed: ' + e.message);
    }
  };

  const handleAction = async (account, action) => {
    try {
      if (action === 'suspend') {
        await base44.entities.ChallengeAccount.update(account.id, { can_trade: false });
        alert('Account suspended');
      } else if (action === 'terminate') {
        await base44.entities.ChallengeAccount.update(account.id, { status: 'failed' });
        alert('Account terminated');
      }
      qc.invalidateQueries({ queryKey: ['risk-accounts'] });
    } catch (e) {
      alert('Action failed: ' + e.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <Shield className="w-7 h-7 text-primary" /> Risk Management Center
          </h1>
          <p className="text-sm text-white/30 mt-1">Institutional-grade risk monitoring</p>
        </div>
        <button onClick={handleScan}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white"
          style={{ background: 'rgba(255,92,0,0.15)', border: '1px solid rgba(255,92,0,0.3)' }}>
          <RefreshCw className="w-4 h-4" /> Scan All
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPICard label="Total Accounts" value={accounts.length} icon={Users} color="#3b82f6" />
        <KPICard label="High Risk" value={highRisk} sub={`${critical} critical`} icon={AlertTriangle} color="#ef4444" />
        <KPICard label="Medium Risk" value={accounts.filter(a => (a.risk_score || 0) >= 31 && (a.risk_score || 0) < 61).length} icon={AlertCircle} color="#f59e0b" />
        <KPICard label="Low Risk" value={accounts.filter(a => (a.risk_score || 0) < 31).length} icon={Activity} color="#10b981" />
      </div>

      {/* Critical Alert */}
      {critical > 0 && (
        <div className="mb-6">
          <AlertCard
            isVisible={true}
            title={`⚠️ ${critical} Critical Risk Account${critical > 1 ? 's' : ''} Detected`}
            description="These accounts have risk scores above 81 and require immediate attention."
            variant="danger"
          />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl overflow-x-auto"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap"
              style={{
                background: active ? 'rgba(255,92,0,0.15)' : 'transparent',
                color: active ? '#FF5C00' : 'rgba(255,255,255,0.4)',
                border: active ? '1px solid rgba(255,92,0,0.3)' : '1px solid transparent',
              }}>
              <Icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div>
          {/* Search */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by email or account ID..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-3 px-4 text-xs font-mono text-white/30 uppercase">Trader</th>
                  <th className="text-left py-3 px-4 text-xs font-mono text-white/30 uppercase">Score</th>
                  <th className="text-left py-3 px-4 text-xs font-mono text-white/30 uppercase">Level</th>
                  <th className="text-left py-3 px-4 text-xs font-mono text-white/30 uppercase">Flags</th>
                  <th className="text-left py-3 px-4 text-xs font-mono text-white/30 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center text-white/20">No accounts</td></tr>
                ) : (
                  filtered.map(acc => (
                    <tr key={acc.id} className="border-b border-white/[0.04]">
                      <td className="py-3 px-4">
                        <div className="text-sm font-bold text-white">{acc.user_email?.split('@')[0]}</div>
                        <div className="text-xs text-white/30">{acc.account_id}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-lg font-black" style={{ color: getScoreColor(acc.risk_score) }}>
                          {acc.risk_score || 0}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <RiskBadge level={acc.risk_level} />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1 flex-wrap">
                          {(acc.risk_flags || []).slice(0, 3).map((f, i) => (
                            <span key={i} className="px-2 py-0.5 rounded text-[10px] font-bold text-white"
                              style={{ background: '#ef4444' }}>{f.replace('_', ' ').toUpperCase()}</span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button onClick={() => handleAction(acc, 'suspend')}
                            className="p-1.5 rounded-lg hover:bg-white/[0.05]" title="Suspend">
                            <Lock className="w-4 h-4 text-red-400" />
                          </button>
                          <button onClick={() => handleAction(acc, 'terminate')}
                            className="p-1.5 rounded-lg hover:bg-white/[0.05]" title="Terminate">
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Other tabs */}
      {activeTab !== 'overview' && (
        <div className="text-center py-20 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }}>
          <Activity className="w-12 h-12 mx-auto mb-4 text-white/10" />
          <p className="text-white/20">Under construction</p>
        </div>
      )}
    </div>
  );
}

function KPICard({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-white/30 font-mono uppercase">{label}</span>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="text-2xl font-black text-white">{value}</div>
      {sub && <div className="text-xs text-white/25 mt-1">{sub}</div>}
    </div>
  );
}

function RiskBadge({ level }) {
  const cfg = RISK_CFG[level] || RISK_CFG.low;
  return (
    <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

function getScoreColor(score) {
  if (!score) return '#666';
  if (score < 30) return '#10b981';
  if (score < 60) return '#f59e0b';
  if (score < 80) return '#ef4444';
  return '#7f1d1d';
}