import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Zap, DollarSign, Clock, ArrowRight } from 'lucide-react';
import QuickWithdrawModal from './QuickWithdrawModal';

function fmt(n) { return (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }

function daysSince(dateStr) {
  if (!dateStr) return null;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

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
        {action && (
          <button
            onClick={action.onClick}
            disabled={action.disabled}
            title={action.disabled ? 'Not yet eligible for withdrawal' : undefined}
            className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
            style={action.disabled
              ? { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'not-allowed' }
              : { background: 'linear-gradient(90deg,#10b981,#059669)', color: '#fff', boxShadow: '0 2px 12px rgba(16,185,129,0.3)', cursor: 'pointer' }
            }
          >
            <DollarSign className="w-3 h-3" />
            {action.disabled ? 'Not Yet Eligible' : action.label}
          </button>
        )}
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
    const profitSplit = ruleSnapshot.profit_split ?? (challengeType === 'instant_light' ? 88 : 80);

    const sortedTrades = [...closedTrades].filter(t => t.open_time).sort(
      (a, b) => new Date(a.open_time).getTime() - new Date(b.open_time).getTime()
    );
    const firstTradeDate = sortedTrades[0]?.open_time || null;
    const daysSinceFirstTrade = daysSince(firstTradeDate);

    const isFunded = status === 'funded';
    const withdrawalEligible = isFunded && daysSinceFirstTrade !== null && daysSinceFirstTrade >= 14;

    if (challengeType === 'instant' || challengeType === 'instant_light') {
      const typeLabel = challengeType === 'instant_light' ? 'Instant Light' : 'Instant';
      return [
        {
          icon: CheckCircle2,
          label: 'Challenge Purchased',
          desc: `$${fmt(account.account_size)} ${typeLabel} account issued`,
          status: 'done',
        },
        {
          icon: Zap,
          label: 'One-Time Profit Target',
          desc: profitTargetMet
            ? `✓ ${profitTargetPct}% target achieved`
            : `${profitTargetPct}% profit · ${ruleSnapshot.daily_dd_limit ?? 5}% daily DD`,
          status: profitTargetMet ? 'done' : (status === 'active' ? 'active' : 'pending'),
        },
        {
          icon: DollarSign,
          label: 'Funded Account',
          desc: isFunded
            ? `Live capital · ${profitSplit}% profit split`
            : 'Pending profit target completion',
          status: isFunded ? 'done' : (profitTargetMet ? 'active' : 'pending'),
        },
        {
          icon: Clock,
          label: 'Withdrawal Eligible',
          desc: withdrawalEligible
            ? '✓ Eligible for withdrawals'
            : isFunded
              ? `${14 - daysSinceFirstTrade} days remaining`
              : 'First payout available after funded status',
          status: withdrawalEligible ? 'active' : 'pending',
        },
      ];
    }

    // ─── TWO-STEP ───────────────────────────────────────────────────────────────
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
          ? `✓ ${phase1Target}% target met — XFT Team review in progress`
          : isPhase1Done
            ? `✓ ${phase1Target}% profit · ${dailyDd}% daily DD · ${minDays} min days`
            : `${phase1Target}% profit · ${dailyDd}% daily DD · ${minDays} min days`,
        status: isPhase1UnderReview ? 'review' : isPhase1Done ? 'done' : isPhase1Active ? 'active' : 'pending',
      },
      {
        icon: Zap,
        label: 'Phase 2',
        desc: isPhase2UnderReview
          ? `✓ ${phase2Target}% target met — XFT Team review in progress`
          : isPhase2Done
            ? `✓ ${phase2Target}% profit · ${dailyDd}% daily DD`
            : isPhase1UnderReview
              ? 'Pending Phase 1 approval by XFT Trader Team'
              : `${phase2Target}% profit · ${dailyDd}% daily DD`,
        status: isPhase2UnderReview ? 'review' : isPhase2Done ? 'done' : isPhase2Active ? 'active' : 'pending',
      },
      {
        icon: DollarSign,
        label: 'Funded Account',
        desc: isFunded
          ? `Live capital · ${profitSplit}% profit split`
          : isPhase2UnderReview
            ? 'Pending funded account approval by XFT Trader Team'
            : 'Pending Phase 2 completion',
        status: isFunded ? 'done' : (isPhase2UnderReview ? 'review' : 'pending'),
      },
      {
        icon: Clock,
        label: 'Withdrawal Eligible',
        desc: withdrawalEligible
          ? '✓ Eligible for withdrawals'
          : isFunded
            ? `${14 - daysSinceFirstTrade} days remaining`
            : 'First payout available after funded status',
        status: withdrawalEligible ? 'active' : 'pending',
      },
    ];
  }, [account, closedTrades]);
}

// ─── main ──────────────────────────────────────────────────────────────────────
export default function AccountTimeline({ account, closedTrades = [], onNavigate }) {
  const steps = useTimelineSteps(account, closedTrades);
  const [showWithdraw, setShowWithdraw] = useState(false);

  if (!account || steps.length === 0) return null;

  // Always show "Request Withdraw" on the Withdrawal Eligible step
  const isEligible = steps.find(s => s.label === 'Withdrawal Eligible')?.status === 'active';
  const stepsWithActions = steps.map(step => {
    if (step.label === 'Withdrawal Eligible') {
      return {
        ...step,
        action: {
          label: 'Request Withdraw',
          onClick: () => isEligible ? setShowWithdraw(true) : null,
          disabled: !isEligible,
        },
      };
    }
    return step;
  });

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
            onClick={() => isEligible ? setShowWithdraw(true) : null}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all"
            style={isEligible
              ? { background: '#FF5C00', color: '#fff', boxShadow: '0 2px 14px rgba(255,92,0,0.35)' }
              : { background: 'rgba(255,92,0,0.12)', color: 'rgba(255,92,0,0.45)', border: '1px solid rgba(255,92,0,0.2)', cursor: 'not-allowed' }
            }
            title={!isEligible ? 'Not yet eligible for withdrawal' : undefined}
          >
            <DollarSign className="w-3.5 h-3.5" />
            {isEligible ? 'Request Withdraw' : 'Not Yet Eligible'}
          </button>
        </div>

        {/* Steps */}
        <div className="px-5 py-4">
          {stepsWithActions.map((step, i) => (
            <TimelineStep
              key={step.label}
              {...step}
              index={i}
              isLast={i === stepsWithActions.length - 1}
            />
          ))}
        </div>
      </div>

      {showWithdraw && (
        <QuickWithdrawModal
          account={account}
          onClose={() => setShowWithdraw(false)}
          onSuccess={() => onNavigate?.('withdrawals')}
        />
      )}
    </>
  );
}