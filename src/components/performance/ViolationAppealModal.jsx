import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, Send, Shield } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';

const VIOLATION_TYPES = [
  { id: 'hft_detection', label: 'HFT Detection' },
  { id: 'arbitrage_detection', label: 'Arbitrage Detection' },
  { id: 'ip_kyc_conflict', label: 'IP / KYC Conflict' },
  { id: 'hedge_detection', label: 'Cross-Account Hedging' },
  { id: 'other', label: 'Other Violation' },
];

export default function ViolationAppealModal({ account, user, violationType, onClose }) {
  const [form, setForm] = useState({ violation_type: violationType || 'hft_detection', description: '' });
  const [submitted, setSubmitted] = useState(false);

  const submitMutation = useMutation({
    mutationFn: () => base44.entities.ViolationAppeal.create({
      user_email: user?.email || '',
      account_id: account?.account_id || account?.id || '',
      violation_type: form.violation_type,
      description: form.description,
      status: 'pending',
    }),
    onSuccess: () => setSubmitted(true),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)' }}>
      <motion.div initial={{ scale: 0.94, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="w-full max-w-lg rounded-2xl"
        style={{ background: '#0d0f16', border: '1px solid rgba(255,92,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="flex items-center gap-3 p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">Submit Violation Appeal</h3>
            <p className="text-[11px] font-mono text-white/30">Dispute a rule violation detection</p>
          </div>
          <button onClick={onClose} className="ml-auto text-white/30 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-3">✅</div>
            <div className="text-base font-black text-emerald-400 mb-2">Appeal Submitted</div>
            <div className="text-xs text-muted-foreground mb-5">Our compliance team will review your case within 24-72 hours.</div>
            <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)' }}>Close</button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-[11px] font-mono text-muted-foreground uppercase mb-2">Violation Type</label>
              <select value={form.violation_type} onChange={e => setForm(f => ({ ...f, violation_type: e.target.value }))}
                className="w-full rounded-xl px-4 py-2.5 text-sm text-foreground outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                {VIOLATION_TYPES.map(v => <option key={v.id} value={v.id} className="bg-[#0d0f16]">{v.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-muted-foreground uppercase mb-2">Explanation <span className="text-primary">*</span></label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Explain why this detection is incorrect. Provide context about your trading strategy, timing, and any relevant information..."
                rows={5} className="w-full rounded-xl px-4 py-3 text-sm text-foreground outline-none resize-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
            </div>

            <div className="rounded-xl p-4 text-xs text-muted-foreground"
              style={{ background: 'rgba(255,92,0,0.06)', border: '1px solid rgba(255,92,0,0.15)' }}>
              📋 <strong className="text-foreground">Note:</strong> Appeals are reviewed by our compliance team within 24-72 hours. Providing detailed evidence increases approval chances. Trading restrictions remain active during review.
            </div>

            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm text-muted-foreground transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}>Cancel</button>
              <button onClick={() => submitMutation.mutate()}
                disabled={!form.description.trim() || submitMutation.isPending}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)' }}>
                <Send className="w-4 h-4" /> {submitMutation.isPending ? 'Submitting...' : 'Submit Appeal'}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}