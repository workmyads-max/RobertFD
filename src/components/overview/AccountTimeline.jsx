import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Zap, Lock, Clock, DollarSign, ArrowRight } from 'lucide-react';

const STEPS = [
  { key: 'purchased', label: 'Challenge Purchased', desc: 'Account credentials issued', icon: CheckCircle2 },
  { key: 'phase1',    label: 'Phase 1',             desc: '10% profit · 5% daily DD · 4 min days', icon: Zap },
  { key: 'phase2',    label: 'Phase 2',             desc: '5% profit · 5% daily DD', icon: Zap },
  { key: 'funded',    label: 'Funded Account',      desc: 'Live capital · 80% profit split', icon: DollarSign },
  { key: 'payout',    label: 'Withdrawal Eligible', desc: 'First payout available', icon: DollarSign },
];

function getStepStatus(key, phase, status) {
  if (key === 'purchased') return 'done';
  if (key === 'phase1') {
    if (phase === 'phase2' || phase === 'funded' || status === 'funded') return 'done';
    if (phase === 'phase1' && status === 'active') return 'active';
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
    if (status === 'funded') return 'active';
    if (phase === 'funded') return 'active';
    return 'pending';
  }
  if (key === 'payout') {
    if (status === 'funded') return 'active';
    return 'pending';
  }
  return 'pending';
}

const STATUS_CONFIG = {
  done:    { line: 'rgba(16,185,129,0.3)',  ring: 'rgba(16,185,129,0.3)',  bg: 'rgba(16,185,129,0.08)', color: '#10b981', label: null },
  active:  { line: 'rgba(255,92,0,0.2)',    ring: 'rgba(255,92,0,0.35)',   bg: 'rgba(255,92,0,0.08)',   color: '#FF5C00', label: 'ACTIVE' },
  waiting: { line: 'rgba(245,158,11,0.2)',  ring: 'rgba(245,158,11,0.3)',  bg: 'rgba(245,158,11,0.08)', color: '#f59e0b', label: 'WAITING' },
  failed:  { line: 'rgba(239,68,68,0.2)',   ring: 'rgba(239,68,68,0.3)',   bg: 'rgba(239,68,68,0.08)',  color: '#ef4444', label: 'FAILED' },
  pending: { line: 'rgba(255,255,255,0.04)', ring: 'rgba(255,255,255,0.06)', bg: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.18)', label: null },
};

export default function AccountTimeline({ account }) {
  const phase  = account?.phase  || 'phase1';
  const status = account?.status || 'active';
  // Instant challenges skip phase2
  const isInstant = account?.challenge_type === 'instant' || account?.challenge_type === 'instant_light';

  const steps = isInstant ? STEPS.filter(s => s.key !== 'phase2') : STEPS;

  return (
    <div className="rounded-2xl p-5 h-full"
      style={{
        background: 'linear-gradient(145deg, rgba(10,16,32,0.97), rgba(12,20,40,0.95))',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(24px)',
      }}>
      <h3 className="text-sm font-semibold text-white/90 mb-5 tracking-tight flex items-center gap-2">
        <ArrowRight className="w-3.5 h-3.5 text-primary/60" />
        Progress Timeline
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
              {/* Column: icon + connector line */}
              <div className="flex flex-col items-center">
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.08, type: 'spring', stiffness: 200 }}
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 relative"
                  style={{ background: cfg.bg, border: `1px solid ${cfg.ring}` }}>
                  {isActive && (
                    <motion.div
                      animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }}
                      transition={{ duration: 2.5, repeat: Infinity }}
                      className="absolute inset-0 rounded-full"
                      style={{ border: `1px solid ${cfg.color}`, opacity: 0.4 }}
                    />
                  )}
                  {isDone
                    ? <CheckCircle2 className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                    : <Icon className="w-3 h-3" style={{ color: cfg.color }} />}
                </motion.div>
                {i < steps.length - 1 && (
                  <div className="w-px flex-1 my-1" style={{ background: cfg.line, minHeight: '24px' }} />
                )}
              </div>

              {/* Content */}
              <div className="pb-5 pt-0.5 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="text-[12px] font-medium" style={{ color: cfg.color }}>
                    {step.label}
                  </span>
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
                <div className="text-[10px] text-white/20 font-mono">{step.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}