import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, CheckCircle, XCircle, AlertTriangle, Clock, ChevronDown,
  User, BarChart3, TrendingDown, Star, MessageSquare, Loader2, RefreshCw, Flag,
  ArrowRight, Layers
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const STATUS_CONFIG = {
  pending_review:  { label: 'Pending Review',   color: '#f59e0b', bg: 'rgba(245,158,11,0.1)'  },
  under_review:    { label: 'Under Review',      color: '#60a5fa', bg: 'rgba(96,165,250,0.1)'  },
  approved:        { label: 'Approved',          color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  rejected:        { label: 'Rejected',          color: '#ef4444', bg: 'rgba(239,68,68,0.1)'  },
  suspended:       { label: 'Suspended',         color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
};

function RiskBadge({ score }) {
  const color = score >= 60 ? '#ef4444' : score >= 30 ? '#f59e0b' : '#10b981';
  const label = score >= 60 ? 'HIGH RISK' : score >= 30 ? 'MED RISK' : 'LOW RISK';
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-mono font-bold"
      style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
      <Flag className="w-3 h-3" />
      {label} {score}
    </div>
  );
}

function ReviewCard({ review, onAction }) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(review.admin_notes || '');
  const [rejectReason, setRejectReason] = useState('');
  const cfg = STATUS_CONFIG[review.status] || STATUS_CONFIG.pending_review;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{ border: `1px solid ${cfg.color}25`, background: 'rgba(255,255,255,0.02)' }}>

      {/* Header */}
      <div className="flex items-center justify-between p-5 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: cfg.bg, border: `1px solid ${cfg.color}30` }}>
            <User className="w-5 h-5" style={{ color: cfg.color }} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-white truncate">{review.user_email}</span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono"
                style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
                {cfg.label}
              </span>
              {review.escalated && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono text-red-400"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  🔺 ESCALATED
                </span>
              )}
            </div>
            <div className="text-[11px] text-white/40 font-mono mt-0.5">
              {review.account_id} · ${(review.account_size || 0).toLocaleString()} · {review.challenge_type || 'two-step'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 ml-4 flex-shrink-0">
          <RiskBadge score={review.risk_score || 0} />
          <ChevronDown className={`w-4 h-4 text-white/30 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-px" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        {[
          { label: 'Total Trades', value: review.total_trades || 0 },
          { label: 'Win Rate', value: `${(review.win_rate || 0).toFixed(1)}%` },
          { label: 'Max DD', value: `${(review.max_dd_used || 0).toFixed(1)}%` },
          { label: 'Consistency', value: `${review.consistency_score || 0}%` },
          { label: 'Trading Days', value: review.trading_days || 0 },
          { label: 'Red Flags', value: review.red_flags_count || 0 },
        ].map(s => (
          <div key={s.label} className="px-4 py-3" style={{ background: 'rgba(255,255,255,0.01)' }}>
            <div className="text-[9px] font-mono text-white/30 uppercase mb-1">{s.label}</div>
            <div className="text-sm font-bold text-white">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="p-5 space-y-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>

              {/* Gross PnL */}
              {review.gross_pnl !== undefined && (
                <div className="text-sm">
                  <span className="text-white/40 font-mono text-xs">Gross PnL: </span>
                  <span className={`font-bold ${review.gross_pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    ${(review.gross_pnl || 0).toFixed(2)}
                  </span>
                </div>
              )}

              {/* Admin notes */}
              <div>
                <label className="text-xs font-mono text-white/40 uppercase mb-2 block">Admin Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                  placeholder="Internal risk management notes..."
                  className="w-full rounded-xl px-4 py-3 text-sm text-white resize-none outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>

              {/* Rejection reason (shown for reject action) */}
              <div>
                <label className="text-xs font-mono text-white/40 uppercase mb-2 block">Rejection Reason (if rejecting)</label>
                <input value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                  placeholder="Reason for rejection..."
                  className="w-full rounded-xl px-4 py-2 text-sm text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>

              {/* Action buttons */}
              {review.status === 'pending_review' || review.status === 'under_review' ? (
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => onAction('under_review', review.id, notes, null)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold"
                    style={{ background: 'rgba(96,165,250,0.15)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.3)' }}>
                    <Clock className="w-3.5 h-3.5" /> Start Review
                  </button>

                  <button onClick={() => onAction('approve', review.id, notes, null)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold"
                    style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
                    <CheckCircle className="w-3.5 h-3.5" /> Approve Funded
                  </button>

                  <button onClick={() => onAction('reject', review.id, notes, rejectReason)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold"
                    style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>

                  <button onClick={() => onAction('suspend', review.id, notes, 'Administrative suspension')}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold"
                    style={{ background: 'rgba(139,92,246,0.15)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.3)' }}>
                    <AlertTriangle className="w-3.5 h-3.5" /> Suspend
                  </button>

                  <button onClick={() => onAction('escalate', review.id, notes, null)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold"
                    style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <Star className="w-3.5 h-3.5" /> Escalate
                  </button>

                  <button onClick={() => onAction('notes', review.id, notes, null)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.12)' }}>
                    <MessageSquare className="w-3.5 h-3.5" /> Save Notes
                  </button>
                </div>
              ) : (
                <div className="text-xs font-mono text-white/30 pt-2">
                  Reviewed by {review.reviewed_by || 'N/A'} on {review.reviewed_at ? new Date(review.reviewed_at).toLocaleString() : 'N/A'}
                  {review.rejection_reason && <div className="mt-1 text-red-400">Reason: {review.rejection_reason}</div>}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Phase 1 Review Card ───────────────────────────────────────────────────────
function Phase1ReviewCard({ account, onApprove, onReject, loading }) {
  const [expanded, setExpanded] = useState(false);
  const size = (account.account_size || 0).toLocaleString();
  const cLabel = account.challenge_type === 'two-step' ? '2-Step' : account.challenge_type === 'instant' ? 'Instant' : 'Inst.Light';

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{ border: '1px solid rgba(96,165,250,0.25)', background: 'rgba(255,255,255,0.02)' }}>
      <div className="flex items-center justify-between p-5 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.3)' }}>
            <Layers className="w-5 h-5 text-blue-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-white truncate">{account.user_email}</span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono text-blue-400"
                style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.3)' }}>
                Phase 1 Passed
              </span>
            </div>
            <div className="text-[11px] text-white/40 font-mono mt-0.5">
              {account.account_id} · ${size} · {cLabel} · Progress: {(account.profit_target_progress || 0).toFixed(1)}%
            </div>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-white/30 transition-transform flex-shrink-0 ml-4 ${expanded ? 'rotate-180' : ''}`} />
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="p-5 space-y-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Size', value: `$${size}` },
                  { label: 'Balance', value: `$${(account.balance || 0).toLocaleString()}` },
                  { label: 'Trading Days', value: account.trading_days || 0 },
                  { label: 'Win Rate', value: `${(account.win_rate || 0).toFixed(1)}%` },
                ].map(s => (
                  <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="text-xs font-bold text-white">{s.value}</div>
                    <div className="text-[9px] font-mono text-white/30 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => onApprove(account.account_id)} disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold disabled:opacity-50"
                  style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                  Approve → Provision Phase 2 MT5 Account
                </button>
                <button onClick={() => onReject(account.id)} disabled={loading}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold disabled:opacity-50"
                  style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function AdminFundedReview() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('pending_review');

  // Phase 1 accounts waiting for admin to provision Phase 2
  const { data: phase1Pending = [], refetch: refetchP1 } = useQuery({
    queryKey: ['phase1-pending-review'],
    queryFn: () => base44.entities.ChallengeAccount.filter({ phase_review_status: 'pending_review' }),
    refetchInterval: 15000,
  });

  const phase1ApproveMutation = useMutation({
    mutationFn: (account_id) => base44.functions.invoke('phaseProgressionEngine', { action: 'approve_phase1', account_id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['phase1-pending-review'] });
      toast.success('Phase 2 account provisioned successfully');
    },
    onError: (e) => toast.error('Approval failed: ' + (e.response?.data?.error || e.message)),
  });

  const phase1RejectMutation = useMutation({
    mutationFn: (id) => base44.entities.ChallengeAccount.update(id, { phase_review_status: 'rejected', status: 'failed' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['phase1-pending-review'] }); toast.success('Rejected'); },
    onError: (e) => toast.error('Failed: ' + e.message),
  });

  const { data: reviews = [], isLoading, refetch } = useQuery({
    queryKey: ['funded-reviews', statusFilter],
    queryFn: () => statusFilter === 'all'
      ? base44.entities.FundedAccountReview.list('-created_date', 100)
      : base44.entities.FundedAccountReview.filter({ status: statusFilter }),
    refetchInterval: 15000,
  });

  const actionMutation = useMutation({
    mutationFn: async ({ type, reviewId, notes, reason }) => {
      if (type === 'notes' || type === 'under_review' || type === 'escalate') {
        const updateData = { admin_notes: notes };
        if (type === 'under_review') updateData.status = 'under_review';
        if (type === 'escalate') { updateData.escalated = true; updateData.escalation_reason = notes; }
        return base44.entities.FundedAccountReview.update(reviewId, updateData);
      }
      if (type === 'approve') {
        return base44.functions.invoke('phaseProgressionEngine', { action: 'approve_funded', review_id: reviewId });
      }
      if (type === 'reject') {
        return base44.functions.invoke('phaseProgressionEngine', { action: 'reject_funded', review_id: reviewId, reason });
      }
      if (type === 'suspend') {
        return base44.functions.invoke('phaseProgressionEngine', { action: 'suspend_account', review_id: reviewId, reason });
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['funded-reviews'] }); toast.success('Action completed'); },
    onError: (e) => toast.error('Action failed: ' + e.message),
  });

  const handleAction = (type, reviewId, notes, reason) => {
    if (type === 'approve' && !window.confirm('Are you sure you want to APPROVE this trader for a funded live account?')) return;
    if (type === 'reject' && !reason) { toast.error('Please provide a rejection reason'); return; }
    actionMutation.mutate({ type, reviewId, notes, reason });
  };

  const statusCounts = {
    pending_review: reviews.filter ? undefined : 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}>
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            Phase Review & Funded Approvals
          </h1>
          <p className="text-sm text-white/30 font-mono mt-1">Phase 1→2 provisioning and funded account review queue</p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white/60 hover:text-white transition-colors"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* ── Phase 1 Pending Review Queue ── */}
      {phase1Pending.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(96,165,250,0.2)', background: 'rgba(96,165,250,0.03)' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(96,165,250,0.15)' }}>
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-bold text-blue-400">Phase 1 → Phase 2 Approvals</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-blue-400"
                style={{ background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.3)' }}>
                {phase1Pending.length} pending
              </span>
            </div>
            <button onClick={() => refetchP1()} className="text-white/30 hover:text-white/60 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="p-4 space-y-3">
            {phase1Pending.map(acc => (
              <Phase1ReviewCard
                key={acc.id}
                account={acc}
                onApprove={(account_id) => {
                  if (!window.confirm(`Approve Phase 1 for ${acc.user_email}? This will provision a new MT5 Phase 2 account.`)) return;
                  phase1ApproveMutation.mutate(account_id);
                }}
                onReject={(id) => {
                  if (!window.confirm('Reject this Phase 1 pass?')) return;
                  phase1RejectMutation.mutate(id);
                }}
                loading={phase1ApproveMutation.isPending || phase1RejectMutation.isPending}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Funded Review Queue header ── */}
      <div className="flex items-center gap-2.5 mt-2">
        <Shield className="w-4 h-4 text-emerald-400" />
        <span className="text-sm font-bold text-white">Phase 2 → Funded Approvals</span>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'pending_review', label: 'Pending Review' },
          { id: 'under_review',   label: 'Under Review' },
          { id: 'approved',       label: 'Approved' },
          { id: 'rejected',       label: 'Rejected' },
          { id: 'suspended',      label: 'Suspended' },
          { id: 'all',            label: 'All' },
        ].map(s => {
          const cfg = STATUS_CONFIG[s.id] || { color: '#ffffff', bg: 'rgba(255,255,255,0.06)' };
          const active = statusFilter === s.id;
          return (
            <button key={s.id} onClick={() => setStatusFilter(s.id)}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
              style={{
                background: active ? cfg.bg : 'rgba(255,255,255,0.03)',
                color: active ? cfg.color : 'rgba(255,255,255,0.4)',
                border: `1px solid ${active ? cfg.color + '40' : 'rgba(255,255,255,0.08)'}`,
              }}>
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Review queue */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ border: '1px dashed rgba(255,255,255,0.08)' }}>
          <CheckCircle className="w-12 h-12 text-emerald-500/30 mx-auto mb-4" />
          <p className="text-white/40 text-sm">No reviews in this queue</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map(review => (
            <ReviewCard key={review.id} review={review}
              onAction={(type, id, notes, reason) => handleAction(type, id, notes, reason)} />
          ))}
        </div>
      )}
    </div>
  );
}