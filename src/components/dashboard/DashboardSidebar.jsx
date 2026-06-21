import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Menu, X, PanelLeftOpen, LogOut, Zap, Shield, ShoppingBag, Wallet, DollarSign, HeadphonesIcon, Users, Bell, ShieldCheck, MessageCircle, Activity, Globe, Cpu, Sliders, AlertTriangle, Tag, Share2, Mail, BarChart2, BookOpen, Trophy, Award, CreditCard, Gift, LayoutDashboard } from 'lucide-react';
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
    { id: 'account-overview', label: 'Account Overview', icon: BarChart2 },
    { id: 'markets', label: 'Markets', icon: Globe },
    { id: 'journal', label: 'Journal', icon: BookOpen },
    { id: 'marketplace', label: 'Buy Challenge', icon: ShoppingBag, highlight: true, prominent: true, bigBtn: true, limeGreen: true },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'affiliate', label: 'Affiliate', icon: Users },
    { id: 'certificates', label: 'Certificates', icon: Award },
    { id: 'withdrawals', label: 'Withdrawals', icon: DollarSign },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'kyc', label: 'KYC', icon: ShieldCheck },
    { id: 'support', label: 'Support', icon: HeadphonesIcon },
    { id: 'settings', label: 'Settings', icon: Sliders },
  ];

  const filterNavItems = () => {
    const visibilityMap = {
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
    <div className="flex flex-col h-full overflow-hidden">
      {/* Logo - Increased Spacing */}
      <div className={`flex items-center border-b flex-shrink-0 ${collapsed ? 'justify-center px-3 py-6' : 'px-6 py-10'}`}
        style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <button 
          onClick={() => setCollapsed?.(!collapsed)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hover:opacity-80 transition-opacity">
          <XFLogo size={collapsed ? 'sm' : 'lg'} animate />
        </button>
      </div>

      {/* Nav */}
      <nav className={`flex-1 py-4 space-y-0.5 overflow-y-auto overscroll-contain ${collapsed ? 'px-1.5' : 'px-2.5'}`} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
        {filterNavItems().map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center rounded-xl transition-all duration-150 group relative font-medium ${
                collapsed ? 'justify-center px-2 py-2.5' : item.bigBtn ? 'gap-3 px-5 py-4 text-base font-bold' : 'gap-2.5 px-3 py-2.5 text-sm'
              } ${
                isActive
                  ? (item.limeGreen ? 'text-[#CCFF00]' : item.highlight ? 'text-primary' : 'text-white')
                  : item.id === 'trash'
                    ? 'text-red-400/60 hover:text-red-400 hover:bg-red-500/5'
                    : item.limeGreen
                    ? 'text-[#CCFF00] hover:text-[#CCFF00]'
                    : item.highlight
                    ? 'text-primary hover:text-primary'
                    : 'text-white/35 hover:text-primary/80 hover:bg-primary/[0.07]'
              }`}
              style={item.limeGreen ? {
                background: 'rgba(204,255,0,0.12)',
                border: '1.5px solid rgba(204,255,0,0.4)',
                boxShadow: '0 0 14px rgba(204,255,0,0.2)',
              } : item.highlight && !isActive ? {
                background: 'rgba(255,92,0,0.15)',
                border: '1.5px solid rgba(255,92,0,0.5)',
                boxShadow: '0 0 12px rgba(255,92,0,0.15)',
              } : isActive ? {
                background: collapsed ? 'rgba(255,92,0,0.15)' : 'rgba(255,92,0,0.1)',
                borderLeft: collapsed ? 'none' : '2px solid #FF5C00',
              } : {}}
            >
              <Icon className={`flex-shrink-0 transition-colors relative z-10 ${collapsed ? 'w-5 h-5' : item.bigBtn ? 'w-6 h-6' : item.prominent ? 'w-5 h-5' : 'w-4 h-4'} ${isActive ? 'text-primary' : item.id === 'trash' ? 'text-red-400/60 group-hover:text-red-400' : item.limeGreen ? 'text-[#CCFF00]' : item.highlight ? 'text-primary' : 'text-muted-foreground group-hover:text-primary/70'}`} />
              {!collapsed && <span className="flex-1 text-left relative z-10">{item.label}</span>}
              {!collapsed && item.id === 'trash' && trashCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-red-500/80 text-white relative z-10">{trashCount}</span>
              )}
              {!collapsed && isActive && item.id !== 'trash' && <div className="w-1 h-1 rounded-full bg-primary/60 ml-auto relative z-10" />}
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
          className={`w-full flex items-center rounded-xl text-sm font-medium transition-all duration-150 group relative ${
          collapsed ? 'justify-center px-2 py-2.5' : 'gap-2.5 px-3 py-2.5'
          } ${
          activePage === 'notifications'
          ? 'text-white'
          : 'text-white/35 hover:text-primary/80 hover:bg-primary/[0.07]'
          }`}
          style={activePage === 'notifications' ? {
            background: collapsed ? 'rgba(255,92,0,0.15)' : 'rgba(255,92,0,0.1)',
            borderLeft: collapsed ? 'none' : '2px solid #FF5C00',
          } : {}}
        >
          <Bell className={`flex-shrink-0 ${collapsed ? 'w-5 h-5' : 'w-4 h-4'} ${activePage === 'notifications' ? 'text-primary' : 'text-white/25 group-hover:text-primary/70'}`} />
          {!collapsed && <span className="flex-1 text-left">Notifications</span>}
          {!collapsed && unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white" style={{ background: '#FF5C00' }}>{unreadCount}</span>
          )}
          {collapsed && unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: '#FF5C00' }} />
          )}
        </button>

        {/* Admin only - Dashboard button only */}
        {isAdmin && (
          <>
            {/* Admin Toggle Button */}
            {!collapsed && (
              <button
                onClick={() => handleNav('admin-dashboard')}
                className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs font-bold mb-2 transition-all hover:scale-[1.02]"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(255,92,0,0.2), rgba(255,92,0,0.1))',
                  border: '1.5px solid rgba(255,92,0,0.4)',
                  boxShadow: '0 0 12px rgba(255,92,0,0.15)',
                }}
              >
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4 text-primary" />
                  <span className="text-white">Admin Dashboard</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-primary" />
              </button>
            )}
            {collapsed && <div className="my-2 mx-2 h-px" style={{ background: 'rgba(255,92,0,0.2)' }} />}
            {/* Collapsed quick access - Risk System only */}
            {collapsed && (
              <button onClick={() => handleNav('admin-risk-center')}
                title="Risk System"
                className="w-full flex items-center justify-center rounded-xl text-[12px] font-medium transition-all duration-150 group">
                <Shield className="flex-shrink-0 w-3.5 h-3.5 text-white/20 group-hover:text-primary/60" />
              </button>
            )}
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
            <button onClick={() => base44.auth.logout()} title="Sign Out"
              className="w-9 h-9 flex items-center justify-center rounded-xl text-white/30 hover:text-red-400 transition-colors hover:bg-red-500/5">
              <LogOut className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <a href="/" className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-white/30 hover:text-white/60 transition-colors">
              ← Back to site
            </a>
            <button onClick={() => base44.auth.logout()}
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
      {/* Mobile toggle — z-[60] to always sit above banners/modals */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-3 left-3 sm:top-4 sm:left-4 md:hidden w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
        style={{ zIndex: 60, background: 'rgba(7,8,14,0.95)', border: '1px solid rgba(255,255,255,0.12)' }}
      >
        {isOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
      </button>

      {/* Desktop sidebar */}
      <div className={`hidden md:flex flex-col h-screen sticky top-0 transition-all duration-300 ${collapsed ? 'w-[70px]' : 'w-64'}`}
        style={{ background: 'var(--sidebar-bg, rgba(7,8,14,0.99))', backdropFilter: 'blur(60px)', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
        <SidebarContent />
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 md:hidden"
              style={{ zIndex: 58 }}
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed left-0 top-0 bottom-0 md:hidden border-r border-white/5"
              style={{ zIndex: 59, width: '280px', background: 'rgba(7,8,14,0.99)', backdropFilter: 'blur(60px)', overflowY: 'auto' }}
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}