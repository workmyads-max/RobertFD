import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, Target, Shield, Clock, DollarSign, AlertTriangle, Zap } from 'lucide-react';
import DailyResetTimer from '../shared/DailyResetTimer';

// ── Live animated number ──────────────────────────────────────────────────────
function LiveNumber({ value, prefix = '', decimals = 2, className = '' }) {
  const [display, setDisplay] = useState(value);
  useEffect(() => { setDisplay(value); }, [value]);
  const formatted = Math.abs(display).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return (
    <span className={className}>
      {prefix}{display < 0 ? '-' : ''}${formatted}
    </span>
  );
}

// ── Generic metric card ───────────────────────────────────────────────────────
function MetricCard({ label, value, sub, accent, icon: Icon, i, pulse }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3, scale: 1.01 }}
      className="relative rounded-2xl p-5 overflow-hidden group cursor-default"
      style={{
        background: 'rgba(14,18,30,0.85)',
        border: '1px solid rgba(255,255,255,0.09)',
        backdropFilter: 'blur(24px)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-px rounded-t-2xl"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}60, transparent)` }} />
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none"
        style={{ background: `radial-gradient(circle at top left, ${accent}08, transparent 60%)` }} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-white/50">{label}</span>
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
        {sub && <div className="text-[11px] text-white/45 font-mono">{sub}</div>}
      </div>
    </motion.div>
  );
}

// ── LIVE Total P&L Card (green/red based on real profit) ──────────────────────
function TotalPnlCard({ pnl, floatingPnl, equity, balance, i }) {
  const isProfit = pnl >= 0;
  const totalLive = pnl + floatingPnl; // realized + floating
  const isLiveProfit = totalLive >= 0;
  const accent = isLiveProfit ? '#00f5a0' : '#ef4444';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3, scale: 1.01 }}
      className="relative rounded-2xl overflow-hidden group cursor-default"
      style={{
        background: isLiveProfit
          ? 'rgba(5,28,18,0.88)'
          : 'rgba(36,7,7,0.88)',
        border: `1px solid ${accent}40`,
        backdropFilter: 'blur(24px)',
        boxShadow: `0 0 30px ${accent}18`,
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}90, transparent)` }} />

      <motion.div
        animate={{ opacity: [0.03, 0.08, 0.03] }}
        transition={{ duration: 2.5, repeat: Infinity }}
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at center, ${accent}30, transparent 70%)` }}
      />

      <div className="relative z-10 p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-white/30">Account Profit</span>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black font-mono"
            style={{ background: `${accent}15`, border: `1px solid ${accent}40`, color: accent }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accent }} />
            LIVE
          </div>
        </div>

        {/* Main value */}
        <div className="mb-2">
          <motion.div
            key={Math.round(totalLive * 100)}
            initial={{ scale: 0.97, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="text-3xl font-black tracking-tight"
            style={{ color: accent, fontVariantNumeric: 'tabular-nums', textShadow: `0 0 24px ${accent}50` }}>
            {totalLive >= 0 ? '+' : ''}${Math.abs(totalLive).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </motion.div>
          <div className="text-[10px] font-mono text-white/25 mt-0.5">realized + floating P&L</div>
        </div>

        {/* Sub row */}
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="text-white/25">Realized: <span className={pnl >= 0 ? 'text-emerald-400/70' : 'text-red-400/70'}>{pnl >= 0 ? '+' : ''}${pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></span>
          <span className="text-white/25">Float: <span className={floatingPnl >= 0 ? 'text-emerald-400/70' : 'text-red-400/70'}>{floatingPnl >= 0 ? '+' : ''}${floatingPnl.toFixed(2)}</span></span>
        </div>
      </div>
    </motion.div>
  );
}

// ── LIVE Daily P&L Card ───────────────────────────────────────────────────────
function DailyPnlCard({ dailyPnl, floatingPnl, dailyDDPct, ddLimit, accountSize, i }) {
  // Daily P&L = today's closed + current floating
  const liveDailyPnl = dailyPnl + floatingPnl;
  const ddWarning = dailyDDPct > ddLimit * 0.7;
  const ddBreached = dailyDDPct >= ddLimit;
  const isNeg = liveDailyPnl < 0;
  const usedPct = Math.min((dailyDDPct / ddLimit) * 100, 100);
  const remaining = ddLimit - dailyDDPct;
  const remainingUsd = (remaining / 100) * accountSize;

  const accent = ddBreached ? '#ef4444' : ddWarning ? '#f97316' : isNeg ? '#f59e0b' : '#00f5a0';
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
          ? 'rgba(36,7,7,0.88)'
          : ddWarning ? 'rgba(32,14,3,0.88)'
          : isNeg ? 'rgba(26,14,3,0.88)'
          : 'rgba(5,28,18,0.88)',
        border: `1px solid ${accent}${isGreen ? '50' : '30'}`,
        backdropFilter: 'blur(24px)',
        boxShadow: ddBreached ? `0 0 30px ${accent}25` : isGreen ? `0 0 24px ${accent}18` : 'none',
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}90, transparent)` }} />
      <motion.div
        animate={{ opacity: [0.02, 0.07, 0.02] }}
        transition={{ duration: 2.5, repeat: Infinity }}
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at center, ${accent}35, transparent 70%)` }}
      />

      <div className="relative z-10 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-white/30">Daily P&L</span>
            {(ddWarning || ddBreached) && (
              <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                <AlertTriangle className="w-3 h-3" style={{ color: accent }} />
              </motion.div>
            )}
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black font-mono"
            style={{ background: `${accent}15`, border: `1px solid ${accent}40`, color: accent }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accent }} />
            {ddBreached ? 'LIMIT HIT' : ddWarning ? 'WARNING' : 'LIVE'}
          </div>
        </div>

        <div className="mb-3">
          <motion.div
            key={Math.round(liveDailyPnl * 100)}
            initial={{ scale: 0.97, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="text-3xl font-black tracking-tight mb-0.5"
            style={{ color: accent, fontVariantNumeric: 'tabular-nums', textShadow: `0 0 20px ${accent}50` }}>
            {liveDailyPnl >= 0 ? '+' : ''}${Math.abs(liveDailyPnl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </motion.div>
          <div className="text-[10px] font-mono text-white/25">today's realized + floating P&L</div>
        </div>

        <div className="mb-2">
          <div className="flex justify-between text-[10px] font-mono mb-1.5">
            <span className="text-white/30">Daily DD Used</span>
            <span style={{ color: accent }}>{dailyDDPct.toFixed(2)}% / {ddLimit}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${usedPct}%` }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${accent}60, ${accent})`, boxShadow: `0 0 12px ${accent}60` }}
            />
          </div>
        </div>

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

// ── Main export ───────────────────────────────────────────────────────────────
export default function MetricCards({ account, rules, stats }) {
  if (!stats) return null;

  const { balance, equity, pnl, dailyPnl, floatingPnl, dailyDDPct, maxDDPct, winRate, totalTrades, tradingDays } = stats;
  const ddLimit    = rules?.dailyDDLimit || 5;
  const maxDDLimit = rules?.maxDDLimit || 10;
  const maxDDWarn  = maxDDPct > maxDDLimit * 0.7;
  const accountSize = account?.account_size || 100000;

  const standardCards = [
    {
      label: 'Account Balance',
      value: `$${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sub: `Equity: $${equity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      accent: '#FF5C00',
      icon: DollarSign,
      pulse: true,
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
      accent: maxDDWarn ? '#ef4444' : '#FF5C00',
      icon: Shield,
      pulse: maxDDWarn,
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
        {/* Standard cards */}
        {standardCards.map((m, i) => <MetricCard key={m.label} {...m} i={i} />)}

        {/* LIVE Total P&L card */}
        <TotalPnlCard
          pnl={pnl}
          floatingPnl={floatingPnl}
          equity={equity}
          balance={balance}
          i={4}
        />

        {/* LIVE Daily P&L card */}
        <DailyPnlCard
          dailyPnl={dailyPnl}
          floatingPnl={floatingPnl}
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