import React from 'react';
import { motion } from 'framer-motion';
import { Gift, ArrowRight, Check } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DEFAULT_B2G1_TIERS, formatSize } from '@/lib/b2g1Promo';

/**
 * Buy 2 Get 1 Free — dashboard promo banner.
 * Same visual weight/placement as FirstTimePromoBanner.
 * Shows when admin has enabled the B2G1 promo.
 */
export default function B2G1PromoBanner({ onStartChallenge }) {
  const { data: settings } = useQuery({
    queryKey: ['b2g1-promo-settings'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getB2G1PromoSettings', {});
      return res?.settings || res?.data?.settings || null;
    },
    staleTime: 60000,
  });

  if (!settings?.b2g1_enabled) return null;

  const tiers = settings?.b2g1_tier_mapping?.length ? settings.b2g1_tier_mapping : DEFAULT_B2G1_TIERS;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="relative rounded-2xl overflow-hidden mb-8"
      style={{
        background: '#141416',
        border: '1px solid rgba(255,92,0,0.25)',
      }}
    >
      <div className="grid lg:grid-cols-2 gap-0">
        {/* Left Content */}
        <div className="p-8 lg:p-10 flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center justify-center px-4 py-1.5 rounded-full mb-5 w-fit"
            style={{ background: '#FF5C00' }}
          >
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">
              {settings?.b2g1_badge_text || 'LIMITED OFFER'}
            </span>
          </motion.div>

          <h2 className="text-3xl lg:text-4xl font-black text-white mb-3 tracking-tight leading-tight">
            {settings?.b2g1_headline || 'BUY 2 CHALLENGES, GET 1 FREE'}
          </h2>

          <p className="text-sm text-[#B0B0B0] mb-8 leading-relaxed">
            {settings?.b2g1_subline || 'Buy two challenges of the same size and automatically receive a third, smaller account on us. Added to your order at no cost.'}
          </p>

          {/* Tier mapping */}
          <div className="space-y-2 mb-8">
            {tiers.map((t, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-white/40">2×</span>
                  <span className="text-sm font-bold text-white">{formatSize(t.buy_size)}</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] font-mono text-primary font-bold">FREE</span>
                <span className="text-sm font-bold text-primary">{formatSize(t.free_size)}</span>
              </div>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onStartChallenge}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold text-white transition-all"
            style={{
              background: '#FF5C00',
              boxShadow: '0 4px 15px rgba(255,92,0,0.4)',
            }}
          >
            {settings?.b2g1_cta_label || 'Shop Challenges'}
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Right Card */}
        <div className="relative hidden lg:flex items-center justify-center p-8 lg:p-10">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="relative w-full max-w-md rounded-2xl overflow-hidden p-6"
            style={{
              background: '#CCFF00',
              boxShadow: '0 20px 60px rgba(204,255,0,0.3)',
            }}
          >
            {/* Promo Ribbon */}
            <div
              className="absolute -top-2 -right-2 z-10 shadow-xl overflow-visible"
              style={{
                background: '#FF4500',
                transform: 'translateX(8px) translateY(8px) rotate(12deg)',
              }}
            >
              <span className="block px-6 py-3 text-[10px] font-black text-white uppercase tracking-wider whitespace-nowrap">PROMO</span>
            </div>

            {/* Gift Icon */}
            <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(0,0,0,0.1)' }}>
              <Gift className="w-5 h-5 text-black" />
            </div>

            {/* Headline */}
            <h3 className="text-lg font-bold text-black mb-4 leading-snug">How It Works</h3>

            {/* Separator */}
            <div className="h-px mb-4" style={{ background: 'rgba(0,0,0,0.15)' }} />

            {/* Checklist */}
            <div className="space-y-2.5 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,0,0,0.1)' }}>
                  <Check className="w-3 h-3 text-black" strokeWidth={3} />
                </div>
                <span className="text-sm font-medium text-black">Select 2 accounts of the same size</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,0,0,0.1)' }}>
                  <Check className="w-3 h-3 text-black" strokeWidth={3} />
                </div>
                <span className="text-sm font-medium text-black">Pay for both accounts only</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,0,0,0.1)' }}>
                  <Check className="w-3 h-3 text-black" strokeWidth={3} />
                </div>
                <span className="text-sm font-medium text-black">Get 1 smaller account FREE</span>
              </div>
            </div>

            {/* CTA */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onStartChallenge}
              className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all"
              style={{
                background: '#FF4500',
                boxShadow: '0 4px 15px rgba(255,69,0,0.4)',
              }}
            >
              Claim Your Free Account →
            </motion.button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}