import React, { useState } from 'react';
import { ChevronDown, AlertTriangle, ShieldAlert } from 'lucide-react';

/**
 * ── CENTRAL RISK DISCLAIMER TEXT ──────────────────────────────────────────
 * Edit legal text here ONLY. All variants (full & compact) read from this constant.
 */
export const RISK_DISCLAIMER_SECTIONS = [
  {
    label: 'Risk Disclaimer',
    body: 'The challenge/evaluation accounts and related services offered by XFunded Trader are a DIGITAL PRODUCT. All accounts provided are DEMO accounts, and any account received after passing a challenge - or any direct funded account taken without an evaluation phase - is a SIMULATED (simulation-type) account. No real funds are involved at any stage. All trading occurs in a simulated/demo environment using virtual capital.',
  },
  {
    label: 'Performance Reward',
    body: 'Any profits shown are not real earnings; they are provided as a performance-based REWARD for passing the evaluation (or for performance on a direct funded simulation account), derived solely from evaluation results.',
  },
  {
    label: 'Not a Broker',
    body: 'XFunded Trader is NOT a broker, dealer, exchange, or investment advisor, and does NOT accept or manage client deposits. Participants do NOT trade real assets or place live market orders. Any rewards are performance-based and derived from evaluation results only.',
  },
  {
    label: 'Not an Investment Firm',
    body: 'XFunded Trader does not accept investments from anyone and is NOT an investment firm. We are a service-based company that provides simulated trading evaluation tools and digital services only. All subscription/challenge fees are paid strictly for access to our evaluation services.',
  },
  {
    label: 'Evaluation Use Only',
    body: 'All content, tools, and services are provided for evaluation and assessment purposes only and shall not be construed as investment advice, solicitation, or an offer to buy or sell any financial product, cryptocurrency, or derivative. Participants are encouraged to consult independent financial, legal, or tax advisors before engaging in any trading activity outside of this program.',
  },
  {
    label: 'Risk Warning',
    body: 'Trading in Futures, derivatives, and digital asset markets involves substantial risk of loss. Past performance is not indicative of future results.',
  },
  {
    label: 'Hypothetical Performance Disclosure',
    body: 'Simulated or hypothetical performance results have inherent limitations. Unlike an actual performance record, simulated results do not represent real trading and may have been prepared with the benefit of hindsight. No representation is being made that any account will, or is likely to, achieve profits or losses similar to those shown.',
  },
];

export const RISK_DISCLAIMER_FOOTER_NOTE = 'Not a Deposit | Not Insured | May Lose Value (Note: no real funds are held.)';

// ── FULL VARIANT (marketing / public pages) ──────────────────────────────────
function FullDisclaimer() {
  return (
    <div className="rounded-2xl p-6"
      style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-start gap-4">
        <div className="w-1.5 flex-shrink-0 self-stretch rounded-full bg-primary/40 mt-1" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="w-4 h-4 text-primary/70" />
            <div className="text-xs font-mono uppercase tracking-widest text-primary/70">Risk Disclaimer</div>
          </div>
          <div className="space-y-4">
            {RISK_DISCLAIMER_SECTIONS.map((sec) => (
              <div key={sec.label}>
                <h5 className="text-sm font-semibold text-foreground mb-1">{sec.label}</h5>
                <p className="text-sm text-muted-foreground leading-relaxed">{sec.body}</p>
              </div>
            ))}
            <div className="pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-xs font-mono text-primary/60 font-semibold tracking-wide">
                {RISK_DISCLAIMER_FOOTER_NOTE}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── COMPACT VARIANT (dashboard / admin pages - collapsible) ───────────────────
function CompactDisclaimer() {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="mt-6 mb-2">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-lg transition-colors"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-primary/60" />
          <span className="text-xs font-mono text-muted-foreground">Risk Disclaimer</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && (
        <div className="mt-2 px-4 py-4 rounded-lg space-y-3"
          style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)' }}>
          {RISK_DISCLAIMER_SECTIONS.map((sec) => (
            <div key={sec.label}>
              <h5 className="text-xs font-semibold text-foreground mb-0.5">{sec.label}</h5>
              <p className="text-xs text-muted-foreground leading-relaxed">{sec.body}</p>
            </div>
          ))}
          <div className="pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[10px] font-mono text-primary/60 font-semibold tracking-wide">
              {RISK_DISCLAIMER_FOOTER_NOTE}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Reusable Risk Disclaimer footer component.
 * @param {string} variant - "full" (marketing pages) | "compact" (dashboard/admin, collapsible)
 */
export default function RiskDisclaimer({ variant = 'full' }) {
  return variant === 'compact' ? <CompactDisclaimer /> : <FullDisclaimer />;
}