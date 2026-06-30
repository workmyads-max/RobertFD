import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ArrowRight, Trophy, Rocket, Timer } from 'lucide-react';
import confetti from 'canvas-confetti';

/**
 * Phase transition congratulations modal.
 * Shown when Phase 1 → Phase 2 or Phase 2 → Funded.
 * Handles the 48-hour countdown display before next phase activates.
 */
export default function PhaseTransitionModal({ type, account, onClose }) {
  const [countdown, setCountdown] = useState({ h: 48, m: 0, s: 0 });

  useEffect(() => {
    // Fire confetti on mount
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#FF5C00', '#FF8A3D', '#CCFF00', '#ffffff'] });
    const timer2 = setTimeout(() => {
      confetti({ particleCount: 100, spread: 120, origin: { y: 0.4 } });
    }, 800);
    return () => clearTimeout(timer2);
  }, []);

  // Count down the 48h activation timer
  useEffect(() => {
    const passedAt = account?.updated_date ? new Date(account.updated_date) : new Date();
    const activateAt = new Date(passedAt.getTime() + 48 * 3600 * 1000);

    const tick = () => {
      const diff = activateAt - new Date();
      if (diff <= 0) { setCountdown({ h: 0, m: 0, s: 0 }); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown({ h, m, s });
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [account]);

  const isPhase2 = type === 'phase2';
  const isFunded = type === 'funded';

  const config = {
    phase2: {
      icon: ArrowRight,
      color: '#FF5C00',
      title: '🎉 Phase 1 Complete!',
      subtitle: 'Congratulations - You\'ve passed Phase 1!',
      body: 'Your Phase 2 account is being prepared. You\'ll have 48 hours before it\'s activated. Phase 1 history is preserved in your analytics and certificates.',
      next: 'Phase 2 activation in:',
      cta: 'View Certificates',
    },
    funded: {
      icon: Trophy,
      color: '#CCFF00',
      title: '🏆 You Are Now Funded!',
      subtitle: 'Congratulations - Phase 2 Complete!',
      body: 'You\'ve successfully completed both phases. Your live funded account is being activated. Withdrawals are unlocked after KYC approval.',
      next: 'Funded account activation in:',
      cta: 'View Funded Account',
    },
  };

  const cfg = config[type] || config.phase2;
  const Icon = cfg.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.7, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          onClick={e => e.stopPropagation()}
          className="relative max-w-md w-full rounded-3xl p-8 text-center overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, rgba(12,12,16,0.99), rgba(8,14,28,0.99))',
            border: `1px solid ${cfg.color}40`,
            boxShadow: `0 0 80px ${cfg.color}20`,
          }}
        >
          {/* Glow bg */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(ellipse at 50% 0%, ${cfg.color}10, transparent 70%)` }} />

          {/* Icon */}
          <motion.div
            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
            className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 relative"
            style={{ background: `${cfg.color}15`, border: `2px solid ${cfg.color}40` }}
          >
            <Icon className="w-10 h-10" style={{ color: cfg.color }} />
          </motion.div>

          <h2 className="text-2xl font-black text-white mb-2">{cfg.title}</h2>
          <p className="text-sm font-semibold mb-3" style={{ color: cfg.color }}>{cfg.subtitle}</p>
          <p className="text-xs text-white/50 leading-relaxed mb-6">{cfg.body}</p>

          {/* 48h Countdown */}
          <div className="rounded-2xl p-4 mb-6"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-3">{cfg.next}</div>
            <div className="flex items-center justify-center gap-3">
              {[{ v: countdown.h, l: 'Hours' }, { v: countdown.m, l: 'Mins' }, { v: countdown.s, l: 'Secs' }].map(({ v, l }) => (
                <div key={l} className="text-center">
                  <div className="text-3xl font-black tabular-nums" style={{ color: cfg.color }}>
                    {String(v).padStart(2, '0')}
                  </div>
                  <div className="text-[9px] font-mono text-white/30 mt-1">{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Account info */}
          {account && (
            <div className="flex items-center justify-center gap-4 text-[10px] font-mono text-white/30 mb-6">
              <span>#{account.account_id}</span>
              <span>·</span>
              <span>${(account.account_size || 0).toLocaleString()}</span>
              <span>·</span>
              <span>{account.leverage}</span>
            </div>
          )}

          <button onClick={onClose}
            className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
            style={{ background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}cc)` }}>
            {cfg.cta}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}