import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Zap, DollarSign, Clock, Target, ShoppingBag, ArrowRight } from 'lucide-react';

/**
 * AccountTimeline — shows the real progress of a challenge account.
 *
 * TWO-STEP:
 *   Purchased → Phase 1 → Phase 2 → Funded → Withdrawals
 *
 * INSTANT / INSTANT LIGHT:
 *   Purchased → One-Time Profit Target (10%) → Funded → Withdrawals
 *   14-day first payout cycle from first trade, 7-day cycles thereafter.
 */

// ─── helpers ──────────────────────────────────────────────────────────────────
function fmt(n) { return (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }

function daysSince(dateStr) {
  if (!dateStr) return null;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

// ─── timeline step component ──────────────────────────────────────────────────
function TimelineStep({ icon: Icon, label, desc, status, isLast, index, note }) {
  const config = {
    done:    { line: 'rgba(16,185,129,0.25)', ring: 'rgba(16,185,129,0.3)',  bg: 'rgba(16,185,129,0.08)', color: '#10b981' },
    active:  { line: 'rgba(255,92,0,0.25)',   ring: 'rgba(255,92,0,0.4)',   bg: 'rgba(255,92,0,0.09)',   color: '#FF5C00' },
    pending: { line: 'rgba(255,255,255,0.05)', ring: 'rgba(255,255,255,0.08)', bg: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.18)' },
    failed:  { line: 'rgba(239,68,68,0.2)',   ring: 'rgba(239,68,68,0.3)',   bg: 'rgba(239,68,68,0.08)',  color: '#ef4444' },
  };
  const cfg = config[status] || config.pending;

  return (
    <div className="flex gap-3">
      {/* connector column */}
      <div className="flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: index * 0.08, type: 'spring', stiffness: 200 }}
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 relative"
          style={{ background: cfg.bg, border: `1px solid ${cfg.ring}` }}>
          {status === 'active' && (
            <motion.div
              animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="absolute inset-0 rounded-full"
              style={{ border: `1px solid ${cfg.color}`, opacity: 0.4 }}
            />
          )}
          {status === 'done'
            ? <CheckCircle2 className="w-3.5 h-3.5" style={{ color: cfg.color }} />
            : <Icon className="w-3 h-3" style={{ color: cfg.color }} />
          }
        </motion.div>
        {!isLast && (
          <div className="w-px flex-1 my-1" style={{ background: cfg.line, minHeight: '24px' }} />
        )}
      </div>

      {/* content column */}
      <div className="pb-5 pt-0.5 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className="text-[12px] font-medium" style={{ color: cfg.color }}>{label}</span>
          {status === 'active' && (
            <motion.span
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.8, repeat: Infinity }}
              className="text-[8px] font-mono px-1.5 py-0.5 rounded-full font-bold"
              style={{ background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
              ACTIVE
            </motion.span>
          )}
          {status === 'failed' && (
            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full font-bold"
              style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}>
              FAILED
            </span>
          )}
        </div>
        <div className="text-[10px] text-white/25 font-mono leading-relaxed">{desc}</div>
        {note && (
          <div className="mt-1.5 text-[9px] text-white/30 font-mono leading-relaxed italic flex items-start gap-1">
            <span className="text-primary/60 mt-px flex-shrink-0">ⓘ</span>
            <span>{note}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── build timeline steps from real account data ──────────────────────────────
function useTimelineSteps(account, closedTrades = []) {
  return useMemo(() => {
    if (!account) return [];

    const challengeType = account.challenge_type || 'two-step';
    const phase = account.phase || 'phase1';
    const status = account.status || 'active';
    const ruleSnapshot = account.rule_snapshot || {};

    // Determine if one-time profit target is met (for instant challenges)
    const profitTargetPct = ruleSnapshot.phase1_target ?? 10;
    const profitTargetMet = (account.profit_target_progress || 0) >= profitTargetPct;

    // First trade date from closed trades
    const sortedTrades = [...closedTrades].filter(t => t.open_time).sort(
      (a, b) => new Date(a.open_time).getTime() - new Date(b.open_time).getTime()
    );
    const firstTradeDate = sortedTrades[0]?.open_time || null;
    const daysSinceFirstTrade = daysSince(firstTradeDate);

    // Withdrawal eligibility:
    // First payout: 14 days from first trade
    // Subsequent: 7 days after previous payout
    const isFunded = status === 'funded';
    const firstCycleDays = isFunded && daysSinceFirstTrade !== null ? Math.min(daysSinceFirstTrade, 14) : 0;
    const withdrawalEligible = isFunded && daysSinceFirstTrade !== null && daysSinceFirstTrade >= 14;

    if (challengeType === 'instant' || challengeType === 'instant_light') {
      // ─── INSTANT / INSTANT LIGHT ──────────────────────────────────────────
      const typeLabel = challengeType === 'instant_light' ? 'Instant Light' : 'Instant';
      const isLight = challengeType === 'instant_light';

      const steps = [
        {
          icon: ShoppingBag,
          label: 'Challenge Purchased',
          desc: `$${fmt(account.account_size)} ${typeLabel} account issued`,
          status: 'done',
        },
        {
          icon: Target,
          label: 'One-Time Profit Target',
          desc: profitTargetMet
            ? `✓ ${profitTargetPct}% profit target achieved — no further targets required`
            : `${profitTargetPct}% profit must be hit once to qualify for withdrawals (${(account.profit_target_progress || 0).toFixed(1)}% / ${profitTargetPct}%)`,
          status: profitTargetMet ? 'done' : (status === 'active' ? 'active' : 'pending'),
        },
        {
          icon: DollarSign,
          label: 'Funded Account Live',
          desc: isFunded
            ? 'Trading freely on your funded account'
            : profitTargetMet ? 'Transitioning to funded account…' : 'Awaiting profit target completion',
          status: isFunded ? 'done' : (profitTargetMet ? 'active' : 'pending'),
        },
        {
          icon: Clock,
          label: 'Withdrawal Eligible',
          desc: withdrawalEligible
            ? '✓ Eligible for withdrawals'
            : isFunded
              ? `${14 - daysSinceFirstTrade} days remaining in first payout cycle`
              : 'Available after first payout cycle',
          status: withdrawalEligible ? 'active' : 'pending',
          note: (
            isLight ? (
              '14-day first payout cycle from first trade open · 7-day cycles thereafter · Trailing drawdown applies'
            ) : (
              '14-day first payout cycle from first trade open · 7-day cycles thereafter'
            )
          ),
        },
      ];
      return steps;
    }

    // ─── TWO-STEP ───────────────────────────────────────────────────────────
    const phase1Target = ruleSnapshot.phase1_target ?? 10;
    const phase2Target = ruleSnapshot.phase2_target ?? 5;
    const minDays = ruleSnapshot.min_trading_days ?? 4;
    const dailyDd = ruleSnapshot.daily_dd_limit ?? 5;

    const isPhase1Done = phase !== 'phase1' || status === 'passed' || status === 'funded';
    const isPhase2Done = phase === 'funded' || status === 'funded';
    const isPhase1Active = phase === 'phase1' && status === 'active';
    const isPhase2Active = phase === 'phase2' && status === 'active';

    const steps = [
      {
        icon: ShoppingBag,
        label: 'Challenge Purchased',
        desc: `$${fmt(account.account_size)} Two-Step account issued`,
        status: 'done',
      },
      {
        icon: Target,
        label: 'Phase 1',
        desc: isPhase1Done
          ? `✓ ${phase1Target}% profit target met · ${dailyDd}% daily DD · ${minDays} min trading days`
          : `${phase1Target}% profit target · ${dailyDd}% daily DD · ${minDays} min trading days (${(account.profit_target_progress || 0).toFixed(1)}% / ${phase1Target}%)`,
        status: isPhase1Done ? 'done' : isPhase1Active ? 'active' : 'pending',
      },
      {
        icon: Zap,
        label: 'Phase 2',
        desc: isPhase2Done
          ? `✓ ${phase2Target}% profit target met · ${dailyDd}% daily DD`
          : `${phase2Target}% profit target · ${dailyDd}% daily DD`,
        status: isPhase2Done ? 'done' : isPhase2Active ? 'active' : (isPhase1Done ? 'active' : 'pending'),
      },
      {
        icon: DollarSign,
        label: 'Funded Account Live',
        desc: isFunded
          ? 'Trading on live funded capital · 80% profit split'
          : 'Awaiting Phase 2 completion',
        status: isFunded ? 'done' : (isPhase2Done ? 'active' : 'pending'),
      },
      {
        icon: Clock,
        label: 'Withdrawal Eligible',
        desc: withdrawalEligible
          ? '✓ Eligible for withdrawals'
          : isFunded
            ? `${14 - daysSinceFirstTrade} days remaining in first payout cycle`
            : 'Available after funded status',
        status: withdrawalEligible ? 'active' : 'pending',
        note: isFunded ? '14-day first payout cycle from first trade open · 7-day cycles thereafter' : null,
      },
    ];
    return steps;
  }, [account, closedTrades]);
}

// ─── main component ───────────────────────────────────────────────────────────
export default function AccountTimeline({ account, closedTrades = [] }) {
  const steps = useTimelineSteps(account, closedTrades);

  if (!account || steps.length === 0) return null;

  const challengeLabel =
    account.challenge_type === 'instant_light' ? 'Instant Light'
    : account.challenge_type === 'instant' ? 'Instant'
    : 'Two-Step';

  return (
    <div className="rounded-2xl p-5"
      style={{
        background: 'linear-gradient(145deg, rgba(10,16,32,0.97), rgba(12,20,40,0.95))',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(24px)',
      }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <ArrowRight className="w-3.5 h-3.5 text-primary/60" />
          <h3 className="text-sm font-semibold text-white/90 tracking-tight">Progress Timeline</h3>
        </div>
        <span className="text-[10px] font-mono px-2.5 py-1 rounded-full"
          style={{
            background: 'rgba(255,92,0,0.08)',
            color: '#FF5C00',
            border: '1px solid rgba(255,92,0,0.2)',
          }}>
          {challengeLabel}
        </span>
      </div>

      {/* Steps */}
      <div className="space-y-0">
        {steps.map((step, i) => (
          <TimelineStep
            key={step.label}
            {...step}
            index={i}
            isLast={i === steps.length - 1}
          />
        ))}
      </div>
    </div>
  );
}