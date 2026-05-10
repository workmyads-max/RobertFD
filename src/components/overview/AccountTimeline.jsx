import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Zap, Lock } from 'lucide-react';

const STEPS = [
  { key: 'purchased', label: 'Challenge Purchased', desc: 'Account credentials issued' },
  { key: 'phase1', label: 'Phase 1', desc: '10% profit · 5% daily DD' },
  { key: 'phase2', label: 'Phase 2', desc: '5% profit · 5% daily DD' },
  { key: 'funded', label: 'Funded Account', desc: 'Live capital · 80% split' },
  { key: 'payout', label: 'First Payout', desc: 'Profits withdrawn' },
];

function stepStatus(key, phase, status) {
  if (key === 'purchased') return 'done';
  if (key === 'phase1') {
    if (phase === 'phase2' || phase === 'funded' || status === 'funded') return 'done';
    if (phase === 'phase1' && status === 'active') return 'active';
    return 'pending';
  }
  if (key === 'phase2') {
    if (phase === 'funded' || status === 'funded') return 'done';
    if (phase === 'phase2' && status === 'active') return 'active';
    return 'pending';
  }
  if (key === 'funded') {
    if (status === 'funded') return 'active';
    return 'pending';
  }
  return 'pending';
}

export default function AccountTimeline({ account }) {
  const phase = account?.phase || 'phase1';
  const status = account?.status || 'active';

  return (
    <div className="rounded-2xl p-6 h-full"
      style={{
        background: 'linear-gradient(145deg, rgba(8,14,28,0.98), rgba(10,18,38,0.95))',
        border: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(24px)',
      }}>
      <h3 className="text-base font-semibold text-white mb-6 tracking-tight">Progress Timeline</h3>

      <div className="space-y-0">
        {STEPS.map((step, i) => {
          const st = stepStatus(step.key, phase, status);
          const isDone = st === 'done';
          const isActive = st === 'active';

          return (
            <div key={step.key} className="flex gap-4">
              {/* Line + icon */}
              <div className="flex flex-col items-center">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.08 }}
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 relative"
                  style={{
                    background: isDone ? 'rgba(16,185,129,0.12)' : isActive ? 'rgba(255,92,0,0.12)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isDone ? 'rgba(16,185,129,0.35)' : isActive ? 'rgba(255,92,0,0.35)' : 'rgba(255,255,255,0.06)'}`,
                  }}>
                  {isActive && (
                    <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }} transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 rounded-full"
                      style={{ background: '#FF5C00', opacity: 0.2 }} />
                  )}
                  {isDone
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    : isActive
                      ? <Zap className="w-3.5 h-3.5 text-orange-400" />
                      : <Lock className="w-3 h-3 text-white/15" />}
                </motion.div>
                {i < STEPS.length - 1 && (
                  <div className="w-px flex-1 my-1.5"
                    style={{
                      background: isDone ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.04)',
                      minHeight: '28px',
                    }} />
                )}
              </div>

              {/* Text */}
              <div className="pb-5 pt-0.5 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-[12px] font-medium ${isDone ? 'text-emerald-400' : isActive ? 'text-orange-400' : 'text-white/25'}`}>
                    {step.label}
                  </span>
                  {isActive && (
                    <motion.span
                      animate={{ opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 1.8, repeat: Infinity }}
                      className="text-[8px] font-mono px-1.5 py-0.5 rounded-full"
                      style={{ background: 'rgba(255,92,0,0.15)', color: '#FF5C00', border: '1px solid rgba(255,92,0,0.3)' }}>
                      ACTIVE
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