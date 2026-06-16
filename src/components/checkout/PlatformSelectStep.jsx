import React, { useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import PlatformSelectCard from './PlatformSelectCard';

export default function PlatformSelectStep({ order, updateOrder, onNext }) {
  useEffect(() => {
    if (!order.platform) updateOrder({ platform: 'mt5' });
  }, []);

  return (
    <div className="grid lg:grid-cols-5 gap-8">
      <div className="lg:col-span-3">
        <PlatformSelectCard selected={true} />
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