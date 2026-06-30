import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, TrendingUp, Award, BarChart3, ChevronLeft, ChevronRight,
  Shield, Flame, Zap, ShieldCheck, Lock, Globe, Monitor,
} from 'lucide-react';

/* ───────────────── Right-side mockups (one per slide) ───────────────── */

function DashboardMockup() {
  const points = [4, 10, 7, 14, 11, 18, 16, 24, 21, 30, 28, 36, 33, 42];
  const w = 260, h = 70;
  const step = w / (points.length - 1);
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * step} ${h - (p / 42) * h}`).join(' ');
  const area = `${line} L ${w} ${h} L 0 ${h} Z`;

  return (
    <MockupShell title="Professional Dashboard">
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Balance', value: '$100,000', color: 'hsl(var(--primary))', icon: DollarSign },
            { label: 'Today P&L', value: '+$4,280', color: '#10b981', icon: TrendingUp },
            { label: 'Win Rate', value: '74.6%', color: 'hsl(var(--primary))', icon: Award },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="rounded-lg p-3" style={{ background: 'hsl(var(--secondary))', border: '1px solid hsl(var(--border))' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">{s.label}</span>
                  <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div className="text-sm font-bold tabular" style={{ color: s.color }}>{s.value}</div>
              </div>
            );
          })}
        </div>

        <div className="rounded-lg p-4" style={{ background: 'hsl(var(--secondary))', border: '1px solid hsl(var(--border))' }}>
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

        <div className="rounded-lg p-4" style={{ background: 'hsl(var(--secondary))', border: '1px solid hsl(var(--border))' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-foreground">Challenge Progress</span>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Phase 1</span>
          </div>
          <div className="space-y-3">
            <ProgressBar label="Profit Target" pct={43} color="hsl(var(--primary))" />
            <ProgressBar label="Drawdown Used" pct={24} color="#10b981" />
          </div>
        </div>
      </div>
    </MockupShell>
  );
}

function RiskShieldMockup() {
  const rows = [
    { icon: ShieldCheck, text: 'Account Protection', color: '#10b981' },
    { icon: Flame, text: 'Stop Loss Enforcement', color: 'hsl(var(--primary))' },
    { icon: Zap, text: 'Auto Risk Limits', color: '#10b981' },
  ];
  return (
    <MockupShell title="Risk Shield">
      <div className="p-5 space-y-4">
        {/* Center shield */}
        <div className="flex flex-col items-center py-6">
          <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-3" style={{ background: 'hsl(var(--secondary))', border: '1px solid hsl(var(--border))' }}>
            <Shield className="w-8 h-8" style={{ color: '#10b981' }} />
          </div>
          <span className="text-xs font-semibold text-foreground">Account Secured</span>
          <span className="text-[10px] text-muted-foreground mt-0.5">All risk systems active</span>
        </div>

        {/* Status list */}
        <div className="space-y-2">
          {rows.map((r) => {
            const Icon = r.icon;
            return (
              <div key={r.text} className="flex items-center gap-3 rounded-lg p-3" style={{ background: 'hsl(var(--secondary))', border: '1px solid hsl(var(--border))' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                  <Icon className="w-4 h-4" style={{ color: r.color }} />
                </div>
                <span className="text-sm font-medium text-foreground">{r.text}</span>
                <span className="ml-auto w-2 h-2 rounded-full" style={{ background: r.color }} />
              </div>
            );
          })}
        </div>
      </div>
    </MockupShell>
  );
}

function MultiPlatformMockup() {
  const platforms = [
    { icon: BarChart3, name: 'MetaTrader 5', tags: ['Advanced Charting', 'Expert Advisors'], dot: 'hsl(var(--primary))' },
    { icon: Lock, name: 'TradeLocker', tags: ['Risk Management', 'One-Click Trading'], dot: '#10b981' },
    { icon: Globe, name: 'Web Terminal', tags: ['No Download', 'Instant Access'], dot: '#10b981' },
  ];
  const metrics = [
    { value: '3+', label: 'Platforms', color: 'hsl(var(--primary))' },
    { value: '99.9%', label: 'Uptime', color: '#10b981' },
    { value: '<50ms', label: 'Latency', color: '#10b981' },
  ];
  return (
    <MockupShell title="Multi-Platform Trading">
      <div className="p-5 space-y-3">
        {platforms.map((p) => {
          const Icon = p.icon;
          return (
            <div key={p.name} className="rounded-lg p-3 flex items-center gap-3" style={{ background: 'hsl(var(--secondary))', border: '1px solid hsl(var(--border))' }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                <Icon className="w-4 h-4 text-foreground" />
              </div>
              <span className="text-sm font-semibold text-foreground">{p.name}</span>
              <div className="ml-auto flex items-center gap-2">
                <div className="hidden sm:flex gap-1.5">
                  {p.tags.map((t) => (
                    <span key={t} className="text-[9px] font-medium px-2 py-0.5 rounded-full" style={{ background: 'hsl(var(--card))', color: 'hsl(var(--primary))', border: '1px solid hsl(var(--border))' }}>
                      {t}
                    </span>
                  ))}
                </div>
                <span className="w-2 h-2 rounded-full" style={{ background: p.dot }} />
              </div>
            </div>
          );
        })}

        {/* Metrics row */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-lg p-3 text-center" style={{ background: 'hsl(var(--secondary))', border: '1px solid hsl(var(--border))' }}>
              <div className="text-base font-bold tabular" style={{ color: m.color }}>{m.value}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{m.label}</div>
            </div>
          ))}
        </div>
      </div>
    </MockupShell>
  );
}

/* ───────────────── Shared helpers ───────────────── */

function MockupShell({ title, children }) {
  return (
    <div className="rounded-2xl overflow-hidden w-full max-w-[460px] mx-auto" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
      <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#ef4444' }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#f59e0b' }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#10b981' }} />
        </div>
        <div className="flex-1 text-center text-[11px] text-muted-foreground">{title}</div>
      </div>
      {children}
    </div>
  );
}

function ProgressBar({ label, pct, color }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] mb-1.5">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold text-foreground tabular">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'hsl(var(--border))' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

/* ───────────────── Slide data ───────────────── */

const SLIDES = [
  {
    label: 'Funded Trader Experience',
    title: 'Your Professional Trading Command Center',
    subtitle: 'Access institutional-grade capital and real-time analytics to maximize your trading potential.',
    features: [
      { icon: DollarSign, text: 'Up to $200K Funded Capital' },
      { icon: BarChart3, text: 'Advanced Analytics Dashboard' },
      { icon: Award, text: '80/20 Profit Split' },
      { icon: TrendingUp, text: 'Real-Time Challenge Tracking' },
    ],
    mockup: DashboardMockup,
  },
  {
    label: 'Risk Management',
    title: 'Capital Protection At Every Step',
    subtitle: 'Automated risk controls safeguard your account around the clock, so you can trade with confidence.',
    features: [
      { icon: Shield, text: 'Automatic Stop-Loss' },
      { icon: BarChart3, text: 'AI Risk Detection' },
      { icon: ShieldCheck, text: 'Account Safeguards' },
      { icon: Zap, text: 'Real-Time Alerts' },
    ],
    mockup: RiskShieldMockup,
  },
  {
    label: 'Multi-Platform',
    title: 'Trade Anywhere. Any Device.',
    subtitle: 'Access MT5, TradeLocker, and our proprietary web terminal seamlessly across desktop and mobile.',
    features: [
      { icon: Monitor, text: 'MetaTrader 5 Native' },
      { icon: Globe, text: 'Web Terminal Access' },
      { icon: Lock, text: 'One-Click Execution' },
      { icon: TrendingUp, text: 'Real-Time Sync' },
    ],
    mockup: MultiPlatformMockup,
  },
];

/* ───────────────── Section ───────────────── */

export default function FundedTraderExperience() {
  const [slide, setSlide] = useState(0);
  const current = SLIDES[slide];
  const Mockup = current.mockup;

  const go = (dir) => setSlide((s) => (s + dir + SLIDES.length) % SLIDES.length);

  return (
    <section className="py-20 max-w-[1200px] mx-auto px-6">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        {/* Left */}
        <motion.div
          key={slide}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
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

          <span className="text-xs font-semibold uppercase tracking-wider text-primary">{current.label}</span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mt-3 mb-3">{current.title}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-8 max-w-lg">{current.subtitle}</p>

          {/* Feature grid */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {current.features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.text} className="rounded-lg p-4 flex items-center gap-3" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                  <Icon className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-sm font-medium text-foreground">{f.text}</span>
                </div>
              );
            })}
          </div>

          {/* Nav arrows */}
          <div className="flex items-center gap-3">
            <button onClick={() => go(-1)} aria-label="Previous" className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-secondary" style={{ border: '1px solid hsl(var(--border))' }}>
              <ChevronLeft className="w-4 h-4 text-foreground" />
            </button>
            <button onClick={() => go(1)} aria-label="Next" className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-secondary" style={{ border: '1px solid hsl(var(--border))' }}>
              <ChevronRight className="w-4 h-4 text-foreground" />
            </button>
          </div>
        </motion.div>

        {/* Right — per-slide mockup */}
        <motion.div
          key={`mockup-${slide}`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Mockup />
        </motion.div>
      </div>
    </section>
  );
}