import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Wallet, Clock, CheckCircle2, XCircle, Send, AlertTriangle, ArrowUpRight, ExternalLink } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';

const ACCENT = '#FF5C00';
const FEE_PCT = 0.05;

const METHODS = [
  { id: 'usdt_trc20', label: 'USDT TRC-20', icon: '💎', fee: 0 },
  { id: 'bitcoin', label: 'Bitcoin', icon: '₿', fee: 0 },
  { id: 'bank_wire', label: 'Bank Wire', icon: '🏦', fee: 25 },
];

const STATUS_CONFIG = {
  pending: { color: '#f59e0b', icon: Clock, label: 'Pending' },
  approved: { color: '#6366f1', icon: CheckCircle2, label: 'Approved' },
  processing: { color: '#a78bfa', icon: Send, label: 'Processing' },
  paid: { color: '#10b981', icon: CheckCircle2, label: 'Paid' },
  rejected: { color: '#ef4444', icon: XCircle, label: 'Rejected' },
};

export default function AffiliateWithdrawal({ profile, commissions = [], withdrawals = [], user }) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('usdt_trc20');
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const qc = useQueryClient();

  // Fetch current user to get saved wallet address
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      try { return await base44.auth.me(); } catch { return null; }
    },
    enabled: !user,
  });
  const currentUserData = user || currentUser;

  const savedWalletAddress = currentUserData?.payout_wallet_address || currentUserData?.usdt_trc20 || currentUserData?.bitcoin || '';

  const available = commissions.filter(c => c.status === 'approved').reduce((s, c) => s + (c.commission_amount || 0), 0);
  const pendingTotal = commissions.filter(c => c.status === 'pending').reduce((s, c) => s + (c.commission_amount || 0), 0);
  const MIN_WITHDRAWAL = 50;
  const FEE_PCT = 0.05;
  const fee = amount ? parseFloat((parseFloat(amount) * FEE_PCT).toFixed(2)) : 0;
  const youReceive = amount ? parseFloat((parseFloat(amount) - fee).toFixed(2)) : 0;
  const canSubmit = parseFloat(amount) >= MIN_WITHDRAWAL && parseFloat(amount) <= available && savedWalletAddress;

  const submitMutation = useMutation({
    mutationFn: async () => {
      setSubmitError('');
      const res = await base44.functions.invoke('requestAffiliateWithdrawal', {
        amount: parseFloat(amount), method, wallet_address: savedWalletAddress,
      });
      if (res.data?.error) throw new Error(res.data.error);
      return res.data;
    },
    onSuccess: () => { setSubmitted(true); qc.invalidateQueries({ queryKey: ['affiliate-withdrawals'] }); },
    onError: (err) => setSubmitError(err.message),
  });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl overflow-hidden" style={{ background: '#1a1d25', border: '1px solid rgba(16,185,129,0.15)' }}>
          <div className="px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <Wallet className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="text-[10px] font-mono text-white/25 uppercase tracking-widest">Available</div>
                <div className="text-2xl font-black text-emerald-400">${available.toFixed(2)}</div>
              </div>
            </div>
            <div className="text-[10px] text-white/20">Approved commissions ready for withdrawal</div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="rounded-2xl overflow-hidden" style={{ background: '#1a1d25', border: '1px solid rgba(245,158,11,0.15)' }}>
          <div className="px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <div className="text-[10px] font-mono text-white/25 uppercase tracking-widest">Pending</div>
                <div className="text-2xl font-black text-amber-400">${pendingTotal.toFixed(2)}</div>
              </div>
            </div>
            <div className="text-[10px] text-white/20">Commissions awaiting admin approval - not yet withdrawable</div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="rounded-2xl overflow-hidden" style={{ background: '#1a1d25', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="px-5 py-4 border-b border-white/[0.05]" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4" style={{ color: ACCENT }} />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Request Withdrawal</span>
              </div>
            </div>
            <div className="p-5 space-y-5">
              {/* Pending commissions info - most common reason withdrawals are blocked */}
              {pendingTotal > 0 && available < MIN_WITHDRAWAL && (
                <div className="flex items-start gap-3 p-4 rounded-xl"
                  style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)' }}>
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-amber-400">Your commissions are awaiting admin approval</div>
                    <div className="text-[11px] text-white/50 leading-relaxed">
                      You have <span className="text-amber-400 font-bold">${pendingTotal.toFixed(2)}</span> in commissions pending admin review.
                      Once approved, they will appear as "Available" and you can withdraw them.
                    </div>
                    <div className="text-[10px] text-white/30 mt-1">
                      💡 Commissions are typically reviewed within 1-3 business days after the referred trader's purchase is verified.
                    </div>
                  </div>
                </div>
              )}
              {available > 0 && available < MIN_WITHDRAWAL && (
                <div className="flex items-start gap-3 p-4 rounded-xl"
                  style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-amber-400 mb-0.5">Minimum withdrawal not met</div>
                    <div className="text-[11px] text-white/30">You have ${available.toFixed(2)} approved - need ${(MIN_WITHDRAWAL - available).toFixed(2)} more to reach the $${MIN_WITHDRAWAL} minimum.</div>
                  </div>
                </div>
              )}
              {available === 0 && pendingTotal === 0 && (
                <div className="flex items-start gap-3 p-4 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <AlertTriangle className="w-4 h-4 text-white/30 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-white/50 mb-0.5">No commissions available</div>
                    <div className="text-[11px] text-white/25">Refer traders to earn commissions. Minimum withdrawal is ${MIN_WITHDRAWAL}.</div>
                  </div>
                </div>
              )}
              <div>
                <label className="text-[10px] font-mono text-white/25 uppercase tracking-widest block mb-2">Amount (USD)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input value={amount} onChange={e => setAmount(e.target.value)} type="number" min={MIN_WITHDRAWAL} max={available}
                    placeholder={`Min $${MIN_WITHDRAWAL}`}
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm font-mono text-white outline-none placeholder:text-white/15"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-mono text-white/25 uppercase tracking-widest block mb-2">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {METHODS.map(m => (
                    <button key={m.id} onClick={() => setMethod(m.id)} className="rounded-xl p-3 text-center transition-all"
                      style={{ background: method === m.id ? `${ACCENT}10` : 'rgba(255,255,255,0.03)', border: `1px solid ${method === m.id ? `${ACCENT}35` : 'rgba(255,255,255,0.07)'}` }}>
                      <div className="text-lg mb-1">{m.icon}</div>
                      <div className="text-xs font-bold" style={{ color: method === m.id ? ACCENT : '#999' }}>{m.label}</div>
                      <div className="text-[9px] font-mono text-white/20">{m.fee ? `$${m.fee} fee` : 'No fee'}</div>
                    </button>
                  ))}
                </div>
              </div>
              {/* Wallet address from settings */}
              <div>
                <label className="text-[10px] font-mono text-white/25 uppercase tracking-widest block mb-2">Payout Wallet Address</label>
                {savedWalletAddress ? (
                  <div className="w-full rounded-xl px-4 py-3 text-sm font-mono break-all"
                    style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.25)', color: '#94a3b8' }}>
                    {savedWalletAddress}
                    <div className="text-[10px] text-emerald-400 mt-1">✓ From your saved payout wallet settings</div>
                  </div>
                ) : (
                  <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)' }}>
                    <Wallet className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
                    <p className="text-xs text-yellow-400 font-semibold mb-1">No wallet address saved</p>
                    <p className="text-[11px] text-muted-foreground mb-3">Go to Settings → Payout Wallets to save your primary wallet address.</p>
                  </div>
                )}
              </div>
              {/* Payout breakdown */}
              {parseFloat(amount) > 0 && (
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="px-4 py-2 text-[10px] font-mono text-muted-foreground uppercase bg-white/[0.02]">Payout Breakdown</div>
                  {[
                    { label: 'Withdrawal Amount', val: `$${parseFloat(amount).toFixed(2)}`, color: 'text-foreground' },
                    { label: 'Processing Fee (5%)', val: `-$${fee.toFixed(2)}`, color: 'text-yellow-400' },
                  ].map((row, i) => (
                    <div key={i} className="flex justify-between px-4 py-2 border-b border-white/[0.04]">
                      <span className="text-xs text-muted-foreground">{row.label}</span>
                      <span className={`text-xs font-mono ${row.color}`}>{row.val}</span>
                    </div>
                  ))}
                  <div className="flex justify-between px-4 py-2.5 border-t border-white/10"
                    style={{ background: 'rgba(255,92,0,0.06)' }}>
                    <span className="text-xs font-bold text-foreground">You Receive</span>
                    <span className="text-sm font-black text-primary">${youReceive.toFixed(2)}</span>
                  </div>
                </div>
              )}
              {submitError && (
                <div className="text-xs text-red-400 px-4 py-2.5 rounded-xl" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>{submitError}</div>
              )}
              <button onClick={() => submitMutation.mutate()} disabled={!canSubmit || submitMutation.isPending}
                className="w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
                style={{ background: canSubmit ? `linear-gradient(135deg, ${ACCENT}, #cc4900)` : 'rgba(255,255,255,0.05)', color: canSubmit ? '#fff' : '#555', border: canSubmit ? 'none' : '1px solid rgba(255,255,255,0.08)', boxShadow: canSubmit ? `0 4px 20px ${ACCENT}30` : 'none' }}>
                {submitMutation.isPending ? 'Submitting...' : 'Request Withdrawal'}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl p-10 text-center"
            style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <div className="text-base font-black text-white mb-1">Withdrawal Requested</div>
            <div className="text-xs text-white/30">Your request is under review. You'll be notified once processed.</div>
          </motion.div>
        )}
      </AnimatePresence>

      {withdrawals.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: '#1a1d25', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="px-5 py-4 border-b border-white/[0.05]" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <span className="text-xs font-bold text-white uppercase tracking-wider">Withdrawal History</span>
          </div>
          {withdrawals.map((w, i) => {
            const st = STATUS_CONFIG[w.status] || STATUS_CONFIG.pending;
            const Icon = st.icon;
            return (
              <div key={w.id || i} className="flex items-center gap-4 px-5 py-3.5 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.01] transition-colors">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${st.color}10`, border: `1px solid ${st.color}20` }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: st.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white truncate">{w.method?.replace(/_/g, ' ').toUpperCase()}</div>
                  <div className="text-[10px] font-mono text-white/20">{new Date(w.created_date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-black text-white">${(w.amount || 0).toFixed(2)}</div>
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