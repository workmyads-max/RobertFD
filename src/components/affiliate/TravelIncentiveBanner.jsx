import React from 'react';
import { Plane, Mail, ArrowRight, Clock } from 'lucide-react';

/**
 * TravelIncentiveBanner — DISPLAY ONLY.
 * No backend logic. Instructs the affiliate to email support once they
 * generate the qualifying sales. Matches XFunded dark + orange theme.
 */
export default function TravelIncentiveBanner({ onSupport }) {
  const supportEmail = 'support@xfundedtrader.com';

  return (
    <div
      className="relative rounded-xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0d1117 0%, #13151b 100%)',
        border: '1px solid rgba(255,92,0,0.25)',
      }}
    >
      {/* Accent stripe */}
      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: '#FF5C00' }} />

      <div className="p-5 sm:p-6 pl-6 sm:pl-7">
        <div className="flex items-start gap-4 flex-wrap">
          {/* Icon */}
          <div
            className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,92,0,0.1)', border: '1px solid rgba(255,92,0,0.25)' }}
          >
            <Plane className="w-5 h-5" style={{ color: '#FF5C00' }} />
          </div>

          <div className="min-w-0 flex-1">
            {/* Tag row */}
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span
                className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-widest"
                style={{ background: 'rgba(255,92,0,0.12)', color: '#FF5C00', border: '1px solid rgba(255,92,0,0.25)' }}
              >
                Limited-Time Offer
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-white/40 uppercase tracking-wider">
                <Clock className="w-3 h-3" /> International Travel Incentive
              </span>
            </div>

            {/* Headline */}
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug mb-1.5">
              Skip the $450. Hit $12,500 in L1 sales. <span style={{ color: '#FF5C00' }}>Earn $1,350 + a 7-Night International Tour.</span>
            </h3>

            {/* Body */}
            <p className="text-[12px] sm:text-[13px] text-white/55 leading-relaxed mb-3.5 max-w-2xl">
              Forfeit the Bronze ($450) bonus and continue accumulating Level-1 direct sales.
              Reach the Silver threshold ($12,500 cumulative) and you'll receive the{' '}
              <span className="text-white font-semibold">$1,350 Silver bonus</span> PLUS an{' '}
              <span className="text-white font-semibold">instant International 7-Nights Tour</span> — on us.
              Free promo (Buy-2-Get-1-Free) accounts do not count toward qualifying sales.
            </p>

            {/* Steps */}
            <div className="flex items-center gap-2 flex-wrap mb-4">
              {[
                'Forfeit Bronze bonus & continue',
                'Generate $12,500 in L1 direct sales',
                'Claim $1,350 + email us for your tour',
              ].map((step, i) => (
                <React.Fragment key={i}>
                  <span
                    className="px-2.5 py-1 text-[10px] font-medium text-white/70"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    {i + 1}. {step}
                  </span>
                  {i < 2 && <ArrowRight className="w-3 h-3 text-white/20" />}
                </React.Fragment>
              ))}
            </div>

            {/* Claim instruction */}
            <div
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg flex-wrap"
              style={{ background: 'rgba(255,92,0,0.05)', border: '1px solid rgba(255,92,0,0.15)' }}
            >
              <Mail className="w-4 h-4 text-[#FF5C00] flex-shrink-0" />
              <span className="text-[11px] sm:text-[12px] text-white/70">
                Once you hit the qualifying sales, email our team at{' '}
                <a
                  href={`mailto:${supportEmail}?subject=International Travel Incentive Claim`}
                  className="font-mono font-bold text-[#FF5C00] hover:underline"
                >
                  {supportEmail}
                </a>{' '}
                and we'll contact you to arrange your tour.
              </span>
              {onSupport && (
                <button
                  onClick={onSupport}
                  className="ml-auto text-[11px] font-semibold text-white/60 hover:text-white transition-colors underline underline-offset-2"
                >
                  Or open Support
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}