import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, AlertTriangle, CheckCircle2, FileText, ChevronDown, ChevronUp } from 'lucide-react';

const RULES = [
  {
    title: 'Challenge Rules & Objectives',
    icon: Shield,
    color: '#FF5C00',
    content: [
      'Two-Step Challenge: Phase 1 requires 10% profit target with max 5% daily drawdown and 10% overall drawdown. Minimum 4 trading days required.',
      'Phase 2 requires 5% profit target with the same drawdown limits. Minimum 4 trading days.',
      'Instant Funding: No profit target. Direct live funding with 5% daily and 10% max drawdown limits.',
      'Funded accounts operate under 80/20 profit split. Trader receives 80% of all profits.',
      'Swing Account (1:30 leverage): News trading allowed. Overnight and weekend holding permitted.',
      'Standard Account (1:100 leverage): News trading restricted. Aggressive scalping model. Overnight restrictions apply.',
    ]
  },
  {
    title: 'Prohibited Trading Practices',
    icon: AlertTriangle,
    color: '#ef4444',
    content: [
      'Latency Arbitrage: Exploiting price feed delays between brokers is strictly prohibited and will result in immediate account termination.',
      'HFT (High-Frequency Trading): Any automated strategy exceeding reasonable order frequency will be reviewed and may result in disqualification.',
      'Account Sharing: Trading accounts must only be accessed and operated by the registered account holder. Shared access is prohibited.',
      'Copy Trading from External Sources: Copying signals from external funded accounts to bypass challenge rules is a violation.',
      'Grid / Martingale Systems: Strategies that use progressively increasing lot sizes to recover losses are prohibited on funded accounts.',
      'VPN / IP Manipulation: Using VPN services to obscure geographic location or manipulate trading conditions is prohibited.',
      'Tick Scalping: Holding positions for under 3 seconds with intent to exploit microstructure is prohibited.',
      'Weekend Gap Trading: Deliberately holding positions over weekends to exploit Monday opening gaps (Standard accounts only).',
    ]
  },
  {
    title: 'KYC & Identity Verification',
    icon: FileText,
    color: '#60a5fa',
    content: [
      'All traders must complete KYC (Know Your Customer) verification before requesting any payouts.',
      'Required documents: Government-issued photo ID (front & back), selfie with ID, and proof of address (utility bill or bank statement, max 3 months old).',
      'Robert Funds complies with international AML (Anti-Money Laundering) regulations.',
      'Providing false identity documents is a criminal offense and will be reported to relevant authorities.',
      'KYC verification typically takes 24-48 business hours. Urgent reviews are not guaranteed.',
      'If additional documents are requested during review, they must be provided within 7 business days.',
    ]
  },
  {
    title: 'Payout & Withdrawal Terms',
    icon: CheckCircle2,
    color: '#10b981',
    content: [
      'Withdrawals are only available for LIVE FUNDED accounts. Challenge/demo balances cannot be withdrawn.',
      'Standard profit split is 80% trader / 20% Robert Funds. This is non-negotiable.',
      'A $25 processing fee applies to all withdrawals. This is deducted from the trader\'s 80% share.',
      'If trader has an active affiliate sponsor, 9% of the trader\'s share (after firm split) is deducted as affiliate reward.',
      'Minimum payout: $50. Maximum monthly payout: $100,000 per account (higher amounts require approval).',
      'Payouts are processed within 7 business days after approval. During high-volume periods, processing may take up to 14 days.',
      'Payout methods: USDT TRC20, Bitcoin, Bank Wire. All crypto addresses must be verified as belonging to the trader.',
      'If a funded account is breached after a payout request, the request is automatically cancelled.',
    ]
  },
  {
    title: 'Risk Disclosure',
    icon: AlertTriangle,
    color: '#f59e0b',
    content: [
      'Forex, CFD, and cryptocurrency trading involves significant risk of loss. Past performance does not guarantee future results.',
      'Challenge fees are non-refundable once an account has been activated and trading has commenced.',
      'If daily drawdown limit is breached, trading is immediately suspended for the day and the account may be failed.',
      'If the maximum overall drawdown limit is reached, the account is permanently failed with no appeal.',
      'Robert Funds reserves the right to adjust leverage, spreads, and trading conditions with 24 hours notice.',
      'In cases of suspected abuse, Robert Funds may request trade history, screen recordings, or a video interview.',
      'Robert Funds is not a regulated broker. This is a proprietary trading firm evaluation program. No client funds are at risk.',
      'By purchasing a challenge, you acknowledge that you understand these risks and agree to all terms.',
    ]
  },
];

export default function TermsModal({ onAccept, onDecline, order }) {
  const [expandedSection, setExpandedSection] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollTop + clientHeight >= scrollHeight - 50) {
      setScrolledToBottom(true);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)' }}>
      <motion.div initial={{ scale: 0.94, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 20 }}
        className="w-full max-w-2xl rounded-2xl flex flex-col"
        style={{ background: '#0a0a0d', border: '1px solid rgba(255,92,0,0.3)', maxHeight: '90vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 flex-shrink-0">
          <div>
            <h2 className="text-xl font-black text-foreground">Challenge Rules & Terms</h2>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              {order?.challenge_type === 'two-step' ? 'Two-Step' : 'Instant'} · ${(order?.account_size || 0).toLocaleString()} · {order?.account_type === 'swing' ? 'Swing' : 'Standard'}
            </p>
          </div>
          <button onClick={onDecline} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3" onScroll={handleScroll}>
          {/* Important banner */}
          <div className="flex items-start gap-3 p-4 rounded-xl mb-4"
            style={{ background: 'rgba(255,92,0,0.06)', border: '1px solid rgba(255,92,0,0.2)' }}>
            <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground leading-relaxed">
              Please read all rules carefully. By proceeding, you confirm you have read, understood, and agree to be bound by all the terms below. Violation of any rule may result in account termination without refund.
            </div>
          </div>

          {RULES.map((section, i) => {
            const Icon = section.icon;
            const isOpen = expandedSection === i;
            return (
              <div key={i} className="rounded-xl overflow-hidden"
                style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                <button onClick={() => setExpandedSection(isOpen ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition"
                  style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${section.color}15` }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: section.color }} />
                    </div>
                    <span className="text-sm font-bold text-foreground">{section.title}</span>
                  </div>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                      className="overflow-hidden">
                      <div className="p-4 space-y-2.5">
                        {section.content.map((item, j) => (
                          <div key={j} className="flex items-start gap-2.5">
                            <div className="w-1 h-1 rounded-full mt-2 flex-shrink-0" style={{ background: section.color }} />
                            <p className="text-xs text-muted-foreground leading-relaxed">{item}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          <div className="text-center text-[10px] font-mono text-muted-foreground/40 pt-2">
            — End of Terms & Conditions — Robert Funds Proprietary Trading Firm —
          </div>
        </div>

        {/* Footer: Agree checkbox + buttons */}
        <div className="p-6 border-t border-white/5 flex-shrink-0 space-y-4"
          style={{ background: 'rgba(255,255,255,0.02)' }}>
          <label className="flex items-start gap-3 cursor-pointer group">
            <div onClick={() => setAgreed(!agreed)}
              className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${agreed ? 'bg-primary' : 'bg-white/10'}`}
              style={{ border: agreed ? '1px solid #FF5C00' : '1px solid rgba(255,255,255,0.15)' }}>
              {agreed && <CheckCircle2 className="w-3 h-3 text-white" />}
            </div>
            <span className="text-xs text-muted-foreground leading-relaxed">
              I have read, understood, and agree to all <span className="text-foreground font-semibold">Challenge Rules</span>, <span className="text-foreground font-semibold">Terms & Conditions</span>, and <span className="text-foreground font-semibold">Risk Disclosure</span> of Robert Funds. I confirm I am of legal trading age in my country.
            </span>
          </label>

          <div className="flex gap-3">
            <button onClick={onDecline}
              className="flex-1 py-3 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              Decline
            </button>
            <button onClick={onAccept} disabled={!agreed}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02]"
              style={{ background: agreed ? 'linear-gradient(90deg,#FF5C00,#FF7A2F)' : 'rgba(255,255,255,0.06)', boxShadow: agreed ? '0 4px 20px rgba(255,92,0,0.3)' : 'none' }}>
              I Agree — Continue to Checkout
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}