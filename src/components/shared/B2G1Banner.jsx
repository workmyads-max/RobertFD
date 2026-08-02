import React from 'react';

/**
 * Static promotional banner — Buy 2 Challenges, Get 1 Free.
 * Flat, institutional. No gradients, no icons, no glows.
 */
export default function B2G1Banner({ className = '' }) {
  return (
    <div
      className={`px-5 py-4 ${className}`}
      style={{
        background: '#0d0d0e',
        border: '1px solid #1f1f22',
        borderLeft: '2px solid #FF5C00',
      }}
    >
      <div className="flex items-baseline gap-3 flex-wrap">
        <span className="text-[10px] font-mono text-[#52525b] uppercase tracking-[0.2em]">
          Promo
        </span>
        <span className="text-sm font-bold text-[#FF5C00] uppercase tracking-wide">
          Buy 2 Challenges, Get 1 Free
        </span>
      </div>
      <p className="text-[12px] text-[#71717a] mt-1.5 leading-relaxed">
        Buy two challenges of the same size and receive a third account on us. Added to your order at no cost.
      </p>
    </div>
  );
}