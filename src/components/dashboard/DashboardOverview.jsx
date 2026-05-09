import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, BarChart3, Award, Target, Activity, Zap, Plus, Clock, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

function StatCard({ label, value, sub, color, icon: Icon, i }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.07, type: 'spring', stiffness: 100 }}
      whileHover={{ scale: 1.02, y: -4 }}
      className="rounded-2xl p-6 group relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(255,92,0,0.08), rgba(204,255,0,0.03))',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
      }}>
      {/* Glow effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: 'radial-gradient(circle at top right, rgba(255,92,0,0.15), transparent)',
        }} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">{label}</span>
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </motion.div>
        </div>
        <div className="text-3xl font-black text-foreground mb-2">{value}</div>
        <div className={`text-xs font-mono ${color}`}>{sub}</div>
      </div>
    </motion.div>
  );
}

export default function DashboardOverview({ user, onStartChallenge, onNavigate }) {
  const { data: accounts = [] } = useQuery({
    queryKey: ['challenge-accounts'],
    queryFn: () => base44.entities.ChallengeAccount.list('-created_date', 50),
    refetchInterval: 15000,
  });

  const { data: pendingOrders = [] } = useQuery({
    queryKey: ['my-pending-orders'],
    queryFn: () => base44.entities.Order.filter({ email: user?.email }),
    enabled: !!user?.email,
  });

  const activeAccounts = accounts.filter(a => a.status === 'active' || a.status === 'funded' || a.status === 'passed');
  const pendingActivation = pendingOrders.filter(o => o.payment_status === 'awaiting_confirmation' || o.payment_status === 'pending');

  // Aggregate real stats across all active accounts
  const totalBalance = activeAccounts.reduce((s, a) => s + (a.balance || a.account_size || 0), 0);
  const totalPnl = activeAccounts.reduce((s, a) => s + (a.pnl || 0), 0);
  const avgWinRate = activeAccounts.length
    ? activeAccounts.reduce((s, a) => s + (a.win_rate || 0), 0) / activeAccounts.length
    : 0;
  const worstDD = activeAccounts.length
    ? Math.max(...activeAccounts.map(a => a.daily_drawdown_used || 0))
    : 0;

  const hasAccounts = activeAccounts.length > 0;

  // Best account for progress display
  const primaryAccount = activeAccounts[0];
  const profitTarget = primaryAccount?.challenge_type === 'instant' ? 8 : (primaryAccount?.phase === 'phase2' ? 5 : 10);
  const dailyDDLimit = primaryAccount?.account_type === 'swing' ? 5 : 5;
  const maxDDLimit = 10;

  const stats = hasAccounts ? [
    { label: 'Total Balance', value: `$${totalBalance.toLocaleString()}`, sub: `${activeAccounts.length} active account${activeAccounts.length > 1 ? 's' : ''}`, color: 'text-muted-foreground', icon: DollarSign },
    { label: 'Total P&L', value: `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sub: totalPnl >= 0 ? 'Profitable session' : 'Loss in session', color: totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400', icon: TrendingUp },
    { label: 'Avg Win Rate', value: `${avgWinRate.toFixed(1)}%`, sub: `Across ${activeAccounts.length} account${activeAccounts.length > 1 ? 's' : ''}`, color: avgWinRate >= 50 ? 'text-emerald-400' : 'text-yellow-400', icon: Award },
    { label: 'Max Daily DD', value: `${worstDD.toFixed(2)}%`, sub: `Limit: ${dailyDDLimit}%`, color: worstDD > dailyDDLimit * 0.8 ? 'text-red-400' : 'text-emerald-400', icon: BarChart3 },
  ] : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-black text-foreground">
            Welcome back, <span className="text-primary">{user?.full_name?.split(' ')[0] || 'Trader'}</span>
          </h1>
          <p className="text-muted-foreground text-base mt-1 font-mono">
            Robert Funds — {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button onClick={onStartChallenge}
          className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
          style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)', boxShadow: '0 4px 20px rgba(255,92,0,0.3)' }}>
          <Plus className="w-4 h-4" /> New Challenge ↗
        </button>
      </div>

      {/* Pending activation notice */}
      {pendingActivation.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-4 rounded-2xl mb-6"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <Clock className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-bold text-yellow-400 mb-0.5">
              {pendingActivation.length} order{pendingActivation.length > 1 ? 's' : ''} pending admin approval
            </div>
            <div className="text-xs text-muted-foreground">
              Your payment has been received and is being reviewed. Your account will be activated within 1–24 hours after confirmation.
            </div>
          </div>
        </motion.div>
      )}

      {/* No accounts — empty state */}
      {!hasAccounts && pendingActivation.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-10 text-center mb-8"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}>
          <div className="text-4xl mb-4">🚀</div>
          <div className="text-xl font-black text-foreground mb-2">Start Your Trading Journey</div>
          <div className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            You don't have any active challenge accounts yet. Purchase a challenge to access the XTrading Terminal, analytics, and funded capital.
          </div>
          <button onClick={onStartChallenge}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold text-white hover:scale-105 transition-all"
            style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)', boxShadow: '0 4px 20px rgba(255,92,0,0.3)' }}>
            <Plus className="w-4 h-4" /> Browse Challenge Plans
          </button>
        </motion.div>
      )}

      {/* Real stats */}
      {hasAccounts && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((s, i) => <StatCard key={s.label} {...s} i={i} />)}
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            {/* Challenge Progress — primary account */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, type: 'spring' }}
              className="lg:col-span-2 rounded-2xl p-6 group relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(255,92,0,0.06), rgba(204,255,0,0.02))',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 8px 32px rgba(255,92,0,0.08)',
              }}
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="text-sm font-bold text-foreground">Challenge Progress</div>
                  <div className="text-xs font-mono text-muted-foreground">
                    {primaryAccount?.phase?.replace('phase', 'Phase ')} — ${(primaryAccount?.account_size || 0).toLocaleString()} Account
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-mono capitalize"
                  style={{ background: 'rgba(255,92,0,0.12)', color: '#FF5C00', border: '1px solid rgba(255,92,0,0.2)' }}>
                  {primaryAccount?.status}
                </span>
              </div>
              {[
                { label: 'Profit Target', current: primaryAccount?.profit_target_progress || 0, target: profitTarget, color: '#FF5C00' },
                { label: 'Daily Drawdown Used', current: primaryAccount?.daily_drawdown_used || 0, target: dailyDDLimit, color: '#10b981' },
                { label: 'Max Drawdown Used', current: primaryAccount?.max_drawdown_used || 0, target: maxDDLimit, color: '#10b981' },
              ].map((p) => (
                <div key={p.label} className="mb-4 last:mb-0">
                  <div className="flex justify-between text-xs font-mono mb-1.5">
                    <span className="text-muted-foreground">{p.label}</span>
                    <span style={{ color: p.color }}>{p.current.toFixed(2)}% / {p.target}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((p.current / p.target) * 100, 100)}%` }}
                      transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full rounded-full relative overflow-hidden"
                      style={{
                        background: `linear-gradient(90deg, ${p.color}, ${p.color}dd)`,
                        boxShadow: `0 0 20px ${p.color}40`,
                      }}>
                      <motion.div
                        animate={{ x: ['0%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        className="absolute inset-0 opacity-40"
                        style={{
                          background: `linear-gradient(90deg, transparent, white, transparent)`,
                        }} />
                    </motion.div>
                  </div>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, type: 'spring' }}
              className="rounded-2xl p-6 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(255,92,0,0.06), rgba(204,255,0,0.02))',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 8px 32px rgba(255,92,0,0.08)',
              }}
            >
              <div className="text-sm font-bold text-foreground mb-4 relative z-10">Quick Actions</div>
              <div className="space-y-3 relative z-10">
                {[
                  { label: 'Request Payout', icon: DollarSign, color: 'text-emerald-400', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', page: 'withdrawals' },
                  { label: 'View Analytics', icon: BarChart3, color: 'text-primary', bg: 'rgba(255,92,0,0.08)', border: 'rgba(255,92,0,0.2)', page: 'analytics' },
                  { label: 'Trading Journal', icon: Activity, color: 'text-accent', bg: 'rgba(204,255,0,0.08)', border: 'rgba(204,255,0,0.2)', page: 'journal' },
                  { label: 'Economic Calendar', icon: Target, color: 'text-blue-400', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)', page: 'calendar' },
                ].map((a, idx) => {
                  const Icon = a.icon;
                  return (
                    <motion.button key={a.label} onClick={() => onNavigate && onNavigate(a.page)}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.45 + idx * 0.05 }}
                      whileHover={{ scale: 1.05, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full flex items-center gap-3 p-4 rounded-xl transition-all group"
                      style={{ background: a.bg, border: `1px solid ${a.border}` }}>
                      <motion.div whileHover={{ scale: 1.15, rotate: 10 }}>
                        <Icon className={`w-4 h-4 ${a.color}`} />
                      </motion.div>
                      <span className="text-sm font-medium text-foreground">{a.label}</span>
                      <motion.div className="w-3 h-3 text-muted-foreground ml-auto"
                        whileHover={{ x: 4 }}>
                        <Zap className="w-3 h-3" />
                      </motion.div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Equity Curve — real data or flat line if no trades */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, type: 'spring' }}
            className="rounded-2xl p-6 relative overflow-hidden group"
            style={{
              background: 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(255,92,0,0.03))',
              border: '1px solid rgba(16,185,129,0.2)',
              boxShadow: `0 8px 32px ${totalPnl >= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)'}`,
            }}
          >
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div>
                <div className="text-sm font-bold text-foreground">Portfolio Equity Curve</div>
                <div className="text-xs text-muted-foreground font-mono">Real-time balance across all accounts</div>
              </div>
              <motion.span className={`text-lg font-black ${totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}>
                {totalPnl >= 0 ? '+' : ''}${totalPnl.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </motion.span>
            </div>
            {totalPnl === 0 ? (
              <div className="flex items-center justify-center h-24 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.06)' }}>
                <span className="text-xs font-mono text-muted-foreground/40">No trading activity yet — open the XTrading Terminal to start</span>
              </div>
            ) : (
              <svg viewBox="0 0 600 100" className="w-full h-24">
                <defs>
                  <linearGradient id="eqOv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={totalPnl >= 0 ? '#FF5C00' : '#ef4444'} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={totalPnl >= 0 ? '#FF5C00' : '#ef4444'} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <line x1="0" y1="50" x2="600" y2={totalPnl >= 0 ? '20' : '80'} stroke={totalPnl >= 0 ? '#FF5C00' : '#ef4444'} strokeWidth="2.5" />
              </svg>
            )}
          </motion.div>
        </>
      )}
    </div>
  );
}