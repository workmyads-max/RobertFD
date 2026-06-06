import React from 'react';
import { motion } from 'framer-motion';

export default function XFLogo({ size = 'md', animate = false }) {
  const sizes = {
    sm: { icon: 32, width: 140, height: 40 },
    md: { icon: 48, width: 210, height: 60 },
    lg: { icon: 72, width: 320, height: 90 },
    xl: { icon: 96, width: 420, height: 120 },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div className="flex items-center gap-2.5">
      {/* Icon mark - Premium X with candlesticks */}
      <div className="relative flex-shrink-0" style={{ width: s.icon, height: s.icon }}>
        {animate && (
          <motion.div
            className="absolute inset-0 rounded-lg"
            style={{ border: '2px solid rgba(255,122,0,0.5)' }}
            animate={{ opacity: [0.4, 0.9, 0.4], scale: [1, 1.08, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        <svg
          width={s.icon}
          height={s.icon}
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(255,122,0,0.08) 0%, rgba(255,122,0,0.03) 100%)',
            border: '1px solid rgba(255,122,0,0.35)',
            boxShadow: '0 0 20px rgba(255,122,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
        >
          {/* Main X - bold aggressive strokes */}
          <rect x="22" y="12" width="14" height="96" rx="7" fill="#FF7A00" transform="rotate(-35 29 60)" />
          <rect x="84" y="12" width="14" height="96" rx="7" fill="#FF7A00" transform="rotate(35 91 60)" />
          
          {/* White accent swoosh */}
          <rect x="58" y="10" width="9" height="52" rx="4.5" fill="white" fillOpacity="0.95" transform="rotate(25 62.5 36)" />
          
          {/* Candlestick chart elements */}
          <g transform="translate(72, 52)">
            {/* Bullish candle */}
            <line x1="0" y1="10" x2="0" y2="3" stroke="#FF7A00" strokeWidth="2" strokeLinecap="round" />
            <rect x="-3" y="3" width="6" height="7" fill="#FF7A00" />
            
            {/* Bearish candle */}
            <line x1="10" y1="7" x2="10" y2="15" stroke="#FF7A00" strokeWidth="2" strokeLinecap="round" />
            <rect x="7" y="7" width="6" height="8" fill="none" stroke="#FF7A00" strokeWidth="1.5" />
            
            {/* Bullish candle */}
            <line x1="20" y1="12" x2="20" y2="2" stroke="#FF7A00" strokeWidth="2" strokeLinecap="round" />
            <rect x="17" y="2" width="6" height="10" fill="#FF7A00" />
          </g>
        </svg>
      </div>

      {/* Wordmark */}
      <div className="flex flex-col leading-none">
        <span 
          className="font-black tracking-tight text-white"
          style={{ 
            fontSize: size === 'lg' ? '28px' : size === 'xl' ? '36px' : size === 'sm' ? '16px' : '22px',
            textShadow: '0 0 20px rgba(255,122,0,0.3)'
          }}
        >
          XFunded
        </span>
        <span 
          className="font-bold tracking-[0.2em]"
          style={{ 
            fontSize: size === 'lg' ? '12px' : size === 'xl' ? '16px' : size === 'sm' ? '7px' : '9px',
            color: '#FF7A00',
            marginTop: '2px'
          }}
        >
          TRADER
        </span>
      </div>
    </div>
  );
}