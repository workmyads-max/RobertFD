import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, Info, ArrowLeft, Zap, Shield, TrendingUp, Clock, BarChart2 } from 'lucide-react';
import Navbar from '../components/landing/Navbar';

const TWO_STEP = [
  { size: 5000,   price: 49,   phase1Target: 10, phase2Target: 5, maxDD: 10, dailyDD: 5, leverage100: '1:100', leverage30: '1:30', split: '80%' },
  { size: 10000,  price: 89,   phase1Target: 10, phase2Target: 5, maxDD: 10, dailyDD: 5, leverage100: '1:100', leverage30: '1:30', split: '80%' },
  { size: 25000,  price: 235,  phase1Target: 10, phase2Target: 5, maxDD: 10, dailyDD: 5, leverage100: '1:100', leverage30: '1:30', split: '80%' },
  { size: 50000,  price: 349,  phase1Target: 10, phase2Target: 5, maxDD: 10, dailyDD: 5, leverage100: '1:100', leverage30: '1:30', split: '80%' },
  { size: 100000, price: 517,  phase1Target: 10, phase2Target: 5, maxDD: 10, dailyDD: 5, leverage100: '1:100', leverage30: '1:30', split: '80%', popular: true },
  { size: 200000, price: 1089, phase1Target: 10, phase2Target: 5, maxDD: 10, dailyDD: 5, leverage100: '1:100', leverage30: '1:30', split: '80%' },
];

const INSTANT = [
  { size: 10000,  price: 270,  target: 8, maxDD: 8, dailyDD: 4, leverage100: '1:100', leverage30: '1:30', split: '80%' },
  { size: 25000,  price: 607,  target: 8, maxDD: 8, dailyDD: 4, leverage100: '1:100', leverage30: '1:30', split: '80%' },
  { size: 50000,  price: 1350, target: 8, maxDD: 8, dailyDD: 4, leverage100: '1:100', leverage30: '1:30', split: '80%', popular: true },
  { size: 100000, price: 2430, target: 8, maxDD: 8, dailyDD: 4, leverage100: '1:100', leverage30: '1:30', split: '80%' },
  { size: 200000, price: 4850, target: 8, maxDD: 8, dailyDD: 4, leverage100: '1:100', leverage30: '1:30', split: '80%' },
];

const ACCOUNT_TYPES = {
  standard: {
    label: 'Standard', leverage: '1:100',
    features: [
      { text: '1:100 Leverage', ok: true },
      { text: 'News trading restricted', ok: false },
      { text: 'No overnight holding', ok: false },
      { text: 'No weekend holding', ok: false },
      { text: 'Aggressive scaling model', ok: true },
    ],
  },
  swing: {
    label: 'Swing', leverage: '1:30',
    features: [
      { text: '1:30 Leverage', ok: true },
      { text: 'News trading ALLOWED', ok: true },
      { text: 'Overnight holding ALLOWED', ok: true },
      { text: 'Weekend holding ALLOWED', ok: true },
      { text: 'Relaxed trading style', ok: true },
    ],
  },
};

function formatSize(n) {
  if (n >= 1000000) return `$${n / 1000000}M`;
  if (n >= 1000) return `$${n / 1000}K`;
  return `$${n}`;
}

export default function ChallengeSelect() {
  const urlParams = new URLSearchParams(window.location.search);
  const defaultType = urlParams.get('type') === 'instant' ? 'instant' : 'two-step';
  const defaultSize = parseInt(urlParams.get('size')) || null;

  const [challengeType, setChallengeType] = useState(defaultType);
  const [accountType, setAccountType] = useState('standard');
  const [selected, setSelected] = useState(null);

  const plans = challengeType === 'two-step' ? TWO_STEP : INSTANT;
  const accCfg = ACCOUNT_TYPES[accountType];

  const handleSelect = (plan) => {
    setSelected(plan);
    setTimeout(() => {
      window.location.href = `/checkout?type=${challengeType}&size=${plan.size}&account=${accountType}`;
    }, 300);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="max-w-[1400px] mx-auto px-6 pt-28 pb-16">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-light mb-5">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Select Your Challenge</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4">
            Choose Your <span className="gradient-text">Capital Tier</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Institutional funding from $5K to $200K. Select your challenge type and account model below.
          </p>
        </motion.div>

        {/* Challenge type toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex glass rounded-full p-1.5">
            {['two-step', 'instant'].map(t => (
              <button key={t} onClick={() => setChallengeType(t)}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all capitalize ${
                  challengeType === t ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
                }`}>
                {t === 'two-step' ? 'Two-Step Challenge' : 'Instant Funding'}
              </button>
            ))}
          </div>
        </div>

        {/* Account type selector */}
        <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto mb-12">
          {Object.entries(ACCOUNT_TYPES).map(([key, cfg]) => (
            <motion.button key={key} onClick={() => setAccountType(key)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="rounded-2xl p-5 text-left transition-all"
              style={{
                background: accountType === key ? 'rgba(255,92,0,0.08)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${accountType === key ? 'rgba(255,92,0,0.5)' : 'rgba(255,255,255,0.08)'}`,
              }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: accountType === key ? 'rgba(255,92,0,0.2)' : 'rgba(255,255,255,0.06)' }}>
                  {key === 'standard' ? <Zap className={`w-4 h-4 ${accountType === key ? 'text-primary' : 'text-muted-foreground'}`} /> : <Shield className={`w-4 h-4 ${accountType === key ? 'text-primary' : 'text-muted-foreground'}`} />}
                </div>
                <div>
                  <div className={`text-sm font-bold ${accountType === key ? 'text-primary' : 'text-foreground'}`}>{cfg.label} Account</div>
                  <div className="text-xs font-mono text-muted-foreground">Leverage {cfg.leverage}</div>
                </div>
                {accountType === key && (
                  <div className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                {cfg.features.map((f) => (
                  <div key={f.text} className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${f.ok ? 'bg-emerald-400' : 'bg-red-400/60'}`} />
                    <span className={`text-xs ${f.ok ? 'text-foreground' : 'text-muted-foreground'}`}>{f.text}</span>
                  </div>
                ))}
              </div>
            </motion.button>
          ))}
        </div>

        {/* Plans grid */}
        <AnimatePresence mode="wait">
          <motion.div key={challengeType}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`grid gap-5 ${challengeType === 'two-step' ? 'md:grid-cols-3 lg:grid-cols-6' : 'md:grid-cols-3 lg:grid-cols-5'}`}>
            {plans.map((plan, i) => {
              const leverage = accountType === 'standard' ? plan.leverage100 : plan.leverage30;
              const isSelected = selected?.size === plan.size;

              return (
                <motion.div key={plan.size}
                  initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="relative rounded-2xl overflow-hidden"
                  style={{
                    background: plan.popular ? 'rgba(20,10,4,0.98)' : 'rgba(14,14,16,0.8)',
                    border: `1px solid ${plan.popular ? 'rgba(255,92,0,0.5)' : 'rgba(255,255,255,0.08)'}`,
                    boxShadow: plan.popular ? '0 0 30px rgba(255,92,0,0.15)' : 'none',
                  }}>
                  {/* Top accent bar */}
                  <div className="h-0.5 w-full" style={{ background: plan.popular ? 'linear-gradient(90deg,#FF5C00,#FF8A3D)' : 'rgba(255,255,255,0.08)' }} />

                  {plan.popular && (
                    <div className="absolute -top-px left-0 right-0 flex justify-center">
                      <div className="px-3 py-0.5 rounded-b-lg text-[10px] font-black text-white"
                        style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)' }}>
                        MOST POPULAR
                      </div>
                    </div>
                  )}

                  <div className="p-5 pt-6">
                    <div className="text-center mb-4">
                      <div className="text-2xl font-black text-foreground mb-0.5">{formatSize(plan.size)}</div>
                      <div className="text-[10px] font-mono text-muted-foreground mb-3 capitalize">
                        {challengeType === 'two-step' ? 'Two-Step Challenge' : 'Instant Funding'} · {accCfg.label}
                      </div>
                      <div className="text-xl font-black" style={{ color: '#FF5C00' }}>${plan.price}</div>
                    </div>

                    <div className="space-y-2 mb-5">
                      {[
                        { label: 'Phase 1 Target', value: challengeType === 'two-step' ? `${plan.phase1Target}%` : `${plan.target}%` },
                        challengeType === 'two-step' && { label: 'Phase 2 Target', value: `${plan.phase2Target}%` },
                        { label: 'Max Drawdown', value: `${plan.maxDD}%` },
                        { label: 'Daily Drawdown', value: `${plan.dailyDD}%` },
                        { label: 'Leverage', value: leverage },
                        { label: 'Profit Split', value: plan.split },
                      ].filter(Boolean).map(({ label, value }) => (
                        <div key={label} className="flex justify-between text-xs">
                          <span className="text-muted-foreground font-mono">{label}</span>
                          <span className="text-foreground font-semibold">{value}</span>
                        </div>
                      ))}
                    </div>

                    <button onClick={() => handleSelect(plan)}
                      className="w-full py-2.5 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] flex items-center justify-center gap-1.5"
                      style={plan.popular
                        ? { background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)', color: 'white', boxShadow: '0 4px 16px rgba(255,92,0,0.35)' }
                        : { background: 'rgba(255,255,255,0.07)', color: 'hsl(var(--foreground))', border: '1px solid rgba(255,255,255,0.12)' }
                      }>
                      {isSelected ? 'Selected ✓' : 'Select Challenge'}
                      {!isSelected && <ArrowRight className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* Rules summary */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="mt-12 rounded-2xl p-6 grid md:grid-cols-3 gap-6"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {[
            { icon: TrendingUp, title: 'Profit Split', desc: `Up to 80% profit split on all funded accounts. Scaling plan available.` },
            { icon: Clock, title: 'Payout Schedule', desc: 'Request payouts every 14 days. Fast processing within 24-48 hours.' },
            { icon: BarChart2, title: 'Trading Rules', desc: `${accCfg.label} account: ${accCfg.leverage} leverage. ${accountType === 'swing' ? 'News & overnight trading allowed.' : 'Standard trading model.'}` },
          ].map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground mb-1">{f.title}</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">{f.desc}</div>
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}