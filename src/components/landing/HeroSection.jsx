import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp, Users, DollarSign, BarChart3 } from 'lucide-react';

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
          ALPHA
        </span>
      </div>

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
                  Singapore-Based Global Prop Firm
                </span>
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[0.95] tracking-tight mb-6">
                Trade Without
                <br />
                Limits.{' '}
                <span className="gradient-text">Get Funded</span>
                <br />
                Instantly.
              </h1>

              <p className="text-lg text-muted-foreground max-w-lg mb-10 leading-relaxed">
                Join the next-generation Singapore-based prop trading firm trusted by
                ambitious traders worldwide. Access up to $200K in funded capital.
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

      {/* Bottom Ticker */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-border/30 py-3 overflow-hidden">
        <div className="ticker-scroll flex items-center gap-12 whitespace-nowrap">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center gap-12">
              <span className="text-xs font-mono text-muted-foreground">BTC/USD <span className="text-accent">$67,842</span></span>
              <span className="text-xs font-mono text-muted-foreground">ETH/USD <span className="text-accent">$3,421</span></span>
              <span className="text-xs font-mono text-muted-foreground">EUR/USD <span className="text-primary">1.0847</span></span>
              <span className="text-xs font-mono text-muted-foreground">GBP/USD <span className="text-primary">1.2634</span></span>
              <span className="text-xs font-mono text-muted-foreground">XAU/USD <span className="text-accent">$2,342</span></span>
              <span className="text-xs font-mono text-muted-foreground">SPX500 <span className="text-accent">5,218</span></span>
              <span className="text-xs font-mono text-muted-foreground">NAS100 <span className="text-primary">18,421</span></span>
              <span className="text-xs font-mono text-muted-foreground">US30 <span className="text-accent">39,102</span></span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}