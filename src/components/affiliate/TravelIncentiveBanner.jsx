import React from 'react';

const BANNER_IMAGE = 'https://media.base44.com/images/public/69ff44f98e27baf8957d0676/e9d256671_XFT.jpg';

/**
 * TravelIncentiveBanner — DISPLAY ONLY.
 * Uses the luxury promotional banner image provided by the user.
 * The "Or open Support" button is overlaid as a clickable element.
 */
export default function TravelIncentiveBanner({ onSupport }) {
  return (
    <div
      className="relative rounded-xl overflow-hidden"
      style={{ border: '1px solid rgba(255,92,0,0.2)' }}
    >
      <img
        src={BANNER_IMAGE}
        alt="International Travel Incentive — Skip Bronze, hit $12,500 in L1 sales, earn $1,350 plus a 7 Night International Tour"
        className="w-full block"
        loading="lazy"
      />
      {onSupport && (
        <button
          onClick={onSupport}
          className="absolute bottom-[5%] right-[3%] px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-[11px] font-semibold text-white/80 hover:text-white transition-colors rounded-lg"
          style={{
            background: 'rgba(0,0,0,0.6)',
            border: '1px solid rgba(255,255,255,0.15)',
            backdropFilter: 'blur(4px)',
          }}
        >
          Or open Support
        </button>
      )}
    </div>
  );
}