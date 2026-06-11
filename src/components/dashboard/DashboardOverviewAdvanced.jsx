import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Target, Activity, Award, Zap, Plus, Clock, AlertCircle, Trophy, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useUserLocation } from '@/hooks/useUserLocation';
import PerformanceInsights from './PerformanceInsights';
import AccountOverview from './AccountOverview';

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
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, color = '#FF5C00', trend, i }) {
  const isPositive = trend >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.08 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="rounded-xl p-4 relative overflow-hidden group cursor-pointer"
      style={{
        background: `linear-gradient(135deg, rgba(${color.match(/\d+/g)?.join(',') || '255,92,0'},0.1), rgba(255,255,255,0.02))`,
        border: `1px solid rgba(255,255,255,0.1)`,
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
      }}>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at top right, ${color}15, transparent)`,
        }} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[9px] font-mono text-muted-foreground/60 uppercase tracking-widest">{label}</span>
          <motion.div whileHover={{ scale: 1.15, rotate: 10 }} className="p-2 rounded-lg" style={{ background: `${color}15` }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </motion.div>
        </div>
        <div className="text-2xl font-black text-foreground mb-2">{value}</div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground">{sub}</span>
          {trend !== undefined && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`flex items-center gap-0.5 text-[9px] font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(trend)}%
            </motion.div>
          )}
        </div>
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
      {/* Hero Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-8 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(255,92,0,0.15), rgba(204,255,0,0.08), rgba(255,92,0,0.05))',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 16px 48px rgba(255,92,0,0.1)',
        }}>
        <div className="absolute inset-0 opacity-20" style={{
          background: 'radial-gradient(circle at 20% 50%, rgba(255,92,0,0.3), transparent 50%), radial-gradient(circle at 80% 80%, rgba(204,255,0,0.2), transparent 50%)',
        }} />
        <div className="relative z-10 flex items-start justify-between">
          <div className="flex-1">
            <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-black text-foreground mb-3 leading-tight">
              Welcome back, <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg, #FF5C00, #CCFF00)' }}>{user?.full_name || 'Trader'}</span>
            </motion.h1>
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
              className="text-sm text-muted-foreground/90 font-mono space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Live Trading Session Active
              </div>
              <div>📍 {location.flag} {location.loading ? 'Loading...' : `${location.city}, ${location.country}`} • 🌐 {location.loading ? 'Loading...' : location.ip}</div>
            </motion.div>
          </div>
          <motion.button onClick={onStartChallenge}
            whileHover={{ scale: 1.08, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white"
            style={{
              background: 'linear-gradient(135deg, #FF5C00, #FF8A3D)',
              boxShadow: '0 8px 24px rgba(255,92,0,0.4)',
            }}>
            <Plus className="w-5 h-5" /> Launch Challenge
          </motion.button>
        </div>
      </motion.div>

      {/* Pending Activation */}
      {pendingActivation.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-4 p-5 rounded-2xl"
          style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
          <Clock className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-yellow-300 mb-1">Pending Activation</div>
            <div className="text-sm text-muted-foreground">{pendingActivation.length} order{pendingActivation.length > 1 ? 's' : ''} awaiting admin approval • Activated within 24 hours</div>
          </div>
        </motion.div>
      )}

      {!hasAccounts && pendingActivation.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-16 text-center"
          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))', border: '2px dashed rgba(255,255,255,0.1)' }}>
          <div className="text-6xl mb-4">🚀</div>
          <div className="text-2xl font-black text-foreground mb-3">Ready to Trade?</div>
          <div className="text-base text-muted-foreground mb-8 max-w-md mx-auto">
            Start your trading challenge now and unlock access to the XTrading Terminal, real-time analytics, and funded capital.
          </div>
          <button onClick={onStartChallenge}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold text-white hover:scale-105 transition-transform"
            style={{ background: 'linear-gradient(135deg, #FF5C00, #FF8A3D)', boxShadow: '0 8px 24px rgba(255,92,0,0.4)' }}>
            <Plus className="w-4 h-4" /> Explore Challenges
          </button>
        </motion.div>
      ) : (
        <>
          {/* Top Metrics - 4 Column */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Balance" value={`$${(totalBalance || 0).toLocaleString()}`} sub={`${activeAccounts.length} account${activeAccounts.length !== 1 ? 's' : ''}`} icon={Award} trend={2.5} i={0} />
            <StatCard label="Total P&L" value={`${totalPnl >= 0 ? '+' : ''}$${totalPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
              sub={totalPnl >= 0 ? 'Profit' : 'Loss'} icon={TrendingUp} color={totalPnl >= 0 ? '#10b981' : '#ef4444'} trend={totalPnl >= 0 ? 3.2 : -1.5} i={1} />
            <StatCard label="Win Rate" value={`${avgWinRate.toFixed(1)}%`} sub="Winning trades" icon={Target} color="#60a5fa" trend={4.1} i={2} />
            <StatCard label="Active" value={activeAccounts.length} sub="Trading accounts" icon={Zap} color="#CCFF00" trend={1.0} i={3} />
          </div>

          {/* Main Grid */}
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Challenge Progress - Large */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="lg:col-span-2 rounded-2xl p-6"
              style={{
                background: 'linear-gradient(135deg, rgba(255,92,0,0.12), rgba(204,255,0,0.04), rgba(255,92,0,0.06))',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
              }}>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <motion.h3 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-lg font-black text-foreground mb-1">Challenge Progress</motion.h3>
                  <p className="text-xs font-mono text-muted-foreground/80">
                    {primaryAccount?.phase?.replace('phase', 'Phase ')} Challenge • ${(primaryAccount?.account_size || 0).toLocaleString()}
                  </p>
                </div>
                <motion.span whileHover={{ scale: 1.05 }} className="px-4 py-2 rounded-full text-xs font-mono font-bold capitalize"
                  style={{ background: 'rgba(255,92,0,0.2)', color: '#FF5C00', border: '1px solid rgba(255,92,0,0.3)' }}>
                  {primaryAccount?.status}
                </motion.span>
              </div>

              <div className="space-y-5">
                {[
                  { label: 'Profit Target', current: progress, target: profitTarget, color: '#FF5C00', icon: '📈' },
                  { label: 'Daily Drawdown', current: primaryAccount?.daily_drawdown_used || 0, target: 5, color: '#10b981', icon: '📊' },
                  { label: 'Max Drawdown', current: primaryAccount?.max_drawdown_used || 0, target: 10, color: '#10b981', icon: '⚠️' },
                ].map((p, idx) => {
                  const pct = Math.min((p.current / p.target) * 100, 100);
                  return (
                    <motion.div key={p.label} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 + idx * 0.05 }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{p.icon}</span>
                          <span className="text-sm font-semibold text-foreground">{p.label}</span>
                        </div>
                        <span className="text-xs font-mono font-bold" style={{ color: p.color }}>{p.current.toFixed(2)}% / {p.target}%</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-white/5 overflow-hidden backdrop-blur-sm" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                          className="h-full rounded-full relative"
                          style={{
                            background: `linear-gradient(90deg, ${p.color}, ${p.color}aa)`,
                            boxShadow: `0 0 16px ${p.color}60, inset 0 1px 2px rgba(255,255,255,0.3)`,
                          }} />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Right Sidebar */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className="space-y-3">
              {/* Session Status */}
              <div className="rounded-2xl p-5 group cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.04))',
                  border: '1px solid rgba(16,185,129,0.25)',
                  boxShadow: '0 8px 24px rgba(16,185,129,0.1)',
                }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono text-emerald-400/70 uppercase tracking-widest">Session</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-bold text-emerald-400">LIVE</span>
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-3xl font-black text-emerald-400">{activeAccounts.length}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">Active Accounts</div>
                  </div>
                  <motion.div whileHover={{ scale: 1.15 }} className="w-16 h-16 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(16,185,129,0.15)' }}>
                    <Activity className="w-8 h-8 text-emerald-400" />
                  </motion.div>
                </div>
              </div>

              {/* Win Rate Circular */}
              <div className="rounded-2xl p-5"
                style={{
                  background: 'linear-gradient(135deg, rgba(96,165,250,0.12), rgba(96,165,250,0.04))',
                  border: '1px solid rgba(96,165,250,0.25)',
                  boxShadow: '0 8px 24px rgba(96,165,250,0.1)',
                }}>
                <span className="text-xs font-mono text-blue-400/70 uppercase tracking-widest block mb-3">Win Rate</span>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-black text-blue-400">{avgWinRate.toFixed(1)}%</div>
                    <div className="text-[10px] text-muted-foreground mt-1">Success Ratio</div>
                  </div>
                  <CircularProgress value={avgWinRate} max={100} size={70} color="#60a5fa" />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                {[
                  { label: 'Analytics', icon: TrendingUp, page: 'analytics', color: '#FF5C00' },
                  { label: 'Journal', icon: Activity, page: 'journal', color: '#CCFF00' },
                ].map(a => {
                  const Icon = a.icon;
                  return (
                    <motion.button key={a.label} onClick={() => onNavigate?.(a.page)}
                      whileHover={{ scale: 1.03, x: 4 }}
                      whileTap={{ scale: 0.97 }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl transition-all font-semibold text-sm"
                      style={{
                        background: `linear-gradient(135deg, ${a.color}15, ${a.color}08)`,
                        border: `1px solid ${a.color}30`,
                        color: 'hsl(var(--foreground))',
                      }}>
                      <Icon className="w-4 h-4" style={{ color: a.color }} />
                      {a.label}
                      <Zap className="w-3 h-3 ml-auto" style={{ color: a.color, opacity: 0.5 }} />
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Performance Insights */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <PerformanceInsights accounts={activeAccounts} />
          </motion.div>

          {/* Account Overview - Full Integration */}
          {activeAccounts.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
              <AccountOverview onStartChallenge={onStartChallenge} onNavigate={onNavigate} />
            </motion.div>
          )}

          {/* Bottom Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Trades', value: primaryAccount?.total_trades || 0, icon: Activity },
              { label: 'Trading Days', value: primaryAccount?.trading_days || 0, icon: Trophy },
              { label: 'Funded', value: activeAccounts.filter(a => a.status === 'funded').length, icon: Award },
              { label: 'Pending', value: pendingOrders.length, icon: Clock },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div key={s.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 + i * 0.05 }}
                  whileHover={{ y: -4 }}
                  className="rounded-xl p-4 text-center group cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                  <motion.div whileHover={{ scale: 1.2, rotate: 10 }} className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-3"
                    style={{ background: 'linear-gradient(135deg, #FF5C0020, #CCFF0010)' }}>
                    <Icon className="w-5 h-5 text-primary" />
                  </motion.div>
                  <div className="text-2xl font-black text-foreground">{s.value}</div>
                  <div className="text-[9px] text-muted-foreground mt-1">{s.label}</div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}