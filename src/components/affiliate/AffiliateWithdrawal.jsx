import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Wallet, Clock, CheckCircle, XCircle, Send, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const METHODS = [
  { id: 'usdt_trc20', label: 'USDT TRC-20', icon: '💎', fee: 0 },
  { id: 'bitcoin', label: 'Bitcoin', icon: '₿', fee: 0 },
  { id: 'bank_wire', label: 'Bank Wire', icon: '🏦', fee: 25 },
];

const STATUS_CONFIG = {
  pending: { color: '#f59e0b', icon: Clock, label: 'Pending' },
  approved: { color: '#60a5fa', icon: CheckCircle, label: 'Approved' },
  processing: { color: '#a78bfa', icon: Send, label: 'Processing' },
  paid: { color: '#10b981', icon: CheckCircle, label: 'Paid' },
  rejected: { color: '#ef4444', icon: XCircle, label: 'Rejected' },
};

export default function AffiliateWithdrawal({ profile, commissions = [], withdrawals = [] }) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('usdt_trc20');
  const [wallet, setWallet] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const qc = useQueryClient();

  // Display-only: approved balance for UI rendering
  const available = commissions.filter(c => c.status === 'approved').reduce((s, c) => s + (c.commission_amount || 0), 0);
  const [submitError, setSubmitError] = useState('');

  const submitMutation = useMutation({
    mutationFn: async () => {
      setSubmitError('');
      // All validation is backend-secured via requestAffiliateWithdrawal function
      const res = await base44.functions.invoke('requestAffiliateWithdrawal', {
        amount: parseFloat(amount),
        method,
        wallet_address: wallet,
      });
      if (res.data?.error) throw new Error(res.data.error);
      return res.data;
    },
    onSuccess: () => { setSubmitted(true); qc.invalidateQueries(['affiliate-withdrawals']); },
    onError: (err) => setSubmitError(err.message),
  });

  const MIN_WITHDRAWAL = 50; // display only — backend enforces from settings
  const canSubmit = parseFloat(amount) >= MIN_WITHDRAWAL && parseFloat(amount) <= available && wallet.trim();

  return (
    <div className="space-y-6">
      {/* Balance */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl p-5" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}>
          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">Available to Withdraw</div>
          <div className="text-3xl font-black text-emerald-400">${available.toFixed(2)}</div>
          <div className="text-[10px] font-mono text-muted-foreground mt-1">Approved commissions only</div>
        </div>
        <div className="rounded-2xl p-5" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">Pending Approval</div>
          <div className="text-3xl font-black text-amber-400">
            ${commissions.filter(c => c.status === 'pending').reduce((s, c) => s + (c.commission_amount || 0), 0).toFixed(2)}
          </div>
          <div className="text-[10px] font-mono text-muted-foreground mt-1">Awaiting admin review</div>
        </div>
      </div>

      {/* Withdrawal form */}
      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-2 mb-5">
              <Wallet className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold">Request Withdrawal</span>
            </div>

            {available < MIN_WITHDRAWAL && (
              <div className="flex items-center gap-3 p-4 rounded-xl mb-5"
                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}>
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span className="text-xs text-amber-400">Minimum withdrawal is ${MIN_WITHDRAWAL}. You need ${(MIN_WITHDRAWAL - available).toFixed(2)} more in approved commissions.</span>
              </div>
            )}

            {/* Amount */}
            <div className="mb-4">
              <label className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">Amount (USD)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={amount} onChange={e => setAmount(e.target.value)} type="number" min={MIN_WITHDRAWAL} max={available}
                  placeholder={`Min $${MIN_WITHDRAWAL}`}
                  className="w-full pl-9 pr-4 py-3 rounded-xl text-sm font-mono text-foreground outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }} />
              </div>
            </div>

            {/* Method */}
            <div className="mb-4">
              <label className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                {METHODS.map(m => (
                  <button key={m.id} onClick={() => setMethod(m.id)}
                    className="rounded-xl p-3 text-center transition-all"
                    style={{
                      background: method === m.id ? 'rgba(255,92,0,0.12)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${method === m.id ? 'rgba(255,92,0,0.4)' : 'rgba(255,255,255,0.08)'}`,
                    }}>
                    <div className="text-lg mb-1">{m.icon}</div>
                    <div className="text-xs font-bold" style={{ color: method === m.id ? '#FF5C00' : 'hsl(var(--foreground))' }}>{m.label}</div>
                    <div className="text-[10px] font-mono text-muted-foreground">{m.fee ? `$${m.fee} fee` : 'No fee'}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Wallet */}
            <div className="mb-5">
              <label className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest block mb-2">Wallet / Bank Details</label>
              <input value={wallet} onChange={e => setWallet(e.target.value)}
                placeholder={method === 'bank_wire' ? 'IBAN / Account Number' : 'Wallet address'}
                className="w-full px-4 py-3 rounded-xl text-sm font-mono text-foreground outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }} />
            </div>

            {submitError && (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{submitError}</div>
            )}
            <button onClick={() => submitMutation.mutate()} disabled={!canSubmit || submitMutation.isPending}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
              style={{ background: canSubmit ? 'linear-gradient(90deg,#FF5C00,#cc4900)' : 'rgba(255,255,255,0.06)', boxShadow: canSubmit ? '0 4px 20px rgba(255,92,0,0.3)' : 'none' }}>
              {submitMutation.isPending ? 'Submitting...' : 'Request Withdrawal'}
            </button>
          </motion.div>
        ) : (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl p-10 text-center"
            style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)' }}>
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <div className="text-lg font-black text-foreground mb-2">Withdrawal Requested</div>
            <div className="text-sm text-muted-foreground">Your withdrawal request is under review. You'll be notified once processed.</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Withdrawal history */}
      {withdrawals.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="px-5 py-3 border-b border-white/5 text-xs font-bold"
            style={{ background: 'rgba(255,255,255,0.03)' }}>Withdrawal History</div>
          {withdrawals.map((w, i) => {
            const st = STATUS_CONFIG[w.status] || STATUS_CONFIG.pending;
            const Icon = st.icon;
            return (
              <div key={w.id || i} className="flex items-center gap-4 px-5 py-3.5 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                <Icon className="w-4 h-4 flex-shrink-0" style={{ color: st.color }} />
                <div className="flex-1">
                  <div className="text-xs font-semibold">{w.method?.replace('_', ' ').toUpperCase()}</div>
                  <div className="text-[10px] font-mono text-muted-foreground">{new Date(w.created_date).toLocaleDateString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-foreground">${(w.amount || 0).toFixed(2)}</div>
                  <div className="text-[10px] font-mono" style={{ color: st.color }}>{st.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}