import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

const ACCOUNT = 100000;
const money = (n) => '$' + Math.round(n).toLocaleString('en-US');

// Detailed 100K walkthrough for each type — order: One-Step, Two-Step, Instant Account
const EXAMPLES = [
  {
    id: 'one_step', name: 'One-Step', badge: 'Single Phase', accent: '#3b82f6', split: 90,
    steps: [
      { t: 'Buy & get your account', d: 'Purchase the $100,000 One-Step challenge and receive MetaTrader 5 credentials instantly — no waiting.' },
      { t: 'Reach 8% profit target', d: 'Grow the balance to $108,000 ($8,000 profit). Trade as long as you need — no time limit, no minimum days.' },
      { t: 'Stay inside the loss limits', d: 'Never lose more than $4,000 in a day (4%) or breach the $8,000 trailing max loss (8%).' },
      { t: 'Pass the Best Day Rule', d: 'No single day may make up more than 50% of your total profit — proves consistent trading.' },
      { t: 'Get funded & keep 90%', d: 'After a short review you receive a Simulation Funded Account and withdraw 90% of every reward.' },
    ],
    limits: [
      { k: 'Profit Target', v: '$8,000', s: '8%' },
      { k: 'Max Daily Loss', v: '$4,000', s: '4%' },
      { k: 'Max Loss', v: '$8,000', s: '8% trailing' },
    ],
    example: { earn: 8000, keep: 8000 * 0.9, line: 'Earn $8,000 on your funded account → keep 90%' },
  },
  {
    id: 'two-step', name: 'Two-Step', badge: 'Standard Evaluation', accent: '#FF5C00', split: 80,
    steps: [
      { t: 'Buy & get your account', d: 'Purchase the $100,000 Two-Step challenge and start Phase 1 on MetaTrader 5 right away.' },
      { t: 'Phase 1 — reach 10%', d: 'Make $10,000 profit (balance $110,000) over at least 4 trading days to clear Phase 1.' },
      { t: 'Phase 2 — reach 5%', d: 'On a fresh Phase 2 account, make $5,000 profit while keeping the same loss limits.' },
      { t: 'Respect loss limits both phases', d: 'Max $5,000 daily loss (5%) and $10,000 overall loss (10%) apply throughout.' },
      { t: 'Get funded & keep 80%', d: 'Pass both phases, receive a Simulation Funded Account, and withdraw 80% of every reward.' },
    ],
    limits: [
      { k: 'P1 / P2 Target', v: '$10K / $5K', s: '10% / 5%' },
      { k: 'Max Daily Loss', v: '$5,000', s: '5%' },
      { k: 'Max Loss', v: '$10,000', s: '10%' },
    ],
    example: { earn: 8000, keep: 8000 * 0.8, line: 'Earn $8,000 on your funded account → keep 80%' },
  },
  {
    id: 'instant_account', name: 'Instant Account', badge: 'No Evaluation', accent: '#10b981', split: 80,
    steps: [
      { t: 'Buy & trade instantly', d: 'Purchase the $100,000 Instant Account — funded immediately with no evaluation phase.' },
      { t: 'Reach the buffer zone (5%)', d: 'Grow the balance to $105,000 to lock your drawdown reference and unlock payout tracking.' },
      { t: 'Pass the consistency rule (35%)', d: 'Your best day cannot exceed 35% of total profit, so required profit scales with your biggest day.' },
      { t: 'Log 7 profitable days', d: 'Record at least 7 days with positive closed profit after the buffer zone activates.' },
      { t: 'Withdraw & get a new account', d: 'Keep 80% of your reward — after each payout a fresh account is issued automatically.' },
    ],
    limits: [
      { k: 'Buffer Zone', v: '$5,000', s: '5%' },
      { k: 'Max Daily Loss', v: '$4,000', s: '4%' },
      { k: 'Max Loss', v: '$8,000', s: '8%' },
    ],
    example: { earn: 5000, keep: 5000 * 0.8, line: 'Earn $5,000 after buffer zone → keep 80%' },
  },
];

function ExampleCard({ ex, i }) {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }}
      className="rounded-2xl flex flex-col bg-card"
      style={{ border: '1px solid hsl(var(--border))' }}>

      {/* Header */}
      <div className="p-6 pb-5">
        <div className="flex items-center justify-between mb-5">
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md uppercase tracking-wide"
            style={{ background: `${ex.accent}14`, color: ex.accent }}>
            {ex.badge}
          </span>
          <span className="text-[11px] font-semibold text-muted-foreground">{ex.split}% Reward Split</span>
        </div>
        <h3 className="text-lg font-bold text-foreground">{ex.name}</h3>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="text-3xl font-bold text-foreground tracking-tight">$100,000</span>
          <span className="text-xs text-muted-foreground">account</span>
        </div>
      </div>

      {/* Limits strip */}
      <div className="grid grid-cols-3 border-y" style={{ borderColor: 'hsl(var(--border))' }}>
        {ex.limits.map((l, idx) => (
          <div key={l.k} className="px-3 py-3.5 text-center"
            style={{ borderRight: idx < 2 ? '1px solid hsl(var(--border))' : 'none' }}>
            <div className="text-sm font-bold text-foreground tabular leading-tight">{l.v}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{l.k}</div>
            <div className="text-[9px] font-medium mt-0.5" style={{ color: ex.accent }}>{l.s}</div>
          </div>
        ))}
      </div>

      {/* How it works — numbered steps */}
      <div className="px-6 py-5 flex-1">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-4">How it works</div>
        <div className="relative">
          {ex.steps.map((s, idx) => (
            <div key={idx} className="flex gap-3.5 pb-4 last:pb-0 relative">
              {idx < ex.steps.length - 1 && (
                <div className="absolute left-[11px] top-7 bottom-0 w-px" style={{ background: 'hsl(var(--border))' }} />
              )}
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold z-10"
                style={{ background: `${ex.accent}1a`, color: ex.accent, border: `1px solid ${ex.accent}40` }}>
                {idx + 1}
              </div>
              <div className="pt-0.5">
                <div className="text-[13px] font-semibold text-foreground leading-snug">{s.t}</div>
                <div className="text-[11px] text-muted-foreground leading-relaxed mt-1">{s.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payout example */}
      <div className="px-6 pb-5">
        <div className="rounded-xl p-4" style={{ background: 'hsl(var(--secondary))' }}>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Payout Example</div>
          <div className="flex items-end justify-between gap-3">
            <p className="text-[11px] text-muted-foreground leading-snug max-w-[60%]">{ex.example.line}</p>
            <div className="text-right">
              <div className="text-xl font-bold text-emerald-400 leading-none">{money(ex.example.keep)}</div>
              <div className="text-[10px] text-muted-foreground mt-1">you withdraw</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 pb-6">
        <button onClick={() => navigate(`/challenges?type=${ex.id}&size=${ACCOUNT}`)}
          className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.99] flex items-center justify-center gap-1.5 text-white"
          style={{ background: ex.accent }}>
          Start {ex.name} <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

export default function ChallengeExamples() {
  return (
    <section className="relative py-16 md:py-20">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="max-w-2xl mb-12">
          <span className="text-xs font-semibold text-primary uppercase tracking-wide">Worked Examples</span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mt-3 mb-3 text-foreground">
            How a $100K account works
          </h2>
          <p className="text-muted-foreground text-base">
            Follow the exact path from purchase to payout for each challenge type — with real dollar figures at every step.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {EXAMPLES.map((ex, i) => <ExampleCard key={ex.id} ex={ex} i={i} />)}
        </div>
      </div>
    </section>
  );
}