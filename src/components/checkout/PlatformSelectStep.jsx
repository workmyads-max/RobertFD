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
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
            <div className="px-5 py-3.5 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Order Summary</span>
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
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className={`text-xs font-semibold ${highlight ? 'text-primary' : 'text-foreground'}`}>{value}</span>
                </div>
              ))}
              <div className="border-t pt-3 mt-1" style={{ borderColor: 'hsl(var(--border))' }}>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-semibold text-foreground">Total</span>
                  <span className="text-2xl font-bold text-primary">${order.price}</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={onNext}
            className="w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98]"
            style={{ background: 'hsl(var(--primary))', color: 'white' }}
          >
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}