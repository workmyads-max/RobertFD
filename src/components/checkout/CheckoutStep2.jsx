import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Shield, Zap, Clock, CheckCircle2, CreditCard } from 'lucide-react';
import CouponInput from './CouponInput';

const METHODS = [
  {
    id: 'usdt_trc20',
    label: 'USDT TRC20',
    network: 'Tron Network (TRC20)',
    speed: '~2–5 minutes',
    fee: 'Low network fee',
    icon: '₮',
    color: '#26A17B',
    note: 'Stable, fast, and widely supported.',
  },
  {
    id: 'bitcoin',
    label: 'Bitcoin',
    network: 'Bitcoin Mainnet (BTC)',
    speed: '~20–40 minutes',
    fee: 'Variable BTC fee',
    icon: '₿',
    color: '#F7931A',
    note: 'World\'s most trusted cryptocurrency.',
  },
];

export default function CheckoutStep2({ order, updateOrder, onNext, onBack }) {
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const canContinue = !!order.payment_method;

  const handleApplyCoupon = (coupon) => {
    setAppliedCoupon(coupon);
    updateOrder({ discount_amount: coupon.discountAmount, coupon_code: coupon.code, price: order.original_price ? order.original_price - coupon.discountAmount : order.price - coupon.discountAmount, original_price: order.original_price || order.price });
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    updateOrder({ discount_amount: 0, coupon_code: null, price: order.original_price || order.price });
  };

  return (
    <div className="grid lg:grid-cols-5 gap-8">
      {/* LEFT — Methods */}
      <div className="lg:col-span-3 space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,92,0,0.15)' }}>
              <CreditCard className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-xl font-black text-foreground">Payment Method</h2>
          </div>
          <p className="text-sm text-muted-foreground ml-11">Select your preferred crypto network for payment.</p>
        </div>

        <div className="space-y-4">
          {METHODS.map((m, i) => {
            const selected = order.payment_method === m.id;
            return (
              <motion.button
                key={m.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => updateOrder({ payment_method: m.id })}
                className="w-full rounded-2xl p-5 text-left transition-all"
                style={{
                  background: selected ? `rgba(${m.id === 'usdt_trc20' ? '38,161,123' : '247,147,26'},0.08)` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${selected ? m.color + '70' : 'rgba(255,255,255,0.08)'}`,
                  boxShadow: selected ? `0 0 32px ${m.color}18, 0 0 0 1px ${m.color}30` : 'none',
                }}
              >
                <div className="flex items-start gap-5">
                  {/* Icon */}
                  <div className="w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center text-2xl font-black"
                    style={{ background: `${m.color}18`, border: `1px solid ${m.color}35`, color: m.color }}>
                    {m.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-base font-bold text-foreground">{m.label}</span>
                      {selected && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                          style={{ background: m.color }}>
                          <CheckCircle2 className="w-2.5 h-2.5" /> Selected
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{m.note}</p>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div className="text-[9px] font-mono text-muted-foreground mb-0.5 uppercase">Network</div>
                        <div className="text-[11px] font-semibold text-foreground leading-tight">{m.network}</div>
                      </div>
                      <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div className="text-[9px] font-mono text-muted-foreground mb-0.5 uppercase">Speed</div>
                        <div className="text-[11px] font-semibold text-foreground leading-tight">{m.speed}</div>
                      </div>
                      <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div className="text-[9px] font-mono text-muted-foreground mb-0.5 uppercase">Fee</div>
                        <div className="text-[11px] font-semibold text-foreground leading-tight">{m.fee}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Coupon Code */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider mb-2">Redeem Coupon Code</div>
          <CouponInput order={order} onApply={handleApplyCoupon} appliedCoupon={appliedCoupon} onRemove={handleRemoveCoupon} />
        </div>

        {/* Security note */}
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(255,92,0,0.06)', border: '1px solid rgba(255,92,0,0.15)' }}>
          <Shield className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Payments are non-refundable once confirmed. Your funded account credentials will be delivered within <strong className="text-foreground">1–24 hours</strong> after blockchain confirmation.
          </p>
        </div>
      </div>

      {/* RIGHT — Summary + CTAs */}
      <div className="lg:col-span-2">
        <div className="sticky top-6 space-y-4">
          {/* Order summary */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
            <div className="px-5 py-3.5 border-b border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Order Summary</span>
            </div>
            <div className="p-5 space-y-3">
              {[
                { label: 'Challenge', value: order.challenge_type === 'two-step' ? 'Two-Step Challenge' : 'Instant Funding' },
                { label: 'Account Size', value: `$${order.account_size?.toLocaleString()}`, highlight: true },
                { label: 'Model', value: order.account_type === 'swing' ? 'Swing' : 'Standard' },
                { label: 'Platform', value: 'RF XTrading' },
                { label: 'Profit Split', value: '80% to Trader' },
                { label: 'Name', value: order.full_name || '—' },
              ].map(({ label, value, highlight }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className={`text-xs font-semibold ${highlight ? 'text-primary' : 'text-foreground'}`}>{value}</span>
                </div>
              ))}
              {appliedCoupon && (
                <div className="flex justify-between items-center text-emerald-400">
                  <span className="text-xs font-mono">Coupon ({appliedCoupon.code})</span>
                  <span className="text-xs font-bold">-${appliedCoupon.discountAmount}</span>
                </div>
              )}
              <div className="border-t border-white/10 pt-3 mt-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold">Total</span>
                  <span className="text-3xl font-black text-primary">${order.price}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <motion.button
            onClick={onNext}
            disabled={!canContinue}
            whileHover={{ scale: canContinue ? 1.02 : 1 }}
            whileTap={{ scale: canContinue ? 0.98 : 1 }}
            className="w-full py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
            style={{
              background: canContinue ? 'linear-gradient(90deg, #FF5C00, #FF7A2F)' : 'rgba(255,255,255,0.07)',
              boxShadow: canContinue ? '0 4px 24px rgba(255,92,0,0.35)' : 'none',
              color: canContinue ? 'white' : 'rgba(255,255,255,0.3)',
              cursor: canContinue ? 'pointer' : 'not-allowed',
            }}
          >
            Proceed to Payment <ArrowRight className="w-4 h-4" />
          </motion.button>

          <button onClick={onBack}
            className="w-full py-3 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <ArrowLeft className="w-4 h-4" /> Back to Details
          </button>
        </div>
      </div>
    </div>
  );
}