import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const CONTENT = {
  '/terms': {
    title: 'Terms & Conditions',
    sections: [
      { heading: '1. Acceptance of Terms', body: 'By accessing or using XFunded services, you agree to be bound by these Terms and Conditions in their entirety. If you do not agree with any part of these terms, you must immediately cease using our services. These Terms apply to all visitors, registered users, challenge participants, and funded traders.' },
      { heading: '2. Nature of Services', body: 'XFunded provides a proprietary trading evaluation program. All challenge accounts and funded accounts operate in a simulated trading environment using demo or contest accounts on MetaTrader 5 (MT5). The data feed and execution mirror live market conditions but do not constitute actual investment in financial markets. XFunded is not a broker, fund manager, or investment firm and does not accept client funds for investment purposes.' },
      { heading: '3. Eligibility', body: 'You must be at least 18 years of age and legally permitted to participate in trading evaluation programs in your country of residence. Residents of jurisdictions subject to international sanctions or FATF high-risk classifications are prohibited from using our services. By registering, you warrant that you meet all eligibility requirements and that the information you provide is accurate and complete.' },
      { heading: '4. Challenge Purchase & Refund Policy', body: 'Challenge fees are non-refundable once your MT5 account has been provisioned and credentials delivered. If provisioning fails due to a technical error on our part, you are entitled to a full refund or re-provisioning at your choice. Chargebacks initiated without prior contact with our support team may result in permanent account suspension.' },
      { heading: '5. Challenge Rules & Trading Objectives', body: 'All challenge phases are governed by the specific rules attached to your purchased plan, including: maximum daily loss limit, maximum overall drawdown limit, minimum trading days, profit targets, lot size restrictions, news trading restrictions, and overnight/weekend holding rules. Violation of any single rule constitutes an immediate account breach. Breached accounts are closed with no refund.' },
      { heading: '6. Prohibited Strategies', body: 'The following strategies are strictly prohibited across all account types: latency arbitrage, reverse arbitrage, tick scalping, high-frequency trading (HFT), grid trading that exploits server vulnerabilities, copy trading from a signal that simultaneously mirrors positions across multiple XFunded accounts, use of expert advisors that exploit spread widening during low-liquidity windows, and any form of account sharing or group trading designed to guarantee a pass. XFunded reserves the right to disqualify accounts where prohibited strategies are detected, with or without prior notice.' },
      { heading: '7. Funded Accounts & Profit Payouts', body: 'Upon successfully passing all required challenge phases and completing the funded account review, you will receive a funded MT5 account. Funded traders are entitled to receive up to 80% of net simulated profits (exact split defined in your plan). Payouts are processed within 3-7 business days of approval, subject to KYC verification and risk compliance review. XFunded retains the right to defer or reduce a payout if suspicious trading activity is detected during the payout review period.' },
      { heading: '8. Account Suspension & Termination', body: 'XFunded reserves the right to suspend or permanently terminate any account - without notice - in cases of: rule violations, fraudulent identity, coordinated group trading, use of prohibited strategies, chargebacks, abuse of the affiliate program, or any activity deemed detrimental to the integrity of the platform. Terminated accounts are not eligible for refunds.' },
      { heading: '9. Intellectual Property', body: 'All content, trademarks, logos, platform software, data, and branding on XFunded are the exclusive intellectual property of XFunded Ltd. Unauthorized reproduction, distribution, or use of any XFunded content without prior written consent is strictly prohibited.' },
      { heading: '10. Disclaimer of Warranties', body: 'XFunded provides its platform and services "as is" without warranties of any kind, express or implied. We do not guarantee uninterrupted platform access, accuracy of data feeds, or profitability of any trading strategy. Platform maintenance may cause temporary downtime, for which XFunded is not liable.' },
      { heading: '11. Limitation of Liability', body: 'To the maximum extent permitted by law, XFunded shall not be liable for any direct, indirect, incidental, consequential, or punitive damages arising from your use of the platform, including trading losses, loss of account access, or decisions made based on platform data. All challenges are for evaluation purposes only.' },
      { heading: '12. Governing Law & Dispute Resolution', body: 'These Terms are governed by the laws of the Dubai International Financial Centre (DIFC), United Arab Emirates. Any dispute arising from these Terms shall first be attempted to be resolved through good-faith negotiation. Unresolved disputes shall be subject to the exclusive jurisdiction of the DIFC Courts.' },
      { heading: '13. Amendments', body: 'XFunded reserves the right to amend, update, or replace these Terms at any time. Material changes will be notified via email or platform announcement. Continued use of the platform after any modification constitutes your acceptance of the updated Terms.' },
      { heading: '14. Contact', body: 'For questions regarding these Terms, contact us at support@xfunded.com or write to XFunded Ltd., Dubai International Financial Centre, Dubai, UAE.' },
    ],
  },
  '/privacy': {
    title: 'Privacy Policy',
    sections: [
      { heading: '1. Introduction', body: 'XFunded Ltd. ("XFunded", "we", "us", "our") is committed to protecting your personal data. This Privacy Policy explains how we collect, use, store, and share your information when you use our website, platform, or services. By using XFunded, you consent to the practices described in this policy.' },
      { heading: '2. Data We Collect', body: 'We collect: (a) Identity data - full name, date of birth, nationality, government-issued ID, and selfie for KYC purposes; (b) Contact data - email address, phone number, and residential address; (c) Financial data - payment method details, transaction IDs, and payout wallet addresses; (d) Trading data - trade history, account performance metrics, and MT5 activity logs; (e) Technical data - IP address, browser type, device identifiers, session tokens, and cookies; (f) Communications - support tickets, live chat messages, and email correspondence.' },
      { heading: '3. How We Use Your Data', body: 'Your data is used to: register and manage your account; verify your identity and comply with KYC/AML obligations; provision and monitor MT5 trading accounts; process challenge purchases and payout requests; detect fraud, prohibited strategies, and account abuse; send transactional emails, invoices, and important service notifications; improve platform features and user experience; comply with legal and regulatory requirements.' },
      { heading: '4. KYC & AML Compliance', body: 'XFunded is required to conduct identity verification (KYC) prior to processing any payout request. Documents submitted are reviewed only by authorized compliance staff and stored in encrypted, access-controlled environments. We comply with applicable AML regulations and may report suspicious activity to relevant authorities as required by law.' },
      { heading: '5. Data Sharing', body: 'We do not sell your personal data to third parties. We may share data with: trusted third-party service providers (payment processors, cloud infrastructure, email delivery); regulatory or law enforcement authorities when legally required; our MT5 bridge provider (Tritech) for account provisioning purposes. All third-party processors are contractually bound to protect your data under confidentiality agreements.' },
      { heading: '6. Data Retention', body: 'We retain personal data for as long as your account is active and for a minimum of 5 years after account closure, in compliance with DIFC regulations. Trading records and KYC documents are retained for a minimum of 7 years for audit and regulatory compliance purposes. You may request deletion of your data subject to applicable legal retention requirements.' },
      { heading: '7. Cookies & Tracking', body: 'Our platform uses cookies and similar tracking technologies to maintain session state, remember preferences, and analyze platform usage. We use analytics tools to understand user behavior and improve our services. You may disable cookies in your browser, although certain platform features may not function correctly without them.' },
      { heading: '8. Data Security', body: 'We implement industry-standard security measures including TLS encryption, encrypted storage, access controls, and regular security audits. MT5 credentials are stored with restricted access. Despite these measures, no digital transmission or storage is 100% secure. You are responsible for maintaining the confidentiality of your account credentials.' },
      { heading: '9. Your Rights', body: 'Subject to applicable law, you have the right to: access a copy of your personal data; correct inaccurate or incomplete data; request deletion of your data (subject to legal retention requirements); withdraw consent to data processing at any time; lodge a complaint with a supervisory authority. To exercise any of these rights, contact us at privacy@xfunded.com.' },
      { heading: '10. International Transfers', body: 'Your data may be processed in countries outside your jurisdiction. Where we transfer data internationally, we ensure appropriate safeguards are in place, including contractual protections with third-party processors.' },
      { heading: '11. Children\'s Privacy', body: 'XFunded services are not directed at individuals under 18 years of age. We do not knowingly collect data from minors. If we become aware that a minor has provided personal data, we will promptly delete it.' },
      { heading: '12. Policy Updates', body: 'We may update this Privacy Policy periodically. We will notify you of material changes via email or platform notification. The date of the latest revision is shown at the top of this page.' },
      { heading: '13. Contact', body: 'For privacy inquiries or data subject requests, contact our Data Protection team at: privacy@xfunded.com | XFunded Ltd., Dubai International Financial Centre, Dubai, UAE.' },
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