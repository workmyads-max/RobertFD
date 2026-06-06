import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, TrendingUp, Clock, BarChart2, Zap, Shield, Loader2, Target, Flame, Lightbulb } from 'lucide-react';
import Navbar from '../components/landing/Navbar';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

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

const CHALLENGE_TYPES = [
  { key: 'two-step', label: 'Two-Step Challenge' },
  { key: 'instant', label: 'Instant Funding' },
  { key: 'instant_light', label: 'Instant Light' },
];

function formatSize(n) {
  if (n >= 1000000) return `$${n / 1000000}M`;
  if (n >= 1000) return `$${n / 1000}K`;
  return `$${n}`;
}

export default function ChallengeSelect() {
  const urlParams = new URLSearchParams(window.location.search);
  const defaultType = urlParams.get('type') || 'two-step';
  const [challengeType, setChallengeType] = useState(defaultType);
  const [accountType, setAccountType] = useState('standard');
  const [selected, setSelected] = useState(null);

  const { data: allPlans = [], isLoading } = useQuery({
    queryKey: ['challenge-plans'],
    queryFn: () => base44.entities.ChallengePlan.list('sort_order', 100),
  });

  const plans = allPlans.filter(p => p.type === challengeType && p.account_type === accountType);
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
            style={{ background: 'rgba(255,92,0,0.1)', border: '1px solid rgba(255,92,0,0.2)' }}>
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-mono text-primary uppercase tracking-widest">Capital Selection</span>
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6 leading-[1.1]">
            Your Perfect <span className="gradient-text">Trading Tier</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Select your challenge type and account configuration to begin your journey to funded trading. Every tier includes institutional-grade rules and real capital.
          </p>
        </motion.div>

        {/* Challenge type toggle */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex justify-center mb-12">
          <div className="inline-flex rounded-2xl p-1.5"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>
            {CHALLENGE_TYPES.map((t, i) => (
              <button key={t.key} onClick={() => setChallengeType(t.key)}
                className={`px-7 py-3 rounded-xl text-sm font-bold transition-all relative ${
                  challengeType === t.key ? 'text-white' : 'text-muted-foreground hover:text-foreground'
                }`}
                style={challengeType === t.key ? { background: 'linear-gradient(135deg, #FF5C00, #FF8A3D)', boxShadow: '0 8px 24px rgba(255,92,0,0.3)' } : {}}>
                {t.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Account type selector */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto mb-16">
          {Object.entries(ACCOUNT_TYPES).map(([key, cfg]) => (
            <motion.button key={key} onClick={() => setAccountType(key)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="rounded-2xl p-6 text-left transition-all group overflow-hidden relative"
              style={{
                background: accountType === key ? 'linear-gradient(135deg, rgba(255,92,0,0.12), rgba(255,92,0,0.05))' : 'rgba(255,255,255,0.04)',
                border: `2px solid ${accountType === key ? 'rgba(255,92,0,0.6)' : 'rgba(255,255,255,0.1)'}`,
                boxShadow: accountType === key ? '0 0 30px rgba(255,92,0,0.15)' : 'none',
              }}>
              {/* Background glow on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-5 bg-primary transition-opacity" />
              
              <div className="flex items-center gap-4 mb-4 relative z-10">
                <motion.div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: accountType === key ? 'rgba(255,92,0,0.25)' : 'rgba(255,255,255,0.08)' }}>
                  {key === 'standard'
                    ? <Zap className={`w-5 h-5 ${accountType === key ? 'text-primary' : 'text-muted-foreground'}`} />
                    : <Shield className={`w-5 h-5 ${accountType === key ? 'text-primary' : 'text-muted-foreground'}`} />}
                </motion.div>
                <div className="flex-1">
                  <div className={`text-base font-bold ${accountType === key ? 'text-primary' : 'text-foreground'}`}>{cfg.label} Trading</div>
                  <div className="text-xs font-mono text-muted-foreground">{cfg.leverage} Leverage</div>
                </div>
                {accountType === key && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-6 h-6 rounded-full bg-gradient-to-r from-primary to-orange-400 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </motion.div>
                )}
              </div>
              <div className="space-y-2 relative z-10">
                {cfg.features.map((f) => (
                  <div key={f.text} className="flex items-center gap-2.5">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${f.ok ? 'bg-emerald-400' : 'bg-red-500/40'}`} />
                    <span className={`text-xs ${f.ok ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{f.text}</span>
                  </div>
                ))}
              </div>
            </motion.button>
          ))}
        </motion.div>

        {/* Plans grid */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={challengeType}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`grid gap-5 ${
                plans.length <= 3 ? 'md:grid-cols-2 lg:grid-cols-3' :
                plans.length <= 4 ? 'md:grid-cols-2 lg:grid-cols-4' :
                plans.length <= 5 ? 'md:grid-cols-3 lg:grid-cols-5' :
                'md:grid-cols-3 lg:grid-cols-6'
              }`}>
              {plans.map((plan, i) => {
                const leverage = accountType === 'standard' ? plan.leverage_standard : plan.leverage_swing;
                const isSelected = selected?.id === plan.id;

                return (
                  <motion.div key={plan.id}
                    initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                    whileHover={{ y: -8, transition: { duration: 0.2 } }}
                    className="relative rounded-3xl overflow-hidden group h-full flex flex-col"
                    style={{
                      background: plan.is_popular 
                        ? 'linear-gradient(145deg, rgba(255,92,0,0.1), rgba(20,10,4,0.95))' 
                        : 'linear-gradient(145deg, rgba(255,255,255,0.06), rgba(14,14,16,0.9))',
                      border: `2px solid ${plan.is_popular ? 'rgba(255,92,0,0.6)' : 'rgba(255,255,255,0.1)'}`,
                      boxShadow: plan.is_popular ? '0 0 40px rgba(255,92,0,0.2), 0 20px 40px rgba(0,0,0,0.4)' : '0 10px 30px rgba(0,0,0,0.3)',
                    }}>
                    {/* Animated top gradient bar */}
                    <div className="h-1 w-full" style={{ background: plan.is_popular ? 'linear-gradient(90deg, #FF5C00, #FF8A3D, #FF5C00)' : 'rgba(255,255,255,0.1)' }} />

                    {/* Popular badge with animation */}
                    {plan.is_popular && (
                      <motion.div className="absolute top-3 right-3 z-20" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black text-white"
                          style={{ background: 'linear-gradient(135deg, #FF5C00, #FF7A2F)', boxShadow: '0 4px 16px rgba(255,92,0,0.4)' }}>
                          <Flame className="w-3.5 h-3.5" /> Most Popular
                        </div>
                      </motion.div>
                    )}

                    <div className="p-6 pt-8 flex flex-col flex-1">
                      {/* Header section */}
                      <div className="mb-6">
                        <div className="text-center">
                          <div className="text-4xl font-black text-foreground mb-2">{formatSize(plan.size)}</div>
                          <div className="text-xs font-mono text-muted-foreground mb-4 uppercase tracking-widest">
                            {CHALLENGE_TYPES.find(t => t.key === challengeType)?.label} · {accCfg.label}
                          </div>
                          <div className="inline-block px-3 py-1.5 rounded-lg mb-4" style={{ background: 'rgba(255,92,0,0.1)', border: '1px solid rgba(255,92,0,0.3)' }}>
                            <span className="text-2xl font-black text-primary">${plan.price}</span>
                            <span className="text-xs text-muted-foreground font-mono ml-2">one-time</span>
                          </div>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="h-px w-full mb-5" style={{ background: 'rgba(255,255,255,0.05)' }} />

                      {/* Stats grid */}
                      <div className="space-y-3 mb-6 flex-1">
                        {[
                          { label: 'Profit Target', value: `${plan.phase1_target}%`, icon: Target },
                          (challengeType === 'two-step') && { label: 'Phase 2 Target', value: `${plan.phase2_target}%`, icon: Target },
                          { label: 'Max Drawdown', value: `${plan.max_dd}%`, icon: null },
                          { label: 'Daily Drawdown', value: `${plan.daily_dd}%`, icon: null },
                          { label: 'Leverage', value: leverage, icon: Zap },
                          { label: 'Profit Split', value: `${plan.profit_split}%`, icon: TrendingUp },
                        ].filter(Boolean).map(({ label, value }) => (
                          <div key={label} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                            <span className="text-xs font-mono text-muted-foreground">{label}</span>
                            <span className="text-sm font-bold text-foreground">{value}</span>
                          </div>
                        ))}
                      </div>

                      {/* CTA Button */}
                      <motion.button onClick={() => handleSelect(plan)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 mt-auto relative overflow-hidden group/btn"
                        style={plan.is_popular
                          ? { background: 'linear-gradient(135deg, #FF5C00, #FF8A3D)', color: 'white', boxShadow: '0 8px 24px rgba(255,92,0,0.4)' }
                          : { background: 'rgba(255,255,255,0.08)', color: 'hsl(var(--foreground))', border: '1px solid rgba(255,255,255,0.15)' }
                        }>
                        <span>{isSelected ? 'Selected' : 'Select Challenge'}</span>
                        {!isSelected && <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />}
                        {isSelected && <Check className="w-4 h-4" />}
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}

              {plans.length === 0 && (
                <div className="col-span-full text-center py-16 text-muted-foreground">
                  No active plans for this challenge type.
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Rules summary */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="mt-16 rounded-3xl p-8 grid md:grid-cols-3 gap-8"
          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}>
          {[
            { icon: TrendingUp, title: 'Profit Split', desc: 'Up to 80% profit split on all funded accounts. Scaling plan available.' },
            { icon: Clock, title: 'Payout Schedule', desc: 'Request payouts every 14 days. Fast processing within 24-48 hours.' },
            { icon: BarChart2, title: 'Trading Rules', desc: `${accCfg.label} account: ${accCfg.leverage} leverage. ${accountType === 'swing' ? 'News & overnight trading allowed.' : 'Standard trading model.'}` },
          ].map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div key={f.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 + i * 0.1 }} className="flex gap-4">
                <motion.div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(255,92,0,0.15)', border: '1px solid rgba(255,92,0,0.3)' }}>
                  <Icon className="w-5 h-5 text-primary" />
                </motion.div>
                <div>
                  <div className="text-base font-bold text-foreground mb-2">{f.title}</div>
                  <div className="text-sm text-muted-foreground leading-relaxed">{f.desc}</div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}