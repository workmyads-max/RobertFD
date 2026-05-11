import React from 'react';
import { motion } from 'framer-motion';
import { Layers, Zap, Lightbulb, ArrowRight, CheckCircle2 } from 'lucide-react';
import MiniRocket from './MiniRocket';

const challenges = [
  {
    id: 'two-step',
    icon: Layers,
    title: 'Two-Step Challenge',
    subtitle: 'FTMO-Style Evaluation',
    description: 'Prove your skills through a structured two-phase evaluation with professional trading conditions.',
    features: [
      'High Leverage Trading',
      'Professional Risk Management',
      'Daily Drawdown Rules',
      'Defined Profit Targets',
      'Best Pricing Worldwide',
      'Up to 80/20 Profit Split',
    ],
    cta: 'Start Two-Step Challenge',
    href: '#two-step-pricing',
    accent: false,
  },
  {
    id: 'instant',
    icon: Zap,
    title: 'Instant Funding',
    subtitle: 'No Evaluation Required',
    description: 'Skip the evaluation and start trading with funded capital immediately. Daily payouts available.',
    features: [
      'No Evaluation Phase',
      'Instant Funded Accounts',
      'Instant Payouts',
      'Daily Payout Requests',
      'Faster Scaling Program',
      'Trade From Day One',
    ],
    cta: 'Get Instant Funding',
    href: '#instant-funding',
    accent: true,
  },
  {
    id: 'instant_light',
    icon: Lightbulb,
    title: 'Instant Light',
    subtitle: '50% Cheaper · Trailing DD',
    description: 'The most affordable path to funding. Trailing drawdown protection keeps your floor rising as you profit.',
    features: [
      'No Evaluation Required',
      'Up to 50% Cheaper Pricing',
      'Trailing Drawdown Protection',
      '80/20 Profit Split',
      'Instant Account Access',
      'Trade From Day One',
    ],
    cta: 'Get Instant Light',
    href: '#instant-light',
    accent: false,
    badge: '💡 Best Value',
  },
];

export default function ChallengeTypes() {
  return (
    <section id="challenge" className="relative py-32 overflow-hidden">
      <MiniRocket size={30} className="absolute left-6 top-20 opacity-20" rotate={-25} delay={0} />
      <MiniRocket size={22} className="absolute right-10 top-32 opacity-15" rotate={10} delay={0.5} />
      <div className="max-w-[1400px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <span className="text-xs font-mono text-primary uppercase tracking-widest">Choose Your Path</span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mt-4 mb-6">
            Three Ways to Get Funded
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Select the funding model that aligns with your trading style and ambitions.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {challenges.map((c, i) => {
            const Icon = c.icon;
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className={`relative rounded-2xl p-8 md:p-10 transition-all duration-500 hover:-translate-y-1 ${
                  c.accent
                    ? 'glass gradient-border glow-orange-sm'
                    : 'glass'
                }`}
              >
                {c.accent && (
                  <div className="absolute -top-3 right-8 px-4 py-1 bg-primary rounded-full text-xs font-semibold text-white">
                    Most Popular
                  </div>
                )}
                {c.badge && !c.accent && (
                  <div className="absolute -top-3 right-8 px-4 py-1 rounded-full text-xs font-semibold text-black"
                    style={{ background: '#CCFF00' }}>
                    {c.badge}
                  </div>
                )}

                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${
                  c.accent ? 'bg-primary/20' : 'bg-secondary'
                }`}>
                  <Icon className={`w-7 h-7 ${c.accent ? 'text-primary' : 'text-foreground'}`} />
                </div>

                <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                  {c.subtitle}
                </span>
                <h3 className="text-2xl md:text-3xl font-bold mt-2 mb-4">{c.title}</h3>
                <p className="text-muted-foreground mb-8">{c.description}</p>

                <div className="space-y-3 mb-10">
                  {c.features.map((f) => (
                    <div key={f} className="flex items-center gap-3">
                      <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${c.accent ? 'text-primary' : 'text-accent'}`} />
                      <span className="text-sm text-foreground">{f}</span>
                    </div>
                  ))}
                </div>

                <a
                  href={c.href}
                  className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all group ${
                    c.accent
                      ? 'bg-primary text-white hover:bg-primary/90 glow-orange-sm'
                      : 'border border-border text-foreground hover:border-primary/50'
                  }`}
                >
                  {c.cta}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}