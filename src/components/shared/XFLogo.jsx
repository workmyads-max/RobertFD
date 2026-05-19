import React from 'react';
import { motion } from 'framer-motion';

export default function XFLogo({ size = 'md', animate = false }) {
  const sizes = {
    sm: { box: 32, text: 11, nameText: 'text-sm', tagText: 'text-sm' },
    md: { box: 40, text: 13, nameText: 'text-base', tagText: 'text-base' },
    lg: { box: 48, text: 16, nameText: 'text-lg', tagText: 'text-lg' },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div className="flex items-center gap-3">
      {/* Icon mark */}
      <div className="relative flex-shrink-0" style={{ width: s.box, height: s.box }}>
        {/* Outer glow ring */}
        {animate && (
          <motion.div
            className="absolute inset-0 rounded-xl"
            style={{ border: '1px solid rgba(255,92,0,0.5)' }}
            animate={{ opacity: [0.4, 0.9, 0.4], scale: [1, 1.08, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        {/* SVG logo mark */}
        <svg
          width={s.box}
          height={s.box}
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            borderRadius: 10,
            background: 'linear-gradient(135deg, #1a0e06 0%, #2d1608 60%, #0e0704 100%)',
            border: '1px solid rgba(255,92,0,0.45)',
            boxShadow: '0 0 14px rgba(255,92,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          {/* X left stroke */}
          <line x1="8" y1="10" x2="20" y2="20" stroke="#FF5C00" strokeWidth="3" strokeLinecap="round" />
          <line x1="8" y1="30" x2="20" y2="20" stroke="#FF5C00" strokeWidth="3" strokeLinecap="round" />
          {/* X right stroke (thinner / accent) */}
          <line x1="20" y1="20" x2="30" y2="12" stroke="rgba(255,92,0,0.55)" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="20" y1="20" x2="30" y2="28" stroke="rgba(255,92,0,0.55)" strokeWidth="2.5" strokeLinecap="round" />
          {/* Accent dot / centre node */}
          <circle cx="20" cy="20" r="2.5" fill="#FF5C00" />
          {/* Subtle top-right chart line */}
          <polyline
            points="24,16 27,13 31,14 33,10"
            fill="none"
            stroke="#CCFF00"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.7"
          />
          {/* Lime dot at top of chart */}
          <circle cx="33" cy="10" r="1.5" fill="#CCFF00" opacity="0.85" />
          {/* Shine streak */}
          <path d="M10 9 Q14 8 13 14" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      {/* Wordmark */}
      <div className="flex flex-col leading-none">
        <span className={`text-foreground font-bold ${s.nameText} tracking-tight`}>XFunded</span>
        <span
          className={`font-black ${s.tagText} tracking-tighter`}
          style={{
            letterSpacing: '-0.03em',
            background: 'linear-gradient(90deg, #FF5C00 0%, #FF8A3D 60%, #CCFF00 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Trader
        </span>
      </div>
    </div>
  );
}