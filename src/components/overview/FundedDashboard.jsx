import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, RefreshCw, Shield } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { getAccountRules } from '../terminal/terminalConfig';
import { useAccountStats } from './useAccountStats';
import ThreePathsToFunded from '../dashboard/ThreePathsToFunded';
import FirstTimePromoBanner from '../dashboard/FirstTimePromoBanner';
import AffiliateSection from '../dashboard/AffiliateSection';
import Footer from '../dashboard/Footer';

import ParticleBackground   from './ParticleBackground.jsx';
import AccountSwitcher      from './AccountSwitcher.jsx';
import UnifiedWelcomeHeader from './UnifiedWelcomeHeader.jsx';
import FloatingDailyPnL     from '../terminal/FloatingDailyPnL.jsx';

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

// ─── Stats Cards Grid ─────────────────────────────────────────────────────────
function StatsCards({ stats }) {
  if (!stats) return null;
  
  const statCards = [
    { label: 'Balance', value: `$${stats.balance.toLocaleString()}`, color: '#FF5C00' },
    { label: 'Equity', value: `$${stats.equity.toLocaleString()}`, color: '#10b981' },
    { label: 'P&L', value: `${stats.pnl >= 0 ? '+' : ''}$${stats.pnl.toLocaleString()}`, color: stats.pnl >= 0 ? '#10b981' : '#ef4444' },
    { label: 'Daily P&L', value: `${stats.dailyPnl >= 0 ? '+' : ''}$${stats.dailyPnl.toLocaleString()}`, color: stats.dailyPnl >= 0 ? '#10b981' : '#ef4444' },
    { label: 'Win Rate', value: `${stats.winRate.toFixed(1)}%`, color: '#3b82f6' },
    { label: 'Trades', value: stats.totalTrades.toString(), color: '#8b5cf6' },
    { label: 'Daily DD', value: `${stats.dailyDDPct.toFixed(2)}%`, color: stats.dailyDDPct > 4 ? '#ef4444' : '#f59e0b' },
    { label: 'Max DD', value: `${stats.maxDDPct.toFixed(2)}%`, color: stats.maxDDPct > 8 ? '#ef4444' : '#f59e0b' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {statCards.map((stat) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-3 sm:p-4 rounded-xl border glass"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <div className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
            {stat.label}
          </div>
          <div className="text-lg sm:text-xl font-bold" style={{ color: stat.color }}>
            {stat.value}
          </div>
        </motion.div>
      ))}
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

  const { data: accounts = [], isLoading: accountsLoading, refetch, isFetching } = useQuery({
    queryKey: ['funded-dashboard-accounts', user?.id],
    queryFn: async () => {
      console.log('[FundedDashboard] === FETCHING ACCOUNTS ===');
      console.log('[FundedDashboard] User ID:', user?.id);
      console.log('[FundedDashboard] User Email:', user?.email);
      console.log('[FundedDashboard] User metadata:', user?.user_metadata);
      
      // CRITICAL: Try multiple query approaches
      const emailToUse = user?.email || user?.user_metadata?.email;
      console.log('[FundedDashboard] Email to use:', emailToUse);
      
      if (!emailToUse) {
        console.error('[FundedDashboard] NO EMAIL AVAILABLE - Cannot query accounts');
        return [];
      }
      
      console.log('[FundedDashboard] Query filter:', { user_email: emailToUse });
      const result = await base44.entities.ChallengeAccount.filter({ user_email: emailToUse });
      console.log('[FundedDashboard] Accounts fetched:', result.length);
      if (result.length > 0) {
        console.log('[FundedDashboard] First account:', { 
          id: result[0]?.id, 
          user_email: result[0]?.user_email,
          account_size: result[0]?.account_size,
          status: result[0]?.status 
        });
      }
      return result;
    },
    enabled: !!user?.id, // Only need user ID - email can come from metadata
    refetchInterval: 5000, // 5s for near-live P&L sync from terminal
    retry: 3,
    retryDelay: 1000,
  });

  console.log('[FundedDashboard] Query state - accounts:', accounts.length, 'isLoading:', accountsLoading, 'isFetching:', isFetching, 'user.email:', user?.email, 'user.id:', user?.id);

  // Load KYC for welcome header
  const { data: kycList = [] } = useQuery({
    queryKey: ['kyc-status', user?.email],
    queryFn: () => base44.entities.KYCVerification.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });
  const kyc = kycList[0] || null;

  const activeAccounts = accounts.filter(a => ['active', 'funded', 'passed'].includes(a.status));
  const [selectedAccount, setSelectedAccount] = useState(null);

  // Auto-select first account - FIXED: proper dependencies for mobile
  useEffect(() => {
    console.log('[FundedDashboard] activeAccounts:', activeAccounts.length, activeAccounts.map(a => ({ id: a.id, status: a.status, size: a.account_size })));
    if (activeAccounts.length > 0 && !selectedAccount) {
      console.log('[FundedDashboard] Auto-selecting account:', activeAccounts[0].id);
      setSelectedAccount(activeAccounts[0]);
    }
  }, [activeAccounts, selectedAccount]);

  // Keep selected in sync with refetches
  useEffect(() => {
    if (selectedAccount && activeAccounts.length > 0) {
      const fresh = activeAccounts.find(a => a.id === selectedAccount.id);
      if (fresh) setSelectedAccount(fresh);
    }
  }, [accounts, selectedAccount, activeAccounts]);

  // Load REAL trade records — fast refetch for live floating P&L
  const { data: trades = [] } = useQuery({
    queryKey: ['trade-records', selectedAccount?.id],
    queryFn: () => base44.entities.TradeRecord.filter({ account_id: selectedAccount.id }),
    enabled: !!selectedAccount?.id,
    refetchInterval: 5000,
  });

  const stats = useAccountStats(selectedAccount, trades);

  // Show loading state while accounts are fetching — prevents empty state flash on mobile
  // CRITICAL: Must check isFetching too, not just isLoading, to handle refetches
  const isAnyLoading = accountsLoading || isFetching || (!user?.id);
  
  if (isAnyLoading && accounts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-background">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          className="w-7 h-7 rounded-full border-2 border-primary/20 border-t-primary" />
      </div>
    );
  }

  console.log('[FundedDashboard] Render - accounts:', accounts.length, 'activeAccounts:', activeAccounts.length, 'selectedAccount:', selectedAccount?.id, 'isAnyLoading:', isAnyLoading);

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
      <div className="relative z-10 flex-1 px-3 sm:px-4 md:px-6 lg:px-8 pb-6 sm:pb-8 w-full max-w-full space-y-4 sm:space-y-6 mt-14 sm:mt-6">

        {/* TEMPORARY DEBUG: Remove after confirming mobile works */}
        <div className="px-3 py-2 rounded-lg text-xs font-mono font-bold" style={{ background: 'rgba(255,92,0,0.15)', color: '#FF5C00', border: '1px solid rgba(255,92,0,0.3)' }}>
          DEBUG: Accounts={accounts.length} | Active={activeAccounts.length} | Loading={isAnyLoading ? 'YES' : 'NO'} | UserID={user?.id || 'NULL'} | Email={user?.email || user?.user_metadata?.email || 'NULL'}
        </div>

        {/* Unified Welcome Header + Status Bar */}
        <UnifiedWelcomeHeader user={currentUser} kyc={kyc} onStartChallenge={onStartChallenge} />

        {/* Debug: show account count in console */}
        {console.log('[FundedDashboard] Rendering - activeAccounts:', activeAccounts.length, 'isAnyLoading:', isAnyLoading)}
        
        {/* CRITICAL FIX: Only show empty state when we're SURE data has arrived */}
        {activeAccounts.length === 0 && !isAnyLoading ? (
          <EmptyState onStartChallenge={onStartChallenge} />
        ) : (
          <>
            {/* First-Time Promo Banner - FULL WIDTH on mobile */}
            <FirstTimePromoBanner onStartChallenge={() => onNavigate?.('marketplace')} />

            {/* Account Switcher - Full width container */}
            <div className="space-y-3 w-full">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-muted-foreground">
                  {activeAccounts.length} Active Account{activeAccounts.length !== 1 ? 's' : ''}
                </span>
                <button onClick={() => refetch()}
                  className="flex items-center gap-1.5 text-[9px] font-mono text-muted-foreground hover:text-foreground transition-colors">
                  <RefreshCw className="w-3 h-3" /> Sync
                </button>
              </div>
              <AccountSwitcher accounts={activeAccounts} selectedId={selectedAccount?.id} onSelect={setSelectedAccount} onNavigate={onNavigate} />
            </div>

            {/* Per-account content */}
            <AnimatePresence mode="wait">
              {selectedAccount && (
                <motion.div key={selectedAccount.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-4 sm:space-y-6">

                  {/* Info strip */}
                  <AccountInfoStrip account={selectedAccount} />

                  {/* Stats Cards */}
                  <StatsCards stats={stats} />

                  {/* Three Paths to Funded Trading */}
                  <ThreePathsToFunded onNavigate={onNavigate} />
                  
                  {/* Affiliate Section */}
                  <AffiliateSection onNavigate={onNavigate} />
                  
                  {/* Footer */}
                  <Footer />
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}