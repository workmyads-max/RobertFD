import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function ChallengeCard({ plan, onSelect, badge }) {
  const [showRules, setShowRules] = useState(false);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="relative rounded-xl border bg-[#18181b] p-5 transition-all duration-200"
      style={{
        borderColor: badge ? '#CCFF00' : '#F56C2C',
      }}
    >
      {/* Badge */}
      {badge && (
        <div className="absolute top-4 right-4 z-10">
          <span className="px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider"
            style={{ background: '#27272a', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.1)' }}>
            {badge}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="mb-4">
        <div className="text-[9px] font-bold text-[#71717a] uppercase tracking-wider mb-1.5">
          2-STEP CHALLENGE
        </div>
        <h3 className="text-xl font-bold text-white">
          Two-Step <span className="text-[#FF4500]">${plan.size / 1000}K</span>
        </h3>
      </div>

      {/* Metrics Grid - 3 rows x 2 columns */}
      <div className="grid grid-cols-2 gap-2.5 mb-5">
        <div className="rounded-lg p-3" style={{ background: '#27272a' }}>
          <div className="text-[9px] text-[#71717a] mb-1">Phase 1</div>
          <div className="text-sm font-bold text-[#FF4500]">+{plan.phase1_target}%</div>
        </div>
        <div className="rounded-lg p-3" style={{ background: '#27272a' }}>
          <div className="text-[9px] text-[#71717a] mb-1">Phase 2</div>
          <div className="text-sm font-bold text-[#FF4500]">+{plan.phase2_target}%</div>
        </div>
        <div className="rounded-lg p-3" style={{ background: '#27272a' }}>
          <div className="text-[9px] text-[#71717a] mb-1">Daily DD</div>
          <div className="text-sm font-bold text-[#FF4500]">{plan.daily_dd}%</div>
        </div>
        <div className="rounded-lg p-3" style={{ background: '#27272a' }}>
          <div className="text-[9px] text-[#71717a] mb-1">Max DD</div>
          <div className="text-sm font-bold text-[#FF4500]">{plan.max_dd}%</div>
        </div>
        <div className="rounded-lg p-3" style={{ background: '#27272a' }}>
          <div className="text-[9px] text-[#71717a] mb-1">Leverage</div>
          <div className="text-sm font-bold text-[#FF4500]">
            {plan.account_type === 'swing' ? plan.leverage_swing : plan.leverage_standard}
          </div>
        </div>
        <div className="rounded-lg p-3" style={{ background: '#27272a' }}>
          <div className="text-[9px] text-[#71717a] mb-1">Split</div>
          <div className="text-sm font-bold text-[#FF4500]">{plan.profit_split}%</div>
        </div>
      </div>

      {/* CTA Button */}
      <button
        onClick={() => onSelect(plan)}
        className="w-full py-3.5 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90"
        style={{ 
          background: '#FF4500',
        }}
      >
        Select Plan
      </button>

      {/* Show Rules */}
      <button
        onClick={() => setShowRules(!showRules)}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 mt-3 text-[10px] font-semibold text-[#71717a] hover:text-white transition-colors"
      >
        <span>Trading Rules</span>
        {showRules ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {/* Rules */}
      {showRules && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }} 
          animate={{ opacity: 1, height: 'auto' }} 
          exit={{ opacity: 0, height: 0 }} 
          className="mt-3 pt-3 border-t border-white/5 space-y-2 text-[10px] text-[#71717a]"
        >
          <div>• Max Lots: {plan.max_lots}</div>
          {plan.news_trading && <div>✓ News Trading Allowed</div>}
          {plan.overnight_holding && <div>✓ Overnight Holding Allowed</div>}
          {plan.weekend_holding && <div>✓ Weekend Holding Allowed</div>}
          {plan.hedging && <div>✓ Hedging Allowed</div>}
        </motion.div>
      )}
    </motion.div>
  );
}