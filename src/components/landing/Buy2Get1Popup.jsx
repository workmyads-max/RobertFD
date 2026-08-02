import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Gift, Shield, TrendingUp, Award, DollarSign, Lock, Headphones, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { DEFAULT_B2G1_TIERS, formatSize } from '@/lib/b2g1Promo';

const VALUE_PROPS = [
  { icon: Shield,     title: 'Trade With Confidence', sub: 'Professional environment' },
  { icon: TrendingUp, title: 'Higher Capital',       sub: 'Scale with more capital' },
  { icon: Award,      title: 'Fair Rules',            sub: 'Transparent process' },
  { icon: DollarSign, title: 'Payouts Up To 90%',     sub: 'Keep more of what you earn' },
];

const TRUST_MARKERS = [
  { icon: Lock,       label: 'Secure Payments' },
  { icon: Headphones, label: '24/7 Support' },
  { icon: Users,      label: 'Trusted Worldwide' },
];

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

    let timer;
    const check = () => {
      const emailPopupActive = !sessionStorage.getItem('promo_dismissed');
      if (emailPopupActive) {
        timer = setTimeout(check, 500);
        return;
      }
      timer = setTimeout(() => setOpen(true), 800);
    };
    timer = setTimeout(check, 3000);
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
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[101] flex items-center justify-center px-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-lg"
              style={{ background: '#08080a', border: '1px solid #1f1f22' }}
            >
              {/* Subtle radial gradient accent */}
              <div
                className="absolute top-0 left-0 right-0 h-52 pointer-events-none rounded-t-lg"
                style={{ background: 'radial-gradient(ellipse 80% 100% at center top, rgba(255,92,0,0.14), transparent 70%)' }}
              />

              {/* Header */}
              <div className="relative flex items-center justify-between px-5 h-12 border-b" style={{ borderColor: '#1a1a1d' }}>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black text-white tracking-tight">XFUNDED</span>
                  <span className="text-sm font-light text-[#52525b] tracking-tight">TRADER</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-black"
                    style={{ background: '#FF5C00' }}
                  >
                    {settings?.b2g1_badge_text || 'Limited Offer'}
                  </span>
                  <button onClick={handleClose}
                    className="w-7 h-7 flex items-center justify-center text-[#52525b] hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Hero */}
              <div className="relative px-5 pt-7 pb-5 text-center">
                <div className="text-[9px] font-mono text-[#52525b] uppercase tracking-[0.3em] mb-3">
                  {settings?.b2g1_headline ? 'Promotion' : 'Promotion'}
                </div>
                <h2 className="text-3xl font-black text-white tracking-tight leading-none mb-1.5">
                  BUY TWO
                </h2>
                <div className="text-[10px] font-medium text-[#71717a] uppercase tracking-[0.2em] mb-2.5">
                  Funded Challenge Accounts
                </div>
                <h2 className="text-3xl font-black tracking-tight leading-none mb-3" style={{ color: '#FF5C00' }}>
                  GET ONE FREE
                </h2>
                <p className="text-[11px] text-[#52525b] leading-relaxed max-w-[280px] mx-auto">
                  Double your opportunity. Triple your potential.
                </p>
              </div>

              {/* Offer grid */}
              <div className="relative px-5 mb-5">
                <div className="border-t border-b" style={{ borderColor: '#1a1a1d' }}>
                  {tiers.map((t, i) => (
                    <div
                      key={i}
                      className="flex items-center py-2.5"
                      style={{ borderBottom: i < tiers.length - 1 ? '1px solid #141416' : 'none' }}
                    >
                      <div className="flex-1 flex items-center gap-2">
                        <Gift className="w-3.5 h-3.5 text-[#3f3f46]" />
                        <span className="text-[11px] font-mono text-[#a1a1aa]">
                          BUY TWO {formatSize(t.buy_size)}
                        </span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 mx-2 flex-shrink-0" style={{ color: '#FF5C00' }} />
                      <div className="flex-1 text-right">
                        <span className="text-[11px] font-bold" style={{ color: '#FF5C00' }}>
                          {formatSize(t.free_size)} FREE
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Value props */}
              <div className="relative px-5 mb-5">
                <div className="grid grid-cols-2 gap-2">
                  {VALUE_PROPS.map((vp, i) => {
                    const Icon = vp.icon;
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg"
                        style={{ background: '#0e0e10', border: '1px solid #1a1a1d' }}
                      >
                        <div
                          className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(255,92,0,0.08)', border: '1px solid rgba(255,92,0,0.15)' }}
                        >
                          <Icon className="w-3.5 h-3.5" style={{ color: '#FF5C00' }} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10px] font-bold text-white truncate">{vp.title}</div>
                          <div className="text-[8px] text-[#52525b] truncate">{vp.sub}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CTA */}
              <div className="relative px-5 mb-4">
                <button
                  onClick={handleCTA}
                  className="w-full h-12 text-[13px] font-bold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90 rounded-lg"
                  style={{ background: '#FF5C00' }}
                >
                  {settings?.b2g1_cta_label || 'GRAB THIS LIMITED OFFER NOW'}
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={handleClose}
                  className="w-full text-center text-[10px] text-[#52525b] hover:text-[#a1a1aa] transition-colors mt-2.5">
                  No thanks, maybe later
                </button>
              </div>

              {/* Footer */}
              <div
                className="relative px-5 py-3 border-t"
                style={{ borderColor: '#1a1a1d', background: '#060607' }}
              >
                <div className="flex items-center justify-center gap-4 mb-2">
                  {TRUST_MARKERS.map((tm, i) => {
                    const Icon = tm.icon;
                    return (
                      <div key={i} className="flex items-center gap-1.5">
                        <Icon className="w-3 h-3 text-[#52525b]" />
                        <span className="text-[9px] text-[#52525b] font-medium">{tm.label}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="text-center text-[8px] text-[#3f3f46] uppercase tracking-wider">
                  Offer valid for a limited time only. Terms and conditions apply.
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}