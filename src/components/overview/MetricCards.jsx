import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, Target, Shield, Clock } from 'lucide-react';

function MetricCard({ label, value, sub, color, icon: Icon, i }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.06 }}
      className="rounded-xl p-4"
      style={{
        background: `linear-gradient(135deg, ${color}10, ${color}04)`,
        border: `1px solid ${color}20`,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: `${color}80` }}>{label}</span>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
      </div>
      <div className="text-2xl font-black text-white mb-1">{value}</div>
      {sub && <div className="text-[10px] text-white/30 font-mono">{sub}</div>}
    </motion.div>
  );
}

export default function MetricCards({ account, rules }) {
  const pnl = account?.pnl || 0;
  const balance = account?.balance || account?.account_size || 0;
  const equity = account?.equity || balance;
  const winRate = account?.win_rate || 0;
  const dailyDD = account?.daily_drawdown_used || 0;
  const maxDD = account?.max_drawdown_used || 0;
  const trades = account?.total_trades || 0;

  const metrics = [
    {
      label: 'Balance',
      value: `$${balance.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
      sub: `Equity: $${equity.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
      color: '#0095ff',
      icon: Activity,
    },
    {
      label: 'P&L',
      value: `${pnl >= 0 ? '+' : ''}$${pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sub: pnl >= 0 ? 'In profit' : 'In loss',
      color: pnl >= 0 ? '#00f5a0' : '#ef4444',
      icon: pnl >= 0 ? TrendingUp : TrendingDown,
    },
    {
      label: 'Win Rate',
      value: `${winRate.toFixed(1)}%`,
      sub: `${trades} total trades`,
      color: '#a855f7',
      icon: Target,
    },
    {
      label: 'Daily DD',
      value: `${dailyDD.toFixed(2)}%`,
      sub: `Limit: ${rules?.dailyDDLimit || 5}%`,
      color: dailyDD > (rules?.dailyDDLimit || 5) * 0.7 ? '#ef4444' : '#f59e0b',
      icon: Shield,
    },
    {
      label: 'Max DD',
      value: `${maxDD.toFixed(2)}%`,
      sub: `Limit: ${rules?.maxDDLimit || 10}%`,
      color: maxDD > (rules?.maxDDLimit || 10) * 0.7 ? '#ef4444' : '#60a5fa',
      icon: Shield,
    },
    {
      label: 'Trading Days',
      value: account?.trading_days || 0,
      sub: `Min: ${rules?.minTradingDays || 4} days`,
      color: '#00f5a0',
      icon: Clock,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {metrics.map((m, i) => <MetricCard key={m.label} {...m} i={i} />)}
    </div>
  );
}