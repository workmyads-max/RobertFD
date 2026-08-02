import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FirstTimePromoBanner from '@/components/dashboard/FirstTimePromoBanner';
import B2G1PromoBanner from '@/components/dashboard/B2G1PromoBanner';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const SLIDE_DURATION = 6500;

/**
 * Auto-sliding carousel that rotates between the First-Time Discount banner
 * and the Buy 2 Get 1 Free banner. Renders each banner as-is (original design)
 * and cross-fades between them on a timer.
 */
export default function PromoCarousel({ onStartChallenge }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // Check which promos are active so we only rotate between visible ones
  const { data: promoSettings = [] } = useQuery({
    queryKey: ['promo-settings-carousel'],
    queryFn: () => base44.entities.PromotionSettings.filter({ setting_key: 'global' }),
    staleTime: 60000,
  });
  const firstTimeActive = promoSettings[0]?.is_first_time_discount_active !== false;

  const { data: b2g1Settings } = useQuery({
    queryKey: ['b2g1-promo-settings-carousel'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getB2G1PromoSettings', {});
      return res?.settings || res?.data?.settings || null;
    },
    staleTime: 60000,
  });
  const b2g1Enabled = b2g1Settings?.b2g1_enabled === true;

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

  if (slides.length === 0) return null;

  // Single banner — no carousel needed, just render it directly
  if (slides.length === 1) {
    return slides[0] === 'first_time'
      ? <FirstTimePromoBanner onStartChallenge={onStartChallenge} />
      : <B2G1PromoBanner onStartChallenge={onStartChallenge} />;
  }

  const current = slides[index];

  return (
    <div
      className="relative mb-8"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence mode="wait">
        {current === 'first_time' ? (
          <motion.div
            key="first_time"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <FirstTimePromoBanner onStartChallenge={onStartChallenge} />
          </motion.div>
        ) : (
          <motion.div
            key="b2g1"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <B2G1PromoBanner onStartChallenge={onStartChallenge} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slide indicators */}
      <div className="flex items-center justify-center gap-2 -mt-4 mb-2">
        {slides.map((s, i) => (
          <button
            key={s}
            onClick={() => goToSlide(i)}
            className="transition-all duration-300"
            style={{
              width: i === index ? 24 : 8,
              height: 4,
              borderRadius: 2,
              background: i === index ? '#FF5C00' : 'rgba(255,255,255,0.2)',
            }}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}