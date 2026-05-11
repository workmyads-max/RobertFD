import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, Target, Shield, Clock, DollarSign, AlertTriangle } from 'lucide-react';
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
      <div className="absolute top-0 left-0 right-0 h-px rounded-t-2xl"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}60, transparent)` }} />
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

// Aggressive Daily P&L card
function DailyPnlCard({ dailyPnl, dailyDDPct, ddLimit, accountSize, i }) {
  const ddWarning = dailyDDPct > ddLimit * 0.7;
  const ddBreached = dailyDDPct >= ddLimit;
  const isNeg = dailyPnl < 0;
  const usedPct = Math.min((dailyDDPct / ddLimit) * 100, 100);
  const remaining = ddLimit - dailyDDPct;
  const remainingUsd = (remaining / 100) * accountSize;

  const accentColor = ddBreached ? '#ef4444' : ddWarning ? '#f97316' : isNeg ? '#f59e0b' : '#00f5a0';
  const isGreen = !ddBreached && !ddWarning && !isNeg;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3, scale: 1.01 }}
      className="relative rounded-2xl overflow-hidden group cursor-default col-span-2 md:col-span-1"
      style={{
        background: ddBreached
          ? 'linear-gradient(145deg, rgba(30,5,5,0.99), rgba(20,5,5,0.97))'
          : ddWarning
          ? 'linear-gradient(145deg, rgba(25,12,3,0.99), rgba(18,10,3,0.97))'
          : isNeg
          ? 'linear-gradient(145deg, rgba(20,12,2,0.99), rgba(15,10,2,0.97))'
          : 'linear-gradient(145deg, rgba(2,22,14,0.99), rgba(3,28,18,0.97))',
        border: `1px solid ${accentColor}${isGreen ? '50' : '30'}`,
        backdropFilter: 'blur(24px)',
        boxShadow: ddBreached ? `0 0 30px ${accentColor}25` : ddWarning ? `0 0 20px ${accentColor}20` : isGreen ? `0 0 24px ${accentColor}18` : 'none',
      }}
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, transparent, ${accentColor}90, transparent)` }} />

      {/* Animated background pulse */}
      <motion.div
        animate={{ opacity: ddBreached || ddWarning ? [0.05, 0.12, 0.05] : isGreen ? [0.02, 0.06, 0.02] : [0, 0, 0] }}
        transition={{ duration: 2.5, repeat: Infinity }}
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at center, ${accentColor}35, transparent 70%)` }}
      />

      <div className="relative z-10 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-white/30">Daily P&L</span>
            {(ddWarning || ddBreached) && (
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <AlertTriangle className="w-3 h-3" style={{ color: accentColor }} />
              </motion.div>
            )}
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black font-mono"
            style={{
              background: `${accentColor}15`,
              border: `1px solid ${accentColor}40`,
              color: accentColor,
            }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accentColor }} />
            {ddBreached ? 'LIMIT HIT' : ddWarning ? 'WARNING' : 'LIVE'}
          </div>
        </div>

        {/* Main P&L value */}
        <div className="mb-3">
          <div className="text-3xl font-black tracking-tight mb-0.5"
            style={{ color: accentColor, fontVariantNumeric: 'tabular-nums', textShadow: `0 0 20px ${accentColor}50` }}>
            {dailyPnl >= 0 ? '+' : ''}${dailyPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] font-mono text-white/25">today's realized & floating P&L</div>
        </div>

        {/* DD Usage bar */}
        <div className="mb-2">
          <div className="flex justify-between text-[10px] font-mono mb-1.5">
            <span className="text-white/30">Daily DD Used</span>
            <span style={{ color: accentColor }}>{dailyDDPct.toFixed(2)}% / {ddLimit}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${usedPct}%` }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${accentColor}60, ${accentColor})`,
                boxShadow: `0 0 12px ${accentColor}60`,
              }}
            />
          </div>
        </div>

        {/* Remaining room */}
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="text-white/25">Room left</span>
          <span className={remaining > 0 ? 'text-emerald-400/70' : 'text-red-400'}>
            {remaining > 0
              ? `${remaining.toFixed(2)}% ($${remainingUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })})`
              : '⛔ LIMIT REACHED'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default function MetricCards({ account, rules, stats }) {
  if (!stats) return null;

  const { balance, equity, pnl, dailyPnl, floatingPnl, dailyDDPct, maxDDPct, winRate, totalTrades, tradingDays } = stats;
  const ddLimit = rules?.dailyDDLimit || 5;
  const maxDDLimit = rules?.maxDDLimit || 10;
  const maxDDWarning = maxDDPct > maxDDLimit * 0.7;
  const accountSize = account?.account_size || 100000;

  const otherMetrics = [
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
      label: 'Win Rate',
      value: `${winRate.toFixed(1)}%`,
      sub: `${totalTrades} trades executed`,
      accent: '#8b5cf6',
      icon: Target,
    },
    {
      label: 'Max Drawdown',
      value: `${maxDDPct.toFixed(2)}%`,
      sub: `Limit: ${maxDDLimit}% — ${maxDDLimit - maxDDPct > 0 ? (maxDDLimit - maxDDPct).toFixed(2) + '% left' : 'BREACHED'}`,
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
      {/* Top row: 3 standard cards + aggressive Daily P&L */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {otherMetrics.map((m, i) => <MetricCard key={m.label} {...m} i={i} />)}
        <DailyPnlCard
          dailyPnl={dailyPnl}
          dailyDDPct={dailyDDPct}
          ddLimit={ddLimit}
          accountSize={accountSize}
          i={5}
        />
      </div>
      <DailyResetTimer dailyDDUsed={dailyDDPct} dailyDDLimit={ddLimit} />
    </div>
  );
}