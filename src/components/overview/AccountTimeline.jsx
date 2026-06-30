import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Zap, DollarSign, Clock, ArrowRight, XCircle, Target } from 'lucide-react';
import { useKycStatus } from '@/hooks/useKycStatus';
function fmt(n) { return (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }

// ─── timeline step ─────────────────────────────────────────────────────────────
function TimelineStep({ icon: Icon, label, desc, status, isLast, index, badge, action }) {
  const config = {
    done:    { line: 'rgba(16,185,129,0.15)',  ring: 'rgba(16,185,129,0.25)',  bg: 'rgba(16,185,129,0.06)', color: '#10b981' },
    active:  { line: 'rgba(255,92,0,0.15)',    ring: 'rgba(255,92,0,0.35)',    bg: 'rgba(255,92,0,0.07)',   color: '#FF5C00' },
    review:  { line: 'rgba(96,165,250,0.15)',  ring: 'rgba(96,165,250,0.35)',  bg: 'rgba(96,165,250,0.07)', color: '#60a5fa' },
    pending: { line: 'rgba(255,255,255,0.04)',  ring: 'rgba(255,255,255,0.06)',  bg: 'rgba(255,255,255,0.015)', color: 'rgba(255,255,255,0.18)' },
    failed:  { line: 'rgba(239,68,68,0.12)',    ring: 'rgba(239,68,68,0.25)',    bg: 'rgba(239,68,68,0.06)',  color: '#ef4444' },
  };
  const cfg = config[status] || config.pending;

  return (
    <div className="flex gap-3">
      {/* connector */}
      <div className="flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: index * 0.06, type: 'spring', stiffness: 180 }}
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 relative"
          style={{ background: cfg.bg, border: `1px solid ${cfg.ring}` }}>
          {(status === 'active' || status === 'review') && (
            <motion.div
              animate={{ scale: [1, 1.6, 1], opacity: [0.25, 0, 0.25] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="absolute inset-0 rounded-full" style={{ border: `1px solid ${cfg.color}`, opacity: 0.35 }} />
          )}
          {status === 'done'
            ? <CheckCircle2 className="w-3.5 h-3.5" style={{ color: cfg.color }} />
            : <Icon className="w-3 h-3" style={{ color: cfg.color }} />
          }
        </motion.div>
        {!isLast && <div className="w-px flex-1 my-1" style={{ background: cfg.line, minHeight: '28px' }} />}
      </div>

      {/* content */}
      <div className="pb-6 pt-0.5 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className="text-[12px] font-medium" style={{ color: status === 'pending' ? 'rgba(255,255,255,0.35)' : cfg.color }}>
            {label}
          </span>
          {status === 'active' && (
            <motion.span
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.8, repeat: Infinity }}
              className="text-[8px] font-mono px-1.5 py-0.5 rounded-full font-bold uppercase"
              style={{ background: `${cfg.color}12`, color: cfg.color, border: `1px solid ${cfg.color}25` }}>
              Active
            </motion.span>
          )}
          {status === 'review' && (
            <motion.span
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.8, repeat: Infinity }}
              className="text-[8px] font-mono px-1.5 py-0.5 rounded-full font-bold uppercase"
              style={{ background: 'rgba(96,165,250,0.12)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.25)' }}>
              Under Review
            </motion.span>
          )}
          {badge && (
            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full font-bold uppercase"
              style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' }}>
              {badge}
            </span>
          )}
        </div>
        <div className="text-[10px] font-mono leading-relaxed" style={{ color: status === 'pending' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.4)' }}>
          {desc}
        </div>

      </div>
    </div>
  );
}

// ─── build steps from real account data ────────────────────────────────────────
function useTimelineSteps(account, closedTrades = []) {
  return useMemo(() => {
    if (!account) return [];

    const challengeType = account.challenge_type || 'two-step';
    const phase = account.phase || 'phase1';
    const status = account.status || 'active';
    const ruleSnapshot = account.rule_snapshot || {};

    const profitTargetPct = ruleSnapshot.phase1_target ?? 10;
    const profitTargetMet = (account.profit_target_progress || 0) >= profitTargetPct;
    const profitSplit = ruleSnapshot.profit_split ?? (challengeType === 'instant_light' ? 88 : challengeType === 'one_step' ? 90 : 80);

    const tradingDaySet = new Set(
      closedTrades.filter(t => t.close_time).map(t => new Date(t.close_time).toISOString().split('T')[0])
    );
    const tradingDaysCount = Math.max(tradingDaySet.size, account.trading_days || 0);

    const isFunded = status === 'funded';
    const withdrawalEligible = isFunded && tradingDaysCount >= 1;

    if (challengeType === 'instant' || challengeType === 'instant_light') {
      const typeLabel = challengeType === 'instant_light' ? 'Instant Light' : 'Instant';
      const isInstantLight = challengeType === 'instant_light';
      
      // Instant Light: 5% trailing target ($100K → $105K), then trailing DD activates
      // Instant: No target, funded immediately
      const trailingTargetPct = isInstantLight ? 5 : 0;
      const trailingTargetValue = account.account_size * (1 + trailingTargetPct / 100);
      const currentBalance = account.balance || account.account_size;
      const trailingTargetMet = isInstantLight ? currentBalance >= trailingTargetValue : true;
      
      // For Instant: skip target step, go straight to funded
      if (!isInstantLight) {
        return [
          {
            icon: CheckCircle2,
            label: 'Challenge Purchased',
            desc: `$${fmt(account.account_size)} ${typeLabel} account issued`,
            status: 'done',
          },
          {
            icon: DollarSign,
            label: 'Simulation Funded Account',
            desc: `Live capital · ${profitSplit}% reward split`,
            status: 'done',
          },
          {
            icon: Clock,
            label: 'Withdrawal Eligible',
            desc: withdrawalEligible
              ? '✓ Eligible for withdrawals'
              : `Complete 1 trading day (${tradingDaysCount}/1 done)`,
            status: withdrawalEligible ? 'active' : 'pending',
          },
        ];
      }
      
      // For Instant Light: show trailing target step
      return [
        {
          icon: CheckCircle2,
          label: 'Challenge Purchased',
          desc: `$${fmt(account.account_size)} ${typeLabel} account issued`,
          status: 'done',
        },
        {
          icon: Zap,
          label: 'Trailing Target (5%)',
          desc: trailingTargetMet
            ? `✓ $${fmt(trailingTargetValue)} hit - Trailing DD now active`
            : `Reach $${fmt(trailingTargetValue)} · 5% daily DD · 10% trailing DD`,
          status: trailingTargetMet ? 'done' : 'active',
        },
        {
          icon: DollarSign,
          label: 'Simulation Funded Account',
          desc: trailingTargetMet
            ? `Live capital · ${profitSplit}% reward split`
            : 'Pending trailing target completion',
          status: trailingTargetMet ? 'done' : 'pending',
        },
        {
          icon: Clock,
          label: 'Withdrawal Eligible',
          desc: withdrawalEligible && trailingTargetMet
            ? '✓ Eligible for withdrawals'
            : trailingTargetMet
              ? `Complete 1 trading day (${tradingDaysCount}/1 done)`
              : 'First payout available after hitting trailing target',
          status: withdrawalEligible && trailingTargetMet ? 'active' : 'pending',
        },
      ];
    }

    // ─── ONE-STEP ────────────────────────────────────────────────────────────────
    if (challengeType === 'one_step') {
      const target = ruleSnapshot.phase1_target ?? 8;
      const dailyDd = ruleSnapshot.daily_dd_limit ?? 4;
      const maxDd = ruleSnapshot.max_dd_limit ?? 8;
      const bestDayPct = ruleSnapshot.best_day_rule_pct ?? 50;

      const evalReviewStatus = account.funded_review_status || 'none';
      const isEvalPassed = (status === 'passed' && evalReviewStatus !== 'none') || status === 'funded';
      const isEvalUnderReview = status === 'passed' && evalReviewStatus === 'pending_review';
      const isEvalActive = status === 'active' && phase === 'phase1';

      return [
        {
          icon: CheckCircle2,
          label: 'Challenge Purchased',
          desc: `$${fmt(account.account_size)} One-Step account issued`,
          status: 'done',
        },
        {
          icon: Target,
          label: 'Evaluation',
          desc: isEvalUnderReview
            ? `✓ ${target}% target met - XFT Team review in progress`
            : isEvalPassed
              ? `✓ ${target}% reward · ${dailyDd}% daily DD · ${maxDd}% trailing DD`
              : `${target}% reward target · ${dailyDd}% daily DD · ${maxDd}% trailing DD · Best Day ${bestDayPct}%`,
          status: isEvalUnderReview ? 'review' : isEvalPassed ? 'done' : isEvalActive ? 'active' : 'pending',
        },
        {
          icon: DollarSign,
          label: 'Simulation Funded Account',
          desc: isFunded
            ? `Live capital · ${profitSplit}% reward split`
            : isEvalUnderReview
              ? 'Pending simulation funded account approval by XFT Trader Team'
              : 'Pending evaluation completion',
          status: isFunded ? 'done' : (isEvalUnderReview ? 'review' : 'pending'),
        },
        {
          icon: Clock,
          label: 'Withdrawal Eligible',
          desc: withdrawalEligible
            ? '✓ Eligible for withdrawals'
            : isFunded
              ? `Complete 1 trading day (${tradingDaysCount}/1 done)`
              : 'First payout available after simulation funded status',
          status: withdrawalEligible ? 'active' : 'pending',
        },
      ];
    }

    // ─── INSTANT ACCOUNT ────────────────────────────────────────────────────────
    if (challengeType === 'instant_account') {
      const bufferTargetPct = ruleSnapshot.buffer_zone_target ?? 5;
      const bufferTargetVal = account.account_size * (1 + bufferTargetPct / 100);
      const bufferActivated = account.buffer_zone_activated || false;
      const consistencyPct = ruleSnapshot.consistency_rule_pct ?? 35;
      const minProfitableDays = ruleSnapshot.min_profitable_days ?? 7;
      const profitableDaysCount = account.profitable_days_count || 0;
      const consistencyPassed = account.consistency_passed || false;
      const payoutEligible = account.instant_payout_eligible || false;
      const dailyDdIA = ruleSnapshot.daily_dd_limit ?? 4;
      const maxDdIA = ruleSnapshot.max_dd_limit ?? 8;
      const bestDay = account.best_day_profit || 0;
      const requiredTotal = account.required_total_profit || 0;
      const currentEquity = account.equity || account.balance || account.account_size;

      return [
        {
          icon: CheckCircle2,
          label: 'Challenge Purchased',
          desc: `$${fmt(account.account_size)} Instant Account issued`,
          status: 'done',
        },
        {
          icon: Zap,
          label: 'Buffer Zone Target',
          desc: bufferActivated
            ? `✓ $${fmt(bufferTargetVal)} locked - DD reference updated`
            : `Reach $${fmt(bufferTargetVal)} (${bufferTargetPct}% reward) · ${dailyDdIA}% daily DD · ${maxDdIA}% max DD`,
          status: bufferActivated ? 'done' : 'active',
        },
        {
          icon: Target,
          label: 'Consistency & Profitable Days',
          desc: bufferActivated
            ? (consistencyPassed
              ? `✓ Consistency passed (best day $${fmt(bestDay)} → required $${fmt(requiredTotal)})`
              : `Best day $${fmt(bestDay)} → need $${fmt(requiredTotal)} total · ${consistencyPct}% consistency rule`)
            : 'Activated after buffer zone target',
          status: !bufferActivated ? 'pending' : consistencyPassed ? 'done' : 'active',
        },
        {
          icon: Clock,
          label: 'Profitable Days',
          desc: bufferActivated
            ? `${profitableDaysCount}/${minProfitableDays} profitable days`
            : 'Tracking starts after buffer zone',
          status: !bufferActivated ? 'pending' : (profitableDaysCount >= minProfitableDays ? 'done' : 'active'),
        },
        {
          icon: DollarSign,
          label: 'Payout Eligible',
          desc: payoutEligible
            ? `✓ Withdrawable: $${fmt(account.withdrawable_profit || 0)} · ${profitSplit}% reward split`
            : bufferActivated
              ? `${profitableDaysCount}/${minProfitableDays} days · ${consistencyPassed ? '✓' : '✗'} consistency · $${fmt(account.withdrawable_profit || 0)} pending`
              : 'First payout after buffer zone + consistency + profitable days',
          status: payoutEligible ? 'done' : 'pending',
        },
      ];
    }

    // ─── TWO-STEP / ONE-STEP (handled above) ────────────────────────────────────
    const phase1Target = ruleSnapshot.phase1_target ?? 10;
    const phase2Target = ruleSnapshot.phase2_target ?? 5;
    const minDays = ruleSnapshot.min_trading_days ?? 4;
    const dailyDd = ruleSnapshot.daily_dd_limit ?? 5;

    const phase1ReviewStatus = account.phase_review_status || 'none';
    const phase2ReviewStatus = account.funded_review_status || 'none';

    // Phase 1 is "done" (fully approved) only when review is approved OR phase advanced past it
    const isPhase1Passed = (phase === 'phase1' && status === 'passed') || phase !== 'phase1' || status === 'funded';
    const isPhase1UnderReview = phase === 'phase1' && status === 'passed' && phase1ReviewStatus === 'pending_review';
    const isPhase1Active = phase === 'phase1' && status === 'active';
    const isPhase1Done = isPhase1Passed && !isPhase1UnderReview;

    const isPhase2Done = phase === 'funded' || status === 'funded';
    const isPhase2UnderReview = (phase === 'phase2' && status === 'passed' && phase2ReviewStatus === 'pending_review') ||
                                (phase === 'funded' && status === 'passed');
    // Phase 2 is only "active" if admin has approved Phase 1 review and issued Phase 2 credentials
    // i.e. the account's phase is actually 'phase2' AND status is 'active' (not still pending_review on phase1)
    const isPhase2Active = phase === 'phase2' && status === 'active' && phase1ReviewStatus !== 'pending_review';

    return [
      {
        icon: CheckCircle2,
        label: 'Challenge Purchased',
        desc: 'Account credentials issued',
        status: 'done',
      },
      {
        icon: Zap,
        label: 'Phase 1',
        desc: isPhase1UnderReview
          ? `✓ ${phase1Target}% target met - XFT Team review in progress`
          : isPhase1Done
            ? `✓ ${phase1Target}% reward · ${dailyDd}% daily DD · ${minDays} min days`
            : `${phase1Target}% reward · ${dailyDd}% daily DD · ${minDays} min days`,
        status: isPhase1UnderReview ? 'review' : isPhase1Done ? 'done' : isPhase1Active ? 'active' : 'pending',
      },
      {
        icon: Zap,
        label: 'Phase 2',
        desc: isPhase2UnderReview
          ? `✓ ${phase2Target}% target met - XFT Team review in progress`
          : isPhase2Done
            ? `✓ ${phase2Target}% reward · ${dailyDd}% daily DD`
            : isPhase1UnderReview
              ? 'Pending Phase 1 approval by XFT Trader Team'
              : `${phase2Target}% reward · ${dailyDd}% daily DD`,
        status: isPhase2UnderReview ? 'review' : isPhase2Done ? 'done' : isPhase2Active ? 'active' : 'pending',
      },
      {
        icon: DollarSign,
        label: 'Simulation Funded Account',
        desc: isFunded
          ? `Live capital · ${profitSplit}% reward split`
          : isPhase2UnderReview
            ? 'Pending simulation funded account approval by XFT Trader Team'
            : 'Pending Phase 2 completion',
        status: isFunded ? 'done' : (isPhase2UnderReview ? 'review' : 'pending'),
      },
      {
        icon: Clock,
        label: 'Withdrawal Eligible',
        desc: withdrawalEligible
          ? '✓ Eligible for withdrawals'
          : isFunded
            ? `Complete 1 trading day (${tradingDaysCount}/1 done)`
            : 'First payout available after simulation funded status',
        status: withdrawalEligible ? 'active' : 'pending',
      },
    ];
              }, [account, closedTrades]);
}

// ─── main ──────────────────────────────────────────────────────────────────────
export default function AccountTimeline({ account, closedTrades = [], onNavigate, onRequestWithdrawal, user }) {
  const steps = useTimelineSteps(account, closedTrades);

  // KYC status via the shared single-source-of-truth hook (returns object|null,
  // never throws). Avoids the prior queryKey collision that crashed the page.
  const { isApproved: kycApproved } = useKycStatus(user?.email);

  if (!account || steps.length === 0) return null;

  const isFunded = account?.status === 'funded';
  const isInstantAccount = account?.challenge_type === 'instant_account';
  const isOneStep = account?.challenge_type === 'one_step';
  // Eligibility: funded + KYC approved + at least 1 trading day (from entity or closed trades)
  const tradingDaysFromTrades = new Set(
    closedTrades.filter(t => t.close_time).map(t => new Date(t.close_time).toISOString().split('T')[0])
  ).size;
  const tradingDays = Math.max(tradingDaysFromTrades, account?.trading_days || 0);
  const isEligible = isInstantAccount
    ? (account?.instant_payout_eligible && kycApproved)
    : isOneStep
      ? (isFunded && kycApproved && tradingDays >= 1)
      : (isFunded && kycApproved && tradingDays >= 1);

  // Build eligibility requirements list
  const requirements = [];
  if (isInstantAccount) {
    if (!account?.buffer_zone_activated) requirements.push({ label: 'Buffer zone target not reached', met: false });
    if (account?.buffer_zone_activated && !account?.consistency_passed) requirements.push({ label: 'Consistency rule not met', met: false });
    if (account?.buffer_zone_activated) {
      const minPD = account?.rule_snapshot?.min_profitable_days ?? 7;
      const pdCount = account?.profitable_days_count || 0;
      if (pdCount < minPD) requirements.push({ label: `Profitable days (${pdCount}/${minPD})`, met: false });
    }
    if (!kycApproved) requirements.push({ label: 'KYC verification approved', met: false });
  } else {
    if (!isFunded) requirements.push({ label: 'Simulation funded account status', met: false });
    if (isFunded && !kycApproved) requirements.push({ label: 'KYC verification approved', met: false });
    if (isFunded && kycApproved && tradingDays < 1) requirements.push({ label: `Minimum 1 trading day (${tradingDays}/1)`, met: false });
  }
  
  const hasRequirements = requirements.length > 0 && !isEligible;

  const handleWithdrawClick = () => {
    if (onRequestWithdrawal) {
      onRequestWithdrawal();
    } else {
      onNavigate?.('withdrawals');
    }
  };

  return (
    <>
      <div className="rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(10,11,20,0.98)',
          border: '1px solid rgba(255,255,255,0.09)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2.5">
            <ArrowRight className="w-3.5 h-3.5 text-primary" />
            <span className="text-sm font-bold text-foreground">Progress Timeline</span>
          </div>
          <button
            onClick={handleWithdrawClick}
            disabled={!isEligible}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              isEligible ? 'hover:opacity-90 active:scale-95' : 'opacity-50 cursor-not-allowed'
            }`}
            style={{ 
              background: isEligible ? '#FF5C00' : 'rgba(255,255,255,0.08)',
              color: isEligible ? '#fff' : 'rgba(255,255,255,0.3)',
              boxShadow: isEligible ? '0 2px 14px rgba(255,92,0,0.4)' : 'none',
              letterSpacing: '0.01em'
            }}
          >
            Request Withdrawal <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Eligibility Requirements (when not eligible) */}
        {hasRequirements && (
          <div className="px-5 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            <div className="text-[10px] font-mono uppercase text-muted-foreground mb-2">Withdrawal Requirements</div>
            <div className="space-y-1.5">
              {requirements.map((req, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <XCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
                  <span className="text-muted-foreground">{req.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Steps */}
        <div className="px-5 py-4">
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
    </>
  );
}