import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QuickWithdrawModal from './QuickWithdrawModal';
import { Plus, RefreshCw, Shield } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { getAccountRules } from '../terminal/terminalConfig';
import { useAccountStats } from './useAccountStats';
import ThreePathsToFunded from '../dashboard/ThreePathsToFunded';
import FirstTimePromoBanner from '../dashboard/FirstTimePromoBanner';
import NewsAlertsBar from '../dashboard/NewsAlertsBar';
import AffiliateSection from '../dashboard/AffiliateSection';
import Footer from '../dashboard/Footer';

import ParticleBackground   from './ParticleBackground.jsx';
import AccountSwitcher      from './AccountSwitcher.jsx';
import UnifiedWelcomeHeader from './UnifiedWelcomeHeader.jsx';
import FloatingDailyPnL     from '../terminal/FloatingDailyPnL.jsx';
import AccountTimeline      from './AccountTimeline.jsx';
import NotificationBanner   from '../dashboard/NotificationBanner.jsx';

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
    { label: 'Type',     value: account.status === 'funded' ? 'Funded Live' : account.challenge_type === 'instant' ? 'Instant' : account.challenge_type === 'instant_light' ? 'Inst.Light' : 'Two-Step' },
    { label: 'Model',    value: account.account_type === 'swing' ? 'Swing' : 'Standard' },
    { label: 'Phase',    value: account.status === 'funded' ? 'Funded' : (account.phase || 'phase1').replace('phase', 'Phase ') },
    { label: 'Leverage', value: account.leverage || '1:100' },
    { label: 'Platform', value: account.platform || 'MT5' },
  ];
  return (
    <motion.div key={account.id} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
      className="flex overflow-x-auto rounded-xl border glass scrollbar-hide -mx-2 px-2"
      style={{ borderColor: 'rgba(255,255,255,0.1)', scrollbarWidth: 'none' }}>
      {items.map((item, idx) => (
        <div key={item.label} className="px-3 sm:px-4 py-2.5 min-w-[80px] sm:min-w-[90px] flex-shrink-0 border-r border-white/[0.06] last:border-r-0">
          <div className="text-[8px] sm:text-[9px] font-mono uppercase text-muted-foreground tracking-wider mb-0.5">{item.label}</div>
          <div className="text-[10px] sm:text-[11px] font-semibold text-primary whitespace-nowrap truncate max-w-[90px] sm:max-w-none">{item.value}</div>
        </div>
      ))}
    </motion.div>
  );
}



// ─── Main component ───────────────────────────────────────────────────────────
export default function FundedDashboard({ user, kyc, onStartChallenge, onNavigate, bannerNotification }) {
  // Refetch user to get latest avatar_url/profile_photo_url
  const { data: currentUser = user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      try { return await base44.auth.me() || user; } catch { return user; }
    },
    enabled: !!user?.id,
    staleTime: 30000,
  });

  const { data: accounts = [], isLoading, isFetching, refetch } = useQuery({
    // CRITICAL: Same email-scoped key as LiveDDGuard and all other account queries
    queryKey: ['challenge-accounts', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.ChallengeAccount.filter({ user_email: user.email }, '-created_date', 100);
    },
    enabled: !!user?.email,
    refetchInterval: 15000, // Reduced from 5s to prevent excessive polling
    staleTime: 60000, // Increased to 1min to prevent stale data flash
    placeholderData: (prev) => prev ?? [], // Keep previous data while refetching — prevents empty state flash
    initialData: undefined, // Don't use cached empty data on first load
  });

  // Use KYC from parent (Dashboard) to prevent duplicate queries and loading flash
  // kyc prop is loaded once in Dashboard with proper staleTime

  const activeAccounts = accounts.filter(a => ['active', 'funded', 'passed', 'pending'].includes(a.status));

  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  // Keep selectedAccount in sync: set on first data arrival, clear if it disappears
  const selectedId = selectedAccount?.id;
  const derivedSelected = activeAccounts.length > 0
    ? (activeAccounts.find(a => a.id === selectedId) ?? activeAccounts[0])
    : null;

  // Only call setState when the derived value actually changes to avoid re-render loops
  useEffect(() => {
    if (derivedSelected?.id !== selectedId) {
      setSelectedAccount(derivedSelected ?? null);
    }
  }, [derivedSelected?.id]);

  // Load trade records scoped to this account's MT5 account_id
  const { data: trades = [] } = useQuery({
    queryKey: ['trade-records', derivedSelected?.account_id],
    queryFn: () => base44.entities.TradeRecord.filter({ account_id: derivedSelected.account_id }),
    enabled: !!derivedSelected?.account_id,
    refetchInterval: 5000,
  });

  const stats = useAccountStats(derivedSelected, trades);

  // Only show full-page spinner on the very first load (no cached data yet)
  // During refetch, keep showing previous data (no empty state flash)
  const isInitialLoading = isLoading && !accounts.length;
  
  if (isInitialLoading) {
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
  const accountSize = derivedSelected?.account_size || 100000;
  const balance = derivedSelected?.balance || accountSize;
  const rules = getAccountRules(derivedSelected);

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
      {derivedSelected && openTrades.length > 0 && (
        <div className="fixed z-50" style={{ pointerEvents: 'none' }}>
          <div style={{ pointerEvents: 'auto' }}>
            <FloatingDailyPnL
              floatPnl={floatPnl}
              dailyClosedPnl={derivedSelected?.daily_pnl || 0}
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
      <div className="relative z-10 px-4 sm:px-6 md:px-8 lg:px-12 pb-8 sm:pb-10 max-w-[1920px] mx-auto w-full mt-14 sm:mt-6 min-h-[60vh]">

        {/* Unified Welcome Header + Status Bar */}
        <UnifiedWelcomeHeader user={currentUser} kyc={kyc} onStartChallenge={onStartChallenge} />

        {/* Promotion Banner — below welcome header */}
        {bannerNotification && (
          <div className="mt-4 rounded-xl overflow-hidden">
            <NotificationBanner notification={bannerNotification} />
          </div>
        )}

        {/* Main content area with proper spacing */}
        <div className="space-y-8 mt-8 min-h-[40vh]">
          {/* First-Time Promo Banner — ALWAYS SHOWN */}
          <FirstTimePromoBanner onStartChallenge={() => onNavigate?.('marketplace')} />

          {/* Live News Alerts Bar — high-impact upcoming events ticker */}
          <NewsAlertsBar onNavigate={onNavigate} />

          {activeAccounts.length === 0 ? (
            <EmptyState onStartChallenge={onStartChallenge} />
          ) : (
            <>
              {/* Account Switcher */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-muted-foreground">
                    {activeAccounts.length} Active Account{activeAccounts.length !== 1 ? 's' : ''}
                  </span>
                  <button onClick={() => refetch()}
                    className="flex items-center gap-1.5 text-[9px] font-mono text-muted-foreground hover:text-foreground transition-colors">
                    <RefreshCw className="w-3 h-3" /> Sync
                  </button>
                </div>
                <AccountSwitcher accounts={activeAccounts} selectedId={derivedSelected?.id} onSelect={setSelectedAccount} onNavigate={onNavigate} />
              </div>

              {/* Per-account content */}
              {derivedSelected && (
                <motion.div
                  key={derivedSelected.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-4">
                  {/* Info strip */}
                  <AccountInfoStrip account={derivedSelected} />
                  {/* Progress Timeline */}
                  <AccountTimeline
                    account={derivedSelected}
                    closedTrades={trades.filter(t => t.status === 'closed')}
                    onNavigate={onNavigate}
                    onRequestWithdrawal={() => setShowWithdrawModal(true)}
                    user={currentUser}
                  />
                </motion.div>
              )}
            </>
          )}

          {/* Three Paths to Funded Trading — ALWAYS SHOWN */}
          <ThreePathsToFunded onNavigate={onNavigate} />
          
          {/* Affiliate Section — ALWAYS SHOWN */}
          <AffiliateSection onNavigate={onNavigate} />
          
          {/* Footer — ALWAYS SHOWN */}
          <Footer />
        </div>
      </div>

      {/* Quick Withdraw Modal */}
      {showWithdrawModal && (
        <QuickWithdrawModal
          accounts={activeAccounts.filter(a => a.status === 'funded')}
          user={currentUser}
          onClose={() => setShowWithdrawModal(false)}
          onSuccess={() => { setShowWithdrawModal(false); onNavigate?.('withdrawals'); }}
          onNavigateSettings={() => { setShowWithdrawModal(false); onNavigate?.('settings'); }}
        />
      )}
    </div>
  );
}