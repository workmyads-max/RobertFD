import React from 'react';
import { Plane, Mail, ArrowRight } from 'lucide-react';

/**
 * TravelIncentiveBanner — Modern luxury CSS recreation.
 * Deep onyx surface, gold/amber accents, refined serif headlines, generous spacing.
 */
export default function TravelIncentiveBanner({ onSupport }) {
  const ORANGE = '#FF5C00';
  const ORANGE_DIM = 'rgba(255,92,0,0.4)';

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #07070a 0%, #0c0c10 100%)', border: '1px solid rgba(255,92,0,0.25)', borderRadius: '2px' }}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 70% at 90% 30%, rgba(255,92,0,0.08), transparent 65%), radial-gradient(ellipse 45% 55% at 10% 90%, rgba(255,92,0,0.04), transparent 65%)',
        }}
      />
      {/* Top hairline accent */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,92,0,0.5), transparent)' }} />

      {/* ── Header ── */}
      <div className="relative flex items-center px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="w-[3px] h-4 mr-3" style={{ background: ORANGE }} />
        <span className="text-[8px] font-bold uppercase tracking-[0.3em]" style={{ color: ORANGE }}>
          Limited-Time Offer
        </span>
        <span className="mx-3 text-[#3a3a3a]">/</span>
        <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-[#707070]">
          International Travel Incentive
        </span>
      </div>

      {/* ── Main body ── */}
      <div className="relative px-6 py-7 flex gap-8 flex-col lg:flex-row">
        {/* Left: text */}
        <div className="flex-1 min-w-0">
          <h2 className="text-[26px] sm:text-[34px] font-light text-white leading-tight tracking-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            Skip the $450. Hit{' '}
            <span className="font-semibold" style={{ color: ORANGE }}>$12,500</span> in L1 sales.
          </h2>
          <h2 className="text-[26px] sm:text-[34px] font-light text-white leading-tight tracking-tight mt-0.5" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            Earn <span className="font-semibold" style={{ color: ORANGE }}>$1,350</span> + a 7-Night International Tour.
          </h2>

          <div className="mt-5 space-y-1.5 text-[11px] text-[#808080] leading-relaxed max-w-lg">
            <p>Forfeit the Bronze ($450) bonus and continue accumulating Level-1 direct sales.</p>
            <p>
              Reach the Silver threshold ($12,500 cumulative) and you'll receive the $1,350 Silver bonus
              PLUS an instant International 7-Nights Tour — on us.
            </p>
            <p className="text-[#505050] text-[10px] pt-1 italic">
              Free promo (Buy-2-Get-1-Free) accounts do not count toward qualifying sales.
            </p>
          </div>
        </div>

        {/* Right: "7 NIGHTS" visual + boarding pass */}
        <div className="relative flex-shrink-0 flex flex-col items-center justify-center min-w-[170px] lg:min-w-[210px]">
          {/* Divider line for large screens */}
          <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-px" style={{ background: 'rgba(255,255,255,0.04)' }} />

          <div className="relative flex items-baseline justify-center gap-2">
            <span className="text-[90px] sm:text-[110px] font-light leading-none" style={{ color: ORANGE, fontFamily: 'Georgia, "Times New Roman", serif' }}>
              7
            </span>
          </div>
          <div className="text-[8px] font-bold uppercase tracking-[0.3em] text-[#808080] mt-1">Nights</div>
          <div className="text-[8px] font-semibold uppercase tracking-[0.2em] text-[#505050] mt-0.5">International Tour</div>

          {/* Boarding pass — solid pill, ticket notch */}
          <div className="mt-4 relative flex items-center gap-2 px-4 py-2" style={{ background: ORANGE, borderRadius: '999px' }}>
            <Plane className="w-3 h-3" style={{ color: '#0a0a0a' }} />
            <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#0a0a0a]">
              All Expenses On Us
            </span>
          </div>
        </div>
      </div>

      {/* ── Three-step process — timeline ── */}
      <div className="relative px-6 pb-6">
        <div className="flex items-start gap-0">
          {[
            { n: '01', title: 'Forfeit Bronze', sub: 'Skip the $450 bonus and keep accumulating sales' },
            { n: '02', title: 'Generate $12,500', sub: 'In cumulative Level-1 direct sales' },
            { n: '03', title: 'Claim $1,350 + Tour', sub: 'Email us to arrange your 7-night trip' },
          ].map((step, i, arr) => (
            <React.Fragment key={i}>
              <div className="flex-1 min-w-0 relative">
                {/* Dot */}
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: i === 0 ? ORANGE : 'rgba(255,92,0,0.3)' }} />
                  <span className="text-[10px] font-mono font-semibold" style={{ color: ORANGE }}>{step.n}</span>
                </div>
                <div className="pl-5">
                  <div className="text-[11px] font-semibold text-white leading-tight">{step.title}</div>
                  <div className="text-[9px] text-[#606060] mt-0.5 leading-snug">{step.sub}</div>
                </div>
              </div>
              {i < arr.length - 1 && (
                <div className="flex-shrink-0 self-start pt-[5px] mx-1">
                  <div className="w-10 h-px" style={{ background: 'rgba(255,92,0,0.2)' }} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── Footer strip ── */}
      <div className="relative flex items-center gap-4 px-6 py-3.5 flex-wrap" style={{ background: 'rgba(255,92,0,0.02)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <Mail className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#606060' }} />
          <p className="text-[10px] text-[#808080] leading-snug">
            Once you hit the qualifying sales, email our team at{' '}
            <span className="font-semibold" style={{ color: ORANGE }}>support@xfundedtrader.com</span>{' '}
            and we'll contact you to arrange your tour.
          </p>
        </div>
        {onSupport && (
          <>
            <div className="w-px h-8" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <button
              onClick={onSupport}
              className="flex items-center gap-2 px-5 py-2 text-[9px] font-bold uppercase tracking-[0.2em] text-white transition-all"
              style={{ border: '1px solid ' + ORANGE_DIM, borderRadius: '2px', background: 'transparent' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = ORANGE; e.currentTarget.style.background = 'rgba(255,92,0,0.06)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = ORANGE_DIM; e.currentTarget.style.background = 'transparent'; }}
            >
              Or open Support
              <ArrowRight className="w-3 h-3" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}