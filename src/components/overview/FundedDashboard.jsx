import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, RefreshCw, User, ChevronDown, Shield, Zap, Award, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { getAccountRules } from '../terminal/terminalConfig.js';

import ParticleBackground from './ParticleBackground.jsx';
import AccountSwitcher    from './AccountSwitcher.jsx';
import MetricCards        from './MetricCards.jsx';
import TradingObjectives  from './TradingObjectives.jsx';
import AnalyticsCharts    from './AnalyticsCharts.jsx';
import StatsGrid          from './StatsGrid.jsx';
import LiveStatusBar      from './LiveStatusBar.jsx';
import AccountTimeline    from './AccountTimeline.jsx';
import AIInsightsPanel    from './AIInsightsPanel.jsx';

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ onStartChallenge }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <motion.div
        animate={{ y: [-8, 8, -8], rotate: [0, 3, -3, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
        style={{
          background: 'linear-gradient(135deg, rgba(0,149,255,0.2), rgba(0,245,160,0.1))',
          border: '1px solid rgba(0,149,255,0.3)',
          boxShadow: '0 0 40px rgba(0,149,255,0.15)',
        }}>
        <Shield className="w-9 h-9 text-blue-400" />
      </motion.div>
      <h2 className="text-3xl font-black text-white mb-3">No Active Accounts</h2>
      <p className="text-sm text-white/40 mb-8 max-w-sm">
        Purchase a challenge to access your funded trader dashboard with full analytics and objectives tracking.
      </p>
      <motion.button
        whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(0,149,255,0.4)' }}
        whileTap={{ scale: 0.97 }}
        onClick={onStartChallenge}
        className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold text-white"
        style={{ background: 'linear-gradient(135deg, #0095ff, #00c8ff)', boxShadow: '0 8px 24px rgba(0,149,255,0.3)' }}>
        <Plus className="w-4 h-4" /> Get Funded Now
      </motion.button>
    </motion.div>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────
function DashboardHeader({ user, totalAccounts, onStartChallenge }) {
  return (
    <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="w-11 h-11 rounded-2xl flex items-center justify-center text-base font-black text-white flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, rgba(0,149,255,0.3), rgba(0,245,160,0.15))',
            border: '1px solid rgba(0,149,255,0.4)',
            boxShadow: '0 0 20px rgba(0,149,255,0.2)',
          }}>
          {user?.full_name?.charAt(0) || 'T'}
        </motion.div>
        <div>
          <h1 className="text-xl font-black text-white leading-tight">
            {user?.full_name || 'Trader'}{' '}
            <span className="text-blue-400/60 text-base font-normal">Dashboard</span>
          </h1>
          <div className="text-[10px] font-mono text-white/25 flex items-center gap-2 mt-0.5">
            <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            {totalAccounts} account{totalAccounts !== 1 ? 's' : ''} active
            <span>•</span>
            Robert Funds Platform
          </div>
        </div>
      </div>
      <motion.button
        whileHover={{ scale: 1.04, boxShadow: '0 0 24px rgba(0,149,255,0.3)' }}
        whileTap={{ scale: 0.97 }}
        onClick={onStartChallenge}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white"
        style={{
          background: 'linear-gradient(135deg, rgba(0,149,255,0.25), rgba(0,200,255,0.15))',
          border: '1px solid rgba(0,149,255,0.4)',
        }}>
        <Plus className="w-3.5 h-3.5" /> New Challenge
      </motion.button>
    </div>
  );
}

// ── Account info bar ──────────────────────────────────────────────────────────
function AccountInfoBar({ account }) {
  if (!account) return null;
  const items = [
    { label: 'Account Size', value: `$${(account.account_size || 0).toLocaleString()}` },
    { label: 'Type', value: account.challenge_type === 'instant' ? 'Instant' : '2-Step' },
    { label: 'Phase', value: (account.phase || 'phase1').replace('phase', 'Phase ') },
    { label: 'Leverage', value: account.leverage || '1:100' },
    { label: 'Platform', value: 'xTrading' },
    { label: 'Account ID', value: `#${account.account_id || account.id?.slice(0, 8) || 'N/A'}` },
  ];
  return (
    <motion.div
      key={account.id}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-px overflow-x-auto rounded-xl overflow-hidden mb-5 flex-shrink-0"
      style={{ background: 'rgba(0,149,255,0.05)', border: '1px solid rgba(0,149,255,0.1)' }}
    >
      {items.map((item, i) => (
        <div key={i} className="flex-1 px-4 py-2.5 min-w-[100px]"
          style={{ background: 'linear-gradient(135deg, rgba(8,12,24,0.95), rgba(12,18,35,0.95))' }}>
          <div className="text-[8px] font-mono uppercase text-white/25 tracking-widest">{item.label}</div>
          <div className="text-[11px] font-bold text-blue-400 mt-0.5 whitespace-nowrap">{item.value}</div>
        </div>
      ))}
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function FundedDashboard({ user, onStartChallenge, onNavigate }) {
  const { data: accounts = [], isLoading, refetch } = useQuery({
    queryKey: ['funded-dashboard-accounts'],
    queryFn: () => base44.entities.ChallengeAccount.list('-created_date', 50),
    refetchInterval: 30000,
  });

  const activeAccounts = accounts.filter(a =>
    ['active', 'funded', 'passed'].includes(a.status)
  );

  const [selectedAccount, setSelectedAccount] = useState(null);

  // Auto-select first account
  useEffect(() => {
    if (activeAccounts.length > 0 && !selectedAccount) {
      setSelectedAccount(activeAccounts[0]);
    }
  }, [activeAccounts.length]);

  // Keep selected in sync
  useEffect(() => {
    if (selectedAccount) {
      const fresh = activeAccounts.find(a => a.id === selectedAccount.id);
      if (fresh) setSelectedAccount(fresh);
    }
  }, [accounts]);

  const rules = getAccountRules(selectedAccount);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 rounded-full border-2 border-blue-500/30 border-t-blue-500" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen" style={{ background: 'linear-gradient(135deg, #020408, #040812, #060a14)' }}>
      {/* Particle background */}
      <ParticleBackground />

      {/* Content */}
      <div className="relative z-10 p-4 md:p-6 max-w-[1400px] mx-auto space-y-5">
        {/* Header */}
        <DashboardHeader user={user} totalAccounts={activeAccounts.length} onStartChallenge={onStartChallenge} />

        {activeAccounts.length === 0 ? (
          <EmptyState onStartChallenge={onStartChallenge} />
        ) : (
          <>
            {/* Live Status */}
            <LiveStatusBar account={selectedAccount} />

            {/* Account Switcher */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[10px] font-mono uppercase tracking-widest text-blue-400/50">
                  Select Account — {activeAccounts.length} Total
                </h2>
                <button onClick={() => refetch()}
                  className="flex items-center gap-1 text-[9px] font-mono text-white/20 hover:text-white/50 transition-colors">
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>
              <AccountSwitcher
                accounts={activeAccounts}
                selectedId={selectedAccount?.id}
                onSelect={setSelectedAccount}
              />
            </div>

            {/* Per-account content */}
            <AnimatePresence mode="wait">
              {selectedAccount && (
                <motion.div
                  key={selectedAccount.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-5"
                >
                  {/* Account info bar */}
                  <AccountInfoBar account={selectedAccount} />

                  {/* Metric cards */}
                  <MetricCards account={selectedAccount} rules={rules} />

                  {/* Objectives */}
                  <TradingObjectives account={selectedAccount} rules={rules} />

                  {/* Analytics + Timeline side-by-side */}
                  <div className="grid lg:grid-cols-3 gap-5">
                    <div className="lg:col-span-2">
                      <AnalyticsCharts account={selectedAccount} />
                    </div>
                    <AccountTimeline account={selectedAccount} />
                  </div>

                  {/* Stats + AI */}
                  <div className="grid lg:grid-cols-3 gap-5">
                    <div className="lg:col-span-2">
                      <StatsGrid account={selectedAccount} />
                    </div>
                    <AIInsightsPanel account={selectedAccount} />
                  </div>

                  {/* Quick actions */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'Open Terminal', icon: Zap, color: '#0095ff', page: 'terminal' },
                      { label: 'View Analytics', icon: TrendingUp, color: '#00f5a0', page: 'analytics' },
                      { label: 'Withdrawal', icon: Award, color: '#f59e0b', page: 'withdrawals' },
                      { label: 'Trade Journal', icon: Shield, color: '#a855f7', page: 'journal' },
                    ].map((a, i) => {
                      const Icon = a.icon;
                      return (
                        <motion.button key={a.label}
                          whileHover={{ y: -4, boxShadow: `0 0 20px ${a.color}30` }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => onNavigate?.(a.page)}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 + i * 0.05 }}
                          className="flex items-center gap-3 p-4 rounded-xl text-sm font-semibold transition-all"
                          style={{
                            background: `linear-gradient(135deg, ${a.color}10, ${a.color}05)`,
                            border: `1px solid ${a.color}20`,
                            color: 'rgba(255,255,255,0.8)',
                          }}>
                          <Icon className="w-4 h-4" style={{ color: a.color }} />
                          {a.label}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}