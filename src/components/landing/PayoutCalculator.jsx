import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calculator, Wallet, ArrowRight, Sparkles } from 'lucide-react';

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

  const sliderPct = ((profitTarget - 1) / 19) * 100;

  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      {/* Ambient backdrop */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 50% at 50% 40%, rgba(255,92,0,0.10) 0%, transparent 70%), radial-gradient(40% 40% at 80% 80%, rgba(255,122,47,0.06) 0%, transparent 70%)',
        }}
      />
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.04]"
        style={{ background: 'conic-gradient(from 0deg, transparent, #FF5C00, transparent, #FF7A2F, transparent)' }}
      />

      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6">
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
          className="max-w-5xl mx-auto rounded-[2rem] overflow-hidden relative"
          style={{
            background: 'linear-gradient(160deg, rgba(255,92,0,0.04) 0%, rgba(18,18,20,0.95) 35%, rgba(10,10,12,0.98) 100%)',
            border: '1px solid rgba(255,92,0,0.18)',
            boxShadow: '0 30px 80px -20px rgba(255,92,0,0.18), 0 0 0 1px rgba(255,255,255,0.02) inset',
          }}
        >
          {/* Top accent line */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,92,0,0.6), transparent)' }}
          />

          <div className="grid md:grid-cols-2 relative">
            {/* Divider glow */}
            <div
              className="hidden md:block absolute top-8 bottom-8 left-1/2 w-px -translate-x-1/2"
              style={{
                background: 'linear-gradient(to bottom, transparent, rgba(255,92,0,0.25), transparent)',
              }}
            />

            {/* Inputs side */}
            <div className="p-8 sm:p-10 space-y-8">
              {/* Account size */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground mb-4 flex items-center gap-2">
                  <span className="w-1 h-3 rounded-full" style={{ background: '#FF5C00' }} />
                  Account Size
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {ACCOUNT_SIZES.map((opt) => {
                    const isSelected = accountSize === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setAccountSize(opt.value)}
                        className="relative py-3 px-2 rounded-2xl text-sm font-bold transition-all duration-300 overflow-hidden"
                        style={{
                          background: isSelected
                            ? 'linear-gradient(145deg, rgba(255,92,0,0.18), rgba(255,122,47,0.06))'
                            : 'rgba(255,255,255,0.025)',
                          border: `1px solid ${isSelected ? 'rgba(255,92,0,0.5)' : 'rgba(255,255,255,0.06)'}`,
                          color: isSelected ? '#FF8A3F' : 'rgba(255,255,255,0.65)',
                          boxShadow: isSelected ? '0 8px 24px -8px rgba(255,92,0,0.35)' : 'none',
                        }}
                      >
                        {isSelected && (
                          <span
                            className="absolute inset-0 pointer-events-none"
                            style={{ background: 'radial-gradient(80% 60% at 50% 100%, rgba(255,92,0,0.12), transparent)' }}
                          />
                        )}
                        <span className="relative z-10">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Profit target slider */}
              <div>
                <div className="flex items-center justify-between mb-5">
                  <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground flex items-center gap-2">
                    <span className="w-1 h-3 rounded-full" style={{ background: '#FF5C00' }} />
                    Profit Target
                  </label>
                  <span
                    className="text-3xl font-black tabular leading-none"
                    style={{
                      color: '#FF7A2F',
                      textShadow: '0 0 24px rgba(255,92,0,0.4)',
                    }}
                  >
                    {profitTarget}%
                  </span>
                </div>
                <div className="relative pt-2 pb-1">
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="1"
                    value={profitTarget}
                    onChange={(e) => setProfitTarget(Number(e.target.value))}
                    className="w-full h-2.5 rounded-full appearance-none cursor-pointer relative z-10"
                    style={{
                      background: `linear-gradient(to right, #FF5C00 0%, #FF7A2F ${sliderPct}%, rgba(255,255,255,0.08) ${sliderPct}%, rgba(255,255,255,0.08) 100%)`,
                    }}
                  />
                  {/* Slider thumb glow ring */}
                  <div
                    className="pointer-events-none absolute top-1/2 -translate-y-1/2 z-0"
                    style={{
                      left: `calc(${sliderPct}% - 10px)`,
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, rgba(255,92,0,0.35) 0%, transparent 70%)',
                    }}
                  />
                </div>
                <div className="flex justify-between mt-3 text-[10px] font-mono text-muted-foreground/50 tracking-wider">
                  <span>1%</span>
                  <span>10%</span>
                  <span>20%</span>
                </div>
              </div>

              {/* Summary box */}
              <div
                className="flex items-center gap-3 p-4 rounded-2xl"
                style={{
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'linear-gradient(145deg, rgba(255,92,0,0.18), rgba(255,92,0,0.04))',
                    border: '1px solid rgba(255,92,0,0.25)',
                  }}
                >
                  <Calculator className="w-5 h-5" style={{ color: '#FF7A2F' }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white/90 tracking-tight">
                    ${formatMoney(accountSize)} account · {profitTarget}% target
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono mt-1">
                    Total profit · <span style={{ color: '#FF8A3F' }}>${formatMoney(profitAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Results side */}
            <div
              className="p-8 sm:p-10 flex flex-col justify-center relative overflow-hidden"
              style={{
                background:
                  'linear-gradient(160deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.5) 100%)',
              }}
            >
              {/* Subtle grid pattern */}
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.025]"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
                  backgroundSize: '32px 32px',
                }}
              />

              {/* Your share — hero number */}
              <div className="relative mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{
                      background: 'rgba(255,92,0,0.15)',
                      border: '1px solid rgba(255,92,0,0.3)',
                    }}
                  >
                    <Wallet className="w-3.5 h-3.5" style={{ color: '#FF7A2F' }} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                    Your Payout ({REWARD_SPLIT}%)
                  </span>
                </div>
                <div
                  className="font-black tabular leading-none tracking-tight"
                  style={{
                    fontSize: 'clamp(2.75rem, 6.5vw, 4rem)',
                    color: '#FF7A2F',
                    textShadow: '0 0 40px rgba(255,92,0,0.45), 0 0 80px rgba(255,92,0,0.2)',
                  }}
                >
                  ${formatMoney(yourShare)}
                </div>
                <div className="text-xs text-muted-foreground mt-3 font-mono">
                  from <span className="text-white/70">${formatMoney(profitAmount)}</span> total profit
                </div>
              </div>

              {/* Split breakdown */}
              <div
                className="relative rounded-2xl p-5 space-y-4 mb-7"
                style={{
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015))',
                  border: '1px solid rgba(255,255,255,0.06)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                {/* Visual split bar */}
                <div
                  className="h-1.5 rounded-full overflow-hidden flex"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${REWARD_SPLIT}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    style={{
                      background: 'linear-gradient(90deg, #FF5C00, #FF7A2F)',
                      boxShadow: '0 0 12px rgba(255,92,0,0.5)',
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: '#FF5C00', boxShadow: '0 0 8px rgba(255,92,0,0.6)' }} />
                    <span className="text-sm font-semibold text-white/85">Your Share</span>
                  </div>
                  <span className="text-sm font-bold tabular text-white">
                    ${formatMoney(yourShare)}
                  </span>
                </div>
                <div className="h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
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
                className="relative group w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-[0.99] overflow-hidden"
                style={{
                  background: 'linear-gradient(90deg, #FF5C00, #FF7A2F)',
                  color: '#fff',
                  boxShadow: '0 12px 32px -8px rgba(255,92,0,0.5), 0 0 0 1px rgba(255,255,255,0.1) inset',
                }}
              >
                <span
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)' }}
                />
                <Sparkles className="w-4 h-4 relative z-10" />
                <span className="relative z-10">Start Earning Today</span>
                <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
              </button>
              <p className="text-[10px] text-muted-foreground/50 text-center mt-3 font-mono tracking-wide">
                Based on One-Step {REWARD_SPLIT}% reward split · KYC required for payouts
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}