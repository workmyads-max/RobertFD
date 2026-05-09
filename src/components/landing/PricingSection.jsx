import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Sparkles } from 'lucide-react';

const twoStepPlans = [
  { capital: '$5,000', price: '$49' },
  { capital: '$10,000', price: '$89' },
  { capital: '$25,000', price: '$235' },
  { capital: '$50,000', price: '$349', popular: true },
  { capital: '$100,000', price: '$517' },
  { capital: '$200,000', price: '$1,089' },
];

const instantPlans = [
  { capital: '$10,000', price: '$270' },
  { capital: '$25,000', price: '$607' },
  { capital: '$50,000', price: '$1,350', popular: true },
  { capital: '$100,000', price: '$2,430' },
  { capital: '$200,000', price: '$4,850' },
];

const twoStepFeatures = ['Limited Time Offer', 'Best Pricing Worldwide', 'Professional Risk Management', 'Up to 80/20 Profit Split'];
const instantFeatures = ['Instant Payouts', 'Daily Withdrawal Requests', 'No Waiting Period', 'Trade Freely'];

function PricingCard({ plan, index, isInstant }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className={`relative glass rounded-2xl p-6 transition-all duration-500 hover:-translate-y-1 group ${
        plan.popular ? 'gradient-border glow-orange-sm' : ''
      }`}
    >
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary rounded-full text-[10px] font-semibold text-white flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> BEST VALUE
        </div>
      )}

      <div className="text-center">
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
          {isInstant ? 'Instant Funding' : 'Challenge'}
        </span>
        <div className="text-3xl font-black mt-2 mb-1 text-foreground">{plan.capital}</div>
        <div className="flex items-center justify-center gap-1 mb-4">
          <span className="text-2xl font-bold text-primary">{plan.price}</span>
        </div>
        <button className="w-full py-3 rounded-full text-sm font-semibold transition-all bg-secondary text-foreground hover:bg-primary hover:text-white group-hover:bg-primary group-hover:text-white flex items-center justify-center gap-2">
          Get Started
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

export default function PricingSection() {
  const [activeTab, setActiveTab] = useState('two-step');

  return (
    <section id="two-step-pricing" className="relative py-32">
      <div className="max-w-[1400px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-xs font-mono text-primary uppercase tracking-widest">Transparent Pricing</span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mt-4 mb-6">
            Choose Your Capital
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-10">
            Industry-leading pricing with the best conditions for serious traders.
          </p>

          {/* Tab Switcher */}
          <div className="inline-flex glass rounded-full p-1.5 mb-4">
            <button
              onClick={() => setActiveTab('two-step')}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                activeTab === 'two-step' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Two-Step Challenge
            </button>
            <button
              onClick={() => setActiveTab('instant')}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                activeTab === 'instant' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Instant Funding
            </button>
          </div>
        </motion.div>

        {/* Features */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {(activeTab === 'two-step' ? twoStepFeatures : instantFeatures).map((f) => (
            <div key={f} className="flex items-center gap-2 px-4 py-2 glass-light rounded-full">
              <Check className="w-4 h-4 text-accent" />
              <span className="text-sm text-foreground">{f}</span>
            </div>
          ))}
        </div>

        {/* Cards Grid */}
        <div id="instant-funding" className={`grid gap-4 ${
          activeTab === 'two-step'
            ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6'
            : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5'
        } max-w-6xl mx-auto`}>
          {(activeTab === 'two-step' ? twoStepPlans : instantPlans).map((plan, i) => (
            <PricingCard
              key={plan.capital}
              plan={plan}
              index={i}
              isInstant={activeTab === 'instant'}
            />
          ))}
        </div>
      </div>
    </section>
  );
}