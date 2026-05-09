import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Target, Activity, Award, Zap, Plus, Clock, AlertCircle, Trophy } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useUserLocation } from '@/hooks/useUserLocation';

function CircularProgress({ value, max, size = 80, color = '#FF5C00' }) {
  const percentage = (value / max) * 100;
  const circumference = 2 * Math.PI * (size / 2 - 5);
  const offset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={size / 2 - 5} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 5}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-xs font-black" style={{ color }}>{Math.round(percentage)}%</div>
        <div className="text-[9px] text-muted-foreground">{Math.round(value)}/{max}</div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, color = '#FF5C00', i }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.08 }}
      className="rounded-xl p-4 relative overflow-hidden group"
      style={{
        background: `linear-gradient(135deg, rgba(${color.match(/\d+/g).join(',')},0.08), rgba(255,255,255,0.02))`,
        border: `1px solid rgba(255,255,255,0.08)`,
      }}>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono text-muted-foreground/70 uppercase tracking-widest">{label}</span>
          <motion.div whileHover={{ scale: 1.1, rotate: 5 }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </motion.div>
        </div>
        <div className="text-xl font-black text-foreground">{value}</div>
        <div className="text-[10px] text-muted-foreground mt-1">{sub}</div>
      </div>
    </motion.div>
  );
}

export default function DashboardOverviewAdvanced({ user, onStartChallenge, onNavigate }) {
  const location = useUserLocation();

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

  const totalBalance = activeAccounts.reduce((s, a) => s + (a.balance || a.account_size || 0), 0);
  const totalPnl = activeAccounts.reduce((s, a) => s + (a.pnl || 0), 0);
  const avgWinRate = activeAccounts.length ? activeAccounts.reduce((s, a) => s + (a.win_rate || 0), 0) / activeAccounts.length : 0;
  const primaryAccount = activeAccounts[0];
  const profitTarget = primaryAccount?.challenge_type === 'instant' ? 8 : (primaryAccount?.phase === 'phase2' ? 5 : 10);
  const progress = primaryAccount?.profit_target_progress || 0;

  const hasAccounts = activeAccounts.length > 0;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(255,92,0,0.1), rgba(204,255,0,0.05))',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 8px 32px rgba(255,92,0,0.08)',
        }}>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-black text-foreground mb-2">
              Welcome back, <span className="text-primary">{user?.full_name || 'Trader'}</span>
            </h1>
            <div className="text-sm text-muted-foreground/80 font-mono space-y-1">
              <div>📍 Company: <span className="text-primary">Robert Funds</span> • 🌍 IP: <span className="text-foreground">{location.loading ? 'Loading...' : location.ip}</span> • <span>{location.flag}</span> {location.loading ? 'Loading...' : location.country}</div>
              <div>📅 {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} • 🕐 {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} GMT+4</div>
            </div>
          </div>
          <button onClick={onStartChallenge}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white hover:scale-105 transition-transform"
            style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)', boxShadow: '0 4px 20px rgba(255,92,0,0.3)' }}>
            <Plus className="w-4 h-4" /> New Challenge
          </button>
        </div>
      </motion.div>

      {/* Pending Activation Notice */}
      {pendingActivation.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-4 rounded-2xl"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <Clock className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-bold text-yellow-400">Pending Activation</div>
            <div className="text-xs text-muted-foreground">{pendingActivation.length} order{pendingActivation.length > 1 ? 's' : ''} awaiting approval</div>
          </div>
        </motion.div>
      )}

      {!hasAccounts && pendingActivation.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-12 text-center"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}>
          <div className="text-4xl mb-4">🚀</div>
          <div className="text-xl font-black text-foreground mb-2">Start Your Trading Journey</div>
          <div className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Purchase a challenge to access the XTrading Terminal, analytics, and funded capital.
          </div>
          <button onClick={onStartChallenge}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold text-white hover:scale-105 transition-transform"
            style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)', boxShadow: '0 4px 20px rgba(255,92,0,0.3)' }}>
            <Plus className="w-4 h-4" /> Browse Challenge Plans
          </button>
        </motion.div>
      ) : (
        <>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Total Balance" value={`$${totalBalance.toLocaleString()}`} sub={`${activeAccounts.length} active`} icon={Award} i={0} />
            <StatCard label="Total P&L" value={`${totalPnl >= 0 ? '+' : ''}$${totalPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
              sub={totalPnl >= 0 ? 'Profitable' : 'Loss'} icon={TrendingUp} color={totalPnl >= 0 ? '#10b981' : '#ef4444'} i={1} />
            <StatCard label="Avg Win Rate" value={`${avgWinRate.toFixed(1)}%`} sub={`${activeAccounts.length} account${activeAccounts.length > 1 ? 's' : ''}`} icon={Target} color="#60a5fa" i={2} />
            <StatCard label="Active Accounts" value={activeAccounts.length} sub="Ready to trade" icon={Zap} i={3} />
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Challenge Progress - Large Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="lg:col-span-2 rounded-2xl p-6"
              style={{
                background: 'linear-gradient(135deg, rgba(255,92,0,0.08), rgba(204,255,0,0.02))',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 8px 32px rgba(255,92,0,0.08)',
              }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-sm font-bold text-foreground mb-1">Challenge Progress</div>
                  <div className="text-xs font-mono text-muted-foreground">
                    {primaryAccount?.phase?.replace('phase', 'Phase ')} — ${(primaryAccount?.account_size || 0).toLocaleString()} Account
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-mono capitalize"
                  style={{ background: 'rgba(255,92,0,0.12)', color: '#FF5C00', border: '1px solid rgba(255,92,0,0.2)' }}>
                  {primaryAccount?.status}
                </span>
              </div>

              <div className="space-y-4">
                {[
                  { label: 'Profit Target', current: progress, target: profitTarget, color: '#FF5C00' },
                  { label: 'Daily Drawdown', current: primaryAccount?.daily_drawdown_used || 0, target: 5, color: '#10b981' },
                  { label: 'Max Drawdown', current: primaryAccount?.max_drawdown_used || 0, target: 10, color: '#10b981' },
                ].map(p => {
                  const pct = Math.min((p.current / p.target) * 100, 100);
                  return (
                    <div key={p.label}>
                      <div className="flex justify-between text-xs font-mono mb-2">
                        <span className="text-muted-foreground">{p.label}</span>
                        <span style={{ color: p.color }}>{p.current.toFixed(2)}% / {p.target}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                          className="h-full rounded-full relative"
                          style={{
                            background: `linear-gradient(90deg, ${p.color}, ${p.color}dd)`,
                            boxShadow: `0 0 20px ${p.color}40`,
                          }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Quick Stats - Right Column */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className="space-y-3">
              {/* Trading Session Card */}
              <div className="rounded-2xl p-4"
                style={{
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02))',
                  border: '1px solid rgba(16,185,129,0.2)',
                }}>
                <div className="text-xs font-mono text-emerald-400/70 mb-2 uppercase">Session Status</div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-black text-emerald-400">{activeAccounts.length}</div>
                    <div className="text-[10px] text-muted-foreground">Active</div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Activity className="w-6 h-6 text-emerald-400" />
                  </div>
                </div>
              </div>

              {/* Win Rate Card */}
              <div className="rounded-2xl p-4"
                style={{
                  background: 'linear-gradient(135deg, rgba(96,165,250,0.08), rgba(96,165,250,0.02))',
                  border: '1px solid rgba(96,165,250,0.2)',
                }}>
                <div className="text-xs font-mono text-blue-400/70 mb-3 uppercase">Win Rate</div>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-2xl font-black text-blue-400">{avgWinRate.toFixed(1)}%</div>
                    <div className="text-[10px] text-muted-foreground">Last 30 days</div>
                  </div>
                  <CircularProgress value={avgWinRate} max={100} size={60} color="#60a5fa" />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                {[
                  { label: 'Analytics', icon: TrendingUp, color: 'text-primary', bg: 'rgba(255,92,0,0.08)', border: 'rgba(255,92,0,0.2)', page: 'analytics' },
                  { label: 'Trading Journal', icon: Activity, color: 'text-accent', bg: 'rgba(204,255,0,0.08)', border: 'rgba(204,255,0,0.2)', page: 'journal' },
                ].map(a => {
                  const Icon = a.icon;
                  return (
                    <motion.button key={a.label} onClick={() => onNavigate && onNavigate(a.page)}
                      whileHover={{ scale: 1.02, y: -2 }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl transition-all"
                      style={{ background: a.bg, border: `1px solid ${a.border}` }}>
                      <Icon className={`w-4 h-4 ${a.color}`} />
                      <span className="text-xs font-semibold text-foreground">{a.label}</span>
                      <Zap className="w-3 h-3 text-muted-foreground ml-auto" />
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Bottom Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Trades', value: primaryAccount?.total_trades || 0, icon: Activity },
              { label: 'Trading Days', value: primaryAccount?.trading_days || 0, icon: Trophy },
              { label: 'Funded Accounts', value: activeAccounts.filter(a => a.status === 'funded').length, icon: Award },
              { label: 'Pending Orders', value: pendingOrders.length, icon: Clock },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div key={s.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.05 }}
                  className="rounded-xl p-3 text-center"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <Icon className="w-4 h-4 text-primary mx-auto mb-2" />
                  <div className="text-lg font-black text-foreground">{s.value}</div>
                  <div className="text-[9px] text-muted-foreground">{s.label}</div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}