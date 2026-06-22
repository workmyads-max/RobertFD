import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Plus, TrendingUp, BarChart3, DollarSign, Eye, CheckCircle, Clock, XCircle, Copy, X, Loader2, Shield, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import QuickWithdrawModal from '../overview/QuickWithdrawModal';
import AccountTimeline from '../overview/AccountTimeline';

const STATUS_CONFIG = {
  active: { label: 'Active', color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
  pending: { label: 'Pending', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
  passed: { label: 'Passed — Under Review', color: '#60a5fa', bg: 'rgba(96,165,250,0.08)' },
  failed: { label: 'Failed', color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
  funded: { label: 'Funded', color: '#FF5C00', bg: 'rgba(255,92,0,0.08)' },
};

function CredentialsModal({ account, onClose }) {
  const [copied, setCopied] = useState('');
  const copy = (val, key) => { 
    navigator.clipboard.writeText(val); 
    setCopied(key); 
    setTimeout(() => setCopied(''), 2000); 
  };
  
  const rows = [
    { label: 'Platform', value: 'MetaTrader 5' },
    { label: 'Login ID', value: account.mt_login || account.account_id, copyable: !!account.mt_login },
    { label: 'Password', value: account.mt_password || 'Not provisioned', copyable: !!account.mt_password },
    { label: 'Server', value: account.mt_server || 'Not provisioned', copyable: !!account.mt_server },
    { label: 'Account ID', value: account.account_id, copyable: true },
    { label: 'Leverage', value: account.leverage || '1:100' },
    { label: 'Account size', value: `$${(account.account_size || 0).toLocaleString()}` },
    { label: 'Type', value: account.challenge_type === 'two-step' ? 'Two-step' : account.challenge_type === 'instant_light' ? 'Instant Light' : 'Instant' },
    { label: 'Status', value: account.status?.toUpperCase() },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
      <motion.div 
        initial={{ scale: 0.95, y: 16 }} 
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-md rounded-xl overflow-hidden"
        style={{ background: '#16181d', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div>
            <h3 className="text-sm font-medium text-foreground">Account credentials</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Keep these private</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          {rows.map(r => (
            <div key={r.label} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              <span className="text-xs text-muted-foreground">{r.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">{r.value}</span>
                {r.copyable && (
                  <button onClick={() => copy(r.value, r.label)} className="text-muted-foreground hover:text-primary transition-colors">
                    {copied === r.label ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 pb-5">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs text-muted-foreground"
            style={{ background: 'rgba(255,92,0,0.06)', border: '1px solid rgba(255,92,0,0.12)' }}>
            <Shield className="w-3.5 h-3.5" />
            Never share your credentials. XFunded will never ask for your password.
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function AccountCard({ account, onNavigate, onWithdraw }) {
  const [showCreds, setShowCreds] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const statusCfg = STATUS_CONFIG[account.status] || STATUS_CONFIG.pending;
  const isPnlPos = (account.pnl || 0) >= 0;
  const snap = account.rule_snapshot || {};
  const isFundedLive = account.status === 'funded';
  const profitTarget = isFundedLive ? null : account.phase === 'phase2' ? (snap.phase2_target ?? 5) : (snap.phase1_target ?? 10);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl overflow-hidden"
        style={{
          background: '#16181d',
          border: '1px solid rgba(255,255,255,0.06)',
          borderTop: `2px solid ${statusCfg.color}`,
        }}
      >
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-base font-semibold text-foreground font-mono">{account.account_id}</span>
                <span className="px-2.5 py-1 rounded-md text-xs font-medium"
                  style={{ background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.color}25` }}>
                  {statusCfg.label}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="capitalize">{account.status === 'funded' ? 'Funded' : account.challenge_type === 'two-step' ? 'Two-step' : account.challenge_type === 'instant_light' ? 'Instant Light' : 'Instant'}</span>
                <span>•</span>
                <span className="capitalize">{account.account_type}</span>
                <span>•</span>
                <span>{account.leverage}</span>
                {!isFundedLive && (<>
                  <span>•</span>
                  <span className="capitalize">{account.phase?.replace('phase', 'Phase ')}</span>
                </>)}
              </div>
              {account.rule_snapshot && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'rgba(255,92,0,0.08)', border: '1px solid rgba(255,92,0,0.15)', color: '#FF5C00' }}>
                    Daily DD: {account.rule_snapshot.daily_dd_limit}%
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'rgba(255,92,0,0.08)', border: '1px solid rgba(255,92,0,0.15)', color: '#FF5C00' }}>
                    Max DD: {account.rule_snapshot.max_dd_limit}%
                  </span>
                  {!isFundedLive && (
                    <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981' }}>
                      Target: {account.phase === 'phase2' ? account.rule_snapshot.phase2_target : account.rule_snapshot.phase1_target}%
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-xl font-semibold text-foreground">${(account.balance || account.account_size)?.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Balance</div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {[
              { label: 'P&L', value: `${isPnlPos ? '+' : ''}$${(account.pnl || 0).toLocaleString()}`, color: isPnlPos ? 'text-emerald-400' : 'text-red-400' },
              { label: 'Win rate', value: `${account.win_rate || 0}%` },
              { label: 'Daily DD', value: `${account.daily_drawdown_used || 0}%` },
              { label: 'Trades', value: account.total_trades || 0 },
            ].map((s) => (
              <div key={s.label} className="rounded-lg p-3 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="text-[10px] text-muted-foreground mb-1">{s.label}</div>
                <div className={`text-sm font-semibold ${s.color || 'text-foreground'}`}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Progress bar — hidden for funded live */}
          {!isFundedLive && profitTarget && (
            <div className="mb-5">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-muted-foreground">Profit target</span>
                <motion.span className="text-primary font-medium"
                  key={account.profit_target_progress}
                  initial={{ scale: 1.1, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}>
                  {account.profit_target_progress?.toFixed(1) || 0}% / {profitTarget}%
                </motion.span>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(((account.profit_target_progress || 0) / profitTarget) * 100, 100)}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: '#FF5C00' }}
                />
              </div>
            </div>
          )}

          {/* Phase review states */}
          {account.status === 'passed' && account.phase === 'phase1' && account.phase_review_status === 'pending_review' && (
            <div className="mb-4 rounded-lg p-3 flex items-start gap-3"
              style={{ background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.2)' }}>
              <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-medium text-blue-400 mb-0.5">Phase 1 passed — Under review</div>
                <div className="text-[11px] text-muted-foreground">Phase 2 credentials will be issued after admin approval. Expected: 1–3 business days.</div>
              </div>
            </div>
          )}

          {account.status === 'passed' && account.phase === 'phase2' && account.phase_review_status === 'pending_review' && (
            <div className="mb-4 rounded-lg p-3 flex items-start gap-3"
              style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-medium text-emerald-400 mb-0.5">Phase 1 passed — Under review</div>
                <div className="text-[11px] text-muted-foreground">Phase 2 credentials will be issued after admin approval.</div>
              </div>
            </div>
          )}

          {account.status === 'passed' && account.phase === 'funded' && account.funded_review_status === 'pending_review' && (
            <div className="mb-4 rounded-lg p-3 flex items-start gap-3"
              style={{ background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.2)' }}>
              <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-medium text-blue-400 mb-0.5">Phase 2 passed — Funded review</div>
                <div className="text-[11px] text-muted-foreground">Processing time: 3–5 business days.</div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <a href="https://web.metatrader.app/terminal" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-white transition-colors"
              style={{ background: '#FF5C00' }}>
              Open Terminal
            </a>
            <button onClick={() => onNavigate?.('analytics')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(var(--foreground))' }}>
              <BarChart3 className="w-3.5 h-3.5" /> Analytics
            </button>
            {account.status === 'funded' && (
              <button onClick={() => setShowWithdrawModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors"
                style={{ border: '1px solid rgba(16,185,129,0.25)', color: '#10b981' }}>
                <DollarSign className="w-3.5 h-3.5" /> Withdraw
              </button>
            )}
            
            {showWithdrawModal && (
              <QuickWithdrawModal
                account={account}
                onClose={() => setShowWithdrawModal(false)}
                onSuccess={() => { setShowWithdrawModal(false); onNavigate?.('withdrawals'); }}
                onNavigateSettings={() => { setShowWithdrawModal(false); onNavigate?.('settings'); }}
              />
            )}
            <button onClick={() => setShowCreds(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'hsl(var(--muted-foreground))' }}>
              <Eye className="w-3.5 h-3.5" /> Credentials
            </button>
          </div>

          {account.last_synced_at && (
            <div className="mt-3 text-[10px] text-muted-foreground">
              Last synced: {new Date(account.last_synced_at).toLocaleString()}
            </div>
          )}
        </div>
      </motion.div>
      {showCreds && <CredentialsModal account={account} onClose={() => setShowCreds(false)} />}
    </>
  );
}

export default function MyAccounts({ user, onStartChallenge, onNavigate }) {

  const { data: accounts = [], isLoading, isFetching } = useQuery({
    queryKey: ['challenge-accounts', user?.email],
    queryFn: async () => {
      // Use service-role backend function with case-insensitive email matching.
      // FIX: Removed platform:'mt5' filter — that was hiding all accounts since
      // they have platform='xtrading' (the default), not 'mt5'.
      const res = await base44.functions.invoke('getUserAccounts', {});
      const all = res?.data?.accounts || [];
      // Show all non-trashed accounts — trashed accounts belong in the Trash page.
      // This ensures passed/active/funded/failed (non-trashed) are all visible and counted.
      return all.filter(a => !a.is_trashed).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    enabled: !!user?.email,
    refetchInterval: 30000,
    placeholderData: (prev) => prev ?? [], // Keep previous data while refetching — prevents empty state flash
    staleTime: 10000,
  });

  const { data: myOrders = [] } = useQuery({
    queryKey: ['my-orders', user?.email],
    queryFn: () => base44.entities.Order.filter({ email: user?.email }),
    enabled: !!user?.email,
  });

  const pendingOrders = myOrders.filter(o => o.payment_status === 'awaiting_confirmation' || o.payment_status === 'pending');

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Accounts</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your trading accounts</p>
        </div>
        <button onClick={onStartChallenge}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
          style={{ background: 'hsl(var(--primary))' }}>
          <Plus className="w-4 h-4" /> New Challenge
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active', count: accounts.filter(a => a.status === 'active').length, color: '#10b981' },
          { label: 'Funded', count: accounts.filter(a => a.status === 'funded').length, color: '#FF5C00' },
          { label: 'Passed', count: accounts.filter(a => a.status === 'passed').length, color: '#60a5fa' },
          { label: 'Pending', count: pendingOrders.length, color: '#f59e0b' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-5" style={{ background: '#16181d', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-2xl font-semibold mb-1" style={{ color: s.color }}>{s.count}</div>
            <div className="text-sm text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {(isLoading && accounts.length === 0) || !user ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {pendingOrders.map((o, i) => (
            <motion.div key={o.id} 
              initial={{ opacity: 0, y: 8 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: i * 0.05 }}
              className="rounded-xl p-5 flex items-center justify-between"
              style={{ background: '#16181d', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-sm font-medium text-foreground">{o.order_id || `Order #${o.id?.slice(0,8)}`}</span>
                  <span className="px-2.5 py-1 rounded-md text-xs font-medium"
                    style={{ background: 'rgba(245,158,11,0.08)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>
                    Pending
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {o.challenge_type === 'two-step' ? 'Two-step' : o.challenge_type === 'instant_light' ? 'Instant Light' : 'Instant'} · ${(o.account_size||0).toLocaleString()} · {o.account_type}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-foreground">${(o.price || 0).toLocaleString()}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Activating within 24h</div>
              </div>
            </motion.div>
          ))}

          {accounts.map((acc) => (
            <AccountCard key={acc.id || acc.account_id} account={acc} onNavigate={onNavigate} />
          ))}

          {accounts.length === 0 && pendingOrders.length === 0 && (
            <div className="rounded-xl p-12 text-center" style={{ background: '#16181d', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-lg font-medium text-foreground mb-2">No accounts yet</div>
              <div className="text-sm text-muted-foreground mb-6">Start your first challenge to begin trading</div>
              <button onClick={onStartChallenge}
                className="px-6 py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
                style={{ background: 'hsl(var(--primary))' }}>
                Browse Challenges
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}