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

  return (
    <div className="space-y-4">
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

      <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">

        {/* Left: Avatar + greeting */}
        <div className="flex items-center gap-6">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <motion.div
              animate={{ boxShadow: ['0 0 0px rgba(255,92,0,0)', '0 0 24px rgba(255,92,0,0.4)', '0 0 0px rgba(255,92,0,0)'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="w-20 h-20 md:w-28 md:h-28 rounded-3xl flex items-center justify-center text-2xl md:text-4xl font-black text-white overflow-hidden"
              style={{
                background: (user?.avatar_url || user?.profile_photo_url) ? 'transparent' : 'linear-gradient(135deg, rgba(255,92,0,0.3), rgba(255,92,0,0.1))',
                border: (user?.avatar_url || user?.profile_photo_url) ? 'none' : '2px solid rgba(255,92,0,0.5)',
              }}>
              {user?.avatar_url || user?.profile_photo_url ? (
                <img src={user.avatar_url || user.profile_photo_url} alt={displayName} className="w-full h-full object-cover" style={{ background: 'transparent' }} />
              ) : (
                initials
              )}
            </motion.div>
            {/* KYC dot */}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: isVerified ? '#10b981' : '#f59e0b', border: '2px solid rgba(8,14,30,1)' }}>
              {isVerified
                ? <ShieldCheck className="w-3.5 h-3.5 text-white" />
                : <AlertCircle className="w-3.5 h-3.5 text-white" />}
            </div>
          </div>

          {/* Text */}
          <div className="flex-1">
            <div className="text-sm md:text-base font-mono text-white/30 uppercase tracking-[0.2em] mb-2">{greeting}</div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-none tracking-tight mb-3">
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
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold font-mono"
                  style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.35)', color: '#10b981' }}>
                  <ShieldCheck className="w-3 h-3" /> KYC Verified
                </div>
              ) : (
                <button onClick={() => {}}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold font-mono transition-all hover:scale-105"
                  style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.35)', color: '#f59e0b' }}>
                  <AlertCircle className="w-3 h-3" /> Unverified — Verify Now
                </button>
              )}

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono"
                style={{ background: 'rgba(255,92,0,0.1)', border: '1px solid rgba(255,92,0,0.25)', color: '#FF5C00' }}>
                <Zap className="w-3 h-3" /> Funded Trader
              </div>

              {/* Live clock */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono text-white/30"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                {time.toUTCString().slice(17, 25)} UTC
              </div>
            </div>
          </div>
        </div>

        {/* Right: Start New Challenge Button */}
        <motion.button
          onClick={onStartChallenge}
          whileHover={{ scale: 1.06, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className="relative inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-3xl font-bold text-white text-base group overflow-hidden"
          style={{
            backgroundImage: 'url(https://media.base44.com/images/public/69ff44f98e27baf8957d0676/1a106290d_generated_image.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            boxShadow: '0 0 40px rgba(100, 220, 255, 0.4), 0 0 60px rgba(150, 100, 255, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
            border: '2.5px solid rgba(100, 220, 255, 0.5)',
          }}>
          {/* Holographic shimmer overlay */}
          <motion.div
            className="absolute inset-0 rounded-3xl"
            animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              background: 'linear-gradient(-45deg, transparent 0%, rgba(150, 255, 220, 0.15) 25%, rgba(100, 220, 255, 0.1) 50%, rgba(180, 100, 255, 0.15) 75%, transparent 100%)',
              backgroundSize: '200% 200%',
              pointerEvents: 'none',
            }}
          />
          
          {/* Pulsing glow effect */}
          <motion.div
            className="absolute inset-0 rounded-3xl"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3.5, repeat: Infinity }}
            style={{
              background: 'radial-gradient(circle at center, rgba(100, 220, 255, 0.25), transparent 60%)',
              filter: 'blur(16px)',
              pointerEvents: 'none',
            }}
          />

          <span className="relative z-10">Start New Challenge</span>
          <motion.div
            animate={{ x: [0, 4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="relative z-10">
            <ArrowRight className="w-5 h-5" />
          </motion.div>
        </motion.button>
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
        
        <div className="relative z-10 px-6 md:px-8 py-5 md:py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="text-[11px] md:text-xs font-mono text-white/40 uppercase tracking-[0.15em] mb-1.5">{activePromotion.tag || '🎯 OFFER'}</div>
            <h3 className="text-lg md:text-xl font-black text-white mb-1">
              {activePromotion.title}
              {activePromotion.discount_percent > 0 && (
                <span style={{ color: '#FF7A00' }}> {activePromotion.discount_percent}%</span>
              )}
            </h3>
            <p className="text-sm md:text-base text-white/60">{activePromotion.description}</p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => activePromotion.cta_url && window.open(activePromotion.cta_url)}
            className="relative px-6 md:px-8 py-2.5 md:py-3 rounded-lg font-bold text-white text-sm md:text-base whitespace-nowrap flex-shrink-0 overflow-hidden cursor-pointer"
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