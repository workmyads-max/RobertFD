import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Layers, Zap, Lightbulb, ChevronDown, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// Static visual template per path type — design stays identical, only specs
// values are populated from live ChallengePlan records.
const PATH_TEMPLATE = [
  {
    id: 'two-step',
    icon: Layers,
    iconColor: '#F56C2C',
    badge: null,
    label: 'EVALUATION MODEL',
    labelColor: '#808080',
    title: 'Two-Step',
    description: 'Prove your skills through a structured 2-phase evaluation. Built for disciplined traders who want the highest trust and capital allocation.',
    buttonStyle: 'outline',
    buttonText: 'Start Challenge →',
    buttonColor: '#F56C2C',
  },
  {
    id: 'instant',
    icon: Zap,
    iconColor: '#F56C2C',
    badge: 'MOST POPULAR',
    badgeColor: '#F56C2C',
    label: 'NO EVALUATION',
    labelColor: '#F56C2C',
    title: 'Instant Funding',
    description: 'Skip evaluation entirely. Get funded capital the same day and request payouts daily from day one.',
    buttonStyle: 'solid',
    buttonText: 'Get Instant Funding →',
    buttonColor: '#F56C2C',
    buttonTextColor: '#FFFFFF',
  },
  {
    id: 'instant_light',
    icon: Lightbulb,
    iconColor: '#CCFF00',
    badge: 'BEST VALUE',
    badgeColor: '#CCFF00',
    label: '50% CHEAPER - TRAILING DD',
    labelColor: '#CCFF00',
    title: 'Instant Light',
    description: 'Most affordable path to funding. Trailing drawdown protection moves your safety floor up as your balance grows.',
    buttonStyle: 'solid',
    buttonText: 'Get Instant Light →',
    buttonColor: '#CCFF00',
    buttonTextColor: '#000000',
  },
];

// Build the specs list for a path from a live ChallengePlan record.
function buildSpecs(pathId, plan) {
  const pct = (n) => (n == null ? '—' : `${n}%`);
  if (!plan) {
    // Fallback so the card never renders empty if a plan is missing
    if (pathId === 'two-step') {
      return [
        { label: 'PHASE 1 TARGET', value: '—' },
        { label: 'PHASE 2 TARGET', value: '—' },
        { label: 'DAILY DD', value: '—' },
        { label: 'MAX DD', value: '—' },
        { label: 'LEVERAGE', value: '—' },
        { label: 'REWARD SPLIT', value: '—', highlight: true },
      ];
    }
    if (pathId === 'instant') {
      return [
        { label: 'EVALUATION', value: 'None' },
        { label: 'DAILY DD', value: '—' },
        { label: 'MAX DD', value: '—' },
        { label: 'LEVERAGE', value: '—' },
        { label: 'PAYOUTS', value: 'Daily' },
        { label: 'REWARD SPLIT', value: '—', highlight: true },
      ];
    }
    // instant_light
    return [
      { label: 'EVALUATION', value: 'None' },
      { label: 'TRAILING DD', value: '—' },
      { label: 'DAILY DD', value: '—' },
      { label: 'LEVERAGE', value: '—' },
      { label: 'PRICE', value: '50% Off', highlight: true },
      { label: 'REWARD SPLIT', value: '—', highlight: true },
    ];
  }

  const leverage = `${plan.leverage_standard || '1:100'} / ${plan.leverage_swing || '1:30'}`;

  if (pathId === 'two-step') {
    return [
      { label: 'PHASE 1 TARGET', value: pct(plan.phase1_target) },
      { label: 'PHASE 2 TARGET', value: pct(plan.phase2_target) },
      { label: 'DAILY DD', value: pct(plan.daily_dd) },
      { label: 'MAX DD', value: pct(plan.max_dd) },
      { label: 'LEVERAGE', value: leverage },
      { label: 'REWARD SPLIT', value: pct(plan.profit_split), highlight: true },
    ];
  }
  if (pathId === 'instant') {
    return [
      { label: 'EVALUATION', value: 'None' },
      { label: 'DAILY DD', value: pct(plan.daily_dd) },
      { label: 'MAX DD', value: pct(plan.max_dd) },
      { label: 'LEVERAGE', value: plan.leverage_swing || '1:30' },
      { label: 'PAYOUTS', value: 'Daily' },
      { label: 'REWARD SPLIT', value: pct(plan.profit_split), highlight: true },
    ];
  }
  // instant_light — trailing drawdown uses max_dd
  return [
    { label: 'EVALUATION', value: 'None' },
    { label: 'TRAILING DD', value: pct(plan.max_dd) },
    { label: 'DAILY DD', value: pct(plan.daily_dd) },
    { label: 'LEVERAGE', value: plan.leverage_swing || '1:30' },
    { label: 'PRICE', value: '50% Off', highlight: true },
    { label: 'REWARD SPLIT', value: pct(plan.profit_split), highlight: true },
  ];
}

export default function ThreePathsToFunded({ onNavigate }) {
  const [expandedCard, setExpandedCard] = useState(null);

  // Fetch live challenge plans — same source as the marketplace so the
  // cards always reflect the latest admin-configured values.
  const { data: allPlans = [] } = useQuery({
    queryKey: ['challenge-plans-paths'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getChallengePlans', {});
      const data = res?.data?.plans || res?.plans || [];
      return Array.isArray(data) ? data : [];
    },
    staleTime: 60000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Pick the most representative active+visible plan for each of the 3 types.
  // Prefer a 100K size when available, else the smallest active size.
  const planByType = useMemo(() => {
    const active = allPlans.filter(p => p.is_active && p.is_visible !== false);
    const pick = (type) => {
      const oftype = active.filter(p => p.type === type);
      if (!oftype.length) return null;
      const bySize = [...oftype].sort((a, b) => (a.size || 0) - (b.size || 0));
      return bySize.find(p => p.size === 100000) || bySize[0];
    };
    return {
      'two-step': pick('two-step'),
      'instant': pick('instant'),
      'instant_light': pick('instant_light'),
    };
  }, [allPlans]);

  const maxRewardSplit = useMemo(() => {
    const vals = Object.values(planByType).map(p => p?.profit_split || 0).filter(Boolean);
    return vals.length ? Math.max(...vals) : 80;
  }, [planByType]);

  const paths = PATH_TEMPLATE.map(t => ({
    ...t,
    specs: buildSpecs(t.id, planByType[t.id]),
  }));

  return (
    <div className="rounded-3xl overflow-hidden mt-8" style={{ background: '#141416', border: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Header */}
      <div className="text-center pt-10 pb-4 px-4">
        <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-3">
          Three Paths to <span style={{ color: '#F56C2C' }}>Funded</span> <span style={{ color: '#CCFF00' }}>Trading</span>
        </h2>
        <p className="text-sm text-[#808080] max-w-md mx-auto leading-relaxed">
          Select the model that matches your strategy. Every plan includes institutional rules, real capital, and up to {maxRewardSplit}% reward split.
        </p>
      </div>
      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 px-4 sm:px-8 py-8 sm:py-10">
        {paths.map((path) => {
          const Icon = path.icon;
          const isExpanded = expandedCard === path.id;
          const isInstantLight = path.id === 'instant_light';

          return (
            <motion.div
              key={path.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="relative rounded-2xl overflow-hidden flex flex-col p-6"
              style={{
                background: '#141416',
                border: `1px solid ${isInstantLight ? '#CCFF00' : '#F56C2C'}`,
              }}
            >
              {/* Badge */}
              {path.badge && (
                <div className="absolute top-4 left-4 z-10">
                  <span
                    className="px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider"
                    style={{
                      background: path.badgeColor,
                      color: isInstantLight ? '#000000' : '#FFFFFF',
                    }}
                  >
                    {path.badge}
                  </span>
                </div>
              )}

              {/* Content */}
              <div className="flex-1 flex flex-col mt-6">
                {/* Icon */}
                <div className="mb-4">
                  <Icon className="w-8 h-8" style={{ color: path.iconColor }} />
                </div>

                {/* Label */}
                <span className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: path.labelColor }}>
                  {path.label}
                </span>

                {/* Title */}
                <h3 className="text-lg font-bold text-white mb-3">{path.title}</h3>

                {/* Description */}
                <p className="text-xs text-[#A0A0A0] leading-relaxed mb-6 flex-1">
                  {path.description}
                </p>

                {/* Specs */}
                <div className="space-y-2.5 mb-6">
                  {path.specs.map((spec) => (
                    <div key={spec.label} className="flex items-center justify-between">
                      <span className="text-[9px] font-medium text-[#808080] uppercase tracking-wide">{spec.label}</span>
                      <span
                        className="text-xs font-bold"
                        style={{ color: spec.highlight ? (isInstantLight ? '#CCFF00' : '#F56C2C') : '#FFFFFF' }}
                      >
                        {spec.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Show Rules Toggle */}
                <button
                  onClick={() => setExpandedCard(isExpanded ? null : path.id)}
                  className="flex items-center justify-center gap-1.5 text-[10px] font-semibold text-[#808080] hover:text-white transition-colors mb-4"
                >
                  <span>SHOW RULES</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                {/* Expanded Rules */}
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 pb-4 border-b"
                    style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                  >
                    <div className="text-[9px] text-[#808080] space-y-1.5">
                      <p>• No news trading during high-impact events</p>
                      <p>• No tick scalping or HFT strategies</p>
                      <p>• No copy trading without approval</p>
                      <p>• Account sharing = termination</p>
                    </div>
                  </motion.div>
                )}

                {/* CTA Button */}
                <button
                  onClick={() => onNavigate?.('marketplace')}
                  className="w-full py-3.5 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] text-center"
                  style={{
                    background: path.buttonStyle === 'solid'
                      ? path.buttonColor
                      : 'transparent',
                    border: `1.5px solid ${path.buttonColor}`,
                    color: path.buttonTextColor || path.buttonColor,
                  }}
                >
                  {path.buttonText}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}