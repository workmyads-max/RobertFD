import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Plus, TrendingUp, Monitor, BarChart3, DollarSign, Eye, CheckCircle, Clock, XCircle, AlertCircle, Copy, X, Loader2, ExternalLink, Shield } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useSupabaseAuth } from '@/lib/SupabaseAuthContext';
import FundingShowcase from './FundingShowcase';

const STATUS_CONFIG = {
  active: { label: 'Active', color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: CheckCircle },
  pending: { label: 'Pending', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: Clock },
  passed: { label: 'Passed', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', icon: CheckCircle },
  failed: { label: 'Failed', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', icon: XCircle },
  funded: { label: 'Funded', color: '#FF5C00', bg: 'rgba(255,92,0,0.12)', icon: TrendingUp },
};


const PLATFORM_LABELS = { mt5: 'MetaTrader 5' };

function CredentialsModal({ account, onClose }) {
  const [copied, setCopied] = useState('');
  const copy = (val, key) => { navigator.clipboard.writeText(val); setCopied(key); setTimeout(() => setCopied(''), 2000); };
  const rows = [
    { label: 'Platform', value: 'MetaTrader 5', copyable: false },
    { label: 'Login ID', value: account.mt_login || account.account_id, copyable: !!account.mt_login },
    { label: 'Password', value: account.mt_password || 'Not Provisioned', copyable: !!account.mt_password },
    { label: 'Server', value: account.mt_server || 'Not Provisioned', copyable: !!account.mt_server },
    { label: 'Account ID', value: account.account_id, copyable: true },
    { label: 'Leverage', value: account.leverage || '1:100' },
    { label: 'Account Size', value: `$${(account.account_size || 0).toLocaleString()}` },
    { label: 'Challenge Type', value: account.challenge_type === 'two-step' ? 'Two-Step Challenge' : account.challenge_type === 'instant_light' ? 'Instant Light' : 'Instant Funding' },
    { label: 'Status', value: account.status?.toUpperCase() },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}>
      <motion.div initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: '#0d0f16', border: '1px solid rgba(255,92,0,0.3)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div>
            <h3 className="text-sm font-black text-white">Account Credentials</h3>
            <p className="text-[11px] font-mono text-white/30">Keep these private and secure</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-2">
          {rows.map(r => (
            <div key={r.label} className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              <span className="text-[11px] font-mono text-white/30 uppercase">{r.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white">{r.value}</span>
                {r.copyable && (
                  <button onClick={() => copy(r.value, r.label)} className="text-white/20 hover:text-primary transition-colors">
                    {copied === r.label ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 pb-5">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[11px] text-white/40 font-mono"
            style={{ background: 'rgba(255,92,0,0.06)', border: '1px solid rgba(255,92,0,0.15)' }}>
            🔒 Never share your credentials. Funded Firms will never ask for your password.
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function AccountCard({ account, onStartChallenge, onOpenTerminal, onOpenAnalytics }) {
  const [expanded, setExpanded] = useState(false);
  const [showCreds, setShowCreds] = useState(false);
  const statusCfg = STATUS_CONFIG[account.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusCfg.icon;
  const isPnlPos = (account.pnl || 0) >= 0;
  // Read from rule_snapshot — NOT hardcoded
  const snap = account.rule_snapshot || {};
  const profitTarget = account.phase === 'phase2'
    ? (snap.phase2_target ?? 5)
    : (snap.phase1_target ?? (account.challenge_type === 'two-step' ? 10 : 8));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderTop: `2px solid ${statusCfg.color}`,
      }}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-lg font-black text-foreground font-mono">{account.account_id}</span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5"
                style={{ background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.color}40` }}>
                <StatusIcon className="w-3 h-3" />
                {statusCfg.label}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
              <span className="capitalize">{account.challenge_type === 'two-step' ? 'Two-Step' : 'Instant'}</span>
              <span>•</span>
              <span className="capitalize">{account.account_type}</span>
              <span>•</span>
              <span>{account.leverage}</span>
              <span>•</span>
              <span className="capitalize">{account.phase?.replace('phase', 'Phase ')}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-foreground">${(account.balance || account.account_size)?.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground font-mono">Balance</div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 mb-5 relative z-10">
          {[
            { label: 'P&L', value: `${isPnlPos ? '+' : ''}$${(account.pnl || 0).toLocaleString()}`, color: isPnlPos ? 'text-emerald-400' : 'text-red-400' },
            { label: 'Win Rate', value: `${account.win_rate || 0}%`, color: 'text-foreground' },
            { label: 'Daily DD', value: `${account.daily_drawdown_used || 0}%`, color: 'text-foreground' },
            { label: 'Max DD', value: `${account.max_drawdown_used || 0}%`, color: (account.max_drawdown_used || 0) > 7 ? 'text-red-400' : 'text-foreground' },
            { label: 'Trades', value: account.total_trades || 0, color: 'text-foreground' },
          ].map((s, idx) => (
            <div key={s.label}
              className="rounded-xl p-2 sm:p-3 text-center"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="text-[10px] font-medium text-muted-foreground mb-1 uppercase tracking-wider">{s.label}</div>
              <div className={`text-xs sm:text-sm font-bold ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="mb-5 relative z-10">
          <div className="flex justify-between text-xs font-mono mb-2">
            <span className="text-muted-foreground">Profit Target Progress</span>
            <motion.span className="text-primary font-bold"
              key={account.profit_target_progress}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}>
              {account.profit_target_progress?.toFixed(1) || 0}% / {profitTarget}%
            </motion.span>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(((account.profit_target_progress || 0) / profitTarget) * 100, 100)}%` }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="h-full rounded-full"
              style={{ background: '#FF5C00' }} />
          </div>
        </div>

        {/* Phase 1 passed — awaiting admin approval for Phase 2 provisioning */}
        {account.status === 'passed' && account.phase === 'phase2' && account.phase_review_status === 'pending_review' && (
          <div className="mb-4 rounded-xl p-4 flex items-start gap-3"
            style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.3)' }}>
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-emerald-400 mb-1">✅ Phase 1 Passed — Under Review</div>
              <div className="text-[11px] text-muted-foreground leading-relaxed">
                Congratulations! You have passed Phase 1. Your account is under review. Phase 2 credentials will be issued after admin approval.
              </div>
            </div>
          </div>
        )}

        {/* Phase 2 passed — awaiting admin approval for funded provisioning */}
        {account.status === 'passed' && account.phase === 'funded' && account.funded_review_status === 'pending_review' && (
          <div className="mb-4 rounded-xl p-4 flex items-start gap-3"
            style={{ background: 'rgba(96,165,250,0.07)', border: '1px solid rgba(96,165,250,0.3)' }}>
            <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-blue-400 mb-1">✅ Phase 2 Passed — Funded Review In Progress</div>
              <div className="text-[11px] text-muted-foreground leading-relaxed">
                Congratulations! You have passed Phase 2. Your funded account is under review. Expected processing time: 3–5 business days.
              </div>
            </div>
          </div>
        )}

        {/* Provisioning pending state */}
        {account.status === 'pending' && account.platform === 'mt5' && !account.mt_login && (
          <div className="mb-4 rounded-xl p-3 flex items-center gap-3"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
            <Loader2 className="w-4 h-4 text-yellow-400 animate-spin flex-shrink-0" />
            <div className="flex-1">
              <div className="text-xs font-bold text-yellow-400 mb-1">Account Provisioning In Progress</div>
              <div className="flex gap-2 flex-wrap">
                {['Payment Confirmed', 'Creating Account', 'Assigning Rules', 'Syncing CRM', 'Account Ready'].map((stage, i) => (
                  <span key={stage} className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                    style={{ background: i === 1 ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.05)', color: i === 1 ? '#f59e0b' : 'rgba(255,255,255,0.3)', border: i === 1 ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.07)' }}>
                    {i === 1 ? '⟳ ' : i < 1 ? '✓ ' : ''}{stage}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 relative z-10">
          <a href="https://web.metatrader.app/terminal" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-semibold text-white transition-all hover:scale-105 flex-1 sm:flex-none justify-center"
            style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)', boxShadow: '0 4px 12px rgba(255,92,0,0.25)' }}>
            <Monitor className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Open Terminal</span><span className="sm:hidden">Terminal</span>
          </a>
          <button onClick={() => onOpenAnalytics && onOpenAnalytics(account)}
            className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-semibold transition-all hover:bg-white/5 flex-1 sm:flex-none justify-center"
            style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(var(--foreground))' }}>
            <BarChart3 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Analytics</span><span className="sm:hidden">Stats</span>
          </button>
          {account.status === 'funded' && (
            <button className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-semibold transition-all hover:bg-emerald-500/10 flex-1 sm:flex-none justify-center"
              style={{ border: '1px solid rgba(16,185,129,0.3)', color: '#10b981' }}>
              <DollarSign className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Withdraw</span><span className="sm:hidden">Cash Out</span>
            </button>
          )}
          <button onClick={() => setShowCreds(true)}
            className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-semibold transition-all hover:bg-white/5 flex-1 sm:flex-none justify-center"
            style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'hsl(var(--muted-foreground))' }}>
            <Eye className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Credentials</span><span className="sm:hidden">Creds</span>
          </button>
        </div>
        {/* Platform badge */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}>
            📊 {PLATFORM_LABELS[account.platform] || 'XTrading Terminal'}
          </span>
          {account.last_synced_at && (
            <span className="text-[9px] font-mono text-white/20">
              Synced {new Date(account.last_synced_at).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
      {showCreds && <CredentialsModal account={account} onClose={() => setShowCreds(false)} />}
    </motion.div>
  );
}

export default function MyAccounts({ onStartChallenge, onOpenTerminal, onOpenAnalytics }) {
  const { user, userEmail } = useSupabaseAuth();

  const { data: allAccounts = [], isLoading } = useQuery({
    queryKey: ['challenge-accounts-myaccounts', userEmail],
    queryFn: async () => {
      if (!userEmail) return [];
      const all = await base44.entities.ChallengeAccount.list('-created_date', 100);
      return all.filter(a => a.user_email === userEmail);
    },
    enabled: !!userEmail,
    refetchInterval: 15000,
  });

  const accounts = allAccounts;

  const { data: myOrders = [] } = useQuery({
    queryKey: ['my-orders', userEmail],
    queryFn: () => base44.entities.Order.filter({ email: userEmail }),
    enabled: !!userEmail,
  });

  const pendingOrders = myOrders.filter(o => o.payment_status === 'awaiting_confirmation' || o.payment_status === 'pending');

  // Only show active/funded/passed/pending accounts — failed ones go to Trash
  const displayAccounts = accounts.filter(a => !['failed'].includes(a.status));

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground flex items-center gap-2 sm:gap-3">
            <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-primary" /> My Accounts
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground font-mono mt-1">Manage your challenge and funded accounts</p>
        </div>
        <button onClick={onStartChallenge}
          className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 w-full sm:w-auto"
          style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)', boxShadow: '0 4px 20px rgba(255,92,0,0.3)' }}>
          <Plus className="w-4 h-4" /> New Challenge
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[
          { label: 'Active', count: displayAccounts.filter(a => a.status === 'active').length, color: '#10b981' },
          { label: 'Funded', count: displayAccounts.filter(a => a.status === 'funded').length, color: '#FF5C00' },
          { label: 'Passed', count: displayAccounts.filter(a => a.status === 'passed').length, color: '#60a5fa' },
          { label: 'Failed', count: displayAccounts.filter(a => a.status === 'failed').length, color: '#ef4444' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-4 text-center"
            style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${s.color}20` }}>
            <div className="text-2xl font-black" style={{ color: s.color }}>{s.count}</div>
            <div className="text-xs font-mono text-muted-foreground">{s.label} Accounts</div>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-4">
          {/* Funding showcase */}
          {displayAccounts.filter(a => a.status === 'funded').map(fundedAcc => (
            <FundingShowcase key={fundedAcc.id} account={fundedAcc} />
          ))}

          {/* Pending approval orders */}
          {pendingOrders.map(o => (
            <motion.div key={o.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-5 flex items-start gap-4"
              style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-yellow-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-sm font-bold text-foreground">{o.order_id || `Order #${o.id?.slice(0,8)}`}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-yellow-400"
                    style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}>
                    Pending Admin Approval
                  </span>
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                  {o.challenge_type === 'two-step' ? 'Two-Step Challenge' : 'Instant Funding'} · ${(o.account_size||0).toLocaleString()} · {o.account_type} · {o.leverage}
                </div>
                <div className="text-xs text-muted-foreground/60 mt-1">
                  Your payment is being reviewed. Account will be activated within 1–24 hours.
                </div>
              </div>
            </motion.div>
          ))}

          {/* Active accounts */}
          {displayAccounts.map((acc) => (
            <AccountCard key={acc.id || acc.account_id} account={acc} onStartChallenge={onStartChallenge} onOpenTerminal={onOpenTerminal} onOpenAnalytics={onOpenAnalytics} />
          ))}

          {/* Empty state */}
          {displayAccounts.length === 0 && pendingOrders.length === 0 && (
            <div className="rounded-2xl p-12 text-center"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}>
              <div className="text-4xl mb-4">📊</div>
              <div className="text-lg font-black text-foreground mb-2">No Accounts Yet</div>
              <div className="text-sm text-muted-foreground mb-6">Purchase a challenge to get your funded trading account</div>
              <button onClick={onStartChallenge}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white hover:scale-105 transition-all"
                style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)', boxShadow: '0 4px 16px rgba(255,92,0,0.3)' }}>
                <Plus className="w-4 h-4" /> Browse Challenges
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}