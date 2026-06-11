import React from 'react';
import { motion } from 'framer-motion';
import { Check, Clock, Award, Wallet, ShoppingCart } from 'lucide-react';

const STEPS = [
  { id: 'purchased', label: 'Challenge Purchased', desc: 'Account credentials issued', icon: ShoppingCart },
  { id: 'phase1', label: 'Phase 1', desc: '10% profit · 5% daily DD · 4 min days', icon: Clock },
  { id: 'phase2', label: 'Phase 2', desc: '5% profit · 5% daily DD', icon: Clock },
  { id: 'funded', label: 'Funded Account', desc: 'Live capital · 80% profit split', icon: Award },
  { id: 'withdrawal', label: 'Withdrawal Eligible', desc: 'First payout available', icon: Wallet },
];

export default function ProgressTimeline({ account }) {
  const phase = account?.phase || 'phase1';
  const status = account?.status || 'active';
  const phaseReviewStatus = account?.phase_review_status || 'none';
  const fundedReviewStatus = account?.funded_review_status || 'none';

  const getStepStatus = (stepId) => {
    if (stepId === 'purchased') return 'done';
    if (stepId === 'phase1') {
      if (phase === 'phase2' || phase === 'funded' || status === 'passed' || status === 'funded') return 'done';
      if (phaseReviewStatus === 'pending_review') return 'review';
      if (phase === 'phase1' && status === 'active') return 'active';
      return 'waiting';
    }
    if (stepId === 'phase2') {
      if (phase === 'funded' || status === 'funded') return 'done';
      if (phase === 'phase2') return 'active';
      return 'waiting';
    }
    if (stepId === 'funded') {
      if (status === 'funded') return 'done';
      if (fundedReviewStatus === 'pending_review') return 'review';
      return 'waiting';
    }
    if (stepId === 'withdrawal') {
      return 'waiting';
    }
    return 'waiting';
  };

  const statusConfig = {
    done: { circle: 'bg-emerald-500', line: 'bg-emerald-500', text: 'text-emerald-400', icon: Check },
    active: { circle: 'bg-primary', line: 'bg-primary', text: 'text-primary', icon: Clock, pulse: true },
    review: { circle: 'bg-amber-500', line: 'bg-amber-500', text: 'text-amber-400', icon: Clock },
    waiting: { circle: 'bg-white/10', line: 'bg-white/10', text: 'text-white/30', icon: Clock },
  };

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}>
      <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,92,0,0.1)' }}>
            <Award className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-sm font-bold text-foreground">Progress Timeline</span>
        </div>
      </div>
      <div className="p-5">
        <div className="space-y-0">
          {STEPS.map((step, i) => {
            const stepStatus = getStepStatus(step.id);
            const cfg = statusConfig[stepStatus];
            const Icon = cfg.icon;
            const isLast = i === STEPS.length - 1;

            return (
              <div key={step.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${cfg.circle} ${cfg.pulse ? 'animate-pulse' : ''}`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  {!isLast && (
                    <div className={`w-0.5 flex-1 my-2 ${cfg.line}`} />
                  )}
                </div>
                <div className="pb-6">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-sm font-bold ${cfg.text}`}>{step.label}</span>
                    {stepStatus === 'review' && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
                        style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>
                        Review
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/40">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}