import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, AlertCircle, Zap, Globe, MessageCircle, Send, ArrowRight } from 'lucide-react';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import DiscordCommunityBanner from './DiscordCommunityBanner';

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
        style={{ background: 'linear-gradient(90deg, rgba(255,92,0,0.6) 0%, rgba(255,92,0,0.15) 40%, transparent 100%)' }}
      />

      {/* Subtle warm ambient in bottom-right */}
      <div className="absolute bottom-0 right-0 w-64 h-40 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at bottom right, rgba(255,92,0,0.06) 0%, transparent 65%)' }} />

      <div className="relative z-10 px-6 py-5 sm:px-8 sm:py-6 flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-7">

        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-bold text-white overflow-hidden"
            style={{
              background: (user?.avatar_url || user?.profile_photo_url)
                ? 'transparent'
                : 'linear-gradient(145deg, rgba(255,92,0,0.22) 0%, rgba(255,92,0,0.08) 100%)',
              border: '2px solid rgba(255,92,0,0.3)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            }}>
            {user?.avatar_url || user?.profile_photo_url ? (
              <img src={user.avatar_url || user.profile_photo_url} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <span className="font-semibold tracking-wide" style={{ color: 'rgba(255,140,60,0.9)' }}>{initials}</span>
            )}
          </div>
          {/* KYC dot */}
          <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center"
            style={{
              background: isVerified ? '#059669' : '#d97706',
              border: '3px solid rgba(14,18,28,1)',
              boxShadow: isVerified ? '0 0 8px rgba(5,150,105,0.5)' : '0 0 8px rgba(217,119,6,0.5)',
            }}>
            {isVerified
              ? <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
              : <AlertCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />}
          </div>
        </div>

        {/* Text block */}
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-semibold text-white/40 uppercase tracking-[0.2em] mb-1.5">{greeting}</p>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight tracking-tight mb-4">
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
          <div className="flex items-center gap-2 flex-wrap">
            {isVerified ? (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium"
                style={{ background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.2)', color: '#34d399' }}>
                <ShieldCheck className="w-3 h-3" /> KYC Verified
              </div>
            ) : (
              <button onClick={() => {}}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-opacity hover:opacity-80"
                style={{ background: 'rgba(217,119,6,0.1)', border: '1px solid rgba(217,119,6,0.25)', color: '#fbbf24' }}>
                <AlertCircle className="w-3 h-3" /> Verify Identity
              </button>
            )}

            {/* Live clock */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }}>
              {time.toUTCString().slice(17, 25)} UTC
            </div>
          </div>
        </div>

        {/* Discord Community Banner - right side, lg+ only */}
        <div className="hidden lg:flex flex-shrink-0 pl-7" style={{ borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
        <DiscordCommunityBanner discordUrl={social.discord_enabled ? social.discord_url : null} />
        </div>

      </div>

      {/* Discord Community Banner - mobile only (below header) */}
      <div className="lg:hidden px-6 pb-5 sm:px-8">
        <DiscordCommunityBanner discordUrl={social.discord_enabled ? social.discord_url : null} />
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