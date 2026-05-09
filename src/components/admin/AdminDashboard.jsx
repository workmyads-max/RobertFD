import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, ShoppingBag, DollarSign, TrendingUp, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function AdminDashboard() {
  const { data: orders = [] } = useQuery({ queryKey: ['admin-orders'], queryFn: () => base44.entities.Order.list('-created_date', 100) });
  const { data: accounts = [] } = useQuery({ queryKey: ['admin-accounts'], queryFn: () => base44.entities.ChallengeAccount.list('-created_date', 100) });
  const { data: withdrawals = [] } = useQuery({ queryKey: ['admin-withdrawals'], queryFn: () => base44.entities.WithdrawalRequest.list('-created_date', 100) });
  const { data: tickets = [] } = useQuery({ queryKey: ['admin-tickets'], queryFn: () => base44.entities.SupportTicket.list('-created_date', 100) });

  const totalRevenue = orders.filter(o => o.payment_status === 'confirmed').reduce((s, o) => s + (o.price || 0), 0);
  const pendingOrders = orders.filter(o => o.payment_status === 'pending' || o.payment_status === 'awaiting_confirmation');
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');
  const openTickets = tickets.filter(t => t.status === 'open');

  const stats = [
    { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, sub: `${orders.filter(o=>o.payment_status==='confirmed').length} confirmed orders`, icon: DollarSign, color: '#10b981' },
    { label: 'Total Orders', value: orders.length, sub: `${pendingOrders.length} pending review`, icon: ShoppingBag, color: '#FF5C00' },
    { label: 'Active Accounts', value: accounts.filter(a=>a.status==='active'||a.status==='funded').length, sub: `${accounts.length} total accounts`, icon: TrendingUp, color: '#60a5fa' },
    { label: 'Open Tickets', value: openTickets.length, sub: `${pendingWithdrawals.length} pending withdrawals`, icon: AlertTriangle, color: '#f59e0b' },
  ];

  const recentOrders = orders.slice(0, 8);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
          <Shield className="w-6 h-6 text-primary" /> Admin Dashboard
        </h1>
        <p className="text-sm text-muted-foreground font-mono mt-1">Robert Funds — Admin Control Center</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${s.color}20` }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">{s.label}</span>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${s.color}15` }}>
                  <Icon className="w-4 h-4" style={{ color: s.color }} />
                </div>
              </div>
              <div className="text-2xl font-black mb-0.5" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-muted-foreground font-mono">{s.sub}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Recent orders */}
      <div className="rounded-2xl overflow-hidden mb-6" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="px-5 py-3.5 border-b border-white/5 flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <span className="text-sm font-bold text-foreground">Recent Orders</span>
          <span className="text-xs font-mono text-muted-foreground">{orders.length} total</span>
        </div>
        {recentOrders.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">No orders yet.</div>
        ) : recentOrders.map((o, i) => {
          const statusColor = o.payment_status === 'confirmed' ? '#10b981' : o.payment_status === 'pending' ? '#f59e0b' : '#ef4444';
          return (
            <div key={o.id} className="flex items-center gap-4 px-5 py-3.5 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
              <div className="text-xs font-mono text-muted-foreground w-28 truncate">{o.order_id || `ORD-${o.id?.slice(0,6)}`}</div>
              <div className="flex-1 text-xs text-foreground">{o.full_name || o.email || '—'}</div>
              <div className="text-xs text-muted-foreground">${(o.account_size||0).toLocaleString()} {o.challenge_type === 'two-step' ? '2-Step' : 'Instant'}</div>
              <div className="text-xs font-bold text-foreground">${o.price}</div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full capitalize" style={{ color: statusColor, background: `${statusColor}15`, border: `1px solid ${statusColor}30` }}>
                {o.payment_status}
              </span>
            </div>
          );
        })}
      </div>

      {/* Quick stats grid */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { label: 'Pending Withdrawals', count: pendingWithdrawals.length, color: '#f59e0b' },
          { label: 'Open Support Tickets', count: openTickets.length, color: '#60a5fa' },
          { label: 'Failed Accounts', count: accounts.filter(a=>a.status==='failed').length, color: '#ef4444' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4 flex items-center gap-4"
            style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${s.color}20` }}>
            <div className="text-3xl font-black" style={{ color: s.color }}>{s.count}</div>
            <div className="text-sm text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}