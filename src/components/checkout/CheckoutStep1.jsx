import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Monitor, ChevronDown } from 'lucide-react';

const SIZES_TWO = [5000, 10000, 25000, 50000, 100000, 200000];
const SIZES_INSTANT = [10000, 25000, 50000, 100000, 200000];

const ACCOUNT_TYPES = [
  {
    id: 'standard',
    label: 'Standard',
    leverage: '1:100',
    features: ['1:100 Leverage', 'No News Trading', 'No Overnight Hold', 'Aggressive Model'],
    color: '#FF5C00',
  },
  {
    id: 'swing',
    label: 'Swing',
    leverage: '1:30',
    features: ['1:30 Leverage', 'News Trading ✓', 'Overnight Hold ✓', 'Weekend Hold ✓'],
    color: '#CCFF00',
  },
];

const COUNTRIES = ['United States','United Kingdom','Singapore','Australia','Canada','Germany','France','UAE','India','Japan','Other'];

const PLATFORMS = [
  { id: 'xtrading', label: 'RF XTrading', sub: 'Robert Funds Native Platform', active: true },
  { id: 'mt5', label: 'MetaTrader 5', sub: 'Coming Soon', active: false },
  { id: 'tradelocker', label: 'TradeLocker', sub: 'Coming Soon', active: false },
];

function InputField({ label, value, onChange, type = 'text', required, placeholder }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      <label className="block text-xs font-mono text-muted-foreground mb-1.5 uppercase tracking-wider">{label}{required && ' *'}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full rounded-xl px-4 py-3 text-sm text-foreground outline-none transition-all"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: `1px solid ${focused ? 'rgba(255,92,0,0.5)' : 'rgba(255,255,255,0.1)'}`,
          boxShadow: focused ? '0 0 0 3px rgba(255,92,0,0.08)' : 'none',
        }}
      />
    </div>
  );
}

export default function CheckoutStep1({ order, updateOrder, onNext, prices }) {
  const [errors, setErrors] = useState({});

  const sizes = order.challenge_type === 'two-step' ? SIZES_TWO : SIZES_INSTANT;

  const validate = () => {
    const e = {};
    if (!order.full_name) e.full_name = true;
    if (!order.username) e.username = true;
    if (!order.email || !order.email.includes('@')) e.email = true;
    if (!order.phone) e.phone = true;
    if (!order.country) e.country = true;
    if (!order.city) e.city = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => { if (validate()) onNext(); };

  const setSize = (size) => {
    const price = prices[order.challenge_type]?.[size] || 0;
    updateOrder({ account_size: size, price });
  };

  const setType = (type) => {
    const validSizes = type === 'two-step' ? SIZES_TWO : SIZES_INSTANT;
    const size = validSizes.includes(order.account_size) ? order.account_size : validSizes[3];
    const price = prices[type]?.[size] || 0;
    updateOrder({ challenge_type: type, account_size: size, price });
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Left — Config */}
      <div className="lg:col-span-2 space-y-7">
        {/* Challenge Type */}
        <div>
          <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">Challenge Type</h3>
          <div className="grid grid-cols-2 gap-3">
            {['two-step', 'instant'].map((t) => (
              <button key={t} onClick={() => setType(t)}
                className="rounded-xl p-4 text-left transition-all hover:scale-[1.02]"
                style={{
                  background: order.challenge_type === t ? 'rgba(255,92,0,0.12)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${order.challenge_type === t ? 'rgba(255,92,0,0.5)' : 'rgba(255,255,255,0.08)'}`,
                  boxShadow: order.challenge_type === t ? '0 0 20px rgba(255,92,0,0.1)' : 'none',
                }}>
                <div className="text-sm font-bold text-foreground capitalize">{t === 'two-step' ? 'Two-Step Challenge' : 'Instant Funding'}</div>
                <div className="text-xs text-muted-foreground mt-1">{t === 'two-step' ? 'Phase 1 → Phase 2 → Funded' : 'Skip straight to funded'}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Account Size */}
        <div>
          <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">Account Size</h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {sizes.map((size) => (
              <button key={size} onClick={() => setSize(size)}
                className="rounded-xl py-3 text-center text-sm font-bold transition-all hover:scale-105"
                style={{
                  background: order.account_size === size ? 'rgba(255,92,0,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${order.account_size === size ? 'rgba(255,92,0,0.5)' : 'rgba(255,255,255,0.08)'}`,
                  color: order.account_size === size ? '#FF5C00' : 'hsl(var(--foreground))',
                }}>
                ${(size / 1000)}K
              </button>
            ))}
          </div>
        </div>

        {/* Account Type */}
        <div>
          <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">Account Model</h3>
          <div className="grid grid-cols-2 gap-3">
            {ACCOUNT_TYPES.map((at) => (
              <button key={at.id} onClick={() => updateOrder({ account_type: at.id, leverage: at.leverage })}
                className="rounded-xl p-4 text-left transition-all hover:scale-[1.02]"
                style={{
                  background: order.account_type === at.id ? `${at.color}12` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${order.account_type === at.id ? `${at.color}50` : 'rgba(255,255,255,0.08)'}`,
                }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-foreground">{at.label}</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full" style={{ background: `${at.color}15`, color: at.color }}>{at.leverage}</span>
                </div>
                <div className="space-y-1">
                  {at.features.map(f => <div key={f} className="text-xs text-muted-foreground">{f}</div>)}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Platform */}
        <div>
          <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">Trading Platform</h3>
          <div className="grid grid-cols-3 gap-3">
            {PLATFORMS.map((p) => (
              <button key={p.id}
                onClick={() => p.active && updateOrder({ platform: p.id })}
                disabled={!p.active}
                className={`rounded-xl p-4 text-left transition-all ${p.active ? 'hover:scale-[1.02] cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                style={{
                  background: order.platform === p.id ? 'rgba(255,92,0,0.12)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${order.platform === p.id ? 'rgba(255,92,0,0.5)' : 'rgba(255,255,255,0.08)'}`,
                }}>
                <Monitor className={`w-4 h-4 mb-2 ${order.platform === p.id ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="text-xs font-bold text-foreground">{p.label}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{p.sub}</div>
                {!p.active && <div className="mt-1 text-[10px] font-mono text-yellow-400">Coming Soon</div>}
              </button>
            ))}
          </div>
        </div>

        {/* Personal Info */}
        <div>
          <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Full Name" value={order.full_name} onChange={v => updateOrder({ full_name: v })} required placeholder="John Smith" />
            <InputField label="Username" value={order.username} onChange={v => updateOrder({ username: v })} required placeholder="trader_john" />
            <InputField label="Email Address" value={order.email} onChange={v => updateOrder({ email: v })} type="email" required placeholder="you@email.com" />
            <InputField label="Phone Number" value={order.phone} onChange={v => updateOrder({ phone: v })} type="tel" required placeholder="+1 234 567 8900" />
            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-1.5 uppercase tracking-wider">Country *</label>
              <select value={order.country} onChange={e => updateOrder({ country: e.target.value })}
                className="w-full rounded-xl px-4 py-3 text-sm text-foreground outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${errors.country ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}` }}>
                <option value="">Select Country</option>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <InputField label="City" value={order.city} onChange={v => updateOrder({ city: v })} required placeholder="New York" />
            <InputField label="Street Address" value={order.address} onChange={v => updateOrder({ address: v })} placeholder="123 Main St" />
            <InputField label="Postal Code" value={order.postal_code} onChange={v => updateOrder({ postal_code: v })} placeholder="10001" />
          </div>
        </div>
      </div>

      {/* Right — Summary */}
      <div>
        <div className="sticky top-6">
          <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h3 className="text-sm font-bold text-foreground mb-5">Order Summary</h3>
            <div className="space-y-3 mb-5">
              {[
                { label: 'Challenge Type', value: order.challenge_type === 'two-step' ? 'Two-Step Challenge' : 'Instant Funding' },
                { label: 'Account Size', value: `$${order.account_size.toLocaleString()}` },
                { label: 'Account Model', value: order.account_type === 'swing' ? 'Swing Account' : 'Standard Account' },
                { label: 'Leverage', value: order.leverage || '1:100' },
                { label: 'Platform', value: order.platform === 'xtrading' ? 'RF XTrading' : order.platform },
                { label: 'Profit Split', value: '80/20' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="text-xs font-semibold text-foreground">{value}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-white/10 pt-4 mb-5">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-foreground">Total</span>
                <span className="text-2xl font-black text-primary">${order.price}</span>
              </div>
            </div>
            <button onClick={handleNext}
              className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:scale-105"
              style={{ background: 'linear-gradient(90deg, #FF5C00, #FF7A2F)', boxShadow: '0 4px 20px rgba(255,92,0,0.35)' }}>
              Continue to Payment <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}