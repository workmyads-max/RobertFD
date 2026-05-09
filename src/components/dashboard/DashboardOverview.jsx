import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, BarChart3, Award, Target, Activity, Zap } from 'lucide-react';

const stats = [
  { label: 'Account Balance', value: '$100,000', change: '+4.28%', up: true, icon: DollarSign },
  { label: 'Total P&L', value: '$4,280', change: '+4.28%', up: true, icon: TrendingUp },
  { label: 'Win Rate', value: '74.6%', change: '+2.1%', up: true, icon: Award },
  { label: 'Daily Drawdown', value: '1.2%', change: '3.8% left', up: true, icon: BarChart3 },
];

function StatCard({ stat, i }) {
  const Icon = stat.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.07 }}
      className="rounded-2xl p-5"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{stat.label}</span>
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </div>
      <div className="text-2xl font-black text-foreground mb-1">{stat.value}</div>
      <div className={`text-xs font-mono ${stat.up ? 'text-emerald-400' : 'text-red-400'}`}>{stat.change}</div>
    </motion.div>
  );
}

export default function DashboardOverview({ user }) {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-foreground">
          Welcome back, <span className="text-primary">{user?.full_name?.split(' ')[0] || 'Trader'}</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-1 font-mono">Robert Funds Dashboard — {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => <StatCard key={s.label} stat={s} i={i} />)}
      </div>

      {/* Challenge Progress */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="lg:col-span-2 rounded-2xl p-6"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-sm font-bold text-foreground">Challenge Progress</div>
              <div className="text-xs font-mono text-muted-foreground">Phase 1 — $100,000 Account</div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-mono" style={{ background: 'rgba(255,92,0,0.12)', color: '#FF5C00', border: '1px solid rgba(255,92,0,0.2)' }}>In Progress</span>
          </div>
          {[
            { label: 'Profit Target', current: 4.28, target: 10, color: '#FF5C00' },
            { label: 'Daily Drawdown Used', current: 1.2, target: 5, color: '#10b981' },
            { label: 'Max Drawdown Used', current: 2.1, target: 10, color: '#10b981' },
          ].map((p) => (
            <div key={p.label} className="mb-4 last:mb-0">
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-muted-foreground">{p.label}</span>
                <span style={{ color: p.color }}>{p.current}% / {p.target}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(p.current / p.target) * 100}%` }}
                  transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full rounded-full"
                  style={{ background: p.color }}
                />
              </div>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="rounded-2xl p-6"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="text-sm font-bold text-foreground mb-4">Quick Actions</div>
          <div className="space-y-3">
            {[
              { label: 'Request Payout', icon: DollarSign, color: 'text-emerald-400', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
              { label: 'View Analytics', icon: BarChart3, color: 'text-primary', bg: 'rgba(255,92,0,0.08)', border: 'rgba(255,92,0,0.2)' },
              { label: 'Trading Journal', icon: Activity, color: 'text-accent', bg: 'rgba(204,255,0,0.08)', border: 'rgba(204,255,0,0.2)' },
              { label: 'Economic Calendar', icon: Target, color: 'text-blue-400', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)' },
            ].map((a) => {
              const Icon = a.icon;
              return (
                <button key={a.label} className="w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:scale-[1.02]"
                  style={{ background: a.bg, border: `1px solid ${a.border}` }}>
                  <Icon className={`w-4 h-4 ${a.color}`} />
                  <span className="text-sm font-medium text-foreground">{a.label}</span>
                  <Zap className="w-3 h-3 text-muted-foreground ml-auto" />
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Equity Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="rounded-2xl p-6"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-bold text-foreground">Equity Curve</div>
            <div className="text-xs text-muted-foreground font-mono">Last 30 days</div>
          </div>
          <span className="text-lg font-black text-emerald-400">+$4,280</span>
        </div>
        <svg viewBox="0 0 600 100" className="w-full h-24">
          <defs>
            <linearGradient id="eqOv" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF5C00" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#FF5C00" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polyline fill="none" stroke="#FF5C00" strokeWidth="2.5"
            points="0,85 40,80 80,75 120,65 160,68 200,52 240,48 280,36 320,40 360,28 400,30 440,22 480,18 520,14 560,10 600,8" />
          <polygon fill="url(#eqOv)"
            points="0,85 40,80 80,75 120,65 160,68 200,52 240,48 280,36 320,40 360,28 400,30 440,22 480,18 520,14 560,10 600,8 600,100 0,100" />
        </svg>
      </motion.div>
    </div>
  );
}