import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, BarChart3, Key, CalendarDays, Info,
  TrendingUp, TrendingDown, Activity, Zap, ChevronRight
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import CredentialsModal from './CredentialsModal';

function fmt(n, d = 2) { return (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }); }

function useCopyText() {
  const [copied, setCopied] = useState(null);
  const copy = (val, key) => { navigator.clipboard.writeText(val).catch(() => {}); setCopied(key); setTimeout(() => setCopied(null), 1800); };
  return { copied, copy };
}

function Card({ children, className = '', accent = false }) {
  return (
    <div className={`rounded-2xl overflow-hidden ${className}`}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: accent ? '1px solid rgba(255,92,0,0.25)' : '1px solid rgba(255,255,255,0.07)',
        boxShadow: accent ? '0 0 30px rgba(255,92,0,0.06)' : 'none',
      }}>
      {children}
    </div>
  );
}

// ─── Active Account Card ─────────────────────────────────────────────────────
function ActiveAccountCard({ account, onNavigate, liveEquity, liveUnrealizedPnl, setShowCredentials }) {
  const { copied, copy } = useCopyText();
  if (!account) return null;

  const balance = account.balance ?? account.account_size ?? 0;
  const equity = liveEquity ?? (account.equity ?? balance);
  const unrealizedPnl = liveUnrealizedPnl ?? (equity - balance);
  const todayPnl = account.daily_pnl ?? 0;
  const challengeLabel = account.challenge_type === 'two-step' ? '2-Step Challenge'
    : account.challenge_type === 'instant' ? 'Instant Funding' : 'Instant Light';
  const statusLabel = account.status === 'active' ? 'Active' : account.status === 'passed' ? 'Passed'
    : account.status === 'funded' ? 'Funded' : account.status;
  const statusColor = account.status === 'active' ? '#10b981' : account.status === 'funded' ? '#FF5C00'
    : account.status === 'passed' ? '#60a5fa' : '#94a3b8';
  const phase = (account.phase || 'phase1').replace('phase', 'Phase ');
  const progressPct = Math.min((account.profit_target_progress || 0) / (account.rule_snapshot?.phase1_target || 10) * 100, 100);
  const endDate = account.provisioned_at
    ? new Date(new Date(account.provisioned_at).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  const metrics = [
    { label: "Today's P&L", value: `${todayPnl >= 0 ? '+' : ''}$${fmt(todayPnl)}`, color: todayPnl >= 0 ? '#10b981' : '#ef4444', icon: todayPnl >= 0 ? TrendingUp : TrendingDown },
    { label: 'Live Equity', value: `$${fmt(equity)}`, color: '#60a5fa', icon: Activity },
    { label: 'Unrealized PnL', value: `${unrealizedPnl >= 0 ? '+' : ''}$${fmt(unrealizedPnl)}`, color: unrealizedPnl >= 0 ? '#10b981' : '#ef4444', icon: Zap },
  ];

  return (
    <Card accent>
      {/* Top header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide"
                style={{ background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}35` }}>
                ● {statusLabel}
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md"
                style={{ background: 'rgba(255,92,0,0.12)', color: '#FF5C00', border: '1px solid rgba(255,92,0,0.2)' }}>
                {phase}
              </span>
            </div>
            <div className="text-lg font-black text-white tracking-tight">{challengeLabel}</div>
            <div className="text-xs font-mono text-white/40 mt-0.5">MT5 Login: {account.mt_login || '—'} · {account.leverage || '1:100'} leverage</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-white/30 mb-0.5">Account Size</div>
            <div className="text-2xl font-black text-white">${(account.account_size || 0).toLocaleString()}</div>
            <div className="text-[10px] text-white/30 mt-0.5 font-mono">Exp: {endDate}</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-[10px] font-semibold mb-1.5">
            <span className="text-white/40">Profit Target Progress</span>
            <span style={{ color: '#FF5C00' }}>{progressPct.toFixed(1)}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <motion.div className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              style={{ background: 'linear-gradient(90deg, #FF5C00, #FF8A3D)' }} />
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-t border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <button
          onClick={() => setShowCredentials?.(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all"
          style={{ background: 'rgba(255,92,0,0.12)', border: '1px solid rgba(255,92,0,0.25)', color: '#FF5C00' }}>
          <Key className="w-3.5 h-3.5" />
          View Credentials
        </button>
        <button onClick={() => onNavigate?.('accounts')}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: '#94a3b8' }}>
          <CalendarDays className="w-3.5 h-3.5" />
          Account Metrics
        </button>
        <button onClick={() => onNavigate?.('accounts')}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold ml-auto transition-all hover:opacity-90"
          style={{ background: 'rgba(255,92,0,0.12)', border: '1px solid rgba(255,92,0,0.25)', color: '#FF5C00' }}>
          Full Detail <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-3">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="px-5 py-4 text-center relative"
              style={{ borderRight: i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-white/35 mb-2">
                <Icon className="w-3 h-3" /> {m.label}
              </div>
              <div className="text-xl font-black tracking-tight" style={{ color: m.color }}>{m.value}</div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Main AccountOverview ─────────────────────────────────────────────────────
export default function AccountOverview({ onStartChallenge, onNavigate }) {
  const queryClient = useQueryClient();
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showCredentials, setShowCredentials] = useState(false);

  useEffect(() => {
    const unsub = base44.entities.ChallengeAccount.subscribe((event) => {
      if (event.type === 'update' || event.type === 'create') {
        queryClient.setQueryData(['challenge-accounts'], (old = []) =>
          event.type === 'create' ? [event.data, ...old] : old.map(a => a.id === event.id ? event.data : a)
        );
        if (event.type === 'update') queryClient.invalidateQueries({ queryKey: ['challenge-account-live'] });
      }
    });
    return unsub;
  }, [queryClient]);

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['challenge-accounts'],
    queryFn: () => base44.entities.ChallengeAccount.list('-created_date', 50),
    refetchInterval: 5000, staleTime: 3000,
  });

  const activeAccounts = accounts.filter(a => ['active', 'funded', 'passed'].includes(a.status));
  const account = selectedAccount
    ? (accounts.find(a => a.id === selectedAccount.id) || selectedAccount)
    : (activeAccounts[0] || null);

  const { data: livePositionsData } = useQuery({
    queryKey: ['live-positions-overview', account?.account_id],
    queryFn: async () => {
      const res = await base44.functions.invoke('getLivePositions', { account_id: account.account_id });
      return res?.data?.positions || [];
    },
    enabled: !!account?.account_id,
    refetchInterval: 5000, staleTime: 3000,
  });

  const livePositions = livePositionsData || [];
  const liveUnrealizedPnl = livePositions.reduce((s, p) => s + (p.pnl || 0), 0);
  const liveEquity = livePositions.length > 0
    ? (account?.balance || account?.account_size || 0) + liveUnrealizedPnl
    : (account?.equity || account?.balance || account?.account_size || 0);

  if (isLoading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!account) return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
        style={{ background: 'rgba(255,92,0,0.06)', border: '1px solid rgba(255,92,0,0.15)' }}>
        <BarChart3 className="w-9 h-9 text-primary/40" />
      </div>
      <div className="text-2xl font-black text-foreground mb-2">No Active Accounts</div>
      <div className="text-sm text-white/40 mb-8 max-w-sm leading-relaxed">Purchase a challenge to unlock the full institutional account overview.</div>
      <button onClick={onStartChallenge}
        className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold text-white hover:scale-105 transition-all"
        style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)', boxShadow: '0 6px 24px rgba(255,92,0,0.3)' }}>
        <Plus className="w-4 h-4" /> Start New Challenge
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-sm font-bold text-foreground">Active Accounts</span>
          {activeAccounts.length > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(255,92,0,0.1)', color: '#FF5C00', border: '1px solid rgba(255,92,0,0.2)' }}>
              {activeAccounts.length}
            </span>
          )}
        </div>
      </div>

      {/* Account selector */}
      {activeAccounts.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {activeAccounts.map(a => (
            <button key={a.id} onClick={() => setSelectedAccount(a)}
              className="flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-mono transition-all"
              style={{
                background: account?.id === a.id ? 'rgba(255,92,0,0.1)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${account?.id === a.id ? 'rgba(255,92,0,0.35)' : 'rgba(255,255,255,0.07)'}`,
                color: account?.id === a.id ? '#FF5C00' : '#94a3b8',
              }}>
              <div className="font-black">{a.account_id}</div>
              <div className="text-[10px] opacity-60 mt-0.5">${(a.account_size || 0).toLocaleString()}</div>
            </button>
          ))}
        </div>
      )}

      {/* Active account card */}
      <ActiveAccountCard account={account} onNavigate={onNavigate} liveEquity={liveEquity} liveUnrealizedPnl={liveUnrealizedPnl} setShowCredentials={setShowCredentials} />

      {/* Minimal footer */}
      <div className="rounded-2xl px-5 py-3.5 flex items-center gap-3"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <Info className="w-4 h-4 text-white/20 shrink-0" />
        <p className="text-[11px] text-white/30 leading-relaxed">
          Account Metrics values are informative only. Real-time trading data can be verified directly in the MT5 platform.
        </p>
      </div>

      {/* Credentials Modal */}
      {showCredentials && (
        <CredentialsModal
          account={account}
          onClose={() => setShowCredentials(false)}
        />
      )}
    </div>
  );
}