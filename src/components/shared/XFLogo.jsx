import React from 'react';
import { motion } from 'framer-motion';

/**
 * XFunded Logo — clean modern mark with bold wordmark
 * 
 * Icon: A bold angular "X" inside a rounded-square,
 *       with a sharp orange slash accent and subtle glow.
 * 
 * Sizes: sm | md | lg | xl
 */

function LogoIcon({ px, animate }) {
  return (
    <div className="relative flex-shrink-0" style={{ width: px, height: px }}>
      {animate && (
        <motion.div
          className="absolute inset-0 rounded-xl"
          style={{ background: 'radial-gradient(circle, rgba(255,92,0,0.35) 0%, transparent 70%)' }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      <svg
        width={px}
        height={px}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block' }}
      >
        <defs>
          <linearGradient id="xfIconBg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1a1a1a" />
            <stop offset="100%" stopColor="#0d0d0d" />
          </linearGradient>
          <linearGradient id="xfOrange" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FF7A00" />
            <stop offset="100%" stopColor="#FF4500" />
          </linearGradient>
          <filter id="xfGlow">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Background square with rounded corners */}
        <rect x="2" y="2" width="96" height="96" rx="22" fill="url(#xfIconBg)" />
        <rect x="2" y="2" width="96" height="96" rx="22" fill="none" stroke="rgba(255,92,0,0.45)" strokeWidth="1.5" />

        {/* Bold X — two crossing strokes */}
        {/* Top-left → Bottom-right */}
        <line x1="22" y1="22" x2="78" y2="78" stroke="url(#xfOrange)" strokeWidth="15" strokeLinecap="round" filter="url(#xfGlow)" />
        {/* Top-right → Bottom-left */}
        <line x1="78" y1="22" x2="22" y2="78" stroke="url(#xfOrange)" strokeWidth="15" strokeLinecap="round" filter="url(#xfGlow)" />

        {/* Crisp white slash accent — top-right diagonal */}
        <line x1="62" y1="18" x2="84" y2="50" stroke="white" strokeWidth="6" strokeLinecap="round" opacity="0.9" />

        {/* Small orange dot at center intersection */}
        <circle cx="50" cy="50" r="5" fill="#FF7A00" opacity="0.0" />
      </svg>
    </div>
  );
}

export default function XFLogo({ size = 'md', animate = false }) {
  const cfg = {
    sm:  { px: 34,  name: 16, sub: 7  },
    md:  { px: 44,  name: 21, sub: 8.5 },
    lg:  { px: 64,  name: 30, sub: 11 },
    xl:  { px: 84,  name: 38, sub: 14 },
  };
  const { px, name, sub } = cfg[size] || cfg.md;

  return (
    <div className="flex items-center gap-3">
      <LogoIcon px={px} animate={animate} />

      {/* Wordmark */}
      <div className="flex flex-col leading-none select-none">
        {/* "XFunded" — bold, tight tracking */}
        <div
          style={{
            fontSize: name,
            fontWeight: 900,
            letterSpacing: '-0.03em',
            lineHeight: 1,
            color: 'white',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          <span style={{ color: '#FF7A00' }}>X</span>
          <span>Funded</span>
        </div>

        {/* "TRADER" sub-label */}
        <div
          style={{
            fontSize: sub,
            fontWeight: 700,
            letterSpacing: '0.22em',
            color: 'rgba(255,255,255,0.38)',
            marginTop: 3,
            fontFamily: "'Inter', sans-serif",
            textTransform: 'uppercase',
          }}
        >
          Trader
        </div>
      </div>
    </div>
  );
}