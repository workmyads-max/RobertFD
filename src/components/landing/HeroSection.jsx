import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp, Users, DollarSign, BarChart3 } from 'lucide-react';
import LivePriceTicker from './LivePriceTicker';

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
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function HeroSection({ heroImage }) {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-24 pb-12">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={heroImage} alt="Trading floor" className="w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background" />
      </div>

      {/* Decorative large text */}
      <div className="absolute top-1/3 left-0 right-0 text-center pointer-events-none select-none">
        <span className="text-[15vw] font-black text-foreground/[0.02] leading-none tracking-tighter font-mono">
          ROBERT FUNDS
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

      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
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
                  Robert Funds — Singapore
                </span>
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[0.95] tracking-tight mb-6">
                Trade Bigger.
                <br />
                Scale Faster.{' '}
                <br />
                <span className="gradient-text">Powered by Robert Funds.</span>
              </h1>

              <p className="text-lg text-muted-foreground max-w-lg mb-10 leading-relaxed">
                An institutional-grade Singapore-based proprietary trading firm built for
                the next generation of global traders. Access up to $200K in funded capital.
              </p>

              <div className="flex flex-wrap gap-4 mb-12">
                <a
                  href="#challenge"
                  className="relative inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-white bg-primary rounded-full hover:bg-primary/90 transition-all group glow-orange"
                >
                  Start Challenge
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </a>
                <a
                  href="#instant-funding"
                  className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-foreground border border-border rounded-full hover:border-primary/50 transition-all"
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
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
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

          {/* Right - Floating Cards */}
          <div className="relative hidden lg:block">
            <FloatingCard delay={0.3} className="glass rounded-2xl p-6 animate-float">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-mono text-muted-foreground">BTC/USD</span>
                <span className="text-xs text-accent font-mono">+2.34%</span>
              </div>
              {/* Mini chart SVG */}
              <svg viewBox="0 0 200 60" className="w-full h-16 mb-4">
                <polyline
                  fill="none"
                  stroke="hsl(22, 100%, 50%)"
                  strokeWidth="2"
                  points="0,50 20,45 40,48 60,30 80,35 100,20 120,25 140,15 160,18 180,10 200,8"
                />
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(22, 100%, 50%)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="hsl(22, 100%, 50%)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polygon
                  fill="url(#chartGrad)"
                  points="0,50 20,45 40,48 60,30 80,35 100,20 120,25 140,15 160,18 180,10 200,8 200,60 0,60"
                />
              </svg>
              <div className="flex justify-between text-sm">
                <span className="text-foreground font-semibold">$67,842.30</span>
                <span className="text-accent font-mono text-xs">LIVE</span>
              </div>
            </FloatingCard>

            <FloatingCard delay={0.5} className="glass rounded-2xl p-4 absolute -bottom-4 -left-8 w-64 animate-float-delayed">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Payout Approved</div>
                  <div className="text-sm font-semibold text-foreground">+$12,400.00</div>
                </div>
              </div>
            </FloatingCard>

            <FloatingCard delay={0.7} className="glass rounded-2xl p-4 absolute top-4 -right-4 w-56 animate-float-slow">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Account Funded</div>
                  <div className="text-sm font-semibold text-foreground">$100,000</div>
                </div>
              </div>
            </FloatingCard>
          </div>
        </div>
      </div>

      <LivePriceTicker />
    </section>
  );
}