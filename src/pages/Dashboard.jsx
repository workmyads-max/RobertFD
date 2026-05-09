import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardOverview from '../components/dashboard/DashboardOverview';
import MyAccounts from '../components/dashboard/MyAccounts';
import XTradingTerminal from '../components/dashboard/XTradingTerminal';
import Analytics from '../components/dashboard/Analytics';
import EconomicCalendar from '../components/dashboard/EconomicCalendar';
import MarketNews from '../components/dashboard/MarketNews';
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
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function Dashboard() {
  const [activePage, setActivePage] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const isAdmin = user?.role === 'admin';

  const goToChallenge = () => {
    window.location.href = '/checkout';
  };

  const renderPage = () => {
    switch (activePage) {
      case 'overview': return <DashboardOverview user={user} onStartChallenge={goToChallenge} />;
      case 'accounts': return <MyAccounts onStartChallenge={goToChallenge} />;
      case 'terminal': return <XTradingTerminal />;
      case 'analytics': return <Analytics />;
      case 'calendar': return <EconomicCalendar />;
      case 'news': return <MarketNews />;
      case 'journal': return <TradingJournal user={user} />;
      case 'billing': return <Billing />;
      case 'withdrawals': return <Withdrawals />;
      case 'certificates': return <Certificates />;
      case 'affiliate': return <Affiliate />;
      case 'support': return <Support />;
      case 'settings': return <DashboardSettings user={user} />;
      case 'notifications': return <NotificationCenter notifications={notifications} />;
      case 'admin-notifications': return isAdmin ? <AdminNotifications /> : <DashboardOverview user={user} onStartChallenge={goToChallenge} />;
      default: return <DashboardOverview user={user} onStartChallenge={goToChallenge} />;
    }
  };

  const isTerminal = activePage === 'terminal';

  return (
    <div className="min-h-screen bg-background text-foreground font-inter flex flex-col">
      {bannerNotification && <NotificationBanner notification={bannerNotification} />}

      <div className="flex flex-1 overflow-hidden">
        <DashboardSidebar
          activePage={activePage}
          setActivePage={setActivePage}
          user={user}
          isAdmin={isAdmin}
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
          unreadCount={notifications.filter(n => n.display_mode !== 'banner').length}
        />

        <main className={`flex-1 overflow-y-auto ${isTerminal ? 'overflow-hidden' : ''}`}>
          <div className={isTerminal ? 'h-full' : 'p-6 md:p-8 max-w-[1400px] mx-auto'}>
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