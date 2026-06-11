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
import WelcomeHeader        from './WelcomeHeader.jsx';
import FloatingDailyPnL     from '../terminal/FloatingDailyPnL.jsx';
import SocialMediaWidget    from './SocialMediaWidget.jsx';

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ onStartChallenge }) {
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-32 text-center">
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-8"
        style={{ background: 'rgba(255,92,0,0.08)', border: '1px solid rgba(255,92,0,0.2)' }}>
        <Shield className="w-9 h-9 text-primary" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-3 tracking-tight">No Active Accounts</h2>
      <p className="text-[13px] text-muted-foreground mb-10 max-w-sm leading-relaxed font-light">
        Purchase a challenge to access the full funded trader platform — real-time analytics, live objectives, and institutional-grade tools.
      </p>
      <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onStartChallenge}
        className="flex items-center gap-2.5 px-8 py-3.5 rounded-xl text-sm font-semibold text-white"
        style={{ background: '#FF5C00' }}>
        <Plus className="w-4 h-4" /> Get Started
      </motion.button>
    </motion.div>
  );
}

// ─── Account info strip ───────────────────────────────────────────────────────
function AccountInfoStrip({ account }) {
  if (!account) return null;
  const items = [
    { label: 'Size',     value: `$${(account.account_size || 0).toLocaleString()}` },
    { label: 'Type',     value: account.challenge_type === 'instant' ? 'Instant' : account.challenge_type === 'instant_light' ? 'Inst.Light' : 'Two-Step' },
    { label: 'Model',    value: account.account_type === 'swing' ? 'Swing' : 'Standard' },
    { label: 'Phase',    value: (account.phase || 'phase1').replace('phase', 'Phase ') },
    { label: 'Leverage', value: account.leverage || '1:100' },
    { label: 'Platform', value: account.platform || 'xTrading' },
    { label: 'ID',       value: `#${account.account_id || account.id?.slice(0, 8) || 'N/A'}` },
  ];
  return (
    <motion.div key={account.id} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
      className="flex overflow-x-auto rounded-xl border divide-x glass scrollbar-hide"
      style={{ borderColor: 'rgba(255,255,255,0.1)', scrollbarWidth: 'none' }}>
      {items.map(item => (
        <div key={item.label} className="flex-1 px-2 sm:px-3 md:px-4 py-2 sm:py-3 min-w-[70px] sm:min-w-[80px] flex-shrink-0 border-r border-white/[0.06] last:border-r-0">
          <div className="text-[7px] sm:text-[8px] font-mono uppercase text-muted-foreground tracking-wider sm:tracking-widest mb-0.5 sm:mb-1">{item.label}</div>
          <div className="text-[9px] sm:text-[10px] md:text-[11px] font-semibold text-primary whitespace-nowrap truncate max-w-full">{item.value}</div>
        </div>
      ))}
    </motion.div>
  );
}

// ─── Quick actions ────────────────────────────────────────────────────────────
function QuickActions({ onNavigate }) {
  const actions = [
    { label: 'Open Terminal', icon: Zap, color: '#FF5C00', page: 'terminal' },
    { label: 'Analytics', icon: TrendingUp, color: '#FF5C00', page: 'analytics' },
    { label: 'Withdrawal', icon: Award, color: '#FF5C00', page: 'withdrawals' },
    { label: 'Trade Journal', icon: BookOpen, color: '#FF5C00', page: 'journal' },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
      {actions.map((a, i) => {
        const Icon = a.icon;
        return (
          <motion.button key={a.label} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate?.(a.page)}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.04 }}
            className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 lg:p-4 rounded-xl text-xs sm:text-sm font-medium glass-light hover:bg-white/[0.06] transition-all border border-white/[0.09] text-foreground/70 hover:text-foreground">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${a.color}12`, border: `1px solid ${a.color}20` }}>
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: a.color }} />
            </div>
            <span className="hidden sm:inline">{a.label}</span><span className="sm:hidden text-[10px]">{a.label === 'Open Terminal' ? 'Terminal' : a.label === 'Trade Journal' ? 'Journal' : a.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function FundedDashboard({ user, onStartChallenge, onNavigate }) {
  // Refetch user to get latest avatar_url/profile_photo_url
  const { data: currentUser = user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const me = await base44.auth.me();
      return me || user;
    },
    enabled: !!user?.id,
    refetchInterval: 10000, // Refetch every 10s to catch profile updates
  });

  const { data: accounts = [], isLoading, refetch } = useQuery({
    queryKey: ['funded-dashboard-accounts', user?.email],
    queryFn: () => base44.entities.ChallengeAccount.filter({ user_email: user?.email }),
    enabled: !!user?.email,
    refetchInterval: 5000, // 5s for near-live P&L sync from terminal
  });

  // Load KYC for welcome header
  const { data: kycList = [] } = useQuery({
    queryKey: ['kyc-status', user?.email],
    queryFn: () => base44.entities.KYCVerification.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });
  const kyc = kycList[0] || null;

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

  // Load REAL trade records — fast refetch for live floating P&L
  const { data: trades = [] } = useQuery({
    queryKey: ['trade-records', selectedAccount?.id],
    queryFn: () => base44.entities.TradeRecord.filter({ account_id: selectedAccount.id }),
    enabled: !!selectedAccount?.id,
    refetchInterval: 5000,
  });

  const stats = useAccountStats(selectedAccount, trades);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-background">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          className="w-7 h-7 rounded-full border-2 border-primary/20 border-t-primary" />
      </div>
    );
  }

  // Derive open trades for floating P&L widget
  const openTrades = trades.filter(t => t.status === 'open');
  const floatPnl = openTrades.reduce((s, t) => s + (t.pnl || 0), 0);
  const accountSize = selectedAccount?.account_size || 100000;
  const balance = selectedAccount?.balance || accountSize;
  const rules = getAccountRules(selectedAccount);

  return (
    <div className="relative min-h-screen flex flex-col bg-background overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute top-0 left-1/4 w-[700px] h-[500px] rounded-full blur-[140px] opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, #FF5C00, transparent)' }} />
      </div>
      {/* Particles */}
      <ParticleBackground />

      {/* Floating Daily P&L — shown when open positions exist */}
      {selectedAccount && openTrades.length > 0 && (
        <div className="fixed z-50" style={{ pointerEvents: 'none' }}>
          <div style={{ pointerEvents: 'auto' }}>
            <FloatingDailyPnL
              floatPnl={floatPnl}
              dailyClosedPnl={selectedAccount?.daily_pnl || 0}
              accountSize={accountSize}
              dailyDDLimit={rules?.dailyDDLimit || 5}
              dailyOpenBalance={balance}
              equity={balance + floatPnl}
              visible={openTrades.length > 0}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex-1 px-3 sm:px-4 md:px-6 lg:px-8 pb-6 sm:pb-8 max-w-[1440px] mx-auto w-full space-y-3 sm:space-y-4 mt-14 sm:mt-4">

        {/* Welcome Header */}
        <WelcomeHeader user={currentUser} kyc={kyc} onStartChallenge={onStartChallenge} />

        {activeAccounts.length === 0 ? (
          <EmptyState onStartChallenge={onStartChallenge} />
        ) : (
          <>
            {/* Live status + account switcher row */}
            <LiveStatusBar account={selectedAccount} />

            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-muted-foreground">
                  {activeAccounts.length} Active Account{activeAccounts.length !== 1 ? 's' : ''}
                </span>
                <button onClick={() => refetch()}
                  className="flex items-center gap-1.5 text-[9px] font-mono text-muted-foreground hover:text-foreground transition-colors">
                  <RefreshCw className="w-3 h-3" /> Sync
                </button>
              </div>
              <AccountSwitcher accounts={activeAccounts} selectedId={selectedAccount?.id} onSelect={setSelectedAccount} />
            </div>

            {/* Per-account content */}
            <AnimatePresence mode="wait">
              {selectedAccount && (
                <motion.div key={selectedAccount.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-4">

                  {/* Info strip */}
                  <AccountInfoStrip account={selectedAccount} />

                  {/* Objectives */}
                  <TradingObjectives account={selectedAccount} rules={rules} stats={stats} />
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}