import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, RefreshCw, Shield, Zap, TrendingUp, Award, BookOpen } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { getAccountRules } from '../terminal/terminalConfig';
import { useAccountStats } from './useAccountStats';

import ParticleBackground   from './ParticleBackground.jsx';
import AccountSwitcher      from './AccountSwitcher.jsx';
import MetricCards          from './MetricCards.jsx';
import TradingObjectives    from './TradingObjectives.jsx';
import AnalyticsCharts      from './AnalyticsCharts.jsx';
import StatsGrid            from './StatsGrid.jsx';
import LiveStatusBar        from './LiveStatusBar.jsx';
import AccountTimeline      from './AccountTimeline.jsx';
import AIInsightsPanel      from './AIInsightsPanel.jsx';
import LiveTickerBar        from './LiveTickerBar.jsx';

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ onStartChallenge }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-32 text-center"
    >
      <motion.div
        animate={{ y: [-6, 6, -6] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="w-20 h-20 rounded-3xl flex items-center justify-center mb-8"
        style={{
          background: 'linear-gradient(145deg, rgba(59,130,246,0.12), rgba(6,182,212,0.06))',
          border: '1px solid rgba(59,130,246,0.2)',
          boxShadow: '0 0 48px rgba(59,130,246,0.08)',
        }}>
        <Shield className="w-9 h-9 text-blue-400/70" />
      </motion.div>
      <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">No Active Accounts</h2>
      <p className="text-[13px] text-white/35 mb-10 max-w-sm leading-relaxed font-light">
        Purchase a challenge to access the full funded trader operating system — real-time analytics, live objectives, and institutional-grade tools.
      </p>
      <motion.button
        whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(59,130,246,0.25)' }}
        whileTap={{ scale: 0.97 }}
        onClick={onStartChallenge}
        className="flex items-center gap-2.5 px-8 py-3.5 rounded-xl text-sm font-semibold text-white"
        style={{
          background: 'linear-gradient(135deg, rgba(59,130,246,0.9), rgba(6,182,212,0.7))',
          boxShadow: '0 8px 32px rgba(59,130,246,0.2)',
          border: '1px solid rgba(59,130,246,0.3)',
        }}>
        <Plus className="w-4 h-4" /> Get Started
      </motion.button>
    </motion.div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
function Header({ user, totalAccounts, onStartChallenge }) {
  return (
    <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.04] flex-wrap gap-4">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-semibold text-white flex-shrink-0"
          style={{
            background: 'linear-gradient(145deg, rgba(59,130,246,0.2), rgba(6,182,212,0.1))',
            border: '1px solid rgba(59,130,246,0.2)',
          }}>
          {user?.full_name?.charAt(0) || 'T'}
        </div>
        <div>
          <h1 className="text-lg font-semibold text-white tracking-tight leading-tight">
            {user?.full_name || 'Trader'}
          </h1>
          <div className="text-[10px] font-mono text-white/25 flex items-center gap-2 mt-0.5">
            <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            {totalAccounts} account{totalAccounts !== 1 ? 's' : ''} active · Robert Funds Platform
          </div>
        </div>
      </div>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onStartChallenge}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white"
        style={{
          background: 'rgba(59,130,246,0.12)',
          border: '1px solid rgba(59,130,246,0.25)',
        }}>
        <Plus className="w-3.5 h-3.5" /> New Challenge
      </motion.button>
    </div>
  );
}

// ─── Account info strip ───────────────────────────────────────────────────────
function AccountInfoStrip({ account }) {
  if (!account) return null;
  const items = [
    { label: 'Size',     value: `$${(account.account_size || 0).toLocaleString()}` },
    { label: 'Type',     value: account.challenge_type === 'instant' ? 'Instant' : 'Two-Step' },
    { label: 'Model',    value: account.account_type === 'swing' ? 'Swing' : 'Standard' },
    { label: 'Phase',    value: (account.phase || 'phase1').replace('phase', 'Phase ') },
    { label: 'Leverage', value: account.leverage || '1:100' },
    { label: 'Platform', value: account.platform || 'xTrading' },
    { label: 'ID',       value: `#${account.account_id || account.id?.slice(0, 8) || 'N/A'}` },
  ];
  return (
    <motion.div
      key={account.id}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex overflow-x-auto rounded-xl border border-white/[0.04] divide-x divide-white/[0.04]"
      style={{ background: 'rgba(8,14,28,0.7)', scrollbarWidth: 'none' }}
    >
      {items.map(item => (
        <div key={item.label} className="flex-1 px-4 py-3 min-w-[90px] flex-shrink-0">
          <div className="text-[8px] font-mono uppercase text-white/20 tracking-widest mb-1">{item.label}</div>
          <div className="text-[11px] font-semibold text-blue-400 whitespace-nowrap">{item.value}</div>
        </div>
      ))}
    </motion.div>
  );
}

// ─── Quick actions ────────────────────────────────────────────────────────────
function QuickActions({ onNavigate }) {
  const actions = [
    { label: 'Open Terminal', icon: Zap, color: '#3b82f6', page: 'terminal' },
    { label: 'Analytics', icon: TrendingUp, color: '#10b981', page: 'analytics' },
    { label: 'Withdrawal', icon: Award, color: '#8b5cf6', page: 'withdrawals' },
    { label: 'Trade Journal', icon: BookOpen, color: '#06b6d4', page: 'journal' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {actions.map((a, i) => {
        const Icon = a.icon;
        return (
          <motion.button key={a.label}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate?.(a.page)}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.05 }}
            className="flex items-center gap-3 p-4 rounded-xl text-sm font-medium text-white/70 hover:text-white transition-colors"
            style={{
              background: 'linear-gradient(145deg, rgba(8,14,28,0.98), rgba(10,18,38,0.95))',
              border: `1px solid rgba(255,255,255,0.06)`,
            }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${a.color}12`, border: `1px solid ${a.color}20` }}>
              <Icon className="w-4 h-4" style={{ color: a.color }} />
            </div>
            {a.label}
          </motion.button>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function FundedDashboard({ user, onStartChallenge, onNavigate }) {
  const { data: accounts = [], isLoading, refetch } = useQuery({
    queryKey: ['funded-dashboard-accounts'],
    queryFn: () => base44.entities.ChallengeAccount.list('-created_date', 50),
    refetchInterval: 20000,
  });

  const activeAccounts = accounts.filter(a => ['active', 'funded', 'passed'].includes(a.status));
  const [selectedAccount, setSelectedAccount] = useState(null);

  // Auto-select first account
  useEffect(() => {
    if (activeAccounts.length > 0 && !selectedAccount) {
      setSelectedAccount(activeAccounts[0]);
    }
  }, [activeAccounts.length]);

  // Keep selected in sync with refetches
  useEffect(() => {
    if (selectedAccount) {
      const fresh = activeAccounts.find(a => a.id === selectedAccount.id);
      if (fresh) setSelectedAccount(fresh);
    }
  }, [accounts]);

  // Load trade records for selected account (real stats)
  const { data: trades = [] } = useQuery({
    queryKey: ['trade-records', selectedAccount?.account_id],
    queryFn: () => base44.entities.TradeRecord.filter({ account_id: selectedAccount.account_id }),
    enabled: !!selectedAccount?.account_id,
    refetchInterval: 15000,
  });

  const rules = getAccountRules(selectedAccount);
  const stats = useAccountStats(selectedAccount, trades);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" style={{ background: '#030610' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          className="w-7 h-7 rounded-full border-2 border-blue-500/20 border-t-blue-500" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg, #020609, #030a16, #040c1a)' }}>
      {/* Particles */}
      <ParticleBackground />

      {/* Ticker bar */}
      <div className="relative z-20">
        <LiveTickerBar />
      </div>

      {/* Header */}
      <div className="relative z-10">
        <Header user={user} totalAccounts={activeAccounts.length} onStartChallenge={onStartChallenge} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 px-4 md:px-6 pb-8 max-w-[1440px] mx-auto w-full space-y-5 mt-5">
        {activeAccounts.length === 0 ? (
          <EmptyState onStartChallenge={onStartChallenge} />
        ) : (
          <>
            {/* Live status */}
            <LiveStatusBar account={selectedAccount} />

            {/* Account switcher */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-white/20">
                  Accounts — {activeAccounts.length} Active
                </span>
                <button onClick={() => refetch()}
                  className="flex items-center gap-1.5 text-[9px] font-mono text-white/20 hover:text-white/40 transition-colors">
                  <RefreshCw className="w-3 h-3" /> Sync
                </button>
              </div>
              <AccountSwitcher accounts={activeAccounts} selectedId={selectedAccount?.id} onSelect={setSelectedAccount} />
            </div>

            {/* Per-account section */}
            <AnimatePresence mode="wait">
              {selectedAccount && (
                <motion.div
                  key={selectedAccount.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-5"
                >
                  {/* Info strip */}
                  <AccountInfoStrip account={selectedAccount} />

                  {/* 6 metric cards */}
                  <MetricCards account={selectedAccount} rules={rules} stats={stats} />

                  {/* Objectives */}
                  <TradingObjectives account={selectedAccount} rules={rules} stats={stats} />

                  {/* Charts + Timeline */}
                  <div className="grid lg:grid-cols-3 gap-5">
                    <div className="lg:col-span-2">
                      <AnalyticsCharts account={selectedAccount} stats={stats} />
                    </div>
                    <AccountTimeline account={selectedAccount} />
                  </div>

                  {/* Stats + AI Insights */}
                  <div className="grid lg:grid-cols-5 gap-5">
                    <div className="lg:col-span-3">
                      <StatsGrid account={selectedAccount} stats={stats} />
                    </div>
                    <div className="lg:col-span-2">
                      <AIInsightsPanel account={selectedAccount} />
                    </div>
                  </div>

                  {/* Quick actions */}
                  <QuickActions onNavigate={onNavigate} />
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}