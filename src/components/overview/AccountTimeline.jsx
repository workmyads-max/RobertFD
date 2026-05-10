import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Clock, Zap } from 'lucide-react';

export default function AccountTimeline({ account }) {
  const phase = account?.phase || 'phase1';
  const status = account?.status || 'active';

  const steps = [
    {
      label: 'Challenge Purchased',
      desc: 'Account activated',
      done: true,
    },
    {
      label: 'Phase 1',
      desc: '10% profit target, 5% daily DD',
      done: phase === 'phase2' || phase === 'funded' || status === 'funded',
      active: phase === 'phase1' && status === 'active',
    },
    {
      label: 'Phase 2',
      desc: '5% profit target, 5% daily DD',
      done: phase === 'funded' || status === 'funded',
      active: phase === 'phase2' && status === 'active',
    },
    {
      label: 'Funded Account',
      desc: 'Live capital, 80% profit split',
      done: status === 'funded',
      active: status === 'funded',
    },
    {
      label: 'First Payout',
      desc: 'Withdraw your profits',
      done: false,
    },
  ];

  return (
    <div className="rounded-2xl p-5"
      style={{
        background: 'linear-gradient(135deg, rgba(8,12,24,0.95), rgba(12,18,35,0.95))',
        border: '1px solid rgba(0,149,255,0.08)',
        backdropFilter: 'blur(20px)',
      }}>
      <h3 className="text-sm font-black text-white mb-5 flex items-center gap-2">
        <span className="w-1.5 h-4 rounded-full bg-blue-400 inline-block" />
        Progress Timeline
      </h3>
      <div className="space-y-0">
        {steps.map((step, i) => (
          <div key={step.label} className="flex gap-3">
            {/* Icon + line */}
            <div className="flex flex-col items-center">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10"
                style={{
                  background: step.done
                    ? 'rgba(0,245,160,0.15)'
                    : step.active
                      ? 'rgba(0,149,255,0.15)'
                      : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${step.done ? 'rgba(0,245,160,0.4)' : step.active ? 'rgba(0,149,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
                }}>
                {step.done
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  : step.active
                    ? <Zap className="w-3.5 h-3.5 text-blue-400" />
                    : <Circle className="w-3.5 h-3.5 text-white/15" />}
              </motion.div>
              {i < steps.length - 1 && (
                <div className="w-px flex-1 my-1"
                  style={{ background: step.done ? 'rgba(0,245,160,0.2)' : 'rgba(255,255,255,0.04)', minHeight: '20px' }} />
              )}
            </div>
            {/* Text */}
            <div className="pb-4 pt-0.5">
              <div className={`text-[11px] font-bold ${step.done ? 'text-emerald-400' : step.active ? 'text-blue-400' : 'text-white/30'}`}>
                {step.label}
                {step.active && <span className="ml-2 text-[8px] font-mono bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full">CURRENT</span>}
              </div>
              <div className="text-[9px] text-white/20 font-mono mt-0.5">{step.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}