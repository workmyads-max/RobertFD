import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, FileCheck, DollarSign, Users, LifeBuoy, ShoppingBag, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * AdminPendingBanner — shows pending counts across 6 admin review queues.
 * Only rendered on the Admin Dashboard (admin-overview). Each card is clickable
 * and navigates to the corresponding admin sub-page via onNavigate.
 */
export default function AdminPendingBanner({ onNavigate }) {
  // Fetch all 6 pending counts in parallel — each query is independent.
  const { data: fundedReviews = [] } = useQuery({
    queryKey: ['admin-pending-funded-reviews'],
    queryFn: () => base44.entities.FundedAccountReview.filter({ status: 'pending_review' }, '-created_date', 200),
    staleTime: 30000,
  });

  const { data: pendingKyc = [] } = useQuery({
    queryKey: ['admin-pending-kyc'],
    queryFn: () => base44.entities.KYCVerification.filter({ status: 'pending' }, '-created_date', 200),
    staleTime: 30000,
  });

  const { data: pendingWithdrawals = [] } = useQuery({
    queryKey: ['admin-pending-withdrawals-banner'],
    queryFn: () => base44.entities.WithdrawalRequest.filter({ status: 'pending' }, '-created_date', 200),
    staleTime: 30000,
  });

  const { data: openTickets = [] } = useQuery({
    queryKey: ['admin-open-tickets-banner'],
    queryFn: () => base44.entities.SupportTicket.filter({ status: 'open' }, '-created_date', 200),
    staleTime: 30000,
  });

  const { data: pendingOrders = [] } = useQuery({
    queryKey: ['admin-pending-orders-banner'],
    queryFn: () => base44.entities.Order.filter({ payment_status: 'awaiting_confirmation' }, '-created_date', 200),
    staleTime: 30000,
  });

  // Split trader vs affiliate withdrawals client-side (account_id === 'affiliate')
  const traderWdCount = pendingWithdrawals.filter(w => w.account_id && w.account_id !== 'affiliate').length;
  const affiliateWdCount = pendingWithdrawals.filter(w => w.account_id === 'affiliate').length;

  const cards = [
    { label: 'Funded Reviews', count: fundedReviews.length, icon: ShieldCheck, color: '#a78bfa', page: 'admin-funded-review' },
    { label: 'KYC Reviews', count: pendingKyc.length, icon: FileCheck, color: '#60a5fa', page: 'admin-kyc' },
    { label: 'Withdrawals', count: traderWdCount, icon: DollarSign, color: '#f59e0b', page: 'admin-withdrawals' },
    { label: 'Affiliate Payouts', count: affiliateWdCount, icon: Users, color: '#10b981', page: 'admin-affiliate' },
    { label: 'Support Tickets', count: openTickets.length, icon: LifeBuoy, color: '#ef4444', page: 'admin-support' },
    { label: 'Orders', count: pendingOrders.length, icon: ShoppingBag, color: '#FF5C00', page: 'admin-orders' },
  ];

  const totalPending = cards.reduce((s, c) => s + c.count, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4 mb-6"
      style={{
        background: totalPending > 0
          ? 'linear-gradient(135deg, rgba(255,92,0,0.08), rgba(255,92,0,0.02))'
          : 'rgba(16,185,129,0.05)',
        border: totalPending > 0
          ? '1px solid rgba(255,92,0,0.25)'
          : '1px solid rgba(16,185,129,0.2)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-foreground">Pending Reviews</span>
          {totalPending > 0 ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: '#FF5C00' }}>
              {totalPending} item{totalPending !== 1 ? 's' : ''} awaiting action
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-400" style={{ background: 'rgba(16,185,129,0.15)' }}>
              All caught up
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {cards.map((c) => {
          const Icon = c.icon;
          const hasItems = c.count > 0;
          return (
            <button
              key={c.label}
              onClick={() => onNavigate?.(c.page)}
              disabled={!onNavigate}
              className="group rounded-xl p-3 text-left transition-all hover:scale-[1.02] disabled:cursor-default disabled:hover:scale-100"
              style={{
                background: hasItems ? `${c.color}12` : 'rgba(255,255,255,0.03)',
                border: `1px solid ${hasItems ? `${c.color}40` : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${c.color}15` }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: c.color }} />
                </div>
                {hasItems && (
                  <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
              <div className="text-xl font-black" style={{ color: hasItems ? c.color : 'var(--muted-foreground)' }}>
                {c.count}
              </div>
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide leading-tight">
                {c.label}
              </div>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}