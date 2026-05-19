import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, TrendingUp, Zap, Monitor, DollarSign, Award, BarChart3, Shield, Lock, Flame, Zap as ZapIcon } from 'lucide-react';

function DashboardSlide() {
  return (
    <div className="glass rounded-2xl overflow-hidden relative h-full">
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(255,92,0,0.08)' }} />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(204,255,0,0.06)' }} />
      </div>

      <div className="relative z-10 p-5 h-full flex flex-col">
        {/* Window chrome */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex gap-1.5">
            <motion.div className="w-2.5 h-2.5 rounded-full" style={{ background: '#ef4444' }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }} />
            <motion.div className="w-2.5 h-2.5 rounded-full" style={{ background: '#eab308' }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.2 }} />
            <motion.div className="w-2.5 h-2.5 rounded-full" style={{ background: '#10b981' }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.4 }} />
          </div>
          <span className="flex-1 text-center text-[10px] font-mono text-muted-foreground">Professional Dashboard</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Balance', value: '$100,000', Icon: DollarSign, color: '#FF5C00' },
            { label: 'Today P&L', value: '+$4,280', Icon: TrendingUp, color: '#10b981' },
            { label: 'Win Rate', value: '74.6%', Icon: Award, color: '#CCFF00' },
          ].map(({ label, value, Icon, color }, idx) => (
            <motion.div key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="rounded-xl p-2.5 group/stat hover:scale-105 transition-transform"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,92,0,0.02))',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-mono text-muted-foreground uppercase">{label}</span>
                <motion.div whileHover={{ scale: 1.15, rotate: 10 }}>
                  <Icon className="w-3 h-3" style={{ color }} />
                </motion.div>
              </div>
              <motion.div className="text-xs font-black" style={{ color }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity, delay: idx * 0.2 }}>
                {value}
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Chart */}
        <motion.div className="rounded-xl p-3 mb-3" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-foreground">Equity Curve</span>
            <motion.span className="text-[10px] font-mono" style={{ color: '#00f5a0' }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}>
              +4.28%
            </motion.span>
          </div>
          <svg viewBox="0 0 300 60" className="w-full h-10">
            <defs>
              <linearGradient id="dashGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF5C00" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#FF5C00" stopOpacity="0" />
              </linearGradient>
            </defs>
            <motion.polyline fill="none" stroke="#FF5C00" strokeWidth="2"
              points="0,50 25,46 50,44 75,38 100,40 125,30 150,28 175,20 200,24 225,16 250,12 275,10 300,6"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, ease: 'easeInOut' }} />
            <polygon fill="url(#dashGrad2)"
              points="0,50 25,46 50,44 75,38 100,40 125,30 150,28 175,20 200,24 225,16 250,12 275,10 300,6 300,60 0,60" />
          </svg>
        </motion.div>

        {/* Progress */}
        <motion.div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-foreground">Challenge Progress</span>
            <motion.span className="text-[10px] font-mono" style={{ color: '#FF5C00' }}
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}>
              Phase 1
            </motion.span>
          </div>
          {[
            { label: 'Profit Target', pct: 43, color: '#FF5C00' },
            { label: 'Drawdown Used', pct: 24, color: '#00f5a0' },
          ].map((p) => (
            <div key={p.label} className="mb-2 last:mb-0">
              <div className="flex justify-between text-[9px] font-mono mb-1">
                <span className="text-muted-foreground">{p.label}</span>
                <motion.span style={{ color: p.color }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}>
                  {p.pct}%
                </motion.span>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden border border-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${p.pct}%` }}
                  transition={{ duration: 1.5, ease: 'easeOut', delay: 0.2 }}
                  className="h-full rounded-full"
                  style={{
                    background: p.color,
                    boxShadow: `0 0 10px ${p.color}80`,
                  }} />
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

function RiskShieldSlide() {
  return (
    <div className="glass rounded-2xl overflow-hidden relative h-full">
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(204,255,0,0.06)' }} />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(255,92,0,0.08)' }} />
      </div>

      <div className="relative z-10 p-6 h-full flex flex-col">
        <div className="flex items-center gap-2 mb-6">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(239,68,68,0.5)' }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(234,179,8,0.5)' }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(16,185,129,0.5)' }} />
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">Risk Shield</span>
        </div>

        {/* Animated Shield */}
        <div className="flex-1 flex items-center justify-center mb-4">
          <motion.div className="relative w-32 h-32"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
            {/* Outer glow rings */}
            <motion.div className="absolute inset-0 rounded-3xl border-2"
              style={{ borderColor: 'rgba(0,245,160,0.3)' }}
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 3, repeat: Infinity }} />
            <motion.div className="absolute inset-3 rounded-2xl border"
              style={{ borderColor: 'rgba(255,92,0,0.3)' }}
              animate={{ scale: [1.1, 1, 1.1] }}
              transition={{ duration: 3, repeat: Infinity, delay: 0.1 }} />

            {/* Shield center */}
            <div className="absolute inset-0 rounded-3xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(0,245,160,0.15), rgba(255,92,0,0.08))',
                border: '2px solid rgba(0,245,160,0.4)',
                boxShadow: '0 0 30px rgba(0,245,160,0.2), inset 0 0 30px rgba(0,245,160,0.1)',
              }}>
              <Shield className="w-14 h-14" style={{ color: '#00f5a0' }} />
            </div>
          </motion.div>
        </div>

        {/* Protection Features */}
        <div className="space-y-2">
          {[
            { icon: Lock, label: 'Account Protection', color: '#00f5a0' },
            { icon: Flame, label: 'Stop Loss Enforcement', color: '#FF5C00' },
            { icon: ZapIcon, label: 'Auto Risk Limits', color: '#CCFF00' },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div key={item.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-center gap-3 p-2.5 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Icon className="w-4 h-4 flex-shrink-0" style={{ color: item.color }} />
                <span className="text-xs font-medium text-foreground">{item.label}</span>
                <motion.div className="w-1 h-1 rounded-full ml-auto" style={{ color: '#00f5a0' }}
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }} />
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PlatformSlide({ image }) {
  return (
    <div className="glass rounded-2xl overflow-hidden relative h-full">
      {/* Animated luxury background */}
      <div className="absolute inset-0">
        {/* Rotating gradient rings */}
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(255,92,0,0.15), transparent 70%)' }} />
        </motion.div>
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        >
          <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(204,255,0,0.12), transparent 70%)' }} />
        </motion.div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,92,0,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,92,0,0.3) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }} />

        {/* Shimmer sweep effect */}
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(105deg, transparent 40%, rgba(255,92,0,0.12) 50%, transparent 60%)',
          }} />
      </div>

      {/* Platform showcase */}
      <div className="relative z-10 p-6 h-full flex flex-col">
        {/* Window chrome with animated dots */}
        <div className="flex items-center gap-2 mb-6">
        <div className="flex gap-1.5">
          {[
            { color: '#ef4444', delay: 0 },
            { color: '#eab308', delay: 0.2 },
            { color: '#10b981', delay: 0.4 },
          ].map((dot, i) => (
            <motion.div
              key={i}
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: dot.color }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, delay: dot.delay }}
            />
          ))}
        </div>
        <motion.span
          className="flex-1 text-center text-[10px] font-mono text-muted-foreground"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          Multi-Platform Trading
        </motion.span>
        </div>

        {/* 3D Platform Cards */}
        <div className="flex-1 flex flex-col justify-center gap-3 mb-6">
          {[
            { name: 'MetaTrader 5', icon: '📊', color: '#FF5C00', features: ['Advanced Charting', 'Expert Advisors', 'Mobile Trading'] },
            { name: 'TradeLocker', icon: '🔐', color: '#CCFF00', features: ['Risk Management', 'One-Click Trading', 'Real-Time Data'] },
            { name: 'Web Terminal', icon: '🌐', color: '#00f5a0', features: ['No Download', 'Instant Access', 'Full Features'] },
          ].map((platform, idx) => (
            <motion.div
              key={platform.name}
              initial={{ opacity: 0, x: -30, rotateY: -10 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{ duration: 0.7, delay: 0.3 + idx * 0.15, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{
                scale: 1.03,
                x: 8,
                boxShadow: '0 0 30px rgba(255,92,0,0.3), 0 8px 40px rgba(0,0,0,0.4)',
                transition: { duration: 0.25 },
              }}
              className="relative group"
              style={{ perspective: '800px' }}
            >
              {/* Card glow on hover */}
              <motion.div
                className="absolute -inset-0.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: `linear-gradient(135deg, ${platform.color}40, ${platform.color}10)`,
                  filter: 'blur(8px)',
                }}
              />

              {/* Card content */}
              <div
                className="relative rounded-xl p-4 flex items-center gap-4 overflow-hidden"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${platform.color}30`,
                }}
              >
                {/* Animated icon background */}
                <motion.div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${platform.color}20, ${platform.color}05)`,
                    border: `1px solid ${platform.color}40`,
                  }}
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, delay: idx * 0.3 }}
                >
                  {platform.icon}
                </motion.div>

                {/* Platform info */}
                <div className="flex-1 min-w-0">
                  <motion.div
                    className="text-sm font-bold text-foreground mb-0.5"
                    animate={{ x: [0, 2, 0] }}
                    transition={{ duration: 3, repeat: Infinity, delay: idx * 0.2 }}
                  >
                    {platform.name}
                  </motion.div>
                  <div className="flex gap-1.5">
                    {platform.features.slice(0, 2).map((feature, i) => (
                      <motion.span
                        key={feature}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6 + idx * 0.15 + i * 0.05 }}
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                        style={{
                          background: `${platform.color}15`,
                          color: platform.color,
                          border: `1px solid ${platform.color}25`,
                        }}
                      >
                        {feature}
                      </motion.span>
                    ))}
                  </div>
                </div>

                {/* Animated status indicator */}
                <motion.div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: platform.color }}
                  animate={{
                    scale: [1, 1.4, 1],
                    opacity: [0.7, 1, 0.7],
                  }}
                  transition={{ duration: 2, repeat: Infinity, delay: idx * 0.3 }}
                />
              </div>

              {/* Sweep effect on card */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 + idx * 0.5, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-xl pointer-events-none overflow-hidden"
                style={{
                  background: `linear-gradient(105deg, transparent 40%, ${platform.color}20 50%, transparent 60%)`,
                }}
              />
            </motion.div>
          ))}
        </div>

        {/* Bottom stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="rounded-xl p-3"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Platforms', value: '3+', color: '#FF5C00' },
              { label: 'Uptime', value: '99.9%', color: '#00f5a0' },
              { label: 'Latency', value: '<50ms', color: '#CCFF00' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1 + i * 0.1 }}
              >
                <motion.div
                  className="text-lg font-black"
                  style={{ color: stat.color }}
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                >
                  {stat.value}
                </motion.div>
                <div className="text-[9px] font-mono text-muted-foreground mt-0.5">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

const slides = [
  {
    id: 1,
    tag: 'Funded Trader Experience',
    title: 'Your Professional Trading Command Center',
    subtitle: 'Access institutional-grade capital and real-time analytics to maximize your trading potential.',
    icon: TrendingUp,
    features: ['Up to $200K Funded Capital', 'Advanced Analytics Dashboard', '80/20 Profit Split', 'Real-Time Challenge Tracking'],
    preview: 'dashboard',
  },
  {
    id: 2,
    tag: 'Risk Management',
    title: 'Capital Protection At Every Step',
    subtitle: 'Advanced account protection with automatic stop-loss enforcement and AI-powered risk limits to safeguard your capital.',
    icon: Shield,
    features: ['Automatic Stop-Loss', 'AI Risk Detection', 'Account Safeguards', 'Real-Time Alerts'],
    preview: 'risk',
  },
  {
    id: 3,
    tag: 'Multi-Platform',
    title: 'Trade Anywhere. Any Device.',
    subtitle: 'Access MT5, TradeLocker, and our proprietary web terminal seamlessly.',
    icon: Monitor,
    features: ['MetaTrader 5 (MT5)', 'TradeLocker Platform', 'Web Trading Terminal', 'Mobile Apps Coming Soon'],
    preview: 'platform',
  },
];

export default function SliderSection({ images }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const slide = slides[current];
  const Icon = slide.icon;

  const renderPreview = () => {
    if (slide.preview === 'dashboard') return <DashboardSlide />;
    if (slide.preview === 'risk') return <RiskShieldSlide />;
    return <PlatformSlide image={images[2]} />;
  };

  return (
    <section id="how-it-works" className="relative py-32 overflow-hidden">
      <div className="absolute inset-0">
        <AnimatePresence mode="wait">
          <motion.img key={current} src={images[current]} alt=""
            initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 0.08, scale: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 1 }} className="w-full h-full object-cover" />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/60" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6">
        <div className="flex items-center gap-3 mb-12">
          {slides.map((s, i) => (
            <button key={s.id} onClick={() => setCurrent(i)}
              className={`h-1 rounded-full transition-all duration-500 ${i === current ? 'w-12 bg-primary' : 'w-6 bg-border'}`} />
          ))}
          <span className="ml-4 text-xs font-mono text-muted-foreground">
            {String(current + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
          </span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={current}
            initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="grid lg:grid-cols-2 gap-16 items-center"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-light mb-6">
                <Icon className="w-4 h-4 text-primary" />
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{slide.tag}</span>
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-5xl font-black tracking-tight mb-6">{slide.title}</h2>
              <p className="text-lg text-muted-foreground mb-10 max-w-lg leading-relaxed">{slide.subtitle}</p>
              <div className="grid grid-cols-2 gap-3">
                {slide.features.map((feature, i) => (
                  <motion.div key={feature} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="flex items-center gap-2.5 py-2.5 px-3 rounded-xl"
                    style={{ background: 'rgba(255,92,0,0.05)', border: '1px solid rgba(255,92,0,0.12)' }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="absolute -inset-4 rounded-3xl blur-2xl opacity-30"
                style={{ background: 'radial-gradient(ellipse, rgba(255,92,0,0.15), transparent)' }} />
              <div className="relative">{renderPreview()}</div>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-3 mt-12">
          <button onClick={() => setCurrent((current - 1 + slides.length) % slides.length)}
            className="w-12 h-12 rounded-full border border-border flex items-center justify-center hover:border-primary/50 transition-colors">
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <button onClick={() => setCurrent((current + 1) % slides.length)}
            className="w-12 h-12 rounded-full border border-border flex items-center justify-center hover:border-primary/50 transition-colors">
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </section>
  );
}