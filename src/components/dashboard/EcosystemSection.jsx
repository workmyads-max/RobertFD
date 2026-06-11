import React from 'react';
import { motion } from 'framer-motion';
import { Target, Shield, DollarSign, Zap, CheckCircle2, ArrowRight } from 'lucide-react';

export default function EcosystemSection({ onNavigate }) {
  const features = [
    {
      icon: Target,
      iconColor: '#CCFF00',
      title: 'PAYOUT-TO-LIVE FUNDING',
      description: 'The bridge nobody else has. Route your XFunded payout straight into your brokerage account. No external transfer. No third broker.',
    },
    {
      icon: Shield,
      iconColor: '#CCFF00',
      title: 'NINJATRADER AS YOUR FCM',
      description: 'Real broker, real rails. Funds held and cleared by NinjaTrader, an established Futures Commission Merchant.',
    },
    {
      icon: DollarSign,
      iconColor: '#CCFF00',
      title: 'COMPETITIVE COMMISSIONS',
      description: '$0.29 micro. $0.99 E-mini. On Pro. Per-side pricing that holds up against any retail futures broker.',
      link: 'See pricing and fees',
    },
    {
      icon: Zap,
      iconColor: '#CCFF00',
      title: 'SAME ECOSYSTEM',
      description: 'Same login as your XFunded dashboard. Same elite support team. Same community. One account, one ecosystem.',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative rounded-3xl overflow-hidden mt-8"
      style={{
        background: '#0B0B0B',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Background grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
      
      {/* Olive/green glow in bottom-left */}
      <div 
        className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full blur-[120px] opacity-[0.08]"
        style={{ background: 'radial-gradient(circle, #CCFF00, transparent)' }}
      />

      {/* Content container */}
      <div className="relative z-10 grid lg:grid-cols-2 gap-8 p-8 sm:p-10 md:p-12">
        {/* Left side - Card */}
        <div className="flex flex-col">
          {/* Header */}
          <div className="mb-8">
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em]">
              BUILT FOR THE NEW ERA OF FUNDED TRADERS
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white mt-3 mb-2 leading-tight">
              YOU'VE EARNED THE PAYOUT.
              <br />
              <span style={{ color: '#CCFF00' }}>SLAY IS WHAT HAPPENS NEXT.</span>
            </h2>
          </div>

          {/* Main card */}
          <div className="relative flex-1">
            {/* Card background */}
            <div 
              className="relative rounded-2xl overflow-hidden p-8 h-full"
              style={{
                background: '#F4F4F4',
                border: '2px solid rgba(204,255,0,0.6)',
              }}
            >
              {/* Neon yellow corner accents */}
              <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 rounded-tl-xl" style={{ borderColor: '#CCFF00' }} />
              <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 rounded-tr-xl" style={{ borderColor: '#CCFF00' }} />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 rounded-bl-xl" style={{ borderColor: '#CCFF00' }} />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 rounded-br-xl" style={{ borderColor: '#CCFF00' }} />

              {/* Pink graffiti X overlay */}
              <div 
                className="absolute bottom-4 right-4 text-9xl font-black opacity-20 pointer-events-none select-none"
                style={{ 
                  color: '#FF00FF',
                  transform: 'rotate(-15deg)',
                  fontFamily: 'system-ui',
                }}
              >
                ✕
              </div>

              {/* Card content */}
              <div className="relative z-10">
                {/* Logo placeholder */}
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#0B0B0B' }}>
                    <span className="text-xl font-black" style={{ color: '#CCFF00' }}>XF</span>
                  </div>
                  <span className="text-lg font-black text-[#0B0B0B]">XFUNDED</span>
                </div>

                {/* Heading */}
                <h3 className="text-2xl font-black text-[#0B0B0B] mb-6 leading-tight">
                  ONE ACCOUNT,<br />ONE ECOSYSTEM
                </h3>

                {/* Bullet points */}
                <div className="space-y-3">
                  {[
                    'Same login as your XFunded dashboard.',
                    'Same elite support team.',
                    'Same community.',
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: '#CCFF00' }} />
                      <span className="text-sm font-semibold text-[#0B0B0B]">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Features grid + Bull */}
        <div className="flex flex-col">
          {/* Features grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="p-5 rounded-2xl"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                    style={{ background: `${feature.iconColor}15`, border: `1px solid ${feature.iconColor}30` }}>
                    <Icon className="w-5 h-5" style={{ color: feature.iconColor }} />
                  </div>
                  <h4 className="text-[11px] font-bold text-white uppercase tracking-wide mb-2">
                    {feature.title}
                  </h4>
                  <p className="text-xs text-white/40 leading-relaxed mb-2">
                    {feature.description}
                  </p>
                  {feature.link && (
                    <a 
                      href="#" 
                      className="text-xs font-semibold underline decoration-1 underline-offset-2"
                      style={{ color: '#CCFF00' }}
                    >
                      {feature.link}
                    </a>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Bull graphic placeholder */}
          <div className="flex-1 flex items-end justify-end relative">
            <div className="relative w-full max-w-md">
              {/* Bull image container */}
              <div className="relative">
                {/* Placeholder bull graphic - bronze statue style */}
                <svg viewBox="0 0 400 300" className="w-full h-auto">
                  {/* Bull silhouette - bronze toned */}
                  <defs>
                    <linearGradient id="bullGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#8B7355" />
                      <stop offset="50%" stopColor="#6B5344" />
                      <stop offset="100%" stopColor="#4A3728" />
                    </linearGradient>
                    <filter id="bullGlow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  
                  {/* Bull body */}
                  <ellipse cx="220" cy="180" rx="120" ry="70" fill="url(#bullGradient)" filter="url(#bullGlow)" />
                  
                  {/* Bull head */}
                  <ellipse cx="100" cy="150" rx="50" ry="40" fill="url(#bullGradient)" filter="url(#bullGlow)" />
                  
                  {/* Horns */}
                  <path d="M 80 130 Q 60 100 70 80 Q 90 90 100 110" fill="#D4AF37" stroke="#8B7355" strokeWidth="2" />
                  <path d="M 110 125 Q 130 95 140 75 Q 120 85 115 105" fill="#D4AF37" stroke="#8B7355" strokeWidth="2" />
                  
                  {/* Legs */}
                  <rect x="180" y="240" width="20" height="50" rx="10" fill="url(#bullGradient)" />
                  <rect x="240" y="240" width="20" height="50" rx="10" fill="url(#bullGradient)" />
                  <rect x="150" y="240" width="20" height="50" rx="10" fill="url(#bullGradient)" />
                  <rect x="270" y="240" width="20" height="50" rx="10" fill="url(#bullGradient)" />
                  
                  {/* Tail */}
                  <path d="M 330 170 Q 360 180 370 200" stroke="url(#bullGradient)" strokeWidth="8" fill="none" strokeLinecap="round" />
                  
                  {/* "SLAY" on forehead - pink graffiti */}
                  <text x="85" y="145" fontSize="16" fontWeight="900" fill="#FF00FF" fontFamily="system-ui" 
                    style={{ textShadow: '0 0 10px rgba(255,0,255,0.8)' }} transform="rotate(-10 85 145)">
                    SLAY
                  </text>
                  
                  {/* "BULLISH ON XFUNDED" on side - yellow/green graffiti */}
                  <text x="180" y="190" fontSize="24" fontWeight="900" fill="#CCFF00" fontFamily="system-ui"
                    style={{ textShadow: '0 0 15px rgba(204,255,0,0.6)' }} transform="rotate(-5 180 190)">
                    BULLISH ON
                  </text>
                  <text x="200" y="215" fontSize="24" fontWeight="900" fill="#CCFF00" fontFamily="system-ui"
                    style={{ textShadow: '0 0 15px rgba(204,255,0,0.6)' }} transform="rotate(-5 200 215)">
                    XFUNDED
                  </text>
                </svg>
                
                {/* Neon pink glow outline effect */}
                <div 
                  className="absolute inset-0 rounded-full blur-xl opacity-30 pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse, rgba(255,0,255,0.4), transparent 70%)' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA button */}
      <div className="px-8 sm:px-10 pb-8 sm:pb-10">
        <button
          onClick={() => onNavigate?.('marketplace')}
          className="w-full sm:w-auto px-8 py-4 rounded-2xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg, #CCFF00, #B8E600)',
            color: '#0B0B0B',
            boxShadow: '0 8px 32px rgba(204,255,0,0.3)',
          }}
        >
          <span className="flex items-center justify-center gap-2">
            START YOUR CHALLENGE
            <ArrowRight className="w-4 h-4" />
          </span>
        </button>
      </div>
    </motion.div>
  );
}