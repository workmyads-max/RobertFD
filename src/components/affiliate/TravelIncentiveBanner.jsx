import React from 'react';
import { Trophy, Mail, ArrowRight, Clock } from 'lucide-react';

/**
 * TravelIncentiveBanner — DISPLAY ONLY.
 * No backend logic. Instructs the affiliate to email support once they
 * generate the qualifying sales. Modern luxury aesthetic.
 */
export default function TravelIncentiveBanner({ onSupport }) {
  const supportEmail = 'support@xfundedtrader.com';

  return (
    <div
      className="relative rounded-xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0a0a0c 0%, #121214 100%)',
        border: '1px solid rgba(255,92,0,0.2)',
      }}
    >
      {/* Accent stripe */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5" style={{ background: '#FF5C00' }} />

      <div className="p-5 sm:p-6 pl-6 sm:pl-7">
        {/* Badge row */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span
            className="px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-black"
            style={{ background: '#FF5C00' }}
          >
            Limited Time
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#52525b] uppercase tracking-wider">
            <Clock className="w-3 h-3" /> International Travel Incentive
          </span>
        </div>

        {/* Icon + headline */}
        <div className="flex items-start gap-4 mb-4">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,92,0,0.08)', border: '1px solid rgba(255,92,0,0.2)' }}
          >
            <Trophy className="w-5 h-5" style={{ color: '#FF5C00' }} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug mb-2">
              Skip the $450. Hit $12,500 in L1 sales.{' '}
              <span style={{ color: '#FF5C00' }}>Earn $1,350 plus a 7 Night International Tour.</span>
            </h3>
            <p className="text-[12px] sm:text-[13px] text-[#71717a] leading-relaxed max-w-2xl">
              Forfeit the Bronze ($450) bonus and continue accumulating Level 1 direct sales.
              Reach the Silver threshold ($12,500 cumulative) and you will receive the{' '}
              <span className="text-white font-semibold">$1,350 Silver bonus</span> PLUS an{' '}
              <span className="text-white font-semibold">instant International 7 Nights Tour</span> on us.
              Free promo (Buy 2 Get 1 Free) accounts do not count toward qualifying sales.
            </p>
          </div>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          {[
            'Forfeit Bronze bonus and continue',
            'Generate $12,500 in L1 direct sales',
            'Claim $1,350 and email us for your tour',
          ].map((step, i) => (
            <React.Fragment key={i}>
              <span
                className="px-3 py-1.5 text-[10px] font-medium text-[#a1a1aa] rounded"
                style={{ background: '#161618', border: '1px solid #1f1f22' }}
              >
                {i + 1}. {step}
              </span>
              {i < 2 && <ArrowRight className="w-3 h-3 text-[#3f3f46]" />}
            </React.Fragment>
          ))}
        </div>

        {/* Email instruction */}
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-lg flex-wrap"
          style={{ background: 'rgba(255,92,0,0.04)', border: '1px solid rgba(255,92,0,0.12)' }}
        >
          <Mail className="w-4 h-4 flex-shrink-0" style={{ color: '#FF5C00' }} />
          <span className="text-[11px] sm:text-[12px] text-[#a1a1aa] flex-1 min-w-0">
            Once you hit the qualifying sales, email our team at{' '}
            <a
              href={`mailto:${supportEmail}?subject=International Travel Incentive Claim`}
              className="font-mono font-bold hover:underline"
              style={{ color: '#FF5C00' }}
            >
              {supportEmail}
            </a>{' '}
            and we will contact you to arrange your tour.
          </span>
          {onSupport && (
            <button
              onClick={onSupport}
              className="text-[11px] font-semibold text-white/60 hover:text-white transition-colors underline underline-offset-2 flex-shrink-0"
            >
              Or open Support
            </button>
          )}
        </div>
      </div>
    </div>
  );
}