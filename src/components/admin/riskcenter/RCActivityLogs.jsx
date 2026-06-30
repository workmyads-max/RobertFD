import React, { useEffect, useState } from 'react';
import { FileText, Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Panel, ExportButton, EmptyState } from './rcShared';

export default function RCActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await base44.entities.RiskAuditLog.list('-timestamp', 200);
        setLogs(data || []);
      } catch (e) {
        // Fallback: try filter
        try {
          const data = await base44.entities.RiskAuditLog.filter({}, '-timestamp', 200);
          setLogs(data || []);
        } catch (_) { setLogs([]); }
      }
      setLoading(false);
    })();
  }, []);

  const filtered = logs.filter(l => {
    if (!search) return true;
    const q = search.toLowerCase();
    return l.admin_email?.toLowerCase().includes(q) ||
      l.action?.toLowerCase().includes(q) ||
      l.target_user_email?.toLowerCase().includes(q) ||
      l.target_account?.toLowerCase().includes(q);
  });

  const exportData = filtered.map(l => ({
    timestamp: l.timestamp, admin: l.admin_email, action: l.action,
    category: l.action_category, target_account: l.target_account,
    target_user: l.target_user_email, reason: l.reason,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 relative min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by admin, action, or target..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
        </div>
        <ExportButton data={exportData} filename="audit_logs.csv" />
      </div>

      <Panel title="Audit Trail" icon={FileText}>
        {loading ? (
          <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState text="No audit logs yet. Admin manual actions will appear here." />
        ) : (
          <div className="space-y-1.5">
            {filtered.map(log => (
              <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: log.action?.includes('fail') || log.action?.includes('suspend') ? '#ef4444' : log.action?.includes('reviewed') || log.action?.includes('false_positive') ? '#10b981' : '#FF5C00' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-white capitalize">{log.action?.replace(/_/g, ' ')}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono text-white/50" style={{ background: 'rgba(255,255,255,0.05)' }}>{log.action_category}</span>
                  </div>
                  <div className="text-[10px] text-white/40 mt-0.5">
                    {log.admin_email} → {log.target_user_email || '-'} ({log.target_account || '-'})
                  </div>
                  {log.reason && <div className="text-[10px] text-white/30 mt-1">{log.reason}</div>}
                  <div className="text-[10px] text-white/20 mt-1">{log.timestamp ? new Date(log.timestamp).toLocaleString() : '-'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}