import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, ArrowRight, Sparkles, Star } from 'lucide-react';

export default function PromoPopup({ mascotImage }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const already = sessionStorage.getItem('promo_dismissed');
    if (!already) {
      const timer = setTimeout(() => setOpen(true), 2200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setOpen(false);
    sessionStorage.setItem('promo_dismissed', '1');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    try {
      await base44.integrations.Core.SendEmail({
        to: 'workmyads@gmail.com',
        subject: 'New Lead from Promo Popup',
        body: `New email signup from promo popup: ${email}`,
      });
    } catch (_) {}
    setSubmitted(true);
    setTimeout(handleClose, 2000);
  };

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
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm"
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
              className="pointer-events-auto relative w-full max-w-md rounded-3xl overflow-hidden"
              style={{
                background: 'linear-gradient(145deg, #0e0e10 0%, #13131a 100%)',
                border: '1px solid rgba(255, 92, 0, 0.25)',
                boxShadow: '0 0 60px rgba(255,92,0,0.15), 0 0 120px rgba(255,92,0,0.05), 0 30px 80px rgba(0,0,0,0.8)',
              }}
            >
              {/* Glow top */}
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-32 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

              {/* Close */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>

              {/* Top Badge */}
              <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 border border-primary/25">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-mono text-primary uppercase tracking-widest">Limited Offer</span>
              </div>

              <div className="px-8 pt-14 pb-8">
                {/* Mascot + Stars */}
                <div className="flex justify-center mb-6 relative">
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="relative"
                  >
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary/30 glow-orange-sm">
                      <img
                        src={mascotImage}
                        alt="Robert Wealth mascot"
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                    {/* Stars around */}
                    {[
                      { top: '-8px', left: '-10px', delay: 0 },
                      { top: '-12px', right: '-6px', delay: 0.4 },
                      { bottom: '0', right: '-14px', delay: 0.8 },
                    ].map((pos, i) => (
                      <motion.div
                        key={i}
                        style={{ position: 'absolute', ...pos }}
                        animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                        transition={{ duration: 2, repeat: Infinity, delay: pos.delay }}
                      >
                        <Star className="w-4 h-4 text-primary fill-primary" />
                      </motion.div>
                    ))}
                  </motion.div>
                </div>

                <AnimatePresence mode="wait">
                  {!submitted ? (
                    <motion.div key="form" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      {/* Heading */}
                      <div className="text-center mb-6">
                        <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-2">
                          Join Thousands of{' '}
                          <span className="gradient-text">Traders</span>{' '}
                          Worldwide
                        </h2>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Get exclusive discounts, payout updates, and early access offers - directly to your inbox.
                        </p>
                      </div>

                      {/* Trust pills */}
                      <div className="flex flex-wrap justify-center gap-2 mb-6">
                        {['14,000+ Traders', '$742M+ Paid Out', 'No Spam Ever'].map((t) => (
                          <span key={t} className="px-3 py-1 text-[11px] font-mono text-muted-foreground glass-light rounded-full border border-border/40">
                            {t}
                          </span>
                        ))}
                      </div>

                      {/* Form */}
                      <form onSubmit={handleSubmit} className="space-y-3">
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email address"
                            className="w-full pl-11 pr-4 py-4 rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border/50 focus:border-primary/50 transition-colors"
                            style={{ background: 'rgba(255,255,255,0.04)' }}
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full py-4 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary/90 transition-all glow-orange-sm flex items-center justify-center gap-2 group"
                        >
                          <Sparkles className="w-4 h-4" />
                          Get Exclusive Access
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </form>

                      <button onClick={handleClose} className="w-full text-center text-xs text-muted-foreground mt-3 hover:text-foreground transition-colors py-2">
                        No thanks, I'll pay full price
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-4"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                        className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4"
                      >
                        <Sparkles className="w-8 h-8 text-accent" />
                      </motion.div>
                      <h3 className="text-xl font-black mb-2">You're In! 🎉</h3>
                      <p className="text-sm text-muted-foreground">Check your inbox for your exclusive discount.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}