import React, { useEffect } from 'react';
import { ArrowRight, CheckCircle2, Clock, Monitor, BarChart3, Zap, Unlock } from 'lucide-react';

const COMING_SOON = [
  { id: 'match_trader', name: 'Match Trader', subtitle: 'Institutional Platform', icon: BarChart3 },
  { id: 'xtrading', name: 'XTrading', subtitle: 'Built-in Terminal', icon: Zap },
  { id: 'tradelocker', name: 'TradeLocker', subtitle: 'Next-Gen Platform', icon: Unlock },
];

export default function PlatformSelectStep({ order, updateOrder, onNext }) {
  useEffect(() => {
    if (!order.platform) updateOrder({ platform: 'mt5' });
  }, []);

  return (
    <div className="grid lg:grid-cols-5 gap-8">
      <div className="lg:col-span-3">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10 border border-primary/20">
            <Monitor className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Select Trading Platform</h2>
            <p className="text-sm text-white/35 mt-0.5">Choose where you'll trade. This is permanently assigned to your account.</p>
          </div>
        </div>

        {/* MT5 Platform Hero */}
        <div className="rounded-2xl overflow-hidden mb-6"
          style={{ border: '1px solid rgba(37,99,235,0.25)', background: '#0f172a' }}>

          {/* Top bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <img
                src="https://media.base44.com/images/public/69ff44f98e27baf8957d0676/8cf56f3aa_image.png"
                alt="MT5" width={28} height={28} className="object-contain"
              />
              <span className="text-sm font-semibold text-white">MetaTrader 5</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20">
                Available
              </span>
              <CheckCircle2 className="w-5 h-5 text-blue-500" />
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            <div className="text-[13px] text-white/50 leading-relaxed mb-6">
              The industry-leading platform for professional traders. Advanced charting tools, Expert Advisors, multi-timeframe analysis, and one-click trading — all in one place.
            </div>

            {/* Feature grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { title: 'Expert Advisors', desc: 'Automated trading bots & custom indicators' },
                { title: 'Advanced Charting', desc: '21 timeframes, 80+ technical indicators' },
                { title: 'Algorithmic Trading', desc: 'MQL5 language for custom strategies' },
                { title: 'Multi-Asset Class', desc: 'Forex, indices, commodities & crypto' },
              ].map(f => (
                <div key={f.title} className="flex gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: 'rgba(37,99,235,0.1)' }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white/80">{f.title}</div>
                    <div className="text-[11px] text-white/35 mt-0.5 leading-snug">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom info */}
            <div className="flex items-center gap-4 text-[11px] text-white/30">
              <span>Windows · macOS · iOS · Android</span>
              <span>·</span>
              <span>Free download</span>
              <span>·</span>
              <span>Permanently assigned</span>
            </div>
          </div>
        </div>

        {/* Coming Soon */}
        <div>
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