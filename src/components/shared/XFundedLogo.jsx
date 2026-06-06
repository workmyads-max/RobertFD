import React from 'react';

export default function XFundedLogo({ size = 'md', className = '', variant = 'full' }) {
  const sizes = {
    sm: { icon: 40, text: 14, width: 180, height: 48 },
    md: { icon: 60, text: 16, width: 280, height: 72 },
    lg: { icon: 100, text: 20, width: 460, height: 120 },
    xl: { icon: 140, text: 24, width: 640, height: 160 },
  };

  const dims = sizes[size];

  // Icon only (just the X)
  if (variant === 'icon') {
    return (
      <svg
        viewBox="0 0 120 120"
        width={dims.icon}
        height={dims.icon}
        className={className}
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Main X shape - bold geometric form */}
        <g>
          {/* Left diagonal stroke (aggressive) */}
          <rect x="20" y="15" width="12" height="95" rx="6" fill="#FF7A00" transform="rotate(-35 26 62.5)" />
          
          {/* Right diagonal stroke (aggressive) */}
          <rect x="88" y="15" width="12" height="95" rx="6" fill="#FF7A00" transform="rotate(35 94 62.5)" />

          {/* White accent swoosh on top right */}
          <rect x="65" y="10" width="8" height="55" rx="4" fill="white" fillOpacity="0.9" transform="rotate(25 69 37.5)" />

          {/* Candlestick elements - integrated into right side of X */}
          <g transform="translate(75, 45)">
            {/* Candle 1 - up (bullish) */}
            <line x1="0" y1="8" x2="0" y2="2" stroke="#FF7A00" strokeWidth="1.5" />
            <rect x="-2.5" y="2" width="5" height="6" fill="#FF7A00" />

            {/* Candle 2 - down (bearish) */}
            <line x1="8" y1="6" x2="8" y2="14" stroke="#FF7A00" strokeWidth="1.5" />
            <rect x="5.5" y="6" width="5" height="8" fill="none" stroke="#FF7A00" strokeWidth="1" />

            {/* Candle 3 - up (bullish) */}
            <line x1="16" y1="10" x2="16" y2="1" stroke="#FF7A00" strokeWidth="1.5" />
            <rect x="13.5" y="1" width="5" height="9" fill="#FF7A00" />
          </g>
        </g>
      </svg>
    );
  }

  // Full logo with text
  return (
    <svg
      viewBox="0 0 500 150"
      width={dims.width}
      height={dims.height}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Icon Section */}
      <g>
        {/* Main X shape - bold geometric form */}
        {/* Left diagonal stroke */}
        <rect x="20" y="15" width="16" height="120" rx="8" fill="#FF7A00" transform="rotate(-35 28 75)" />
        
        {/* Right diagonal stroke */}
        <rect x="80" y="15" width="16" height="120" rx="8" fill="#FF7A00" transform="rotate(35 88 75)" />

        {/* White accent swoosh on top right */}
        <rect x="60" y="8" width="10" height="70" rx="5" fill="white" fillOpacity="0.95" transform="rotate(25 65 43)" />

        {/* Candlestick elements - integrated into right side */}
        <g transform="translate(75, 55)">
          {/* Candle 1 - up (bullish) */}
          <line x1="0" y1="12" x2="0" y2="3" stroke="#FF7A00" strokeWidth="2" strokeLinecap="round" />
          <rect x="-3.5" y="3" width="7" height="9" fill="#FF7A00" />

          {/* Candle 2 - down (bearish) */}
          <line x1="12" y1="8" x2="12" y2="18" stroke="#FF7A00" strokeWidth="2" strokeLinecap="round" />
          <rect x="8.5" y="8" width="7" height="10" fill="none" stroke="#FF7A00" strokeWidth="1.5" />

          {/* Candle 3 - up (bullish) */}
          <line x1="24" y1="14" x2="24" y2="1" stroke="#FF7A00" strokeWidth="2" strokeLinecap="round" />
          <rect x="20.5" y="1" width="7" height="13" fill="#FF7A00" />
        </g>
      </g>

      {/* Text Section */}
      <g>
        {/* XFunded text */}
        <text
          x="140"
          y="70"
          fontFamily="'Inter', '-apple-system', 'Helvetica Neue', sans-serif"
          fontSize="52"
          fontWeight="900"
          fill="white"
          letterSpacing="-1"
        >
          XFunded
        </text>

        {/* Trader text with orange accent */}
        <line x1="140" y1="90" x2="195" y2="90" stroke="#FF7A00" strokeWidth="2" strokeLinecap="round" />
        
        <text
          x="205"
          y="105"
          fontFamily="'Inter', '-apple-system', 'Helvetica Neue', sans-serif"
          fontSize="24"
          fontWeight="600"
          fill="#FF7A00"
          letterSpacing="4"
        >
          TRADER
        </text>
      </g>

      {/* Optional: Institutional badge line */}
      <line x="140" y="120" x2="430" y2="120" stroke="#FF7A00" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}