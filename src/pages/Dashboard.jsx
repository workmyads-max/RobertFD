import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardOverview from '../components/dashboard/DashboardOverview';
import EconomicCalendar from '../components/dashboard/EconomicCalendar';
import MarketNews from '../components/dashboard/MarketNews';
import TradingJournal from '../components/dashboard/TradingJournal';
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

  const renderPage = () => {
    switch (activePage) {
      case 'overview': return <DashboardOverview user={user} />;
      case 'calendar': return <EconomicCalendar />;
      case 'news': return <MarketNews />;
      case 'journal': return <TradingJournal user={user} />;
      case 'notifications': return <NotificationCenter notifications={notifications} />;
      case 'admin-notifications': return isAdmin ? <AdminNotifications /> : <DashboardOverview user={user} />;
      default: return <DashboardOverview user={user} />;
    }
  };

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

        <main className="flex-1 overflow-y-auto">
          <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePage}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
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