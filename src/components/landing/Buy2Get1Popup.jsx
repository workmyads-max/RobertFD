import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { DEFAULT_B2G1_TIERS, formatSize } from '@/lib/b2g1Promo';

/**
 * Buy 2 Challenges, Get 1 FREE — promotional popup.
 * Appears once per session on the public home page.
 * Settings are admin-controlled via PromotionSettings entity (setting_key: 'b2g1_promo').
 */
export default function Buy2Get1Popup() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(null);
  const navigate = useNavigate();

  // Fetch promo settings (public backend function — works for unauthenticated visitors)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await base44.functions.invoke('getB2G1PromoSettings', {});
        const s = res?.settings || res?.data?.settings;
        if (!cancelled && s) setSettings(s);
      } catch {
        if (!cancelled) setSettings(null); // silently fail — popup just won't show
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Show popup after delay, once per session, only if promo is enabled
  useEffect(() => {
    if (!settings?.b2g1_enabled) return;
    const dismissed = sessionStorage.getItem('b2g1_promo_dismissed');
    if (dismissed) return;
    const timer = setTimeout(() => setOpen(true), 3000);
    return () => clearTimeout(timer);
  }, [settings?.b2g1_enabled]);

  const handleClose = () => {
    setOpen(false);
    sessionStorage.setItem('b2g1_promo_dismissed', '1');
  };

  const handleCTA = () => {
    handleClose();
    navigate('/register');
  };

  const tiers = settings?.b2g1_tier_mapping?.length ? settings.b2g1_tier_mapping : DEFAULT_B2G1_TIERS;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm"
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[101] flex items-center justify-center px-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto relative w-full max-w-lg rounded-3xl overflow-hidden"
              style={{
                background: 'linear-gradient(145deg, #0e0e10 0%, #151518 100%)',
                border: '1px solid rgba(255, 92, 0, 0.3)',
                boxShadow: '0 0 80px rgba(255,92,0,0.2), 0 0 160px rgba(255,92,0,0.06), 0 30px 80px rgba(0,0,0,0.9)',
              }}
            >
              {/* Glow accent */}
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-36 rounded-full blur-3xl pointer-events-none"
                style={{ background: 'rgba(255,92,0,0.15)' }} />

              {/* Close */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>

              {/* Ribbon badge */}
              <div className="absolute top-5 left-5 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(255,92,0,0.15)', border: '1px solid rgba(255,92,0,0.3)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-mono text-primary uppercase tracking-widest">
                  {settings?.b2g1_badge_text || 'LIMITED OFFER'}
                </span>
              </div>

              <div className="px-6 sm:px-10 pt-16 pb-8 text-center">
                {/* Gift icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -15 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', damping: 12, stiffness: 180, delay: 0.15 }}
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,92,0,0.2), rgba(255,122,47,0.1))',
                    border: '1px solid rgba(255,92,0,0.3)',
                  }}
                >
                  <Gift className="w-8 h-8 text-primary" />
                </motion.div>

                {/* Headline */}
                <motion.h2
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="text-2xl sm:text-4xl font-black tracking-tight mb-3 leading-[1.1]"
                >
                  <span style={{ color: '#FF5C00' }}>
                    {settings?.b2g1_headline || 'BUY 2 CHALLENGES, GET 1 FREE'}
                  </span>
                </motion.h2>

                {/* Subline */}
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-md mx-auto"
                >
                  {settings?.b2g1_subline || 'Buy two challenges of the same size and automatically receive a third, smaller account on us — added to your order at no cost.'}
                </motion.p>

                {/* Tier mapping visual */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="grid grid-cols-2 gap-2 mb-7"
                >
                  {tiers.map((t, i) => (
                    <div key={i}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-muted-foreground">2×</span>
                        <span className="text-sm font-bold text-white">{formatSize(t.buy_size)}</span>
                      </div>
                      <ArrowRight className="w-3 h-3 text-primary" />
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-mono text-primary font-bold">FREE</span>
                        <span className="text-sm font-bold text-primary">{formatSize(t.free_size)}</span>
                      </div>
                    </div>
                  ))}
                </motion.div>

                {/* CTA */}
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 }}
                  onClick={handleCTA}
                  className="w-full py-4 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                  style={{
                    background: 'linear-gradient(90deg, #FF5C00, #FF7A2F)',
                    boxShadow: '0 4px 24px rgba(255,92,0,0.35)',
                  }}
                >
                  <Sparkles className="w-4 h-4" />
                  {settings?.b2g1_cta_label || 'Shop Challenges'}
                  <ArrowRight className="w-4 h-4" />
                </motion.button>

                {/* Dismiss link */}
                <button
                  onClick={handleClose}
                  className="w-full text-center text-xs text-muted-foreground mt-3 hover:text-foreground transition-colors py-2"
                >
                  No thanks, maybe later
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}