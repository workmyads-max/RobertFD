import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';

const RULES = [
  { title: 'Daily Drawdown Limit', body: 'You must not lose more than 5% of your account balance in a single trading day (reset at 3:00 AM GMT+4).' },
  { title: 'Maximum Drawdown', body: 'Your total equity must never fall more than 10% below your initial account balance. This limit does NOT reset.' },
  { title: 'Profit Target', body: 'Phase 1: achieve 10% profit. Phase 2: achieve 5% profit. Instant accounts: maintain profitable operation.' },
  { title: 'Minimum Trading Days', body: 'You must trade on at least 4 different calendar days per phase to qualify for advancement or payout.' },
  { title: 'News & Market Events', body: 'High-leverage accounts (1:100+) may not hold positions during major high-impact news events (NFP, FOMC, CPI). 1:30 accounts are exempt.' },
  { title: 'Overnight & Weekend Rules', body: '1:100 accounts may not hold positions past Friday 21:00 GMT. 1:30 accounts may hold overnight and over weekends.' },
  { title: 'Consistency Rule', body: 'No single trade may account for more than 50% of total profits. Consistency in lot sizing and strategy is required.' },
  { title: 'Prohibited Activities', body: 'Prohibited: tick scalping, arbitrage, copy trading without approval, HFT, use of price-manipulation tools or exploits.' },
  { title: 'Platform & Credentials', body: 'Your trading credentials are personal and non-transferable. Account sharing or selling is grounds for immediate termination.' },
  { title: 'Payout Policy', body: 'Funded traders receive 80% profit split. Withdrawals require KYC verification and minimum 1 cycle of profitable trading.' },
];

export default function TermsModal({ open, onAccept, onClose }) {
  const [scrolled, setScrolled] = useState(false);
  const [checked, setChecked] = useState({ rules: false, restrictions: false, leverage: false });

  const allChecked = Object.values(checked).every(Boolean);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollTop + clientHeight >= scrollHeight - 40) setScrolled(true);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)' }}
        >
          <motion.div
            initial={{ scale: 0.94, y: 24 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.94, y: 24 }}
            transition={{ ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-2xl rounded-2xl flex flex-col"
            style={{
              background: '#0d0f16',
              border: '1px solid rgba(255,92,0,0.3)',
              boxShadow: '0 0 60px rgba(255,92,0,0.12)',
              maxHeight: '90vh',
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-5 border-b flex-shrink-0"
              style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(255,92,0,0.12)', border: '1px solid rgba(255,92,0,0.25)' }}>
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-black text-white">Challenge Terms & Conditions</h2>
                <p className="text-[11px] font-mono text-white/30">Read fully before proceeding to payment</p>
              </div>
              <button onClick={onClose} className="ml-auto text-white/30 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Rules scroll area */}
            <div
              className="flex-1 overflow-y-auto p-5 space-y-3"
              style={{ minHeight: 0 }}
              onScroll={handleScroll}
            >
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl mb-4"
                style={{ background: 'rgba(255,92,0,0.07)', border: '1px solid rgba(255,92,0,0.2)' }}>
                <AlertTriangle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-xs text-white/60 leading-relaxed">
                  You must read and accept all rules before purchasing. Violations will result in immediate account termination without refund.
                </p>
              </div>

              {RULES.map((rule, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="rounded-xl p-4"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0"
                      style={{ background: 'rgba(255,92,0,0.15)', color: '#FF5C00' }}>
                      {i + 1}
                    </div>
                    <span className="text-xs font-bold text-white">{rule.title}</span>
                  </div>
                  <p className="text-[11px] text-white/45 leading-relaxed pl-7">{rule.body}</p>
                </motion.div>
              ))}

              {!scrolled && (
                <div className="text-center py-2">
                  <span className="text-[10px] font-mono text-white/25">↓ Scroll to read all rules</span>
                </div>
              )}
            </div>

            {/* Checkboxes + Accept */}
            <div className="p-5 border-t flex-shrink-0 space-y-3"
              style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.3)' }}>
              {[
                { key: 'rules', label: 'I have read and agree to all challenge rules listed above' },
                { key: 'restrictions', label: 'I understand that trading restrictions apply (news, overnight, weekend)' },
                { key: 'leverage', label: 'I confirm my selected leverage and account model is correct and cannot be changed' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-start gap-3 cursor-pointer group">
                  <div
                    onClick={() => setChecked(c => ({ ...c, [key]: !c[key] }))}
                    className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
                    style={{
                      background: checked[key] ? '#FF5C00' : 'rgba(255,255,255,0.06)',
                      border: `1px solid ${checked[key] ? '#FF5C00' : 'rgba(255,255,255,0.15)'}`,
                    }}
                  >
                    {checked[key] && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-xs text-white/60 leading-relaxed group-hover:text-white/80 transition-colors">{label}</span>
                </label>
              ))}

              <motion.button
                onClick={() => allChecked && onAccept()}
                disabled={!allChecked}
                whileHover={{ scale: allChecked ? 1.02 : 1 }}
                whileTap={{ scale: allChecked ? 0.98 : 1 }}
                className="w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 mt-2 transition-all"
                style={{
                  background: allChecked ? 'linear-gradient(90deg, #FF5C00, #FF7A2F)' : 'rgba(255,255,255,0.07)',
                  color: allChecked ? 'white' : 'rgba(255,255,255,0.25)',
                  cursor: allChecked ? 'pointer' : 'not-allowed',
                  boxShadow: allChecked ? '0 4px 20px rgba(255,92,0,0.3)' : 'none',
                }}
              >
                <Shield className="w-4 h-4" />
                I Accept — Proceed to Payment
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}