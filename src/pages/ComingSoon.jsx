import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import XFLogo from '@/components/shared/XFLogo';
import { base44 } from '@/api/base44Client';
import { getLaunchLabel } from '@/lib/launchConfig';

function CountdownUnit({ value, label }) {
  const v = Math.max(0, value);
  return (
    <div className="flex flex-col items-center">
      <div
        className="w-[64px] sm:w-[88px] md:w-[104px] px-2 py-4 sm:py-5 rounded-lg flex items-center justify-center tabular"
        style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,92,0,0.16)' }}
      >
        <span
          className="font-mono font-black leading-none"
          style={{ fontSize: 'clamp(1.9rem, 6vw, 3rem)', color: '#fff' }}
        >
          {String(v).padStart(2, '0')}
        </span>
      </div>
      <span className="mt-2.5 text-[10px] sm:text-xs font-mono uppercase tracking-[0.22em] text-white/40">
        {label}
      </span>
    </div>
  );
}

function useCountdown(now, launchMs) {
  const diff = Math.max(0, launchMs - now);
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

export default function ComingSoon({ now, launchMs }) {
  const { days, hours, minutes, seconds } = useCountdown(now, launchMs);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [msg, setMsg] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || status === 'loading') return;
    setStatus('loading');
    setMsg('');
    try {
      const res = await base44.functions.invoke('prelaunchSignup', { email: email.trim() });
      if (res?.data?.error) throw new Error(res.data.error);
      setStatus('success');
      setMsg(
        res?.data?.already_subscribed
          ? "You're already on the list — we'll email you at launch."
          : "You're on the list. We'll email you the moment we go live."
      );
      setEmail('');
    } catch (err) {
      setStatus('error');
      setMsg(err?.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col" style={{ background: 'hsl(0 0% 4%)' }}>
      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(55% 45% at 50% 16%, rgba(255,92,0,0.14) 0%, transparent 62%), radial-gradient(35% 35% at 50% 95%, rgba(255,122,0,0.05) 0%, transparent 70%)',
        }}
      />
      {/* Top hairline accent */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 h-px w-[60%] max-w-2xl"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,92,0,0.5), transparent)' }}
      />

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 py-14">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center text-center max-w-xl w-full"
        >
          {/* Logo (enlarged) */}
          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            style={{ transform: 'scale(1.3)' }}
          >
            <XFLogo size="xl" animate />
          </motion.div>

          {/* Pre-Launch tag — flat, modern, no icon */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24, duration: 0.6 }}
            className="mt-10 inline-flex items-center gap-2.5 px-3 py-1.5"
            style={{ borderLeft: '2px solid #FF5C00', background: 'rgba(255,255,255,0.02)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#FF5C00' }} />
            <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/55">
              Pre-Launch
            </span>
          </motion.div>

          {/* Headline */}
          <h1
            className="mt-6 font-black tracking-tight"
            style={{ fontSize: 'clamp(2.4rem, 7vw, 4rem)', color: '#fff', lineHeight: 1.04 }}
          >
            Launching Soon
          </h1>

          {/* Subtext */}
          <p className="mt-5 text-sm sm:text-base text-white/55 leading-relaxed max-w-md">
            The next generation of funded trading is almost here. Challenge accounts,
            live MT5 metrics, instant payouts and a real performance leaderboard —
            going live <span className="text-white/85 font-semibold">{getLaunchLabel()}</span>.
          </p>

          {/* Countdown */}
          <div className="mt-10 flex items-center justify-center gap-2 sm:gap-3.5">
            <CountdownUnit value={days} label="Days" />
            <span className="font-mono font-black text-white/20 text-xl sm:text-2xl pb-7">:</span>
            <CountdownUnit value={hours} label="Hours" />
            <span className="font-mono font-black text-white/20 text-xl sm:text-2xl pb-7">:</span>
            <CountdownUnit value={minutes} label="Minutes" />
            <span className="font-mono font-black text-white/20 text-xl sm:text-2xl pb-7">:</span>
            <CountdownUnit value={seconds} label="Seconds" />
          </div>

          {/* Notify form */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42, duration: 0.6 }}
            className="mt-11 w-full max-w-sm"
          >
            {status === 'success' ? (
              <div
                className="flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-lg"
                style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-emerald-300 font-semibold">{msg}</span>
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
                    disabled={status === 'loading'}
                    className="w-full rounded-lg pl-10 pr-3 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/60 transition-colors disabled:opacity-60"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="px-5 py-3 rounded-lg text-sm font-bold text-white whitespace-nowrap transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(90deg, #FF5C00, #FF7A2F)' }}
                >
                  {status === 'loading' ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Subscribing</>
                  ) : (
                    'Notify Me'
                  )}
                </button>
              </form>
            )}

            {status === 'error' && (
              <div
                className="mt-3 flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-red-300"
                style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.22)' }}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{msg}</span>
              </div>
            )}

            <p className="mt-3 text-[11px] text-white/30 font-mono">
              We'll email you the moment we go live. No spam.
            </p>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}