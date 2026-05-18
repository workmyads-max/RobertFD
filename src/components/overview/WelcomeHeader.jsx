import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, AlertCircle, MapPin, Wifi, Zap } from 'lucide-react';
import { useUserLocation } from '@/hooks/useUserLocation';

export default function WelcomeHeader({ user, kyc, onStartChallenge }) {
  const location = useUserLocation();
  const kycStatus = kyc?.status || 'not_submitted';
  const isVerified = kycStatus === 'approved';
  const displayName = user?.full_name || user?.email?.split('@')[0] || 'Trader';
  const firstName = displayName.split(' ')[0];
  const initials = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const hour = time.getUTCHours();
  const greeting = hour < 5 ? 'Good Night' : hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(8,14,30,0.98) 0%, rgba(12,20,44,0.97) 50%, rgba(10,16,36,0.98) 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(40px)',
      }}
    >
      {/* Animated top glow line */}
      <motion.div
        animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,92,0,0.9), rgba(204,255,0,0.7), rgba(255,92,0,0.9), transparent)',
          backgroundSize: '200% 100%',
        }}
      />

      {/* Background orbs */}
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,92,0,0.06) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
      <div className="absolute bottom-0 left-1/4 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,149,255,0.05) 0%, transparent 70%)', transform: 'translateY(50%)' }} />

      <div className="relative z-10 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">

        {/* Left: Avatar + greeting */}
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <motion.div
              animate={{ boxShadow: ['0 0 0px rgba(255,92,0,0)', '0 0 24px rgba(255,92,0,0.4)', '0 0 0px rgba(255,92,0,0)'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center text-xl md:text-2xl font-black text-white"
              style={{
                background: 'linear-gradient(135deg, rgba(255,92,0,0.3), rgba(255,92,0,0.1))',
                border: '1px solid rgba(255,92,0,0.35)',
              }}>
              {initials}
            </motion.div>
            {/* KYC dot */}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: isVerified ? '#10b981' : '#f59e0b', border: '2px solid rgba(8,14,30,1)' }}>
              {isVerified
                ? <ShieldCheck className="w-3 h-3 text-white" />
                : <AlertCircle className="w-3 h-3 text-white" />}
            </div>
          </div>

          {/* Text */}
          <div>
            <div className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em] mb-1">{greeting}</div>
            <h1 className="text-2xl md:text-3xl font-black text-white leading-none tracking-tight mb-2">
              Welcome,{' '}
              <span style={{
                background: 'linear-gradient(90deg, #FF5C00, #FF9A3D, #CCFF00)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                {firstName}
              </span>
            </h1>

            {/* Badges row */}
            <div className="flex items-center gap-2 flex-wrap">
              {isVerified ? (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold font-mono"
                  style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.35)', color: '#10b981' }}>
                  <ShieldCheck className="w-3 h-3" /> KYC Verified
                </div>
              ) : (
                <button onClick={() => {}}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold font-mono transition-all hover:scale-105"
                  style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.35)', color: '#f59e0b' }}>
                  <AlertCircle className="w-3 h-3" /> Unverified — Verify Now
                </button>
              )}

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono"
                style={{ background: 'rgba(255,92,0,0.1)', border: '1px solid rgba(255,92,0,0.25)', color: '#FF5C00' }}>
                <Zap className="w-3 h-3" /> Funded Trader
              </div>

              {/* Live clock */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono text-white/30"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                {time.toUTCString().slice(17, 25)} UTC
              </div>
            </div>
          </div>
        </div>

        {/* Right: Location + session info */}
        <div className="flex flex-col gap-2 md:text-right">
          {!location.loading && (
            <>
              <div className="flex items-center gap-2 text-[11px] font-mono text-white/40 md:justify-end">
                <MapPin className="w-3.5 h-3.5 text-white/25" />
                {location.flag && <span>{location.flag}</span>}
                <span>{location.city || '—'}, {location.country || '—'}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-white/25 md:justify-end">
                <Wifi className="w-3.5 h-3.5" />
                <span>{location.ip || '—'}</span>
              </div>
            </>
          )}
          {location.loading && (
            <div className="text-[10px] font-mono text-white/20 animate-pulse">Identifying session...</div>
          )}


        </div>
      </div>
    </motion.div>
  );
}