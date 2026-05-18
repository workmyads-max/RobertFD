import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const STATUS_CONFIG = {
  pending: { color: '#f59e0b', label: 'Pending', icon: Clock },
  under_review: { color: '#6366f1', label: 'Under Review', icon: Eye },
  approved: { color: '#10b981', label: 'Approved', icon: CheckCircle },
  rejected: { color: '#ef4444', label: 'Rejected', icon: XCircle },
};

export default function AdminAppeals() {
  const [selected, setSelected] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const qc = useQueryClient();

  const { data: appeals = [], isLoading } = useQuery({
    queryKey: ['violation-appeals'],
    queryFn: () => base44.entities.ViolationAppeal.list('-created_date', 100),
  });

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ViolationAppeal.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['violation-appeals']); setSelected(null); },
  });

  const handleDecision = (status) => {
    updateMutation.mutate({
      id: selected.id,
      data: { status, admin_notes: adminNotes, reviewed_by: user?.email, reviewed_at: new Date().toISOString() },
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-4xl font-black text-foreground flex items-center gap-3">
          <Shield className="w-6 h-6 text-primary" /> Violation Appeals
        </h1>
        <p className="text-sm text-muted-foreground font-mono mt-1">Review trader compliance appeals</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Pending Review', count: appeals.filter(a => a.status === 'pending').length, color: '#f59e0b' },
          { label: 'Approved', count: appeals.filter(a => a.status === 'approved').length, color: '#10b981' },
          { label: 'Rejected', count: appeals.filter(a => a.status === 'rejected').length, color: '#ef4444' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 text-center"
            style={{ background: `${s.color}08`, border: `1px solid ${s.color}25` }}>
            <div className="text-2xl font-black" style={{ color: s.color }}>{s.count}</div>
            <div className="text-xs font-mono text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="py-12 text-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : appeals.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }}>
          <Shield className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No appeals submitted yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appeals.map((appeal, idx) => {
            const sc = STATUS_CONFIG[appeal.status] || STATUS_CONFIG.pending;
            const Icon = sc.icon;
            return (
              <motion.div key={appeal.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                className="rounded-xl p-4 border cursor-pointer transition-all hover:border-white/20"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                onClick={() => { setSelected(appeal); setAdminNotes(appeal.admin_notes || ''); }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-sm font-bold text-foreground">{appeal.user_email}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1"
                        style={{ background: `${sc.color}18`, color: sc.color, border: `1px solid ${sc.color}35` }}>
                        <Icon className="w-2.5 h-2.5" /> {sc.label}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono capitalize">{appeal.violation_type?.replace(/_/g, ' ')} · Account: {appeal.account_id}</div>
                    <div className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{appeal.description}</div>
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono flex-shrink-0">
                    {new Date(appeal.created_date).toLocaleDateString()}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}>
          <motion.div initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }}
            className="w-full max-w-lg rounded-2xl"
            style={{ background: '#0d0f16', border: '1px solid rgba(255,92,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <h3 className="text-sm font-black text-white">Review Appeal</h3>
              <button onClick={() => setSelected(null)} className="text-white/30 hover:text-white text-lg">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div className="text-[10px] font-mono text-muted-foreground uppercase mb-1">Trader</div>
                <div className="text-sm font-bold text-foreground">{selected.user_email}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Account: {selected.account_id}</div>
                <div className="text-xs text-muted-foreground capitalize mt-0.5">Violation: {selected.violation_type?.replace(/_/g, ' ')}</div>
              </div>
              <div>
                <div className="text-[10px] font-mono text-muted-foreground uppercase mb-1">Trader's Explanation</div>
                <div className="text-xs text-foreground rounded-xl p-4 leading-relaxed" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>{selected.description}</div>
              </div>
              <div>
                <label className="text-[10px] font-mono text-muted-foreground uppercase mb-1 block">Admin Notes</label>
                <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)}
                  placeholder="Internal review notes..."
                  rows={3} className="w-full rounded-xl px-4 py-3 text-sm text-foreground outline-none resize-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
              <div className="flex gap-3">
                <button onClick={() => handleDecision('approved')}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(90deg,#10b981,#059669)' }}>
                  ✓ Approve
                </button>
                <button onClick={() => handleDecision('rejected')}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(90deg,#ef4444,#dc2626)' }}>
                  ✗ Reject
                </button>
                <button onClick={() => handleDecision('under_review')}
                  className="px-4 py-3 rounded-xl text-sm font-semibold"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  Mark Review
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}