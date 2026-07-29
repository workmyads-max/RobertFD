import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Users, DollarSign, TrendingUp, ChevronDown, ChevronUp, EyeOff } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

function fmt(n) {
  return (n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function fmtDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * CouponAnalytics - Admin panel showing per-coupon performance:
 * total sales, discount given, unique users, order count, and per-user breakdown.
 */
export default function CouponAnalytics() {
  const [expandedCode, setExpandedCode] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['coupon-analytics'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getCouponAnalytics', {});
      return res?.data?.analytics || res?.analytics || [];
    },
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  const analytics = data || [];
  const totalSales = analytics.reduce((s, a) => s + (a.total_sales || 0), 0);
  const totalDiscount = analytics.reduce((s, a) => s + (a.total_discount || 0), 0);
  const totalUsers = analytics.reduce((s, a) => s + (a.unique_users || 0), 0);
  const totalUses = analytics.reduce((s, a) => s + (a.order_uses || 0), 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <BarChart3 className="w-5 h-5 text-primary" />
        <div>
          <h2 className="text-xl font-bold text-foreground">Coupon Performance Analytics</h2>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">Sales, users, and revenue generated per coupon code</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Revenue', value: `$${fmt(totalSales)}`, icon: DollarSign, color: '#10b981' },
          { label: 'Discount Given', value: `$${fmt(totalDiscount)}`, icon: TrendingUp, color: '#FF5C00' },
          { label: 'Total Orders', value: totalUses, icon: BarChart3, color: '#6366f1' },
          { label: 'Unique Users', value: totalUsers, icon: Users, color: '#f59e0b' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase text-muted-foreground">{s.label}</span>
                <Icon className="w-3.5 h-3.5" style={{ color: s.color }} />
              </div>
              <div className="text-xl font-black tabular" style={{ color: s.color }}>{s.value}</div>
            </div>
          );
        })}
      </div>

      {/* Per-coupon breakdown */}
      {analytics.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }}>
          <BarChart3 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No coupon usage data yet</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {analytics.map((a, idx) => {
            const isExpanded = expandedCode === a.code;
            return (
              <div key={a.code + '_' + idx} className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {/* Row header */}
                <button onClick={() => setExpandedCode(isExpanded ? null : a.code)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.02] transition-colors text-left">
                  {/* Code badge */}
                  <div className="px-3 py-1.5 rounded-lg font-black text-sm font-mono flex-shrink-0"
                    style={{ background: 'rgba(255,92,0,0.12)', color: '#FF5C00', border: '1px solid rgba(255,92,0,0.3)' }}>
                    {a.code}
                  </div>
                  {/* Discount + visibility */}
                  <div className="flex-shrink-0 hidden sm:flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-foreground">
                      {a.discount_type === 'percentage' ? `${a.discount_value}%` : `$${a.discount_value}`}
                    </span>
                    {!a.is_public && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>
                        <EyeOff className="w-2.5 h-2.5 mr-0.5" />Private
                      </span>
                    )}
                  </div>
                  {/* Stats */}
                  <div className="flex-1 flex items-center justify-end gap-3 sm:gap-6 text-xs font-mono">
                    <div className="text-center">
                      <div className="text-foreground font-black text-sm">${fmt(a.total_sales)}</div>
                      <div className="text-[9px] text-muted-foreground uppercase">Sales</div>
                    </div>
                    <div className="text-center hidden sm:block">
                      <div className="text-foreground font-black text-sm">{a.unique_users}</div>
                      <div className="text-[9px] text-muted-foreground uppercase">Users</div>
                    </div>
                    <div className="text-center hidden sm:block">
                      <div className="text-foreground font-black text-sm">{a.order_uses}</div>
                      <div className="text-[9px] text-muted-foreground uppercase">Orders</div>
                    </div>
                    <div className="text-center hidden md:block">
                      <div className="font-black text-sm" style={{ color: '#FF5C00' }}>${fmt(a.total_discount)}</div>
                      <div className="text-[9px] text-muted-foreground uppercase">Discount</div>
                    </div>
                  </div>
                  {isExpanded
                    ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                </button>
                {/* Expanded: user list */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                      {(!a.users || a.users.length === 0) ? (
                        <div className="px-4 py-6 text-center text-xs text-muted-foreground">No users have used this code yet</div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                {['#', 'User Email', 'Orders', 'Total Spent', 'Last Order'].map(h => (
                                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {a.users.map((u, i) => (
                                <tr key={i} className="border-b hover:bg-white/[0.02] transition-colors" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                                  <td className="px-4 py-2.5 text-muted-foreground font-mono">{i + 1}</td>
                                  <td className="px-4 py-2.5 text-foreground font-medium">{u.email}</td>
                                  <td className="px-4 py-2.5 text-muted-foreground font-mono">{u.count}</td>
                                  <td className="px-4 py-2.5 text-foreground font-mono font-bold">${fmt(u.total_spent)}</td>
                                  <td className="px-4 py-2.5 text-muted-foreground font-mono">{fmtDate(u.last_order)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}