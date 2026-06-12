/**
 * Performance Metrics + Progress Timeline panels
 * Moved from FundedDashboard overview into AccountOverview
 * All data from real MT5 sync + TradeRecord
 */
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Zap, DollarSign, ArrowRight } from 'lucide-react';

// ─── Progress Timeline ─────────────────────────────────────────────────────────
const BASE_STEPS = [
  { key: 'purchased', label: 'Challenge Purchased', descFn: () => 'Account credentials issued', icon: CheckCircle2 },
  { key: 'phase1', label: 'Phase 1', descFn: (snap) => `${snap.phase1_target ?? 10}% profit · ${snap.daily_dd_limit ?? 5}% daily DD · ${snap.min_trading_days ?? 4} min days`, icon: Zap },
  { key: 'phase2', label: 'Phase 2', descFn: (snap) => `${snap.phase2_target ?? 5}% profit · ${snap.daily_dd_limit ?? 5}% daily DD`, icon: Zap },
  { key: 'funded', label: 'Funded Account', descFn: (snap) => `Live capital · ${snap.profit_split ?? 80}% profit split`, icon: DollarSign },
  { key: 'payout', label: 'Withdrawal Eligible', descFn: () => 'First payout available', icon: DollarSign },
];

function getStepStatus(key, phase, status) {
  if (key === 'purchased') return 'done';
  if (key === 'phase1') {
    if (phase === 'phase2' || phase === 'funded' || status === 'funded') return 'done';
    if (phase === 'phase1' && (status === 'active' || status === 'passed')) return status === 'passed' ? 'waiting' : 'active';
    if (status === 'failed') return 'failed';
    return 'pending';
  }
  if (key === 'phase2') {
    if (phase === 'funded' || status === 'funded') return 'done';
    if (phase === 'phase2' && status === 'active') return 'active';
    if (phase === 'phase2' && status === 'passed') return 'waiting';
    return 'pending';
  }
  if (key === 'funded') {
    if (status === 'funded' || phase === 'funded') return 'active';
    return 'pending';
  }
  if (key === 'payout') {
    if (status === 'funded') return 'active';
    return 'pending';
  }
  return 'pending';
}

const STATUS_CONFIG = {
  done:    { line: 'rgba(16,185,129,0.3)',   ring: 'rgba(16,185,129,0.3)',   bg: 'rgba(16,185,129,0.08)',  color: '#10b981', label: null },
  active:  { line: 'rgba(255,92,0,0.25)',    ring: 'rgba(255,92,0,0.4)',     bg: 'rgba(255,92,0,0.08)',    color: '#FF5C00', label: 'ACTIVE' },
  waiting: { line: 'rgba(245,158,11,0.25)',  ring: 'rgba(245,158,11,0.35)',  bg: 'rgba(245,158,11,0.08)', color: '#f59e0b', label: 'REVIEW' },
  failed:  { line: 'rgba(239,68,68,0.25)',   ring: 'rgba(239,68,68,0.35)',   bg: 'rgba(239,68,68,0.08)',  color: '#ef4444', label: 'FAILED' },
  pending: { line: 'rgba(255,255,255,0.04)', ring: 'rgba(255,255,255,0.07)', bg: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.2)', label: null },
};

function ProgressTimeline({ account }) {
  const phase = account?.phase || 'phase1';
  const status = account?.status || 'active';
  const snap = account?.rule_snapshot || {};
  const isInstant = account?.challenge_type === 'instant' || account?.challenge_type === 'instant_light';
  const steps = isInstant ? BASE_STEPS.filter(s => s.key !== 'phase2') : BASE_STEPS;

  return (
    <div className="rounded-xl p-5 h-full"
      style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
      <h3 className="text-sm font-bold text-foreground mb-5 flex items-center gap-2">
        <ArrowRight className="w-3.5 h-3.5 text-primary" /> Progress Timeline
      </h3>
      <div className="space-y-0">
        {steps.map((step, i) => {
          const st = getStepStatus(step.key, phase, status);
          const cfg = STATUS_CONFIG[st];
          const Icon = step.icon;
          const isDone = st === 'done';
          const isActive = st === 'active' || st === 'waiting';
          return (
            <div key={step.key} className="flex gap-3">
              <div className="flex flex-col items-center">
                <motion.div
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.07, type: 'spring', stiffness: 220 }}
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 relative"
                  style={{ background: cfg.bg, border: `1px solid ${cfg.ring}` }}>
                  {isActive && (
                    <motion.div
                      animate={{ scale: [1, 1.8, 1], opacity: [0.4, 0, 0.4] }}
                      transition={{ duration: 2.5, repeat: Infinity }}
                      className="absolute inset-0 rounded-full"
                      style={{ border: `1px solid ${cfg.color}` }} />
                  )}
                  {isDone
                    ? <CheckCircle2 className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                    : <Icon className="w-3 h-3" style={{ color: cfg.color }} />}
                </motion.div>
                {i < steps.length - 1 && (
                  <div className="w-px flex-1 my-1" style={{ background: cfg.line, minHeight: '24px' }} />
                )}
              </div>
              <div className="pb-5 pt-0.5">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="text-[12px] font-semibold" style={{ color: cfg.color }}>{step.label}</span>
                  {cfg.label && (
                    <motion.span
                      animate={{ opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 1.8, repeat: Infinity }}
                      className="text-[8px] font-mono px-1.5 py-0.5 rounded-full font-bold"
                      style={{ background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
                      {cfg.label}
                    </motion.span>
                  )}
                </div>
                <div className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {step.descFn(snap)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Performance Metrics ───────────────────────────────────────────────────────
function MetricRow({ label, value, color, i }) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0"
      style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
      <span className="text-[11px] font-mono uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</span>
      <span className="text-[12px] font-semibold font-mono" style={{ color: color || 'rgba(255,255,255,0.75)' }}>{value}</span>
    </div>
  );
}

function PerformanceMetrics({ stats }) {
  if (!stats) return (
    <div className="rounded-xl p-5" style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
      <h3 className="text-sm font-bold text-foreground mb-4">Performance Metrics</h3>
      <div className="text-center py-8 text-sm text-muted-foreground">No trade data yet</div>
    </div>
  );

  const { avgProfit, avgLoss, profitFactor, expectancy, rrr, lots, wins, losses, totalTrades, openPositions } = stats;

  const rows = [
    { label: 'Profit Factor', value: isFinite(profitFactor || 0) && (profitFactor || 0) > 0 ? (profitFactor || 0).toFixed(2) : '0.00', color: (profitFactor || 0) >= 1.5 ? '#10b981' : (profitFactor || 0) >= 1 ? '#f59e0b' : '#ef4444' },
    { label: 'Expectancy', value: `$${(expectancy || 0).toFixed(2)}`, color: (expectancy || 0) >= 0 ? '#10b981' : '#ef4444' },
    { label: 'Avg RR Ratio', value: `1:${(rrr || 0).toFixed(2)}`, color: (rrr || 0) >= 1.5 ? '#10b981' : '#FF5C00' },
    { label: 'Avg Win', value: `$${(avgProfit || 0).toFixed(2)}`, color: '#10b981' },
    { label: 'Avg Loss', value: `$${(avgLoss || 0).toFixed(2)}`, color: '#ef4444' },
    { label: 'Total Lots', value: (lots || 0).toFixed(2), color: 'rgba(255,255,255,0.6)' },
    { label: 'Winning Trades', value: wins || 0, color: '#10b981' },
    { label: 'Losing Trades', value: losses || 0, color: '#ef4444' },
    { label: 'Total Trades', value: totalTrades || 0, color: 'rgba(255,255,255,0.7)' },
    { label: 'Open Positions', value: openPositions || 0, color: '#FF5C00' },
  ];

  return (
    <div className="rounded-xl px-5 py-4"
      style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
      <h3 className="text-sm font-bold text-foreground mb-2">Performance Metrics</h3>
      {rows.map((r, i) => <MetricRow key={r.label} {...r} i={i} />)}
    </div>
  );
}

// ─── Export combined panel ─────────────────────────────────────────────────────
export default function AccountPerformanceMetrics({ account, stats }) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <PerformanceMetrics stats={stats} />
      <ProgressTimeline account={account} />
    </div>
  );
}