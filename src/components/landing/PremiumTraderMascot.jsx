import React from 'react';
import { motion } from 'framer-motion';

export default function PremiumTraderMascot() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Main Character Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="relative"
        style={{ maxWidth: '420px' }}
      >
        {/* Glow Backdrop */}
        <motion.div
          animate={{
            opacity: [0.3, 0.5, 0.3],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-full blur-3xl"
          style={{
            background: 'radial-gradient(circle, rgba(255,92,0,0.3) 0%, rgba(139,92,246,0.15) 40%, transparent 70%)',
          }}
        />

        {/* Character SVG */}
        <svg viewBox="0 0 400 500" className="w-full h-auto drop-shadow-2xl">
          <defs>
            {/* Skin gradient */}
            <linearGradient id="skinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f5d0b0" />
              <stop offset="50%" stopColor="#e8b895" />
              <stop offset="100%" stopColor="#d4a57a" />
            </linearGradient>

            {/* Hoodie gradient - premium dark */}
            <linearGradient id="hoodieGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1a0a0e" />
              <stop offset="40%" stopColor="#2d151a" />
              <stop offset="100%" stopColor="#0f0508" />
            </linearGradient>

            {/* Orange accent gradient */}
            <linearGradient id="orangeAccent" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF5C00" />
              <stop offset="50%" stopColor="#FF7A2F" />
              <stop offset="100%" stopColor="#FF5C00" />
            </linearGradient>

            {/* Blue tech gradient */}
            <linearGradient id="blueTech" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0095FF" />
              <stop offset="100%" stopColor="#6366F1" />
            </linearGradient>

            {/* Glass visor gradient */}
            <linearGradient id="visorGrad" x1="0%" y1="0%" x2="0%" y2="1">
              <stop offset="0%" stopColor="rgba(0,149,255,0.4)" />
              <stop offset="50%" stopColor="rgba(99,102,241,0.3)" />
              <stop offset="100%" stopColor="rgba(255,92,0,0.2)" />
            </linearGradient>

            {/* Glow filter */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Inner glow for visor */}
            <filter id="innerGlow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="arithmetic" k2="1.5" k3="0.8" />
            </filter>
          </defs>

          {/* Back glow aura */}
          <motion.ellipse
            cx="200"
            cy="280"
            rx="140"
            ry="180"
            fill="url(#orangeAccent)"
            opacity="0.08"
            animate={{
              rx: [140, 150, 140],
              ry: [180, 190, 180],
            }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Body/Hoodie */}
          <motion.path
            d="M120 220 Q100 280, 95 380 L95 480 L305 480 L305 380 Q300 280, 280 220 Q250 180, 200 180 Q150 180, 120 220"
            fill="url(#hoodieGrad)"
            stroke="rgba(255,92,0,0.15)"
            strokeWidth="1.5"
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.3 }}
          />

          {/* Hoodie front pocket detail */}
          <path
            d="M145 320 Q145 360, 160 370 L240 370 Q255 360, 255 320 Q200 310, 145 320"
            fill="rgba(255,92,0,0.05)"
            stroke="rgba(255,92,0,0.1)"
            strokeWidth="1"
          />

          {/* Shoulders */}
          <path
            d="M120 220 Q110 240, 115 280"
            fill="none"
            stroke="rgba(255,92,0,0.2)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M280 220 Q290 240, 285 280"
            fill="none"
            stroke="rgba(255,92,0,0.2)"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Neck */}
          <rect x="175" y="160" width="50" height="40" fill="url(#skinGrad)" opacity="0.9" />

          {/* Head base */}
          <ellipse cx="200" cy="140" rx="55" ry="65" fill="url(#skinGrad)" />

          {/* Hood outer */}
          <motion.path
            d="M145 130 Q135 80, 155 60 Q175 40, 200 35 Q225 40, 245 60 Q265 80, 255 130 Q260 150, 250 165 L245 140 Q245 100, 200 95 Q155 100, 155 140 L150 165 Q140 150, 145 130"
            fill="url(#hoodieGrad)"
            stroke="rgba(255,92,0,0.2)"
            strokeWidth="1.5"
            animate={{
              d: [
                "M145 130 Q135 80, 155 60 Q175 40, 200 35 Q225 40, 245 60 Q265 80, 255 130 Q260 150, 250 165 L245 140 Q245 100, 200 95 Q155 100, 155 140 L150 165 Q140 150, 145 130",
                "M145 128 Q135 78, 155 58 Q175 38, 200 33 Q225 38, 245 58 Q265 78, 255 128 Q260 148, 250 163 L245 138 Q245 98, 200 93 Q155 98, 155 138 L150 163 Q140 148, 145 128",
                "M145 130 Q135 80, 155 60 Q175 40, 200 35 Q225 40, 245 60 Q265 80, 255 130 Q260 150, 250 165 L245 140 Q245 100, 200 95 Q155 100, 155 140 L150 165 Q140 150, 145 130",
              ],
            }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Hood opening glow */}
          <ellipse
            cx="200"
            cy="125"
            rx="42"
            ry="48"
            fill="none"
            stroke="rgba(255,92,0,0.12)"
            strokeWidth="2"
          />

          {/* Tech Visor/Glasses - Futuristic */}
          <motion.g
            animate={{
              opacity: [0.85, 0.95, 0.85],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            {/* Visor base */}
            <path
              d="M155 125 L245 125 Q255 125, 258 135 L260 155 Q260 165, 245 165 L155 165 Q140 165, 140 155 L142 135 Q145 125, 155 125"
              fill="url(#visorGrad)"
              stroke="rgba(0,149,255,0.4)"
              strokeWidth="2"
              filter="url(#glow)"
            />

            {/* Visor inner tech lines */}
            <motion.path
              d="M160 140 L240 140"
              stroke="rgba(0,149,255,0.5)"
              strokeWidth="1.5"
              strokeLinecap="round"
              animate={{
                opacity: [0.4, 0.8, 0.4],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.path
              d="M160 150 L240 150"
              stroke="rgba(255,92,0,0.4)"
              strokeWidth="1"
              strokeLinecap="round"
              animate={{
                opacity: [0.3, 0.7, 0.3],
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
            />

            {/* Side tech details */}
            <circle cx="150" cy="145" r="3" fill="rgba(0,149,255,0.6)" filter="url(#glow)" />
            <circle cx="250" cy="145" r="3" fill="rgba(255,92,0,0.6)" filter="url(#glow)" />

            {/* Data stream lines */}
            <motion.path
              d="M165 130 L165 160"
              stroke="rgba(0,149,255,0.3)"
              strokeWidth="1"
              strokeDasharray="2,2"
              animate={{
                opacity: [0.2, 0.6, 0.2],
              }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.path
              d="M180 130 L180 160"
              stroke="rgba(255,92,0,0.25)"
              strokeWidth="1"
              strokeDasharray="2,2"
              animate={{
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
            />
            <motion.path
              d="M220 130 L220 160"
              stroke="rgba(0,149,255,0.25)"
              strokeWidth="1"
              strokeDasharray="2,2"
              animate={{
                opacity: [0.2, 0.6, 0.2],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
            />
          </motion.g>

          {/* Face details - subtle */}
          <ellipse cx="200" cy="175" rx="18" ry="12" fill="rgba(200,150,130,0.4)" />

          {/* Neck detail - tech collar */}
          <path
            d="M175 195 Q200 205, 225 195"
            fill="none"
            stroke="rgba(255,92,0,0.3)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="200" cy="200" r="4" fill="rgba(0,149,255,0.5)" filter="url(#glow)" />

          {/* Chest emblem/logo */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
          >
            <circle cx="200" cy="270" r="18" fill="rgba(255,92,0,0.08)" stroke="rgba(255,92,0,0.3)" strokeWidth="1.5" />
            <motion.path
              d="M192 270 L200 262 L208 270 L200 278 Z"
              fill="url(#orangeAccent)"
              filter="url(#glow)"
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.g>

          {/* Floating tech elements around character */}
          <motion.g
            animate={{
              y: [0, -8, 0],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            {/* Left floating element */}
            <circle cx="100" cy="200" r="6" fill="rgba(0,149,255,0.15)" stroke="rgba(0,149,255,0.4)" strokeWidth="1.5" filter="url(#glow)" />
            <motion.circle
              cx="100"
              cy="200"
              r="3"
              fill="rgba(0,149,255,0.6)"
              animate={{
                opacity: [0.4, 0.9, 0.4],
              }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.g>

          <motion.g
            animate={{
              y: [0, 10, 0],
            }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          >
            {/* Right floating element */}
            <circle cx="300" cy="240" r="8" fill="rgba(255,92,0,0.12)" stroke="rgba(255,92,0,0.35)" strokeWidth="1.5" filter="url(#glow)" />
            <motion.circle
              cx="300"
              cy="240"
              r="4"
              fill="rgba(255,92,0,0.6)"
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.g>

          <motion.g
            animate={{
              y: [0, -6, 0],
            }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          >
            {/* Top floating element */}
            <rect x="185" y="80" width="30" height="30" rx="6" fill="rgba(139,92,246,0.1)" stroke="rgba(139,92,246,0.35)" strokeWidth="1.5" transform="rotate(45 200 95)" />
            <motion.rect
              x="192"
              y="87"
              width="16"
              height="16"
              rx="3"
              fill="rgba(139,92,246,0.6)"
              transform="rotate(45 200 95)"
              animate={{
                opacity: [0.4, 0.8, 0.4],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.g>

          {/* Bottom glow */}
          <motion.ellipse
            cx="200"
            cy="490"
            rx="100"
            ry="20"
            fill="rgba(255,92,0,0.15)"
            animate={{
              opacity: [0.1, 0.2, 0.1],
              rx: [100, 110, 100],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
        </svg>

        {/* Additional glow overlays */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            background: 'radial-gradient(circle at 50% 40%, rgba(255,92,0,0.15), transparent 60%)',
          }}
        />
      </motion.div>

      {/* Ambient particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              background: i % 2 === 0 ? 'rgba(255,92,0,0.6)' : 'rgba(0,149,255,0.6)',
              left: `${20 + i * 15}%`,
              top: `${30 + (i % 3) * 20}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.3,
            }}
          />
        ))}
      </div>
    </div>
  );
}