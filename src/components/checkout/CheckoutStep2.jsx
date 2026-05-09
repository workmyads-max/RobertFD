import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Zap, Shield } from 'lucide-react';

const METHODS = [
  {
    id: 'usdt_trc20',
    label: 'USDT TRC20',
    network: 'Tron Network',
    speed: '~5 minutes',
    fee: 'Network Fee Only',
    icon: '₮',
    color: '#26A17B',
    description: 'Tether USD on the Tron blockchain. Fast and low-fee.',
  },
  {
    id: 'bitcoin',
    label: 'Bitcoin',
    network: 'BTC Network',
    speed: '~30 minutes',
    fee: 'BTC Network Fee',
    icon: '₿',
    color: '#F7931A',
    description: 'Pay with Bitcoin. Secure and globally accepted.',
  },
];

export default function CheckoutStep2({ order, updateOrder, onNext, onBack }) {
  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <h2 className="text-2xl font-black text-foreground mb-2">Select Payment Method</h2>
        <p className="text-muted-foreground text-sm mb-8">Choose your preferred crypto payment network.</p>

        <div className="space-y-4">
          {METHODS.map((m, i) => {
            const selected = order.payment_method === m.id;
            return (
              <motion.button
                key={m.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => updateOrder({ payment_method: m.id })}
                className="w-full rounded-2xl p-5 text-left transition-all hover:scale-[1.01]"
                style={{
                  background: selected ? `${m.color}10` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${selected ? m.color + '60' : 'rgba(255,255,255,0.08)'}`,
                  boxShadow: selected ? `0 0 30px ${m.color}15` : 'none',
                }}
              >
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black flex-shrink-0"
                    style={{ background: `${m.color}15`, border: `1px solid ${m.color}30`, color: m.color }}>
                    {m.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-base font-bold text-foreground">{m.label}</span>
                      {selected && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                          style={{ background: m.color }}>SELECTED</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{m.description}</p>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Network', value: m.network },
                        { label: 'Confirmation', value: m.speed },
                        { label: 'Fee', value: m.fee },
                      ].map(({ label, value }) => (
                        <div key={label} className="rounded-xl p-2.5"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                          <div className="text-[10px] font-mono text-muted-foreground mb-0.5">{label}</div>
                          <div className="text-xs font-semibold text-foreground">{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 mt-6 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(255,92,0,0.06)', border: '1px solid rgba(255,92,0,0.15)' }}>
          <Shield className="w-4 h-4 text-primary flex-shrink-0" />
          <p className="text-xs text-muted-foreground">All payments are processed securely. Your funded account will be manually delivered within 24 hours after payment confirmation.</p>
        </div>
      </div>

      {/* Summary */}
      <div>
        <div className="sticky top-6 rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 className="text-sm font-bold text-foreground mb-5">Order Summary</h3>
          <div className="space-y-3 mb-5">
            {[
              { label: 'Challenge Type', value: order.challenge_type === 'two-step' ? 'Two-Step' : 'Instant Funding' },
              { label: 'Account Size', value: `$${order.account_size.toLocaleString()}` },
              { label: 'Account Model', value: order.account_type === 'swing' ? 'Swing' : 'Standard' },
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
              <span className="text-sm font-bold">Total</span>
              <span className="text-2xl font-black text-primary">${order.price}</span>
            </div>
          </div>
          <div className="space-y-3">
            <button onClick={onNext} disabled={!order.payment_method}
              className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105"
              style={{ background: 'linear-gradient(90deg, #FF5C00, #FF7A2F)', boxShadow: order.payment_method ? '0 4px 20px rgba(255,92,0,0.35)' : 'none' }}>
              Proceed to Payment <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={onBack} className="w-full py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}