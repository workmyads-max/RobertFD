import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Plus, Clock, CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp, Info, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const ACCENT = '#CCFF00';

const STATUS_CFG = {
  pending: { label: 'Pending Review', color: '#f59e0b', icon: Clock },
  approved: { label: 'Approved', color: '#60a5fa', icon: CheckCircle },
  processing: { label: 'Processing', color: ACCENT, icon: AlertCircle },
  paid: { label: 'Paid Successfully', color: '#10b981', icon: CheckCircle },
  rejected: { label: 'Rejected', color: '#ef4444', icon: XCircle },
};

const METHODS = [
  { id: 'usdt_trc20', label: 'USDT TRC20', icon: '₮' },
  { id: 'bitcoin', label: 'Bitcoin', icon: '₿' },
  { id: 'bank_wire', label: 'Bank Wire', icon: '🏦' },
];

const DISPLAY_PROFIT_SPLIT = 0.80;
const DISPLAY_WITHDRAWAL_FEE = 25;

// ── 3D Icons ────────────────────────────────────────────────────────────────
function VaultIcon({ size = 52 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <rect x="8" y="20" width="48" height="36" rx="6" fill="#FF5C00" opacity="0.85" />
      <rect x="8" y="20" width="48" height="36" rx="6" fill="none" stroke="#FF7A2F" strokeWidth="1.5" />
      <rect x="12" y="24" width="40" height="28" rx="4" fill="#1a1a1a" opacity="0.3" />
      <circle cx="32" cy="38" r="10" fill="#1a1a1a" stroke="#FF5C00" strokeWidth="2" />
      <circle cx="32" cy="38" r="3" fill="#FF5C00" />
    </svg>
  );
}
function MoneyBagIcon({ size = 52 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <ellipse cx="32" cy="44" rx="4" ry="2" fill="#10b981" opacity="0.3" />
      <path d="M18 28C18 28, 20 14, 32 14C44 14, 46 28, 46 28L48 48C48 48, 46 52, 32 52C18 52, 16 48, 16 48Z" fill="#10b981" opacity="0.85" stroke="#34d399" strokeWidth="1.5" />
      <text x="32" y="40" textAnchor="middle" fontSize="10" fontWeight="900" fill="#1a1a1a">$</text>
    </svg>
  );
}
function HourglassIcon({ size = 52 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <ellipse cx="32" cy="44" rx="4" ry="2" fill="#60a5fa" opacity="0.3" />
      <path d="M20 12L20 24C20 24, 22 32, 32 32C42 32, 44 24, 44 24L44 12Z" fill="#60a5fa" opacity="0.85" stroke="#93c5fd" strokeWidth="1.5" />
      <path d="M20 52L20 40C20 40, 22 32, 32 32C42 32, 44 40, 44 40L44 52Z" fill="#60a5fa" opacity="0.85" stroke="#93c5fd" strokeWidth="1.5" />
      <rect x="18" y="9" width="28" height="5" rx="2" fill="#60a5fa" />
      <rect x="18" y="50" width="28" height="5" rx="2" fill="#60a5fa" />
    </svg>
  );
}

function PerfCard({ label, value, sub, IconComponent, highlight, accentColor }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ ease: [0.22, 1, 0.36, 1] }}
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: highlight ? (accentColor || ACCENT) : '#1a1a1a',
        border: highlight ? 'none' : '1px solid rgba(255,255,255,0.06)',
        padding: '20px', minHeight: '140px',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      }}>
      <div>
        <div className="text-xs font-semibold mb-1" style={{ color: highlight ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.4)' }}>{label}</div>
        <div className="text-3xl font-black" style={{ color: highlight ? '#000' : '#fff' }}>{value}</div>
        {sub && <div className="text-xs mt-1" style={{ color: highlight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.25)' }}>{sub}</div>}
      </div>
      {IconComponent && <div className="absolute bottom-3 right-3 opacity-80"><IconComponent size={52} /></div>}
    </motion.div>
  );
}

function WithdrawalCard({ w, i }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CFG[w.status] || STATUS_CFG.pending;
  const Icon = cfg.icon;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: '#121212', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="h-0.5" style={{ background: cfg.color, opacity: 0.6 }} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-base font-black text-white">${(w.amount || 0).toLocaleString()}</div>
            <div className="text-xs text-white/30 font-mono mt-0.5">
              {METHODS.find(m => m.id === w.method)?.label} • Account: {w.account_id} • {new Date(w.created_date).toLocaleDateString()}
            </div>
          </div>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
            <Icon className="w-3 h-3" /> {cfg.label}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="text-xs font-bold text-emerald-400">${((w.amount || 0) * 0.8).toFixed(2)}</div>
            <div className="text-[9px] font-mono text-white/30">Your 80%</div>
          </div>
          <div className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="text-xs font-bold text-yellow-400">-${(w.affiliate_reward || 0).toFixed(2)}</div>
            <div className="text-[9px] font-mono text-white/30">Affiliate</div>
          </div>
          <div className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="text-xs font-bold" style={{ color: ACCENT }}>${(w.final_amount || 0).toFixed(2)}</div>
            <div className="text-[9px] font-mono text-white/30">Final Payout</div>
          </div>
        </div>

        <button onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 mt-3 text-[10px] text-white/30 hover:text-white/60 transition-colors">
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? 'Hide breakdown' : 'View full breakdown'}
        </button>

        {expanded && (
          <div className="mt-3 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
            {[
              { label: 'Gross Amount', val: `$${(w.amount || 0).toLocaleString()}`, color: '#f1f5f9' },
              { label: 'Company Share (20%)', val: `-$${((w.amount || 0) * 0.2).toFixed(2)}`, color: '#ef4444' },
              { label: 'Trader Share (80%)', val: `$${((w.amount || 0) * 0.8).toFixed(2)}`, color: '#10b981' },
              { label: 'Sponsor Reward', val: `-$${(w.affiliate_reward || 0).toFixed(2)}`, color: '#f59e0b' },
              { label: 'Processing Fee', val: `-$${(w.withdrawal_fee || 25).toFixed(2)}`, color: '#94a3b8' },
              { label: 'Final Processed', val: `$${(w.final_amount || 0).toFixed(2)}`, color: ACCENT, bold: true },
            ].map((row, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2 border-b border-white/[0.04] last:border-0">
                <span className="text-[11px] text-white/40">{row.label}</span>
                <span className={`text-[11px] font-mono ${row.bold ? 'font-black' : ''}`} style={{ color: row.color }}>{row.val}</span>
              </div>
            ))}
          </div>
        )}

        {w.admin_notes && (
          <div className="mt-3 p-3 rounded-xl text-xs text-white/40" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="text-white/70 font-semibold">Note: </span>{w.admin_notes}
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

  const { data: accounts = [] } = useQuery({
    queryKey: ['challenge-accounts', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.ChallengeAccount.filter({ user_email: user.email }, '-created_date', 50);
    },
    enabled: !!user?.email,
  });

  const fundedAccounts = accounts.filter(a => a.status === 'funded');
  const eligiblePnl = fundedAccounts.reduce((s, a) => s + Math.max(0, a.pnl || 0), 0);

  const { data: kycList = [] } = useQuery({
    queryKey: ['kyc', user?.email],
    queryFn: () => base44.entities.KYCVerification.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });
  const kyc = (kycList || [])[0] || null;
  const kycApproved = kyc?.status === 'approved';

  const { data: withdrawals = [] } = useQuery({
    queryKey: ['withdrawals', user?.email],
    queryFn: () => base44.entities.WithdrawalRequest.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  const totalWithdrawn = withdrawals.filter(w => w.status === 'paid').reduce((s, w) => s + (w.final_amount || 0), 0);
  const pendingAmount = withdrawals.filter(w => w.status === 'pending' || w.status === 'approved').reduce((s, w) => s + (w.final_amount || 0), 0);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const selectedAcc = fundedAccounts.find(a => a.account_id === data.account_id) || fundedAccounts[0];
      if (!selectedAcc) throw new Error('No funded account selected');
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

  const grossAmount = parseFloat(form.amount) || 0;
  const traderShare = grossAmount * DISPLAY_PROFIT_SPLIT;
  const affiliateReward = traderShare * 0.09;
  const finalAmount = Math.max(0, traderShare - affiliateReward - DISPLAY_WITHDRAWAL_FEE);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-white mb-1">Withdrawals</h1>
          <p className="text-xs text-white/30">Profit payouts — Funded accounts only</p>
        </div>
        <button onClick={() => setShowForm(true)}
          disabled={!kycApproved || fundedAccounts.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-black transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: ACCENT }}>
          <Plus className="w-4 h-4" /> Request Payout
        </button>
      </div>

      {/* Performance Overview */}
      <h2 className="text-sm font-bold text-white mb-4">Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <PerfCard label="Available Profit" value={`$${eligiblePnl.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} sub="80/20 split applied" IconComponent={MoneyBagIcon} highlight accentColor="#10b981" />
        <PerfCard label="Total Withdrawn" value={`$${totalWithdrawn.toFixed(2)}`} sub="Lifetime payouts" IconComponent={VaultIcon} />
        <PerfCard label="Pending Payouts" value={`$${pendingAmount.toFixed(2)}`} sub={pendingAmount > 0 ? 'Awaiting processing' : 'Nothing pending'} IconComponent={HourglassIcon} />
      </div>

      {/* KYC Gate */}
      {!kycApproved && (
        <div className="flex items-start gap-4 p-5 rounded-2xl mb-5"
          style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="text-sm font-bold text-yellow-400 mb-1">KYC Verification Required</div>
            <div className="text-xs text-white/40">
              {!kyc || kyc.status === 'not_submitted'
                ? 'You must complete identity verification before requesting payouts.'
                : kyc.status === 'pending'
                ? 'Your KYC submission is under review (24-48 hours).'
                : 'Your KYC was rejected. Please resubmit.'}
            </div>
          </div>
        </div>
      )}

      {/* Profit split info */}
      <div className="rounded-2xl p-4 sm:p-5 mb-6"
        style={{ background: 'rgba(255,92,0,0.06)', border: '1px solid rgba(255,92,0,0.2)' }}>
        <div className="flex items-center justify-between mb-2 gap-4">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-primary flex-shrink-0" />
            <div className="text-sm font-bold text-white">80/20 Profit Split</div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-lg font-black text-emerald-400">${eligiblePnl.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <div className="text-[10px] font-mono text-white/30">Available Profit</div>
          </div>
        </div>
        <div className="text-xs text-white/40">You keep <span className="text-emerald-400 font-bold">80%</span> of all profits. A $25 processing fee and any affiliate rewards are deducted from your share.</div>
      </div>

      {/* Withdrawal list */}
      <div className="space-y-4">
        {withdrawals.length === 0 && (
          <div className="text-center py-12 rounded-2xl" style={{ background: '#121212', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <DollarSign className="w-8 h-8 text-white/10 mx-auto mb-2" />
            <p className="text-sm text-white/30">No withdrawal requests yet.</p>
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
              style={{ background: '#121212', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center justify-between p-5 border-b border-white/5">
                <h2 className="text-lg font-black text-white">Request Payout</h2>
                <button onClick={() => setShowForm(false)} className="text-white/30 hover:text-white text-xl">×</button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-mono text-white/40 mb-1.5 block uppercase">Profit Amount (USD)</label>
                  <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="Enter gross profit amount"
                    className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>
                <div>
                  <label className="text-xs font-mono text-white/40 mb-2 block uppercase">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {METHODS.map(m => (
                      <button key={m.id} onClick={() => setForm(f => ({ ...f, method: m.id }))}
                        className="py-2.5 rounded-xl text-xs font-semibold transition-all"
                        style={{ background: form.method === m.id ? `${ACCENT}20` : 'rgba(255,255,255,0.04)', border: `1px solid ${form.method === m.id ? `${ACCENT}50` : 'rgba(255,255,255,0.08)'}`, color: form.method === m.id ? ACCENT : '#666' }}>
                        {m.icon} {m.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-mono text-white/40 mb-1.5 block uppercase">Wallet / Bank Address</label>
                  <input value={form.wallet_address} onChange={e => setForm(f => ({ ...f, wallet_address: e.target.value }))}
                    placeholder="Your withdrawal address"
                    className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>

                {grossAmount > 0 && (
                  <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="px-4 py-2 text-[10px] font-mono text-white/30 uppercase bg-white/[0.02]">Payout Breakdown</div>
                    {[
                      { label: 'Gross Profit', val: `$${grossAmount.toFixed(2)}`, color: '#f1f5f9' },
                      { label: 'Company Share (20%)', val: `-$${(grossAmount * 0.2).toFixed(2)}`, color: '#ef4444' },
                      { label: 'Your Share (80%)', val: `$${traderShare.toFixed(2)}`, color: '#10b981' },
                      { label: 'Sponsor Reward (~9%)', val: `-$${affiliateReward.toFixed(2)}`, color: '#f59e0b' },
                      { label: 'Processing Fee', val: `-$${DISPLAY_WITHDRAWAL_FEE.toFixed(2)}`, color: '#94a3b8' },
                    ].map((row, i) => (
                      <div key={i} className="flex justify-between px-4 py-2 border-b border-white/[0.04]">
                        <span className="text-xs text-white/40">{row.label}</span>
                        <span className="text-xs font-mono" style={{ color: row.color }}>{row.val}</span>
                      </div>
                    ))}
                    <div className="flex justify-between px-4 py-2.5 border-t border-white/10" style={{ background: `${ACCENT}10` }}>
                      <span className="text-xs font-bold text-white">You Receive</span>
                      <span className="text-sm font-black" style={{ color: ACCENT }}>${finalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl text-sm text-white/40 hover:text-white/70 transition-colors"
                    style={{ border: '1px solid rgba(255,255,255,0.1)' }}>Cancel</button>
                  <button onClick={() => createMutation.mutate(form)}
                    disabled={!form.amount || !form.wallet_address || createMutation.isPending || finalAmount <= 0}
                    className="flex-1 py-3 rounded-xl text-sm font-bold text-black disabled:opacity-40"
                    style={{ background: ACCENT }}>
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