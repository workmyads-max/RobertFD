import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, TrendingUp, Zap, Monitor } from 'lucide-react';

const slides = [
  {
    id: 1,
    tag: 'Funded Trader Lifestyle',
    title: 'Trade Like a Professional',
    subtitle: 'Access institutional-grade capital and advanced analytics to maximize your trading potential.',
    icon: TrendingUp,
    features: ['Up to $200K Funded Capital', 'Advanced Analytics Dashboard', '80/20 Profit Split', 'Professional Risk Tools'],
  },
  {
    id: 2,
    tag: 'Instant Payouts',
    title: 'Get Paid. Every Day.',
    subtitle: 'Request daily payouts with our lightning-fast withdrawal system. No waiting periods.',
    icon: Zap,
    features: ['Daily Payout Requests', 'Instant Processing', 'Zero Hidden Fees', 'Premium Dashboard Access'],
  },
  {
    id: 3,
    tag: 'Multi-Platform',
    title: 'Trade Anywhere. Any Device.',
    subtitle: 'Access MT5, TradeLocker, and our proprietary web terminal from any device.',
    icon: Monitor,
    features: ['MetaTrader 5 (MT5)', 'TradeLocker Platform', 'Web Trading Terminal', 'Mobile Apps Coming Soon'],
  },
];

export default function SliderSection({ images }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const slide = slides[current];
  const Icon = slide.icon;

  return (
    <section id="how-it-works" className="relative py-32 overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <AnimatePresence mode="wait">
          <motion.img
            key={current}
            src={images[current]}
            alt=""
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 0.12, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="w-full h-full object-cover"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/70" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6">
        {/* Slide indicators */}
        <div className="flex items-center gap-3 mb-12">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setCurrent(i)}
              className={`h-1 rounded-full transition-all duration-500 ${
                i === current ? 'w-12 bg-primary' : 'w-6 bg-border'
              }`}
            />
          ))}
          <span className="ml-4 text-xs font-mono text-muted-foreground">
            {String(current + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
          </span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="grid lg:grid-cols-2 gap-16 items-center"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-light mb-6">
                <Icon className="w-4 h-4 text-primary" />
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                  {slide.tag}
                </span>
              </div>

              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6">
                {slide.title}
              </h2>

              <p className="text-lg text-muted-foreground mb-10 max-w-lg leading-relaxed">
                {slide.subtitle}
              </p>

              <div className="grid grid-cols-2 gap-4">
                {slide.features.map((feature, i) => (
                  <motion.div
                    key={feature}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="flex items-center gap-3 py-3"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="glass rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
                <img
                  src={images[current]}
                  alt={slide.tag}
                  className="w-full rounded-xl relative z-10"
                />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Nav arrows */}
        <div className="flex gap-3 mt-12">
          <button
            onClick={() => setCurrent((current - 1 + slides.length) % slides.length)}
            className="w-12 h-12 rounded-full border border-border flex items-center justify-center hover:border-primary/50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <button
            onClick={() => setCurrent((current + 1) % slides.length)}
            className="w-12 h-12 rounded-full border border-border flex items-center justify-center hover:border-primary/50 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </section>
  );
}