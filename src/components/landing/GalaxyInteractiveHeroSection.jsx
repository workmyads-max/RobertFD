"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Play } from 'lucide-react';

const Spline = lazy(() => import('@splinetool/react-spline'));

function HeroSplineBackground() {
  const splineContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={splineContainerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100vh',
        pointerEvents: 'auto',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100vh',
          pointerEvents: 'auto',
        }}
      >
        <Spline
          scene="https://prod.spline.design/us3ALejTXl6usHZ7/scene.splinecode"
        />
      </div>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100vh',
          background: `
            linear-gradient(to right, rgba(3, 3, 5, 0.85), transparent 30%, transparent 70%, rgba(3, 3, 5, 0.85)),
            linear-gradient(to bottom, transparent 40%, rgba(3, 3, 5, 0.95))
          `,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'bg-background/80 backdrop-blur-md py-3' : 'bg-transparent py-5'
      }`}
      style={{
        background: scrolled ? 'rgba(3, 3, 5, 0.8)' : 'transparent',
        backdropFilter: 'blur(12px)',
        borderRadius: '0 0 12px 12px',
      }}
    >
      <div className="max-w-[1400px] mx-auto px-6 flex items-center justify-between">
        <a href="#" className="text-2xl font-semibold text-foreground">
          XFunded
        </a>

        <div className="hidden lg:flex items-center gap-8">
          <a href="#challenge" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Challenges
          </a>
          <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            How It Works
          </a>
          <a href="#affiliate" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Affiliate
          </a>
          <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Pricing
          </a>
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <a
            href="/login"
            className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
            style={{
              background: 'transparent',
              border: '1px solid hsl(var(--border))',
              color: 'hsl(var(--foreground))',
            }}
          >
            Login
          </a>
          <a
            href="/challenges"
            className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
            style={{ background: 'hsl(var(--primary))' }}
          >
            Start Challenge
          </a>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden text-foreground p-2"
          aria-label="Toggle mobile menu"
        >
          {mobileOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-background border-t border-border p-6 space-y-4">
          <a href="#challenge" className="block text-sm text-muted-foreground hover:text-foreground">
            Challenges
          </a>
          <a href="#how-it-works" className="block text-sm text-muted-foreground hover:text-foreground">
            How It Works
          </a>
          <a href="#affiliate" className="block text-sm text-muted-foreground hover:text-foreground">
            Affiliate
          </a>
          <a href="#pricing" className="block text-sm text-muted-foreground hover:text-foreground">
            Pricing
          </a>
          <div className="pt-4 border-t border-border space-y-3">
            <a
              href="/login"
              className="block w-full py-2 text-sm text-center font-medium rounded-lg"
              style={{
                background: 'transparent',
                border: '1px solid hsl(var(--border))',
                color: 'hsl(var(--foreground))',
              }}
            >
              Login
            </a>
            <a
              href="/challenges"
              className="block w-full py-2 text-sm text-center font-medium text-white rounded-lg"
              style={{ background: 'hsl(var(--primary))' }}
            >
              Start Challenge
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}

function HeroContent() {
  return (
    <div className="relative z-10 max-w-[1200px] mx-auto px-6 pt-32 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-3xl"
      >
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md mb-6"
          style={{ background: 'rgba(255,92,0,0.08)', border: '1px solid rgba(255,92,0,0.15)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span className="text-xs text-muted-foreground">XFunded Trader — Dubai</span>
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold leading-[1.1] tracking-tight mb-6">
          Trade bigger.<br />
          <span className="text-muted-foreground">Scale faster.</span>
        </h1>

        <p className="text-lg text-muted-foreground max-w-xl leading-relaxed mb-8">
          An institutional-grade proprietary trading firm built for the next generation of global traders. Access up to $200K in funded capital.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="/challenges"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white rounded-lg transition-colors"
            style={{ background: 'hsl(var(--primary))' }}
          >
            Start Challenge
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="/challenges?type=instant"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium rounded-lg transition-colors"
            style={{
              background: 'hsl(var(--secondary))',
              color: 'hsl(var(--foreground))',
              border: '1px solid hsl(var(--border))',
            }}
          >
            <Play className="w-4 h-4" />
            Instant Funding
          </a>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-12 mt-12 border-t border-border/50">
          {[
            { label: 'Traders worldwide', value: '14,200+' },
            { label: 'Total payouts', value: '$742M+' },
            { label: 'Funded accounts', value: '8,450+' },
            { label: 'Daily volume', value: '$2.4B+' },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-2xl font-semibold text-foreground mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default function GalaxyInteractiveHeroSection() {
  const heroContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (heroContentRef.current) {
        requestAnimationFrame(() => {
          const scrollPosition = window.pageYOffset;
          const maxScroll = 400;
          const opacity = 1 - Math.min(scrollPosition / maxScroll, 1);
          heroContentRef.current.style.opacity = opacity.toString();
        });
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative min-h-screen bg-background">
      <Navbar />

      <div className="relative h-screen">
        <div className="absolute inset-0 z-0">
          <HeroSplineBackground />
        </div>

        <div
          ref={heroContentRef}
          className="absolute inset-0 z-10 flex items-center"
          style={{ pointerEvents: 'none' }}
        >
          <HeroContent />
        </div>
      </div>
    </div>
  );
}