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
      whileHover={{ scale: 1.01 }}
      className="relative rounded-xl border bg-[#1A1D23] p-4 transition-all duration-200"
      style={{
        borderColor: 'rgba(255,255,255,0.08)',
      }}
    >
      {/* Badge */}
      {badge && (
        <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[9px] font-bold ${
          badgeColor === 'bg-[#CCFF00]' ? 'text-black' : 'text-white'
        }`}
          style={{ background: badgeColor || '#FF5C00' }}>
          {badge}
        </div>
      )}

      {/* Header */}
      <div className="mb-3">
        <div className="text-[10px] font-bold text-[#8B8F95] uppercase tracking-wider mb-1">
          {plan.type === 'two-step' ? '2-Step Challenge' : plan.type === 'instant' ? 'Instant Funding' : 'Instant Light'}
        </div>
        <h3 className="text-lg font-bold text-white">{plan.name}</h3>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {plan.type === 'two-step' && (
          <>
            <div className="rounded-lg p-2.5" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="text-[9px] text-[#8B8F95] mb-0.5">Phase 1</div>
              <div className={`text-sm font-bold ${getAccentColor()}`}>+{plan.phase1_target}%</div>
            </div>
            <div className="rounded-lg p-2.5" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="text-[9px] text-[#8B8F95] mb-0.5">Phase 2</div>
              <div className={`text-sm font-bold ${getAccentColor()}`}>+{plan.phase2_target}%</div>
            </div>
          </>
        )}
        {(plan.type === 'instant' || plan.type === 'instant_light') && (
          <div className="rounded-lg p-2.5 col-span-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="text-[9px] text-[#8B8F95] mb-0.5">Profit Target</div>
            <div className={`text-sm font-bold ${getAccentColor()}`}>+{plan.phase1_target}%</div>
          </div>
        )}
        <div className="rounded-lg p-2.5" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="text-[9px] text-[#8B8F95] mb-0.5">Daily DD</div>
          <div className={`text-sm font-bold ${getAccentColor()}`}>{plan.daily_dd}%</div>
        </div>
        <div className="rounded-lg p-2.5" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="text-[9px] text-[#8B8F95] mb-0.5">Max DD</div>
          <div className={`text-sm font-bold ${getAccentColor()}`}>{plan.max_dd}%</div>
        </div>
        <div className="rounded-lg p-2.5" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="text-[9px] text-[#8B8F95] mb-0.5">Leverage</div>
          <div className={`text-sm font-bold ${getAccentColor()}`}>
            {plan.account_type === 'swing' ? plan.leverage_swing : plan.leverage_standard}
          </div>
        </div>
        <div className="rounded-lg p-2.5" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="text-[9px] text-[#8B8F95] mb-0.5">Split</div>
          <div className={`text-sm font-bold ${getAccentColor()}`}>{plan.profit_split}%</div>
        </div>
      </div>

      {/* CTA Button */}
      <button
        onClick={() => onSelect(plan)}
        className="w-full py-3 rounded-lg text-sm font-bold text-white transition-all"
        style={{ 
          background: '#FF5C00',
        }}
      >
        Select Plan
      </button>

      {/* Show Rules */}
      <button
        onClick={() => setShowRules(!showRules)}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 mt-2 text-[10px] font-semibold text-[#8B8F95] hover:text-white transition-colors"
      >
        <span>Trading Rules</span>
        {showRules ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {/* Rules */}
      {showRules && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-3 pt-3 border-t border-white/5 space-y-2 text-[11px] text-[#8B8F95]">
          <div className="flex items-start gap-2">
            <span className="text-[#FF5C00]">•</span>
            <span>Max Lots: {plan.max_lots}</span>
          </div>
          {plan.news_trading && <div className="flex items-start gap-2"><span className="text-[#CCFF00]">✓</span><span>News Trading Allowed</span></div>}
          {plan.overnight_holding && <div className="flex items-start gap-2"><span className="text-[#CCFF00]">✓</span><span>Overnight Holding Allowed</span></div>}
          {plan.weekend_holding && <div className="flex items-start gap-2"><span className="text-[#CCFF00]">✓</span><span>Weekend Holding Allowed</span></div>}
          {plan.hedging && <div className="flex items-start gap-2"><span className="text-[#CCFF00]">✓</span><span>Hedging Allowed</span></div>}
        </motion.div>
      )}
    </motion.div>
  );
}