import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Zap, Shield, Lightbulb, Check } from 'lucide-react';

function formatSize(n) {
  if (n >= 1000000) return `$${n / 1000000}M`;
  if (n >= 1000) return `$${n / 1000}K`;
  return `$${n}`;
}

export default function ChallengeCard({ plan, onSelect, badge, badgeColor }) {
  const [showRules, setShowRules] = useState(false);

  const isPopular = !!plan.is_popular;
  const isLight = plan.type === 'instant_light';

  const accentColor = isLight ? '#CCFF00' : '#FF5C00';
  const accentMuted = isLight ? 'rgba(204,255,0,0.12)' : 'rgba(255,92,0,0.1)';
  const accentBorder = isLight ? 'rgba(204,255,0,0.25)' : 'rgba(255,92,0,0.22)';

  const metrics = [];
  if (plan.type === 'two-step') {
    metrics.push({ label: 'Phase 1', value: `${plan.phase1_target}%` });
    metrics.push({ label: 'Phase 2', value: `${plan.phase2_target}%` });
  } else {
    metrics.push({ label: 'Target', value: `${plan.phase1_target}%` });
  }
  metrics.push({ label: 'Daily DD', value: `${plan.daily_dd}%` });
  metrics.push({ label: 'Max DD', value: `${plan.max_dd}%` });
  metrics.push({ label: 'Leverage', value: plan.account_type === 'swing' ? plan.leverage_swing : plan.leverage_standard });
  metrics.push({ label: 'Payouts', value: plan.type === 'instant' || isLight ? 'Daily' : 'On Pass' });
  metrics.push({ label: 'Split', value: `${plan.profit_split}%` });

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="relative flex flex-col rounded-2xl overflow-hidden"
      style={{
        background: isPopular
          ? 'linear-gradient(160deg, rgba(28,18,10,0.98) 0%, rgba(22,14,8,0.99) 100%)'
          : 'rgba(255,255,255,0.03)',
        border: isPopular
          ? `1px solid rgba(255,92,0,0.3)`
          : '1px solid rgba(255,255,255,0.07)',
        boxShadow: isPopular
          ? '0 0 0 1px rgba(255,92,0,0.08) inset, 0 8px 32px rgba(0,0,0,0.3)'
          : '0 2px 12px rgba(0,0,0,0.2)',
      }}
    >
      {/* Popular top accent line */}
      {isPopular && (
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,92,0,0.7) 30%, rgba(255,92,0,0.7) 70%, transparent 100%)' }} />
      )}

      {/* Badge */}
      {badge && (
        <div className="absolute top-4 right-4 z-10">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold"
            style={{
              background: isPopular ? 'rgba(255,92,0,0.18)' : 'rgba(204,255,0,0.12)',
              border: isPopular ? '1px solid rgba(255,92,0,0.35)' : '1px solid rgba(204,255,0,0.25)',
              color: isPopular ? '#FF7A2F' : '#CCFF00',
            }}>
            {isPopular ? '★ Popular' : '50% OFF'}
          </span>
        </div>
      )}

      <div className="flex flex-col flex-1 p-5 sm:p-6">

        {/* Type label */}
        <div className="text-[10px] font-medium uppercase tracking-[0.14em] mb-4"
          style={{ color: 'rgba(255,255,255,0.3)' }}>
          {plan.type === 'two-step' ? 'Two-Step Evaluation' : plan.type === 'instant' ? 'Instant Funding' : 'Instant Light'}
        </div>

        {/* Account size — primary visual focus */}
        <div className="mb-1">
          <span className="text-4xl sm:text-5xl font-bold tracking-tight text-white leading-none">
            {formatSize(plan.size)}
          </span>
        </div>
        <div className="text-xs text-white/30 mb-5">Account Size</div>

        {/* Divider */}
        <div className="h-px mb-5" style={{ background: 'rgba(255,255,255,0.06)' }} />

        {/* Metrics */}
        <div className="space-y-3 mb-6 flex-1">
          {metrics.map(m => (
            <div key={m.label} className="flex items-center justify-between">
              <span className="text-xs text-white/40">{m.label}</span>
              <span className="text-xs font-semibold text-white/80">{m.value}</span>
            </div>
          ))}
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1.5 mb-4">
          <span className="text-2xl font-bold text-white">${plan.price}</span>
          <span className="text-xs text-white/30">one-time fee</span>
        </div>

        {/* CTA */}
        <button
          onClick={() => onSelect(plan)}
          className="w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] mb-3"
          style={{
            background: isPopular
              ? 'linear-gradient(135deg, #FF5C00, #FF7A2F)'
              : isLight
              ? 'rgba(204,255,0,0.12)'
              : 'rgba(255,255,255,0.07)',
            border: isPopular
              ? 'none'
              : isLight
              ? '1px solid rgba(204,255,0,0.3)'
              : '1px solid rgba(255,255,255,0.12)',
            color: isPopular ? '#fff' : isLight ? '#CCFF00' : 'rgba(255,255,255,0.85)',
            boxShadow: isPopular ? '0 4px 16px rgba(255,92,0,0.25)' : 'none',
          }}
        >
          Start Challenge
        </button>

        {/* Show Rules */}
        <button
          onClick={() => setShowRules(!showRules)}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] text-white/25 hover:text-white/50 transition-colors"
        >
          <span>{showRules ? 'Hide' : 'View'} rules</span>
          {showRules ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {/* Rules */}
        {showRules && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 pt-3 space-y-2 border-t"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center gap-2 text-xs text-white/40">
              <Check className="w-3 h-3 text-white/20 flex-shrink-0" />
              <span>Max Lots: {plan.max_lots}</span>
            </div>
            {plan.news_trading && (
              <div className="flex items-center gap-2 text-xs text-white/40">
                <Check className="w-3 h-3 flex-shrink-0" style={{ color: '#CCFF00' }} />
                <span>News Trading Allowed</span>
              </div>
            )}
            {plan.overnight_holding && (
              <div className="flex items-center gap-2 text-xs text-white/40">
                <Check className="w-3 h-3 flex-shrink-0" style={{ color: '#CCFF00' }} />
                <span>Overnight Holding Allowed</span>
              </div>
            )}
            {plan.weekend_holding && (
              <div className="flex items-center gap-2 text-xs text-white/40">
                <Check className="w-3 h-3 flex-shrink-0" style={{ color: '#CCFF00' }} />
                <span>Weekend Holding Allowed</span>
              </div>
            )}
            {plan.hedging && (
              <div className="flex items-center gap-2 text-xs text-white/40">
                <Check className="w-3 h-3 flex-shrink-0" style={{ color: '#CCFF00' }} />
                <span>Hedging Allowed</span>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}