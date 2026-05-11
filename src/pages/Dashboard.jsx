import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardOverviewAdvanced from '../components/dashboard/DashboardOverviewAdvanced';
import DashboardOverview from '../components/dashboard/DashboardOverview';
import FundedDashboard from '../components/overview/FundedDashboard';
import MyAccounts from '../components/dashboard/MyAccounts';
import ProTradingTerminal from '../components/dashboard/ProTradingTerminal';
import Analytics from '../components/dashboard/Analytics';
import EconomicCalendar from '../components/dashboard/EconomicCalendar';
import MarketNews from '../components/dashboard/MarketNews';
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
import AdminWalletSettings from '../components/admin/AdminWalletSettings';
import ChallengeMarketplace from '../components/dashboard/ChallengeMarketplace';
import DashboardCheckout from '../components/dashboard/DashboardCheckout';
import AdminDashboard from '../components/admin/AdminDashboard';
import AdminOrders from '../components/admin/AdminOrders';
import AdminAccounts from '../components/admin/AdminAccounts';
import AdminPlatformSettings from '../components/admin/AdminPlatformSettings';
import AdminChallenges from '../components/admin/AdminChallenges';
import AdminTerminalControl from '../components/admin/AdminTerminalControl';
import AdminRiskManagement from '../components/admin/AdminRiskManagement';
import AdminWithdrawals from '../components/admin/AdminWithdrawals';
import AdminSupport from '../components/admin/AdminSupport';
import AdminUsers from '../components/admin/AdminUsers';
import AdminKYC from '../components/admin/AdminKYC';
import AdminLiveChat from '../components/admin/AdminLiveChat';
import AdminUserManagement from '../components/admin/AdminUserManagement';
import DashboardPopupNotification from '../components/dashboard/DashboardPopupNotification';
import KYC from '../components/dashboard/KYC';

import AccountOverview from '../components/dashboard/AccountOverview';
import XCopier from '../components/dashboard/XCopier';
import TrashAccounts from '../components/dashboard/TrashAccounts';
import TradingBackground from '../components/dashboard/TradingBackground';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function Dashboard() {
  const [activePage, setActivePage] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => base44.entities.Notification.filter({ is_active: true }),
    refetchInterval: 30000,
  });

  const bannerNotification = notifications.find(n =>
    n.is_active && (n.display_mode === 'banner' || n.display_mode === 'all')
  );

  const popupNotification = notifications.find(n =>
    n.is_active && (n.display_mode === 'popup' || n.display_mode === 'all')
  );

  const isAdmin = user?.role === 'admin';

  const { data: allAccounts = [] } = useQuery({
    queryKey: ['challenge-accounts'],
    queryFn: () => base44.entities.ChallengeAccount.list('-created_date', 50),
    enabled: !!user,
  });

  const primaryActiveAccount = allAccounts.find(a => a.status === 'active' || a.status === 'funded' || a.status === 'passed') || null;
  const failedAccountsCount = allAccounts.filter(a => a.status === 'failed').length;

  const [activeAccount, setActiveAccount] = useState(null);
  const [checkoutOrder, setCheckoutOrder] = useState(null);

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
      case 'terminal': return <ProTradingTerminal account={activeAccount || primaryActiveAccount} allAccounts={allAccounts} onAccountChange={handleAccountSwitch} />;
      case 'xcopier': return <XCopier />;
      case 'trash': return <TrashAccounts onStartChallenge={goToChallenge} />;
      case 'analytics': return <Analytics onStartChallenge={goToChallenge} />;
      case 'calendar': return <EconomicCalendar />;
      case 'news': return <MarketNews />;
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
      case 'admin-wallets': return isAdmin ? <AdminWalletSettings /> : <DashboardOverview user={user} onStartChallenge={goToChallenge} />;
      case 'admin-kyc': return isAdmin ? <AdminKYC /> : <DashboardOverview user={user} onStartChallenge={goToChallenge} />;
      case 'admin-livechat': return isAdmin ? <AdminLiveChat /> : <DashboardOverview user={user} onStartChallenge={goToChallenge} />;
      case 'admin-platforms': return isAdmin ? <AdminPlatformSettings /> : <DashboardOverview user={user} onStartChallenge={goToChallenge} />;
      case 'admin-challenges': return isAdmin ? <AdminChallenges /> : <DashboardOverview user={user} onStartChallenge={goToChallenge} />;
      case 'admin-terminal': return isAdmin ? <AdminTerminalControl /> : <DashboardOverview user={user} onStartChallenge={goToChallenge} />;
      case 'admin-risk': return isAdmin ? <AdminRiskManagement /> : <DashboardOverview user={user} onStartChallenge={goToChallenge} />;
      case 'admin-users': return isAdmin ? <AdminUserManagement /> : <DashboardOverviewAdvanced user={user} onStartChallenge={goToChallenge} onNavigate={setActivePage} />;
      case 'marketplace': return <ChallengeMarketplace onProceedToCheckout={handleProceedToCheckout} />;
      case 'checkout': return <DashboardCheckout initialOrder={checkoutOrder} onBack={() => setActivePage('marketplace')} onComplete={() => setActivePage('accounts')} />;
      default: return <DashboardOverviewAdvanced user={user} onStartChallenge={goToChallenge} onNavigate={setActivePage} />;
    }
  };

  const isTerminal  = activePage === 'terminal';
  const isOverview  = activePage === 'overview';

  return (
    <div className="min-h-screen bg-background text-foreground font-inter flex flex-col relative overflow-hidden">
      {/* Animated trading background — skip on overview & terminal (they have their own) */}
      {!isTerminal && !isOverview && <TradingBackground />}

      {bannerNotification && <NotificationBanner notification={bannerNotification} />}
      {popupNotification && <DashboardPopupNotification notification={popupNotification} />}


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
          <div className={isTerminal ? 'h-full' : isOverview ? '' : 'p-6 md:p-8 max-w-[1400px] mx-auto'}>
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