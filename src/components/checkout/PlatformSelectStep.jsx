import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Clock, Monitor } from 'lucide-react';

const PLATFORMS = [
  {
    id: 'mt5',
    name: 'MetaTrader 5',
    subtitle: 'Industry Standard',
    description: "The world's most popular trading platform with advanced charting, Expert Advisors, and algorithmic trading support.",
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

// MT5 SVG logo
function MT5Logo({ size = 48 }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="12" fill="url(#mt5g)" />
      <defs>
        <linearGradient id="mt5g" x1="0" y1="0" x2="48" y2="48">
          <stop offset="0%" stopColor="#1a8cff" />
          <stop offset="100%" stopColor="#003399" />
        </linearGradient>
      </defs>
      <rect x="7" y="26" width="6" height="14" rx="2" fill="rgba(255,255,255,0.45)" />
      <rect x="16" y="19" width="6" height="21" rx="2" fill="rgba(255,255,255,0.65)" />
      <rect x="25" y="12" width="6" height="28" rx="2" fill="white" />
      <rect x="34" y="16" width="6" height="24" rx="2" fill="rgba(255,255,255,0.65)" />
      <text x="6" y="10" fontSize="8" fontWeight="900" fill="white" fontFamily="Arial" letterSpacing="0.8">MT5</text>
    </svg>
  );
}

export default function PlatformSelectStep({ order, updateOrder, onNext }) {
  const selected = order.platform || '';

  // Auto-select MT5 if nothing selected
  useEffect(() => {
    if (!selected) updateOrder({ platform: 'mt5' });
  }, []);

  return (
    <div className="grid lg:grid-cols-5 gap-8">
      <div className="lg:col-span-3 space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,92,0,0.15)' }}>
              <Monitor className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-xl font-black text-foreground">Select Trading Platform</h2>
          </div>
          <p className="text-sm text-muted-foreground ml-11">Choose where you'll trade. This is permanently assigned to your account.</p>
        </div>

        {/* MT5 — premium featured card */}
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
          onClick={() => updateOrder({ platform: 'mt5' })}
          className="relative w-full rounded-2xl p-6 text-left transition-all"
          style={{
            background: selected === 'mt5'
              ? 'linear-gradient(135deg, rgba(0,80,180,0.18) 0%, rgba(0,40,100,0.22) 100%)'
              : 'linear-gradient(135deg, rgba(0,60,140,0.1) 0%, rgba(0,30,80,0.14) 100%)',
            border: `1.5px solid ${selected === 'mt5' ? 'rgba(0,122,255,0.6)' : 'rgba(0,100,200,0.3)'}`,
            boxShadow: selected === 'mt5'
              ? '0 0 40px rgba(0,102,204,0.2), inset 0 1px 0 rgba(255,255,255,0.06)'
              : '0 0 20px rgba(0,80,160,0.08)',
          }}
        >
          {/* Selected checkmark */}
          {selected === 'mt5' && (
            <div className="absolute top-4 right-4">
              <CheckCircle2 className="w-5 h-5 text-blue-400" />
            </div>
          )}

          {/* "Available" badge */}
          <div className="absolute top-4 left-4">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black"
              style={{ background: 'rgba(0,122,255,0.2)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.4)' }}>
              ✓ Available Now
            </span>
          </div>

          <div className="flex items-start gap-5 mt-8">
            <div className="flex-shrink-0">
              <MT5Logo size={56} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-lg font-black text-white mb-0.5">MetaTrader 5</div>
              <div className="text-xs font-mono mb-3" style={{ color: 'rgba(147,197,253,0.7)' }}>Industry Standard Platform</div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                The world's most popular trading platform with advanced charting, Expert Advisors, and full algorithmic trading support.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {['Expert Advisors (EAs)', 'Advanced charting', 'Algorithmic trading', 'Multi-asset support'].map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs" style={{ color: 'rgba(147,197,253,0.8)' }}>
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-blue-400" />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.button>

        {/* Coming soon platforms — 3 in a row */}
        <div>
          <div className="text-xs font-mono text-muted-foreground/50 uppercase tracking-widest mb-3">Coming Soon</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PLATFORMS.filter(p => !p.available).map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.06 }}
                className="relative rounded-xl p-4 text-left"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  opacity: 0.5,
                  cursor: 'not-allowed',
                }}
              >
                <div className="absolute top-2.5 right-2.5">
                  <span className="px-2 py-0.5 rounded-full text-[8px] font-black"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    Coming Soon
                  </span>
                </div>
                <div className="text-lg mb-2 mt-1">
                  {p.id === 'match_trader' ? '📊' : p.id === 'xtrading' ? '⚡' : '🔓'}
                </div>
                <div className="text-xs font-bold text-foreground/50 mb-0.5">{p.name}</div>
                <div className="text-[9px] font-mono text-muted-foreground/40 mb-2">{p.subtitle}</div>
                <div className="flex items-center gap-1 mt-2">
                  <Clock className="w-3 h-3 text-muted-foreground/30" />
                  <span className="text-[9px] font-mono text-muted-foreground/30">In Development</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT summary + CTA */}
      <div className="lg:col-span-2">
        <div className="sticky top-6 space-y-4">
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
            <div className="px-5 py-3.5 border-b border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
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
              <div className="border-t border-white/10 pt-3 mt-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold">Total</span>
                  <span className="text-3xl font-black text-primary">${order.price}</span>
                </div>
              </div>
            </div>
          </div>

          <motion.button
            onClick={onNext}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
            style={{
              background: 'linear-gradient(90deg, #FF5C00, #FF7A2F)',
              boxShadow: '0 4px 24px rgba(255,92,0,0.35)',
              color: 'white',
            }}
          >
            Continue <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}