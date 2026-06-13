import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Plus, Clock, CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp, Info, Shield } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useChallengeAccounts, useKYC, useWithdrawals } from '@/hooks/useSupabaseQuery';
import { useSupabaseAuth } from '@/lib/SupabaseAuthContext';

const STATUS_CFG = {
  pending: { label: 'Pending Review', color: '#f59e0b', icon: Clock },
  approved: { label: 'Approved', color: '#60a5fa', icon: CheckCircle },
  processing: { label: 'Processing', color: '#FF5C00', icon: AlertCircle },
  paid: { label: 'Paid Successfully', color: '#10b981', icon: CheckCircle },
  rejected: { label: 'Rejected', color: '#ef4444', icon: XCircle },
};

const METHODS = [
  { id: 'usdt_trc20', label: 'USDT TRC20', icon: '₮' },
  { id: 'bitcoin', label: 'Bitcoin', icon: '₿' },
  { id: 'bank_wire', label: 'Bank Wire', icon: '🏦' },
];

// NOTE: All payout calculations are now backend-driven via requestTraderWithdrawal function.
// These constants are DISPLAY ONLY for the pre-submission breakdown preview.
// The backend is the source of truth.
const DISPLAY_PROFIT_SPLIT = 0.80;
const DISPLAY_WITHDRAWAL_FEE = 25;

function PayoutBreakdown({ amount, affiliateReward = 0 }) {
  const gross = parseFloat(amount) || 0;
  const traderShare = gross * DISPLAY_PROFIT_SPLIT;
  const companyShare = gross * 0.2;
  const finalAmount = traderShare - DISPLAY_WITHDRAWAL_FEE;

  const rows = [
    { label: 'Requested Amount', value: `$${gross.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: 'text-foreground', bold: false },
    { label: 'Company Share (20%)', value: `-$${companyShare.toFixed(2)}`, color: 'text-red-400', bold: false },
    { label: 'Your Share (80%)', value: `$${traderShare.toFixed(2)}`, color: 'text-emerald-400', bold: true },
    { label: 'Sponsor Affiliate Reward (~9%)', value: `-$${(traderShare * 0.09).toFixed(2)}`, color: 'text-yellow-400', bold: false },
    { label: 'Withdrawal Processing Fee', value: `-$${DISPLAY_WITHDRAWAL_FEE.toFixed(2)}`, color: 'text-muted-foreground', bold: false },
    { label: 'Est. Payout (preview only)', value: `$${Math.max(0, finalAmount - traderShare * 0.09).toFixed(2)}`, color: 'text-primary', bold: true, divider: true },
  ];

  return (
    <div className="rounded-xl overflow-hidden mt-4" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="px-4 py-2.5 text-[10px] font-mono text-muted-foreground uppercase tracking-widest"
        style={{ background: 'rgba(255,255,255,0.03)' }}>
        Payout Breakdown
      </div>
      {rows.map((row, i) => (
        <div key={i}>
          {row.divider && <div className="border-t border-white/10 mx-4 my-1" />}
          <div className="flex items-center justify-between px-4 py-2">
            <span className="text-xs text-muted-foreground">{row.label}</span>
            <span className={`text-xs font-mono ${row.bold ? 'font-black' : ''} ${row.color}`}>{row.value}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function WithdrawalCard({ w, i }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CFG[w.status] || STATUS_CFG.pending;
  const Icon = cfg.icon;

  const traderShare = (w.amount || 0) * (w.profit_split_pct / 100 || 0.8);
  const companyShare = (w.amount || 0) - traderShare;
  const affiliateReward = w.affiliate_reward || (traderShare * 0.09);
  const fee = w.withdrawal_fee || DISPLAY_WITHDRAWAL_FEE;
  const final = w.final_amount || Math.max(0, traderShare - affiliateReward - fee);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${cfg.color}25` }}>
      <div className="h-0.5" style={{ background: cfg.color, opacity: 0.6 }} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-base font-black text-foreground">${(w.amount || 0).toLocaleString()}</div>
            <div className="text-xs text-muted-foreground font-mono mt-0.5">
              {METHODS.find(m => m.id === w.method)?.label} • Account: {w.account_id} • {new Date(w.created_date).toLocaleDateString()}
            </div>
          </div>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
            <Icon className="w-3 h-3" /> {cfg.label}
          </span>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="text-xs font-bold text-emerald-400">${traderShare.toFixed(2)}</div>
            <div className="text-[9px] font-mono text-muted-foreground">Your 80%</div>
          </div>
          <div className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="text-xs font-bold text-yellow-400">-${affiliateReward.toFixed(2)}</div>
            <div className="text-[9px] font-mono text-muted-foreground">Affiliate</div>
          </div>
          <div className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="text-xs font-bold text-primary">${final.toFixed(2)}</div>
            <div className="text-[9px] font-mono text-muted-foreground">Final Payout</div>
          </div>
        </div>

        <button onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 mt-3 text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors">
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? 'Hide breakdown' : 'View full breakdown'}
        </button>

        {expanded && (
          <div className="mt-3 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
            {[
              { label: 'Gross Amount', val: `$${(w.amount||0).toLocaleString()}`, color: 'text-foreground' },
              { label: `Company Share (${100 - (w.profit_split_pct||80)}%)`, val: `-$${companyShare.toFixed(2)}`, color: 'text-red-400' },
              { label: `Trader Share (${w.profit_split_pct||80}%)`, val: `$${traderShare.toFixed(2)}`, color: 'text-emerald-400' },
              { label: 'Sponsor Reward (~9%)', val: `-$${affiliateReward.toFixed(2)}`, color: 'text-yellow-400' },
              { label: 'Processing Fee', val: `-$${fee.toFixed(2)}`, color: 'text-muted-foreground' },
              { label: 'Final Processed', val: `$${final.toFixed(2)}`, color: 'text-primary', bold: true },
            ].map((row, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2 border-b border-white/[0.04] last:border-0">
                <span className="text-[11px] text-muted-foreground">{row.label}</span>
                <span className={`text-[11px] font-mono ${row.bold ? 'font-black' : ''} ${row.color}`}>{row.val}</span>
              </div>
            ))}
          </div>
        )}

        {w.admin_notes && (
          <div className="mt-3 p-3 rounded-xl text-xs text-muted-foreground" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="text-foreground font-semibold">Note: </span>{w.admin_notes}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function Withdrawals({ user }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ amount: '', method: 'usdt_trc20', wallet_address: '', account_id: '' });
  const qc = useQueryClient();
  const { user: sbUser } = useSupabaseAuth();

  const { data: accounts = [] } = useChallengeAccounts();
  const fundedAccounts = accounts.filter(a => a.status === 'funded');
  const eligiblePnl = fundedAccounts.reduce((s, a) => s + Math.max(0, a.pnl || 0), 0);

  const { data: kyc } = useKYC();
  const kycApproved = kyc?.status === 'approved';

  const { data: withdrawals = [] } = useWithdrawals();

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const selectedAcc = fundedAccounts.find(a => a.account_id === data.account_id) || fundedAccounts[0];
      if (!selectedAcc) throw new Error('No funded account selected');
      // All validation and calculation is backend-driven
      const res = await base44.functions.invoke('requestTraderWithdrawal', {
        account_id: selectedAcc.account_id,
        amount: parseFloat(data.amount),
        method: data.method,
        wallet_address: data.wallet_address,
      });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['withdrawals'] });
      setShowForm(false);
      setForm({ amount: '', method: 'usdt_trc20', wallet_address: '' });
    },
  });

  // Display-only preview (backend recalculates on submission)
  const grossAmount = parseFloat(form.amount) || 0;
  const traderShare = grossAmount * DISPLAY_PROFIT_SPLIT;
  const affiliateReward = traderShare * 0.09;
  const finalAmount = Math.max(0, traderShare - affiliateReward - DISPLAY_WITHDRAWAL_FEE);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-primary" /> Withdrawals
          </h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">Profit payouts — Funded accounts only</p>
        </div>
        <button onClick={() => setShowForm(true)}
          disabled={!kycApproved || fundedAccounts.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)', boxShadow: '0 4px 20px rgba(255,92,0,0.3)' }}>
          <Plus className="w-4 h-4" /> Request Payout
        </button>
      </div>

      {/* KYC Gate */}
      {!kycApproved && (
        <div className="flex items-start gap-4 p-5 rounded-2xl mb-5"
          style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="text-sm font-bold text-yellow-400 mb-1">KYC Verification Required</div>
            <div className="text-xs text-muted-foreground">
              {!kyc || kyc.status === 'not_submitted'
                ? 'You must complete identity verification before requesting payouts. Go to KYC section to submit your documents.'
                : kyc.status === 'pending'
                ? 'Your KYC submission is under review (24-48 hours). You cannot request payouts until approved.'
                : 'Your KYC was rejected. Please resubmit your documents with the correct information.'}
            </div>
          </div>
        </div>
      )}

      {/* No funded accounts warning */}
      {fundedAccounts.length === 0 && (
        <div className="flex items-start gap-4 p-5 rounded-2xl mb-5"
          style={{ background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.2)' }}>
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-bold text-blue-400 mb-1">No Funded Accounts</div>
            <div className="text-xs text-muted-foreground">Withdrawals are only available for live funded accounts. Complete your challenge to unlock payouts.</div>
          </div>
        </div>
      )}

      {/* Per-account funded breakdown */}
      {fundedAccounts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          {fundedAccounts.map(acc => {
            const profit = Math.max(0, acc.pnl || 0);
            const traderShare = profit * 0.8;
            const firmShare = profit * 0.2;
            return (
              <div key={acc.id} className="rounded-2xl p-5"
                style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono text-muted-foreground">Account</span>
                  <span className="text-xs font-bold font-mono text-foreground">{acc.account_id}</span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono text-muted-foreground">Total Profit</span>
                  <span className="text-sm font-black text-emerald-400">${profit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(16,185,129,0.08)' }}>
                    <div className="text-xs font-bold text-emerald-400">${traderShare.toFixed(2)}</div>
                    <div className="text-[9px] font-mono text-muted-foreground">Your 80%</div>
                  </div>
                  <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="text-xs font-bold text-muted-foreground">${firmShare.toFixed(2)}</div>
                    <div className="text-[9px] font-mono text-muted-foreground">Firm 20%</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Profit split info banner */}
      <div className="rounded-2xl p-4 sm:p-5 mb-6"
        style={{ background: 'rgba(255,92,0,0.06)', border: '1px solid rgba(255,92,0,0.2)' }}>
        <div className="flex items-center justify-between mb-2 gap-4">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-primary flex-shrink-0" />
            <div className="text-sm font-bold text-foreground">80/20 Profit Split</div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-lg font-black text-emerald-400">${eligiblePnl.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <div className="text-[10px] font-mono text-muted-foreground">Available Profit</div>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">You keep <span className="text-emerald-400 font-bold">80%</span> of all profits. Robert Funds retains <span className="text-red-400 font-bold">20%</span>. A $25 processing fee and any applicable affiliate rewards are deducted from your 80% share before payout.</div>
      </div>

      {/* Withdrawal list */}
      <div className="space-y-4">
        {withdrawals.length === 0 && (
          <div className="text-center py-12 rounded-2xl" style={{ border: '1px dashed rgba(255,255,255,0.1)' }}>
            <DollarSign className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No withdrawal requests yet.</p>
          </div>
        )}
        {withdrawals.map((w, i) => <WithdrawalCard key={w.id} w={w} i={i} />)}
      </div>

      {/* Request form modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-md rounded-2xl max-h-[90vh] overflow-y-auto"
              style={{ background: '#0c0c0f', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center justify-between p-5 border-b border-white/5">
                <h2 className="text-lg font-black">Request Payout</h2>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground text-xl">×</button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-mono text-muted-foreground mb-1.5 block uppercase">Profit Amount (USD)</label>
                  <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="Enter gross profit amount"
                    className="w-full rounded-xl px-4 py-3 text-sm text-foreground outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>
                <div>
                  <label className="text-xs font-mono text-muted-foreground mb-2 block uppercase">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {METHODS.map(m => (
                      <button key={m.id} onClick={() => setForm(f => ({ ...f, method: m.id }))}
                        className="py-2.5 rounded-xl text-xs font-semibold transition-all"
                        style={{ background: form.method === m.id ? 'rgba(255,92,0,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${form.method === m.id ? 'rgba(255,92,0,0.5)' : 'rgba(255,255,255,0.08)'}`, color: form.method === m.id ? '#FF5C00' : '#666' }}>
                        {m.icon} {m.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-mono text-muted-foreground mb-1.5 block uppercase">Wallet / Bank Address</label>
                  <input value={form.wallet_address} onChange={e => setForm(f => ({ ...f, wallet_address: e.target.value }))}
                    placeholder="Your withdrawal address"
                    className="w-full rounded-xl px-4 py-3 text-sm text-foreground outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>

                {/* Live breakdown */}
                {grossAmount > 0 && (
                  <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="px-4 py-2 text-[10px] font-mono text-muted-foreground uppercase bg-white/[0.02]">Payout Breakdown</div>
                    {[
                      { label: 'Gross Profit', val: `$${grossAmount.toFixed(2)}`, color: 'text-foreground' },
                      { label: 'Company Share (20%)', val: `-$${(grossAmount * 0.2).toFixed(2)}`, color: 'text-red-400' },
                      { label: 'Your Share (80%)', val: `$${traderShare.toFixed(2)}`, color: 'text-emerald-400' },
                      { label: 'Sponsor Reward (~9%)', val: `-$${affiliateReward.toFixed(2)}`, color: 'text-yellow-400' },
                      { label: 'Processing Fee (est.)', val: `-$${DISPLAY_WITHDRAWAL_FEE.toFixed(2)}`, color: 'text-muted-foreground' },
                    ].map((row, i) => (
                      <div key={i} className="flex justify-between px-4 py-2 border-b border-white/[0.04]">
                        <span className="text-xs text-muted-foreground">{row.label}</span>
                        <span className={`text-xs font-mono ${row.color}`}>{row.val}</span>
                      </div>
                    ))}
                    <div className="flex justify-between px-4 py-2.5 border-t border-white/10"
                      style={{ background: 'rgba(255,92,0,0.06)' }}>
                      <span className="text-xs font-bold text-foreground">You Receive</span>
                      <span className="text-sm font-black text-primary">${finalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors"
                    style={{ border: '1px solid rgba(255,255,255,0.1)' }}>Cancel</button>
                  <button onClick={() => createMutation.mutate(form)}
                    disabled={!form.amount || !form.wallet_address || createMutation.isPending || finalAmount <= 0}
                    className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40"
                    style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)' }}>
                    {createMutation.isPending ? 'Submitting...' : 'Submit Request'}
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