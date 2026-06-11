import React from 'react';
import { motion } from 'framer-motion';
import { Download, FileText, Calendar, DollarSign, Activity, Shield, Zap } from 'lucide-react';

function fmt(n, d = 0) { return (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }); }

export default function ChallengeDetailSidebar({ account }) {
  if (!account) return null;

  const rules = account?.rule_snapshot || {};
  const statusColor = account.status === 'active' ? '#10b981'
    : account.status === 'passed' ? '#60a5fa'
    : account.status === 'funded' ? '#FF5C00'
    : '#ef4444';

  const startDate = account.provisioned_at
    ? new Date(account.provisioned_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  const endDate = account.provisioned_at
    ? new Date(new Date(account.provisioned_at).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  const challengeLabel = account.challenge_type === 'two-step' ? '2-Step Challenge'
    : account.challenge_type === 'instant' ? 'Instant Funding'
    : 'Instant Light';

  const details = [
    { label: 'Result', value: account.status === 'passed' ? 'Passed' : account.status === 'active' ? 'In Progress' : account.status, icon: FileText, color: statusColor },
    { label: 'Status', value: account.status === 'active' ? 'Active' : account.status, icon: Activity, color: statusColor },
    { label: 'Challenge ID', value: account.account_id || account.id?.slice(0, 12), icon: Shield, color: '#f1f5f9' },
    { label: 'Start Date', value: startDate, icon: Calendar, color: '#f1f5f9' },
    { label: 'End Date', value: endDate, icon: Calendar, color: '#f1f5f9' },
    { label: 'Account Size', value: `$${fmt(account.account_size)}`, icon: DollarSign, color: '#10b981' },
    { label: 'Account Type', value: account.account_type === 'swing' ? 'Swing' : 'Standard', icon: Zap, color: '#f1f5f9' },
    { label: 'Platform', value: (account.platform || 'MT5').toUpperCase(), icon: Activity, color: '#f1f5f9' },
  ];

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}>
      <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,92,0,0.1)' }}>
            <FileText className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-sm font-bold text-foreground">{challengeLabel}</span>
        </div>
      </div>
      <div className="p-5">
        <div className="space-y-3">
          {details.map((d) => {
            const Icon = d.icon;
            return (
              <div key={d.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5" style={{ color: d.color }} />
                  <span className="text-xs text-white/40">{d.label}</span>
                </div>
                <span className="text-xs font-bold font-mono" style={{ color: d.color }}>{d.value}</span>
              </div>
            );
          })}
        </div>

        <button className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all"
          style={{
            background: 'rgba(255,92,0,0.12)',
            border: '1px solid rgba(255,92,0,0.25)',
            color: '#FF5C00',
          }}>
          <Download className="w-3.5 h-3.5" />
          Download Certificate
        </button>
      </div>
    </div>
  );
}