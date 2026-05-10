import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, Target, Shield, Clock, DollarSign, BarChart2 } from 'lucide-react';
import DailyResetTimer from '../shared/DailyResetTimer';

function MetricCard({ label, value, sub, accent, icon: Icon, i, pulse }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3, scale: 1.01 }}
      className="relative rounded-2xl p-5 overflow-hidden group cursor-default"
      style={{
        background: 'linear-gradient(145deg, rgba(8,14,28,0.98), rgba(10,18,38,0.95))',
        border: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(24px)',
      }}
    >
      {/* Accent glow top edge */}
      <div className="absolute top-0 left-0 right-0 h-px rounded-t-2xl"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}60, transparent)` }} />
      {/* Hover glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none"
        style={{ background: `radial-gradient(circle at top left, ${accent}08, transparent 60%)` }} />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-white/30">{label}</span>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center relative"
            style={{ background: `${accent}12`, border: `1px solid ${accent}20` }}>
            {pulse && (
              <motion.div
                animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-xl"
                style={{ background: accent, opacity: 0.15 }}
              />
            )}
            <Icon className="w-4 h-4 relative z-10" style={{ color: accent }} />
          </div>
        </div>
        <div className="text-2xl font-bold tracking-tight text-white mb-1.5" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {value}
        </div>
        {sub && <div className="text-[11px] text-white/30 font-mono">{sub}</div>}
      </div>
    </motion.div>
  );
}

export default function MetricCards({ account, rules, stats }) {
  if (!stats) return null;

  const { balance, equity, pnl, dailyPnl, floatingPnl, dailyDDPct, maxDDPct, winRate, totalTrades, tradingDays } = stats;
  const ddLimit = rules?.dailyDDLimit || 5;
  const maxDDLimit = rules?.maxDDLimit || 10;
  const ddWarning = dailyDDPct > ddLimit * 0.7;
  const maxDDWarning = maxDDPct > maxDDLimit * 0.7;

  const metrics = [
    {
      label: 'Account Balance',
      value: `$${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sub: `Equity: $${equity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      accent: '#FF5C00',
      icon: DollarSign,
      pulse: true,
    },
    {
      label: 'Total P&L',
      value: `${pnl >= 0 ? '+' : ''}$${pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sub: `Float: ${floatingPnl >= 0 ? '+' : ''}$${floatingPnl.toFixed(2)}`,
      accent: pnl >= 0 ? '#10b981' : '#ef4444',
      icon: pnl >= 0 ? TrendingUp : TrendingDown,
    },
    {
      label: 'Daily P&L',
      value: `${dailyPnl >= 0 ? '+' : ''}$${dailyPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sub: `DD Used: ${dailyDDPct.toFixed(2)}% / ${ddLimit}%`,
      accent: ddWarning ? '#ef4444' : '#FF8A3D',
      icon: Activity,
      pulse: ddWarning,
    },
    {
      label: 'Win Rate',
      value: `${winRate.toFixed(1)}%`,
      sub: `${totalTrades} trades executed`,
      accent: '#8b5cf6',
      icon: Target,
    },
    {
      label: 'Max Drawdown',
      value: `${maxDDPct.toFixed(2)}%`,
      sub: `Limit: ${maxDDLimit}% — ${maxDDLimit - maxDDPct > 0 ? (maxDDLimit - maxDDPct).toFixed(2) + '% remaining' : 'BREACHED'}`,
      accent: maxDDWarning ? '#ef4444' : '#FF5C00',
      icon: Shield,
      pulse: maxDDWarning,
    },
    {
      label: 'Trading Days',
      value: tradingDays,
      sub: `Min required: ${rules?.minTradingDays || 4} days`,
      accent: '#10b981',
      icon: Clock,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {metrics.map((m, i) => <MetricCard key={m.label} {...m} i={i} />)}
      </div>
      {/* Live Daily DD Reset Timer */}
      <DailyResetTimer
        dailyDDUsed={dailyDDPct}
        dailyDDLimit={ddLimit}
      />
    </div>
  );
}