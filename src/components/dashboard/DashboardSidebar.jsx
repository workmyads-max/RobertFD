import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Wallet, Monitor, BarChart3, CalendarDays, Newspaper,
  BookOpen, CreditCard, DollarSign, Award, Users, HeadphonesIcon,
  Settings, Bell, X, Menu, ChevronRight, Shield, ShoppingBag, Zap, LogOut, ShieldCheck, MessageCircle, Activity, Trash2, Trophy, Cpu, Sliders, AlertTriangle
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Moon, Sun, Camera } from 'lucide-react';

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
    <div className="flex flex-col h-full circuit-bg">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b relative overflow-hidden"
        style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'linear-gradient(135deg, rgba(255,92,0,0.07), rgba(139,92,246,0.04), transparent)' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-4 -left-4 w-24 h-24 rounded-full blur-2xl opacity-20" style={{ background: '#FF5C00' }} />
        </div>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 relative"
          style={{ background: 'linear-gradient(135deg, #FF5C00, #cc4900)', boxShadow: '0 4px 20px rgba(255,92,0,0.45)' }}>
          <span className="text-white font-black text-xs" style={{ fontFamily: 'Georgia, serif' }}>RF</span>
        </div>
        <div className="flex flex-col leading-none relative z-10">
          <span className="text-white font-extrabold text-sm tracking-tight">Robert</span>
          <span className="font-black text-sm tracking-tight" style={{ color: '#FF5C00' }}>Funds</span>
        </div>
        {/* AI dot indicator */}
        <div className="ml-auto flex items-center gap-1 flex-shrink-0">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#00f5a0' }} />
          <span className="text-[7px] font-mono" style={{ color: '#00f5a0' }}>LIVE</span>
        </div>
      </div>

      {/* User info */}
      {user && (
        <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0 group">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white overflow-hidden"
                style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.4), rgba(255,92,0,0.3))', border: '1px solid rgba(139,92,246,0.3)' }}>
                {user.avatar_url
                  ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <span>{user.full_name?.charAt(0)?.toUpperCase() || 'T'}</span>}
              </div>
              <label className="absolute inset-0 rounded-xl flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'rgba(0,0,0,0.6)' }} title="Change avatar">
                <span className="text-white text-[10px] font-bold">✎</span>
                <input type="file" accept="image/*" className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const { file_url } = await base44.integrations.Core.UploadFile({ file });
                      await base44.auth.updateMe({ avatar_url: file_url });
                    } catch {}
                  }} />
              </label>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-bold text-white truncate">{user.full_name || 'Trader'}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0 animate-pulse" />
                <span className="text-[9px] font-mono" style={{ color: user.role === 'admin' ? '#FF5C00' : '#8b5cf6' }}>
                  {user.role === 'admin' ? '⚡ Admin' : '● Trader'}
                </span>
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
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 group relative ${
                isActive
                  ? 'text-white'
                  : item.id === 'trash'
                    ? 'text-red-400/60 hover:text-red-400 hover:bg-red-500/5'
                    : 'text-white/35 hover:text-white/80 hover:bg-white/[0.05]'
              }`}
              style={isActive ? {
                background: 'linear-gradient(90deg, rgba(255,92,0,0.15), rgba(139,92,246,0.06), rgba(255,92,0,0.04))',
                borderLeft: '2px solid #FF5C00',
                boxShadow: 'inset 0 0 20px rgba(255,92,0,0.05)',
              } : {}}
            >
              {isActive && (
                <div className="absolute inset-0 rounded-xl pointer-events-none"
                  style={{ background: 'linear-gradient(90deg, rgba(255,92,0,0.08), transparent)' }} />
              )}
              <Icon className={`w-4 h-4 flex-shrink-0 transition-colors relative z-10 ${isActive ? 'text-primary' : item.id === 'trash' ? 'text-red-400/60 group-hover:text-red-400' : 'text-white/25 group-hover:text-white/60'}`} />
              <span className="flex-1 text-left font-medium relative z-10">{item.label}</span>
              {item.id === 'trash' && trashCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-red-500/80 text-white relative z-10">{trashCount}</span>
              )}
              {isActive && item.id !== 'trash' && <ChevronRight className="w-3 h-3 text-primary/40 relative z-10" />}
            </button>
          );
        })}

        {/* Notifications */}
        <button
          onClick={() => handleNav('notifications')}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 group ${
            activePage === 'notifications'
              ? 'text-white'
              : 'text-white/35 hover:text-white/80 hover:bg-white/[0.05]'
          }`}
          style={activePage === 'notifications' ? {
            background: 'linear-gradient(90deg, rgba(255,92,0,0.15), rgba(139,92,246,0.06))',
            borderLeft: '2px solid #FF5C00',
          } : {}}
        >
          <Bell className={`w-4 h-4 flex-shrink-0 ${activePage === 'notifications' ? 'text-primary' : 'text-white/25 group-hover:text-white/60'}`} />
          <span className="flex-1 text-left">Notifications</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white" style={{ background: '#FF5C00' }}>{unreadCount}</span>
          )}
        </button>

        {/* Admin only */}
        {isAdmin && (
          <>
            <div className="pt-3 pb-1 px-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,92,0,0.3), transparent)' }} />
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full" style={{ color: '#FF5C00', background: 'rgba(255,92,0,0.1)', border: '1px solid rgba(255,92,0,0.2)' }}>⚡ ADMIN</span>
                <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(255,92,0,0.3), transparent)' }} />
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
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-medium transition-all duration-150 group ${
                    isActive ? 'text-white' : 'text-white/25 hover:text-white/70 hover:bg-white/[0.04]'
                  }`}
                  style={isActive ? {
                    background: 'linear-gradient(90deg, rgba(255,92,0,0.12), rgba(139,92,246,0.05))',
                    borderLeft: '2px solid #FF5C00',
                  } : {}}>
                  <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-primary' : 'text-white/20 group-hover:text-white/50'}`} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {isActive && <ChevronRight className="w-3 h-3 text-primary/40" />}
                </button>
              );
            })}
          </>
        )}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 pb-4 pt-2 space-y-0.5 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <button onClick={() => setIsDarkMode(!isDarkMode)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-white/30 hover:text-white/60 transition-colors">
          {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          {isDarkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
        <a href="/" className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-white/30 hover:text-white/60 transition-colors">
          ← Back to site
        </a>
        <button onClick={() => base44.auth.logout('/')}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-white/30 hover:text-red-400 transition-colors">
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
      <div className="hidden md:flex flex-col w-56 h-screen sticky top-0"
        style={{ background: 'rgba(7,8,14,0.99)', backdropFilter: 'blur(60px)', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
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
              style={{ background: 'rgba(7,8,14,0.99)', backdropFilter: 'blur(60px)' }}
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}