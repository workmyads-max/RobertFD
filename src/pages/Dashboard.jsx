import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardOverviewAdvanced from '../components/dashboard/DashboardOverviewAdvanced';
import DashboardOverview from '../components/dashboard/DashboardOverview';
import FundedDashboard from '../components/overview/FundedDashboard';
import MyAccounts from '../components/dashboard/MyAccounts';

import Analytics from '../components/dashboard/Analytics';
import Leaderboard from '../components/dashboard/Leaderboard';
import TradingJournal from '../components/dashboard/TradingJournal';
import Billing from '../components/dashboard/Billing';
import Withdrawals from '../components/dashboard/Withdrawals';
import Certificates from '../components/dashboard/Certificates';
import Affiliate from '../components/dashboard/Affiliate';
import Support from '../components/dashboard/Support';
import DashboardSettings from '../components/dashboard/DashboardSettings';
import NotificationCenter from '../components/dashboard/NotificationCenter';
import NotificationBanner from '../components/dashboard/NotificationBanner';
import AdminNotifications from '../components/dashboard/AdminNotifications';
import AdminPaymentControl from '../components/admin/AdminPaymentControl';
import ChallengeMarketplace from '../components/dashboard/ChallengeMarketplace';
import DashboardCheckout from '../components/dashboard/DashboardCheckout';
import AdminDashboard from '../components/admin/AdminDashboard';
import AdminOrders from '../components/admin/AdminOrders';
import AdminAccounts from '../components/admin/AdminAccounts';
import AdminPlatformSettings from '../components/admin/AdminPlatformSettings';
import AdminChallenges from '../components/admin/AdminChallenges';
import AdminTerminalControl from '../components/admin/AdminTerminalControl';
import AdminRiskManagement from '../components/admin/AdminRiskManagement';
import AdminMatchTrader from '../components/admin/AdminMatchTrader';
import AdminMT5Configuration from '../components/admin/AdminMT5Configuration';
import AdminRiskDetection from '../components/admin/AdminRiskDetection';
import AdminRiskCenter from '../components/admin/AdminRiskCenter';
import AdminStaffManagement from '../components/admin/AdminStaffManagement';
import AdminRolesPermissions from '../components/admin/AdminRolesPermissions';
import AdminFundedReview from '../components/admin/AdminFundedReview';
import UserWarningPanel from '../components/dashboard/UserWarningPanel';
import AdminWithdrawals from '../components/admin/AdminWithdrawals';
import AdminPaymentReview from '../components/admin/AdminPaymentReview';
import AdminSupport from '../components/admin/AdminSupport';
import AdminUsers from '../components/admin/AdminUsers';
import AdminKYC from '../components/admin/AdminKYC';
import AdminLiveChat from '../components/admin/AdminLiveChat';
import AdminUserManagement from '../components/admin/AdminUserManagement';
import PlatformVisibilityControl from '../components/admin/PlatformVisibilityControl';
import DashboardPopupNotification from '../components/dashboard/DashboardPopupNotification';
import KYC from '../components/dashboard/KYC';
import MyPerformance from '../components/performance/MyPerformance';
import AdminCoupons from '../components/admin/AdminCoupons';
import AdminAppeals from '../components/admin/AdminAppeals';
import AdminAffiliate from '../components/admin/AdminAffiliate';
import AdminSocialMedia from '../components/admin/AdminSocialMedia';
import EmailLogsDashboard from '../components/admin/EmailLogsDashboard';
import AdminPromotions from '../components/admin/AdminPromotions';
import AdminFirstTimeDiscount from '../components/admin/AdminFirstTimeDiscount';
import MarketsHub from '../components/dashboard/MarketsHub';
import LiveDDGuard from '../components/dashboard/LiveDDGuard';
import DDBreachModal from '../components/dashboard/DDBreachModal';

import AccountOverview from '../components/dashboard/AccountOverview';
import TrashAccounts from '../components/dashboard/TrashAccounts';

import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useFeatureVisibility } from '../hooks/useFeatureVisibility';
import { useCustomAuth } from '@/lib/CustomAuthContext';

export default function Dashboard() {
  const { isEnabled } = useFeatureVisibility();
  const [activePage, setActivePage] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Handle URL parameter for account-overview navigation
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    const accountId = params.get('account');
    if (tab === 'account-overview') {
      setActivePage('account-overview');
      // Store account ID for AccountOverview to use
      if (accountId) {
        sessionStorage.setItem('selectedAccountId', accountId);
      }
      // Clean up URL after navigation
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Reset collapsed state on mobile
  useEffect(() => {
    const checkMobile = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { user, isAdmin: isUserAdmin } = useCustomAuth();

  // ── Google signup referral attribution ──────────────────────────────────
  useEffect(() => {
    if (!user?.email) return;
    const pendingRef = sessionStorage.getItem('xf_pending_ref');
    if (!pendingRef) return;
    sessionStorage.removeItem('xf_pending_ref');
    
    // Process affiliate attribution for Google signup
    (async () => {
      try {
        // Check if user already has an affiliate profile
        const existingProfiles = await base44.entities.AffiliateProfile.filter({ user_email: user.email });
        if (existingProfiles.length > 0) return; // Already attributed
        
        const referrers = await base44.entities.AffiliateProfile.filter({ referral_code: pendingRef });
        if (referrers.length > 0) {
          const referrer = referrers[0];
          const newCode = 'RF' + Math.random().toString(36).slice(2, 8).toUpperCase();
          await base44.entities.AffiliateProfile.create({
            user_email: user.email,
            referral_code: newCode,
            referred_by_code: pendingRef,
            referred_by_email: referrer.user_email,
            tier: 'standard',
            total_earned: 0, total_pending: 0, total_paid: 0,
            referral_clicks: 0, total_referrals: 0, conversions: 0,
            active_funded_traders: 0, is_active: true, is_frozen: false,
          });
          await base44.entities.AffiliateProfile.update(referrer.id, {
            total_referrals: (referrer.total_referrals || 0) + 1,
          });
        }
      } catch (e) {
        console.error('[Dashboard] Affiliate attribution error (non-blocking):', e);
      }
    })();
  }, [user?.email]);

  const { data: rawNotifications = [] } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: () => base44.entities.Notification.filter({ is_active: true }),
    refetchInterval: 30000,
    enabled: !!user,
  });

  const isAdmin = isUserAdmin || user?.role === 'admin';

  const { data: allAccounts = [] } = useQuery({
    // CRITICAL: Always scope the cache key by user email to prevent cross-user cache leakage
    queryKey: ['challenge-accounts', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.ChallengeAccount.filter({ user_email: user.email }, '-created_date', 100);
    },
    enabled: !!user?.email,
  });

  // CRITICAL: Only count accounts belonging to the current user (allAccounts is already email-filtered)
  const primaryActiveAccount = allAccounts.find(a => a.status === 'active' || a.status === 'funded' || a.status === 'passed') || null;
  const failedAccountsCount = allAccounts.filter(a => a.status === 'failed').length;

  // SECURITY: Filter notifications by target audience
  const hasFundedAccount = allAccounts.some(a => a.status === 'funded');
  const hasChallengeAccount = allAccounts.some(a => ['active', 'passed', 'pending'].includes(a.status));
  const notifications = rawNotifications.filter(n => {
    if (n.target === 'all') return true;
    if (n.target === 'admin') return isAdmin;
    if (n.target === 'funded') return hasFundedAccount;
    if (n.target === 'challenge') return hasChallengeAccount;
    return true;
  });

  const bannerNotification = notifications.find(n =>
    n.is_active && (n.display_mode === 'banner' || n.display_mode === 'all')
  );
  // Find the most recent active popup notification that hasn't been dismissed this session
  const [dismissedPopupIds, setDismissedPopupIds] = useState(new Set());
  const popupNotification = notifications
    .filter(n => n.is_active && (n.display_mode === 'popup' || n.display_mode === 'all'))
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .find(n => !dismissedPopupIds.has(n.id)) || null;

  const [activeAccount, setActiveAccount] = useState(null);
  const [checkoutOrder, setCheckoutOrder] = useState(null);
  const [ddBreach, setDdBreach] = useState(null);

  const handleDDBreach = (breach) => {
    setDdBreach(breach);
  };

  // Navigate to in-dashboard marketplace instead of external page
  const goToChallenge = () => setActivePage('marketplace');

  const handleProceedToCheckout = (orderData) => {
    setCheckoutOrder(orderData);
    setActivePage('checkout');
  };

  const openTerminalForAccount = (account) => {
    setActiveAccount(account);
    setActivePage('terminal');
  };

  const openAnalyticsForAccount = (account) => {
    setActiveAccount(account);
    setActivePage('analytics');
  };

  const handleAccountSwitch = (account) => {
    setActiveAccount(account);
  };

  const renderPage = () => {
    switch (activePage) {
      case 'overview': return <FundedDashboard user={user} onStartChallenge={goToChallenge} onNavigate={setActivePage} />;
      case 'accounts': return <MyAccounts user={user} onStartChallenge={goToChallenge} onOpenTerminal={openTerminalForAccount} onOpenAnalytics={openAnalyticsForAccount} />;
      case 'account-overview': return <AccountOverview user={user} onStartChallenge={goToChallenge} onNavigate={setActivePage} />;
      case 'trash': return <TrashAccounts onStartChallenge={goToChallenge} />;
      case 'analytics': return <Analytics onStartChallenge={goToChallenge} />;
      case 'markets': return <MarketsHub />;
      case 'leaderboard': return <Leaderboard />;
      case 'journal': return <TradingJournal user={user} />;
      case 'billing': return <Billing />;
      case 'withdrawals': return <Withdrawals user={user} onNavigate={setActivePage} />;
      case 'certificates': return <Certificates user={user} />;
      case 'affiliate': return <Affiliate user={user} />;
      case 'kyc': return <KYC user={user} />;
      case 'support': return <Support />;
      case 'settings': return <DashboardSettings user={user} />;
      case 'notifications': return <NotificationCenter notifications={notifications} />;
      case 'admin-overview': return isAdmin ? <AdminDashboard /> : <DashboardOverview user={user} onStartChallenge={goToChallenge} />;
      case 'admin-orders': return isAdmin ? <AdminOrders /> : <DashboardOverview user={user} onStartChallenge={goToChallenge} />;
      case 'admin-accounts': return isAdmin ? <AdminAccounts /> : <DashboardOverview user={user} onStartChallenge={goToChallenge} />;
      case 'admin-withdrawals': return isAdmin ? <AdminWithdrawals /> : <DashboardOverview user={user} onStartChallenge={goToChallenge} />;
      case 'admin-support': return isAdmin ? <AdminSupport /> : <DashboardOverview user={user} onStartChallenge={goToChallenge} />;
      case 'admin-users': return isAdmin ? <AdminUsers /> : <DashboardOverview user={user} onStartChallenge={goToChallenge} />;
      case 'admin-notifications': return isAdmin ? <AdminNotifications /> : <DashboardOverview user={user} onStartChallenge={goToChallenge} />;
      case 'admin-wallets': return isAdmin ? <AdminPaymentControl /> : <DashboardOverview user={user} onStartChallenge={goToChallenge} />;
      case 'admin-payment-review': return isAdmin ? <AdminPaymentReview /> : <DashboardOverview user={user} onStartChallenge={goToChallenge} />;
      case 'admin-kyc': return isAdmin ? <AdminKYC /> : <DashboardOverview user={user} onStartChallenge={goToChallenge} />;
      case 'admin-livechat': return isAdmin ? <AdminLiveChat /> : <DashboardOverview user={user} onStartChallenge={goToChallenge} />;
      case 'admin-platforms': return isAdmin ? <AdminPlatformSettings /> : <DashboardOverview user={user} onStartChallenge={goToChallenge} />;
      case 'admin-challenges': return isAdmin ? <AdminChallenges /> : <DashboardOverview user={user} onStartChallenge={goToChallenge} />;
      case 'admin-terminal': return isAdmin ? <AdminTerminalControl /> : <DashboardOverview user={user} onStartChallenge={goToChallenge} />;
      case 'admin-risk-detection': return isAdmin ? <AdminRiskDetection /> : <DashboardOverview user={user} onStartChallenge={goToChallenge} />;
      case 'admin-risk-center': return isAdmin ? <AdminRiskCenter /> : <DashboardOverview user={user} onStartChallenge={goToChallenge} />;
      case 'admin-funded-review': return isAdmin ? <AdminFundedReview /> : <DashboardOverview user={user} onStartChallenge={goToChallenge} />;
      case 'admin-risk': return isAdmin ? <AdminRiskManagement /> : <DashboardOverview user={user} onStartChallenge={goToChallenge} />;
      case 'admin-match-trader': return isAdmin ? <AdminMatchTrader /> : <DashboardOverview user={user} onStartChallenge={goToChallenge} />;
      case 'admin-users': return isAdmin ? <AdminUserManagement /> : <DashboardOverviewAdvanced user={user} onStartChallenge={goToChallenge} onNavigate={setActivePage} />;
      case 'admin-visibility': return isAdmin ? <PlatformVisibilityControl /> : <DashboardOverview user={user} onStartChallenge={goToChallenge} />;
      case 'marketplace': return <ChallengeMarketplace onProceedToCheckout={handleProceedToCheckout} />;
      case 'checkout': return <DashboardCheckout initialOrder={checkoutOrder} onBack={() => setActivePage('marketplace')} onComplete={() => setActivePage('accounts')} />;
      case 'performance': return <MyPerformance user={user} />;
      case 'admin-coupons': return isAdmin ? <AdminCoupons /> : <DashboardOverview user={user} onStartChallenge={goToChallenge} />;
      case 'admin-appeals': return isAdmin ? <AdminAppeals /> : <DashboardOverview user={user} onStartChallenge={goToChallenge} />;
      case 'admin-affiliate': return isAdmin ? <AdminAffiliate /> : <DashboardOverview user={user} onStartChallenge={goToChallenge} />;
      case 'admin-social': return isAdmin ? <AdminSocialMedia /> : <DashboardOverview user={user} onStartChallenge={goToChallenge} />;
      case 'admin-email-logs': return isAdmin ? <EmailLogsDashboard /> : <DashboardOverview user={user} onStartChallenge={goToChallenge} />;
      case 'admin-staff': return isAdmin ? <AdminStaffManagement /> : <DashboardOverview user={user} onStartChallenge={goToChallenge} />;
      case 'admin-roles': return isAdmin ? <AdminRolesPermissions /> : <DashboardOverview user={user} onStartChallenge={goToChallenge} />;
      case 'admin-promotions': return isAdmin ? <AdminPromotions /> : <DashboardOverview user={user} onStartChallenge={goToChallenge} />;
      case 'admin-first-time-discount': return isAdmin ? <AdminFirstTimeDiscount /> : <DashboardOverview user={user} onStartChallenge={goToChallenge} />;
      default: return <DashboardOverviewAdvanced user={user} onStartChallenge={goToChallenge} onNavigate={setActivePage} />;
    }
  };

  const isTerminal  = activePage === 'terminal';
  const isOverview  = activePage === 'overview';

  return (
    <div className="min-h-screen bg-background text-foreground font-inter flex flex-col relative overflow-hidden">
      {/* Clean dark background — no animated overlays */}

      {bannerNotification && <NotificationBanner notification={bannerNotification} />}
      {popupNotification && <DashboardPopupNotification notification={popupNotification} onClose={() => setDismissedPopupIds(prev => new Set([...prev, popupNotification.id]))} />}
      {user && <UserWarningPanel user={user} />}

      {/* Live DD Guard — runs every 15s when trader has dashboard open */}
      {user && !isAdmin && <LiveDDGuard onBreach={handleDDBreach} />}
      <DDBreachModal breach={ddBreach} onAcknowledge={() => { setDdBreach(null); setActivePage('accounts'); }} />


      <div className="flex flex-1 overflow-hidden relative z-10">
        <DashboardSidebar
          activePage={activePage}
          setActivePage={setActivePage}
          user={user}
          isAdmin={isAdmin}
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
          unreadCount={notifications.filter(n => n.display_mode !== 'banner').length}
          trashCount={failedAccountsCount}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />

        <main className={`flex-1 overflow-y-auto ${isTerminal ? 'overflow-hidden' : ''}`}
          style={!isTerminal ? { background: 'transparent' } : {}}>
          <div className={isTerminal ? 'h-full' : 'p-3 pt-14 sm:pt-4 sm:p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto min-h-screen'}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activePage}
                initial={{ opacity: 0, y: isTerminal ? 0 : 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: isTerminal ? 0 : -16 }}
                transition={{ duration: 0.3 }}
                className={isTerminal ? 'h-full' : ''}
              >
                {renderPage()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}