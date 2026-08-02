import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { DEFAULT_B2G1_TIERS, formatSize } from '@/lib/b2g1Promo';

export default function Buy2Get1Popup() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await base44.functions.invoke('getB2G1PromoSettings', {});
        const s = res?.settings || res?.data?.settings;
        if (!cancelled && s) setSettings(s);
      } catch {
        if (!cancelled) setSettings(null);
      }
    })();
    return () => { cancelled = true; };
  }, []);

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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-[100] bg-black/85"
          />
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[101] flex items-center justify-center px-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto relative w-full max-w-md"
              style={{
                background: '#0a0a0b',
                border: '1px solid #1f1f22',
              }}
            >
              {/* Top bar — flat label, no pill */}
              <div className="flex items-center justify-between px-5 h-11 border-b" style={{ borderColor: '#1a1a1d' }}>
                <span className="text-[10px] font-mono text-[#FF5C00] uppercase tracking-[0.2em]">
                  {settings?.b2g1_badge_text || 'LIMITED OFFER'}
                </span>
                <button onClick={handleClose}
                  className="w-7 h-7 flex items-center justify-center text-[#52525b] hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="px-5 py-7">
                {/* Headline — no icon, just type */}
                <div className="mb-1 text-[10px] font-mono text-[#52525b] uppercase tracking-[0.25em]">
                  Promotion
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight leading-[1.15] mb-3">
                  {settings?.b2g1_headline || 'BUY 2 CHALLENGES, GET 1 FREE'}
                </h2>
                <p className="text-[13px] text-[#71717a] leading-relaxed mb-6">
                  {settings?.b2g1_subline || 'Buy two challenges of the same size and automatically receive a third, smaller account on us — added to your order at no cost.'}
                </p>

                {/* Tier table — flat rows, not pills */}
                <div className="border-t border-b mb-7" style={{ borderColor: '#1a1a1d' }}>
                  {tiers.map((t, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2.5 text-[13px]"
                      style={{ borderBottom: i < tiers.length - 1 ? '1px solid #141416' : 'none' }}
                    >
                      <span className="font-mono text-[#a1a1aa]">
                        2× {formatSize(t.buy_size)}
                      </span>
                      <ArrowRight className="w-3 h-3 text-[#3f3f46]" />
                      <span className="font-bold text-[#FF5C00]">
                        {formatSize(t.free_size)} FREE
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA — solid, flat */}
                <button
                  onClick={handleCTA}
                  className="w-full h-11 text-[13px] font-bold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                  style={{ background: '#FF5C00' }}
                >
                  {settings?.b2g1_cta_label || 'Shop Challenges'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button onClick={handleClose}
                  className="w-full text-center text-[11px] text-[#52525b] hover:text-[#a1a1aa] transition-colors mt-3">
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