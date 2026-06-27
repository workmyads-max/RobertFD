import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Award, TrendingUp, AlertTriangle, CheckCircle2, XCircle, Info } from 'lucide-react';

function fmt(n, d = 2) {
  return (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}

function fmtDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * BestDayMonitor — Real-time tracker for the One-Step "Best Day Rule".
 *
 * Rule: No single trading day's profit may exceed best_day_rule_pct% (default 50%)
 * of the account's total profit. This is a REVIEW-ONLY rule (not auto-breach),
 * checked at payout eligibility — not during trading.
 *
 * Shows:
 *  - Current best day P&L + date
 *  - Current best day % vs max allowed %
 *  - Compliance status (Compliant / Warning / Exceeded)
 *  - Max allowed daily profit amount
 */
export default function BestDayMonitor({ account, stats, closedTrades = [] }) {
  const [showHelp, setShowHelp] = useState(false);

  if (!account || !stats) return null;

  const snap = account.rule_snapshot || {};
  const rulePct = snap.best_day_rule_pct ?? 50;
  const accountSize = account.account_size || 0;
  const totalProfit = stats.closedPnl || 0;
  const bestDayProfit = stats.bestDayProfit || 0;
  const bestDayPct = stats.bestDayPct || 0;
  const bestDayDate = stats.bestDayDate || null;

  // Max allowed profit for a single day = rulePct% of total profit
  const maxAllowedDaily = totalProfit > 0 ? totalProfit * (rulePct / 100) : 0;

  // Status determination
  // - If no profit yet: "Not Started" (grey)
  // - If bestDayPct <= rulePct: "Compliant" (green)
  // - If bestDayPct > rulePct but within 10% of threshold: "Warning" (amber)
  // - If bestDayPct > rulePct: "Exceeded" (red) — payout will be blocked
  let status, statusColor, statusIcon, statusText;
  if (totalProfit <= 0) {
    status = 'idle';
    statusColor = '#64748b';
    statusIcon = Info;
    statusText = 'No profit yet';
  } else if (bestDayPct <= rulePct * 0.8) {
    status = 'compliant';
    statusColor = '#10b981';
    statusIcon = CheckCircle2;
    statusText = 'Compliant';
  } else if (bestDayPct <= rulePct) {
    status = 'warning';
    statusColor = '#f59e0b';
    statusIcon = AlertTriangle;
    statusText = 'Warning — Near limit';
  } else {
    status = 'exceeded';
    statusColor = '#ef4444';
    statusIcon = XCircle;
    statusText = 'Rule exceeded';
  }

  // Progress bar: how much of the allowed limit is consumed
  const barPct = totalProfit > 0 ? Math.min((bestDayPct / rulePct) * 100, 100) : 0;

  // Helpful guidance text
  let guidance = '';
  if (status === 'idle') {
    guidance = 'Start trading to build profit. The best day rule activates once you have closed-trade profit.';
  } else if (status === 'compliant') {
    guidance = `Your best day represents ${bestDayPct.toFixed(1)}% of total profit — well within the ${rulePct}% limit.`;
  } else if (status === 'warning') {
    guidance = `Your best day is ${bestDayPct.toFixed(1)}% of total profit — approaching the ${rulePct}% limit. Continue trading to dilute this ratio.`;
  } else {
    const additionalProfitNeeded = bestDayProfit / (rulePct / 100) - totalProfit;
    guidance = `Your best day exceeds the ${rulePct}% limit (${bestDayPct.toFixed(1)}%). You need approximately $${fmt(additionalProfitNeeded)} more total profit to become compliant. Payouts are blocked until resolved.`;
  }

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(12,12,18,0.95)',
        border: `1px solid ${status === 'exceeded' ? 'rgba(239,68,68,0.25)' : status === 'warning' ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.08)'}`,
      }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: `${statusColor}12` }}>
            <Award className="w-3.5 h-3.5" style={{ color: statusColor }} />
          </div>
          <div>
            <span className="text-sm font-bold text-foreground block leading-tight">Best Day Rule</span>
            <span className="text-[10px] text-white/35 font-mono">One-Step · {rulePct}% limit</span>
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
            <span className="text-white/40 font-medium">Best Day vs Total Profit</span>
            <span className="font-bold font-mono" style={{ color: statusColor }}>
              {bestDayPct.toFixed(1)}% / {rulePct}%
            </span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden relative" style={{ background: 'rgba(255,255,255,0.06)' }}>
            {/* Threshold marker at rulePct position */}
            <div className="absolute top-0 bottom-0 w-0.5 bg-white/30 z-10"
              style={{ left: `${(rulePct / Math.max(rulePct, bestDayPct, rulePct * 1.2)) * 100}%` }} />
            <motion.div className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${barPct}%` }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              style={{ background: statusColor }} />
          </div>
        </div>

        {/* Two-column metrics */}
        <div className="grid grid-cols-2 gap-3">
          {/* Best Day P&L */}
          <div className="rounded-xl p-3.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-white/35 mb-2">
              <TrendingUp className="w-3 h-3" />
              Best Day P&L
            </div>
            <div className="text-lg font-bold font-mono" style={{ color: bestDayProfit > 0 ? '#10b981' : '#94a3b8' }}>
              {bestDayProfit > 0 ? '+' : ''}${fmt(bestDayProfit)}
            </div>
            <div className="text-[10px] text-white/30 mt-1 font-mono">{fmtDate(bestDayDate)}</div>
          </div>

          {/* Max Allowed */}
          <div className="rounded-xl p-3.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-white/35 mb-2">
              <Award className="w-3 h-3" />
              Max Allowed ({rulePct}%)
            </div>
            <div className="text-lg font-bold font-mono" style={{ color: '#FF5C00' }}>
              ${fmt(maxAllowedDaily)}
            </div>
            <div className="text-[10px] text-white/30 mt-1 font-mono">of ${fmt(totalProfit)} total</div>
          </div>
        </div>

        {/* Guidance text */}
        <div className="rounded-xl p-3.5 flex items-start gap-2.5"
          style={{
            background: `${statusColor}08`,
            border: `1px solid ${statusColor}15`,
          }}>
          <div className="flex-1">
            <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {guidance}
            </p>
          </div>
          <button onClick={() => setShowHelp(v => !v)}
            className="flex-shrink-0 text-white/30 hover:text-white/60 transition-colors">
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Expandable help */}
        {showHelp && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            className="rounded-xl p-4 text-[11px] leading-relaxed"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-white/40">
              <span className="font-bold text-white/60">How it works:</span> The Best Day Rule ensures consistent trading by limiting how much of your total profit can come from a single day. If your best day's P&L exceeds {rulePct}% of your total profit, your payout will be blocked until you continue trading to dilute the ratio.
            </p>
            <p className="text-white/40 mt-2">
              <span className="font-bold text-white/60">Example:</span> If your total profit is $8,000, the max you can make in one day is $4,000 (50%). If your best day was $5,000, you need total profit of at least $10,000 ($5,000 ÷ 50%) to become compliant.
            </p>
            <p className="text-white/40 mt-2">
              <span className="font-bold text-white/60">Status:</span> This is a review-only rule — it does NOT auto-breach your account. It only affects payout eligibility.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}