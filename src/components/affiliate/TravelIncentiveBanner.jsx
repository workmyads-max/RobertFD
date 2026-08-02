import React from 'react';
import { Plane, Globe, Shield, TrendingUp, Gift, Mail, ArrowRight, ChevronRight } from 'lucide-react';

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
      <div className="relative flex items-center gap-3 px-6 py-3.5 flex-wrap" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="w-8 h-8 flex items-center justify-center" style={{ border: '1px solid ' + ORANGE_DIM, borderRadius: '2px' }}>
          <Plane className="w-3.5 h-3.5" style={{ color: ORANGE }} />
        </div>
        <span className="px-2.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.25em]" style={{ color: ORANGE, border: '1px solid ' + ORANGE_DIM, borderRadius: '1px', background: 'rgba(255,92,0,0.05)' }}>
          Limited-Time Offer
        </span>
        <div className="flex items-center gap-1.5 ml-auto">
          <Globe className="w-3.5 h-3.5" style={{ color: '#707070' }} />
          <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#707070]">
            International Travel Incentive
          </span>
        </div>
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

          {/* Boarding pass card */}
          <div className="mt-4 px-4 py-2 flex items-center gap-2" style={{ background: 'rgba(255,92,0,0.04)', border: '1px solid ' + ORANGE_DIM, borderRadius: '2px' }}>
            <Plane className="w-3.5 h-3.5" style={{ color: ORANGE }} />
            <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#a0a0a0]">
              All Expenses On Us
            </span>
          </div>
        </div>
      </div>

      {/* ── Three-step process bar ── */}
      <div className="relative px-6 pb-5">
        <div className="flex items-stretch gap-3 p-3.5" style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '2px' }}>
          {[
            { n: '01', icon: Shield, title: 'Forfeit Bronze', sub: 'bonus & continue' },
            { n: '02', icon: TrendingUp, title: 'Generate $12,500', sub: 'in L1 direct sales' },
            { n: '03', icon: Gift, title: 'Claim $1,350 + email', sub: 'us for your tour' },
          ].map((step, i, arr) => {
            const Icon = step.icon;
            return (
              <React.Fragment key={i}>
                <div className="flex-1 flex items-center gap-3 min-w-0">
                  <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                    <span className="text-[9px] font-bold tracking-widest" style={{ color: ORANGE }}>{step.n}</span>
                    <div className="w-8 h-8 flex items-center justify-center" style={{ border: '1px solid ' + ORANGE_DIM, borderRadius: '2px' }}>
                      <Icon className="w-4 h-4" style={{ color: ORANGE }} />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-white truncate">{step.title}</div>
                    <div className="text-[9px] text-[#606060] truncate">{step.sub}</div>
                  </div>
                </div>
                {i < arr.length - 1 && (
                  <div className="flex items-center self-center flex-shrink-0">
                    <div className="w-6 h-px" style={{ background: 'rgba(255,92,0,0.2)' }} />
                    <ChevronRight className="w-3.5 h-3.5" style={{ color: 'rgba(255,92,0,0.35)' }} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
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