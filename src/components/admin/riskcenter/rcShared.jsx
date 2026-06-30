import React from 'react';
import { Shield, AlertTriangle, Activity, Clock } from 'lucide-react';

export const RISK_CFG = {
  low: { label: 'Low', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  medium: { label: 'Medium', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  high: { label: 'High', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  critical: { label: 'Critical', color: '#dc2626', bg: 'rgba(220,38,38,0.15)' },
};

export function getScoreColor(score) {
  if (!score) return '#666';
  if (score < 30) return '#10b981';
  if (score < 60) return '#f59e0b';
  if (score < 80) return '#ef4444';
  return '#dc2626';
}

export function RiskBadge({ level }) {
  const cfg = RISK_CFG[level] || RISK_CFG.low;
  return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>;
}

export function KPICard({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-white/30 font-mono uppercase tracking-wider">{label}</span>
        {Icon && <Icon className="w-4 h-4" style={{ color }} />}
      </div>
      <div className="text-2xl font-black text-white tabular">{value}</div>
      {sub && <div className="text-[10px] text-white/25 mt-1">{sub}</div>}
    </div>
  );
}

export function Panel({ title, icon: Icon, children, action }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-primary" />}
          <span className="text-xs font-mono text-white/50 uppercase tracking-wider">{title}</span>
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export function FlagChip({ flag }) {
  return (
    <span className="px-2 py-0.5 rounded text-[9px] font-bold text-white capitalize whitespace-nowrap" style={{ background: '#ef4444' }}>
      {flag.replace(/_/g, ' ')}
    </span>
  );
}

export function EmptyState({ text }) {
  return <div className="py-12 text-center text-white/20 text-sm">{text}</div>;
}

export function fmtMoney(n) {
  if (n === undefined || n === null) return '-';
  return '$' + Math.round(n).toLocaleString();
}

export function fmtPct(n) {
  if (n === undefined || n === null) return '-';
  return Math.round(n) + '%';
}

export function ExportButton({ data, filename }) {
  const handleExport = () => {
    if (!data || !data.length) return;
    const headers = Object.keys(data[0]);
    const rows = [headers.join(','), ...data.map(r => headers.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(','))];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-white/60 hover:text-white transition-colors" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
      Export CSV
    </button>
  );
}

export function LastSynced({ scannedAt }) {
  if (!scannedAt) return null;
  return (
    <div className="flex items-center gap-1.5 text-[10px] text-white/30">
      <Clock className="w-3 h-3" /> Last scan: {new Date(scannedAt).toLocaleString()}
    </div>
  );
}