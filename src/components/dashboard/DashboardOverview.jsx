import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, BarChart3, Award, Target, Activity, Zap, Plus, Clock, AlertCircle, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useSyncOnLogin } from '@/hooks/useSyncOnLogin';

function StatCard({ label, value, sub, color, icon: Icon, i }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.06 }}
      className="rounded-2xl p-5 group"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,92,0,0.1)' }}>
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </div>
      <div className="text-2xl font-bold text-foreground mb-1">{value}</div>
      <div className={`text-xs font-medium ${color}`}>{sub}</div>
    </motion.div>
  );
}

export default function DashboardOverview({ user, onStartChallenge, onNavigate }) {
  const location = useUserLocation();
  const { syncing, lastSync, syncError } = useSyncOnLogin();

  const { data: accounts = [] } = useQuery({
    queryKey: ['challenge-accounts'],
    queryFn: () => base44.entities.ChallengeAccount.list('-created_date', 50),
    refetchInterval: 5 * 60 * 1000, // 5 min — MT sync updates data server-side
    staleTime: 5 * 60 * 1000,       // Don't refetch on tab focus within the 5-min window
  });

  const { data: pendingOrders = [] } = useQuery({
    queryKey: ['my-pending-orders'],
    queryFn: () => base44.entities.Order.filter({ email: user?.email }),
    enabled: !!user?.email,
    staleTime: 5 * 60 * 1000,       // Orders don't change faster than 5 min
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
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, <span className="text-primary">{user?.full_name || 'Trader'}</span>
          </h1>
          <div className="text-muted-foreground text-xs mt-2 space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-foreground/60">Robert Funds</span>
              <span className="text-border">·</span>
              <span>IP: {location.loading ? '—' : location.ip}</span>
              <span className="text-border">·</span>
              <span>{location.flag} {location.loading ? '—' : location.country}</span>
              <span className="text-border">·</span>
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            </div>
            {syncing && <div className="text-primary">Syncing MT5 data...</div>}
            {lastSync && <div className="text-emerald-400">Synced {lastSync.syncedCount} account{lastSync.syncedCount !== 1 ? 's' : ''} at {lastSync.timestamp.toLocaleTimeString()}</div>}
            {syncError && <div className="text-red-400">Sync error: {syncError}</div>}
          </div>
        </div>
        <div className="hidden md:flex flex-col gap-2">
          <button onClick={onStartChallenge}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-primary-foreground transition-all hover:opacity-90"
            style={{ background: '#FF5C00' }}>
            <Plus className="w-4 h-4" /> New Challenge
          </button>
        </div>
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
          className="rounded-2xl p-12 text-center mb-8"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}>
          <div className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: 'rgba(255,92,0,0.1)', border: '1px solid rgba(255,92,0,0.2)' }}>
            <Zap className="w-7 h-7 text-primary" />
          </div>
          <div className="text-lg font-semibold text-foreground mb-2">Start Your Trading Journey</div>
          <div className="text-sm text-muted-foreground mb-6 max-w-md mx-auto leading-relaxed">
            You don't have any active challenge accounts yet. Purchase a challenge to access the trading terminal, analytics, and funded capital.
          </div>
          <button onClick={onStartChallenge}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-primary-foreground transition-all hover:opacity-90"
            style={{ background: '#FF5C00' }}>
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
              className="lg:col-span-2 rounded-2xl p-6"
              style={{
               background: 'rgba(255,255,255,0.04)',
               border: '1px solid rgba(255,255,255,0.08)',
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
                  style={{ background: 'rgba(255,92,0,0.1)', color: '#FF5C00', border: '1px solid rgba(255,92,0,0.2)' }}>
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
                        background: p.color,
                      }}>
                      <motion.div
                        animate={{ x: ['0%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        className="hidden" />
                    </motion.div>
                  </div>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, type: 'spring' }}
              className="rounded-2xl p-6"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div className="text-sm font-bold text-foreground mb-4 relative z-10">Quick Actions</div>
              <div className="space-y-3 relative z-10">
                {[
                  { label: 'Request Payout', icon: DollarSign, page: 'withdrawals' },
                  { label: 'View Analytics', icon: BarChart3, page: 'analytics' },
                  { label: 'Trading Journal', icon: Activity, page: 'journal' },
                  { label: 'Buy Challenge', icon: Plus, page: 'challenge', primary: true },
                  { label: 'Economic Calendar', icon: Target, page: 'calendar' },
                ].map((a, idx) => {
                  const Icon = a.icon;
                  return (
                    <button key={a.label} onClick={() => onNavigate && onNavigate(a.page)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-white/[0.05] group"
                      style={a.primary ? { background: 'rgba(255,92,0,0.08)', border: '1px solid rgba(255,92,0,0.2)' } : { border: '1px solid rgba(255,255,255,0.06)' }}>
                      <Icon className={`w-4 h-4 flex-shrink-0 ${a.primary ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
                      <span className="text-sm font-medium text-foreground">{a.label}</span>
                      <ChevronRight className="w-3 h-3 text-muted-foreground/40 ml-auto" />
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Equity Curve — real data or flat line if no trades */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="rounded-2xl p-6"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div>
                <div className="text-sm font-bold text-foreground">Portfolio Equity Curve</div>
                <div className="text-xs text-muted-foreground font-mono">Real-time balance across all accounts</div>
              </div>
              <span className={`text-lg font-bold ${totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {totalPnl >= 0 ? '+' : ''}${totalPnl.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
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
                    <stop offset="0%" stopColor={totalPnl >= 0 ? '#00F5A0' : '#ff6b6b'} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={totalPnl >= 0 ? '#00F5A0' : '#ff6b6b'} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <line x1="0" y1="50" x2="600" y2={totalPnl >= 0 ? '20' : '80'} stroke={totalPnl >= 0 ? '#00F5A0' : '#ff6b6b'} strokeWidth="2.5" />
              </svg>
            )}
          </motion.div>
        </>
      )}
    </div>
  );
}