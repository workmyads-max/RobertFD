import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp, Users, DollarSign, BarChart3 } from 'lucide-react';
import LivePriceTicker from './LivePriceTicker';
import ShaderBackground from '@/components/ui/shader-background';

const stats = [
  { label: 'Traders Worldwide', value: 14202, prefix: '', suffix: '+', icon: Users },
  { label: 'Total Payouts', value: 742, prefix: '$', suffix: 'M+', icon: DollarSign },
  { label: 'Funded Accounts', value: 8450, prefix: '', suffix: '+', icon: TrendingUp },
  { label: 'Daily Volume', value: 2.4, prefix: '$', suffix: 'B+', icon: BarChart3 },
];

function AnimatedCounter({ value, prefix, suffix }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(current);
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);

  const displayValue = value >= 100 ? Math.floor(count).toLocaleString() : count.toFixed(1);
  return <span className="font-mono">{prefix}{displayValue}{suffix}</span>;
}

function FloatingCard({ children, className, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, rotateX: 18, y: 40 }}
      animate={{ opacity: 1, scale: 1, rotateX: 0, y: 0 }}
      transition={{
        duration: 1.1,
        delay,
        ease: [0.22, 1, 0.36, 1],
        opacity: { duration: 0.6, delay },
      }}
      whileHover={{
        scale: 1.04,
        y: -6,
        boxShadow: '0 0 32px rgba(255,92,0,0.25), 0 8px 40px rgba(0,0,0,0.5)',
        transition: { duration: 0.25 },
      }}
      style={{ transformPerspective: 800 }}
      className={className}
    >
      {/* Funded-firm shimmer sweep on mount */}
      <motion.div
        initial={{ x: '-100%', opacity: 0.6 }}
        animate={{ x: '200%', opacity: 0 }}
        transition={{ duration: 1.2, delay: delay + 0.3, ease: 'easeOut' }}
        className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden"
        style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(255,92,0,0.18) 50%, transparent 60%)' }}
      />
      {children}
    </motion.div>
  );
}

export default function HeroSection({ heroImage }) {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-24 pb-12">
      {/* Background */}
      <div className="absolute inset-0">
        <ShaderBackground opacity={0.18} />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/80" />
      </div>

      {/* Decorative large text */}
      <div className="absolute top-1/3 left-0 right-0 text-center pointer-events-none select-none">
        <span className="text-[15vw] font-black text-foreground/[0.02] leading-none tracking-tighter font-mono">
          XFUNDED TRADER
        </span>
      </div>

      {/* Rocket background decoration */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.4, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="absolute right-[5%] top-[8%] pointer-events-none select-none hidden lg:block"
        style={{ zIndex: 1 }}
      >
        <motion.div
          animate={{ y: [0, -18, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg width="180" height="320" viewBox="0 0 180 320" fill="none" xmlns="http://www.w3.org/2000/svg"
            style={{ filter: 'drop-shadow(0 0 24px rgba(255,92,0,0.35)) drop-shadow(0 0 60px rgba(255,92,0,0.12))' }}>
            {/* Rocket body */}
            <path d="M90 10 C60 10, 30 60, 28 160 L152 160 C150 60, 120 10, 90 10Z"
              fill="url(#rocketBody)" opacity="0.9" />
            {/* Rocket nose cone */}
            <path d="M90 10 C75 10, 60 30, 55 60 L125 60 C120 30, 105 10, 90 10Z"
              fill="url(#rocketNose)" opacity="0.95" />
            {/* Window */}
            <circle cx="90" cy="100" r="18" fill="none" stroke="rgba(255,92,0,0.6)" strokeWidth="2" />
            <circle cx="90" cy="100" r="12" fill="rgba(255,92,0,0.12)" />
            <circle cx="90" cy="100" r="6" fill="rgba(255,92,0,0.3)" />
            {/* Left fin */}
            <path d="M28 160 L5 220 L42 185Z" fill="url(#finGrad)" opacity="0.8" />
            {/* Right fin */}
            <path d="M152 160 L175 220 L138 185Z" fill="url(#finGrad)" opacity="0.8" />
            {/* Engine nozzle */}
            <rect x="72" y="158" width="36" height="18" rx="4" fill="rgba(20,12,4,0.9)" stroke="rgba(255,92,0,0.3)" strokeWidth="1" />
            {/* Flame outer */}
            <motion.path
              d="M72 176 Q65 210, 90 230 Q115 210, 108 176Z"
              fill="url(#flameOuter)"
              style={{ transformOrigin: '90px 176px' }}
              animate={{ scaleY: [1, 1.2, 0.85, 1.15, 1], scaleX: [1, 0.9, 1.1, 0.95, 1], opacity: [0.9, 1, 0.7, 1, 0.9] }}
              transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Flame inner */}
            <motion.path
              d="M80 176 Q76 205, 90 218 Q104 205, 100 176Z"
              fill="url(#flameInner)"
              style={{ transformOrigin: '90px 176px' }}
              animate={{ scaleY: [1, 1.3, 0.8, 1.2, 1], opacity: [1, 0.8, 1, 0.85, 1] }}
              transition={{ duration: 0.45, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Flame core */}
            <motion.ellipse cx="90" cy="188" rx="6" ry="10"
              fill="white" opacity="0.8"
              animate={{ ry: [10, 14, 8, 12, 10], opacity: [0.8, 1, 0.6, 0.9, 0.8] }}
              transition={{ duration: 0.35, repeat: Infinity }}
            />
            {/* Highlight stripe */}
            <path d="M82 30 Q86 20, 90 18 L90 140 Q87 140, 82 135Z" fill="rgba(255,255,255,0.07)" />
            {/* Body detail lines */}
            <line x1="50" y1="120" x2="130" y2="120" stroke="rgba(255,92,0,0.15)" strokeWidth="1" />
            <line x1="45" y1="140" x2="135" y2="140" stroke="rgba(255,92,0,0.1)" strokeWidth="1" />

            <defs>
              <linearGradient id="rocketBody" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#1a0a02" />
                <stop offset="40%" stopColor="#2d1506" />
                <stop offset="100%" stopColor="#0e0704" />
              </linearGradient>
              <linearGradient id="rocketNose" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FF5C00" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#FF8A3D" stopOpacity="0.4" />
              </linearGradient>
              <linearGradient id="finGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FF5C00" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#1a0a02" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="flameOuter" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF5C00" stopOpacity="0.95" />
                <stop offset="60%" stopColor="#FF8A3D" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#FF5C00" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="flameInner" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFCC00" stopOpacity="0.9" />
                <stop offset="60%" stopColor="#FF8A3D" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#FF5C00" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>
        {/* Glow beneath rocket */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-24 h-8 rounded-full blur-xl"
          style={{ background: 'rgba(255,92,0,0.25)' }} />
      </motion.div>

      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Left Content */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-light mb-8">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <span className="text-xs font-mono text-muted-foreground tracking-wider uppercase">
                  XFunded Trader — Dubai
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[0.95] tracking-tight mb-6">
                Trade Bigger.
                <br />
                Scale Faster.
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground max-w-lg mb-10 leading-relaxed">
                An institutional-grade Dubai-based proprietary trading firm built for
                the next generation of global traders. Access up to $200K in funded capital.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-12">
                <a
                  href="/challenges"
                  className="relative inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-semibold text-white bg-primary rounded-full hover:bg-primary/90 transition-all group glow-orange"
                >
                  Start Challenge
                  <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </a>
                <a
                  href="/challenges?type=instant"
                  className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-semibold text-foreground border border-border rounded-full hover:border-primary/50 transition-all"
                >
                  Get Instant Funding
                </a>
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
            >
              {stats.map((stat, i) => (
                <div key={stat.label} className="text-center lg:text-left">
                  <div className="text-2xl md:text-3xl font-bold text-foreground">
                    <AnimatedCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 font-mono uppercase tracking-wider">
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right - Funded Performance Graph */}
          <div className="relative hidden lg:block">
            <FloatingCard delay={0.3} className="glass rounded-2xl p-6 animate-float">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="text-xs font-mono text-muted-foreground mb-0.5">FUNDED ACCOUNT</div>
                  <div className="text-sm font-bold text-foreground">Performance Growth</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-primary">$184,250</div>
                  <div className="text-xs text-accent font-mono">+84.25%</div>
                </div>
              </div>

              {/* Animated Performance Graph */}
              <div className="relative h-32 mb-4">
                <svg viewBox="0 0 280 120" className="w-full h-full">
                  {/* Grid lines */}
                  <defs>
                    <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF5C00" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#FF5C00" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="glowGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#FF5C00" />
                      <stop offset="50%" stopColor="#FF8A3D" />
                      <stop offset="100%" stopColor="#CCFF00" />
                    </linearGradient>
                  </defs>

                  {/* Background grid */}
                  {[20, 40, 60, 80, 100].map(y => (
                    <line key={y} x1="0" y1={y} x2="280" y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                  ))}

                  {/* Animated growth curve */}
                  <motion.polyline
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 2.5, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    fill="none"
                    stroke="url(#glowGrad)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="0,110 30,105 60,95 90,88 120,75 150,68 180,52 210,42 240,28 270,18"
                    style={{ filter: 'drop-shadow(0 0 8px rgba(255,92,0,0.6))' }}
                  />

                  {/* Fill area under curve */}
                  <motion.polygon
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 2.5, delay: 0.5 }}
                    fill="url(#perfGrad)"
                    points="0,110 30,105 60,95 90,88 120,75 150,68 180,52 210,42 240,28 270,18 270,120 0,120"
                  />

                  {/* Animated data points */}
                  {[
                    { x: 30, y: 105, delay: 0.7 },
                    { x: 90, y: 88, delay: 1.0 },
                    { x: 150, y: 68, delay: 1.3 },
                    { x: 210, y: 42, delay: 1.6 },
                    { x: 270, y: 18, delay: 1.9 },
                  ].map((point, i) => (
                    <motion.circle
                      key={i}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.4, delay: point.delay, ease: 'easeOut' }}
                      cx={point.x}
                      cy={point.y}
                      r="4"
                      fill="#FF5C00"
                      stroke="#FF8A3D"
                      strokeWidth="2"
                      style={{ filter: 'drop-shadow(0 0 6px rgba(255,92,0,0.8))' }}
                    />
                  ))}

                  {/* Pulsing endpoint */}
                  <motion.circle
                    cx="270"
                    cy="18"
                    r="8"
                    fill="rgba(255,92,0,0.2)"
                    stroke="#FF5C00"
                    strokeWidth="2"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0.3, 0.6] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </svg>

                {/* Floating profit badge */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 2.2 }}
                  className="absolute top-2 right-0 px-3 py-1.5 rounded-lg"
                  style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}
                >
                  <div className="text-[10px] font-mono text-emerald-400">+$84,250</div>
                </motion.div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="text-[10px] font-mono text-muted-foreground mb-0.5">Profit</div>
                  <div className="text-sm font-bold text-accent">+84%</div>
                </div>
                <div className="text-center p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="text-[10px] font-mono text-muted-foreground mb-0.5">Win Rate</div>
                  <div className="text-sm font-bold text-foreground">73%</div>
                </div>
                <div className="text-center p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="text-[10px] font-mono text-muted-foreground mb-0.5">Trades</div>
                  <div className="text-sm font-bold text-foreground">247</div>
                </div>
              </div>

              {/* Bottom info */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-mono text-muted-foreground">ACTIVE</span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">Phase 2 → Funded</span>
              </div>
            </FloatingCard>
          </div>
        </div>
      </div>

      <LivePriceTicker />
    </section>
  );
}