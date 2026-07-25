import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calculator, TrendingUp, Wallet, ArrowRight } from 'lucide-react';

const ACCOUNT_SIZES = [
  { label: '$5K', value: 5000 },
  { label: '$10K', value: 10000 },
  { label: '$25K', value: 25000 },
  { label: '$50K', value: 50000 },
  { label: '$100K', value: 100000 },
  { label: '$200K', value: 200000 },
];

const REWARD_SPLIT = 90; // One-Step: 90% reward split

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
            Calculate Your <span style={{ color: '#FF5C00' }}>Earnings</span>
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
            See exactly how much you keep with our industry-leading {REWARD_SPLIT}% reward split.
          </p>
        </motion.div>

        {/* Calculator card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto rounded-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, rgba(255,92,0,0.05), rgba(20,20,22,0.9))',
            border: '1px solid rgba(255,92,0,0.2)',
          }}
        >
          <div className="grid md:grid-cols-2">
            {/* Inputs side */}
            <div className="p-8 sm:p-10 space-y-8">
              {/* Account size */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4 block">
                  Account Size
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {ACCOUNT_SIZES.map((opt) => {
                    const isSelected = accountSize === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setAccountSize(opt.value)}
                        className="py-2.5 px-2 rounded-xl text-sm font-bold transition-all"
                        style={{
                          background: isSelected ? 'rgba(255,92,0,0.15)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${isSelected ? 'rgba(255,92,0,0.5)' : 'rgba(255,255,255,0.08)'}`,
                          color: isSelected ? '#FF7A2F' : 'rgba(255,255,255,0.7)',
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
                <div className="flex items-center justify-between mb-4">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Profit Target
                  </label>
                  <span
                    className="text-2xl font-black tabular"
                    style={{ color: '#FF7A2F' }}
                  >
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
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #FF5C00 ${((profitTarget - 1) / 19) * 100}%, rgba(255,255,255,0.1) ${((profitTarget - 1) / 19) * 100}%)`,
                  }}
                />
                <div className="flex justify-between mt-2 text-[10px] font-mono text-muted-foreground/60">
                  <span>1%</span>
                  <span>10%</span>
                  <span>20%</span>
                </div>
              </div>

              {/* Quick info row */}
              <div
                className="flex items-center gap-3 p-4 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(255,92,0,0.1)', border: '1px solid rgba(255,92,0,0.2)' }}
                >
                  <Calculator className="w-5 h-5" style={{ color: '#FF7A2F' }} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white/80">
                    {formatMoney(accountSize)} account · {profitTarget}% target
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                    Total profit: ${formatMoney(profitAmount)}
                  </div>
                </div>
              </div>
            </div>

            {/* Results side */}
            <div
              className="p-8 sm:p-10 flex flex-col justify-center relative overflow-hidden"
              style={{ background: 'rgba(0,0,0,0.35)' }}
            >
              {/* Your share — hero number */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <Wallet className="w-4 h-4" style={{ color: '#FF7A2F' }} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Your Payout ({REWARD_SPLIT}%)
                  </span>
                </div>
                <div
                  className="font-black tabular leading-none"
                  style={{ fontSize: 'clamp(2.5rem, 6vw, 3.5rem)', color: '#FF7A2F' }}
                >
                  ${formatMoney(yourShare)}
                </div>
                <div className="text-xs text-muted-foreground mt-2 font-mono">
                  from ${formatMoney(profitAmount)} total profit
                </div>
              </div>

              {/* Split breakdown */}
              <div
                className="rounded-2xl p-5 space-y-4"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: '#FF5C00' }} />
                    <span className="text-sm font-semibold text-white/85">Your Share</span>
                  </div>
                  <span className="text-sm font-bold tabular text-white">
                    ${formatMoney(yourShare)}
                  </span>
                </div>
                <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.25)' }} />
                    <span className="text-sm font-semibold text-white/55">Firm Share</span>
                  </div>
                  <span className="text-sm font-bold tabular text-white/55">
                    ${formatMoney(firmShare)}
                  </span>
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={() => onNavigate?.('challenges')}
                className="mt-8 w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                style={{
                  background: 'linear-gradient(90deg, #FF5C00, #FF7A2F)',
                  color: '#fff',
                }}
              >
                <TrendingUp className="w-4 h-4" />
                Start Earning Today
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-[10px] text-muted-foreground/60 text-center mt-3 font-mono">
                Based on One-Step {REWARD_SPLIT}% reward split · KYC required for payouts
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}