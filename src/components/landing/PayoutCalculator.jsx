import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calculator, Wallet, ArrowRight } from 'lucide-react';

const ACCOUNT_SIZES = [
  { label: '$5K', value: 5000 },
  { label: '$10K', value: 10000 },
  { label: '$25K', value: 25000 },
  { label: '$50K', value: 50000 },
  { label: '$100K', value: 100000 },
  { label: '$200K', value: 200000 },
];

const REWARD_SPLIT = 90; // One-Step: 90% reward split
const ACCENT = '#E67E22'; // burnt orange

function formatMoney(n) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default function PayoutCalculator({ onNavigate }) {
  const [accountSize, setAccountSize] = useState(100000);
  const [profitTarget, setProfitTarget] = useState(8); // percentage

  const { profitAmount, yourShare, firmShare } = useMemo(() => {
    const profit = (accountSize * profitTarget) / 100;
    const share = (profit * REWARD_SPLIT) / 100;
    const firm = profit - share;
    return { profitAmount: profit, yourShare: share, firmShare: firm };
  }, [accountSize, profitTarget]);

  const sliderPct = ((profitTarget - 1) / 19) * 100;

  return (
    <section className="relative py-20 md:py-28">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 md:mb-16"
        >
          <span className="text-xs font-mono text-primary uppercase tracking-widest">
            Payout Calculator
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mt-4 mb-5">
            Calculate Your <span style={{ color: ACCENT }}>Earnings</span>
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
            See exactly how much you keep with our industry-leading {REWARD_SPLIT}% reward split.
          </p>
        </motion.div>

        {/* Calculator card — flat, classic */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-5xl mx-auto rounded-2xl overflow-hidden"
          style={{
            background: '#121212',
            border: '1px solid #1f1f1f',
          }}
        >
          <div className="grid md:grid-cols-2">
            {/* Inputs side */}
            <div className="p-8 sm:p-10 space-y-8" style={{ borderRight: '1px solid #1f1f1f' }}>
              {/* Account size */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#666] mb-4 flex items-center gap-2">
                  <span className="w-1 h-3 rounded-full" style={{ background: ACCENT }} />
                  Account Size
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {ACCOUNT_SIZES.map((opt) => {
                    const isSelected = accountSize === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setAccountSize(opt.value)}
                        className="py-3 px-2 rounded-lg text-sm font-bold transition-colors duration-200"
                        style={{
                          background: isSelected ? 'rgba(230,126,34,0.08)' : '#1a1a1a',
                          border: `1px solid ${isSelected ? ACCENT : '#262626'}`,
                          color: isSelected ? ACCENT : '#a0a0a0',
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Profit target slider */}
              <div>
                <div className="flex items-center justify-between mb-5">
                  <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#666] flex items-center gap-2">
                    <span className="w-1 h-3 rounded-full" style={{ background: ACCENT }} />
                    Profit Target
                  </label>
                  <span className="text-3xl font-black tabular leading-none" style={{ color: ACCENT }}>
                    {profitTarget}%
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="1"
                  value={profitTarget}
                  onChange={(e) => setProfitTarget(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${ACCENT} ${sliderPct}%, #262626 ${sliderPct}%)`,
                  }}
                />
                <div className="flex justify-between mt-3 text-[10px] font-mono text-[#555] tracking-wider">
                  <span>1%</span>
                  <span>10%</span>
                  <span>20%</span>
                </div>
              </div>

              {/* Summary box — flat classic */}
              <div
                className="flex items-center gap-3 p-4 rounded-lg"
                style={{ background: '#1a1a1a', border: '1px solid #262626' }}
              >
                <div
                  className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: '#1a1a1a', border: `1px solid ${ACCENT}` }}
                >
                  <Calculator className="w-5 h-5" style={{ color: ACCENT }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white tracking-tight">
                    ${formatMoney(accountSize)} account · {profitTarget}% target
                  </div>
                  <div className="text-[11px] text-[#a0a0a0] font-mono mt-1">
                    Total profit · <span style={{ color: ACCENT }}>${formatMoney(profitAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Results side */}
            <div className="p-8 sm:p-10 flex flex-col justify-center" style={{ background: '#121212' }}>
              {/* Your share — hero number */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: '#1a1a1a', border: `1px solid ${ACCENT}` }}
                  >
                    <Wallet className="w-4 h-4" style={{ color: ACCENT }} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#666]">
                    Your Payout ({REWARD_SPLIT}%)
                  </span>
                </div>
                <div
                  className="font-black tabular leading-none tracking-tight"
                  style={{ fontSize: 'clamp(2.5rem, 6vw, 3.75rem)', color: ACCENT }}
                >
                  ${formatMoney(yourShare)}
                </div>
                <div className="text-xs text-[#a0a0a0] mt-3 font-mono">
                  from <span className="text-white">${formatMoney(profitAmount)}</span> total profit
                </div>
              </div>

              {/* Split breakdown — flat */}
              <div
                className="rounded-lg p-5 space-y-4 mb-7"
                style={{ background: '#1a1a1a', border: '1px solid #262626' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: ACCENT }} />
                    <span className="text-sm font-semibold text-white">Your Share</span>
                  </div>
                  <span className="text-sm font-bold tabular text-white">
                    ${formatMoney(yourShare)}
                  </span>
                </div>
                <div className="h-px" style={{ background: '#262626' }} />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: '#555' }} />
                    <span className="text-sm font-semibold text-[#888]">Firm Share</span>
                  </div>
                  <span className="text-sm font-bold tabular text-[#888]">
                    ${formatMoney(firmShare)}
                  </span>
                </div>
              </div>

              {/* CTA — flat solid */}
              <button
                onClick={() => onNavigate?.('challenges')}
                className="w-full py-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                style={{ background: ACCENT, color: '#fff' }}
              >
                Start Earning Today
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-[10px] text-[#555] text-center mt-3 font-mono tracking-wide">
                Based on One-Step {REWARD_SPLIT}% reward split · KYC required for payouts
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}