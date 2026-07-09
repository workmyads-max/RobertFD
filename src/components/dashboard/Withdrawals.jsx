import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Plus, Clock, CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp, Bell, Wallet, ExternalLink } from 'lucide-react';
import { AlertCard } from '@/components/ui/alert-card';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useKycStatus } from '@/hooks/useKycStatus';
import { useAccountTradeData } from '@/hooks/useAccountTradeData';
import { retryWithBackoff } from '@/lib/retryWithBackoff';

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

// Fee is 5% of trader's 80% share - no affiliate deduction
const FEE_PCT = 0.05;

function WithdrawalCard({ w, i }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CFG[w.status] || STATUS_CFG.pending;
  const Icon = cfg.icon;

  const traderShare = w.trader_share || (w.amount || 0) * ((w.profit_split_pct || 80) / 100);
  const companyShare = (w.amount || 0) - traderShare;
  const fee = w.withdrawal_fee || (traderShare * FEE_PCT);
  const final = w.final_amount || Math.max(0, traderShare - fee);

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
              {METHODS.find(m => m.id === w.method)?.label || w.method} • Account: {w.account_id} • {new Date(w.created_date).toLocaleDateString()}
            </div>
          </div>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold"
            style={{ background: `${cfg.color}0d`, color: cfg.color, border: `1px solid ${cfg.color}22` }}>
            <Icon className="w-3 h-3" /> {cfg.label}
          </span>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="text-xs font-bold text-emerald-400">${traderShare.toFixed(2)}</div>
            <div className="text-[9px] font-mono text-muted-foreground">Your {w.profit_split_pct || 80}%</div>
          </div>
          <div className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="text-xs font-bold text-yellow-400">-${fee.toFixed(2)}</div>
            <div className="text-[9px] font-mono text-muted-foreground">Fee (5%)</div>
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
              { label: 'Gross Reward', val: `$${(w.amount||0).toLocaleString()}`, color: 'text-foreground' },
              { label: `Company Share (${100 - (w.profit_split_pct||80)}%)`, val: `-$${companyShare.toFixed(2)}`, color: 'text-red-400' },
              { label: `Trader Share (${w.profit_split_pct||80}%)`, val: `$${traderShare.toFixed(2)}`, color: 'text-emerald-400' },
              { label: 'Processing Fee (5%)', val: `-$${fee.toFixed(2)}`, color: 'text-yellow-400' },
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

export default function Withdrawals({ user, onNavigate }) {
  const [showForm, setShowForm] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState(() => {
    // Pre-select account from sessionStorage (set by "Request Withdrawal" buttons)
    return sessionStorage.getItem('selectedAccountId') || '';
  });
  const [showKycAlert, setShowKycAlert] = useState(true);
  const [method, setMethod] = useState('usdt_trc20');
  const [submitError, setSubmitError] = useState('');
  const qc = useQueryClient();

  const { data: accounts = [] } = useQuery({
    // CRITICAL: Same queryFn as Dashboard - getUserAccounts service-role backend
    // (case-insensitive email match). Using a different queryFn with the same key
    // overwrites the shared cache with RLS-filtered data that can return empty.
    queryKey: ['challenge-accounts', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const res = await base44.functions.invoke('getUserAccounts', {});
      return res?.data?.accounts || [];
    },
    enabled: !!user?.email,
    placeholderData: (prev) => prev ?? [],
  });

  // Open the withdrawal form automatically when navigated from "Request Withdrawal"
  // buttons (sets selectedAccountId in sessionStorage + tab=withdrawals in URL)
  useEffect(() => {
    const savedId = sessionStorage.getItem('selectedAccountId');
    if (savedId && accounts.length > 0 && !showForm) {
      const exists = accounts.find(a => a.account_id === savedId);
      if (exists) {
        setSelectedAccountId(savedId);
        setShowForm(true);
      }
      sessionStorage.removeItem('selectedAccountId');
    }
  }, [accounts, showForm]);

  // Include funded accounts AND active instant_account accounts (payout eligible if instant_payout_eligible=true)
  const fundedAccounts = accounts.filter(a => a.status === 'funded' || (a.challenge_type === 'instant_account' && a.status === 'active'));

  // Fetch closed trades for each funded account to compute trading days -
  // matches AccountTimeline logic (Math.max(unique trade days, account.trading_days))
  const { data: accountTradingDays = {} } = useQuery({
    queryKey: ['funded-trading-days', fundedAccounts.map(a => a.account_id)],
    queryFn: async () => {
      if (!fundedAccounts.length) return {};
      const results = await Promise.all(
        fundedAccounts.map(async acc => {
          try {
            const res = await base44.functions.invoke('getAccountTradeRecords', { account_id: acc.account_id });
            const trades = Array.isArray(res?.data?.trades) ? res.data.trades : [];
            const uniqueDays = new Set(
              trades.filter(t => t.close_time).map(t => new Date(t.close_time).toISOString().split('T')[0])
            ).size;
            return { [acc.account_id]: Math.max(uniqueDays, acc.trading_days || 0) };
          } catch {
            return { [acc.account_id]: acc.trading_days || 0 };
          }
        })
      );
      return Object.assign({}, ...results);
    },
    enabled: fundedAccounts.length > 0,
    refetchInterval: 30000,
  });

  // Same eligibility as AccountTimeline: funded + KYC approved + min 1 trading day
  const eligibleAccounts = fundedAccounts.filter(a => (accountTradingDays[a.account_id] || a.trading_days || 0) >= 1);

  // Shared KYC status - single source of truth (same hook as the KYC page).
  // isLoading is true only on first load with no cached data, so we never show
  // a stale "pending" KYC card before the real status arrives.
  const { kyc, status: kycStatus, isApproved: kycApproved, isLoading: kycLoading } = useKycStatus(user?.email);

  const { data: withdrawals = [] } = useQuery({
    queryKey: ['withdrawals', user?.email],
    queryFn: () => base44.entities.WithdrawalRequest.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  // Load saved wallet address from user profile
  const savedWalletAddress = user?.payout_wallet_address || user?.usdt_trc20 || user?.bitcoin || '';
  const savedWalletType = user?.payout_wallet_type || 'usdt_trc20';

  // Selected account for withdrawal form
  const selectedAccount = fundedAccounts.find(a => a.account_id === selectedAccountId) || fundedAccounts[0];
  // Instant accounts: use withdrawable_profit (spillover-capped); others use raw pnl
  const selectedProfit = selectedAccount?.challenge_type === 'instant_account'
    ? Math.max(0, selectedAccount?.withdrawable_profit || 0)
    : Math.max(0, selectedAccount?.pnl || 0);
  const profitSplitPct = selectedAccount?.rule_snapshot?.profit_split ?? 80;
  const autoAmount = parseFloat((selectedProfit * (profitSplitPct / 100)).toFixed(2)); // 80% share is the withdrawal amount
  const fee5pct = parseFloat((autoAmount * FEE_PCT).toFixed(2));
  const youReceive = Math.max(0, autoAmount - fee5pct);
  // Use the SAME data source as AccountOverview/AccountTimeline - useAccountTradeData
  // fetches via getAccountTradeRecords with keepPreviousData, so it's always populated.
  // The separate accountTradingDays query can be stale/not-yet-resolved when the modal
  // opens, causing a false (0/1) mismatch.
  const { closedTrades: selectedClosedTrades } = useAccountTradeData(selectedAccount, { refetchIntervalMs: 15000 });
  const selectedTradingDaysFromTrades = new Set(
    (selectedClosedTrades || []).filter(t => t.close_time).map(t => new Date(t.close_time).toISOString().split('T')[0])
  ).size;
  const selectedTradingDays = Math.max(
    selectedTradingDaysFromTrades,
    accountTradingDays[selectedAccount?.account_id] || 0,
    selectedAccount?.trading_days || 0
  );
  const isSelectedEligible = selectedAccount && kycApproved && (
    selectedAccount.challenge_type === 'instant_account'
      ? (selectedAccount.instant_payout_eligible === true)
      : (selectedTradingDays >= 1)
  );

  const openForm = (accId) => {
    setSelectedAccountId(accId || fundedAccounts[0]?.account_id || '');
    setMethod(savedWalletType || 'usdt_trc20');
    setSubmitError('');
    setShowForm(true);
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAccount) throw new Error('No funded account selected');
      if (!savedWalletAddress) throw new Error('Please save your payout wallet address in Settings → Payout Wallets first.');
      const res = await retryWithBackoff(() => base44.functions.invoke('requestTraderWithdrawal', {
        account_id: selectedAccount.account_id,
        amount: selectedProfit, // Send gross profit - backend calculates split
        method,
        wallet_address: savedWalletAddress,
      }));
      if (res.data?.error) throw new Error(res.data.error);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['withdrawals'] });
      setShowForm(false);
      setSubmitError('');
    },
    onError: (err) => {
      setSubmitError(err.message || 'Submission failed. Please try again.');
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-primary" /> Withdrawals
          </h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">Reward payouts - Simulation Funded accounts only</p>
        </div>
        <button onClick={() => openForm('')}
          disabled={!kycApproved || eligibleAccounts.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)', boxShadow: '0 4px 20px rgba(255,92,0,0.3)' }}>
          <Plus className="w-4 h-4" /> Request Payout
        </button>
      </div>

      {/* KYC Gate - never render a stale "pending" state. Show a brief loading
          indicator until the real status arrives, then the correct card. */}
      {kycLoading ? (
        <div className="flex justify-center mb-5">
          <div className="flex items-center gap-3 px-5 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono text-muted-foreground">Loading KYC status…</span>
          </div>
        </div>
      ) : !kycApproved && showKycAlert && (
        <div className="flex justify-center mb-5">
          <AlertCard
            isVisible={showKycAlert}
            title="KYC Required"
            description={!kyc || kycStatus === 'not_submitted'
              ? 'Complete identity verification before requesting payouts. Submit your documents in the KYC section.'
              : kycStatus === 'pending'
              ? 'KYC under review (24-48 hours). Payouts unavailable until approved.'
              : 'KYC was rejected. Please resubmit correct documents.'}
            buttonText="Go to KYC"
            onButtonClick={() => onNavigate?.('kyc')}
            onDismiss={() => setShowKycAlert(false)}
            icon={<Bell className="h-6 w-6 text-white" />}
          />
        </div>
      )}

      {/* No funded accounts warning */}
      {kycApproved && fundedAccounts.length === 0 && (
        <div className="flex justify-center mb-5">
          <AlertCard
            isVisible={true}
            title="No Simulation Funded Accounts"
            description="Withdrawals are only available for live simulation funded accounts. Complete your challenge to unlock payouts."
            buttonText="Buy Challenge"
            onButtonClick={() => onNavigate?.('marketplace')}
            icon={<Bell className="h-6 w-6 text-white" />}
          />
        </div>
      )}

      {/* Per-account funded breakdown - click to open withdrawal form */}
      {fundedAccounts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          {fundedAccounts.map(acc => {
            // Instant accounts: show withdrawable_profit (spillover-capped) instead of raw pnl
            const profit = acc.challenge_type === 'instant_account'
              ? Math.max(0, acc.withdrawable_profit || 0)
              : Math.max(0, acc.pnl || 0);
            const split = acc.rule_snapshot?.profit_split ?? 80;
            const traderShare = profit * (split / 100);
            const firmShare = profit * ((100 - split) / 100);
            const hasPending = withdrawals.some(w => w.account_id === acc.account_id && w.status === 'pending');
            const tradingDays = accountTradingDays[acc.account_id] || acc.trading_days || 0;
            const isEligible = acc.challenge_type === 'instant_account'
              ? (kycApproved && acc.instant_payout_eligible)
              : (kycApproved && tradingDays >= 1);
            return (
              <div key={acc.id} className="rounded-2xl p-5 transition-all"
                onClick={() => isEligible && !hasPending && openForm(acc.account_id)}
                style={{
                  background: 'rgba(16,185,129,0.04)',
                  border: `1px solid ${hasPending ? 'rgba(245,158,11,0.3)' : isEligible ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                  cursor: isEligible && !hasPending ? 'pointer' : 'default',
                }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-muted-foreground">Account</span>
                  <span className="text-xs font-bold font-mono text-foreground">{acc.account_id}</span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono text-muted-foreground">Total Reward</span>
                  <span className="text-sm font-black text-emerald-400">${profit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(16,185,129,0.08)' }}>
                    <div className="text-sm font-black text-emerald-400">${traderShare.toFixed(2)}</div>
                    <div className="text-[9px] font-mono text-muted-foreground">Your {split}%</div>
                  </div>
                  <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="text-sm font-black text-muted-foreground">${firmShare.toFixed(2)}</div>
                    <div className="text-[9px] font-mono text-muted-foreground">Firm {100 - split}%</div>
                  </div>
                </div>
                {hasPending ? (
                  <div className="text-center text-[10px] font-mono text-yellow-400 py-1">⏳ Withdrawal Pending</div>
                ) : !kycApproved ? (
                  <div className="text-center text-[10px] font-mono text-red-400 py-1">⚠ KYC required</div>
                ) : acc.challenge_type === 'instant_account' && !acc.instant_payout_eligible ? (
                  <div className="text-center text-[10px] font-mono text-red-400 py-1">⚠ Payout requirements not met</div>
                ) : acc.challenge_type !== 'instant_account' && tradingDays < 1 ? (
                  <div className="text-center text-[10px] font-mono text-red-400 py-1">⚠ Min 1 trading day required ({tradingDays}/1)</div>
                ) : profit > 0 ? (
                  <div className="text-center text-[10px] font-mono text-primary py-1 flex items-center justify-center gap-1">
                    <Plus className="w-3 h-3" /> Click to Request Withdrawal
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {/* Profit split info banner */}
      <div className="rounded-2xl p-5 mb-6 flex items-center justify-between gap-4"
        style={{ background: 'linear-gradient(135deg,rgba(255,92,0,0.12),rgba(255,92,0,0.05))', border: '1px solid rgba(255,92,0,0.25)' }}>
        <div>
          <div className="text-base font-black text-foreground mb-1">80/20 Reward Split</div>
          <div className="text-sm text-muted-foreground">
            ${fundedAccounts.reduce((s, a) => s + (a.challenge_type === 'instant_account' ? Math.max(0, a.withdrawable_profit || 0) : Math.max(0, a.pnl || 0)), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} available reward.
            You keep 80% - only a 5% processing fee is deducted from your share. No affiliate deductions.
          </div>
        </div>
        <DollarSign className="w-8 h-8 text-primary flex-shrink-0" />
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

                {/* Account selector */}
                {fundedAccounts.length > 1 && (
                  <div>
                    <label className="text-xs font-mono text-muted-foreground mb-2 block uppercase">Select Account</label>
                    <div className="space-y-2">
                      {fundedAccounts.map(acc => {
                        const profit = acc.challenge_type === 'instant_account'
                          ? Math.max(0, acc.withdrawable_profit || 0)
                          : Math.max(0, acc.pnl || 0);
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

                {/* Fixed amount - read only */}
                <div>
                  <label className="text-xs font-mono text-muted-foreground mb-1.5 block uppercase">Withdrawal Amount (Your {profitSplitPct}% Share)</label>
                  <div className="w-full rounded-xl px-4 py-3 text-sm font-black text-emerald-400 cursor-not-allowed"
                    style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.25)' }}>
                    ${autoAmount.toFixed(2)}
                    <span className="text-xs font-normal text-muted-foreground ml-2">(fixed - 80% of ${selectedProfit.toFixed(2)} reward)</span>
                  </div>
                </div>

                {/* Payment method */}
                <div>
                  <label className="text-xs font-mono text-muted-foreground mb-2 block uppercase">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {METHODS.map(m => (
                      <button key={m.id} onClick={() => setMethod(m.id)}
                        className="py-2.5 rounded-xl text-xs font-semibold transition-all"
                        style={{ background: method === m.id ? 'rgba(255,92,0,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${method === m.id ? 'rgba(255,92,0,0.5)' : 'rgba(255,255,255,0.08)'}`, color: method === m.id ? '#FF5C00' : '#666' }}>
                        {m.icon} {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Wallet address - from settings */}
                <div>
                  <label className="text-xs font-mono text-muted-foreground mb-1.5 block uppercase">Payout Wallet Address</label>
                  {savedWalletAddress ? (
                    <div className="w-full rounded-xl px-4 py-3 text-sm font-mono text-foreground cursor-not-allowed break-all"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(16,185,129,0.25)', color: '#94a3b8' }}>
                      {savedWalletAddress}
                      <div className="text-[10px] text-emerald-400 mt-1">✓ From your saved payout wallet settings</div>
                    </div>
                  ) : (
                    <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)' }}>
                      <Wallet className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
                      <p className="text-xs text-yellow-400 font-semibold mb-1">No wallet address saved</p>
                      <p className="text-[11px] text-muted-foreground mb-3">Go to Settings → Payout Wallets to save your primary wallet address.</p>
                      <button onClick={() => { setShowForm(false); onNavigate?.('settings'); }}
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
                      { label: 'Gross Reward', val: `$${selectedProfit.toFixed(2)}`, color: 'text-foreground' },
                      { label: `Company Share (${100 - profitSplitPct}%)`, val: `-$${(selectedProfit * ((100 - profitSplitPct) / 100)).toFixed(2)}`, color: 'text-red-400' },
                      { label: `Your Share (${profitSplitPct}%)`, val: `$${autoAmount.toFixed(2)}`, color: 'text-emerald-400' },
                      { label: 'Processing Fee (5% of your share)', val: `-$${fee5pct.toFixed(2)}`, color: 'text-yellow-400' },
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

                {/* Withdrawal requirements not met warning */}
                {selectedAccount && !isSelectedEligible && (
                  <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                      <span className="text-xs font-bold text-red-400">Withdrawal Requirements Not Met</span>
                    </div>
                    {!kycApproved && <div className="text-[11px] text-red-300 ml-6">• KYC verification not approved</div>}
                    {selectedAccount?.challenge_type === 'instant_account' && !selectedAccount?.instant_payout_eligible && (
                      <div className="text-[11px] text-red-300 ml-6">• Instant Account payout requirements not met (Buffer Zone, Consistency, Profitable Days)</div>
                    )}
                    {selectedAccount?.challenge_type !== 'instant_account' && selectedTradingDays < 1 && (
                      <div className="text-[11px] text-red-300 ml-6">• Minimum 1 trading day required ({selectedTradingDays}/1)</div>
                    )}
                  </div>
                )}

                {/* Error message */}
                {submitError && (
                  <div className="rounded-xl px-4 py-3 text-sm text-red-400" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
                    {submitError}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors"
                    style={{ border: '1px solid rgba(255,255,255,0.1)' }}>Cancel</button>
                  <button onClick={() => createMutation.mutate()}
                    disabled={!savedWalletAddress || createMutation.isPending || autoAmount <= 0 || !isSelectedEligible}
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