import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, X, Wallet, ExternalLink, XCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';

const FEE_PCT = 0.05;
const METHODS = [
  { id: 'usdt_trc20', label: 'USDT TRC20', icon: '₮' },
  { id: 'bitcoin', label: 'Bitcoin', icon: '₿' },
  { id: 'bank_wire', label: 'Bank Wire', icon: '🏦' },
];

export default function QuickWithdrawModal({ accounts = [], account, user, onClose, onSuccess, onNavigateSettings }) {
  const qc = useQueryClient();

  // Support passing a single account or a list
  const fundedAccounts = accounts.length > 0 ? accounts : (account ? [account] : []);
  const [selectedAccountId, setSelectedAccountId] = useState(
    account?.account_id || fundedAccounts[0]?.account_id || ''
  );
  const [method, setMethod] = useState('usdt_trc20');
  const [submitError, setSubmitError] = useState('');

  const selectedAccount = fundedAccounts.find(a => a.account_id === selectedAccountId) || fundedAccounts[0];
  const selectedProfit = Math.max(0, selectedAccount?.pnl || 0);
  const profitSplitPct = selectedAccount?.rule_snapshot?.profit_split ?? 80;
  const autoAmount = parseFloat((selectedProfit * (profitSplitPct / 100)).toFixed(2));
  const fee = parseFloat((autoAmount * FEE_PCT).toFixed(2));
  const youReceive = Math.max(0, autoAmount - fee);

  const savedWalletAddress = user?.payout_wallet_address || user?.usdt_trc20 || user?.bitcoin || '';
  
  // Load KYC status from entity
  const { data: kycData = [] } = useQuery({
    queryKey: ['kyc-status', user?.email],
    queryFn: () => base44.entities.KYCVerification.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });
  const kycRecord = kycData[0];
  const kycApproved = kycRecord?.status === 'approved';
  
  // Eligibility checks
  const isFunded = selectedAccount?.status === 'funded';
  const hasProfit = selectedProfit > 0;
  const tradingDays = selectedAccount?.trading_days || 0;
  const hasMinTradingDays = tradingDays >= 1;
  const isEligible = isFunded && hasProfit && hasMinTradingDays && kycApproved && savedWalletAddress;
  
  const requirements = [];
  if (!isFunded) requirements.push('Account must be in funded status');
  if (!hasProfit) requirements.push('No withdrawable profit available');
  if (!hasMinTradingDays) requirements.push(`Minimum 1 trading day required (${tradingDays}/1)`);
  if (!kycApproved) requirements.push('KYC verification must be approved');
  if (!savedWalletAddress) requirements.push('Payout wallet address required');

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAccount) throw new Error('No funded account selected');
      if (!savedWalletAddress) throw new Error('Please save your payout wallet address in Settings → Payout Wallets first.');
      const res = await base44.functions.invoke('requestTraderWithdrawal', {
        account_id: selectedAccount.account_id,
        amount: selectedProfit,
        method,
        wallet_address: savedWalletAddress,
      });
      if (res.data?.error) throw new Error(res.data.error);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['withdrawals'] });
      setSubmitError('');
      onSuccess?.();
      onClose();
    },
    onError: (err) => {
      setSubmitError(err.message || 'Submission failed. Please try again.');
    },
  });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(14px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
          className="w-full max-w-md rounded-2xl max-h-[90vh] overflow-y-auto"
          style={{ background: '#0c0c0f', border: '1px solid rgba(255,255,255,0.1)' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/5">
            <h2 className="text-lg font-black text-foreground">Request Payout</h2>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl transition-colors">×</button>
          </div>

          <div className="p-5 space-y-4">
            {/* Account selector */}
            {fundedAccounts.length > 1 && (
              <div>
                <label className="text-xs font-mono text-muted-foreground mb-2 block uppercase">Select Account</label>
                <div className="space-y-2">
                  {fundedAccounts.map(acc => {
                    const profit = Math.max(0, acc.pnl || 0);
                    const split = acc.rule_snapshot?.profit_split ?? 80;
                    const share = (profit * (split / 100)).toFixed(2);
                    return (
                      <button key={acc.account_id} onClick={() => setSelectedAccountId(acc.account_id)}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all"
                        style={{
                          background: selectedAccountId === acc.account_id ? 'rgba(255,92,0,0.12)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${selectedAccountId === acc.account_id ? 'rgba(255,92,0,0.4)' : 'rgba(255,255,255,0.08)'}`,
                        }}>
                        <span className="font-mono font-bold text-foreground">{acc.account_id}</span>
                        <span className="text-emerald-400 font-bold">${share} (your {split}%)</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Fixed amount */}
            <div>
              <label className="text-xs font-mono text-muted-foreground mb-1.5 block uppercase">Withdrawal Amount (Your {profitSplitPct}% Share)</label>
              <div className="w-full rounded-xl px-4 py-3 text-sm font-black text-emerald-400 cursor-not-allowed"
                style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.25)' }}>
                ${autoAmount.toFixed(2)}
                <span className="text-xs font-normal text-muted-foreground ml-2">(fixed — {profitSplitPct}% of ${selectedProfit.toFixed(2)} profit)</span>
              </div>
            </div>

            {/* Payment method */}
            <div>
              <label className="text-xs font-mono text-muted-foreground mb-2 block uppercase">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                {METHODS.map(m => (
                  <button key={m.id} onClick={() => setMethod(m.id)}
                    className="py-2.5 rounded-xl text-xs font-semibold transition-all"
                    style={{
                      background: method === m.id ? 'rgba(255,92,0,0.15)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${method === m.id ? 'rgba(255,92,0,0.5)' : 'rgba(255,255,255,0.08)'}`,
                      color: method === m.id ? '#FF5C00' : '#666',
                    }}>
                    {m.icon} {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Wallet address from settings */}
            <div>
              <label className="text-xs font-mono text-muted-foreground mb-1.5 block uppercase">Payout Wallet Address</label>
              {savedWalletAddress ? (
                <div className="w-full rounded-xl px-4 py-3 text-sm font-mono break-all cursor-not-allowed"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(16,185,129,0.25)', color: '#94a3b8' }}>
                  {savedWalletAddress}
                  <div className="text-[10px] text-emerald-400 mt-1">✓ From your saved payout wallet settings</div>
                </div>
              ) : (
                <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)' }}>
                  <Wallet className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
                  <p className="text-xs text-yellow-400 font-semibold mb-1">No wallet address saved</p>
                  <p className="text-[11px] text-muted-foreground mb-3">Go to Settings → Payout Wallets to save your primary wallet address.</p>
                  <button onClick={() => { onClose(); onNavigateSettings?.(); }}
                    className="flex items-center gap-1.5 mx-auto text-xs font-bold text-primary hover:underline">
                    <ExternalLink className="w-3 h-3" /> Open Settings
                  </button>
                </div>
              )}
            </div>

            {/* Payout breakdown */}
            {autoAmount > 0 && (
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="px-4 py-2 text-[10px] font-mono text-muted-foreground uppercase bg-white/[0.02]">Payout Breakdown</div>
                {[
                  { label: 'Gross Profit', val: `$${selectedProfit.toFixed(2)}`, color: 'text-foreground' },
                  { label: `Company Share (${100 - profitSplitPct}%)`, val: `-$${(selectedProfit * ((100 - profitSplitPct) / 100)).toFixed(2)}`, color: 'text-red-400' },
                  { label: `Your Share (${profitSplitPct}%)`, val: `$${autoAmount.toFixed(2)}`, color: 'text-emerald-400' },
                  { label: 'Processing Fee (5% of your share)', val: `-$${fee.toFixed(2)}`, color: 'text-yellow-400' },
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

            {/* Eligibility Requirements */}
            {!isEligible && requirements.length > 0 && (
              <div className="rounded-xl p-4" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)' }}>
                <div className="text-xs font-bold text-red-400 mb-2">Withdrawal Requirements Not Met</div>
                <div className="space-y-1">
                  {requirements.map((req, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-red-300">
                      <XCircle className="w-3 h-3" />
                      {req}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {submitError && (
              <div className="rounded-xl px-4 py-3 text-sm text-red-400"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
                {submitError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={onClose}
                className="flex-1 py-3 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                Cancel
              </button>
              <button onClick={() => createMutation.mutate()}
                disabled={!isEligible || createMutation.isPending || autoAmount <= 0}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40"
                style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)' }}>
                {createMutation.isPending ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}