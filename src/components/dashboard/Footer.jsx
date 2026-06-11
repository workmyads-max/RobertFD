import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer
      className="w-full rounded-2xl overflow-hidden"
      style={{
        background: '#15151A',
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div className="px-6 py-5 space-y-4">
        {/* Top Links - Right aligned */}
        <div className="flex justify-end gap-5">
          <Link
            to="/"
            className="text-xs font-semibold transition-colors hover:text-primary"
            style={{ color: '#A0A0A0' }}
          >
            Privacy Policy
          </Link>
          <Link
            to="/"
            className="text-xs font-semibold transition-colors hover:text-primary"
            style={{ color: '#A0A0A0' }}
          >
            Terms & Conditions
          </Link>
        </div>

        {/* Legal Disclaimer */}
        <p
          className="text-[11px] leading-relaxed"
          style={{ color: '#606060' }}
        >
          All information provided is intended solely for evaluation purposes related to trading on financial markets and does not serve as a specific investment recommendation. Trading in financial markets is a high-risk activity. We do not provide investment services and are not a broker or fund manager. All challenges and funded accounts operate in a simulated environment powered by institutional liquidity providers.
        </p>

        {/* Bottom Branding */}
        <div className="text-[11px] font-semibold">
          <span style={{ color: '#606060' }}>2026 © </span>
          <span style={{ color: '#FF6600' }}>YourBrand.com</span>
          <span style={{ color: '#606060' }}> — Institutional Prop Trading</span>
        </div>
      </div>
    </footer>
  );
}