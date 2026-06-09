import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const CONTENT = {
  '/terms': {
    title: 'Terms & Conditions',
    sections: [
      { heading: '1. Acceptance of Terms', body: 'By accessing or using XFunded Trader services, you agree to be bound by these Terms and Conditions. If you do not agree, you may not use our services.' },
      { heading: '2. Eligibility', body: 'You must be at least 18 years of age to participate in any XFunded Trader challenge or funded program. By registering, you confirm you meet this requirement.' },
      { heading: '3. Challenge Rules', body: 'All challenges are subject to the specific rules outlined in your purchased plan. Violations of any rule — including drawdown breaches, prohibited strategies, or account sharing — will result in immediate termination without refund.' },
      { heading: '4. Funded Accounts', body: 'Funded accounts are simulated trading environments. XFunded Trader retains the right to adjust, suspend, or terminate any funded account at its sole discretion for rule violations or fraudulent activity.' },
      { heading: '5. Profit Splits', body: 'Funded traders receive up to 80% of simulated profits. Payouts are processed within 3–5 business days subject to KYC verification and compliance review.' },
      { heading: '6. Intellectual Property', body: 'All content, logos, branding, and software on the XFunded Trader platform are the exclusive property of XFunded Trader and may not be reproduced without prior written consent.' },
      { heading: '7. Limitation of Liability', body: 'XFunded Trader is not liable for any financial losses, trading losses, or indirect damages arising from the use of our platform. All challenges and funded accounts are for evaluation purposes only.' },
      { heading: '8. Governing Law', body: 'These Terms shall be governed by the laws of the Dubai International Financial Centre (DIFC), United Arab Emirates.' },
      { heading: '9. Amendments', body: 'XFunded Trader reserves the right to amend these Terms at any time. Continued use of the platform constitutes acceptance of any updated Terms.' },
    ],
  },
  '/privacy': {
    title: 'Privacy Policy',
    sections: [
      { heading: '1. Data We Collect', body: 'We collect personal information including name, email address, country of residence, and identity documents (for KYC). We also collect trading activity data and technical data such as IP addresses and device information.' },
      { heading: '2. How We Use Your Data', body: 'Your data is used to process registrations, verify identity, deliver funded account credentials, process payouts, and improve our platform. We do not sell personal data to third parties.' },
      { heading: '3. KYC & AML', body: 'To comply with applicable regulations, we require identity verification before processing payout requests. Documents submitted are stored securely and reviewed only by authorized staff.' },
      { heading: '4. Data Retention', body: 'We retain your personal data for a minimum of 5 years in compliance with DIFC regulations. Trading records are retained indefinitely for audit purposes.' },
      { heading: '5. Cookies', body: 'Our platform uses cookies to maintain session state and improve user experience. You may disable cookies in your browser settings, though some features may be affected.' },
      { heading: '6. Third-Party Services', body: 'We use trusted third-party providers for payment processing and infrastructure. These providers are contractually bound to protect your data.' },
      { heading: '7. Your Rights', body: 'You have the right to access, correct, or request deletion of your personal data. Contact us at privacy@xfundedtrader.com to exercise these rights.' },
      { heading: '8. Contact', body: 'For any privacy-related inquiries, contact us at privacy@xfundedtrader.com or write to us at Dubai International Financial Centre, UAE.' },
    ],
  },
  '/risk-disclosure': {
    title: 'Risk Disclosure',
    sections: [
      { heading: 'General Risk Warning', body: 'Trading leveraged financial instruments including foreign exchange (forex), contracts for difference (CFDs), indices, commodities, and cryptocurrencies involves substantial risk of loss and may not be appropriate for all traders.' },
      { heading: 'Leverage Risk', body: 'The use of leverage means that a relatively small market movement may have a proportionately larger impact on the funds you have deposited. You may sustain a total loss of initial capital.' },
      { heading: 'Market Volatility', body: 'Financial markets can be highly volatile. Prices can change rapidly and unpredictably due to economic events, geopolitical factors, or changes in market sentiment, all of which may result in significant losses.' },
      { heading: 'Past Performance', body: 'Past performance of any trading strategy, system, or individual trader is not indicative of future results. No guarantee is made regarding the profitability of any challenge or funded account.' },
      { heading: 'Simulated Environment', body: 'XFunded Trader challenge accounts and funded accounts operate in a simulated trading environment. While they mirror live market conditions, they do not constitute actual investment in financial markets.' },
      { heading: 'No Financial Advice', body: 'XFunded Trader does not provide investment advice, trading recommendations, or financial planning services. All trading decisions are made solely at the discretion of the trader.' },
      { heading: 'Psychological Risk', body: 'Trading can be emotionally demanding. Stress, overconfidence, and emotional decision-making are known contributors to trading losses.' },
      { heading: 'Technology Risk', body: 'Electronic trading is subject to risks including but not limited to internet connectivity issues, platform outages, and software errors. XFunded Trader is not liable for losses arising from such technical failures.' },
    ],
  },
  '/aml-policy': {
    title: 'AML Policy',
    sections: [
      { heading: '1. Overview', body: 'XFunded Trader is committed to complying with all applicable anti-money laundering (AML) and counter-terrorism financing (CTF) regulations under the laws of the Dubai International Financial Centre (DIFC).' },
      { heading: '2. KYC Requirements', body: 'All traders requesting payouts must complete identity verification (KYC). Required documents include a valid government-issued photo ID and proof of address dated within 90 days.' },
      { heading: '3. Suspicious Activity', body: 'XFunded Trader monitors for suspicious trading activity and unusual payout requests. Any activity suspected of being connected to money laundering will be reported to relevant authorities.' },
      { heading: '4. Source of Funds', body: 'We may request documentation confirming the legitimate source of any funds used to purchase challenges or receive payouts. Failure to provide such documentation may result in account suspension.' },
      { heading: '5. Prohibited Persons', body: 'Individuals on international sanctions lists or from FATF high-risk jurisdictions are prohibited from using XFunded Trader services.' },
      { heading: '6. Record Keeping', body: 'We maintain KYC records and transaction history for a minimum of 5 years in accordance with DIFC AML regulations.' },
      { heading: '7. Compliance Officer', body: 'For AML-related inquiries, contact our compliance team at compliance@xfundedtrader.com.' },
    ],
  },
};

export default function LegalPage() {
  const { pathname } = useLocation();
  const page = CONTENT[pathname] || CONTENT['/terms'];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/40" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-14">
        {/* Title */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
            style={{ background: 'rgba(255,92,0,0.1)', border: '1px solid rgba(255,92,0,0.2)' }}>
            <span className="text-[10px] font-mono text-primary uppercase tracking-widest">Legal · XFunded Trader</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground mb-3">{page.title}</h1>
          <p className="text-sm text-muted-foreground">
            Last updated: January 2026 · XFunded Trader, Dubai International Financial Centre, UAE
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {page.sections.map((s, i) => (
            <div key={i} className="pb-8 border-b border-border/30 last:border-0">
              <h2 className="text-base font-bold text-foreground mb-3">{s.heading}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-12 p-5 rounded-2xl text-sm text-muted-foreground"
          style={{ background: 'rgba(255,92,0,0.05)', border: '1px solid rgba(255,92,0,0.15)' }}>
          For questions regarding this document, contact us at{' '}
          <a href="mailto:support@xfundedtrader.com" className="text-primary hover:underline">
            support@xfundedtrader.com
          </a>
        </div>
      </div>
    </div>
  );
}