import React from 'react';
import { motion } from 'framer-motion';
import {
  Gift, ArrowRight, ShoppingCart, CreditCard, Shield, Zap, Star, Tag,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DEFAULT_B2G1_TIERS, formatSize } from '@/lib/b2g1Promo';

const ORANGE = '#ff6600';
const BG = '#0f0f0f';
const SUB = '#a0a0a0';

const FOOTER_BADGES = [
  { icon: Shield, label: 'No Extra Cost' },
  { icon: Zap, label: 'Instant Addition' },
  { icon: Star, label: 'Same Rules Apply' },
];

const STEPS = [
  { icon: ShoppingCart, label: 'Select 2 accounts of the same size' },
  { icon: CreditCard, label: 'Pay for both accounts only' },
  { icon: Gift, label: 'Get 1 smaller account FREE' },
];

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
  const badgeText = settings?.b2g1_badge_text || 'LIMITED OFFER';
  const headline = settings?.b2g1_headline || 'BUY 2 CHALLENGES, GET 1 FREE';
  const subline = settings?.b2g1_subline || 'Buy two challenges of the same size and automatically receive a third, smaller account on us — added to your order at no cost.';
  const ctaLabel = settings?.b2g1_cta_label || 'Shop Challenges';

  // Split headline to color the "GET 1 FREE" part orange
  const [headBefore, headAfter] = headline.split(/, ?/i);
  const headRest = headline.substring(headBefore.length).replace(/^,\s*/, '');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="relative rounded-xl overflow-hidden mb-8"
      style={{ background: BG, border: `1px solid ${ORANGE}` }}
    >
      <div className="grid lg:grid-cols-2 gap-0">
        {/* ───────── LEFT SECTION ───────── */}
        <div className="p-7 lg:p-9 flex flex-col">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 w-fit mb-5" style={{ border: `1px solid ${ORANGE}` }}>
            <Tag className="w-3 h-3" style={{ color: ORANGE }} />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: ORANGE }}>
              {badgeText}
            </span>
          </div>

          {/* Headline */}
          <h2 className="text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight mb-3">
            {headBefore}
            {headRest && <>, <span style={{ color: ORANGE }}>{headRest}</span></>}
          </h2>

          {/* Description */}
          <p className="text-sm mb-7 leading-relaxed" style={{ color: SUB, maxWidth: 460 }}>
            {subline}
          </p>

          {/* Tier rows */}
          <div className="mb-7" style={{ borderTop: `1px solid rgba(255,255,255,0.06)`, borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
            {tiers.map((t, i) => (
              <div
                key={i}
                className="flex items-center gap-3 py-2.5"
                style={{ borderBottom: i < tiers.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
              >
                <span className="text-[10px] font-mono font-bold text-white/40 px-1.5 py-0.5" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>2×</span>
                <span className="text-sm font-bold text-white tabular">{formatSize(t.buy_size)}</span>
                <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: ORANGE }} />
                <span className="text-[10px] font-mono font-bold uppercase" style={{ color: ORANGE }}>FREE</span>
                <span className="text-sm font-bold tabular" style={{ color: ORANGE }}>{formatSize(t.free_size)}</span>
                <CreditCard className="w-3.5 h-3.5 text-white/15 ml-auto" />
              </div>
            ))}
          </div>

          {/* Main CTA */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={onStartChallenge}
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: ORANGE }}
          >
            <ShoppingCart className="w-4 h-4" />
            {ctaLabel}
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>

        {/* ───────── RIGHT SECTION ───────── */}
        <div
          className="relative hidden lg:flex flex-col p-7 lg:p-9"
          style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', background: 'linear-gradient(180deg, rgba(255,102,0,0.04), transparent 60%)' }}
        >
          {/* Promo ribbon */}
          <div
            className="absolute top-0 right-0 z-10"
            style={{ background: ORANGE, transform: 'translate(18px, 14px) rotate(8deg)' }}
          >
            <span className="block px-5 py-1.5 text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap">PROMO</span>
          </div>

          {/* Header */}
          <div className="flex items-center gap-2 mb-6">
            <Gift className="w-4 h-4" style={{ color: ORANGE }} />
            <span className="text-xs font-bold text-white uppercase tracking-widest">How It Works</span>
          </div>

          {/* Steps + 3D box visual */}
          <div className="flex-1 flex gap-6">
            {/* Steps */}
            <div className="flex flex-col justify-between flex-1 py-1">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={i} className="relative flex items-center gap-3">
                    <div
                      className="w-8 h-8 flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(255,102,0,0.08)', border: `1px solid rgba(255,102,0,0.3)` }}
                    >
                      <Icon className="w-3.5 h-3.5" style={{ color: ORANGE }} />
                    </div>
                    <span className="text-[12px] font-medium text-white/80">{s.label}</span>
                    {i < STEPS.length - 1 && (
                      <div
                        className="absolute left-[15px] -bottom-6 w-px h-6"
                        style={{ backgroundImage: `linear-gradient(to bottom, ${ORANGE} 50%, transparent 50%)`, backgroundSize: '1px 6px' }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* 3D box graphic */}
            <div className="hidden xl:flex items-center justify-center w-[150px]">
              <BoxGraphic />
            </div>
          </div>

          {/* Status box */}
          <div
            className="flex items-center gap-2.5 px-3.5 py-3 mb-4 mt-6"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <Shield className="w-3.5 h-3.5 flex-shrink-0" style={{ color: ORANGE }} />
            <span className="text-[11px] text-white/70">Added automatically to your order. No coupon needed.</span>
          </div>

          {/* Secondary CTA */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={onStartChallenge}
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: ORANGE }}
          >
            <Gift className="w-4 h-4" />
            Claim Your Free Account
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* ───────── FOOTER ───────── */}
      <div
        className="flex items-center justify-center gap-8 px-6 py-3 flex-wrap"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.3)' }}
      >
        {FOOTER_BADGES.map((b, i) => {
          const Icon = b.icon;
          return (
            <div key={i} className="flex items-center gap-2">
              <Icon className="w-3.5 h-3.5" style={{ color: ORANGE }} />
              <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: SUB }}>{b.label}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

/** CSS-based 3D box with cards popping out — glowing orange edges. */
function BoxGraphic() {
  return (
    <div className="relative w-[130px] h-[120px]">
      {/* Cards popping out */}
      <div
        className="absolute left-1 top-2 w-9 h-12 flex items-center justify-center"
        style={{
          background: '#1a1a1a',
          border: `1px solid ${ORANGE}`,
          transform: 'rotate(-12deg)',
          boxShadow: '0 0 12px rgba(255,102,0,0.25)',
        }}
      >
        <span className="text-[7px] font-bold text-white/60 leading-tight text-center">ACCOUNT<br/>1</span>
      </div>
      <div
        className="absolute right-1 top-2 w-9 h-12 flex items-center justify-center"
        style={{
          background: '#1a1a1a',
          border: `1px solid ${ORANGE}`,
          transform: 'rotate(12deg)',
          boxShadow: '0 0 12px rgba(255,102,0,0.25)',
        }}
      >
        <span className="text-[7px] font-bold text-white/60 leading-tight text-center">ACCOUNT<br/>2</span>
      </div>
      <div
        className="absolute left-1/2 -translate-x-1/2 top-0 w-10 h-14 flex flex-col items-center justify-center gap-1 z-10"
        style={{
          background: ORANGE,
          transform: 'translateX(-50%)',
          boxShadow: '0 0 18px rgba(255,102,0,0.5)',
        }}
      >
        <Gift className="w-4 h-4 text-white" />
        <span className="text-[7px] font-bold text-white leading-tight text-center">FREE<br/>ACCOUNT</span>
      </div>

      {/* Open box */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[110px] h-[55px]"
        style={{
          background: 'linear-gradient(180deg, #1a1a1a, #0a0a0a)',
          border: `1px solid ${ORANGE}`,
          boxShadow: '0 0 16px rgba(255,102,0,0.2)',
          clipPath: 'polygon(8% 0, 92% 0, 100% 100%, 0 100%)',
        }}
      />
    </div>
  );
}