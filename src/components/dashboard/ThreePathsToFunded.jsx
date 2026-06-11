import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Layers, Zap, Lightbulb, ChevronDown, ArrowRight } from 'lucide-react';

const CHALLENGE_PATHS = [
  {
    id: 'two-step',
    icon: Layers,
    iconColor: '#FF6600',
    badge: null,
    label: 'EVALUATION MODEL',
    labelColor: '#707070',
    title: 'Two-Step',
    description: 'Prove your skills through a structured 2-phase evaluation. Built for disciplined traders who want the highest trust and capital allocation.',
    specs: [
      { label: 'PHASE 1 TARGET', value: '10%', highlight: false },
      { label: 'PHASE 2 TARGET', value: '5%', highlight: false },
      { label: 'DAILY DD', value: '5%', highlight: false },
      { label: 'MAX DD', value: '10%', highlight: false },
      { label: 'LEVERAGE', value: '1:100 / 1:30', highlight: false },
      { label: 'PROFIT SPLIT', value: '80%', highlight: true, highlightColor: '#FF6600' },
    ],
    buttonStyle: 'outline',
    buttonText: 'Start Challenge',
    buttonColor: '#FF6600',
  },
  {
    id: 'instant',
    icon: Zap,
    iconColor: '#FF6600',
    badge: 'Most Popular',
    badgeColor: '#FF6600',
    label: 'NO EVALUATION',
    labelColor: '#FF6600',
    title: 'Instant Funding',
    description: 'Skip evaluation entirely. Get funded capital the same day and request payouts daily from day one.',
    specs: [
      { label: 'EVALUATION', value: 'None', highlight: false },
      { label: 'DAILY DD', value: '5%', highlight: false },
      { label: 'MAX DD', value: '10%', highlight: false },
      { label: 'LEVERAGE', value: '1:30', highlight: false },
      { label: 'PAYOUTS', value: 'Daily', highlight: false },
      { label: 'PROFIT SPLIT', value: '80%', highlight: true, highlightColor: '#FF6600' },
    ],
    buttonStyle: 'solid',
    buttonText: 'Get Instant Funding',
    buttonColor: '#FF6600',
    featured: true,
  },
  {
    id: 'instant_light',
    icon: Lightbulb,
    iconColor: '#CCFF00',
    badge: 'Best Value',
    badgeColor: '#CCFF00',
    label: '50% CHEAPER • TRAILING DD',
    labelColor: '#CCFF00',
    title: 'Instant Light',
    description: 'Most affordable path to funding. Trailing drawdown protection moves your safety floor up as your balance grows.',
    specs: [
      { label: 'EVALUATION', value: 'None', highlight: false },
      { label: 'TRAILING DD', value: '10%', highlight: false },
      { label: 'DAILY DD', value: '5%', highlight: false },
      { label: 'LEVERAGE', value: '1:30', highlight: false },
      { label: 'PRICE', value: '50% Off', highlight: true, highlightColor: '#CCFF00' },
      { label: 'PROFIT SPLIT', value: '80%', highlight: true, highlightColor: '#CCFF00' },
    ],
    buttonStyle: 'solid',
    buttonText: 'Get Instant Light',
    buttonColor: '#CCFF00',
    buttonTextColor: '#000000',
    featured: true,
  },
];

export default function ThreePathsToFunded({ onNavigate }) {
  const [expandedCard, setExpandedCard] = useState(null);

  return (
    <div className="rounded-3xl overflow-hidden mt-8" style={{ background: '#121419', border: '1px solid rgba(255,255,255,0.08)' }}>
      {/* Header */}
      <div className="px-6 py-8 sm:px-10 sm:py-12 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 tracking-tight">
          Three Paths to Funded Trading
        </h2>
        <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Select the model that matches your strategy. Every plan includes institutional rules, real capital, and up to 80% profit split.
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 px-4 sm:px-6 pb-6 sm:pb-10">
        {CHALLENGE_PATHS.map((path) => {
          const Icon = path.icon;
          const isExpanded = expandedCard === path.id;
          const borderColor = path.featured 
            ? (path.id === 'instant' ? 'rgba(255,102,0,0.4)' : 'rgba(204,255,0,0.4)')
            : 'rgba(255,255,255,0.08)';
          const glowColor = path.featured
            ? (path.id === 'instant' ? 'rgba(255,102,0,0.15)' : 'rgba(204,255,0,0.15)')
            : 'transparent';

          return (
            <motion.div
              key={path.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="relative rounded-2xl overflow-hidden flex flex-col"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: `1px solid ${borderColor}`,
                boxShadow: path.featured ? `0 0 40px ${glowColor}` : 'none',
              }}
            >
              {/* Badge */}
              {path.badge && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
                  <span
                    className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      background: path.badgeColor,
                      color: path.id === 'instant_light' ? '#000000' : '#FFFFFF',
                    }}
                  >
                    {path.badge}
                  </span>
                </div>
              )}

              {/* Content */}
              <div className="p-5 sm:p-6 flex-1 flex flex-col">
                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 mt-2"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <Icon className="w-6 h-6" style={{ color: path.iconColor }} />
                </div>

                {/* Label */}
                <span className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: path.labelColor }}>
                  {path.label}
                </span>

                {/* Title */}
                <h3 className="text-xl font-bold text-white mb-3">{path.title}</h3>

                {/* Description */}
                <p className="text-xs text-gray-400 leading-relaxed mb-5 flex-1">
                  {path.description}
                </p>

                {/* Specs */}
                <div className="space-y-3 mb-5">
                  {path.specs.map((spec) => (
                    <div key={spec.label} className="flex items-center justify-between py-2 border-b" style={{ borderColor: '#252525' }}>
                      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{spec.label}</span>
                      <span
                        className="text-xs font-bold"
                        style={{ color: spec.highlight ? spec.highlightColor : '#FFFFFF' }}
                      >
                        {spec.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Show Rules Toggle */}
                <button
                  onClick={() => setExpandedCard(isExpanded ? null : path.id)}
                  className="flex items-center justify-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors mb-3"
                >
                  <span>SHOW RULES</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                {/* Expanded Rules */}
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 p-3 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.03)' }}
                  >
                    <div className="text-[10px] text-gray-400 space-y-1.5">
                      <p>• No news trading during high-impact events</p>
                      <p>• No tick scalping or HFT strategies</p>
                      <p>• No copy trading without approval</p>
                      <p>• Account sharing = termination</p>
                    </div>
                  </motion.div>
                )}

                {/* CTA Button */}
                <button
                  onClick={() => onNavigate?.('challenges')}
                  className="w-full py-3.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]"
                  style={{
                    background: path.buttonStyle === 'solid' 
                      ? path.buttonColor 
                      : 'transparent',
                    border: `2px solid ${path.buttonColor}`,
                    color: path.buttonTextColor || path.buttonColor,
                  }}
                >
                  <span className="flex items-center justify-center gap-2">
                    {path.buttonText}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}