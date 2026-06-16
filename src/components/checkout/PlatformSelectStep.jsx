import React, { useEffect } from 'react';
import { ArrowRight, Clock, BarChart3, Zap, Unlock } from 'lucide-react';

const COMING_SOON = [
  { id: 'match_trader', name: 'Match Trader', subtitle: 'Institutional Platform', icon: BarChart3 },
  { id: 'xtrading', name: 'XTrading', subtitle: 'Built-in Terminal', icon: Zap },
  { id: 'tradelocker', name: 'TradeLocker', subtitle: 'Next-Gen Platform', icon: Unlock },
];

function MT5Icon() {
  return (
    <img
      src="https://media.base44.com/images/public/69ff44f98e27baf8957d0676/8cf56f3aa_image.png"
      alt="MT5" width={32} height={32} className="object-contain"
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
        {/* Header */}
        <h3 className="text-lg font-bold text-white mb-3">Platform</h3>
        <div className="border-b border-white/8 mb-5" />

        {/* MT5 Button */}
        <button
          onClick={() => updateOrder({ platform: 'mt5' })}
          className="w-full rounded-xl flex items-center gap-3 px-5 py-4 transition-all hover:opacity-90 active:scale-[0.99]"
          style={{ background: '#2563eb', color: 'white' }}
        >
          <MT5Icon />
          <span className="text-base font-semibold">MetaTrader 5</span>
        </button>
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