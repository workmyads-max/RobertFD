/**
 * Performance Metrics + Progress Timeline panels
 * Moved from FundedDashboard overview into AccountOverview
 * All data from real MT5 sync + TradeRecord
 */
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Zap, DollarSign, Clock, ArrowRight } from 'lucide-react';

function daysSince(dateStr) {
  if (!dateStr) return null;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

// ─── Progress Timeline ─────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  done:    { line: 'rgba(16,185,129,0.15)',  ring: 'rgba(16,185,129,0.25)',  bg: 'rgba(16,185,129,0.06)', color: '#10b981', label: null },
  active:  { line: 'rgba(255,92,0,0.15)',    ring: 'rgba(255,92,0,0.35)',    bg: 'rgba(255,92,0,0.07)',   color: '#FF5C00', label: 'ACTIVE' },
  waiting: { line: 'rgba(245,158,11,0.15)',  ring: 'rgba(245,158,11,0.3)',   bg: 'rgba(245,158,11,0.07)',  color: '#f59e0b', label: 'REVIEW' },
  failed:  { line: 'rgba(239,68,68,0.12)',   ring: 'rgba(239,68,68,0.25)',   bg: 'rgba(239,68,68,0.06)',  color: '#ef4444', label: 'FAILED' },
  pending: { line: 'rgba(255,255,255,0.04)', ring: 'rgba(255,255,255,0.06)', bg: 'rgba(255,255,255,0.015)', color: 'rgba(255,255,255,0.18)', label: null },
};

function buildTimelineSteps(account, closedTrades = [], livePlan = null) {
  const challengeType = account?.challenge_type || 'two-step';
  const phase = account?.phase || 'phase1';
  const status = account?.status || 'active';
  const snap = account?.rule_snapshot || {};

  const profitTargetPct = snap.phase1_target ?? 10;
  const profitTargetMet = (account?.profit_target_progress || 0) >= profitTargetPct;
  const profitSplit = snap.profit_split ?? (challengeType === 'instant_light' ? 88 : 80);

  const sortedTrades = [...closedTrades].filter(t => t.open_time).sort(
    (a, b) => new Date(a.open_time).getTime() - new Date(b.open_time).getTime()
  );
  const daysSinceFirstTrade = daysSince(sortedTrades[0]?.open_time || null);
  const isFunded = status === 'funded';
  const withdrawalEligible = isFunded && daysSinceFirstTrade !== null && daysSinceFirstTrade >= 14;

  if (challengeType === 'instant' || challengeType === 'instant_light') {
    return [
      { key: 'purchased', label: 'Challenge Purchased', desc: 'Account credentials issued', status: 'done', icon: CheckCircle2 },
      {
        key: 'target', label: 'One-Time Profit Target',
        desc: profitTargetMet ? `✓ ${profitTargetPct}% target achieved` : `${profitTargetPct}% profit · ${snap.daily_dd_limit ?? 5}% daily DD`,
        status: profitTargetMet ? 'done' : (status === 'active' ? 'active' : 'pending'), icon: Zap,
      },
      {
        key: 'funded', label: 'Funded Account',
        desc: isFunded ? `Live capital · ${profitSplit}% profit split` : 'Pending profit target completion',
        status: isFunded ? 'done' : (profitTargetMet ? 'active' : 'pending'), icon: DollarSign,
      },
      {
        key: 'payout', label: 'Withdrawal Eligible',
        desc: withdrawalEligible ? '✓ Eligible for withdrawals'
          : isFunded ? `${14 - daysSinceFirstTrade} days remaining` : 'First payout available after funded status',
        status: withdrawalEligible ? 'active' : 'pending', icon: Clock,
      },
    ];
  }

  // Two-Step
  const phase1Target = snap.phase1_target ?? 10;
  const phase2Target = snap.phase2_target ?? 5;
  const dailyDd = snap.daily_dd_limit ?? 5;
  // Use livePlan.min_trading_days if available (admin can update it); fall back to rule_snapshot
  const minDays = livePlan?.min_trading_days ?? snap.min_trading_days ?? 4;

  // Fully data-driven stage derivation from phase, status & review flags.
  const phase1Review = account?.phase_review_status;
  const fundedReview = account?.funded_review_status;

  // Phase 1: done once we've moved to phase2/funded, or passed+approved.
  // "Waiting/review" only while status=passed & review pending.
  const isPhase1Done = phase !== 'phase1' || status === 'funded' ||
    (status === 'passed' && phase1Review === 'approved');
  const isPhase1UnderReview = phase === 'phase1' && status === 'passed' && phase1Review === 'pending_review';
  const isPhase1Active = phase === 'phase1' && status === 'active';

  // Phase 2: done once funded (or passed phase2 + funded approved).
  const isPhase2Done = status === 'funded' ||
    (phase === 'funded' && status === 'passed') ||
    (phase === 'phase2' && status === 'passed' && fundedReview === 'approved');
  const isPhase2UnderReview = (phase === 'phase2' && status === 'passed' && fundedReview === 'pending_review') ||
    (phase === 'funded' && status === 'passed' && fundedReview !== 'approved');
  const isPhase2Active = phase === 'phase2' && status === 'active';

  const phase1Status = isPhase1UnderReview ? 'waiting'
    : isPhase1Done ? 'done' : isPhase1Active ? 'active' : 'pending';
  const phase2Status = isPhase2UnderReview ? 'waiting'
    : isPhase2Done ? 'done' : isPhase2Active ? 'active' : (isPhase1Done ? 'active' : 'pending');
  const fundedStatus = isFunded ? 'done'
    : isPhase2UnderReview ? 'waiting'
    : (isPhase2Done || isPhase2Active) ? 'active' : 'pending';

  return [
    { key: 'purchased', label: 'Challenge Purchased', desc: 'Account credentials issued', status: 'done', icon: CheckCircle2 },
    {
      key: 'phase1', label: 'Phase 1',
      desc: isPhase1UnderReview ? `✓ ${phase1Target}% target met — review in progress`
        : isPhase1Done ? `✓ ${phase1Target}% profit · ${dailyDd}% daily DD · ${minDays} min days`
        : `${phase1Target}% profit · ${dailyDd}% daily DD · ${minDays} min days`,
      status: phase1Status, icon: Zap,
    },
    {
      key: 'phase2', label: 'Phase 2',
      desc: isPhase2UnderReview ? `✓ ${phase2Target}% target met — funded review in progress`
        : isPhase2Done ? `✓ ${phase2Target}% profit · ${dailyDd}% daily DD`
        : isPhase1UnderReview ? 'Pending Phase 1 approval'
        : `${phase2Target}% profit · ${dailyDd}% daily DD`,
      status: phase2Status, icon: Zap,
    },
    {
      key: 'funded', label: 'Funded Account',
      desc: isFunded ? `Live capital · ${profitSplit}% profit split`
        : isPhase2UnderReview ? 'Pending funded account approval'
        : 'Pending Phase 2 completion',
      status: fundedStatus, icon: DollarSign,
    },
    {
      key: 'payout', label: 'Withdrawal Eligible',
      desc: withdrawalEligible ? '✓ Eligible for withdrawals'
        : isFunded ? `${14 - daysSinceFirstTrade} days remaining` : 'First payout available after funded status',
      status: withdrawalEligible ? 'active' : 'pending', icon: Clock,
    },
  ];
}

function ProgressTimeline({ account, closedTrades, livePlan }) {
  const steps = useMemo(() => buildTimelineSteps(account, closedTrades, livePlan), [account, closedTrades, livePlan]);

  if (!account) return null;

  return (
    <div className="rounded-xl px-5 py-4 h-full"
      style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
      <h3 className="text-sm font-bold text-foreground mb-5 flex items-center gap-2">
        <ArrowRight className="w-3.5 h-3.5 text-primary" /> Progress Timeline
      </h3>
      <div className="space-y-0">
        {steps.map((step, i) => {
          const cfg = STATUS_CONFIG[step.status];
          const Icon = step.icon;
          const isDone = step.status === 'done';
          const isActive = step.status === 'active' || step.status === 'waiting';
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
                  <div className="w-px flex-1 my-1" style={{ background: cfg.line, minHeight: '28px' }} />
                )}
              </div>
              <div className="pb-6 pt-0.5 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="text-[12px] font-semibold" style={{ color: step.status === 'pending' ? 'rgba(255,255,255,0.35)' : cfg.color }}>
                    {step.label}
                  </span>
                  {cfg.label && (
                    <motion.span
                      animate={{ opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 1.8, repeat: Infinity }}
                      className="text-[8px] font-mono px-1.5 py-0.5 rounded-full font-bold uppercase"
                      style={{ background: `${cfg.color}12`, color: cfg.color, border: `1px solid ${cfg.color}25` }}>
                      {cfg.label}
                    </motion.span>
                  )}
                </div>
                <div className="text-[10px] font-mono leading-relaxed"
                  style={{ color: step.status === 'pending' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.35)' }}>
                  {step.desc}
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
function MetricRow({ label, value, color }) {
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
    <div className="rounded-xl px-5 py-4 h-full" style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
      <h3 className="text-sm font-bold text-foreground mb-4">Performance Metrics</h3>
      <div className="text-center py-8 text-sm text-muted-foreground">No trade data yet</div>
    </div>
  );

  const { avgProfit, avgLoss, profitFactor, expectancy, rrr, lots, wins, losses, totalTrades, openPositions } = stats;

  const rows = [
    { label: 'Profit Factor', value: isFinite(profitFactor) && profitFactor > 0 ? profitFactor.toFixed(2) : '0.00', color: profitFactor >= 1.5 ? '#10b981' : profitFactor >= 1 ? '#f59e0b' : '#ef4444' },
    { label: 'Expectancy', value: isFinite(expectancy) ? `$${expectancy.toFixed(2)}` : '—', color: expectancy >= 0 ? '#10b981' : '#ef4444' },
    { label: 'Avg RR Ratio', value: rrr > 0 ? `1:${rrr.toFixed(2)}` : '—', color: rrr >= 1.5 ? '#10b981' : '#FF5C00' },
    { label: 'Avg Win', value: avgProfit > 0 ? `$${avgProfit.toFixed(2)}` : '—', color: '#10b981' },
    { label: 'Avg Loss', value: avgLoss > 0 ? `$${avgLoss.toFixed(2)}` : '—', color: '#ef4444' },
    { label: 'Total Lots', value: lots > 0 ? lots.toFixed(2) : '0', color: 'rgba(255,255,255,0.6)' },
    { label: 'Winning Trades', value: wins, color: '#10b981' },
    { label: 'Losing Trades', value: losses, color: '#ef4444' },
    { label: 'Total Trades', value: totalTrades, color: 'rgba(255,255,255,0.7)' },
    { label: 'Open Positions', value: openPositions, color: '#FF5C00' },
  ];

  return (
    <div className="rounded-xl px-5 py-4 h-full"
      style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
      <h3 className="text-sm font-bold text-foreground mb-2">Performance Metrics</h3>
      {rows.map((r) => <MetricRow key={r.label} {...r} />)}
    </div>
  );
}

// ─── Export combined panel ─────────────────────────────────────────────────────
export default function AccountPerformanceMetrics({ account, stats, closedTrades = [], livePlan = null }) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <PerformanceMetrics stats={stats} />
      <ProgressTimeline account={account} closedTrades={closedTrades} livePlan={livePlan} />
    </div>
  );
}