import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Search, Eye, CheckCircle2, XCircle, Clock, RefreshCw, AlertTriangle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: '#f59e0b' },
  approved: { label: 'Approved', color: '#10b981' },
  rejected: { label: 'Rejected', color: '#ef4444' },
  resubmit_required: { label: 'Resubmit', color: '#a78bfa' },
  not_submitted: { label: 'Not Submitted', color: '#666' },
};

export default function AdminKYC() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('pending');
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState('');

  const { data: kycList = [], isLoading } = useQuery({
    queryKey: ['admin-kyc'],
    queryFn: () => base44.entities.KYCVerification.list('-created_date', 200),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.KYCVerification.update(id, { ...data, reviewed_at: new Date().toISOString() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-kyc'] }); setSelected(null); setNotes(''); },
  });

  const filtered = kycList.filter(k => {
    const matchSearch = !search || k.user_email?.toLowerCase().includes(search.toLowerCase()) || k.full_name?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || k.status === filter;
    return matchSearch && matchFilter;
  });

  const handleAction = (action) => {
    const data = { status: action, admin_notes: notes };
    if (action === 'rejected' || action === 'resubmit_required') data.rejection_reason = notes;
    updateMutation.mutate({ id: selected.id, data });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-primary" /> KYC Review
          </h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">{kycList.filter(k => k.status === 'pending').length} pending reviews</p>
        </div>
      </div>

      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 min-w-48" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <Search className="w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search email or name..."
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50" />
        </div>
        <div className="flex gap-2">
          {['all', 'pending', 'approved', 'rejected', 'resubmit_required'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className="px-3 py-2 rounded-xl text-xs font-mono capitalize transition-all"
              style={{
                background: filter === s ? 'rgba(255,92,0,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${filter === s ? 'rgba(255,92,0,0.4)' : 'rgba(255,255,255,0.08)'}`,
                color: filter === s ? '#FF5C00' : 'hsl(var(--muted-foreground))',
              }}>
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="grid grid-cols-5 gap-2 px-5 py-3 text-[10px] font-mono text-muted-foreground uppercase border-b border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <span className="col-span-2">User</span><span>Document</span><span>Submitted</span><span>Status / Action</span>
        </div>
        {isLoading ? (
          <div className="py-12 text-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">No KYC submissions found.</div>
        ) : filtered.map(k => {
          const sc = STATUS_CONFIG[k.status] || STATUS_CONFIG.not_submitted;
          return (
            <div key={k.id} className="grid grid-cols-5 gap-2 px-5 py-3.5 border-b border-white/[0.04] hover:bg-white/[0.02] items-center">
              <div className="col-span-2 min-w-0">
                <div className="text-xs font-semibold text-foreground">{k.full_name || '-'}</div>
                <div className="text-[11px] text-muted-foreground truncate">{k.user_email}</div>
              </div>
              <span className="text-xs text-muted-foreground capitalize">{k.id_type?.replace('_', ' ') || '-'}</span>
              <span className="text-[11px] text-muted-foreground font-mono">{k.submitted_at ? new Date(k.submitted_at).toLocaleDateString() : '-'}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-1 rounded-lg" style={{ background: `${sc.color}15`, color: sc.color, border: `1px solid ${sc.color}30` }}>{sc.label}</span>
                <button onClick={() => { setSelected(k); setNotes(k.admin_notes || ''); }} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                  <Eye className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="w-full max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto"
              style={{ background: '#0e0e10', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center justify-between p-5 border-b border-white/5">
                <h2 className="text-base font-black">KYC Review - {selected.full_name || selected.user_email}</h2>
                <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground text-xl">×</button>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[
                    { l: 'Email', v: selected.user_email },
                    { l: 'Full Name', v: selected.full_name },
                    { l: 'Date of Birth', v: selected.date_of_birth },
                    { l: 'Nationality', v: selected.nationality },
                    { l: 'Document Type', v: selected.id_type?.replace('_', ' ') },
                    { l: 'Status', v: STATUS_CONFIG[selected.status]?.label },
                  ].map(({ l, v }) => (
                    <div key={l}>
                      <div className="text-[10px] font-mono text-muted-foreground mb-0.5 uppercase">{l}</div>
                      <div className="text-xs font-semibold text-foreground">{v || '-'}</div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[
                    { label: 'ID Front', url: selected.id_front_url },
                    { label: 'ID Back', url: selected.id_back_url },
                    { label: 'Selfie', url: selected.selfie_url },
                    { label: 'Proof of Address', url: selected.proof_of_address_url },
                  ].map(doc => (
                    <div key={doc.label} className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div className="text-[10px] text-muted-foreground mb-2">{doc.label}</div>
                      {doc.url ? (
                        <a href={doc.url} target="_blank" rel="noreferrer" className="text-primary text-xs hover:underline">View Document ↗</a>
                      ) : (
                        <span className="text-xs text-muted-foreground/40">Not uploaded</span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mb-4">
                  <label className="text-[10px] font-mono text-muted-foreground uppercase mb-1 block">Admin Notes / Rejection Reason</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                    placeholder="Add notes or reason for rejection..."
                    className="w-full rounded-xl px-3 py-2.5 text-sm text-foreground outline-none resize-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => handleAction('approved')} disabled={updateMutation.isPending}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white disabled:opacity-40"
                    style={{ background: 'linear-gradient(90deg,#10b981,#059669)' }}>
                    ✓ Approve
                  </button>
                  <button onClick={() => handleAction('resubmit_required')} disabled={updateMutation.isPending}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold disabled:opacity-40"
                    style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.3)' }}>
                    ↩ Request Resubmit
                  </button>
                  <button onClick={() => handleAction('rejected')} disabled={updateMutation.isPending}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white disabled:opacity-40"
                    style={{ background: 'rgba(239,68,68,0.8)' }}>
                    ✗ Reject
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}