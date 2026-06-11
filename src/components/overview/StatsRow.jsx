import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Activity, DollarSign } from 'lucide-react';

export default function StatsRow({ account, livePositions, balance }) {
  const liveUnrealizedPnl = (livePositions || []).reduce((s, p) => s + (p.pnl || 0), 0);
  const liveEquity = livePositions?.length > 0 ? balance + liveUnrealizedPnl : (account?.equity || balance);

  const stats = [
    {
      label: "Today's P&L",
      value: account?.daily_pnl || 0,
      icon: TrendingUp,
      color: (account?.daily_pnl || 0) >= 0 ? '#00ff80' : '#ff4444',
      prefix: (account?.daily_pnl || 0) >= 0 ? '+' : ''
    },
    {
      label: 'Live Equity',
      value: liveEquity,
      icon: Activity,
      color: '#2080ff',
      isCurrency: true
    },
    {
      label: 'Unrealized P&L',
      value: liveUnrealizedPnl,
      icon: DollarSign,
      color: liveUnrealizedPnl >= 0 ? '#00ff80' : '#ff4444',
      prefix: liveUnrealizedPnl >= 0 ? '+' : ''
    }
  ];

  const fmt = (n) => {
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-3 gap-3"
    >
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="rounded-xl p-3"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Icon className="w-3 h-3" style={{ color: stat.color }} />
              <span className="text-[9px] font-semibold text-white/40">{stat.label}</span>
            </div>
            <div className="text-lg font-black font-mono" style={{ color: stat.color }}>
              {stat.prefix || ''}${fmt(stat.value)}
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}