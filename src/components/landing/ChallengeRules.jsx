import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Minus, Zap, Layers, Star, TrendingUp, Shield } from 'lucide-react';

const RuleBadge = ({ type, label }) => {
  if (type === 'allowed') {
    return (
      <div className="flex items-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-500/8 border border-emerald-500/15">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        <span className="text-sm text-emerald-300">{label}</span>
      </div>
    );
  }
  if (type === 'restricted') {
    return (
      <div className="flex items-center gap-2 py-2.5 px-3 rounded-xl bg-red-500/8 border border-red-500/15">
        <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
        <span className="text-sm text-red-300">{label}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 py-2.5 px-3 rounded-xl bg-white/4 border border-white/8">
      <Minus className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
};

const MetricRow = ({ label, value, highlight }) => (
  <div className={`flex items-center justify-between py-3 border-b border-white/5 last:border-0 ${highlight ? 'text-primary' : ''}`}>
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className={`text-sm font-semibold font-mono ${highlight ? 'text-primary' : 'text-foreground'}`}>{value}</span>
  </div>
);

const twoStepPhase1 = {
  metrics: [
    { label: 'Profit Target', value: '10%' },
    { label: 'Daily Drawdown', value: '5%' },
    { label: 'Max Drawdown', value: '10%' },
    { label: 'Min Trading Days', value: 'None' },
    { label: 'Leverage', value: '1:100 / 1:30*' },
    { label: 'Profit Split', value: 'Up to 80%', highlight: true },
  ],
  rules: [
    { type: 'restricted', label: 'News Trading (1:100)' },
    { type: 'restricted', label: 'Overnight Holding (1:100)' },
    { type: 'restricted', label: 'Weekend Holding (1:100)' },
    { type: 'allowed', label: 'News Trading (1:30)' },
    { type: 'allowed', label: 'Overnight Holding (1:30)' },
    { type: 'allowed', label: 'Weekend Holding (1:30)' },
  ],
  highlight: 'No Consistency Rules',
};

const twoStepPhase2 = {
  metrics: [
    { label: 'Profit Target', value: '5%' },
    { label: 'Daily Drawdown', value: '5%' },
    { label: 'Max Drawdown', value: '10%' },
    { label: 'Min Trading Days', value: 'None' },
    { label: 'Leverage', value: '1:100 / 1:30*' },
    { label: 'Profit Split', value: 'Up to 80%', highlight: true },
  ],
  rules: [
    { type: 'restricted', label: 'News Trading (1:100)' },
    { type: 'restricted', label: 'Overnight Holding (1:100)' },
    { type: 'restricted', label: 'Weekend Holding (1:100)' },
    { type: 'allowed', label: 'News Trading (1:30)' },
    { type: 'allowed', label: 'Overnight Holding (1:30)' },
    { type: 'allowed', label: 'Weekend Holding (1:30)' },
  ],
  highlight: 'No Consistency Rules',
};

const instantFundingRules = {
  metrics: [
    { label: 'Daily Drawdown', value: '5%' },
    { label: 'Max Drawdown', value: '10%' },
    { label: 'Leverage', value: '1:30' },
    { label: 'Evaluation', value: 'None' },
    { label: 'Payouts', value: 'Daily' },
    { label: 'Profit Split', value: 'Up to 80%', highlight: true },
  ],
  rules: [
    { type: 'allowed', label: 'News Trading Allowed' },
    { type: 'allowed', label: 'Overnight Holding Allowed' },
    { type: 'allowed', label: 'Weekend Holding Allowed' },
    { type: 'allowed', label: 'Instant Funded Account' },
    { type: 'allowed', label: 'Daily Withdrawal Requests' },
    { type: 'allowed', label: 'Instant Payouts' },
  ],
  highlight: 'No Consistency Rules',
};

function RulesCard({ title, phase, data, glowColor, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, rgba(14,14,16,0.95), rgba(18,18,24,0.9))',
        border: `1px solid ${glowColor}25`,
        boxShadow: `0 0 40px ${glowColor}08`,
      }}
    >
      {/* Top glow */}
      <div
        className="absolute -top-8 left-1/2 -translate-x-1/2 w-48 h-20 rounded-full blur-2xl opacity-40 pointer-events-none"
        style={{ background: glowColor }}
      />

      {/* Header */}
      <div className="p-6 border-b border-white/6">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-mono uppercase tracking-widest" style={{ color: glowColor }}>
            {phase}
          </span>
        </div>
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
      </div>

      {/* Metrics */}
      <div className="px-6 pt-4">
        {data.metrics.map((m) => (
          <MetricRow key={m.label} {...m} />
        ))}
      </div>

      {/* Rules */}
      <div className="px-6 py-4 space-y-2">
        {data.rules.map((r) => (
          <RuleBadge key={r.label} {...r} />
        ))}
      </div>

      {/* No Consistency Highlight */}
      <div className="mx-6 mb-6">
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl border"
          style={{
            background: `${glowColor}10`,
            borderColor: `${glowColor}30`,
          }}
        >
          <Star className="w-4 h-4 flex-shrink-0" style={{ color: glowColor }} />
          <span className="text-sm font-bold" style={{ color: glowColor }}>
            {data.highlight}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default function ChallengeRules() {
  const [activeTab, setActiveTab] = useState('two-step');

  return (
    <section className="relative py-20">
      <div className="max-w-[1400px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-xs font-mono text-primary uppercase tracking-widest">Complete Ruleset</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight mt-4 mb-4">
            Full Challenge Rules
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            100% transparent. No hidden conditions. Know exactly what it takes to get funded.
          </p>
        </motion.div>

        {/* Tab */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex glass rounded-full p-1.5">
            <button
              onClick={() => setActiveTab('two-step')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                activeTab === 'two-step' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Layers className="w-4 h-4" /> Two-Step Challenge
            </button>
            <button
              onClick={() => setActiveTab('instant')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                activeTab === 'instant' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Zap className="w-4 h-4" /> Instant Funding
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'two-step' ? (
            <motion.div
              key="two-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
              className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto"
            >
              <RulesCard
                title="Phase 1 - Evaluation"
                phase="Two-Step Challenge"
                data={twoStepPhase1}
                glowColor="#FF5C00"
                delay={0}
              />
              <RulesCard
                title="Phase 2 - Verification"
                phase="Two-Step Challenge"
                data={twoStepPhase2}
                glowColor="#FF8A3D"
                delay={0.1}
              />
              {/* Footnote */}
              <div className="md:col-span-2 glass-light rounded-xl px-5 py-3 text-xs text-muted-foreground flex items-start gap-2 border border-border/30">
                <Shield className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">*Leverage Note:</strong> 1:100 leverage applies restrictions on news trading, overnight and weekend holding.
                  Choosing 1:30 leverage unlocks all trading styles including news, overnight & weekend positions.
                </span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="instant"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
              className="max-w-md mx-auto"
            >
              <RulesCard
                title="Instant Funded Account"
                phase="Instant Funding"
                data={instantFundingRules}
                glowColor="#CCFF00"
                delay={0}
              />
              <div className="mt-4 glass-light rounded-xl px-5 py-3 text-xs text-muted-foreground flex items-start gap-2 border border-border/30">
                <Zap className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">Instant Access:</strong> No evaluation phase. Deposit your plan fee and start trading with a fully funded account from day one.
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}