import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, Sparkles, Star } from 'lucide-react';

const twoStepPlans = [
  { capital: '$5,000', price: '$49', raw: 5000 },
  { capital: '$10,000', price: '$89', raw: 10000 },
  { capital: '$25,000', price: '$235', raw: 25000 },
  { capital: '$50,000', price: '$349', raw: 50000 },
  { capital: '$100,000', price: '$517', raw: 100000, bestValue: true },
  { capital: '$200,000', price: '$1,089', raw: 200000 },
];

const instantPlans = [
  { capital: '$10,000', price: '$270', raw: 10000 },
  { capital: '$25,000', price: '$607', raw: 25000 },
  { capital: '$50,000', price: '$1,350', raw: 50000, popular: true },
  { capital: '$100,000', price: '$2,430', raw: 100000 },
  { capital: '$200,000', price: '$4,850', raw: 200000 },
];

const twoStepFeatures = ['Limited Time Offer', 'Best Pricing Worldwide', 'Professional Risk Management', 'Up to 80/20 Profit Split'];
const instantFeatures = ['Instant Payouts', 'Daily Withdrawal Requests', 'No Waiting Period', 'Trade Freely'];

function PricingCard({ plan, index, isInstant }) {
  const isBestValue = plan.bestValue;
  const isPopular = plan.popular;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.07 }}
      className={`relative rounded-2xl p-5 transition-all duration-500 hover:-translate-y-2 group ${
        isBestValue
          ? 'scale-105'
          : ''
      }`}
      style={
        isBestValue
          ? {
              background: 'linear-gradient(145deg, rgba(18,14,10,0.98), rgba(22,16,10,0.95))',
              border: '1px solid rgba(255,92,0,0.45)',
              boxShadow: '0 0 30px rgba(255,92,0,0.18), 0 0 80px rgba(255,92,0,0.06)',
            }
          : isPopular
          ? {
              background: 'rgba(14,14,16,0.9)',
              border: '1px solid rgba(204,255,0,0.25)',
              boxShadow: '0 0 20px rgba(204,255,0,0.06)',
            }
          : {
              background: 'rgba(14,14,16,0.7)',
              border: '1px solid rgba(255,255,255,0.07)',
            }
      }
    >
      {/* Best Value badge */}
      {isBestValue && (
        <>
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full flex items-center gap-1.5"
            style={{
              background: 'linear-gradient(90deg, #FF5C00, #FF8A3D)',
              boxShadow: '0 0 16px rgba(255,92,0,0.5)',
            }}
          >
            <Star className="w-3 h-3 text-white fill-white" />
            <span className="text-[11px] font-black text-white uppercase tracking-wider">Best Value</span>
            <Star className="w-3 h-3 text-white fill-white" />
          </motion.div>
          {/* Animated ring */}
          <motion.div
            animate={{ opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ border: '1px solid rgba(255,92,0,0.6)' }}
          />
        </>
      )}

      {isPopular && !isBestValue && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full flex items-center gap-1"
          style={{ background: 'rgba(204,255,0,0.12)', border: '1px solid rgba(204,255,0,0.25)' }}>
          <Sparkles className="w-3 h-3" style={{ color: '#CCFF00' }} />
          <span className="text-[10px] font-semibold" style={{ color: '#CCFF00' }}>POPULAR</span>
        </div>
      )}

      <div className="text-center">
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
          {isInstant ? 'Instant Funding' : 'Challenge'}
        </span>
        <div className={`text-2xl font-black mt-2 mb-1 ${isBestValue ? 'text-primary' : 'text-foreground'}`}>
          {plan.capital}
        </div>
        <div className="flex items-baseline justify-center gap-0.5 mb-4">
          <span className="text-lg font-black" style={{ color: isBestValue ? '#FF5C00' : 'hsl(var(--foreground))' }}>
            {plan.price}
          </span>
        </div>
        <button
          className={`w-full py-2.5 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 group-hover:gap-2 ${
            isBestValue
              ? 'text-white'
              : 'bg-secondary text-foreground hover:bg-primary hover:text-white group-hover:bg-primary group-hover:text-white'
          }`}
          style={isBestValue ? {
            background: 'linear-gradient(90deg, #FF5C00, #FF7A2F)',
            boxShadow: '0 4px 16px rgba(255,92,0,0.3)',
          } : {}}
        >
          Get Started
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
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
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mt-4 mb-4">
            Choose Your Capital
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-10">
            Industry-leading pricing with the best conditions for serious traders.
          </p>

          {/* Tab Switcher */}
          <div className="inline-flex glass rounded-full p-1.5">
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

        {/* Feature Pills */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-wrap justify-center gap-3 mb-14"
          >
            {(activeTab === 'two-step' ? twoStepFeatures : instantFeatures).map((f) => (
              <div key={f} className="flex items-center gap-2 px-4 py-2 glass-light rounded-full border border-border/30">
                <Check className="w-3.5 h-3.5 text-accent" />
                <span className="text-sm text-foreground">{f}</span>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Cards */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            id="instant-funding"
            className={`grid gap-4 items-end ${
              activeTab === 'two-step'
                ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6'
                : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5'
            } max-w-6xl mx-auto`}
          >
            {(activeTab === 'two-step' ? twoStepPlans : instantPlans).map((plan, i) => (
              <PricingCard key={plan.capital} plan={plan} index={i} isInstant={activeTab === 'instant'} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}