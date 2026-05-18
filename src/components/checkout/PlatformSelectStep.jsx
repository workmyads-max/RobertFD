import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Clock, Monitor } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const ALL_PLATFORMS = [
  {
    id: 'match_trader',
    name: 'Match Trader',
    subtitle: 'Institutional Platform',
    description: 'Professional Match Trader platform with real broker-level infrastructure and live market data.',
    badge: 'Recommended',
    badgeColor: '#10b981',
    features: ['Mobile + Desktop', 'Real broker engine', 'Live MT credentials'],
    icon: '📊',
  },
  {
    id: 'mt5',
    name: 'MetaTrader 5',
    subtitle: 'Industry Standard',
    description: "The world's most popular trading platform with advanced charting and algorithmic trading support.",
    badge: 'Popular',
    badgeColor: '#0066CC',
    features: ['Expert Advisors', 'Advanced charting', 'Algorithmic trading'],
    icon: '📈',
  },
  {
    id: 'tradelocker',
    name: 'TradeLocker',
    subtitle: 'Next-Gen Platform',
    description: 'Modern trading platform built for prop firms with advanced risk tools and multi-account management.',
    badge: 'Modern',
    badgeColor: '#8b5cf6',
    features: ['Modern UI', 'Advanced risk tools', 'Multi-account'],
    icon: '🔓',
  },
];

export default function PlatformSelectStep({ order, updateOrder, onNext }) {
  const selected = order.platform || '';

  const { data: platformSettings = [] } = useQuery({
    queryKey: ['platform-settings-trading'],
    queryFn: () => base44.entities.PlatformSettings.filter({ category: 'trading' }),
  });
  const enabledMap = Object.fromEntries(
    platformSettings.map(s => [s.setting_key, s.is_enabled !== false])
  );

  // If a platform has no setting record yet, default to enabled
  const PLATFORMS = ALL_PLATFORMS.map(p => ({
    ...p,
    available: enabledMap[p.id] !== false,
  }));

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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PLATFORMS.map((p, i) => {
            const isSelected = selected === p.id;
            return (
              <motion.button
                key={p.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                whileHover={p.available ? { scale: 1.02 } : {}}
                whileTap={p.available ? { scale: 0.98 } : {}}
                onClick={() => p.available && updateOrder({ platform: p.id })}
                disabled={!p.available}
                className="relative rounded-2xl p-5 text-left transition-all"
                style={{
                  background: isSelected ? 'rgba(255,92,0,0.08)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${isSelected ? 'rgba(255,92,0,0.5)' : 'rgba(255,255,255,0.08)'}`,
                  boxShadow: isSelected ? '0 0 28px rgba(255,92,0,0.15)' : 'none',
                  opacity: p.available ? 1 : 0.45,
                  cursor: p.available ? 'pointer' : 'not-allowed',
                }}
              >
                {/* Badge */}
                <div className="absolute top-3 right-3">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black"
                    style={{ background: `${p.badgeColor}20`, color: p.badgeColor, border: `1px solid ${p.badgeColor}40` }}>
                    {p.available ? p.badge : 'Disabled'}
                  </span>
                </div>

                {isSelected && (
                  <div className="absolute top-3 left-3">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                )}

                <div className="text-3xl mb-3 mt-1">{p.icon}</div>
                <div className="text-sm font-black text-foreground mb-0.5">{p.name}</div>
                <div className="text-[10px] font-mono text-muted-foreground mb-2">{p.subtitle}</div>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">{p.description}</p>

                <div className="space-y-1">
                  {p.features.map(f => (
                    <div key={f} className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
                      <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: p.available ? p.badgeColor : '#555' }} />
                      {f}
                    </div>
                  ))}
                </div>

                {!p.available && (
                  <div className="flex items-center gap-1.5 mt-3">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px] font-mono text-muted-foreground">Currently Unavailable</span>
                  </div>
                )}
              </motion.button>
            );
          })}
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
                {
                  label: 'Platform',
                  value: selected ? (PLATFORMS.find(p => p.id === selected)?.name || selected) : '— Select above',
                  highlight: !!selected,
                },
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
            disabled={!selected}
            whileHover={{ scale: selected ? 1.02 : 1 }}
            whileTap={{ scale: selected ? 0.98 : 1 }}
            className="w-full py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
            style={{
              background: selected ? 'linear-gradient(90deg, #FF5C00, #FF7A2F)' : 'rgba(255,255,255,0.07)',
              boxShadow: selected ? '0 4px 24px rgba(255,92,0,0.35)' : 'none',
              color: selected ? 'white' : 'rgba(255,255,255,0.3)',
              cursor: selected ? 'pointer' : 'not-allowed',
            }}
          >
            Continue <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}