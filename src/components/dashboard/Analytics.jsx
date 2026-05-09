import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, TrendingDown, Target, Activity, Award, Calendar } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

const equityCurve = [
  { day: 'May 1', equity: 100000 }, { day: 'May 2', equity: 101200 }, { day: 'May 3', equity: 100800 },
  { day: 'May 4', equity: 102400 }, { day: 'May 5', equity: 101900 }, { day: 'May 6', equity: 103200 },
  { day: 'May 7', equity: 104280 },
];

const dailyPnl = [
  { day: 'Mon', pnl: 1200 }, { day: 'Tue', pnl: -400 }, { day: 'Wed', pnl: 1600 },
  { day: 'Thu', pnl: -500 }, { day: 'Fri', pnl: 1300 }, { day: 'Sat', pnl: 800 }, { day: 'Sun', pnl: 280 },
];

const symbolData = [
  { name: 'BTC/USD', trades: 18, pnl: 1840, winRate: 78 },
  { name: 'EUR/USD', trades: 12, pnl: 640, winRate: 67 },
  { name: 'XAU/USD', trades: 8, pnl: -120, winRate: 50 },
  { name: 'NAS100', trades: 6, pnl: 1480, winRate: 83 },
  { name: 'GBP/USD', trades: 4, pnl: 440, winRate: 75 },
];

const sessionData = [
  { session: 'London', trades: 22, pnl: 2480 },
  { session: 'New York', trades: 18, pnl: 1620 },
  { session: 'Asian', trades: 8, pnl: 180 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl px-3 py-2 text-xs" style={{ background: 'rgba(14,14,16,0.98)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <p className="font-mono text-muted-foreground mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.dataKey} style={{ color: p.color }} className="font-bold">{p.name}: {typeof p.value === 'number' && p.value > 1000 ? `$${p.value.toLocaleString()}` : p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-primary" /> Analytics
        </h1>
        <p className="text-sm text-muted-foreground font-mono mt-1">FTMO-style performance analytics dashboard</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total P&L', value: '+$4,280', sub: '+4.28%', color: 'text-emerald-400', icon: TrendingUp },
          { label: 'Win Rate', value: '74.6%', sub: '36 / 48 trades', color: 'text-primary', icon: Target },
          { label: 'Best Trade', value: '+$840', sub: 'NAS100 BUY', color: 'text-accent', icon: Award },
          { label: 'Avg R:R', value: '1:2.4', sub: 'Excellent ratio', color: 'text-blue-400', icon: Activity },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="rounded-2xl p-5"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-muted-foreground uppercase">{s.label}</span>
                <Icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <div className={`text-2xl font-black ${s.color} mb-0.5`}>{s.value}</div>
              <div className="text-xs text-muted-foreground font-mono">{s.sub}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Equity Curve */}
      <div className="rounded-2xl p-6 mb-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-bold text-foreground">Equity Curve</div>
            <div className="text-xs text-muted-foreground font-mono">Account growth over time</div>
          </div>
          <span className="text-lg font-black text-emerald-400">+$4,280</span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={equityCurve}>
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#666', fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#666', fontFamily: 'monospace' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="equity" stroke="#FF5C00" strokeWidth={2.5} dot={{ fill: '#FF5C00', r: 3 }} name="Equity" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Daily P&L */}
        <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="text-sm font-bold text-foreground mb-4">Daily P&L</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={dailyPnl}>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#666', fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#666', fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]} name="P&L">
                {dailyPnl.map((e, i) => <Cell key={i} fill={e.pnl >= 0 ? '#10b981' : '#ef4444'} opacity={0.8} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Symbol Performance */}
        <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="text-sm font-bold text-foreground mb-4">Symbol Performance</div>
          <div className="space-y-3">
            {symbolData.map((s) => (
              <div key={s.name}>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-foreground font-semibold">{s.name}</span>
                  <div className="flex gap-4">
                    <span className="text-muted-foreground">{s.trades} trades</span>
                    <span className={s.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>{s.pnl >= 0 ? '+' : ''}${s.pnl}</span>
                    <span className="text-primary">{s.winRate}%</span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${s.winRate}%`, background: s.pnl >= 0 ? '#10b981' : '#ef4444' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Session Analytics */}
      <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="text-sm font-bold text-foreground mb-4">Session Performance</div>
        <div className="grid grid-cols-3 gap-4">
          {sessionData.map((s, i) => (
            <div key={s.session} className="rounded-xl p-4 text-center"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="text-xs font-mono text-muted-foreground mb-2">{s.session}</div>
              <div className="text-lg font-black text-emerald-400 mb-0.5">+${s.pnl.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">{s.trades} trades</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}