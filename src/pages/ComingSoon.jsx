import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Rocket, Mail, CheckCircle2 } from 'lucide-react';
import XFLogo from '@/components/shared/XFLogo';
import RiskDisclaimer from '@/components/shared/RiskDisclaimer';
import { getLaunchLabel } from '@/lib/launchConfig';

function CountdownUnit({ value, label }) {
  const v = Math.max(0, value);
  return (
    <div className="flex flex-col items-center">
      <div
        className="w-[68px] sm:w-[92px] md:w-[112px] px-2 py-4 sm:py-5 rounded-lg flex items-center justify-center tabular"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,92,0,0.18)',
          boxShadow: 'inset 0 0 24px rgba(255,92,0,0.05)',
        }}
      >
        <span
          className="font-mono font-black leading-none"
          style={{ fontSize: 'clamp(2rem, 6vw, 3.25rem)', color: '#fff' }}
        >
          {String(v).padStart(2, '0')}
        </span>
      </div>
      <span className="mt-2.5 text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-white/40">
        {label}
      </span>
    </div>
  );
}

function useCountdown(now, launchMs) {
  const diff = Math.max(0, launchMs - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { days, hours, minutes, seconds };
}

export default function ComingSoon({ now, launchMs }) {
  const { days, hours, minutes, seconds } = useCountdown(now, launchMs);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(
    () => typeof localStorage !== 'undefined' && localStorage.getItem('prelaunch_notify') === '1'
  );

  const onSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    try { localStorage.setItem('prelaunch_notify', '1'); } catch {}
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen w-full flex flex-col" style={{ background: 'hsl(0 0% 4%)' }}>
      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(60% 50% at 50% 18%, rgba(255,92,0,0.16) 0%, transparent 60%), radial-gradient(40% 40% at 50% 92%, rgba(255,122,0,0.06) 0%, transparent 70%)',
        }}
      />

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 py-12">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center text-center max-w-xl w-full"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <XFLogo size="xl" animate />
          </motion.div>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.6 }}
            className="mt-8 inline-flex items-center gap-2 px-3.5 py-1.5 rounded"
            style={{ background: 'rgba(255,92,0,0.08)', border: '1px solid rgba(255,92,0,0.25)' }}
          >
            <Rocket className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-primary">
              Pre-Launch
            </span>
          </motion.div>

          {/* Headline */}
          <h1
            className="mt-5 font-black tracking-tight"
            style={{ fontSize: 'clamp(2.25rem, 7vw, 3.75rem)', color: '#fff', lineHeight: 1.05 }}
          >
            Launching Soon
          </h1>

          {/* Subtext */}
          <p className="mt-4 text-sm sm:text-base text-white/55 leading-relaxed max-w-md">
            The next generation of funded trading is almost here. Challenge accounts,
            live MT5 metrics, instant payouts and a real performance leaderboard.
            Going live <span className="text-white/80 font-semibold">{getLaunchLabel()}</span>.
          </p>

          {/* Countdown */}
          <div className="mt-9 flex items-center justify-center gap-2.5 sm:gap-4">
            <CountdownUnit value={days} label="Days" />
            <span className="font-mono font-black text-white/25 text-2xl sm:text-3xl pb-7">:</span>
            <CountdownUnit value={hours} label="Hours" />
            <span className="font-mono font-black text-white/25 text-2xl sm:text-3xl pb-7">:</span>
            <CountdownUnit value={minutes} label="Minutes" />
            <span className="font-mono font-black text-white/25 text-2xl sm:text-3xl pb-7">:</span>
            <CountdownUnit value={seconds} label="Seconds" />
          </div>

          {/* Email notify */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.6 }}
            className="mt-10 w-full max-w-sm"
          >
            {submitted ? (
              <div
                className="flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-lg"
                style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-emerald-300 font-semibold">
                  You're on the list. We'll notify you at launch.
                </span>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full rounded-lg pl-10 pr-3 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/60 transition-colors"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-3 rounded-lg text-sm font-bold text-white whitespace-nowrap transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ background: 'linear-gradient(90deg, #FF5C00, #FF7A2F)' }}
                >
                  Notify Me
                </button>
              </form>
            )}
            <p className="mt-2.5 text-[11px] text-white/30 font-mono">
              Existing users can sign in to access the platform now.
            </p>
          </motion.div>

          {/* Login link for existing users */}
          <a
            href="/login"
            className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-white/45 hover:text-primary transition-colors"
          >
            Sign in
          </a>
        </motion.div>
      </main>

      {/* Footer disclaimer */}
      <footer className="relative z-10 px-5 pb-6 max-w-3xl w-full mx-auto">
        <RiskDisclaimer variant="compact" />
      </footer>
    </div>
  );
}