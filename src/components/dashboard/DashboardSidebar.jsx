import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Wallet, Monitor, BarChart3, CalendarDays, Newspaper,
  BookOpen, CreditCard, DollarSign, Award, Users, HeadphonesIcon,
  Settings, Bell, X, Menu, ChevronRight, Shield, ShoppingBag, Zap, LogOut, ShieldCheck, MessageCircle, Activity, Trash2, Trophy, Cpu, Sliders, AlertTriangle
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Moon, Sun } from 'lucide-react';

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'accounts', label: 'My Accounts', icon: Wallet },
  { id: 'account-overview', label: 'Account Overview', icon: BarChart3 },
  { id: 'marketplace', label: 'New Challenge', icon: Zap },
  { id: 'terminal', label: 'XTrading Terminal', icon: Monitor },
  { id: 'xcopier', label: 'X-Copier', icon: Activity },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'calendar', label: 'Economic Calendar', icon: CalendarDays },
  { id: 'news', label: 'Market News', icon: Newspaper },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'journal', label: 'Trading Journal', icon: BookOpen },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'withdrawals', label: 'Withdrawals', icon: DollarSign },
  { id: 'certificates', label: 'Certificates', icon: Award },
  { id: 'affiliate', label: 'Affiliate', icon: Users },
  { id: 'kyc', label: 'KYC Verification', icon: ShieldCheck },
  { id: 'trash', label: 'Trash Accounts', icon: Trash2 },
  { id: 'support', label: 'Support', icon: HeadphonesIcon },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function DashboardSidebar({ activePage, setActivePage, user, isAdmin, isOpen, setIsOpen, unreadCount, trashCount = 0 }) {
  const [isDarkMode, setIsDarkMode] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') !== 'light';
    }
    return true;
  });

  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const handleNav = (id) => {
    setActivePage(id);
    setIsOpen(false);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/[0.08]"
        style={{ background: 'linear-gradient(135deg, rgba(255,92,0,0.05), rgba(10,14,26,0))' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #FF5C00, #cc4900)', boxShadow: '0 4px 16px rgba(255,92,0,0.4)' }}>
          <span className="text-white font-black text-xs" style={{ fontFamily: 'Georgia, serif' }}>RF</span>
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-slate-100 font-extrabold text-sm tracking-tight">Robert</span>
          <span className="text-primary font-black text-sm tracking-tight">Funds</span>
        </div>
      </div>

      {/* User info */}
      {user && (
        <div className="px-4 py-3 border-b border-white/[0.07]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, rgba(255,92,0,0.4), rgba(255,92,0,0.2))', border: '1px solid rgba(255,92,0,0.3)' }}>
              {user.full_name?.charAt(0)?.toUpperCase() || 'T'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-bold text-slate-100 truncate">{user.full_name || 'Trader'}</div>
              <div className="text-[10px] text-slate-500 truncate flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                <span className="truncate">{user.email || 'Active'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group ${
                isActive
                  ? 'text-white'
                  : item.id === 'trash'
                    ? 'text-red-400/60 hover:text-red-400 hover:bg-red-500/5'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.05]'
              }`}
              style={isActive ? { background: 'linear-gradient(90deg, rgba(255,92,0,0.18), rgba(255,92,0,0.06))', borderLeft: '2px solid #FF5C00' } : {}}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${isActive ? 'text-primary' : item.id === 'trash' ? 'text-red-400/60 group-hover:text-red-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
              <span className="flex-1 text-left font-medium">{item.label}</span>
              {item.id === 'trash' && trashCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-red-500/80 text-white">{trashCount}</span>
              )}
              {isActive && item.id !== 'trash' && <ChevronRight className="w-3 h-3 text-primary/50" />}
            </button>
          );
        })}

        {/* Notifications */}
        <button
          onClick={() => handleNav('notifications')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
            activePage === 'notifications'
              ? 'bg-primary/15 text-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
          }`}
        >
          <Bell className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 text-left">Notifications</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-primary text-white">{unreadCount}</span>
          )}
        </button>

        {/* Admin only */}
        {isAdmin && (
          <>
            <div className="pt-3 pb-1 px-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-[9px] font-mono text-primary/60 uppercase tracking-widest px-1">Admin</span>
                <div className="flex-1 h-px bg-white/5" />
              </div>
            </div>
            {[
              { id: 'admin-overview', label: 'Admin Overview', icon: Shield },
              { id: 'admin-orders', label: 'Orders', icon: ShoppingBag },
              { id: 'admin-accounts', label: 'Manage Accounts', icon: Wallet },
              { id: 'admin-withdrawals', label: 'Withdrawals', icon: DollarSign },
              { id: 'admin-support', label: 'Support Tickets', icon: HeadphonesIcon },
              { id: 'admin-users', label: 'User Management', icon: Users },
              { id: 'admin-notifications', label: 'Notifications', icon: Bell },
              { id: 'admin-wallets', label: 'Payment Gateways', icon: Wallet },
              { id: 'admin-kyc', label: 'KYC Review', icon: ShieldCheck },
              { id: 'admin-livechat', label: 'Live Chat', icon: MessageCircle },
              { id: 'admin-platforms', label: 'Platforms API', icon: Cpu },
              { id: 'admin-challenges', label: 'Manage Challenges', icon: Zap },
              { id: 'admin-terminal', label: 'Terminal Control', icon: Sliders },
              { id: 'admin-risk', label: 'Risk Management', icon: AlertTriangle },
            ].map(item => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button key={item.id} onClick={() => handleNav(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-medium transition-all duration-200 group ${
                    isActive ? 'text-white' : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.04]'
                  }`}
                  style={isActive ? { background: 'linear-gradient(90deg, rgba(255,92,0,0.15), rgba(255,92,0,0.05))', borderLeft: '2px solid #FF5C00' } : {}}>
                  <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-primary' : 'text-slate-600 group-hover:text-slate-400'}`} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {isActive && <ChevronRight className="w-3 h-3 text-primary/50" />}
                </button>
              );
            })}
          </>
        )}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 pb-4 space-y-1">
        <button onClick={() => setIsDarkMode(!isDarkMode)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground transition-colors">
          {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          {isDarkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
        <a href="/" className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground transition-colors">
          ← Back to site
        </a>
        <button onClick={() => base44.auth.logout('/')}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-muted-foreground hover:text-red-400 transition-colors">
          <LogOut className="w-3.5 h-3.5" /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden w-10 h-10 rounded-xl glass flex items-center justify-center"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-col w-56 border-r border-white/[0.08] h-screen sticky top-0"
        style={{ background: 'rgba(10,14,26,0.98)', backdropFilter: 'blur(32px)' }}>
        <SidebarContent />
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
              className="fixed left-0 top-0 bottom-0 z-50 w-56 md:hidden border-r border-white/5"
              style={{ background: 'rgba(8,8,10,0.99)' }}
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}