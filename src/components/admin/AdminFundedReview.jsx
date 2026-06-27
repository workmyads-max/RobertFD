import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, CheckCircle, XCircle, AlertTriangle, Clock,
  User, MessageSquare, Loader2, RefreshCw, Flag,
  ArrowRight, Layers, ChevronDown, Star, TrendingUp
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const STATUS_CONFIG = {
  pending_review: { label: 'Pending Review', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', dot: '#f59e0b' },
  under_review:   { label: 'Under Review',   color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  dot: '#60a5fa' },
  approved:       { label: 'Approved',        color: '#10b981', bg: 'rgba(16,185,129,0.1)', dot: '#10b981' },
  rejected:       { label: 'Rejected',        color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  dot: '#ef4444' },
  suspended:      { label: 'Suspended',       color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', dot: '#8b5cf6' },
};

// ─── Phase 1 Card ─────────────────────────────────────────────────────────────
function Phase1ReviewCard({ account, onApprove, onReject, loading }) {
  const size = (account.account_size || 0).toLocaleString();
  const cLabel = account.challenge_type === 'two-step' ? 'Two-Step' : account.challenge_type === 'instant' ? 'Instant' : 'Instant Light';
  const initials = (account.user_email || '?')[0].toUpperCase();

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden"
      style={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.08)', borderLeft: '3px solid #3b82f6' }}>

      {/* Top section */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-black flex-shrink-0"
              style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.25)' }}>
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-white">{account.user_email}</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide"
                  style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
                  PHASE 1 PASSED
                </span>
              </div>
              <div className="text-xs text-white/35 mt-0.5 font-mono">{cLabel} · ${size}</div>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-[10px] text-white/30 uppercase tracking-wide mb-0.5">Reward</div>
            <div className="text-base font-black text-emerald-400">{(account.profit_target_progress || 0).toFixed(1)}%</div>
          </div>
        </div>

        {/* Account details row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Account ID', value: account.account_id || '—' },
            { label: 'MT5 Login', value: account.mt_login || '—' },
            { label: 'Server', value: account.mt_server || account.server || '—' },
          ].map(d => (
            <div key={d.label} className="rounded-lg px-3 py-2.5"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-[9px] font-semibold uppercase tracking-wider text-white/25 mb-1">{d.label}</div>
              <div className="text-xs font-bold text-white font-mono truncate">{d.value}</div>
            </div>
          ))}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { label: 'Balance', value: `$${(account.balance || account.account_size || 0).toLocaleString()}` },
            { label: 'Trading Days', value: account.trading_days || 0 },
            { label: 'Win Rate', value: `${(account.win_rate || 0).toFixed(1)}%` },
            { label: 'Total Trades', value: account.total_trades || 0 },
          ].map(s => (
            <div key={s.label} className="text-center rounded-lg py-2.5"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="text-[9px] font-semibold uppercase tracking-wider text-white/25 mb-1">{s.label}</div>
              <div className="text-sm font-black text-white">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={() => onApprove(account.account_id)} disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold disabled:opacity-40 transition-all hover:brightness-110 flex-1 justify-center"
            style={{ background: '#10b981', color: '#fff' }}>
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
            Approve → Provision Phase 2
          </button>
          <button onClick={() => onReject(account.account_id)} disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold disabled:opacity-40 transition-all hover:brightness-110"
            style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}>
            <XCircle className="w-3.5 h-3.5" /> Reject
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Funded Review Card ────────────────────────────────────────────────────────
function ReviewCard({ review, onAction }) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(review.admin_notes || '');
  const [rejectReason, setRejectReason] = useState('');
  const cfg = STATUS_CONFIG[review.status] || STATUS_CONFIG.pending_review;
  const initials = (review.user_email || review.trader_name || '?')[0].toUpperCase();
  const riskColor = (review.risk_score || 0) >= 60 ? '#ef4444' : (review.risk_score || 0) >= 30 ? '#f59e0b' : '#10b981';
  const riskLabel = (review.risk_score || 0) >= 60 ? 'High' : (review.risk_score || 0) >= 30 ? 'Med' : 'Low';

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden"
      style={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.08)', borderLeft: `3px solid ${cfg.color}` }}>

      {/* Header row — always visible */}
      <div className="flex items-center gap-4 p-5 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-black flex-shrink-0"
          style={{ background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}25` }}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="text-sm font-bold text-white">{review.trader_name || review.user_email}</span>
            {review.trader_name && review.user_email && (
              <span className="text-xs text-white/35 font-mono">{review.user_email}</span>
            )}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold"
              style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}25` }}>
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: cfg.dot }} />
              {cfg.label}
            </span>
            {review.escalated && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold text-red-400"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                ⬆ ESCALATED
              </span>
            )}
          </div>
          <div className="text-[11px] text-white/35 font-mono">
            {review.account_id} · ${(review.account_size || 0).toLocaleString()} · {review.challenge_type || 'two-step'}
            {review.mt_login && <span className="text-white/55"> · MT5: {review.mt_login}</span>}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right hidden sm:block">
            <div className="text-[9px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: riskColor }}>Risk</div>
            <div className="text-xs font-black" style={{ color: riskColor }}>{riskLabel} {review.risk_score || 0}</div>
          </div>
          <ChevronDown className={`w-4 h-4 text-white/25 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 md:grid-cols-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        {[
          { label: 'Trades', value: review.total_trades || 0 },
          { label: 'Win Rate', value: `${(review.win_rate || 0).toFixed(1)}%` },
          { label: 'Max DD', value: `${(review.max_dd_used || 0).toFixed(1)}%` },
          { label: 'Consistency', value: `${review.consistency_score || 0}%` },
          { label: 'Days', value: review.trading_days || 0 },
          { label: 'Red Flags', value: review.red_flags_count || 0 },
        ].map((s, i) => (
          <div key={s.label} className="px-4 py-3 text-center"
            style={{ borderRight: i < 5 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
            <div className="text-[9px] font-semibold uppercase tracking-wider text-white/25 mb-1">{s.label}</div>
            <div className="text-sm font-bold text-white">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Expandable actions */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="p-5 space-y-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>

              {review.gross_pnl !== undefined && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-white/35 font-mono text-xs">Gross P&L:</span>
                  <span className={`font-black ${review.gross_pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {review.gross_pnl >= 0 ? '+' : ''}${(review.gross_pnl || 0).toFixed(2)}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-white/30 mb-1.5 block">Admin Notes</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                    placeholder="Internal risk management notes..."
                    className="w-full rounded-lg px-3 py-2.5 text-sm text-white resize-none outline-none"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-white/30 mb-1.5 block">Rejection Reason</label>
                  <input value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                    placeholder="Required if rejecting..."
                    className="w-full rounded-lg px-3 py-2.5 text-sm text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
                </div>
              </div>

              {(review.status === 'pending_review' || review.status === 'under_review') ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  <button onClick={() => onAction('under_review', review.id, notes, null)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all hover:brightness-110"
                    style={{ background: 'rgba(96,165,250,0.12)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.2)' }}>
                    <Clock className="w-3.5 h-3.5" /> Start Review
                  </button>
                  <button onClick={() => onAction('approve', review.id, notes, null)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all hover:brightness-110"
                    style={{ background: '#10b981', color: '#fff' }}>
                    <CheckCircle className="w-3.5 h-3.5" /> Approve Sim Funded
                  </button>
                  <button onClick={() => onAction('reject', review.id, notes, rejectReason)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all hover:brightness-110"
                    style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                  <button onClick={() => onAction('suspend', review.id, notes, 'Administrative suspension')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all hover:brightness-110"
                    style={{ background: 'rgba(139,92,246,0.12)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.2)' }}>
                    <AlertTriangle className="w-3.5 h-3.5" /> Suspend
                  </button>
                  <button onClick={() => onAction('escalate', review.id, notes, null)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all hover:brightness-110"
                    style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}>
                    <Star className="w-3.5 h-3.5" /> Escalate
                  </button>
                  <button onClick={() => onAction('notes', review.id, notes, null)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all hover:brightness-110"
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <MessageSquare className="w-3.5 h-3.5" /> Save Notes
                  </button>
                </div>
              ) : (
                <div className="text-xs text-white/30 font-mono pt-1">
                  Reviewed by <span className="text-white/50">{review.reviewed_by || 'N/A'}</span> · {review.reviewed_at ? new Date(review.reviewed_at).toLocaleString() : 'N/A'}
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

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function AdminFundedReview() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('pending_review');

  const { data: phase1Pending = [], refetch: refetchP1, isLoading: p1Loading } = useQuery({
    queryKey: ['phase1-pending-review'],
    queryFn: async () => {
      // Use adminListAllAccounts (service role) to bypass RLS — otherwise the
      // admin can only see their own passed accounts, missing other users' Phase 1
      // passed accounts that need review.
      const res = await base44.functions.invoke('adminListAllAccounts', { limit: 500 });
      const all = res?.data?.accounts || [];
      return all.filter(a =>
        a.status === 'passed' &&
        a.phase === 'phase1' &&
        a.phase_review_status === 'pending_review' &&
        a.challenge_type === 'two-step' // Only two-step challenges need phase1 review; instant/instant_light go straight to funded
      );
    },
    refetchInterval: 15000,
  });

  const phase1ApproveMutation = useMutation({
    mutationFn: (account_id) => base44.functions.invoke('phaseProgressionEngine', { action: 'approve_phase1', account_id }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['phase1-pending-review'] }); toast.success('Phase 2 account provisioned successfully'); },
    onError: (e) => toast.error('Approval failed: ' + (e.response?.data?.error || e.message)),
  });

  const phase1RejectMutation = useMutation({
    // Use phaseProgressionEngine (service role) — direct entity update is RLS-blocked
    // for accounts belonging to other users.
    mutationFn: (account_id) => base44.functions.invoke('phaseProgressionEngine', { action: 'reject_phase1', account_id }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['phase1-pending-review'] }); toast.success('Phase 1 rejected'); },
    onError: (e) => toast.error('Failed: ' + (e.response?.data?.error || e.message)),
  });

  const { data: reviews = [], isLoading, refetch } = useQuery({
    queryKey: ['funded-reviews', statusFilter],
    queryFn: async () => {
      const list = statusFilter === 'all'
        ? await base44.entities.FundedAccountReview.list('-created_date', 100)
        : await base44.entities.FundedAccountReview.filter({ status: statusFilter });
      // FundedAccountReview doesn't store mt_login — fetch from ChallengeAccount
      if (!list.length) return list;
      const accountIds = [...new Set(list.map(r => r.account_id).filter(Boolean))];
      const accounts = await Promise.all(
        accountIds.map(id => base44.entities.ChallengeAccount.filter({ account_id: id }))
      );
      const accountMap = {};
      accountIds.forEach((id, i) => {
        const acc = accounts[i]?.[0];
        if (acc) accountMap[id] = acc;
      });
      return list.map(r => ({ ...r, mt_login: accountMap[r.account_id]?.mt_login || '', mt_server: accountMap[r.account_id]?.mt_server || accountMap[r.account_id]?.server || '' }));
    },
    refetchInterval: 15000,
  });

  const actionMutation = useMutation({
    mutationFn: async ({ type, reviewId, notes, reason }) => {
      if (type === 'notes' || type === 'under_review' || type === 'escalate') {
        const d = { admin_notes: notes };
        if (type === 'under_review') d.status = 'under_review';
        if (type === 'escalate') { d.escalated = true; d.escalation_reason = notes; }
        return base44.entities.FundedAccountReview.update(reviewId, d);
      }
      if (type === 'approve') return base44.functions.invoke('phaseProgressionEngine', { action: 'approve_funded', review_id: reviewId });
      if (type === 'reject') return base44.functions.invoke('phaseProgressionEngine', { action: 'reject_funded', review_id: reviewId, reason });
      if (type === 'suspend') return base44.functions.invoke('phaseProgressionEngine', { action: 'suspend_account', review_id: reviewId, reason });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['funded-reviews'] }); toast.success('Action completed'); },
    onError: (e) => toast.error('Action failed: ' + e.message),
  });

  const handleAction = (type, reviewId, notes, reason) => {
    if (type === 'approve' && !window.confirm('Approve this trader for a simulation funded live account?')) return;
    if (type === 'reject' && !reason) { toast.error('Please provide a rejection reason'); return; }
    actionMutation.mutate({ type, reviewId, notes, reason });
  };

  const FILTERS = [
    { id: 'pending_review', label: 'Pending' },
    { id: 'under_review',   label: 'Under Review' },
    { id: 'approved',       label: 'Approved' },
    { id: 'rejected',       label: 'Rejected' },
    { id: 'suspended',      label: 'Suspended' },
    { id: 'all',            label: 'All' },
  ];

  return (
    <div className="space-y-6">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <Shield className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white leading-none">Phase Review &amp; Simulation Funded Approvals</h1>
            <p className="text-xs text-white/30 font-mono mt-1">Phase 1→2 provisioning and simulation funded account review queue</p>
          </div>
        </div>
        <button onClick={() => { refetch(); refetchP1(); }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-white/50 hover:text-white transition-colors"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* ── Phase 1 → Phase 2 Section ── */}
      <div className="rounded-xl overflow-hidden" style={{ background: '#0a0d14', border: '1px solid rgba(59,130,246,0.15)' }}>
        {/* Section header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: 'rgba(59,130,246,0.12)', background: 'rgba(59,130,246,0.04)' }}>
          <div className="flex items-center gap-2.5">
            <Layers className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-bold text-blue-400">Phase 1 → Phase 2 Approvals</span>
            {phase1Pending.length > 0 && (
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white"
                style={{ background: '#3b82f6' }}>{phase1Pending.length}</span>
            )}
          </div>
          {p1Loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-white/30" />}
        </div>

        <div className="p-4">
          {phase1Pending.length === 0 ? (
            <div className="py-8 text-center">
              <CheckCircle className="w-8 h-8 text-emerald-500/20 mx-auto mb-2" />
              <p className="text-xs text-white/25 font-mono">No Phase 1 accounts pending review</p>
            </div>
          ) : (
            <div className="space-y-3">
              {phase1Pending.map(acc => (
                <Phase1ReviewCard
                  key={acc.id}
                  account={acc}
                  onApprove={(account_id) => {
                    if (!window.confirm(`Approve Phase 1 for ${acc.user_email}?\nThis will provision a new Phase 2 MT5 account.`)) return;
                    phase1ApproveMutation.mutate(account_id);
                  }}
                  onReject={(account_id) => {
                    if (!window.confirm('Reject this Phase 1 pass? This will mark the account as failed.')) return;
                    phase1RejectMutation.mutate(account_id);
                  }}
                  loading={phase1ApproveMutation.isPending || phase1RejectMutation.isPending}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Phase 2 → Funded Section ── */}
      <div className="rounded-xl overflow-hidden" style={{ background: '#0a0d14', border: '1px solid rgba(16,185,129,0.15)' }}>
        {/* Section header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: 'rgba(16,185,129,0.12)', background: 'rgba(16,185,129,0.04)' }}>
          <div className="flex items-center gap-2.5">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-bold text-emerald-400">Phase 2 → Simulation Funded Approvals</span>
          </div>
          {/* Filter tabs */}
          <div className="flex gap-1 flex-wrap">
            {FILTERS.map(f => {
              const cfg = STATUS_CONFIG[f.id] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.08)' };
              const active = statusFilter === f.id;
              return (
                <button key={f.id} onClick={() => setStatusFilter(f.id)}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                  style={{
                    background: active ? cfg.bg : 'transparent',
                    color: active ? cfg.color : 'rgba(255,255,255,0.3)',
                    border: `1px solid ${active ? cfg.color + '35' : 'transparent'}`,
                  }}>
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-white/20" /></div>
          ) : reviews.length === 0 ? (
            <div className="py-8 text-center">
              <CheckCircle className="w-8 h-8 text-emerald-500/20 mx-auto mb-2" />
              <p className="text-xs text-white/25 font-mono">No reviews in this queue</p>
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
      </div>
    </div>
  );
}