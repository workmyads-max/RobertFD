import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, User } from 'lucide-react';

const COUNTRIES = [
  'United States','United Kingdom','Singapore','Australia','Canada','Germany',
  'France','Netherlands','UAE','Saudi Arabia','India','Japan','Brazil','Mexico',
  'South Africa','Nigeria','Philippines','Indonesia','Malaysia','Thailand','Other'
];

function InputField({ label, value, onChange, type = 'text', required, placeholder, hasError, autoComplete }) {
  const [focused, setFocused] = useState(false);
  const borderColor = hasError
    ? 'rgba(239,68,68,0.6)'
    : focused
    ? 'rgba(255,92,0,0.55)'
    : 'rgba(255,255,255,0.1)';
  const shadow = hasError
    ? '0 0 0 3px rgba(239,68,68,0.08)'
    : focused
    ? '0 0 0 3px rgba(255,92,0,0.08)'
    : 'none';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      <label className="block text-[11px] font-mono text-muted-foreground mb-1.5 uppercase tracking-wider">
        {label}{required && <span className="text-primary ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full rounded-xl px-4 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/40"
        style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${borderColor}`, boxShadow: shadow }}
      />
      {hasError && (
        <p className="text-[10px] text-red-400 font-mono mt-1">Required field</p>
      )}
    </motion.div>
  );
}

export default function CheckoutStep1({ order, updateOrder, onNext }) {
  const [errors, setErrors] = useState({});
  const [attempted, setAttempted] = useState(false);

  const isValid =
    order.full_name?.trim() &&
    order.username?.trim() &&
    order.email?.includes('@') &&
    order.phone?.trim() &&
    order.country &&
    order.city?.trim();

  const validate = () => {
    const e = {};
    if (!order.full_name?.trim()) e.full_name = true;
    if (!order.username?.trim()) e.username = true;
    if (!order.email?.includes('@')) e.email = true;
    if (!order.phone?.trim()) e.phone = true;
    if (!order.country) e.country = true;
    if (!order.city?.trim()) e.city = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    setAttempted(true);
    if (validate()) onNext();
  };

  return (
    <div className="grid lg:grid-cols-5 gap-8">
      {/* LEFT — Form */}
      <div className="lg:col-span-3 space-y-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,92,0,0.15)' }}>
              <User className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-xl font-black text-foreground">Personal Information</h2>
          </div>
          <p className="text-sm text-muted-foreground ml-11">Fill in your details to create your trader profile.</p>
        </div>

        {/* Name row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField label="Full Name" value={order.full_name} onChange={v => updateOrder({ full_name: v })}
            required placeholder="John Smith" hasError={attempted && errors.full_name} autoComplete="name" />
          <InputField label="Username" value={order.username} onChange={v => updateOrder({ username: v })}
            required placeholder="trader_john" hasError={attempted && errors.username} autoComplete="username" />
        </div>

        {/* Contact row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField label="Email Address" value={order.email} onChange={v => updateOrder({ email: v })}
            type="email" required placeholder="you@email.com" hasError={attempted && errors.email} autoComplete="email" />
          <InputField label="Phone Number" value={order.phone} onChange={v => updateOrder({ phone: v })}
            type="tel" required placeholder="+1 234 567 8900" hasError={attempted && errors.phone} autoComplete="tel" />
        </div>

        {/* Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <label className="block text-[11px] font-mono text-muted-foreground mb-1.5 uppercase tracking-wider">
              Country<span className="text-primary ml-0.5">*</span>
            </label>
            <select
              value={order.country}
              onChange={e => updateOrder({ country: e.target.value })}
              className="w-full rounded-xl px-4 py-3 text-sm text-foreground outline-none appearance-none"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${attempted && errors.country ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.1)'}`,
              }}
            >
              <option value="">Select Country</option>
              {COUNTRIES.map(c => <option key={c} value={c} className="bg-[#0e0e10]">{c}</option>)}
            </select>
            {attempted && errors.country && <p className="text-[10px] text-red-400 font-mono mt-1">Required field</p>}
          </motion.div>
          <InputField label="City" value={order.city} onChange={v => updateOrder({ city: v })}
            required placeholder="New York" hasError={attempted && errors.city} autoComplete="address-level2" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField label="Street Address" value={order.address} onChange={v => updateOrder({ address: v })}
            placeholder="123 Main Street" autoComplete="street-address" />
          <InputField label="Postal Code" value={order.postal_code} onChange={v => updateOrder({ postal_code: v })}
            placeholder="10001" autoComplete="postal-code" />
        </div>

        {/* Security badge */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">Your information is encrypted and never shared with third parties.</p>
        </div>
      </div>

      {/* RIGHT — Summary + CTA */}
      <div className="lg:col-span-2">
        <div className="sticky top-6 space-y-4">
          {/* Order Summary Card */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
            <div className="px-5 py-4 border-b border-white/5"
              style={{ background: 'rgba(255,255,255,0.02)' }}>
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Order Summary</span>
            </div>
            <div className="p-5 space-y-3">
              {[
                { label: 'Challenge Type', value: order.challenge_type === 'two-step' ? 'Two-Step Challenge' : 'Instant Funding' },
                { label: 'Account Size', value: `$${order.account_size?.toLocaleString()}`, highlight: true },
                { label: 'Account Model', value: order.account_type === 'swing' ? 'Swing Account' : 'Standard Account' },
                { label: 'Leverage', value: order.leverage || '1:100' },
                { label: 'Platform', value: order.platform === 'xtrading' ? 'RF XTrading' : order.platform },
                { label: 'Profit Split', value: '80/20' },
              ].map(({ label, value, highlight }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className={`text-xs font-semibold ${highlight ? 'text-primary' : 'text-foreground'}`}>{value}</span>
                </div>
              ))}

              <div className="border-t border-white/10 pt-4 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-foreground">Total</span>
                  <span className="text-3xl font-black text-primary">${order.price}</span>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <motion.button
            onClick={handleNext}
            whileHover={{ scale: isValid ? 1.02 : 1 }}
            whileTap={{ scale: isValid ? 0.98 : 1 }}
            className="w-full py-4 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all"
            style={{
              background: isValid
                ? 'linear-gradient(90deg, #FF5C00, #FF7A2F)'
                : 'rgba(255,255,255,0.08)',
              boxShadow: isValid ? '0 4px 24px rgba(255,92,0,0.35)' : 'none',
              color: isValid ? 'white' : 'rgba(255,255,255,0.35)',
              cursor: isValid ? 'pointer' : 'not-allowed',
            }}
          >
            Continue to Payment <ArrowRight className="w-4 h-4" />
          </motion.button>

          {!isValid && attempted && (
            <p className="text-xs text-center text-red-400 font-mono">Please fill all required fields to continue.</p>
          )}

          <p className="text-[11px] text-center text-muted-foreground">
            By continuing, you agree to Robert Funds{' '}
            <a href="#" className="text-primary hover:underline">Terms of Service</a>
          </p>
        </div>
      </div>
    </div>
  );
}