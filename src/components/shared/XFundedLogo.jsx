import React from 'react';

/**
 * XFundedLogo — SVG-only version for contexts that need a pure SVG (e.g. landing page hero).
 * variant="full"  → icon + wordmark
 * variant="icon"  → icon mark only
 */
export default function XFundedLogo({ size = 'md', className = '', variant = 'full' }) {
  const dims = {
    sm:  { w: 160, h: 44,  icon: 36 },
    md:  { w: 220, h: 60,  icon: 48 },
    lg:  { w: 340, h: 90,  icon: 72 },
    xl:  { w: 460, h: 120, icon: 96 },
  }[size] || { w: 220, h: 60, icon: 48 };

  if (variant === 'icon') {
    return (
      <svg
        viewBox="0 0 100 100"
        width={dims.icon}
        height={dims.icon}
        className={className}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="xfsvgBg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1a1a1a" />
            <stop offset="100%" stopColor="#0d0d0d" />
          </linearGradient>
          <linearGradient id="xfsvgOr" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FF7A00" />
            <stop offset="100%" stopColor="#FF4500" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="96" height="96" rx="22" fill="url(#xfsvgBg)" />
        <rect x="2" y="2" width="96" height="96" rx="22" fill="none" stroke="rgba(255,92,0,0.45)" strokeWidth="1.5" />
        <line x1="22" y1="22" x2="78" y2="78" stroke="url(#xfsvgOr)" strokeWidth="15" strokeLinecap="round" />
        <line x1="78" y1="22" x2="22" y2="78" stroke="url(#xfsvgOr)" strokeWidth="15" strokeLinecap="round" />
        <line x1="62" y1="18" x2="84" y2="50" stroke="white" strokeWidth="6" strokeLinecap="round" opacity="0.9" />
      </svg>
    );
  }

  // Full logo
  const iconSize = dims.icon;
  const textX = iconSize + 14;
  const nameSize = iconSize * 0.44;
  const subSize = iconSize * 0.175;

  return (
    <svg
      viewBox={`0 0 ${dims.w} ${dims.h}`}
      width={dims.w}
      height={dims.h}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="xffBg" x1="0" y1="0" x2={iconSize} y2={iconSize} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1a1a1a" />
          <stop offset="100%" stopColor="#0d0d0d" />
        </linearGradient>
        <linearGradient id="xffOr" x1="0" y1="0" x2={iconSize} y2={iconSize} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF7A00" />
          <stop offset="100%" stopColor="#FF4500" />
        </linearGradient>
      </defs>

      {/* Icon */}
      <rect x="2" y="2" width={iconSize - 4} height={iconSize - 4} rx={iconSize * 0.22} fill="url(#xffBg)" />
      <rect x="2" y="2" width={iconSize - 4} height={iconSize - 4} rx={iconSize * 0.22} fill="none" stroke="rgba(255,92,0,0.45)" strokeWidth="1.5" />
      <line
        x1={iconSize * 0.22} y1={iconSize * 0.22}
        x2={iconSize * 0.78} y2={iconSize * 0.78}
        stroke="url(#xffOr)" strokeWidth={iconSize * 0.15} strokeLinecap="round"
      />
      <line
        x1={iconSize * 0.78} y1={iconSize * 0.22}
        x2={iconSize * 0.22} y2={iconSize * 0.78}
        stroke="url(#xffOr)" strokeWidth={iconSize * 0.15} strokeLinecap="round"
      />
      <line
        x1={iconSize * 0.62} y1={iconSize * 0.18}
        x2={iconSize * 0.84} y2={iconSize * 0.50}
        stroke="white" strokeWidth={iconSize * 0.06} strokeLinecap="round" opacity="0.9"
      />

      {/* Wordmark */}
      <text
        x={textX}
        y={dims.h * 0.62}
        fontFamily="'Inter', '-apple-system', Helvetica, sans-serif"
        fontSize={nameSize}
        fontWeight="900"
        letterSpacing="-0.03em"
        fill="white"
      >
        <tspan fill="#FF7A00">X</tspan>Funded
      </text>
      <text
        x={textX}
        y={dims.h * 0.88}
        fontFamily="'Inter', '-apple-system', Helvetica, sans-serif"
        fontSize={subSize}
        fontWeight="700"
        letterSpacing="0.22em"
        fill="rgba(255,255,255,0.38)"
      >
        TRADER
      </text>
    </svg>
  );
}