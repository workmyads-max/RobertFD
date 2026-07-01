import React, { useState } from 'react';
import { TrendingDown, ShieldAlert, CheckCircle2, AlertTriangle, Info, ArrowUpRight } from 'lucide-react';

function fmt(n, d = 2) {
  return (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}

/**
 * TrailingDDMonitor — Flat, non-card status bar for One-Step trailing max drawdown.
 * Matches the minimalist reference bar aesthetic: no raised borders, generous
 * whitespace, 1px vertical dividers, mono data, subtle icon pills.
 */
export default function TrailingDDMonitor({ account, liveEquity }) {
  const [showHelp, setShowHelp] = useState(false);
  if (!account) return null;

  const snap = account.rule_snapshot || {};
  const maxDDLimit = snap.max_dd_limit ?? 8;
  const accountSize = account.account_size || 0;

  const peak = account.high_water_mark || accountSize || 0;
  const floor = peak * (1 - maxDDLimit / 100);
  const equity = liveEquity ?? account.equity ?? account.balance ?? accountSize;
  const trailingDDUsed = account.max_drawdown_used || 0;
  const liveTrailingDD = peak > 0 ? Math.max(0, ((peak - equity) / peak) * 100) : 0;
  const remainingPct = Math.max(0, maxDDLimit - liveTrailingDD);
  const remainingDollars = Math.max(0, equity - floor);

  let status, statusColor, statusIcon, statusText;
  if (account.status === 'failed' || trailingDDUsed >= maxDDLimit) {
    status = 'breached'; statusColor = '#ff5252'; statusIcon = ShieldAlert; statusText = 'Breached';
  } else if (liveTrailingDD >= maxDDLimit * 0.8) {
    status = 'critical'; statusColor = '#ff5252'; statusIcon = AlertTriangle; statusText = 'Critical';
  } else if (liveTrailingDD >= maxDDLimit * 0.5) {
    status = 'warning'; statusColor = '#ff9100'; statusIcon = AlertTriangle; statusText = 'Warning';
  } else {
    status = 'safe'; statusColor = '#00e676'; statusIcon = CheckCircle2; statusText = 'Safe';
  }

  let guidance = '';
  if (status === 'breached') {
    guidance = `Equity fell below the trailing floor of $${fmt(floor, 0)}. Account closed and positions force-liquidated.`;
  } else if (status === 'critical') {
    guidance = `${remainingPct.toFixed(1)}% from the limit. Equity must stay above $${fmt(floor, 0)}. Trailing DD: ${liveTrailingDD.toFixed(1)}% / ${maxDDLimit}%.`;
  } else if (status === 'warning') {
    guidance = `Trailing DD at ${liveTrailingDD.toFixed(1)}% of the ${maxDDLimit}% limit. Floor $${fmt(floor, 0)}. $${fmt(remainingDollars, 0)} buffer.`;
  } else {
    guidance = `Floor locked at $${fmt(floor, 0)} (peak $${fmt(peak, 0)} - ${maxDDLimit}%). $${fmt(remainingDollars, 0)} buffer. Floor ratchets up as peak grows.`;
  }

  const dividers = 5; // number of vertical separators

  return (
    <div className="w-full">
      {/* Main flat status bar */}
      <div
        className="flex items-stretch w-full rounded-xl overflow-hidden"
        style={{ background: '#0b0d11', border: '1px solid rgba(255,255,255,0.04)' }}
      >
        {/* Status pill module */}
        <div className="flex items-center gap-2 px-4 py-3.5">
          <span
            className="flex items-center justify-center rounded-full"
            style={{ width: 26, height: 26, background: `${statusColor}14` }}
          >
            {React.createElement(statusIcon, { style: { width: 13, height: 13, color: statusColor } })}
          </span>
          <div className="leading-tight">
            <div className="text-[9px] uppercase tracking-widest" style={{ color: '#757575' }}>
              Trailing Status
            </div>
            <div className="text-xs font-bold" style={{ color: statusColor }}>
              {statusText}
            </div>
          </div>
        </div>

        <div style={{ width: 1, background: 'rgba(255,255,255,0.05)' }} />

        {/* Peak */}
        <div className="flex items-center gap-2.5 px-4 py-3.5">
          <span className="flex items-center justify-center rounded-full" style={{ width: 26, height: 26, background: '#1a1d23' }}>
            <ArrowUpRight style={{ width: 13, height: 13, color: '#e0e0e0' }} />
          </span>
          <div className="leading-tight">
            <div className="text-[9px] uppercase tracking-widest" style={{ color: '#757575' }}>Peak</div>
            <div className="text-xs font-mono font-semibold" style={{ color: '#e0e0e0' }}>${fmt(peak, 0)}</div>
          </div>
        </div>

        <div style={{ width: 1, background: 'rgba(255,255,255,0.05)' }} />

        {/* Trailing Floor */}
        <div className="flex items-center gap-2.5 px-4 py-3.5">
          <span className="flex items-center justify-center rounded-full" style={{ width: 26, height: 26, background: '#1e2a23' }}>
            <ShieldAlert style={{ width: 13, height: 13, color: statusColor }} />
          </span>
          <div className="leading-tight">
            <div className="text-[9px] uppercase tracking-widest" style={{ color: '#757575' }}>Trailing Floor</div>
            <div className="text-xs font-mono font-semibold" style={{ color: statusColor }}>${fmt(floor, 0)}</div>
          </div>
        </div>

        <div style={{ width: 1, background: 'rgba(255,255,255,0.05)' }} />

        {/* Equity */}
        <div className="flex items-center gap-2.5 px-4 py-3.5">
          <span className="flex items-center justify-center rounded-full" style={{ width: 26, height: 26, background: '#1a1d23' }}>
            <TrendingDown style={{ width: 13, height: 13, color: equity >= floor ? '#00e676' : '#ff5252' }} />
          </span>
          <div className="leading-tight">
            <div className="text-[9px] uppercase tracking-widest" style={{ color: '#757575' }}>Equity</div>
            <div className="text-xs font-mono font-semibold" style={{ color: equity >= floor ? '#00e676' : '#ff5252' }}>${fmt(equity, 0)}</div>
          </div>
        </div>

        {/* Spacer pushes the rest right */}
        <div className="flex-1" />

        {/* DD used meter + limit */}
        <div className="flex items-center gap-2.5 px-4 py-3.5">
          <div className="leading-tight text-right">
            <div className="text-[9px] uppercase tracking-widest" style={{ color: '#757575' }}>Trailing DD</div>
            <div className="text-xs font-mono font-semibold" style={{ color: statusColor }}>
              {liveTrailingDD.toFixed(1)}% <span style={{ color: '#757575' }}>/ {maxDDLimit}%</span>
            </div>
          </div>
          {/* Mini inline bar */}
          <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${Math.min((liveTrailingDD / maxDDLimit) * 100, 100)}%`, background: statusColor }} />
          </div>
        </div>

        <div style={{ width: 1, background: 'rgba(255,255,255,0.05)' }} />

        {/* Buffer */}
        <div className="flex items-center px-4 py-3.5">
          <div className="leading-tight text-right">
            <div className="text-[9px] uppercase tracking-widest" style={{ color: '#757575' }}>Buffer</div>
            <div className="text-xs font-mono font-semibold" style={{ color: remainingDollars < peak * maxDDLimit / 100 * 0.3 ? '#ff9100' : '#e0e0e0' }}>
              ${fmt(remainingDollars, 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Footnote line — flat, italic, subtle */}
      <div className="flex items-center gap-2 px-1 pt-2.5 pb-1">
        <p className="text-[11px] leading-relaxed italic flex-1" style={{ color: '#757575' }}>
          {guidance}
        </p>
        <button onClick={() => setShowHelp(v => !v)} className="flex-shrink-0 transition-colors" style={{ color: '#757575' }}>
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Expandable help — minimal, no card */}
      {showHelp && (
        <div className="px-1 pt-1 pb-2 text-[11px] leading-relaxed" style={{ color: '#757575' }}>
          <p>
            <span className="font-semibold" style={{ color: '#9aa0a6' }}>How it works</span> — the floor ratchets up with your peak balance and never moves down. Floor = peak x (1 - {maxDDLimit}%). A new high locks in your gains as the new baseline.
          </p>
          <p className="mt-1.5">
            <span className="font-semibold" style={{ color: '#9aa0a6' }}>Example</span> — $100K account starts at a $92,000 floor. Peak at $110K raises the floor to $101,200. A pullback to $101,000 breaches even while still up $1K overall.
          </p>
          <p className="mt-1.5">
            <span className="font-semibold" style={{ color: '#9aa0a6' }}>vs static</span> — a static floor stays at $92,000 and lets you give back nearly all profit. Trailing protects gains the moment you bank them.
          </p>
        </div>
      )}
    </div>
  );
}