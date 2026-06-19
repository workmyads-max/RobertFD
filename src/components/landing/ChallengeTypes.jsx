import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers, Zap, Lightbulb, ArrowRight, CheckCircle2, XCircle,
  Shield, ChevronDown, ChevronUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CHALLENGES = [
  {
    id: 'two-step',
    icon: Layers,
    title: 'Two-Step',
    subtitle: 'Evaluation Model',
    badge: null,
    color: '#FF5C00',
    description: 'Prove your skills through a structured 2-phase evaluation. Built for disciplined traders who want the highest trust and capital allocation.',
    stats: [
      { label: 'Phase 1 Target', value: '10%' },
      { label: 'Phase 2 Target', value: '5%' },
      { label: 'Daily DD', value: '5%' },
      { label: 'Max DD', value: '10%' },
      { label: 'Leverage', value: '1:100 / 1:30' },
      { label: 'Profit Split', value: '80%' },
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
  },
  {
    id: 'instant',
    icon: Zap,
    title: 'Instant Funding',
    subtitle: 'No Evaluation',
    badge: 'Most Popular',
    color: '#FF5C00',
    description: 'Skip evaluation entirely. Get funded capital the same day and request payouts daily from day one.',
    stats: [
      { label: 'Evaluation', value: 'None' },
      { label: 'Daily DD', value: '5%' },
      { label: 'Max DD', value: '10%' },
      { label: 'Leverage', value: '1:30' },
      { label: 'Payouts', value: 'Daily' },
      { label: 'Profit Split', value: '80%' },
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
  },
  {
    id: 'instant_light',
    icon: Lightbulb,
    title: 'Instant Light',
    subtitle: '50% Cheaper · Trailing DD',
    badge: 'Best Value',
    color: '#CCFF00',
    description: 'Most affordable path to funding. Trailing drawdown protection moves your safety floor up as your balance grows.',
    stats: [
      { label: 'Evaluation', value: 'None' },
      { label: 'Trailing DD', value: '10%' },
      { label: 'Daily DD', value: '5%' },
      { label: 'Leverage', value: '1:30' },
      { label: 'Price', value: '50% Off' },
      { label: 'Profit Split', value: '80%' },
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
  },
];

function StatRow({ label, value, highlight, color }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold" style={{ color: highlight ? color : 'hsl(var(--foreground))' }}>{value}</span>
    </div>
  );
}

function FeatureRow({ ok, label }) {
  const Icon = ok ? CheckCircle2 : XCircle;
  return (
    <div className="flex items-center gap-2">
      <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${ok ? 'text-emerald-400' : 'text-red-400'}`} />
      <span className={`text-xs ${ok ? 'text-foreground' : 'text-muted-foreground line-through'}`}>{label}</span>
    </div>
  );
}

function ChallengeCard({ c, i, expanded, onToggle, onNavigate }) {
  const Icon = c.icon;
  const isAccent = c.badge === 'Most Popular';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: i * 0.1 }}
      className="rounded-xl overflow-hidden flex flex-col"
      style={{
        background: '#16181d',
        border: isAccent ? '1px solid rgba(255,92,0,0.3)' : '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="p-6 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start gap-4 mb-5">
          <div className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: `${c.color}10`, border: '1px solid rgba(255,255,255,0.06)' }}>
            <Icon className="w-5 h-5" style={{ color: c.color }} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-1">{c.title}</h3>
            <p className="text-xs text-muted-foreground">{c.subtitle}</p>
          </div>
          {c.badge && (
            <div className="px-2.5 py-1 rounded-md text-[10px] font-medium"
              style={{ 
                background: isAccent ? 'rgba(255,92,0,0.1)' : 'rgba(255,255,255,0.05)', 
                color: isAccent ? '#FF5C00' : 'hsl(var(--foreground))', 
                border: `1px solid ${isAccent ? 'rgba(255,92,0,0.2)' : 'rgba(255,255,255,0.08)'}` 
              }}>
              {c.badge}
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed mb-5">{c.description}</p>

        {/* Stats */}
        <div className="mb-5 space-y-2">
          {c.stats.map(s => <StatRow key={s.label} {...s} color={c.color} />)}
        </div>

        {/* Features toggle */}
        <button onClick={onToggle}
          className="flex items-center justify-between w-full text-xs text-muted-foreground mb-3 transition-colors hover:text-foreground">
          <span>{expanded ? 'Hide rules' : 'Show rules'}</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden mb-5"
            >
              <div className="rounded-lg px-3 py-2.5 space-y-1.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                {c.features.map(f => <FeatureRow key={f.label} {...f} />)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA */}
        <div className="mt-auto">
          <button onClick={onNavigate}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: isAccent ? 'hsl(var(--primary))' : 'transparent',
              color: isAccent ? '#fff' : 'hsl(var(--primary))',
              border: isAccent ? 'none' : '1px solid hsl(var(--primary))',
            }}>
            {c.cta}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function CompareRow({ label, values }) {
  return (
    <div className="grid grid-cols-4 items-center gap-4 py-3 border-b border-white/[0.05] last:border-0">
      <span className="text-xs text-muted-foreground pl-3 col-span-1">{label}</span>
      {values.map((v, i) => (
        <span key={i} className={`text-center text-xs font-semibold ${v.color || 'text-foreground'}`}>{v.text}</span>
      ))}
    </div>
  );
}

export default function ChallengeTypes() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState({});
  const [showCompare, setShowCompare] = useState(false);

  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  const handleNavigate = () => navigate('/challenges');

  const compareRows = [
    { label: 'Evaluation', values: [{ text: 'Phase 1+2', color: 'text-orange-400' }, { text: 'None', color: 'text-emerald-400' }, { text: 'None', color: 'text-emerald-400' }] },
    { label: 'Daily DD', values: [{ text: '5%' }, { text: '5%' }, { text: '5%' }] },
    { label: 'Max DD', values: [{ text: '10%' }, { text: '10%' }, { text: 'Trailing' }] },
    { label: 'Leverage', values: [{ text: '1:100' }, { text: '1:30' }, { text: '1:30' }] },
    { label: 'Payouts', values: [{ text: 'Bi-weekly' }, { text: 'Daily', color: 'text-emerald-400' }, { text: 'Daily', color: 'text-emerald-400' }] },
    { label: 'Price', values: [{ text: 'Standard' }, { text: 'Standard' }, { text: '50% Off', color: 'text-lime-400' }] },
    { label: 'Profit Split', values: [{ text: '80%', color: 'text-orange-400' }, { text: '80%', color: 'text-orange-400' }, { text: '80%', color: 'text-orange-400' }] },
  ];

  return (
    <section id="challenge" className="relative py-20 md:py-32 overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md mb-6 text-[11px] font-medium uppercase tracking-wide"
            style={{ background: 'rgba(255,92,0,0.06)', border: '1px solid rgba(255,92,0,0.15)', color: '#FF5C00' }}>
            Choose Your Plan
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-white mb-5 leading-tight">
            Choose your funding path
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Select the evaluation model that fits your trading style. All plans include transparent rules and up to 80% profit split.
          </p>
        </motion.div>

        {/* Cards grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {CHALLENGES.map((c, i) => (
            <ChallengeCard
              key={c.id}
              c={c}
              i={i}
              expanded={!!expanded[c.id]}
              onToggle={() => toggle(c.id)}
              onNavigate={handleNavigate}
            />
          ))}
        </div>

        {/* Compare toggle */}
        <div className="flex justify-center mb-8">
          <button 
            onClick={() => setShowCompare(!showCompare)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'hsl(var(--foreground))' }}
          >
            {showCompare ? 'Hide comparison' : 'Compare all plans'}
            {showCompare ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Comparison table */}
        <AnimatePresence>
          {showCompare && (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="rounded-xl overflow-hidden mb-12"
              style={{ background: '#16181d', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="grid grid-cols-4 gap-4 px-4 py-3 border-b border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <span className="text-xs text-muted-foreground pl-3">Feature</span>
                <span className="text-center text-xs font-semibold" style={{ color: '#FF5C00' }}>Two-Step</span>
                <span className="text-center text-xs font-semibold" style={{ color: '#FF5C00' }}>Instant</span>
                <span className="text-center text-xs font-semibold" style={{ color: '#CCFF00' }}>Instant Light</span>
              </div>
              {compareRows.map((row, i) => (
                <CompareRow key={i} {...row} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Disclaimer */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Leverage varies by account size and instrument. All challenge types require adherence to risk management rules. 
            Profit split applies to funded accounts only.
          </p>
        </div>
      </div>
    </section>
  );
}