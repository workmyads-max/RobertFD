import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Wallet, Clock, CheckCircle2, XCircle, Send, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const ORANGE = '#FF5C00';
const CARD = '#15171e';
const BORDER = 'rgba(255,255,255,0.07)';

const METHODS = [
  { id: 'usdt_trc20', label: 'USDT TRC-20', icon: '💎', fee: 0 },
  { id: 'bitcoin', label: 'Bitcoin', icon: '₿', fee: 0 },
  { id: 'bank_wire', label: 'Bank Wire', icon: '🏦', fee: 25 },
];

const STATUS_MAP = {
  pending: { color: '#f59e0b', icon: Clock, label: 'Pending' },
  approved: { color: '#818cf8', icon: CheckCircle2, label: 'Approved' },
  processing: { color: '#c084fc', icon: Send, label: 'Processing' },
  paid: { color: '#10b981', icon: CheckCircle2, label: 'Paid' },
  rejected: { color: '#ef4444', icon: XCircle, label: 'Rejected' },
};

export default function AffiliateWithdrawal({ profile, commissions = [], withdrawals = [] }) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('usdt_trc20');
  const [wallet, setWallet] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const qc = useQueryClient();

  const available = commissions.filter(c => c.status === 'approved').reduce((s, c) => s + (c.commission_amount || 0), 0);
  const pendingTotal = commissions.filter(c => c.status === 'pending').reduce((s, c) => s + (c.commission_amount || 0), 0);
  const MIN = 50;
  const canSubmit = parseFloat(amount) >= MIN && parseFloat(amount) <= available && wallet.trim();

  const submitMutation = useMutation({
    mutationFn: async () => {
      setSubmitError('');
      const res = await base44.functions.invoke('requestAffiliateWithdrawal', {
        amount: parseFloat(amount), method, wallet_address: wallet,
      });
      if (res.data?.error) throw new Error(res.data.error);
      return res.data;
    },
    onSuccess: () => { setSubmitted(true); qc.invalidateQueries({ queryKey: ['affiliate-withdrawals'] }); },
    onError: (err) => setSubmitError(err.message),
  });

  return (
    <div className="space-y-4">
      {/* Balance Cards */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5" style={{ background: CARD, border: '1px solid rgba(16,185,129,0.12)' }}>
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.18)' }}>
              <Wallet className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="text-[9px] font-mono uppercase tracking-[0.12em] text-white/20">Available</div>
              <div className="text-xl font-black text-emerald-400">${available.toFixed(2)}</div>
            </div>
          </div>
          <div className="text-[9px] text-white/18">Approved commissions ready for withdrawal</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }}
          className="rounded-2xl p-5" style={{ background: CARD, border: '1px solid rgba(245,158,11,0.12)' }}>
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.18)' }}>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="text-[9px] font-mono uppercase tracking-[0.12em] text-white/20">Pending</div>
              <div className="text-xl font-black text-amber-400">${pendingTotal.toFixed(2)}</div>
            </div>
          </div>
          <div className="text-[9px] text-white/18">Awaiting admin approval</div>
        </motion.div>
      </div>

      {/* Withdrawal Form */}
      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="rounded-2xl" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <div className="px-5 py-3.5 border-b border-white/[0.04]" style={{ background: 'rgba(255,255,255,0.015)' }}>
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-3.5 h-3.5" style={{ color: ORANGE }} />
                <span className="text-[11px] font-bold text-white uppercase tracking-[0.08em]">Request Withdrawal</span>
              </div>
            </div>
            <div className="p-5 space-y-4">
              {available < MIN && (
                <div className="flex items-start gap-3 p-3.5 rounded-xl"
                  style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.16)' }}>
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[11px] font-bold text-amber-400 mb-0.5">Minimum withdrawal not met</div>
                    <div className="text-[10px] text-white/25">You need ${(MIN - available).toFixed(2)} more. Minimum is ${MIN}.</div>
                  </div>
                </div>
              )}

              <div>
                <label className="text-[9px] font-mono uppercase tracking-[0.12em] text-white/20 block mb-2">Amount (USD)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/15" />
                  <input value={amount} onChange={e => setAmount(e.target.value)} type="number" min={MIN} max={available}
                    placeholder={`Min $${MIN}`}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm font-mono text-white outline-none placeholder:text-white/10"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }} />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-mono uppercase tracking-[0.12em] text-white/20 block mb-2">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {METHODS.map(m => (
                    <button key={m.id} onClick={() => setMethod(m.id)}
                      className="rounded-xl p-3 text-center transition-all"
                      style={{
                        background: method === m.id ? `${ORANGE}10` : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${method === m.id ? `${ORANGE}30` : 'rgba(255,255,255,0.06)'}`,
                      }}>
                      <div className="text-base mb-1">{m.icon}</div>
                      <div className="text-[10px] font-bold" style={{ color: method === m.id ? ORANGE : 'rgba(255,255,255,0.45)' }}>{m.label}</div>
                      <div className="text-[8px] font-mono text-white/15 mt-0.5">{m.fee ? `$${m.fee} fee` : 'No fee'}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[9px] font-mono uppercase tracking-[0.12em] text-white/20 block mb-2">Wallet / Bank Details</label>
                <input value={wallet} onChange={e => setWallet(e.target.value)}
                  placeholder={method === 'bank_wire' ? 'IBAN / Account Number' : 'Wallet address'}
                  className="w-full px-4 py-2.5 rounded-xl text-sm font-mono text-white outline-none placeholder:text-white/10"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }} />
              </div>

              {submitError && (
                <div className="text-[11px] text-red-400 px-3.5 py-2.5 rounded-xl" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>{submitError}</div>
              )}

              <button onClick={() => submitMutation.mutate()} disabled={!canSubmit || submitMutation.isPending}
                className="w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-30"
                style={{
                  background: canSubmit ? ORANGE : 'rgba(255,255,255,0.04)',
                  color: canSubmit ? '#fff' : 'rgba(255,255,255,0.3)',
                  border: canSubmit ? 'none' : '1px solid rgba(255,255,255,0.06)',
                  boxShadow: canSubmit ? `0 4px 16px ${ORANGE}25` : 'none',
                }}>
                {submitMutation.isPending ? 'Submitting...' : 'Request Withdrawal'}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl p-10 text-center"
            style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.16)' }}>
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <div className="text-sm font-black text-white mb-1">Withdrawal Requested</div>
            <div className="text-[11px] text-white/25">Your request is under review. You'll be notified once processed.</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      {withdrawals.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <div className="px-5 py-3.5 border-b border-white/[0.04]" style={{ background: 'rgba(255,255,255,0.015)' }}>
            <span className="text-[11px] font-bold text-white uppercase tracking-[0.08em]">Withdrawal History</span>
          </div>
          {withdrawals.map((w, i) => {
            const st = STATUS_MAP[w.status] || STATUS_MAP.pending;
            const Icon = st.icon;
            return (
              <div key={w.id || i} className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.025] last:border-0 hover:bg-white/[0.008] transition-colors">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${st.color}0d`, border: `1px solid ${st.color}18` }}>
                  <Icon className="w-3 h-3" style={{ color: st.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold text-white truncate">{w.method?.replace(/_/g, ' ').toUpperCase()}</div>
                  <div className="text-[9px] font-mono text-white/15">{new Date(w.created_date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-black text-white">${(w.amount || 0).toFixed(2)}</div>
                  <div className="text-[9px] font-mono" style={{ color: st.color }}>{st.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}