import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Menu, X, PanelLeftOpen, LogOut, Zap, Shield, ShoppingBag, Wallet, DollarSign, HeadphonesIcon, Users, Bell, ShieldCheck, MessageCircle, Activity, Globe, Cpu, Sliders, AlertTriangle, Tag, Share2, Mail } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import XFLogo from '../shared/XFLogo';
import { useFeatureVisibility } from '@/hooks/useFeatureVisibility';
import { useStaffPermissions } from '@/hooks/useStaffPermissions';

export default function DashboardSidebar({ activePage, setActivePage, user, isAdmin, isOpen, setIsOpen, unreadCount, trashCount, collapsed, setCollapsed }) {
  const { isEnabled } = useFeatureVisibility();
  const { hasPermission, isAdminLevel } = useStaffPermissions(user);

  const handleNav = (page) => {
    setActivePage(page);
    setIsOpen(false);
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: Shield, prominent: true },
    { id: 'accounts', label: 'My Accounts', icon: Wallet },
    { id: 'account-overview', label: 'Account Overview', icon: Wallet },
    { id: 'analytics', label: 'Analytics', icon: Zap },
    { id: 'markets', label: 'Markets', icon: Activity },
    { id: 'calendar', label: 'Calendar', icon: Globe },
    { id: 'news', label: 'News', icon: Zap },
    { id: 'journal', label: 'Journal', icon: Zap },
    { id: 'leaderboard', label: 'Leaderboard', icon: Zap },
    { id: 'affiliate', label: 'Affiliate', icon: Users },
    { id: 'certificates', label: 'Certificates', icon: Zap },
    { id: 'withdrawals', label: 'Withdrawals', icon: DollarSign },
    { id: 'billing', label: 'Billing', icon: Zap },
    { id: 'kyc', label: 'KYC', icon: ShieldCheck },
    { id: 'support', label: 'Support', icon: HeadphonesIcon },
    { id: 'settings', label: 'Settings', icon: Sliders },
    { id: 'marketplace', label: 'Buy Challenge', icon: Zap, highlight: true, prominent: true },
  ];

  const filterNavItems = () => {
    const visibilityMap = {
      'analytics': 'analytics',
      'markets': 'market_news',
      'journal': 'trading_journal',
      'affiliate': 'affiliate',
      'certificates': 'certificates',
      'withdrawals': 'withdrawals',
      'billing': 'billing',
      'leaderboard': 'leaderboard',
      'support': 'support',
      'notifications': 'notifications',
      'kyc': 'kyc',
    };

    return navItems.filter(item => {
      const featureKey = visibilityMap[item.id];
      return !featureKey || isEnabled(featureKey);
    });
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full circuit-bg">
      {/* Logo */}
      <div className={`flex items-center border-b ${collapsed ? 'justify-center px-3 py-4' : 'px-4 py-5'}`}
        style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <button 
          onClick={() => setCollapsed?.(!collapsed)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hover:opacity-80 transition-opacity">
          <XFLogo size={collapsed ? 'sm' : 'md'} animate />
        </button>
      </div>



      {/* Nav */}
      <nav className={`flex-1 py-3 sm:py-4 space-y-0.5 overflow-y-auto overscroll-contain ${collapsed ? 'px-1.5' : 'px-2.5'}`} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', marginTop: collapsed ? '0' : '68px' }}>
        {filterNavItems().map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center rounded-xl transition-all duration-150 group relative ${
                item.prominent ? 'text-[17px] font-black' : 'text-[15px] font-semibold'
              } ${
                collapsed ? 'justify-center px-2 py-2.5' : item.prominent ? 'gap-2.5 px-4 py-3.5' : 'gap-2.5 px-3 py-2.5'
              } ${
                isActive
                  ? 'text-white'
                  : item.id === 'trash'
                    ? 'text-red-400/60 hover:text-red-400 hover:bg-red-500/5'
                    : item.highlight && !isActive
                    ? 'text-accent hover:text-accent hover:bg-accent/10'
                    : 'text-white/35 hover:text-white/80 hover:bg-white/[0.05]'
              }`}
              style={item.prominent && !isActive ? {
                background: 'linear-gradient(135deg, rgba(115,255,0,0.25), rgba(115,255,0,0.12))',
                border: '2px solid rgba(115,255,0,0.5)',
                boxShadow: '0 0 20px rgba(115,255,0,0.3)',
              } : isActive ? {
                background: item.highlight
                  ? collapsed
                    ? 'rgba(115,255,0,0.25)'
                    : 'linear-gradient(90deg, rgba(115,255,0,0.2), rgba(115,255,0,0.1), rgba(115,255,0,0.06))'
                  : collapsed
                  ? 'rgba(255,92,0,0.18)'
                  : 'linear-gradient(90deg, rgba(255,92,0,0.15), rgba(139,92,246,0.06), rgba(255,92,0,0.04))',
                borderLeft: collapsed ? 'none' : `${item.prominent ? '3px' : '2px'} solid ${item.highlight ? '#73ff00' : '#FF5C00'}`,
                boxShadow: collapsed ? `0 0 12px rgba(${item.highlight ? '115,255,0' : '255,92,0'},0.2)` : `inset 0 0 20px rgba(${item.highlight ? '115,255,0' : '255,92,0'},0.05)`,
              } : item.highlight && !isActive ? {
                background: 'rgba(115,255,0,0.12)',
                border: '1px solid rgba(115,255,0,0.25)',
              } : {}}
            >
              <Icon className={`flex-shrink-0 transition-colors relative z-10 ${collapsed ? 'w-5 h-5' : item.prominent ? 'w-5 h-5' : 'w-4 h-4'} ${isActive ? (item.highlight ? 'text-accent' : 'text-primary') : item.id === 'trash' ? 'text-red-400/60 group-hover:text-red-400' : item.highlight ? 'text-accent group-hover:text-accent' : 'text-white/25 group-hover:text-white/60'}`} />
              {!collapsed && <span className="flex-1 text-left relative z-10">{item.label}</span>}
              {!collapsed && item.id === 'trash' && trashCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-red-500/80 text-white relative z-10">{trashCount}</span>
              )}
              {!collapsed && isActive && item.id !== 'trash' && <ChevronRight className={`${item.prominent ? 'w-4 h-4' : 'w-3 h-3'} text-primary/40 relative z-10`} />}
              {collapsed && trashCount > 0 && item.id === 'trash' && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
              )}
            </button>
          );
        })}

        {/* Notifications */}
        <button
          onClick={() => handleNav('notifications')}
          title={collapsed ? 'Notifications' : undefined}
          className={`w-full flex items-center rounded-xl text-[13px] font-medium transition-all duration-150 group relative ${
            collapsed ? 'justify-center px-2 py-2.5' : 'gap-2.5 px-3 py-2.5'
          } ${
            activePage === 'notifications'
              ? 'text-white'
              : 'text-white/35 hover:text-white/80 hover:bg-white/[0.05]'
          }`}
          style={activePage === 'notifications' ? {
            background: collapsed ? 'rgba(255,92,0,0.18)' : 'linear-gradient(90deg, rgba(255,92,0,0.15), rgba(139,92,246,0.06))',
            borderLeft: collapsed ? 'none' : '2px solid #FF5C00',
          } : {}}
        >
          <Bell className={`flex-shrink-0 ${collapsed ? 'w-5 h-5' : 'w-4 h-4'} ${activePage === 'notifications' ? 'text-primary' : 'text-white/25 group-hover:text-white/60'}`} />
          {!collapsed && <span className="flex-1 text-left">Notifications</span>}
          {!collapsed && unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white" style={{ background: '#FF5C00' }}>{unreadCount}</span>
          )}
          {collapsed && unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: '#FF5C00' }} />
          )}
        </button>

        {/* Admin only */}
        {isAdmin && (
          <>
            {!collapsed && (
              <div className="pt-3 pb-1 px-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,92,0,0.3), transparent)' }} />
                  <span className="text-[8px] sm:text-[9px] font-mono px-2 py-0.5 rounded-full whitespace-nowrap" style={{ color: '#FF5C00', background: 'rgba(255,92,0,0.1)', border: '1px solid rgba(255,92,0,0.2)' }}>⚡ ADMIN</span>
                  <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(255,92,0,0.3), transparent)' }} />
                </div>
              </div>
            )}
            {collapsed && <div className="my-2 mx-2 h-px" style={{ background: 'rgba(255,92,0,0.2)' }} />}
            {[{ id: 'admin-visibility', label: 'Platform Visibility', icon: Zap, permission: 'manage_settings' }].filter(item => isAdminLevel || hasPermission(item.permission)).map(item => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button key={item.id} onClick={() => handleNav(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center rounded-xl text-[12px] font-medium transition-all duration-150 group ${
                    collapsed ? 'justify-center px-2 py-2' : 'gap-2.5 px-3 py-2'
                  } ${
                    isActive ? 'text-white' : 'text-white/25 hover:text-white/70 hover:bg-white/[0.04]'
                  }`}
                  style={isActive ? {
                    background: collapsed ? 'rgba(255,92,0,0.18)' : 'linear-gradient(90deg, rgba(255,92,0,0.12), rgba(139,92,246,0.05))',
                    borderLeft: collapsed ? 'none' : '2px solid #FF5C00',
                  } : {}}>
                  <Icon className={`flex-shrink-0 ${collapsed ? 'w-4.5 h-4.5' : 'w-3.5 h-3.5'} ${isActive ? 'text-primary' : 'text-white/20 group-hover:text-white/50'}`} />
                  {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
                </button>
              );
            })}
            {[
              { id: 'admin-overview', label: 'Admin Overview', icon: Shield },
              { id: 'admin-orders', label: 'Orders', icon: ShoppingBag, permission: 'manage_payments' },
              { id: 'admin-accounts', label: 'Manage Accounts', icon: Wallet, permission: 'manage_challenges' },
              { id: 'admin-withdrawals', label: 'Withdrawals', icon: DollarSign, permission: 'manage_payouts' },
              { id: 'admin-support', label: 'Support Tickets', icon: HeadphonesIcon, permission: 'manage_support' },
              { id: 'admin-users', label: 'User Management', icon: Users, permission: 'manage_users' },
              { id: 'admin-notifications', label: 'Notifications', icon: Bell, permission: 'manage_notifications' },
              { id: 'admin-wallets', label: 'Payment Gateways', icon: Wallet, permission: 'manage_payments' },
              { id: 'admin-payment-review', label: 'Payment Review Queue', icon: Shield, permission: 'manage_payments' },
              { id: 'admin-kyc', label: 'KYC Review', icon: ShieldCheck, permission: 'manage_kyc' },
              { id: 'admin-livechat', label: 'Live Chat', icon: MessageCircle, permission: 'manage_support' },
              { id: 'admin-match-trader', label: 'Match Trader API', icon: Activity, permission: 'manage_settings' },
              { id: 'admin-mt5-config', label: 'MT5 Config', icon: Globe, permission: 'manage_settings' },
              { id: 'admin-platforms', label: 'Platforms API', icon: Cpu, permission: 'manage_settings' },
              { id: 'admin-challenges', label: 'Manage Challenges', icon: Zap, permission: 'manage_challenges' },
              { id: 'admin-terminal', label: 'Terminal Control', icon: Sliders, permission: 'manage_settings' },
              { id: 'admin-risk-detection', label: 'Risk Detection', icon: Shield, permission: 'manage_risk' },
              { id: 'admin-risk-center', label: 'Risk Center', icon: Shield, permission: 'manage_risk' },
              { id: 'admin-funded-review', label: 'Funded Review Queue', icon: ShieldCheck, permission: 'manage_risk' },
              { id: 'admin-risk', label: 'Risk Management', icon: AlertTriangle, permission: 'manage_risk' },
              { id: 'admin-coupons', label: 'Coupon Codes', icon: Tag, permission: 'manage_coupons' },
              { id: 'admin-appeals', label: 'Violation Appeals', icon: Shield, permission: 'manage_risk' },
              { id: 'admin-affiliate', label: 'Affiliate & IB', icon: Users, permission: 'manage_affiliates' },
              { id: 'admin-social', label: 'Social Media', icon: Share2, permission: 'manage_settings' },
              { id: 'admin-email-logs', label: 'Email Logs', icon: Mail, permission: 'manage_audit_logs' },
              { id: 'admin-staff', label: 'Staff Management', icon: Users, permission: 'manage_staff' },
              { id: 'admin-roles', label: 'Roles & Permissions', icon: Shield, permission: 'manage_staff' },
              { id: 'admin-promotions', label: 'Promotions', icon: Tag, permission: 'manage_settings' },
              ].filter(item => !item.permission || isAdminLevel || hasPermission(item.permission)).map(item => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button key={item.id} onClick={() => handleNav(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center rounded-xl text-[12px] font-medium transition-all duration-150 group ${
                    collapsed ? 'justify-center px-2 py-2' : 'gap-2.5 px-3 py-2'
                  } ${
                    isActive ? 'text-white' : 'text-white/25 hover:text-white/70 hover:bg-white/[0.04]'
                  }`}
                  style={isActive ? {
                    background: collapsed ? 'rgba(255,92,0,0.18)' : 'linear-gradient(90deg, rgba(255,92,0,0.12), rgba(139,92,246,0.05))',
                    borderLeft: collapsed ? 'none' : '2px solid #FF5C00',
                  } : {}}>
                  <Icon className={`flex-shrink-0 ${collapsed ? 'w-4.5 h-4.5' : 'w-3.5 h-3.5'} ${isActive ? 'text-primary' : 'text-white/20 group-hover:text-white/50'}`} />
                  {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
                  {!collapsed && isActive && <ChevronRight className="w-3 h-3 text-primary/40" />}
                </button>
              );
            })}
          </>
        )}
      </nav>

      {/* Bottom actions */}
      <div className={`pb-3 sm:pb-4 pt-2 border-t ${collapsed ? 'px-1.5 space-y-1 flex flex-col items-center' : 'px-3 space-y-0.5'}`} style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        {collapsed ? (
          <>
            <button onClick={() => setCollapsed?.(false)} title="Expand sidebar"
              className="w-9 h-9 flex items-center justify-center rounded-xl text-white/30 hover:text-white/60 transition-colors hover:bg-white/[0.05]">
              <PanelLeftOpen className="w-4 h-4" />
            </button>
            <button onClick={() => base44.auth.logout('/')} title="Sign Out"
              className="w-9 h-9 flex items-center justify-center rounded-xl text-white/30 hover:text-red-400 transition-colors hover:bg-red-500/5">
              <LogOut className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <a href="/" className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-white/30 hover:text-white/60 transition-colors">
              ← Back to site
            </a>
            <button onClick={() => base44.auth.logout('/')}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-white/30 hover:text-red-400 transition-colors">
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-3 left-3 sm:top-4 sm:left-4 z-50 md:hidden w-9 h-9 sm:w-10 sm:h-10 rounded-xl glass flex items-center justify-center shadow-lg"
      >
        {isOpen ? <X className="w-4 h-4 sm:w-5 sm:h-5" /> : <Menu className="w-4 h-4 sm:w-5 sm:h-5" />}
      </button>

      {/* Desktop sidebar */}
      <div className={`hidden md:flex flex-col h-screen sticky top-0 transition-all duration-300 ${collapsed ? 'w-[70px]' : 'w-64'}`}
        style={{ background: 'var(--sidebar-bg, rgba(7,8,14,0.99))', backdropFilter: 'blur(60px)', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
        {collapsed ? (
          <div className="flex flex-col items-center py-4 space-y-4">
            <button onClick={() => setCollapsed?.(false)} title="Expand sidebar" className="text-white/30 hover:text-white/60">
              <PanelLeftOpen className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <SidebarContent />
        )}
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 md:hidden"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-[280px] sm:w-72 md:hidden border-r border-white/5 safe-area-inset-left"
              style={{ background: 'var(--sidebar-bg, rgba(7,8,14,0.99))', backdropFilter: 'blur(60px)' }}
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}