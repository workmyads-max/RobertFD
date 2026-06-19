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
    const withdrawalEligible = isFunded && daysSinceFirstTrade !== null && daysSinceFirstTrade >= 1;

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
              ? `${1 - daysSinceFirstTrade} days remaining`
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
            ? `${1 - daysSinceFirstTrade} days remaining`
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
  const [showNotEligible, setShowNotEligible] = useState(false);

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
            onClick={() => isEligible ? setShowWithdraw(true) : setShowNotEligible(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all hover:opacity-90 active:scale-95"
            style={{ background: '#FF5C00', color: '#fff', boxShadow: '0 2px 14px rgba(255,92,0,0.4)', letterSpacing: '0.01em' }}
          >
            Request Withdrawal <ArrowRight className="w-3.5 h-3.5" />
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

      {/* Not Eligible Popup */}
      {showNotEligible && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(14px)' }}
          onClick={() => setShowNotEligible(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 24 }} animate={{ scale: 1, y: 0 }}
            className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ background: '#0e0f18', border: '1px solid rgba(255,92,0,0.25)', boxShadow: '0 0 60px rgba(255,92,0,0.12)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Top accent bar */}
            <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)' }} />
            <div className="p-6 flex flex-col items-center text-center gap-4">
              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(255,92,0,0.1)', border: '1px solid rgba(255,92,0,0.3)' }}>
                <Clock className="w-7 h-7" style={{ color: '#FF5C00' }} />
              </div>
              <div>
                <h3 className="text-lg font-black text-foreground mb-1">Not Yet Eligible</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Withdrawals are unlocked after <span className="text-white font-semibold">1 trading day</span> on your funded account.
                  Keep trading to reach your first payout.
                </p>
              </div>
              {/* Requirement chips */}
              <div className="w-full rounded-xl p-4 space-y-2.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                {[
                  { label: 'Funded account status', met: account?.status === 'funded' },
                  { label: '1 trading day completed', met: false },
                  { label: 'KYC verification approved', met: false },
                ].map((req, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: req.met ? 'rgba(16,185,129,0.15)' : 'rgba(255,92,0,0.1)', border: `1px solid ${req.met ? 'rgba(16,185,129,0.4)' : 'rgba(255,92,0,0.3)'}` }}>
                      {req.met
                        ? <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                        : <Clock className="w-2 h-2" style={{ color: '#FF5C00' }} />}
                    </div>
                    <span className="text-xs font-mono" style={{ color: req.met ? '#10b981' : 'rgba(255,255,255,0.5)' }}>{req.label}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowNotEligible(false)}
                className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
                style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)', boxShadow: '0 4px 20px rgba(255,92,0,0.3)' }}>
                Got It
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}