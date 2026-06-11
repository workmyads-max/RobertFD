import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Zap, Shield, Lightbulb } from 'lucide-react';

export default function ChallengeCard({ plan, onSelect, badge, badgeColor }) {
  const [showRules, setShowRules] = useState(false);

  const getIcon = () => {
    switch (plan.type) {
      case 'two-step': return <Shield className="w-6 h-6" />;
      case 'instant': return <Zap className="w-6 h-6" />;
      case 'instant_light': return <Lightbulb className="w-6 h-6" />;
      default: return <Zap className="w-6 h-6" />;
    }
  };

  const getAccentColor = () => {
    return plan.type === 'instant_light' ? 'text-accent' : 'text-orange-400';
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="relative rounded-2xl border bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm p-4 sm:p-5 md:p-6 transition-all duration-300 overflow-hidden group border-border hover:border-primary/50"
    >
      {/* Background glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-5 bg-primary transition-opacity" />

      {/* Badge */}
      {badge && (
        <div className={`absolute top-3 right-3 sm:top-4 sm:right-4 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold text-white ${badgeColor}`}>
          {badge}
        </div>
      )}

      {/* Icon */}
      <div className={`inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg mb-3 sm:mb-4 ${getAccentColor()} opacity-75`}>
        {getIcon()}
      </div>

      {/* Label & Title */}
      <div className="mb-3 sm:mb-4">
        <div className="text-[9px] sm:text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
          {plan.type === 'two-step' ? 'Evaluation Phase' : plan.type === 'instant' ? 'No Evaluation' : 'Most Affordable'}
        </div>
        <h3 className="text-lg sm:text-xl md:text-2xl font-black text-foreground">{plan.name}</h3>
      </div>

      {/* Description */}
      <p className="text-[11px] sm:text-sm text-muted-foreground mb-4 sm:mb-6 leading-relaxed">
        {plan.type === 'two-step'
          ? 'Prove your skills through a structured 2-phase evaluation. Built for disciplined traders.'
          : plan.type === 'instant'
          ? 'Skip evaluation entirely. Get funded capital the same day and request payouts daily.'
          : 'Most affordable path to funding. Trading drawdown protection moves your safety floor up.'}
      </p>

      {/* Metrics Grid */}
      <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
        {plan.type === 'two-step' && (
          <>
            <div className="flex justify-between items-center">
              <span className="text-[9px] sm:text-xs font-mono uppercase tracking-widest text-muted-foreground">Phase 1 Target</span>
              <span className={`text-xs sm:text-sm font-bold ${getAccentColor()}`}>{plan.phase1_target}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[9px] sm:text-xs font-mono uppercase tracking-widest text-muted-foreground">Phase 2 Target</span>
              <span className={`text-xs sm:text-sm font-bold ${getAccentColor()}`}>{plan.phase2_target}%</span>
            </div>
          </>
        )}
        {(plan.type === 'instant' || plan.type === 'instant_light') && (
          <div className="flex justify-between items-center">
            <span className="text-[9px] sm:text-xs font-mono uppercase tracking-widest text-muted-foreground">Profit Target</span>
            <span className={`text-xs sm:text-sm font-bold ${getAccentColor()}`}>{plan.phase1_target}%</span>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="text-[9px] sm:text-xs font-mono uppercase tracking-widest text-muted-foreground">Daily DD</span>
          <span className={`text-xs sm:text-sm font-bold ${getAccentColor()}`}>{plan.daily_dd}%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[9px] sm:text-xs font-mono uppercase tracking-widest text-muted-foreground">Max DD</span>
          <span className={`text-xs sm:text-sm font-bold ${getAccentColor()}`}>{plan.max_dd}%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[9px] sm:text-xs font-mono uppercase tracking-widest text-muted-foreground">Leverage</span>
          <span className={`text-xs sm:text-sm font-bold ${getAccentColor()}`}>
            {plan.account_type === 'swing' ? plan.leverage_swing : plan.leverage_standard}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[9px] sm:text-xs font-mono uppercase tracking-widest text-muted-foreground">Payouts</span>
          <span className={`text-xs sm:text-sm font-bold ${getAccentColor()}`}>
            {plan.type === 'instant' || plan.type === 'instant_light' ? 'Daily' : 'On Pass'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[9px] sm:text-xs font-mono uppercase tracking-widest text-muted-foreground">Profit Split</span>
          <span className={`text-xs sm:text-sm font-bold ${getAccentColor()}`}>{plan.profit_split}%</span>
        </div>
      </div>

      {/* CTA Button */}
      <button
        onClick={() => onSelect(plan)}
        className="w-full py-4 rounded-xl font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] relative z-10 mb-4"
        style={{ 
          background: 'linear-gradient(135deg, #FF5C00, #FF7A2F)',
          boxShadow: '0 4px 16px rgba(255,92,0,0.3)'
        }}
      >
        Buy Challenge →
      </button>

      {/* Show Rules */}
      <button
        onClick={() => setShowRules(!showRules)}
        className="w-full flex items-center justify-between py-2 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
      >
        <span>Show Rules</span>
        {showRules ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {/* Rules */}
      {showRules && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-2 space-y-2 text-xs text-muted-foreground">
          <div className="flex items-start gap-2">
            <span className="text-primary">✓</span>
            <span>Max Lots: {plan.max_lots}</span>
          </div>
          {plan.news_trading && <div className="flex items-start gap-2"><span className="text-accent">✓</span><span>News Trading Allowed</span></div>}
          {plan.overnight_holding && <div className="flex items-start gap-2"><span className="text-accent">✓</span><span>Overnight Holding Allowed</span></div>}
          {plan.weekend_holding && <div className="flex items-start gap-2"><span className="text-accent">✓</span><span>Weekend Holding Allowed</span></div>}
          {plan.hedging && <div className="flex items-start gap-2"><span className="text-accent">✓</span><span>Hedging Allowed</span></div>}
        </motion.div>
      )}
    </motion.div>
  );
}