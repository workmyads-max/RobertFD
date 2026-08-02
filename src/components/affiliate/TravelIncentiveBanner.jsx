import React from 'react';
import { Plane, Globe, Shield, TrendingUp, Gift, Mail, ArrowRight, ChevronRight } from 'lucide-react';

/**
 * TravelIncentiveBanner — Pure CSS/React recreation of the luxury promotional
 * banner. No image asset, so no pixel-quality loss at any resolution.
 */
export default function TravelIncentiveBanner({ onSupport }) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-xl"
      style={{ background: '#0a0a0a', border: '1px solid rgba(255,102,0,0.35)' }}
    >
      {/* Glow accents */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 50% 60% at 85% 40%, rgba(255,102,0,0.10), transparent 70%), radial-gradient(ellipse 40% 50% at 15% 80%, rgba(255,102,0,0.05), transparent 70%)',
        }}
      />

      {/* ── Header ── */}
      <div
        className="relative flex items-center gap-3 px-5 py-3 flex-wrap"
        style={{ borderBottom: '1px solid rgba(255,102,0,0.15)' }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ border: '1px solid rgba(255,102,0,0.5)' }}
        >
          <Plane className="w-4 h-4" style={{ color: '#ff6600' }} />
        </div>
        <span
          className="px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded-full"
          style={{ background: 'rgba(255,102,0,0.15)', color: '#ff6600', border: '1px solid rgba(255,102,0,0.3)' }}
        >
          Limited-Time Offer
        </span>
        <div className="flex items-center gap-1.5 ml-auto">
          <Globe className="w-3.5 h-3.5" style={{ color: '#a0a0a0' }} />
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#a0a0a0]">
            International Travel Incentive
          </span>
        </div>
      </div>

      {/* ── Main body ── */}
      <div className="relative px-5 py-6 flex gap-6 flex-col lg:flex-row">
        {/* Left: text */}
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight">
            Skip the $450. Hit{' '}
            <span style={{ color: '#ff6600' }}>$12,500</span> in L1 sales.
          </h2>
          <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight mt-1">
            Earn <span style={{ color: '#ff6600' }}>$1,350</span> + a 7-Night International Tour.
          </h2>

          <div className="mt-4 space-y-1 text-[12px] text-[#a0a0a0] leading-relaxed max-w-lg">
            <p>
              Forfeit the Bronze ($450) bonus and continue accumulating Level-1 direct sales.
            </p>
            <p>
              Reach the Silver threshold ($12,500 cumulative) and you'll receive the $1,350 Silver bonus
              PLUS an instant International 7-Nights Tour — on us.
            </p>
            <p className="text-[#606060] text-[11px] pt-1">
              Free promo (Buy-2-Get-1-Free) accounts do not count toward qualifying sales.
            </p>
          </div>
        </div>

        {/* Right: "7 NIGHTS" visual + boarding passes */}
        <div className="relative flex-shrink-0 flex flex-col items-center justify-center min-w-[160px] lg:min-w-[200px]">
          <div className="relative flex items-center justify-center">
            <span
              className="text-[80px] sm:text-[100px] font-black leading-none"
              style={{ color: 'rgba(255,102,0,0.9)', textShadow: '0 0 40px rgba(255,102,0,0.3)' }}
            >
              7
            </span>
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-bold uppercase tracking-[0.2em] text-[#a0a0a0]">
              Nights
            </div>
          </div>
          <div className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#707070] mt-1">
            International Tour
          </div>

          {/* Luxury boarding pass card */}
          <div
            className="mt-3 px-3 py-2 rounded-lg flex items-center gap-2"
            style={{ background: '#141414', border: '1px solid rgba(255,102,0,0.3)' }}
          >
            <Plane className="w-3.5 h-3.5" style={{ color: '#ff6600' }} />
            <span className="text-[8px] font-bold uppercase tracking-widest text-[#a0a0a0]">
              All Expenses On Us
            </span>
          </div>
        </div>
      </div>

      {/* ── Three-step process bar ── */}
      <div className="relative px-5 pb-4">
        <div
          className="flex items-stretch gap-2 rounded-lg p-3"
          style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {[
            { n: 1, icon: Shield, title: 'Forfeit Bronze', sub: 'bonus & continue' },
            { n: 2, icon: TrendingUp, title: 'Generate $12,500', sub: 'in L1 direct sales' },
            { n: 3, icon: Gift, title: 'Claim $1,350 + email', sub: 'us for your tour' },
          ].map((step, i, arr) => {
            const Icon = step.icon;
            return (
              <React.Fragment key={i}>
                <div className="flex-1 flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold"
                    style={{ background: 'rgba(255,102,0,0.12)', border: '1px solid rgba(255,102,0,0.4)', color: '#ff6600' }}
                  >
                    {step.n}
                  </div>
                  <Icon className="w-4 h-4 flex-shrink-0" style={{ color: '#ff6600' }} />
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold text-white truncate">{step.title}</div>
                    <div className="text-[8px] text-[#707070] truncate">{step.sub}</div>
                  </div>
                </div>
                {i < arr.length - 1 && (
                  <ChevronRight className="w-4 h-4 self-center flex-shrink-0" style={{ color: 'rgba(255,102,0,0.4)' }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ── Footer strip ── */}
      <div
        className="relative flex items-center gap-3 px-5 py-3 flex-wrap"
        style={{ background: 'rgba(255,102,0,0.04)', borderTop: '1px solid rgba(255,102,0,0.15)' }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Mail className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#a0a0a0' }} />
          <p className="text-[10px] text-[#a0a0a0] leading-snug">
            Once you hit the qualifying sales, email our team at{' '}
            <span className="font-semibold" style={{ color: '#ff6600' }}>support@xfundedtrader.com</span>{' '}
            and we'll contact you to arrange your tour.
          </p>
        </div>
        {onSupport && (
          <>
            <div className="w-px h-8" style={{ background: 'rgba(255,255,255,0.1)' }} />
            <button
              onClick={onSupport}
              className="flex items-center gap-1.5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white rounded-lg transition-opacity hover:opacity-80"
              style={{ border: '1px solid rgba(255,102,0,0.5)', background: 'transparent' }}
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