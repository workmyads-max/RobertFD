import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, Shield } from 'lucide-react';

export default function ChallengeCard({ plan, onSelect, badge }) {
  const [showRules, setShowRules] = useState(false);

  const isInstantAccount = plan.type === 'instant_account';
  const isOneStep = plan.type === 'one_step';

  const typeLabel = plan.type === 'two-step' ? 'Two-Step'
    : plan.type === 'instant' ? 'Instant'
    : plan.type === 'instant_light' ? 'Instant Light'
    : plan.type === 'instant_account' ? 'Instant Account'
    : plan.type === 'one_step' ? 'One-Step'
    : 'Challenge';

  const includedFeatures = isInstantAccount
    ? [
        `${plan.buffer_zone_target ?? 5}% Buffer Zone Target`,
        `${plan.daily_dd}% Daily Drawdown`,
        `${plan.max_dd}% Maximum Drawdown`,
        `${plan.consistency_rule_pct ?? 35}% Consistency Rule`,
        `${plan.min_profitable_days ?? 7} Profitable Days Required`,
      ]
    : isOneStep
      ? [
          `${plan.phase1_target}% Reward Target`,
          `${plan.daily_dd}% Daily Drawdown`,
          `${plan.max_dd}% EOD Trailing Drawdown`,
          `${plan.profit_split}% Reward Split`,
          `Best Day Rule ${plan.best_day_rule_pct ?? 50}%`,
        ]
      : [
          `${plan.phase1_target}% Phase 1 Target`,
          ...(plan.type === 'two-step' ? [`${plan.phase2_target}% Phase 2 Target`] : []),
          `${plan.daily_dd}% Daily Drawdown`,
          `${plan.max_dd}% Maximum Drawdown`,
        ];

  const excludedFeatures = isInstantAccount
    ? ['No Evaluation Phases']
    : isOneStep
      ? ['No Phase 2', 'No Time Limit', 'No Min Trading Days']
      : plan.type === 'two-step'
        ? ['Instant Funding', 'Daily Payouts', 'No Evaluation']
        : ['Phase 1 Evaluation', 'Phase 2 Evaluation'];

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="relative rounded-xl border bg-[#18181b] overflow-hidden transition-all duration-200"
      style={{
        borderColor: 'rgba(255,255,255,0.08)',
      }}
    >
      {/* Header Section */}
      <div className="p-5" style={{ background: '#202023' }}>
        {/* Badge */}
        {badge && (
          <div className="absolute top-4 right-4 z-10">
            <span className="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border border-white/20"
              style={{ background: '#FF4500', color: '#FFFFFF' }}>
              {badge}
            </span>
          </div>
        )}

        {/* Plan Name */}
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-[#a1a1aa]" />
          <span className="text-sm font-medium text-[#a1a1aa]">{typeLabel}</span>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-white mb-3">
          {typeLabel} <span className="text-[#FF4500]">${plan.size / 1000}K</span>
        </h3>

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
      </div>

      {/* Feature List Section */}
      <div className="p-5 space-y-3">
        {/* Included Features */}
        <ul className="space-y-2.5">
          {includedFeatures.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3 text-sm text-[#a1a1aa]">
              <CheckCircle2 className="w-4 h-4 text-[#22c55e] flex-shrink-0 mt-0.5" />
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
        <ul className="space-y-2.5">
          {plan.news_trading && (
            <li className="flex items-start gap-3 text-sm text-[#a1a1aa]">
              <CheckCircle2 className="w-4 h-4 text-[#22c55e] flex-shrink-0 mt-0.5" />
              <span>News Trading Allowed</span>
            </li>
          )}
          {plan.overnight_holding && (
            <li className="flex items-start gap-3 text-sm text-[#a1a1aa]">
              <CheckCircle2 className="w-4 h-4 text-[#22c55e] flex-shrink-0 mt-0.5" />
              <span>Overnight Holding Allowed</span>
            </li>
          )}
          {plan.weekend_holding && (
            <li className="flex items-start gap-3 text-sm text-[#a1a1aa]">
              <CheckCircle2 className="w-4 h-4 text-[#22c55e] flex-shrink-0 mt-0.5" />
              <span>Weekend Holding Allowed</span>
            </li>
          )}
          {plan.hedging && (
            <li className="flex items-start gap-3 text-sm text-[#a1a1aa]">
              <CheckCircle2 className="w-4 h-4 text-[#22c55e] flex-shrink-0 mt-0.5" />
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