import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Award, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';

const SLIDES = [
  {
    label: 'Funded Trader Experience',
    title: 'Your Professional Trading Command Center',
    subtitle:
      'Access institutional-grade capital and real-time analytics to maximize your trading potential.',
    features: [
      { icon: DollarSign, text: 'Up to $200K Funded Capital' },
      { icon: BarChart3, text: 'Advanced Analytics Dashboard' },
      { icon: Award, text: '80/20 Profit Split' },
      { icon: TrendingUp, text: 'Real-Time Challenge Tracking' },
    ],
  },
  {
    label: 'Funded Trader Experience',
    title: 'Trade With Discipline, Get Rewarded',
    subtitle:
      'Transparent risk rules and automated phase progression keep your path to funding clear and verifiable.',
    features: [
      { icon: DollarSign, text: 'Daily Drawdown Protection' },
      { icon: BarChart3, text: 'Automated Phase Reviews' },
      { icon: Award, text: 'Up to 90% Reward Split' },
      { icon: TrendingUp, text: 'Withdraw on Your Schedule' },
    ],
  },
  {
    label: 'Funded Trader Experience',
    title: 'Institutional Tools, Built For You',
    subtitle:
      'MT5 execution, economic news integration, and a full trading journal in one professional workspace.',
    features: [
      { icon: DollarSign, text: 'Native MT5 Integration' },
      { icon: BarChart3, text: 'Economic News Calendar' },
      { icon: Award, text: 'Built-In Trading Journal' },
      { icon: TrendingUp, text: 'Live Equity & P&L Sync' },
    ],
  },
];

function DashboardMockup() {
  const points = [4, 10, 7, 14, 11, 18, 16, 24, 21, 30, 28, 36, 33, 42];
  const w = 260;
  const h = 70;
  const step = w / (points.length - 1);
  const line = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * step} ${h - (p / 42) * h}`)
    .join(' ');
  const area = `${line} L ${w} ${h} L 0 ${h} Z`;

  return (
    <div
      className="rounded-2xl overflow-hidden w-full max-w-[460px] mx-auto"
      style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
    >
      {/* Browser bar */}
      <div
        className="flex items-center gap-2 px-4 py-3 border-b"
        style={{ borderColor: 'hsl(var(--border))' }}
      >
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#ef4444' }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#f59e0b' }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#10b981' }} />
        </div>
        <div className="flex-1 text-center text-[11px] text-muted-foreground">Professional Dashboard</div>
      </div>

      <div className="p-5 space-y-4">
        {/* Top stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Balance', value: '$100,000', color: 'hsl(var(--primary))', icon: DollarSign },
            { label: 'Today P&L', value: '+$4,280', color: '#10b981', icon: TrendingUp },
            { label: 'Win Rate', value: '74.6%', color: 'hsl(var(--primary))', icon: Award },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="rounded-lg p-3"
                style={{ background: 'hsl(var(--secondary))', border: '1px solid hsl(var(--border))' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {s.label}
                  </span>
                  <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div className="text-sm font-bold tabular" style={{ color: s.color }}>
                  {s.value}
                </div>
              </div>
            );
          })}
        </div>

        {/* Equity curve */}
        <div
          className="rounded-lg p-4"
          style={{ background: 'hsl(var(--secondary))', border: '1px solid hsl(var(--border))' }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-foreground">Equity Curve</span>
            <span className="text-xs font-semibold text-emerald-400 tabular">+4.28%</span>
          </div>
          <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-16">
            <defs>
              <linearGradient id="fteEq" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={area} fill="url(#fteEq)" />
            <path d={line} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Challenge progress */}
        <div
          className="rounded-lg p-4"
          style={{ background: 'hsl(var(--secondary))', border: '1px solid hsl(var(--border))' }}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-foreground">Challenge Progress</span>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Phase 1
            </span>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="text-muted-foreground">Profit Target</span>
                <span className="font-semibold text-foreground tabular">43%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'hsl(var(--border))' }}>
                <div className="h-full rounded-full" style={{ width: '43%', background: 'hsl(var(--primary))' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="text-muted-foreground">Drawdown Used</span>
                <span className="font-semibold text-foreground tabular">24%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'hsl(var(--border))' }}>
                <div className="h-full rounded-full" style={{ width: '24%', background: '#10b981' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FundedTraderExperience() {
  const [slide, setSlide] = useState(0);
  const current = SLIDES[slide];

  const go = (dir) => setSlide((s) => (s + dir + SLIDES.length) % SLIDES.length);

  return (
    <section className="py-20 max-w-[1200px] mx-auto px-6">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        {/* Left */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {/* Carousel indicator */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex gap-1.5">
              {SLIDES.map((_, i) => (
                <span
                  key={i}
                  className="h-1 rounded-full transition-all"
                  style={{
                    width: i === slide ? 28 : 12,
                    background: i === slide ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                  }}
                />
              ))}
            </div>
            <span className="text-xs font-semibold text-muted-foreground tabular">
              {String(slide + 1).padStart(2, '0')} / {String(SLIDES.length).padStart(2, '0')}
            </span>
          </div>

          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            {current.label}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mt-3 mb-3">
            {current.title}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-8 max-w-lg">
            {current.subtitle}
          </p>

          {/* Feature grid */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {current.features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.text}
                  className="rounded-lg p-4 flex items-center gap-3"
                  style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                >
                  <Icon className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-sm font-medium text-foreground">{f.text}</span>
                </div>
              );
            })}
          </div>

          {/* Nav arrows */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => go(-1)}
              aria-label="Previous"
              className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-secondary"
              style={{ border: '1px solid hsl(var(--border))' }}
            >
              <ChevronLeft className="w-4 h-4 text-foreground" />
            </button>
            <button
              onClick={() => go(1)}
              aria-label="Next"
              className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-secondary"
              style={{ border: '1px solid hsl(var(--border))' }}
            >
              <ChevronRight className="w-4 h-4 text-foreground" />
            </button>
          </div>
        </motion.div>

        {/* Right — dashboard mockup */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <DashboardMockup />
        </motion.div>
      </div>
    </section>
  );
}