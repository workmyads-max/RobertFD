import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, AlertCircle, Zap, Globe, MessageCircle, Send, ArrowRight } from 'lucide-react';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function WelcomeHeader({ user, kyc, onStartChallenge }) {
  const location = useUserLocation();
  const kycStatus = kyc?.status || 'not_submitted';
  const isVerified = kycStatus === 'approved';
  const displayName = user?.full_name || user?.email?.split('@')[0] || 'Trader';
  const firstName = displayName.split(' ')[0];
  const initials = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const { data: socialSettings = [] } = useQuery({
    queryKey: ['social-media-settings'],
    queryFn: () => base44.entities.SocialMediaSettings.filter({ setting_key: 'global' }),
  });
  const social = socialSettings[0] || {};

  // Fetch active promotions
  const { data: promotions = [] } = useQuery({
    queryKey: ['promotions'],
    queryFn: async () => {
      const all = await base44.entities.Promotion.filter({ is_active: true });
      const now = new Date();
      return all.filter(p => {
        if (p.start_date && new Date(p.start_date) > now) return false;
        if (p.end_date && new Date(p.end_date) < now) return false;
        return true;
      }).sort((a, b) => (b.sort_order || 0) - (a.sort_order || 0));
    },
  });
  const activePromotion = promotions[0];

  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const hour = time.getUTCHours();
  const greeting = hour < 5 ? 'Good Night' : hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  const quotes = [
    "Success in trading is not about being right, it's about managing risk.",
    "The market is a device for transferring money from the impatient to the patient.",
    "Trade what you see, not what you think.",
    "Losses are the tuition you pay to the market.",
    "The goal is not to be a hero, but to be a disciplined trader.",
    "In trading, patience is not a virtue, it's a necessity.",
    "Cut losses quickly and let winners run.",
    "The best trade is often the one you don't make.",
  ];
  const dailyQuote = quotes[new Date().getDate() % quotes.length];

  return (
    <div className="space-y-4">
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative rounded-xl overflow-hidden border-l-4"
      style={{
        background: 'linear-gradient(90deg, rgba(8,14,30,0.95) 0%, rgba(12,20,44,0.92) 100%)',
        borderLeft: '4px solid rgba(255,92,0,0.6)',
        borderTop: '1px solid rgba(255,92,0,0.3)',
        borderBottom: '1px solid rgba(255,92,0,0.15)',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        backdropFilter: 'blur(40px)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 32px rgba(255,92,0,0.08)',
      }}
    >
      {/* Accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1"
        style={{
          background: 'linear-gradient(90deg, rgba(255,92,0,0.8), rgba(204,255,0,0.5), rgba(255,92,0,0.4), transparent)',
        }}
      />

      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none"
        style={{ background: 'radial-gradient(circle at top right, rgba(255,92,0,0.1) 0%, transparent 70%)' }} />

      <div className="relative z-10 p-4 sm:p-6 md:p-8 lg:p-10 flex flex-col gap-6">
        {/* Top row: Avatar + greeting */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <motion.div
              animate={{ boxShadow: ['0 0 0px rgba(255,92,0,0)', '0 0 24px rgba(255,92,0,0.4)', '0 0 0px rgba(255,92,0,0)'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-2xl sm:rounded-3xl flex items-center justify-center text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white overflow-hidden"
              style={{
                background: (user?.avatar_url || user?.profile_photo_url) ? 'transparent' : 'linear-gradient(135deg, rgba(255,92,0,0.3), rgba(255,92,0,0.1))',
                border: (user?.avatar_url || user?.profile_photo_url) ? 'none' : '2px solid rgba(255,92,0,0.5)',
              }}>
              {user?.avatar_url || user?.profile_photo_url ? (
                <img src={user.avatar_url || user.profile_photo_url} alt={displayName} className="w-full h-full object-cover" style={{ background: 'transparent' }} />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(255,92,0,0.3), rgba(255,92,0,0.1))' }}>
                  {initials}
                </div>
              )}
            </motion.div>
            {/* KYC dot */}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center"
              style={{ background: isVerified ? '#10b981' : '#f59e0b', border: '2px solid rgba(8,14,30,1)' }}>
              {isVerified
                ? <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                : <AlertCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />}
            </div>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <div className="text-xs sm:text-sm md:text-base font-mono text-white/30 uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-1.5 sm:mb-2">{greeting}</div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-white leading-none tracking-tight mb-2 sm:mb-3">
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
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {isVerified ? (
                <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[11px] font-bold font-mono"
                  style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.35)', color: '#10b981' }}>
                  <ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> <span className="hidden xs:inline">KYC </span>Verified
                </div>
              ) : (
                <button onClick={() => {}}
                  className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[11px] font-bold font-mono transition-all hover:scale-105"
                  style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.35)', color: '#f59e0b' }}>
                  <AlertCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> <span className="hidden xs:inline">Unverified — </span>Verify Now
                </button>
              )}

              {/* Live clock */}
              <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[11px] font-mono text-white/30"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                {time.toUTCString().slice(17, 25)} UTC
              </div>
            </div>
          </div>
        </div>

        {/* Bottom row: Motivational Quote (hidden on mobile, visible on lg+) */}
        <div className="hidden lg:flex flex-col justify-center flex-1 pl-6 border-l" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <span className="text-[9px] sm:text-[10px] font-mono text-white/25 uppercase tracking-widest mb-2 block">Daily Quote</span>
          <p className="text-xs sm:text-sm md:text-base font-medium text-white/80 leading-relaxed italic line-clamp-2">
            "{dailyQuote}"
          </p>
        </div>
      </div>
    </motion.div>

    {/* Professional Promotion Banner */}
    {activePromotion && (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="relative rounded-xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(255,122,0,0.08) 0%, rgba(255,122,0,0.04) 100%)',
          border: '1px solid rgba(255,122,0,0.25)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Accent glow line */}
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,122,0,0.8), transparent)' }} />
        
        {/* Background gradient orb */}
        <div className="absolute right-0 top-0 w-40 h-40 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(255,122,0,0.05) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
        
        <div className="relative z-10 px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <div className="text-[9px] sm:text-[11px] md:text-xs font-mono text-white/40 uppercase tracking-[0.12em] sm:tracking-[0.15em] mb-1">{activePromotion.tag || '🎯 OFFER'}</div>
            <h3 className="text-base sm:text-lg md:text-xl font-black text-white mb-0.5 sm:mb-1 line-clamp-2">
              {activePromotion.title}
              {activePromotion.discount_percent > 0 && (
                <span style={{ color: '#FF7A00' }}> {activePromotion.discount_percent}%</span>
              )}
            </h3>
            <p className="text-xs sm:text-sm md:text-base text-white/60 line-clamp-2">{activePromotion.description}</p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => activePromotion.cta_url && window.open(activePromotion.cta_url)}
            className="relative px-5 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 rounded-lg font-bold text-white text-xs sm:text-sm md:text-base whitespace-nowrap flex-shrink-0 overflow-hidden cursor-pointer w-full sm:w-auto"
            style={{
              background: 'linear-gradient(135deg, rgba(255,122,0,0.3), rgba(255,122,0,0.1))',
              border: '1px solid rgba(255,122,0,0.4)',
              boxShadow: '0 4px 16px rgba(255,122,0,0.2)',
            }}
          >
            <span className="relative z-10">{activePromotion.cta_text || 'Learn More'}</span>
          </motion.button>
        </div>
      </motion.div>
    )}
    </div>
  );
}