import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Send, Clock, CheckCircle, XCircle, Eye, Plus, AlertTriangle, FileText } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const VIOLATION_TYPES = [
  { id: 'hft_detection', label: 'HFT Detection' },
  { id: 'arbitrage_detection', label: 'Arbitrage Detection' },
  { id: 'ip_kyc_conflict', label: 'IP / KYC Conflict' },
  { id: 'hedge_detection', label: 'Cross-Account Hedging' },
  { id: 'other', label: 'Other Violation' },
];

const STATUS_CONFIG = {
  pending: { label: 'Pending Review', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: Clock },
  under_review: { label: 'Under Review', color: '#6366f1', bg: 'rgba(99,102,241,0.1)', icon: Eye },
  approved: { label: 'Approved', color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: CheckCircle },
  rejected: { label: 'Rejected', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: XCircle },
};

export default function MyAppeals({ user, accounts = [] }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ violation_type: 'hft_detection', description: '', account_id: '' });
  const [submitted, setSubmitted] = useState(false);
  const qc = useQueryClient();

  const { data: myAppeals = [], isLoading } = useQuery({
    queryKey: ['my-appeals', user?.email],
    queryFn: () => base44.entities.ViolationAppeal.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  const submitMutation = useMutation({
    mutationFn: () => base44.entities.ViolationAppeal.create({
      user_email: user?.email || '',
      account_id: form.account_id || accounts[0]?.account_id || '',
      violation_type: form.violation_type,
      description: form.description,
      status: 'pending',
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-appeals'] });
      setSubmitted(true);
      setShowForm(false);
      setForm({ violation_type: 'hft_detection', description: '', account_id: '' });
      setTimeout(() => setSubmitted(false), 4000);
    },
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-black text-foreground flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" /> Violation Appeals
          </h2>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">Submit and track your rule violation disputes</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setSubmitted(false); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:scale-105"
          style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)', boxShadow: '0 4px 16px rgba(255,92,0,0.3)' }}>
          <Plus className="w-4 h-4" /> New Appeal
        </button>
      </div>

      {/* Success banner */}
      <AnimatePresence>
        {submitted && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-2xl p-4 mb-5 flex items-center gap-3"
            style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)' }}>
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="text-sm font-bold text-emerald-400">Appeal Submitted Successfully</div>
              <div className="text-xs text-muted-foreground">Our compliance team will review your case within 24-72 hours.</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Appeal Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-2xl p-5 mb-6"
            style={{ background: 'rgba(255,92,0,0.04)', border: '1px solid rgba(255,92,0,0.2)' }}>
            <h3 className="text-sm font-black text-foreground mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Submit New Appeal
            </h3>
            <div className="space-y-4">
              {/* Account selector */}
              {accounts.length > 0 && (
                <div>
                  <label className="block text-[11px] font-mono text-muted-foreground uppercase mb-1.5">Account</label>
                  <select value={form.account_id} onChange={e => setForm(f => ({ ...f, account_id: e.target.value }))}
                    className="w-full rounded-xl px-4 py-2.5 text-sm text-foreground outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <option value="" className="bg-[#0d0f16]">Select account...</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.account_id} className="bg-[#0d0f16]">
                        {a.account_id} - ${(a.account_size || 0).toLocaleString()} ({a.status})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Violation type */}
              <div>
                <label className="block text-[11px] font-mono text-muted-foreground uppercase mb-1.5">Violation Type</label>
                <select value={form.violation_type} onChange={e => setForm(f => ({ ...f, violation_type: e.target.value }))}
                  className="w-full rounded-xl px-4 py-2.5 text-sm text-foreground outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {VIOLATION_TYPES.map(v => <option key={v.id} value={v.id} className="bg-[#0d0f16]">{v.label}</option>)}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-mono text-muted-foreground uppercase mb-1.5">
                  Explanation <span className="text-primary">*</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Explain why this detection is incorrect. Provide context about your trading strategy, timing, and any relevant information..."
                  rows={5}
                  className="w-full rounded-xl px-4 py-3 text-sm text-foreground outline-none resize-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>

              {/* Policy note */}
              <div className="rounded-xl p-3 text-xs text-muted-foreground"
                style={{ background: 'rgba(255,92,0,0.06)', border: '1px solid rgba(255,92,0,0.15)' }}>
                📋 <strong className="text-foreground">Note:</strong> Appeals are reviewed within 24-72 hours. Trading restrictions remain active during review. Providing detailed evidence increases approval chances.
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm text-muted-foreground transition-colors hover:text-foreground"
                  style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                  Cancel
                </button>
                <button
                  onClick={() => submitMutation.mutate()}
                  disabled={!form.description.trim() || submitMutation.isPending}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)' }}>
                  <Send className="w-4 h-4" />
                  {submitMutation.isPending ? 'Submitting...' : 'Submit Appeal'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Past Appeals */}
      <div>
        <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">
          Your Appeal History ({myAppeals.length})
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : myAppeals.length === 0 ? (
          <div className="rounded-2xl p-10 text-center"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.08)' }}>
            <Shield className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
            <div className="text-sm font-bold text-muted-foreground mb-1">No Appeals Submitted</div>
            <div className="text-xs text-muted-foreground/60">If you believe a violation was incorrectly flagged, submit an appeal above.</div>
          </div>
        ) : (
          <div className="space-y-3">
            {[...myAppeals].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).map((appeal, i) => {
              const cfg = STATUS_CONFIG[appeal.status] || STATUS_CONFIG.pending;
              const StatusIcon = cfg.icon;
              return (
                <motion.div key={appeal.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="rounded-2xl p-4"
                  style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${cfg.color}22` }}>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-bold text-foreground">
                          {VIOLATION_TYPES.find(v => v.id === appeal.violation_type)?.label || appeal.violation_type}
                        </span>
                        {appeal.account_id && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            {appeal.account_id}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{appeal.description}</p>
                      <div className="text-[10px] font-mono text-muted-foreground/50">
                        Submitted {new Date(appeal.created_date).toLocaleDateString()}
                      </div>
                    </div>
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold flex-shrink-0"
                      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
                      <StatusIcon className="w-3 h-3" /> {cfg.label}
                    </span>
                  </div>

                  {/* Admin notes if reviewed */}
                  {appeal.admin_notes && (
                    <div className="mt-3 rounded-xl p-3 text-xs"
                      style={{ background: `${cfg.color}08`, border: `1px solid ${cfg.color}20` }}>
                      <span className="font-bold" style={{ color: cfg.color }}>Admin Response: </span>
                      <span className="text-muted-foreground">{appeal.admin_notes}</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}