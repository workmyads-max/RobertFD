import React, { useEffect } from 'react';
import { ArrowRight, CheckCircle2, Clock, Monitor, BarChart3, Zap, Unlock } from 'lucide-react';

const COMING_SOON = [
  { id: 'match_trader', name: 'Match Trader', subtitle: 'Institutional Platform', icon: BarChart3 },
  { id: 'xtrading', name: 'XTrading', subtitle: 'Built-in Terminal', icon: Zap },
  { id: 'tradelocker', name: 'TradeLocker', subtitle: 'Next-Gen Platform', icon: Unlock },
];

function MT5Icon() {
  return (
    <img
      src="https://media.base44.com/images/public/69ff44f98e27baf8957d0676/8cf56f3aa_image.png"
      alt="MT5"
      width={44}
      height={44}
      className="object-contain"
    />
  );
}

export default function PlatformSelectStep({ order, updateOrder, onNext }) {
  const selected = order.platform || 'mt5';

  useEffect(() => {
    if (!order.platform) updateOrder({ platform: 'mt5' });
  }, []);

  return (
    <div className="grid lg:grid-cols-5 gap-8">
      <div className="lg:col-span-3">
        {/* Section title */}
        <div className="flex items-center gap-3 mb-5">
          <Monitor className="w-5 h-5 text-primary" />
          <span className="text-[13px] font-semibold text-white/70 uppercase tracking-[0.15em]">Trading Platform</span>
        </div>

        {/* MT5 Card */}
        <button
          onClick={() => updateOrder({ platform: 'mt5' })}
          className="w-full rounded-xl text-left transition-all duration-200 hover:border-primary/50"
          style={{
            background: 'rgba(255,92,0,0.03)',
            border: `1.5px solid ${selected === 'mt5' ? 'rgba(255,92,0,0.45)' : 'rgba(255,255,255,0.08)'}`,
          }}
        >
          <div className="flex items-center gap-4 px-5 py-4">
            {/* MT5 Logo */}
            <div className="flex-shrink-0">
              <MT5Icon />
            </div>

            {/* Title + Subtitle */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-base font-bold text-white">MetaTrader 5</span>
                {selected === 'mt5' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide"
                    style={{ background: 'rgba(255,92,0,0.15)', color: '#FF8A3D' }}>
                    Selected
                  </span>
                )}
              </div>
              <span className="text-xs font-medium text-primary/80">Industry standard platform</span>
            </div>

            {/* Features */}
            <div className="hidden sm:flex items-center gap-5 text-[10px] text-white/25 font-medium">
              <span>Expert Advisors</span>
              <span>Advanced charting</span>
              <span>Algorithmic trading</span>
            </div>

            {/* Check */}
            <div className="flex-shrink-0">
              {selected === 'mt5' ? (
                <CheckCircle2 className="w-5 h-5 text-primary" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-white/15" />
              )}
            </div>
          </div>
        </button>

        {/* Coming Soon */}
        <div className="mt-6">
          <div className="text-[10px] text-white/15 font-semibold uppercase tracking-[0.25em] mb-3 px-1">Coming Soon</div>
          <div className="grid grid-cols-3 gap-3">
            {COMING_SOON.map(({ id, name, subtitle, icon: Icon }) => (
              <div key={id} className="rounded-xl p-4 opacity-35 pointer-events-none select-none"
                style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5">
                    <Icon className="w-4 h-4 text-white/20" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-semibold text-white/15 border border-white/8">Soon</span>
                </div>
                <div className="text-xs font-semibold text-white/30">{name}</div>
                <div className="text-[10px] text-white/18 mt-0.5">{subtitle}</div>
                <div className="flex items-center gap-1.5 mt-3 text-[9px] text-white/12">
                  <Clock className="w-3 h-3" /> In Development
                </div>
              </div>
            ))}
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