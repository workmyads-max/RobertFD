import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardOverviewAdvanced from '../components/dashboard/DashboardOverviewAdvanced';
import DashboardOverview from '../components/dashboard/DashboardOverview';
import FundedDashboard from '../components/overview/FundedDashboard';
import MyAccounts from '../components/dashboard/MyAccounts';

import Analytics from '../components/dashboard/Analytics';
import EconomicCalendar from '../components/dashboard/EconomicCalendar';
import MarketNews from '../components/dashboard/MarketNews';
import CalendarNews from '../components/dashboard/CalendarNews';
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
import { useSupabaseAuth } from '@/lib/SupabaseAuthContext';
import { useB44TokenReady } from '@/hooks/useB44TokenReady';
import { useChallengeAccounts, useNotifications } from '@/hooks/useSupabaseQuery';

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
  const { user: supabaseUser } = useSupabaseAuth();
  // Use Supabase email for entity queries — works reliably on mobile
  const userEmail = supabaseUser?.email || user?.email;

  const { data: notifications = [] } = useNotifications({ enabled: !!user });

  const bannerNotification = notifications.find(n =>
    n.is_active && (n.display_mode === 'banner' || n.display_mode === 'all')
  );

  // Disabled popup notifications for now
  const popupNotification = null;

  // isAdmin: check all possible locations — Supabase stores role in user_metadata/app_metadata
  const isAdmin = isUserAdmin
    || user?.role === 'admin'
    || user?.user_metadata?.role === 'admin'
    || user?.app_metadata?.role === 'admin'
    || supabaseUser?.user_metadata?.role === 'admin'
    || supabaseUser?.app_metadata?.role === 'admin';

  const { data: allAccounts = [] } = useChallengeAccounts();

  const primaryActiveAccount = allAccounts.find(a => a.status === 'active' || a.status === 'funded' || a.status === 'passed') || null;
  const failedAccountsCount = allAccounts.filter(a => a.status === 'failed').length;

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
      case 'accounts': return <MyAccounts onStartChallenge={goToChallenge} onOpenTerminal={openTerminalForAccount} onOpenAnalytics={openAnalyticsForAccount} />;
      case 'account-overview': return <AccountOverview onStartChallenge={goToChallenge} onNavigate={setActivePage} />;
      case 'trash': return <TrashAccounts onStartChallenge={goToChallenge} />;
      case 'analytics': return <Analytics onStartChallenge={goToChallenge} />;
      case 'markets': return <MarketsHub />;
      case 'calendar': return <CalendarNews />;
      case 'news': return <CalendarNews />;
      case 'calendar-news': return <CalendarNews />;
      case 'leaderboard': return <Leaderboard />;
      case 'journal': return <TradingJournal user={user} />;
      case 'billing': return <Billing />;
      case 'withdrawals': return <Withdrawals user={user} />;
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
      case 'admin-mt5-config': return isAdmin ? <AdminMT5Configuration /> : <DashboardOverview user={user} onStartChallenge={goToChallenge} />;
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
      {popupNotification && <DashboardPopupNotification notification={popupNotification} />}
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
          <div className={isTerminal ? 'h-full' : isOverview ? '' : 'p-3 pt-12 sm:pt-4 sm:p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto min-h-screen'}>
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