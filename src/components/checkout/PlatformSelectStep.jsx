import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Clock, Monitor, BarChart3, Zap, Unlock } from 'lucide-react';

const COMING_SOON_PLATFORMS = [
  { id: 'match_trader', name: 'Match Trader', subtitle: 'Institutional Platform', icon: BarChart3 },
  { id: 'xtrading', name: 'XTrading', subtitle: 'Built-in Terminal', icon: Zap },
  { id: 'tradelocker', name: 'TradeLocker', subtitle: 'Next-Gen Platform', icon: Unlock },
];

function MT5Logo({ size = 48 }) {
  return (
    <img
      src="https://media.base44.com/images/public/69ff44f98e27baf8957d0676/8cf56f3aa_image.png"
      alt="MetaTrader 5"
      width={size}
      height={size}
      className="object-contain"
    />
  );
}

export default function PlatformSelectStep({ order, updateOrder, onNext }) {
  const selected = order.platform || '';

  useEffect(() => {
    if (!selected) updateOrder({ platform: 'mt5' });
  }, []);

  return (
    <div className="grid lg:grid-cols-5 gap-8">
      <div className="lg:col-span-3 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary/10 border border-primary/15">
              <Monitor className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-white">Select Trading Platform</h2>
          </div>
          <p className="text-sm text-white/35 ml-12">Choose where you'll trade. This is permanently assigned to your account.</p>
        </div>

        {/* MT5 Card */}
        <button
          onClick={() => updateOrder({ platform: 'mt5' })}
          className="relative w-full rounded-xl p-6 text-left transition-all duration-200 hover:border-blue-500/40"
          style={{
            background: '#161c28',
            border: `1.5px solid ${selected === 'mt5' ? 'rgba(37,99,235,0.5)' : 'rgba(37,99,235,0.2)'}`,
          }}
        >
          {/* Top row: badge + check */}
          <div className="flex items-center justify-between mb-6">
            <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold"
              style={{ background: 'rgba(37,99,235,0.15)', color: '#93c5fd' }}>
              Available
            </span>
            {selected === 'mt5' && (
              <CheckCircle2 className="w-5 h-5 text-blue-500" />
            )}
          </div>

          <div className="flex items-start gap-5">
            <div className="flex-shrink-0 mt-0.5">
              <MT5Logo size={48} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-lg font-bold text-white mb-0.5">MetaTrader 5</div>
              <div className="text-xs text-blue-300/60 mb-4 font-medium">Industry Standard Platform</div>
              <p className="text-sm text-white/35 leading-relaxed mb-4">
                The world's most popular trading platform with advanced charting, Expert Advisors, and full algorithmic trading support.
              </p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                {['Expert Advisors (EAs)', 'Advanced charting', 'Algorithmic trading', 'Multi-asset support'].map(f => (
                  <div key={f} className="flex items-center gap-2.5 text-xs text-white/45 font-medium">
                    <div className="w-1 h-1 rounded-full flex-shrink-0 bg-blue-500/70" />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </button>

        {/* Coming Soon */}
        <div>
          <div className="text-[10px] text-white/15 font-semibold uppercase tracking-[0.2em] mb-3">Coming Soon</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {COMING_SOON_PLATFORMS.map((p, i) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.id}
                  className="relative rounded-lg p-4 opacity-40 pointer-events-none"
                  style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-0.5 rounded text-[9px] font-semibold text-white/20 border border-white/8">
                      Soon
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 mt-1"
                    style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <Icon className="w-4 h-4 text-white/20" />
                  </div>
                  <div className="text-xs font-semibold text-white/35 mb-0.5">{p.name}</div>
                  <div className="text-[10px] text-white/20 mb-2">{p.subtitle}</div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-white/15" />
                    <span className="text-[9px] text-white/15">In Development</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right: Order Summary */}
      <div className="lg:col-span-2">
        <div className="sticky top-6 space-y-4">
          <div className="rounded-xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="px-5 py-3.5 border-b border-white/5">
              <span className="text-[10px] font-semibold text-white/25 uppercase tracking-wider">Order Summary</span>
            </div>
            <div className="p-5 space-y-3">
              {[
                { label: 'Challenge', value: order.challenge_type === 'two-step' ? 'Two-Step' : order.challenge_type === 'instant_light' ? 'Instant Light' : 'Instant Funding' },
                { label: 'Account Size', value: `$${order.account_size?.toLocaleString()}`, highlight: true },
                { label: 'Model', value: order.account_type === 'swing' ? 'Swing' : 'Standard' },
                { label: 'Leverage', value: order.leverage || '1:100' },
                { label: 'Platform', value: 'MetaTrader 5', highlight: true },
              ].map(({ label, value, highlight }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-xs text-white/30">{label}</span>
                  <span className={`text-xs font-semibold ${highlight ? 'text-primary' : 'text-white/70'}`}>{value}</span>
                </div>
              ))}
              <div className="border-t border-white/6 pt-3 mt-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-white">Total</span>
                  <span className="text-2xl font-bold text-primary">${order.price}</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={onNext}
            className="w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: '#FF5C00', color: 'white' }}
          >
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}