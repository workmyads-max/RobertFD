import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_B2G1_TIERS, formatSize } from '@/lib/b2g1Promo';

const SLIDE_DURATION = 6500;

export default function PromoCarousel({ className = '', onShopChallenges }) {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [paused, setPaused] = useState(false);

  const { data: promoSettings = [] } = useQuery({
    queryKey: ['promo-settings-carousel'],
    queryFn: () => base44.entities.PromotionSettings.filter({ setting_key: 'global' }),
    staleTime: 60000,
  });
  const settings = promoSettings[0];
  const firstTimeActive = settings?.is_first_time_discount_active !== false;
  const discountPercent = settings?.first_time_discount_percent ?? 10;
  const discountCode = settings?.first_time_discount_code || 'NEW25';

  const { data: b2g1Settings } = useQuery({
    queryKey: ['b2g1-promo-settings-carousel'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getB2G1PromoSettings', {});
      return res?.settings || res?.data?.settings || null;
    },
    staleTime: 60000,
  });
  const b2g1Enabled = b2g1Settings?.b2g1_enabled === true;
  const b2g1Tiers = b2g1Settings?.b2g1_tier_mapping?.length ? b2g1Settings.b2g1_tier_mapping : DEFAULT_B2G1_TIERS;

  const slides = [];
  if (firstTimeActive) slides.push('first_time');
  if (b2g1Enabled) slides.push('b2g1');

  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % slides.length);
    }, SLIDE_DURATION);
    return () => clearInterval(timer);
  }, [slides.length, paused]);

  useEffect(() => {
    if (index >= slides.length) setIndex(0);
  }, [slides.length, index]);

  const goToSlide = useCallback((i) => setIndex(i), []);

  const copyCode = async () => {
    await navigator.clipboard.writeText(discountCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCTA = () => {
    if (onShopChallenges) onShopChallenges();
    else navigate('/register');
  };

  if (slides.length === 0) return null;

  const current = slides[index];

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: '#0d0d0e', border: '1px solid #1f1f22' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slide viewport */}
      <div className="relative">
        <AnimatePresence mode="wait">
          {current === 'first_time' && (
            <motion.div
              key="first_time"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="grid md:grid-cols-2"
            >
              {/* Left: copy + coupon */}
              <div className="p-6 md:p-8 md:border-r" style={{ borderColor: '#1a1a1d' }}>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-[10px] font-mono text-[#52525b] uppercase tracking-[0.2em]">Limited Time</span>
                  <span className="w-1 h-1 bg-[#3f3f46]" />
                  <span className="text-[10px] font-mono text-[#FF5C00] uppercase tracking-[0.2em]">New Users</span>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-[1.15] mb-2">
                  Your First Challenge, {discountPercent}% Off
                </h3>
                <p className="text-[13px] text-[#71717a] leading-relaxed mb-5 max-w-md">
                  Applies to all challenges from $5K to $200K. New users only — one redemption per account.
                </p>
                {/* Coupon */}
                <div className="inline-flex items-center" style={{ border: '1px solid #27272a' }}>
                  <div className="flex items-center gap-2 px-4 h-10">
                    <span className="text-[10px] font-mono text-[#52525b] uppercase tracking-[0.15em]">Code</span>
                    <span className="text-sm font-mono font-bold text-white tracking-wider">{discountCode}</span>
                  </div>
                  <button
                    onClick={copyCode}
                    className="h-10 px-4 flex items-center gap-1.5 text-[12px] font-medium text-white transition-opacity hover:opacity-90"
                    style={{ background: '#FF5C00', borderLeft: '1px solid #27272a' }}
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Right: terms + CTA */}
              <div className="p-6 md:p-8" style={{ background: '#0a0a0b' }}>
                <div className="text-[10px] font-mono text-[#52525b] uppercase tracking-[0.2em] mb-4">Terms</div>
                <ul className="space-y-2.5 mb-6">
                  {[
                    'New registered users only',
                    'One-time use per account',
                    `Up to $50K account size eligible`,
                    'Cannot combine with other offers',
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-2.5">
                      <span className="w-1 h-1 mt-[7px] bg-[#FF5C00] flex-shrink-0" />
                      <span className="text-[12px] text-[#a1a1aa] leading-relaxed">{t}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={handleCTA}
                  className="inline-flex items-center gap-2 h-10 px-5 text-[13px] font-bold text-white transition-opacity hover:opacity-90"
                  style={{ background: '#FF5C00' }}
                >
                  Claim Your Discount
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}

          {current === 'b2g1' && (
            <motion.div
              key="b2g1"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="grid md:grid-cols-2"
            >
              {/* Left: copy + tier grid */}
              <div className="p-6 md:p-8 md:border-r" style={{ borderColor: '#1a1a1d' }}>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-[10px] font-mono text-[#52525b] uppercase tracking-[0.2em]">Limited Time</span>
                  <span className="w-1 h-1 bg-[#3f3f46]" />
                  <span className="text-[10px] font-mono text-[#FF5C00] uppercase tracking-[0.2em]">Promo</span>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-[1.15] mb-2">
                  Buy 2 Challenges, Get 1 Free
                </h3>
                <p className="text-[13px] text-[#71717a] leading-relaxed mb-5 max-w-md">
                  Buy two challenges of the same size and automatically receive a third, smaller account on us — added to your order at no cost.
                </p>
                {/* Tier grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-px" style={{ background: '#1a1a1d', border: '1px solid #1a1a1d' }}>
                  {b2g1Tiers.map((t, i) => (
                    <div key={i} className="p-3 text-center" style={{ background: '#0a0a0b' }}>
                      <div className="text-[9px] font-mono text-[#52525b] uppercase tracking-[0.15em] mb-1">Buy 2×</div>
                      <div className="text-[13px] font-bold text-white mb-2">{formatSize(t.buy_size)}</div>
                      <div className="text-[9px] font-mono text-[#52525b] uppercase tracking-[0.15em] mb-1">Get Free</div>
                      <div className="text-[13px] font-bold text-[#FF5C00]">{formatSize(t.free_size)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: how it works + CTA */}
              <div className="p-6 md:p-8" style={{ background: '#0a0a0b' }}>
                <div className="text-[10px] font-mono text-[#52525b] uppercase tracking-[0.2em] mb-4">How It Works</div>
                <ol className="space-y-3 mb-6">
                  {[
                    'Select quantity 2 on a challenge card',
                    'Pay for both accounts at checkout',
                    'Receive 1 smaller account — free, automatically',
                  ].map((t, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-5 h-5 flex items-center justify-center text-[10px] font-mono font-bold text-[#FF5C00] flex-shrink-0"
                        style={{ border: '1px solid #FF5C00' }}>
                        {i + 1}
                      </span>
                      <span className="text-[12px] text-[#a1a1aa] leading-relaxed pt-0.5">{t}</span>
                    </li>
                  ))}
                </ol>
                <button
                  onClick={handleCTA}
                  className="inline-flex items-center gap-2 h-10 px-5 text-[13px] font-bold text-white transition-opacity hover:opacity-90"
                  style={{ background: '#FF5C00' }}
                >
                  Shop Challenges
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Slide indicators */}
      {slides.length > 1 && (
        <div className="flex items-center justify-center gap-2 py-3" style={{ borderTop: '1px solid #1a1a1d' }}>
          {slides.map((s, i) => (
            <button
              key={s}
              onClick={() => goToSlide(i)}
              className="transition-all"
              style={{
                width: i === index ? 24 : 8,
                height: 4,
                background: i === index ? '#FF5C00' : '#3f3f46',
              }}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}