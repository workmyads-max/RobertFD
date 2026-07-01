import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, ShieldAlert, CheckCircle2, AlertTriangle, Info, ArrowDownToLine } from 'lucide-react';

function fmt(n, d = 2) {
  return (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}

/**
 * TrailingDDMonitor — Real-time status for the One-Step trailing max drawdown.
 *
 * FTMO-style trailing: the loss floor ratchets UP with the peak balance (high water mark).
 *   floor = peak × (1 − max_dd%)
 *   breach when equity ≤ floor
 * The floor never moves down — profits are locked in as the new baseline.
 *
 * Shows:
 *  - Peak balance (high water mark)
 *  - Trailing floor (minimum allowed equity, ratchets up)
 *  - Current equity vs floor
 *  - Trailing DD used % vs limit
 *  - Status: Safe / Warning / Critical / Breached
 */
export default function TrailingDDMonitor({ account, liveEquity }) {
  const [showHelp, setShowHelp] = useState(false);

  if (!account) return null;

  const snap = account.rule_snapshot || {};
  const maxDDLimit = snap.max_dd_limit ?? 8;
  const accountSize = account.account_size || 0;

  // Peak balance (high water mark) — ratchets up only, never down.
  const peak = account.high_water_mark || accountSize || 0;
  // Trailing floor = peak × (1 − max_dd%/100). Moves UP as peak grows.
  const floor = peak * (1 - maxDDLimit / 100);

  // Current equity (live floating if available, else stored)
  const equity = liveEquity ?? account.equity ?? account.balance ?? accountSize;

  // Trailing DD used = (peak − equity) / peak × 100. Persistent peak from sync.
  const trailingDDUsed = account.max_drawdown_used || 0;
  // Real-time live trailing DD (current equity, not the daily low)
  const liveTrailingDD = peak > 0 ? Math.max(0, ((peak - equity) / peak) * 100) : 0;

  // Distance to breach
  const remainingPct = Math.max(0, maxDDLimit - liveTrailingDD);
  const remainingDollars = Math.max(0, equity - floor);

  // Status
  let status, statusColor, statusIcon, statusText;
  if (account.status === 'failed' || trailingDDUsed >= maxDDLimit) {
    status = 'breached';
    statusColor = '#ef4444';
    statusIcon = ShieldAlert;
    statusText = 'Breached';
  } else if (liveTrailingDD >= maxDDLimit * 0.8) {
    status = 'critical';
    statusColor = '#ef4444';
    statusIcon = AlertTriangle;
    statusText = 'Critical — near limit';
  } else if (liveTrailingDD >= maxDDLimit * 0.5) {
    status = 'warning';
    statusColor = '#f59e0b';
    statusIcon = AlertTriangle;
    statusText = 'Warning';
  } else {
    status = 'safe';
    statusColor = '#10b981';
    statusIcon = CheckCircle2;
    statusText = 'Safe';
  }

  // Progress bar: how much of the trailing limit is consumed
  const barPct = Math.min((liveTrailingDD / maxDDLimit) * 100, 100);

  let guidance = '';
  if (status === 'breached') {
    guidance = `Your equity has fallen below the trailing floor of $${fmt(floor)}. This account has been closed and open positions force-liquidated.`;
  } else if (status === 'critical') {
    guidance = `You are ${remainingPct.toFixed(1)}% from the trailing limit. Equity must not fall below $${fmt(floor)}. Current trailing DD: ${liveTrailingDD.toFixed(1)}% / ${maxDDLimit}%.`;
  } else if (status === 'warning') {
    guidance = `Trailing drawdown at ${liveTrailingDD.toFixed(1)}% of the ${maxDDLimit}% limit. Floor is $${fmt(floor)}. You have $${fmt(remainingDollars)} of buffer before breach.`;
  } else {
    guidance = `Trailing floor is locked at $${fmt(floor)} (peak $${fmt(peak)} − ${maxDDLimit}%). Your equity has $${fmt(remainingDollars)} of buffer. The floor ratchets up as your peak grows — profits are protected.`;
  }

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(12,12,18,0.95)',
        border: `1px solid ${status === 'breached' || status === 'critical' ? 'rgba(239,68,68,0.25)' : status === 'warning' ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.08)'}`,
      }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${statusColor}12` }}>
            <TrendingDown className="w-3.5 h-3.5" style={{ color: statusColor }} />
          </div>
          <div>
            <span className="text-sm font-bold text-foreground block leading-tight">Trailing Max Drawdown</span>
            <span className="text-[10px] text-white/35 font-mono">One-Step · {maxDDLimit}% trailing</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
          style={{ background: `${statusColor}12`, border: `1px solid ${statusColor}25` }}>
          {React.createElement(statusIcon, { className: 'w-3 h-3', style: { color: statusColor } })}
          <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: statusColor }}>{statusText}</span>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-5 space-y-5">
        {/* Main progress bar */}
        <div>
          <div className="flex items-center justify-between text-[11px] mb-2">
            <span className="text-white/40 font-medium">Trailing DD Used</span>
            <span className="font-bold font-mono" style={{ color: statusColor }}>
              {liveTrailingDD.toFixed(1)}% / {maxDDLimit}%
            </span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden relative" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="absolute top-0 bottom-0 w-0.5 bg-white/30 z-10" style={{ left: `${(maxDDLimit / Math.max(maxDDLimit, liveTrailingDD, maxDDLimit * 1.2)) * 100}%` }} />
            <motion.div className="h-full rounded-full"
              initial={{ width: 0 }} animate={{ width: `${barPct}%` }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              style={{ background: statusColor }} />
          </div>
        </div>

        {/* Three-column metrics */}
        <div className="grid grid-cols-3 gap-3">
          {/* Peak */}
          <div className="rounded-xl p-3.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-white/35 mb-2">
              <ArrowDownToLine className="w-3 h-3" />
              Peak
            </div>
            <div className="text-base font-bold font-mono text-white">${fmt(peak, 0)}</div>
            <div className="text-[10px] text-white/30 mt-1 font-mono">high water mark</div>
          </div>

          {/* Trailing Floor */}
          <div className="rounded-xl p-3.5" style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-white/35 mb-2">
              <ShieldAlert className="w-3 h-3" />
              Trailing Floor
            </div>
            <div className="text-base font-bold font-mono" style={{ color: '#ef4444' }}>${fmt(floor, 0)}</div>
            <div className="text-[10px] text-white/30 mt-1 font-mono">min allowed equity</div>
          </div>

          {/* Current Equity */}
          <div className="rounded-xl p-3.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-white/35 mb-2">
              <TrendingDown className="w-3 h-3" />
              Equity
            </div>
            <div className="text-base font-bold font-mono" style={{ color: equity >= floor ? '#10b981' : '#ef4444' }}>${fmt(equity, 0)}</div>
            <div className="text-[10px] text-white/30 mt-1 font-mono">{fmt(remainingDollars, 0)} buffer</div>
          </div>
        </div>

        {/* Guidance text */}
        <div className="rounded-xl p-3.5 flex items-start gap-2.5"
          style={{ background: `${statusColor}08`, border: `1px solid ${statusColor}15` }}>
          <div className="flex-1">
            <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>{guidance}</p>
          </div>
          <button onClick={() => setShowHelp(v => !v)} className="flex-shrink-0 text-white/30 hover:text-white/60 transition-colors">
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Expandable help */}
        {showHelp && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            className="rounded-xl p-4 text-[11px] leading-relaxed"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-white/40">
              <span className="font-bold text-white/60">How it works:</span> The trailing max drawdown ratchets up with your peak balance. Your loss floor = peak × (1 − {maxDDLimit}%). As your balance hits new highs, the floor rises — locking in profits. The floor never moves down.
            </p>
            <p className="text-white/40 mt-2">
              <span className="font-bold text-white/60">Example:</span> On a $100K account, your starting floor is $92,000. If your balance peaks at $110,000, the floor ratchets up to $101,200 (110K × 92%). If it then pulls back to $101,000, you breach — even though you are still up $1K overall.
            </p>
            <p className="text-white/40 mt-2">
              <span className="font-bold text-white/60">vs. static:</span> A static floor stays at $92,000 forever and lets you give back nearly all profits. Trailing protects gains the moment you bank them.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}