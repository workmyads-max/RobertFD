import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, Shield, DollarSign, BarChart3 } from 'lucide-react';

function StatCard({ Icon, label, value, subValue, color = '#FF5C00', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="p-3 sm:p-4 rounded-xl"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
          <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color }} />
        </div>
        <span className="text-[9px] sm:text-[10px] font-mono text-white/40 uppercase tracking-wide truncate">{label}</span>
      </div>
      <div className="text-base sm:text-lg font-bold text-white tracking-tight break-words">{value}</div>
      {subValue && (
        <div className="text-[9px] sm:text-[10px] text-white/30 font-mono mt-0.5 truncate">{subValue}</div>
      )}
    </motion.div>
  );
}

export default function StatsGrid({ stats, account }) {
  if (!stats || !account) return null;

  const isProfit = stats.pnl >= 0;
  const isDailyProfit = stats.dailyPnl >= 0;

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3">
      <StatCard
        icon={DollarSign}
        label="Balance"
        value={`$${stats.balance.toLocaleString()}`}
        subValue={`Equity: $${stats.equity.toLocaleString()}`}
        color="#FF5C00"
        delay={0.05}
      />
      <StatCard
        icon={isProfit ? TrendingUp : TrendingDown}
        label="Total P&L"
        value={`${isProfit ? '+' : ''}$${stats.pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        subValue={`${isProfit ? '+' : ''}${((stats.pnl / stats.size) * 100).toFixed(2)}%`}
        color={isProfit ? '#10b981' : '#ef4444'}
        delay={0.1}
      />
      <StatCard
        icon={Activity}
        label="Daily P&L"
        value={`${isDailyProfit ? '+' : ''}$${stats.dailyPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        subValue={isDailyProfit ? 'Profitable today' : 'Loss today'}
        color={isDailyProfit ? '#10b981' : '#ef4444'}
        delay={0.15}
      />
      <StatCard
        icon={BarChart3}
        label="Win Rate"
        value={`${stats.winRate.toFixed(1)}%`}
        subValue={`${stats.wins}W / ${stats.losses}L`}
        color="#3b82f6"
        delay={0.2}
      />
      <StatCard
        icon={Shield}
        label="Daily DD"
        value={`${stats.dailyDDPct.toFixed(2)}%`}
        subValue={`Max: ${stats.maxDDPct.toFixed(2)}%`}
        color="#f59e0b"
        delay={0.25}
      />
      <StatCard
        icon={TrendingUp}
        label="Profit Target"
        value={`${stats.profitTargetPct.toFixed(2)}%`}
        subValue={stats.profitTargetPct >= 10 ? 'Target reached' : 'In progress'}
        color="#8b5cf6"
        delay={0.3}
      />
    </div>
  );
}