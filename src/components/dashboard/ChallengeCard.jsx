import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, Shield } from 'lucide-react';

export default function ChallengeCard({ plan, onSelect, badge }) {
  const [showRules, setShowRules] = useState(false);

  const includedFeatures = [
    `${plan.phase1_target}% Phase 1 Target`,
    `${plan.phase2_target}% Phase 2 Target`,
    `${plan.daily_dd}% Daily Drawdown`,
    `${plan.max_dd}% Maximum Drawdown`,
  ];

  const excludedFeatures = [
    'Instant Funding',
    'Daily Payouts',
    'No Evaluation',
  ];

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="relative rounded-xl border bg-[#18181b] overflow-hidden transition-all duration-200"
      style={{
        borderColor: 'rgba(255,255,255,0.08)',
      }}
    >
      {/* Header Section */}
      <div className="p-4 sm:p-5" style={{ background: '#202023' }}>
        {/* Badge */}
        {badge && (
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10">
            <span className="px-2 py-1 sm:px-2.5 sm:py-1 rounded-full text-[8px] sm:text-[9px] font-bold uppercase tracking-wider border border-white/20 whitespace-nowrap"
              style={{ background: '#FF4500', color: '#FFFFFF' }}>
              {badge}
            </span>
          </div>
        )}

        {/* Plan Name */}
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#a1a1aa]" />
          <span className="text-[10px] sm:text-sm font-medium text-[#a1a1aa]">Two-Step</span>
        </div>

        {/* Title */}
        <h3 className="text-base sm:text-xl font-bold text-white mb-3 break-words">
          Two-Step <span className="text-[#FF4500]">${plan.size / 1000}K</span>
        </h3>

        {/* CTA Button */}
        <button
          onClick={() => onSelect(plan)}
          className="w-full py-3 sm:py-3.5 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90 min-h-[44px]"
          style={{ 
            background: '#FF4500',
          }}
        >
          Select Plan
        </button>
      </div>

      {/* Feature List Section */}
      <div className="p-4 sm:p-5 space-y-3">
        {/* Included Features */}
        <ul className="space-y-2 sm:space-y-2.5">
          {includedFeatures.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2 sm:gap-3 text-[10px] sm:text-sm text-[#a1a1aa] break-words">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#22c55e] flex-shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {/* Divider */}
        <div className="flex items-center gap-3 py-2">
          <span className="bg-[#3f3f46] h-[1px] flex-1" />
          <span className="text-[#71717a] shrink-0 text-xs uppercase">Challenge Rules</span>
          <span className="bg-[#3f3f46] h-[1px] flex-1" />
        </div>

        {/* Excluded Features / Rules */}
        <ul className="space-y-2 sm:space-y-2.5">
          <li className="flex items-start gap-2 sm:gap-3 text-[10px] sm:text-sm text-[#a1a1aa] break-words">
            <span className="text-[#a1a1aa] flex-shrink-0 mt-0.5">•</span>
            <span className="break-words">Max Lots: {plan.max_lots}</span>
          </li>
          {plan.news_trading && (
            <li className="flex items-start gap-2 sm:gap-3 text-[10px] sm:text-sm text-[#a1a1aa] break-words">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#22c55e] flex-shrink-0 mt-0.5" />
              <span>News Trading Allowed</span>
            </li>
          )}
          {plan.overnight_holding && (
            <li className="flex items-start gap-2 sm:gap-3 text-[10px] sm:text-sm text-[#a1a1aa] break-words">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#22c55e] flex-shrink-0 mt-0.5" />
              <span>Overnight Holding Allowed</span>
            </li>
          )}
          {plan.weekend_holding && (
            <li className="flex items-start gap-2 sm:gap-3 text-[10px] sm:text-sm text-[#a1a1aa] break-words">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#22c55e] flex-shrink-0 mt-0.5" />
              <span>Weekend Holding Allowed</span>
            </li>
          )}
          {plan.hedging && (
            <li className="flex items-start gap-2 sm:gap-3 text-[10px] sm:text-sm text-[#a1a1aa] break-words">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#22c55e] flex-shrink-0 mt-0.5" />
              <span>Hedging Allowed</span>
            </li>
          )}
        </ul>

        {/* Show Rules Toggle */}
        <button
          onClick={() => setShowRules(!showRules)}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-[10px] font-semibold text-[#71717a] hover:text-white transition-colors"
        >
          <span>Full Rules</span>
          {showRules ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {/* Expanded Rules */}
        {showRules && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }} 
            className="pt-3 border-t border-[#3f3f46] space-y-2 text-[10px] text-[#71717a]"
          >
            <div>• No tick scalping or HFT strategies</div>
            <div>• No copy trading without approval</div>
            <div>• Account sharing = termination</div>
            <div>• Profit split: {plan.profit_split}%</div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}