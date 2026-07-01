import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award, TrendingDown, ShieldAlert, Info, ArrowUpRight, Activity, Layers,
} from 'lucide-react';

function fmt(n, d = 2) {
  return (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}
function fmtDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * StatusDot — modern-classic status indicator.
 * A solid filled dot + uppercase label. No translucent fill, no glow border.
 * Editorial / terminal aesthetic, not the glassy "AI" pill look.
 */
function StatusDot({ color, label, dotSize = 6, textSize = 'text-[10px]' }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="rounded-full flex-shrink-0" style={{ width: dotSize, height: dotSize, background: color }} />
      <span className={`${textSize} font-semibold uppercase tracking-[0.12em]`} style={{ color }}>{label}</span>
    </span>
  );
}

/**
 * OneStepRiskPanel — Unified risk monitor for One-Step challenge accounts.
 *
 * Merges two FTMO-style rules into a single advanced panel:
 *   1. Best Day Rule (review-only, payout eligibility)
 *   2. Trailing Max Drawdown (auto-breach, ratchets with peak balance)
 *
 * Flat, card-less aesthetic: dark base, 1px dividers, mono data, thin meters.
 */
export default function OneStepRiskPanel({ account, stats, closedTrades = [], liveEquity }) {
  const [showHelp, setShowHelp] = useState(false);

  if (!account || !stats) return null;

  const snap = account.rule_snapshot || {};
  const accountSize = account.account_size || 0;

  // ── BEST DAY RULE ──────────────────────────────────────────────────────────
  const rulePct = snap.best_day_rule_pct ?? 50;
  const totalProfit = stats.closedPnl || 0;
  const bestDayProfit = stats.bestDayProfit || 0;
  const bestDayPct = stats.bestDayPct || 0;
  const bestDayDate = stats.bestDayDate || null;
  const maxAllowedDaily = totalProfit > 0 ? totalProfit * (rulePct / 100) : 0;

  let bdStatus, bdColor, bdText;
  if (totalProfit <= 0) {
    bdStatus = 'idle'; bdColor = '#64748b'; bdText = 'No profit yet';
  } else if (bestDayPct <= rulePct * 0.8) {
    bdStatus = 'compliant'; bdColor = '#10b981'; bdText = 'Compliant';
  } else if (bestDayPct <= rulePct) {
    bdStatus = 'warning'; bdColor = '#f59e0b'; bdText = 'Near limit';
  } else {
    bdStatus = 'exceeded'; bdColor = '#ef4444'; bdText = 'Exceeded';
  }
  const bdBarPct = totalProfit > 0 ? Math.min((bestDayPct / rulePct) * 100, 100) : 0;

  let bdGuidance = '';
  if (bdStatus === 'idle') {
    bdGuidance = 'Best day rule activates once you have closed-trade profit.';
  } else if (bdStatus === 'compliant') {
    bdGuidance = `Best day is ${bestDayPct.toFixed(1)}% of total profit — within the ${rulePct}% limit.`;
  } else if (bdStatus === 'warning') {
    bdGuidance = `Best day at ${bestDayPct.toFixed(1)}% — approaching the ${rulePct}% limit. Keep trading to dilute.`;
  } else {
    const need = bestDayProfit / (rulePct / 100) - totalProfit;
    bdGuidance = `Best day exceeds ${rulePct}% (${bestDayPct.toFixed(1)}%). Need ~$${fmt(need)} more profit to comply. Payouts blocked.`;
  }

  // ── TRAILING MAX DRAWDOWN ───────────────────────────────────────────────────
  const maxDDLimit = snap.max_dd_limit ?? 8;
  const peak = account.high_water_mark || accountSize || 0;
  const floor = peak * (1 - maxDDLimit / 100);
  const equity = liveEquity ?? account.equity ?? account.balance ?? accountSize;
  const trailingDDUsed = account.max_drawdown_used || 0;
  const liveTrailingDD = peak > 0 ? Math.max(0, ((peak - equity) / peak) * 100) : 0;
  const remainingDollars = Math.max(0, equity - floor);

  let tddStatus, tddColor, tddText;
  if (account.status === 'failed' || trailingDDUsed >= maxDDLimit) {
    tddStatus = 'breached'; tddColor = '#ef4444'; tddText = 'Breached';
  } else if (liveTrailingDD >= maxDDLimit * 0.8) {
    tddStatus = 'critical'; tddColor = '#ef4444'; tddText = 'Critical';
  } else if (liveTrailingDD >= maxDDLimit * 0.5) {
    tddStatus = 'warning'; tddColor = '#f59e0b'; tddText = 'Warning';
  } else {
    tddStatus = 'safe'; tddColor = '#10b981'; tddText = 'Safe';
  }
  const tddBarPct = Math.min((liveTrailingDD / maxDDLimit) * 100, 100);

  let tddGuidance = '';
  if (tddStatus === 'breached') {
    tddGuidance = `Equity fell below the trailing floor of $${fmt(floor, 0)}. Account closed.`;
  } else if (tddStatus === 'critical') {
    tddGuidance = `${(maxDDLimit - liveTrailingDD).toFixed(1)}% from the limit. Equity must stay above $${fmt(floor, 0)}.`;
  } else if (tddStatus === 'warning') {
    tddGuidance = `Trailing DD at ${liveTrailingDD.toFixed(1)}% of ${maxDDLimit}%. Floor $${fmt(floor, 0)}. $${fmt(remainingDollars, 0)} buffer.`;
  } else {
    tddGuidance = `Floor locked at $${fmt(floor, 0)} (peak $${fmt(peak, 0)} - ${maxDDLimit}%). $${fmt(remainingDollars, 0)} buffer.`;
  }

  // ── OVERALL VERDICT ─────────────────────────────────────────────────────────
  let verdictColor, verdictText;
  if (tddStatus === 'breached' || bdStatus === 'exceeded') {
    verdictColor = '#ef4444'; verdictText = 'Payout blocked';
  } else if (tddStatus === 'critical' || tddStatus === 'warning' || bdStatus === 'warning') {
    verdictColor = '#f59e0b'; verdictText = 'At risk';
  } else {
    verdictColor = '#10b981'; verdictText = 'Trade ready';
  }

  // Threshold tick position on best-day meter
  const bdTickPos = totalProfit > 0 && bestDayPct > rulePct
    ? 100
    : (rulePct / Math.max(rulePct, bestDayPct, rulePct * 1.2)) * 100;

  return (
    <div className="w-full rounded-2xl overflow-hidden"
      style={{ background: '#0b0d11', border: '1px solid rgba(255,255,255,0.06)' }}>
      {/* ── Header strip ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center justify-center rounded-lg" style={{ width: 30, height: 30, background: 'rgba(255,92,0,0.1)' }}>
            <Layers className="w-4 h-4" style={{ color: '#FF5C00' }} />
          </span>
          <div className="leading-tight">
            <div className="text-sm font-bold text-white">One-Step Risk Monitor</div>
            <div className="text-[10px] font-mono" style={{ color: '#6e7075' }}>
              Best Day {rulePct}% · Trailing {maxDDLimit}%
            </div>
          </div>
        </div>
        <StatusDot color={verdictColor} label={verdictText} dotSize={7} textSize="text-[11px]" />
      </div>

      {/* Accent line */}
      <div className="h-px w-full" style={{ background: `linear-gradient(90deg, ${verdictColor}40, transparent 60%)` }} />

      {/* ── Twin risk modules ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* ═══ LEFT: BEST DAY RULE ═════════════════════════════════════════════ */}
        <div className="px-5 py-5 lg:border-r" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          {/* module header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center rounded-full" style={{ width: 24, height: 24, background: `${bdColor}12` }}>
                <Award className="w-3 h-3" style={{ color: bdColor }} />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#9aa0a6' }}>Best Day Rule</span>
            </div>
            <StatusDot color={bdColor} label={bdText} dotSize={6} textSize="text-[10px]" />
          </div>

          {/* meter */}
          <div className="mb-4">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wide" style={{ color: '#6e7075' }}>Best day vs total</span>
              <span className="text-xs font-mono font-semibold" style={{ color: bdColor }}>
                {bestDayPct.toFixed(1)}%<span style={{ color: '#6e7075' }}> / {rulePct}%</span>
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden relative" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div className="absolute top-0 bottom-0 z-10" style={{ left: `${bdTickPos}%`, width: 1, background: 'rgba(255,255,255,0.25)' }} />
              <motion.div className="h-full rounded-full"
                initial={{ width: 0 }} animate={{ width: `${bdBarPct}%` }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                style={{ background: bdColor }} />
            </div>
          </div>

          {/* metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: '#6e7075' }}>Best Day P&L</div>
              <div className="text-base font-mono font-bold" style={{ color: bestDayProfit > 0 ? '#00e676' : '#6e7075' }}>
                {bestDayProfit > 0 ? '+' : ''}${fmt(bestDayProfit)}
              </div>
              <div className="text-[10px] mt-0.5 font-mono" style={{ color: '#404040' }}>{fmtDate(bestDayDate)}</div>
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: '#6e7075' }}>Max Allowed ({rulePct}%)</div>
              <div className="text-base font-mono font-bold" style={{ color: '#FF5C00' }}>${fmt(maxAllowedDaily)}</div>
              <div className="text-[10px] mt-0.5 font-mono" style={{ color: '#404040' }}>of ${fmt(totalProfit)} total</div>
            </div>
          </div>

          {/* mini guidance */}
          <p className="text-[11px] leading-relaxed mt-4" style={{ color: '#8a8f96' }}>
            {bdGuidance}
          </p>
        </div>

        {/* ═══ RIGHT: TRAILING MAX DRAWDOWN ═════════════════════════════════════ */}
        <div className="px-5 py-5">
          {/* module header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center rounded-full" style={{ width: 24, height: 24, background: `${tddColor}12` }}>
                <TrendingDown className="w-3 h-3" style={{ color: tddColor }} />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#9aa0a6' }}>Trailing Max Drawdown</span>
            </div>
            <StatusDot color={tddColor} label={tddText} dotSize={6} textSize="text-[10px]" />
          </div>

          {/* meter */}
          <div className="mb-4">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wide" style={{ color: '#6e7075' }}>Trailing DD used</span>
              <span className="text-xs font-mono font-semibold" style={{ color: tddColor }}>
                {liveTrailingDD.toFixed(1)}%<span style={{ color: '#6e7075' }}> / {maxDDLimit}%</span>
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden relative" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div className="absolute top-0 bottom-0 z-10" style={{ left: '100%', width: 1, background: 'rgba(255,255,255,0.25)' }} />
              <motion.div className="h-full rounded-full"
                initial={{ width: 0 }} animate={{ width: `${tddBarPct}%` }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                style={{ background: tddColor }} />
            </div>
          </div>

          {/* metrics — 3 tight columns */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <div className="flex items-center gap-1 text-[9px] uppercase tracking-widest mb-1" style={{ color: '#6e7075' }}>
                <ArrowUpRight className="w-2.5 h-2.5" /> Peak
              </div>
              <div className="text-sm font-mono font-bold text-white">${fmt(peak, 0)}</div>
              <div className="text-[10px] mt-0.5 font-mono" style={{ color: '#404040' }}>high water mark</div>
            </div>
            <div>
              <div className="flex items-center gap-1 text-[9px] uppercase tracking-widest mb-1" style={{ color: '#6e7075' }}>
                <ShieldAlert className="w-2.5 h-2.5" /> Floor
              </div>
              <div className="text-sm font-mono font-bold" style={{ color: tddColor }}>${fmt(floor, 0)}</div>
              <div className="text-[10px] mt-0.5 font-mono" style={{ color: '#404040' }}>min equity</div>
            </div>
            <div>
              <div className="flex items-center gap-1 text-[9px] uppercase tracking-widest mb-1" style={{ color: '#6e7075' }}>
                <Activity className="w-2.5 h-2.5" /> Equity
              </div>
              <div className="text-sm font-mono font-bold" style={{ color: equity >= floor ? '#00e676' : '#ef4444' }}>${fmt(equity, 0)}</div>
              <div className="text-[10px] mt-0.5 font-mono" style={{ color: '#404040' }}>{fmt(remainingDollars, 0)} buffer</div>
            </div>
          </div>

          {/* mini guidance */}
          <p className="text-[11px] leading-relaxed mt-4" style={{ color: '#8a8f96' }}>
            {tddGuidance}
          </p>
        </div>
      </div>

      {/* ── Footer: unified footnote + info toggle ──────────────────────────── */}
      <div className="flex items-center gap-2 px-5 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
        <p className="text-[11px] italic flex-1" style={{ color: '#6e7075' }}>
          {tddStatus === 'breached' ? tddGuidance : bdStatus === 'exceeded' ? bdGuidance : 'Both rules within tolerance. Floor ratchets up with peak; keep trading to balance your best day.'}
        </p>
        <button onClick={() => setShowHelp(v => !v)} className="flex-shrink-0 transition-colors" style={{ color: '#6e7075' }}>
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Expandable help ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showHelp && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="px-5 pb-4 text-[11px] leading-relaxed space-y-2" style={{ color: '#8a8f96' }}>
            <div>
              <span className="font-semibold" style={{ color: '#c0c4c9' }}>Best Day Rule</span> — no single day's profit may exceed {rulePct}% of your total profit. Review-only: it blocks payouts, never auto-breaches. Dilute by continuing to trade.
            </div>
            <div>
              <span className="font-semibold" style={{ color: '#c0c4c9' }}>Trailing Max Drawdown</span> — the floor ratchets up with your peak balance and never moves down. Floor = peak × (1 − {maxDDLimit}%). Breaching it auto-closes the account and force-liquidates positions.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}