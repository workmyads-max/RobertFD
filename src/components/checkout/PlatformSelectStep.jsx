import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Clock, Monitor } from 'lucide-react';

const PLATFORMS = [
  {
    id: 'mt5',
    name: 'MetaTrader 5',
    subtitle: 'Industry Standard',
    description: 'The world\'s most popular trading platform with advanced charting, Expert Advisors, and algorithmic trading support.',
    features: ['Expert Advisors (EAs)', 'Advanced charting & indicators', 'Algorithmic trading support', 'Multi-asset trading'],
    available: true,
  },
  {
    id: 'match_trader',
    name: 'Match Trader',
    subtitle: 'Institutional Platform',
    description: 'Professional Match Trader platform with real broker-level infrastructure.',
    features: ['Mobile + Desktop', 'Real broker engine', 'Live credentials'],
    available: false,
  },
  {
    id: 'xtrading',
    name: 'XTrading',
    subtitle: 'Built-in Terminal',
    description: 'Fully integrated simulated trading terminal built into the dashboard.',
    features: ['No download required', 'Real-time prices', 'Built-in dashboard'],
    available: false,
  },
  {
    id: 'tradelocker',
    name: 'TradeLocker',
    subtitle: 'Next-Gen Platform',
    description: 'Modern platform built for prop firms with advanced risk tools.',
    features: ['Modern UI', 'Advanced risk tools', 'Multi-account'],
    available: false,
  },
];

function MT5Logo({ size = 52 }) {
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
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary/10">
              <Monitor className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-white">Select Trading Platform</h2>
          </div>
          <p className="text-sm text-white/40 ml-12">Choose where you'll trade. This is permanently assigned to your account.</p>
        </div>

        {/* MT5 Card */}
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.005 }}
          whileTap={{ scale: 0.995 }}
          onClick={() => updateOrder({ platform: 'mt5' })}
          className="relative w-full rounded-xl p-6 text-left transition-all duration-200"
          style={{
            background: selected === 'mt5'
              ? 'rgba(0,80,180,0.08)'
              : 'rgba(255,255,255,0.02)',
            border: `1.5px solid ${selected === 'mt5' ? 'rgba(37,99,235,0.45)' : 'rgba(255,255,255,0.08)'}`,
          }}
        >
          {/* Badges */}
          <div className="flex items-center gap-2 absolute top-5 left-5">
            <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide"
              style={{ background: 'rgba(37,99,235,0.12)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.2)' }}>
              Available
            </span>
          </div>

          {selected === 'mt5' && (
            <div className="absolute top-5 right-5">
              <CheckCircle2 className="w-5 h-5 text-blue-500" />
            </div>
          )}

          <div className="flex items-start gap-5 mt-9">
            <div className="flex-shrink-0 mt-1">
              <MT5Logo size={52} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-lg font-bold text-white mb-1">MetaTrader 5</div>
              <div className="text-xs text-blue-300/70 mb-4 font-medium">Industry Standard Platform</div>
              <p className="text-sm text-white/45 leading-relaxed mb-4">
                The world's most popular trading platform with advanced charting, Expert Advisors, and full algorithmic trading support.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {['Expert Advisors (EAs)', 'Advanced charting', 'Algorithmic trading', 'Multi-asset support'].map(f => (
                  <div key={f} className="flex items-center gap-2.5 text-xs text-white/50 font-medium">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-blue-500/60" />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.button>

        {/* Coming Soon */}
        <div>
          <div className="text-[11px] text-white/20 font-semibold uppercase tracking-widest mb-3">Coming Soon</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PLATFORMS.filter(p => !p.available).map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.06 }}
                className="relative rounded-lg p-4 text-left opacity-45 pointer-events-none"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div className="absolute top-3 right-3">
                  <span className="px-2 py-0.5 rounded text-[9px] font-semibold text-white/30 border border-white/10">
                    Soon
                  </span>
                </div>
                <div className="text-lg mb-2 mt-1">
                  {p.id === 'match_trader' ? '📊' : p.id === 'xtrading' ? '⚡' : '🔓'}
                </div>
                <div className="text-xs font-semibold text-white/40 mb-0.5">{p.name}</div>
                <div className="text-[10px] text-white/25 mb-2">{p.subtitle}</div>
                <div className="flex items-center gap-1 mt-2">
                  <Clock className="w-3 h-3 text-white/20" />
                  <span className="text-[9px] text-white/20">In Development</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT: Summary */}
      <div className="lg:col-span-2">
        <div className="sticky top-6 space-y-4">
          <div className="rounded-xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="px-5 py-3.5 border-b border-white/5 bg-white/[0.01]">
              <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">Order Summary</span>
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
                  <span className="text-xs text-white/35">{label}</span>
                  <span className={`text-xs font-semibold ${highlight ? 'text-primary' : 'text-white/80'}`}>{value}</span>
                </div>
              ))}
              <div className="border-t border-white/8 pt-3 mt-1">
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
            style={{
              background: 'linear-gradient(90deg, #FF5C00, #FF7A2F)',
              color: 'white',
            }}
          >
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}