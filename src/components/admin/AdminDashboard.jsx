import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, ShoppingBag, DollarSign, TrendingUp, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function AdminDashboard() {
  // Admin-scoped fetch via service-role backend function — bypasses per-user RLS
  // so admins see ALL users' orders/accounts/withdrawals/tickets. Normal-user
  // isolation (RLS by user_email) remains fully intact for non-admin callers.
  const { data: adminData } = useQuery({
    queryKey: ['admin-dashboard-summary'],
    queryFn: async () => {
      const res = await base44.functions.invoke('adminListAllAccounts', { include_summary: true, limit: 500 });
      return res?.data || {};
    },
    staleTime: 60 * 1000,
  });
  const summary = adminData?.summary || {};

  const stats = [
    { label: 'Total Revenue', value: `$${(summary.total_revenue || 0).toLocaleString()}`, sub: `${summary.confirmed_orders || 0} confirmed orders`, icon: DollarSign, color: '#10b981' },
    { label: 'Total Orders', value: summary.confirmed_orders + (summary.pending_orders || 0), sub: `${summary.pending_orders || 0} pending review`, icon: ShoppingBag, color: '#FF5C00' },
    { label: 'Active Accounts', value: summary.active_accounts || 0, sub: `${summary.total_accounts || 0} total accounts`, icon: TrendingUp, color: '#60a5fa' },
    { label: 'Open Tickets', value: summary.open_tickets || 0, sub: `${summary.pending_withdrawals || 0} pending withdrawals`, icon: AlertTriangle, color: '#f59e0b' },
  ];

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

      {/* Quick stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Pending Withdrawals', count: summary.pending_withdrawals || 0, color: '#f59e0b' },
          { label: 'Open Support Tickets', count: summary.open_tickets || 0, color: '#60a5fa' },
          { label: 'Failed Accounts', count: summary.failed_accounts || 0, color: '#ef4444' },
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