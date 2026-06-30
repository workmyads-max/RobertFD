import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, ShoppingBag, Wallet, DollarSign, MessageSquare, 
  Users, Bell, Shield, CreditCard, ShieldCheck, HeadphonesIcon,
  Zap, Cpu, Sliders, AlertTriangle, Tag, Share2, Mail, Gift,
  Activity, Globe, BarChart2, TrendingUp, Eye
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const ADMIN_SECTIONS = [
  {
    category: 'Overview',
    items: [
      { id: 'admin-overview', label: 'Admin Dashboard', icon: LayoutDashboard, color: '#3b82f6' },
      { id: 'admin-orders', label: 'Orders', icon: ShoppingBag, color: '#10b981' },
      { id: 'admin-accounts', label: 'Challenge Accounts', icon: Wallet, color: '#8b5cf6' },
      { id: 'admin-withdrawals', label: 'Withdrawals', icon: DollarSign, color: '#f59e0b' },
    ]
  },
  {
    category: 'User Management',
    items: [
      { id: 'admin-users', label: 'User Management', icon: Users, color: '#ec4899' },
      { id: 'admin-kyc', label: 'KYC Review', icon: ShieldCheck, color: '#06b6d4' },
      { id: 'admin-support', label: 'Support Tickets', icon: MessageSquare, color: '#14b8a6' },
      { id: 'admin-livechat', label: 'Live Chat', icon: HeadphonesIcon, color: '#6366f1' },
      { id: 'admin-notifications', label: 'Notifications', icon: Bell, color: '#f97316' },
    ]
  },
  {
    category: 'Risk & Compliance',
    items: [
      { id: 'admin-risk-center', label: 'Risk Management Center', icon: Shield, color: '#ef4444' },
      { id: 'admin-risk-detection', label: 'Risk Detection', icon: Shield, color: '#dc2626' },
      { id: 'admin-funded-review', label: 'Funded Review', icon: ShieldCheck, color: '#7f1d1d' },
      { id: 'admin-appeals', label: 'Violation Appeals', icon: Shield, color: '#991b1b' },
    ]
  },
  {
    category: 'Financial',
    items: [
      { id: 'admin-wallets', label: 'Payment Gateways', icon: CreditCard, color: '#22c55e' },
      { id: 'admin-payment-review', label: 'Payment Review', icon: Wallet, color: '#16a34a' },
      { id: 'admin-affiliate', label: 'Affiliate & IB', icon: TrendingUp, color: '#84cc16' },
    ]
  },
  {
    category: 'Platform Settings',
    items: [
      { id: 'admin-platforms', label: 'Platforms API', icon: Cpu, color: '#6366f1' },
      { id: 'admin-challenges', label: 'Challenge Plans', icon: Zap, color: '#a855f7' },
      { id: 'admin-mt5-config', label: 'MT5 Config', icon: Globe, color: '#3b82f6' },
      { id: 'admin-terminal', label: 'Terminal Control', icon: Sliders, color: '#0ea5e9' },
      { id: 'admin-visibility', label: 'Platform Visibility', icon: Eye, color: '#14b8a6' },
    ]
  },
  {
    category: 'Marketing',
    items: [
      { id: 'admin-coupons', label: 'Coupon Codes', icon: Tag, color: '#f59e0b' },
      { id: 'admin-promotions', label: 'Promotions', icon: Gift, color: '#ec4899' },
      { id: 'admin-first-time-discount', label: 'First-Time Discount', icon: Gift, color: '#d946ef' },
      { id: 'admin-social', label: 'Social Media', icon: Share2, color: '#8b5cf6' },
    ]
  },
  {
    category: 'Staff & Audit',
    items: [
      { id: 'admin-staff', label: 'Staff Management', icon: Users, color: '#64748b' },
      { id: 'admin-roles', label: 'Roles & Permissions', icon: Shield, color: '#475569' },
      { id: 'admin-email-logs', label: 'Email Logs', icon: Mail, color: '#334155' },
    ]
  },
];

export default function AdminDashboard({ onNavigate }) {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [orders, accounts, withdrawals, users] = await Promise.all([
        base44.entities.Order.filter({}),
        base44.entities.ChallengeAccount.filter({}),
        base44.entities.WithdrawalRequest.filter({}),
        base44.entities.UserAccount.filter({}),
      ]);
      
      return {
        totalOrders: orders.length,
        activeAccounts: accounts.filter(a => ['active', 'funded', 'passed'].includes(a.status)).length,
        pendingWithdrawals: withdrawals.filter(w => w.status === 'pending').length,
        totalUsers: users.length,
      };
    },
    refetchInterval: 30000,
  });

  const { data: pendingPhase1 = [] } = useQuery({
    queryKey: ['admin-pending-phase1-count'],
    queryFn: async () => {
      const all = await base44.entities.ChallengeAccount.filter({ status: 'passed' }, '-created_date', 200);
      return all.filter(a =>
        a.phase === 'phase1' &&
        (a.phase_review_status === 'pending_review' || a.phase_review_status === 'none' || !a.phase_review_status)
      );
    },
    refetchInterval: 30000,
  });

  const { data: pendingFundedReviews = [] } = useQuery({
    queryKey: ['admin-pending-funded-count'],
    queryFn: () => base44.entities.FundedAccountReview.filter({ status: 'pending_review' }),
    refetchInterval: 30000,
  });

  const filteredSections = ADMIN_SECTIONS.map(section => ({
    ...section,
    items: section.items.filter(item => 
      item.label.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(section => section.items.length > 0);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              <LayoutDashboard className="w-8 h-8 text-primary" /> 
              Admin Control Center
            </h1>
            <p className="text-sm text-white/30 mt-1">Complete platform management dashboard</p>
          </div>
        </div>

        {/* Pending Review Alert Cards */}
        {(pendingPhase1.length > 0 || pendingFundedReviews.length > 0) && (
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            {pendingPhase1.length > 0 && (
              <button onClick={() => onNavigate?.('admin-funded-review')}
                className="flex-1 flex items-center gap-4 px-5 py-4 rounded-2xl text-left transition-all hover:scale-[1.02]"
                style={{ background: 'rgba(96,165,250,0.08)', border: '2px solid rgba(96,165,250,0.35)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(96,165,250,0.2)' }}>
                  <ShieldCheck className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-black text-blue-400">Phase 1 Approvals Pending</div>
                  <div className="text-[11px] text-white/40 mt-0.5">{pendingPhase1.length} account{pendingPhase1.length !== 1 ? 's' : ''} waiting for Phase 2 provisioning</div>
                </div>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black"
                  style={{ background: '#3b82f6', color: '#fff' }}>{pendingPhase1.length}</div>
              </button>
            )}
            {pendingFundedReviews.length > 0 && (
              <button onClick={() => onNavigate?.('admin-funded-review')}
                className="flex-1 flex items-center gap-4 px-5 py-4 rounded-2xl text-left transition-all hover:scale-[1.02]"
                style={{ background: 'rgba(16,185,129,0.08)', border: '2px solid rgba(16,185,129,0.35)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(16,185,129,0.2)' }}>
                  <Shield className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-black text-emerald-400">Funded Reviews Pending</div>
                  <div className="text-[11px] text-white/40 mt-0.5">{pendingFundedReviews.length} trader{pendingFundedReviews.length !== 1 ? 's' : ''} awaiting funded account approval</div>
                </div>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black"
                  style={{ background: '#10b981', color: '#fff' }}>{pendingFundedReviews.length}</div>
              </button>
            )}
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Orders" value={stats?.totalOrders || 0} icon={ShoppingBag} color="#10b981" />
          <StatCard label="Active Accounts" value={stats?.activeAccounts || 0} icon={Wallet} color="#3b82f6" />
          <StatCard label="Pending Withdrawals" value={stats?.pendingWithdrawals || 0} icon={DollarSign} color="#f59e0b" />
          <StatCard label="Total Users" value={stats?.totalUsers || 0} icon={Users} color="#8b5cf6" />
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search admin features..."
            className="w-full pl-12 pr-4 py-3 rounded-xl text-sm text-white outline-none"
            style={{ 
              background: 'rgba(255,255,255,0.05)', 
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          />
        </div>
      </div>

      {/* Admin Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSections.map((section, idx) => (
          <div
            key={idx}
            className="rounded-2xl p-5"
            style={{ 
              background: 'rgba(255,255,255,0.03)', 
              border: '1px solid rgba(255,255,255,0.06)' 
            }}
          >
            <h3 className="text-xs font-mono text-white/30 uppercase tracking-widest mb-4">
              {section.category}
            </h3>
            <div className="space-y-2">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate?.(item.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-[1.02]"
                    style={{ 
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: `${item.color}15` }}
                    >
                      <Icon className="w-4 h-4" style={{ color: item.color }} />
                    </div>
                    <span className="text-white/80">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {filteredSections.length === 0 && (
        <div className="text-center py-20 rounded-2xl"
          style={{ 
            background: 'rgba(255,255,255,0.02)', 
            border: '1px dashed rgba(255,255,255,0.1)' 
          }}>
          <Shield className="w-12 h-12 mx-auto mb-4 text-white/10" />
          <p className="text-white/20">No admin features found</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div 
      className="rounded-2xl p-5"
      style={{ 
        background: 'rgba(255,255,255,0.03)', 
        border: '1px solid rgba(255,255,255,0.06)' 
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-white/30 font-mono uppercase">{label}</span>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="text-2xl font-black text-white">{value.toLocaleString()}</div>
    </div>
  );
}