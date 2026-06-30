import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Layers, Rocket, Zap, ArrowRight, CheckCircle2, Wallet } from 'lucide-react';

const ACCOUNT = 100000;
const money = (n) => '$' + Math.round(n).toLocaleString('en-US');

// Worked 100K example for each challenge type
const EXAMPLES = [
  {
    id: 'two-step', name: 'Two-Step', icon: Layers, accent: '#FF5C00',
    tagline: 'Pass 2 phases, then get funded',
    rows: [
      { label: 'Phase 1 Profit Target', sub: '10%', value: money(ACCOUNT * 0.10) },
      { label: 'Phase 2 Profit Target', sub: '5%', value: money(ACCOUNT * 0.05) },
      { label: 'Max Daily Loss', sub: '5%', value: money(ACCOUNT * 0.05) },
      { label: 'Max Overall Loss', sub: '10%', value: money(ACCOUNT * 0.10) },
      { label: 'Reward Split', sub: 'Your share', value: '80%' },
    ],
    example: {
      scenario: 'You earn $8,000 profit on your funded account',
      payout: ACCOUNT * 0.08 * 0.80,
      note: '80% of $8,000 reward goes to you',
    },
  },
  {
    id: 'one_step', name: 'One-Step', icon: Rocket, accent: '#3b82f6',
    tagline: 'Single phase, keep 90%',
    rows: [
      { label: 'Profit Target', sub: '8%', value: money(ACCOUNT * 0.08) },
      { label: 'Max Daily Loss', sub: '4%', value: money(ACCOUNT * 0.04) },
      { label: 'Max Loss (Trailing)', sub: '8%', value: money(ACCOUNT * 0.08) },
      { label: 'Best Day Rule', sub: 'Consistency', value: '50%' },
      { label: 'Reward Split', sub: 'Your share', value: '90%' },
    ],
    example: {
      scenario: 'You earn $8,000 profit on your funded account',
      payout: ACCOUNT * 0.08 * 0.90,
      note: '90% of $8,000 reward goes to you',
    },
  },
  {
    id: 'instant_account', name: 'Instant Account', icon: Zap, accent: '#10b981',
    tagline: 'No evaluation, buffer-zone rules',
    rows: [
      { label: 'Buffer Zone Target', sub: '5%', value: money(ACCOUNT * 0.05) },
      { label: 'Max Daily Loss', sub: '4%', value: money(ACCOUNT * 0.04) },
      { label: 'Max Overall Loss', sub: '8%', value: money(ACCOUNT * 0.08) },
      { label: 'Consistency Rule', sub: '35%', value: '35%' },
      { label: 'Reward Split', sub: 'Your share', value: '80%' },
    ],
    example: {
      scenario: 'You earn $5,000 profit after buffer zone',
      payout: ACCOUNT * 0.05 * 0.80,
      note: '80% of $5,000 reward goes to you',
    },
  },
];

function ExampleCard({ ex, i }) {
  const navigate = useNavigate();
  const Icon = ex.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{ background: 'rgba(14,14,18,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}>
      {/* Header */}
      <div className="p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${ex.accent}14`, border: `1px solid ${ex.accent}30` }}>
            <Icon className="w-5 h-5" style={{ color: ex.accent }} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white leading-tight">{ex.name}</h3>
            <p className="text-[11px] text-muted-foreground">{ex.tagline}</p>
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-white">$100,000</span>
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Account</span>
        </div>
      </div>

      {/* Breakdown */}
      <div className="px-5 py-4 space-y-0.5">
        {ex.rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
            <div>
              <div className="text-xs font-medium text-foreground">{r.label}</div>
              <div className="text-[10px] text-muted-foreground">{r.sub}</div>
            </div>
            <span className="text-sm font-bold tabular" style={{ color: ex.accent }}>{r.value}</span>
          </div>
        ))}
      </div>

      {/* Example payout box */}
      <div className="mx-5 mb-5 rounded-xl p-4" style={{ background: `${ex.accent}0d`, border: `1px solid ${ex.accent}26` }}>
        <div className="flex items-center gap-1.5 mb-2">
          <Wallet className="w-3.5 h-3.5" style={{ color: ex.accent }} />
          <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: ex.accent }}>Payout Example</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed mb-3">{ex.example.scenario}</p>
        <div className="flex items-end justify-between">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-[11px] text-muted-foreground">{ex.example.note}</span>
          </div>
          <div className="text-right">
            <div className="text-lg font-black text-emerald-400">{money(ex.example.payout)}</div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider">You keep</div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <button onClick={() => navigate(`/challenges?type=${ex.id}&size=${ACCOUNT}`)}
        className="mx-5 mb-5 py-2.5 rounded-lg text-xs font-bold transition-all hover:opacity-90 active:scale-95 flex items-center justify-center gap-1.5"
        style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
        Start {ex.name} $100K <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

export default function ChallengeExamples() {
  return (
    <section className="relative py-12 md:py-16">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="text-center mb-10">
          <span className="text-xs font-mono text-primary uppercase tracking-widest">See It In Action</span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight mt-3 mb-3 text-white">
            $100K Account — Real Examples
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
            Here's exactly how a $100,000 account works across each challenge type, with real dollar figures.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {EXAMPLES.map((ex, i) => <ExampleCard key={ex.id} ex={ex} i={i} />)}
        </div>
      </div>
    </section>
  );
}