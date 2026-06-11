import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, AlertCircle, Clock, Activity, Shield, Wifi, Zap, ArrowUpRight } from 'lucide-react';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { SESSIONS } from '../terminal/terminalConfig';

export default function UnifiedWelcomeHeader({ user, kyc, onStartChallenge }) {
  const location = useUserLocation();
  const kycStatus = kyc?.status || 'not_submitted';
  const isVerified = kycStatus === 'approved';
  const displayName = user?.full_name || user?.email?.split('@')[0] || 'Trader';
  const firstName = displayName.split(' ')[0];
  const initials = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const { data: socialSettings = [] } = useQuery({
    queryKey: ['social-media-settings'],
    queryFn: () => base44.entities.SocialMediaSettings.filter({ setting_key: 'global' }),
    retry: false,
  });
  const social = socialSettings?.[0] || {};

  const [time, setTime] = useState(new Date());
  const [latency, setLatency] = useState(15);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [fade, setFade] = useState(true);

  const quotes = [
    { text: "Trade what you see, not what you think", author: "Unknown" },
    { text: "Cut losses quickly, let winners run", author: "Paul Tudor Jones" },
    { text: "Patience is more important than speed", author: "Warren Buffett" },
    { text: "The best trade is often no trade", author: "Unknown" },
    { text: "Risk management is everything", author: "Unknown" },
    { text: "Plan the trade, trade the plan", author: "Unknown" },
  ];

  useEffect(() => {
    const t1 = setInterval(() => setTime(new Date()), 1000);
    const t2 = setInterval(() => setLatency(8 + Math.floor(Math.random() * 15)), 2500);
    const t3 = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setQuoteIndex(i => (i + 1) % quotes.length);
        setFade(true);
      }, 300);
    }, 10000);
    return () => { clearInterval(t1); clearInterval(t2); clearInterval(t3); };
  }, []);

  const hour = time.getUTCHours();
  const greeting = hour < 5 ? 'Good Night' : hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const utcStr = time.toUTCString().slice(17, 25);
  const utcHour = time.getUTCHours();

  const discordUrl = social?.discord_enabled ? social.discord_url : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(18,22,36,0.96) 0%, rgba(14,18,28,0.98) 60%, rgba(20,14,10,0.95) 100%)',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(24px)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.05) inset, 0 -1px 0 rgba(0,0,0,0.3) inset, 0 4px 24px rgba(0,0,0,0.25)',
      }}
    >
      {/* Thin top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, rgba(255,92,0,0.6) 0%, rgba(255,92,0,0.15) 40%, transparent 100%)' }} />

      {/* Subtle warm ambient in bottom-right */}
      <div className="absolute bottom-0 right-0 w-64 h-40 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at bottom right, rgba(255,92,0,0.06) 0%, transparent 65%)' }} />

      {/* Top Section - User Info + Discord */}
      <div className="relative z-10 px-4 py-4 sm:px-6 sm:py-5 flex flex-col gap-4">
        
        {/* Left: Avatar + Welcome */}
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div
              className="w-20 h-20 sm:w-28 sm:h-28 rounded-xl flex items-center justify-center text-2xl sm:text-3xl font-bold text-white overflow-hidden"
              style={{
                background: (user?.avatar_url || user?.profile_photo_url)
                  ? 'transparent'
                  : 'linear-gradient(145deg, rgba(255,92,0,0.22) 0%, rgba(255,92,0,0.08) 100%)',
                border: '2px solid rgba(255,92,0,0.3)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
              }}>
              {user?.avatar_url || user?.profile_photo_url ? (
                <img src={user.avatar_url || user.profile_photo_url} alt={displayName} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.querySelector('span') && (e.target.parentElement.querySelector('span').style.display = 'block'); }} />
              ) : (
                <span className="font-semibold tracking-wide" style={{ color: 'rgba(255,140,60,0.9)' }}>{initials}</span>
              )}
              {/* Fallback initials if image fails */}
              {!(user?.avatar_url || user?.profile_photo_url) && (
                <span className="font-semibold tracking-wide" style={{ color: 'rgba(255,140,60,0.9)' }}>{initials}</span>
              )}
            </div>
            {/* KYC dot */}
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center"
              style={{
                background: isVerified ? '#059669' : '#d97706',
                border: '2px solid rgba(14,18,28,1)',
                boxShadow: isVerified ? '0 0 8px rgba(5,150,105,0.5)' : '0 0 8px rgba(217,119,6,0.5)',
              }}>
              {isVerified
                ? <ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                : <AlertCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />}
            </div>
          </div>

          {/* Text block */}
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="text-[10px] sm:text-xs font-semibold text-white/40 uppercase tracking-[0.2em] mb-1">{greeting}</p>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-tight tracking-tight mb-3">
              Welcome back,{' '}
              <span style={{
                background: 'linear-gradient(90deg, #FF6B1A, #FF9A3D)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontWeight: '800',
              }}>
                {firstName}
              </span>
            </h1>

            {/* Badges */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {isVerified ? (
                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[9px] sm:text-[10px] font-medium"
                  style={{ background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.2)', color: '#34d399' }}>
                  <ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> <span className="hidden xs:inline">KYC Verified</span><span className="xs:hidden">Verified</span>
                </div>
              ) : (
                <button onClick={() => {}}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[9px] sm:text-[10px] font-medium transition-opacity hover:opacity-80"
                  style={{ background: 'rgba(217,119,6,0.1)', border: '1px solid rgba(217,119,6,0.25)', color: '#fbbf24' }}>
                  <AlertCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> <span className="hidden xs:inline">Verify Identity</span><span className="xs:hidden">Verify</span>
                </button>
              )}

              {/* Live clock */}
              <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[9px] sm:text-[10px] font-mono"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }}>
                {utcStr}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Discord Community Banner */}
        {discordUrl && (
          <div className="w-full">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="rounded-lg sm:rounded-xl p-3 sm:p-4"
              style={{
                background: '#161B22',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {/* Header */}
              <div className="flex items-start gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-lg">
                  <svg width="16" height="16" sm:width="20" sm:height="20" viewBox="0 0 24 24" fill="#5865F2">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.11 18.1.127 18.11a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">Join Our Discord Community</h3>
                  <p className="text-[10px] sm:text-xs text-white/40 leading-relaxed mt-0.5 truncate">Connect with traders, share strategies</p>
                </div>
              </div>

              {/* Action Bar */}
              <motion.div
                className="relative rounded-full p-0.5"
                style={{
                  background: 'linear-gradient(90deg, #2563EB 0%, #1E3A8A 100%)',
                  boxShadow: '0 4px 16px rgba(37,99,235,0.3)',
                }}
              >
                <div className="flex items-center justify-between px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-full"
                  style={{ background: 'rgba(13,17,23,0.95)' }}>
                  
                  {/* Left Side: Avatars */}
                  <div className="flex items-center gap-2">
                    <motion.div 
                      className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-md"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <svg width="12" height="12" sm:width="14" sm:height="14" viewBox="0 0 24 24" fill="#5865F2">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.11 18.1.127 18.11a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                      </svg>
                    </motion.div>

                    <div className="flex -space-x-1.5 sm:-space-x-2">
                      <motion.img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=64&h=64&fit=crop&crop=face" alt="Member" className="w-5 h-5 sm:w-7 sm:h-7 rounded-full border-2 border-[#1E3A8A] object-cover" whileHover={{ scale: 1.15, zIndex: 10 }} />
                      <motion.img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop&crop=face" alt="Member" className="w-5 h-5 sm:w-7 sm:h-7 rounded-full border-2 border-[#1E3A8A] object-cover" whileHover={{ scale: 1.15, zIndex: 10 }} />
                      <motion.img src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=64&h=64&fit=crop&crop=face" alt="Member" className="w-5 h-5 sm:w-7 sm:h-7 rounded-full border-2 border-[#1E3A8A] object-cover" whileHover={{ scale: 1.15, zIndex: 10 }} />
                    </div>

                    <div className="flex -space-x-0.5 ml-0.5">
                      <motion.div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#22C55E] border border-[#1E3A8A]" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }} />
                      <motion.div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#22C55E] border border-[#1E3A8A]" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }} />
                    </div>
                  </div>

                  <motion.a href={discordUrl} target="_blank" rel="noopener noreferrer" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white flex items-center justify-center shadow-md flex-shrink-0">
                    <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: '#2563EB' }} strokeWidth={2.5} />
                  </motion.a>
                </div>
              </motion.div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Bottom Section - Status Bar (merged) */}
      <div className="border-t border-white/[0.06] px-3 py-2.5 sm:px-5 sm:py-3">
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {/* Time Section */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center flex-shrink-0" 
              style={{ background: 'rgba(255,92,0,0.08)', border: '1px solid rgba(255,92,0,0.15)' }}>
              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color: '#FF5C00' }} />
            </div>
            <div className="flex-shrink-0">
              <div className="text-[9px] sm:text-[10px] font-mono text-white/35 mb-0.5">Server Time</div>
              <div className="text-xs sm:text-sm font-bold font-mono" style={{ color: '#FF5C00' }}>{utcStr}</div>
            </div>
          </div>

          {/* Market Sessions - Hide on mobile */}
          <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
            <div className="text-[9px] sm:text-[10px] font-semibold text-white/35 uppercase tracking-wider mr-1">Markets</div>
            {SESSIONS.slice(0, 2).map(s => {
              const isOpen = s.open < s.close
                ? utcHour >= s.open && utcHour < s.close
                : utcHour >= s.open || utcHour < s.close;
              return (
                <motion.div 
                  key={s.name}
                  initial={false}
                  animate={{ scale: isOpen ? [1, 1.05, 1] : 1 }}
                  transition={{ duration: 2, repeat: isOpen ? Infinity : 0 }}
                  className="flex items-center gap-1 px-2 py-1 rounded text-[9px] sm:text-[10px] font-semibold transition-all flex-shrink-0"
                  style={{
                    background: isOpen ? 'rgba(255,255,255,0.04)' : 'transparent',
                    border: `1px solid ${isOpen ? 'rgba(255,255,255,0.1)' : 'transparent'}`,
                    color: isOpen ? '#FFFFFF' : 'rgba(255,255,255,0.2)',
                  }}>
                  {isOpen && (
                    <motion.div 
                      className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full" 
                      style={{ background: s.color }}
                      animate={{ opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                  {s.name.split(' ')[0]}
                </motion.div>
              );
            })}
          </div>

          {/* Right Section - Status (simplified for mobile) */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Platform Status */}
            <div className="flex items-center gap-1.5">
              <div className="relative w-1.5 h-1.5 sm:w-2 sm:h-2 flex-shrink-0">
                <div className="absolute inset-0 rounded-full" style={{ background: '#10b981', opacity: 0.3 }} />
                <motion.div className="absolute inset-0 rounded-full" style={{ background: '#10b981' }} animate={{ scale: [1, 1.4, 1], opacity: [1, 0.8, 1] }} transition={{ duration: 2, repeat: Infinity }} />
              </div>
              <span className="text-[9px] sm:text-[10px] text-emerald-400 font-bold flex-shrink-0">Online</span>
            </div>

            {/* Latency - Desktop only */}
            <div className="hidden md:flex items-center gap-1.5 flex-shrink-0">
              <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center" 
                style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
                <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color: '#10b981' }} />
              </div>
              <div className="text-[9px] sm:text-[10px]">
                <span className="text-white/70 font-bold font-mono">{latency}ms</span>
              </div>
            </div>
          </div>

          {/* Trading Quote - Desktop only */}
          <div className="hidden lg:flex items-center gap-2 flex-1 min-w-0">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center flex-shrink-0" 
              style={{ background: 'rgba(255,92,0,0.08)', border: '1px solid rgba(255,92,0,0.15)' }}>
              <Activity className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color: '#FF5C00' }} />
            </div>
            <div className="flex-1 min-w-0 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={quoteIndex}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: fade ? 1 : 0, x: fade ? 0 : -8 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.3 }}
                  className="text-[9px] sm:text-[10px] truncate"
                >
                  <span className="text-white/50 italic">"{quotes[quoteIndex].text}"</span>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}