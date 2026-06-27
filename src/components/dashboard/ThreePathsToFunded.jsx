import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Layers, Zap, Lightbulb, ChevronDown, ArrowRight } from 'lucide-react';

const CHALLENGE_PATHS = [
  {
    id: 'two-step',
    icon: Layers,
    iconColor: '#F56C2C',
    badge: null,
    label: 'EVALUATION MODEL',
    labelColor: '#808080',
    title: 'Two-Step',
    description: 'Prove your skills through a structured 2-phase evaluation. Built for disciplined traders who want the highest trust and capital allocation.',
    specs: [
      { label: 'PHASE 1 TARGET', value: '10%' },
      { label: 'PHASE 2 TARGET', value: '5%' },
      { label: 'DAILY DD', value: '5%' },
      { label: 'MAX DD', value: '10%' },
      { label: 'LEVERAGE', value: '1:100 / 1:30' },
      { label: 'REWARD SPLIT', value: '80%', highlight: true },
    ],
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
    specs: [
      { label: 'EVALUATION', value: 'None' },
      { label: 'DAILY DD', value: '5%' },
      { label: 'MAX DD', value: '10%' },
      { label: 'LEVERAGE', value: '1:30' },
      { label: 'PAYOUTS', value: 'Daily' },
      { label: 'REWARD SPLIT', value: '80%', highlight: true },
    ],
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
    specs: [
      { label: 'EVALUATION', value: 'None' },
      { label: 'TRAILING DD', value: '10%' },
      { label: 'DAILY DD', value: '5%' },
      { label: 'LEVERAGE', value: '1:30' },
      { label: 'PRICE', value: '50% Off', highlight: true },
      { label: 'REWARD SPLIT', value: '80%', highlight: true },
    ],
    buttonStyle: 'solid',
    buttonText: 'Get Instant Light →',
    buttonColor: '#CCFF00',
    buttonTextColor: '#000000',
  },
];

export default function ThreePathsToFunded({ onNavigate }) {
  const [expandedCard, setExpandedCard] = useState(null);

  return (
    <div className="rounded-3xl overflow-hidden mt-8" style={{ background: '#141416', border: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Header */}
      <div className="text-center pt-10 pb-4 px-4">
        <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-3">
          Three Paths to <span style={{ color: '#F56C2C' }}>Funded</span> <span style={{ color: '#CCFF00' }}>Trading</span>
        </h2>
        <p className="text-sm text-[#808080] max-w-md mx-auto leading-relaxed">
          Select the model that matches your strategy. Every plan includes institutional rules, real capital, and up to 80% reward split.
        </p>
      </div>
      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 px-4 sm:px-8 py-8 sm:py-10">
        {CHALLENGE_PATHS.map((path) => {
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
                border: `1px solid ${path.id === 'instant_light' ? '#CCFF00' : '#F56C2C'}`,
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