import React from 'react';
import { motion } from 'framer-motion';

/**
 * MiniRocket - small decorative animated rocket SVG
 * Props:
 *   size   - pixel size (default 48)
 *   style  - additional inline styles
 *   className - additional classes
 *   delay  - float animation delay in seconds
 *   rotate - rotation in degrees (default -30 = tilted up-right)
 */
export default function MiniRocket({ size = 48, style = {}, className = '', delay = 0, rotate = -30 }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay }}
      className={`pointer-events-none select-none ${className}`}
      style={{ ...style }}
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay }}
        style={{ rotate }}
      >
        <svg width={size} height={size * 1.8} viewBox="0 0 60 108" fill="none" xmlns="http://www.w3.org/2000/svg"
          style={{ filter: 'drop-shadow(0 0 6px rgba(255,92,0,0.5))' }}>
          {/* Body */}
          <path d="M30 3 C18 3, 8 22, 7 56 L53 56 C52 22, 42 3, 30 3Z" fill="url(#mb)" />
          {/* Nose */}
          <path d="M30 3 C22 3, 16 14, 14 26 L46 26 C44 14, 38 3, 30 3Z" fill="url(#mn)" />
          {/* Window */}
          <circle cx="30" cy="38" r="7" fill="none" stroke="rgba(255,92,0,0.7)" strokeWidth="1.5" />
          <circle cx="30" cy="38" r="4" fill="rgba(255,92,0,0.18)" />
          {/* Left fin */}
          <path d="M7 56 L1 78 L16 66Z" fill="url(#mf)" />
          {/* Right fin */}
          <path d="M53 56 L59 78 L44 66Z" fill="url(#mf)" />
          {/* Nozzle */}
          <rect x="23" y="54" width="14" height="7" rx="2" fill="rgba(12,6,2,0.95)" stroke="rgba(255,92,0,0.25)" strokeWidth="0.8" />
          {/* Flame outer */}
          <motion.path
            d="M23 61 Q19 76, 30 84 Q41 76, 37 61Z"
            fill="url(#mfo)"
            animate={{ scaleY: [1, 1.25, 0.8, 1.15, 1], scaleX: [1, 0.9, 1.1, 0.95, 1] }}
            style={{ transformOrigin: '30px 61px' }}
            transition={{ duration: 0.55, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Flame inner */}
          <motion.path
            d="M27 61 Q25 74, 30 80 Q35 74, 33 61Z"
            fill="url(#mfi)"
            animate={{ scaleY: [1, 1.3, 0.75, 1.2, 1] }}
            style={{ transformOrigin: '30px 61px' }}
            transition={{ duration: 0.4, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Highlight */}
          <path d="M26 10 Q28 6, 30 5 L30 50 Q28 50, 26 47Z" fill="rgba(255,255,255,0.06)" />
          <defs>
            <linearGradient id="mb" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#1a0a02" />
              <stop offset="50%" stopColor="#2d1506" />
              <stop offset="100%" stopColor="#0e0704" />
            </linearGradient>
            <linearGradient id="mn" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FF5C00" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#FF8A3D" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="mf" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FF5C00" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#1a0a02" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="mfo" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF5C00" stopOpacity="0.95" />
              <stop offset="70%" stopColor="#FF8A3D" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#FF5C00" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="mfi" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFCC00" stopOpacity="0.9" />
              <stop offset="60%" stopColor="#FF8A3D" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#FF5C00" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>
    </motion.div>
  );
}