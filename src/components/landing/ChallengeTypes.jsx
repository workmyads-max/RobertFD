import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers, Zap, Lightbulb, ArrowRight, CheckCircle2, XCircle,
  Shield, Star, TrendingUp, Target, Clock, DollarSign, ChevronDown, ChevronUp, Activity
} from 'lucide-react';

// ── Data ────────────────────────────────────────────────────────────────────
const CHALLENGES = [
  {
    id: 'two-step',
    icon: Layers,
    title: 'Two-Step',
    subtitle: 'Evaluation Model',
    badge: null,
    accent: false,
    color: '#FF5C00',
    description: 'Prove your skills through a structured 2-phase evaluation. Built for disciplined traders who want the highest trust and capital allocation.',
    stats: [
      { label: 'Phase 1 Target', value: '10%' },
      { label: 'Phase 2 Target', value: '5%' },
      { label: 'Daily DD', value: '5%' },
      { label: 'Max DD', value: '10%' },
      { label: 'Leverage', value: '1:100 / 1:30' },
      { label: 'Profit Split', value: '80%', highlight: true },
    ],
    features: [
      { ok: true, label: 'High Leverage 1:100' },
      { ok: true, label: 'No Consistency Rules' },
      { ok: true, label: 'Up to 80% Profit Split' },
      { ok: true, label: 'News Trading (1:30 mode)' },
      { ok: false, label: 'News Trading (1:100 mode)' },
      { ok: false, label: 'Overnight Holding (1:100)' },
    ],
    cta: 'Start Challenge',
    href: '#two-step-pricing',
  },
  {
    id: 'instant',
    icon: Zap,
    title: 'Instant Funding',
    subtitle: 'No Evaluation',
    badge: 'Most Popular',
    accent: true,
    color: '#FF5C00',
    description: 'Skip evaluation entirely. Get funded capital the same day and request payouts daily from day one.',
    stats: [
      { label: 'Evaluation', value: 'None' },
      { label: 'Daily DD', value: '5%' },
      { label: 'Max DD', value: '10%' },
      { label: 'Leverage', value: '1:30' },
      { label: 'Payouts', value: 'Daily' },
      { label: 'Profit Split', value: '80%', highlight: true },
    ],
    features: [
      { ok: true, label: 'No Evaluation Phase' },
      { ok: true, label: 'Instant Funded Account' },
      { ok: true, label: 'Daily Payout Requests' },
      { ok: true, label: 'News Trading Allowed' },
      { ok: true, label: 'Overnight Holding' },
      { ok: true, label: 'Weekend Holding' },
    ],
    cta: 'Get Instant Funding',
    href: '#instant-funding',
  },
  {
    id: 'instant_light',
    icon: Lightbulb,
    title: 'Instant Light',
    subtitle: '50% Cheaper · Trailing DD',
    badge: '💡 Best Value',
    accent: false,
    color: '#CCFF00',
    description: 'Most affordable path to funding. Trailing drawdown protection moves your safety floor up as your balance grows.',
    stats: [
      { label: 'Evaluation', value: 'None' },
      { label: 'Trailing DD', value: '10%' },
      { label: 'Daily DD', value: '5%' },
      { label: 'Leverage', value: '1:30' },
      { label: 'Price', value: '50% Off' },
      { label: 'Profit Split', value: '80%', highlight: true },
    ],
    features: [
      { ok: true, label: 'No Evaluation Required' },
      { ok: true, label: 'Trailing DD Protection' },
      { ok: true, label: '50% Cheaper Pricing' },
      { ok: true, label: 'Instant Account Access' },
      { ok: true, label: 'Trade From Day One' },
      { ok: true, label: '80/20 Profit Split' },
    ],
    cta: 'Get Instant Light',
    href: '#instant-light',
  },
];

// ── Sub-components ──────────────────────────────────────────────────────────
function StatPill({ label, value, highlight, color }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/[0.06] last:border-0">
      <span className="text-[11px] font-mono text-white/40 uppercase tracking-wide">{label}</span>
      <span className="text-[12px] font-bold font-mono" style={{ color: highlight ? color : 'rgba(255,255,255,0.85)' }}>{value}</span>
    </div>
  );
}

function FeatureRow({ ok, label }) {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      {ok
        ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
        : <XCircle className="w-3.5 h-3.5 text-red-400/60 flex-shrink-0" />}
      <span className={`text-[12px] ${ok ? 'text-white/75' : 'text-white/30 line-through'}`}>{label}</span>
    </div>
  );
}

function ChallengeCard({ c, i, expanded, onToggle }) {
  const Icon = c.icon;
  const isLime = c.color === '#CCFF00';

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.65, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
      className="relative rounded-3xl overflow-hidden flex flex-col"
      style={{
        background: c.accent
          ? 'linear-gradient(145deg, rgba(255,92,0,0.12), rgba(14,10,6,0.97))'
          : 'linear-gradient(145deg, rgba(18,18,24,0.97), rgba(10,10,14,0.98))',
        border: c.accent
          ? '1px solid rgba(255,92,0,0.45)'
          : isLime
            ? '1px solid rgba(204,255,0,0.25)'
            : '1px solid rgba(255,255,255,0.09)',
        boxShadow: c.accent
          ? '0 0 60px rgba(255,92,0,0.15), 0 20px 60px rgba(0,0,0,0.5)'
          : '0 20px 60px rgba(0,0,0,0.4)',
      }}
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-3xl"
        style={{ background: `linear-gradient(90deg, transparent, ${c.color}, transparent)` }} />

      {/* Radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 blur-3xl opacity-20 pointer-events-none"
        style={{ background: `radial-gradient(ellipse, ${c.color}, transparent 70%)` }} />

      {/* Badge */}
      {c.badge && (
        <div className="absolute top-5 right-5 px-3 py-1 rounded-full text-[10px] font-black"
          style={c.accent
            ? { background: 'rgba(255,92,0,0.9)', color: '#fff' }
            : { background: c.color, color: c.color === '#CCFF00' ? '#000' : '#fff' }}>
          {c.badge}
        </div>
      )}

      <div className="relative z-10 p-7 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${c.color}15`, border: `1px solid ${c.color}30` }}>
            <Icon className="w-6 h-6" style={{ color: c.color }} />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.15em] mb-0.5" style={{ color: `${c.color}90` }}>{c.subtitle}</div>
            <h3 className="text-xl font-black text-white leading-tight">{c.title}</h3>
          </div>
        </div>

        {/* Description */}
        <p className="text-[13px] text-white/45 leading-relaxed mb-6">{c.description}</p>

        {/* Stats */}
        <div className="mb-5 rounded-2xl px-4 py-1" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {c.stats.map(s => <StatPill key={s.label} {...s} color={c.color} />)}
        </div>

        {/* Features toggle */}
        <button onClick={onToggle}
          className="flex items-center justify-between w-full text-[11px] font-mono mb-3 transition-colors"
          style={{ color: expanded ? c.color : 'rgba(255,255,255,0.35)' }}>
          <span className="uppercase tracking-widest">{expanded ? 'Hide Rules' : 'Show Rules'}</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden mb-4"
            >
              <div className="rounded-xl px-3 py-2 space-y-0.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                {c.features.map(f => <FeatureRow key={f.label} {...f} />)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA */}
        <div className="mt-auto">
          <a href={c.href}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={c.accent
              ? { background: 'linear-gradient(135deg, #FF5C00, #FF8A3D)', color: '#fff', boxShadow: '0 8px 32px rgba(255,92,0,0.35)' }
              : isLime
                ? { background: 'rgba(204,255,0,0.12)', color: '#CCFF00', border: '1px solid rgba(204,255,0,0.35)' }
                : { background: 'rgba(255,92,0,0.1)', color: '#FF5C00', border: '1px solid rgba(255,92,0,0.3)' }}>
            {c.cta}
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </motion.div>
  );
}

// ── Comparison table row ────────────────────────────────────────────────────
function CompareRow({ label, values, highlight }) {
  return (
    <div className={`grid grid-cols-4 items-center gap-2 py-3 border-b border-white/[0.05] last:border-0 ${highlight ? 'bg-white/[0.02] rounded-xl' : ''}`}>
      <span className="text-[11px] font-mono text-white/40 pl-3 col-span-1">{label}</span>
      {values.map((v, i) => (
        <span key={i} className={`text-center text-[11px] font-bold font-mono ${v.color || 'text-white/80'}`}>{v.text}</span>
      ))}
    </div>
  );
}

// ── Main export ─────────────────────────────────────────────────────────────
export default function ChallengeTypes() {
  const [expanded, setExpanded] = useState({});
  const [showCompare, setShowCompare] = useState(false);

  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const compareRows = [
    { label: 'Evaluation', values: [{ text: 'Phase 1+2', color: 'text-orange-400' }, { text: 'None', color: 'text-emerald-400' }, { text: 'None', color: 'text-emerald-400' }] },
    { label: 'Daily DD', values: [{ text: '5%' }, { text: '5%' }, { text: '5%' }] },
    { label: 'Max DD', values: [{ text: '10%' }, { text: '10%' }, { text: 'Trailing' }] },
    { label: 'Leverage', values: [{ text: '1:100' }, { text: '1:30' }, { text: '1:30' }] },
    { label: 'Payouts', values: [{ text: 'Bi-weekly' }, { text: 'Daily', color: 'text-emerald-400' }, { text: 'Daily', color: 'text-emerald-400' }] },
    { label: 'Price', values: [{ text: 'Standard' }, { text: 'Standard' }, { text: '50% Off', color: 'text-lime-400' }], highlight: true },
    { label: 'Split', values: [{ text: '80%', color: 'text-orange-400' }, { text: '80%', color: 'text-orange-400' }, { text: '80%', color: 'text-orange-400' }] },
  ];

  return (
     <section id="challenge" className="relative py-20 md:py-32 overflow-hidden">
       {/* Background glows */}
       <div className="absolute inset-0 pointer-events-none overflow-hidden">
         <div className="absolute top-1/4 left-0 w-[500px] h-[500px] rounded-full blur-[140px] opacity-[0.06]"
           style={{ background: 'radial-gradient(circle, #FF5C00, transparent)' }} />
         <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] rounded-full blur-[120px] opacity-[0.05]"
           style={{ background: 'radial-gradient(circle, #CCFF00, transparent)' }} />
         {/* Grid lines */}
         <div className="absolute inset-0 opacity-[0.025]"
           style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '80px 80px' }} />
       </div>

       <div className="max-w-[1400px] mx-auto px-4 sm:px-6 relative z-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-[10px] font-mono uppercase tracking-[0.2em]"
            style={{ background: 'rgba(255,92,0,0.08)', border: '1px solid rgba(255,92,0,0.2)', color: '#FF5C00' }}>
            <Activity className="w-3 h-3" />
            Choose Your Capital
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white mb-5 leading-[1.05]">
            Three Paths to{' '}
            <span className="relative inline-block">
              <span className="gradient-text">Funded Trading</span>
            </span>
          </h2>
          <p className="text-white/40 text-sm sm:text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Select the model that matches your strategy. Every plan includes institutional rules, real capital, and up to 80% profit split.
          </p>
        </motion.div>

        {/* Cards grid */}
        <div className="grid md:grid-cols-3 gap-3 md:gap-5 mb-10 md:mb-12">
          {CHALLENGES.map((c, i) => (
            <ChallengeCard
              key={c.id}
              c={c}
              i={i}
              expanded={!!expanded[c.id]}
              onToggle={() => toggle(c.id)}
            />
          ))}
        </div>

        {/* Compare table toggle */}
        <div className="flex justify-center mb-6">
          <button onClick={() => setShowCompare(v => !v)}
            className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all hover:scale-105"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
            {showCompare ? 'Hide' : 'Compare All Plans'}
            {showCompare ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Full compare table */}
        <AnimatePresence>
          {showCompare && (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35 }}
              className="rounded-3xl overflow-hidden mb-12"
              style={{ background: 'rgba(14,14,18,0.97)', border: '1px solid rgba(255,255,255,0.09)' }}
            >
              {/* Table header */}
              <div className="grid grid-cols-4 gap-2 px-3 py-4 border-b border-white/[0.07]"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="text-[9px] font-mono text-white/25 uppercase tracking-widest pl-3">Feature</div>
                {CHALLENGES.map(c => (
                  <div key={c.id} className="text-center">
                    <div className="text-[10px] font-black" style={{ color: c.color }}>{c.title}</div>
                  </div>
                ))}
              </div>
              <div className="px-3 py-2">
                {compareRows.map(r => <CompareRow key={r.label} {...r} />)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rules section — embedded below */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 text-[10px] font-mono uppercase tracking-[0.2em]"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}>
            <Shield className="w-3 h-3" />
            Full Transparency
          </div>
          <h3 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-3">
            Challenge Rules — No Surprises
          </h3>
          <p className="text-white/35 text-sm max-w-lg mx-auto">
            100% transparent ruleset. Know exactly what it takes to get funded and stay funded.
          </p>
        </motion.div>

        {/* Inline rules grid */}
        <div className="grid md:grid-cols-3 gap-3 md:gap-5">
          {CHALLENGES.map((c, i) => {
            const Icon = c.icon;
            return (
              <motion.div
                key={`rules-${c.id}`}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="rounded-2xl overflow-hidden"
                style={{
                  background: 'rgba(12,12,16,0.96)',
                  border: `1px solid ${c.color}20`,
                }}
              >
                {/* Top bar */}
                <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3"
                  style={{ background: `${c.color}08` }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: `${c.color}15` }}>
                    <Icon className="w-4 h-4" style={{ color: c.color }} />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest mb-0.5" style={{ color: `${c.color}80` }}>{c.subtitle}</div>
                    <div className="text-sm font-black text-white">{c.title}</div>
                  </div>
                </div>

                <div className="p-5 space-y-1.5">
                  {c.features.map(f => (
                    <div key={f.label} className="flex items-center gap-2.5 py-1.5 px-3 rounded-xl transition-colors"
                      style={{ background: f.ok ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.04)' }}>
                      {f.ok
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        : <XCircle className="w-3.5 h-3.5 text-red-400/50 flex-shrink-0" />}
                      <span className={`text-[11px] ${f.ok ? 'text-white/70' : 'text-white/25 line-through'}`}>{f.label}</span>
                    </div>
                  ))}

                  <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{ background: `${c.color}08`, border: `1px solid ${c.color}20` }}>
                    <Star className="w-3.5 h-3.5 flex-shrink-0" style={{ color: c.color }} />
                    <span className="text-[11px] font-bold" style={{ color: c.color }}>No Consistency Rules</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Footnote */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 rounded-2xl px-5 py-4 flex items-start gap-3"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <Shield className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
          <p className="text-[12px] text-white/35 leading-relaxed">
            <strong className="text-white/60">Leverage Note:</strong> 1:100 leverage applies restrictions on news trading, overnight and weekend holding.
            Choosing 1:30 swing mode unlocks all trading styles. Instant & Instant Light plans operate exclusively at 1:30 with full freedom.
          </p>
        </motion.div>
      </div>
    </section>
  );
}