import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ArrowRight, Smartphone } from 'lucide-react';

const USDT_TRC20 = {
  id: 'usdt_trc20',
  label: 'USDT TRC20',
  icon: Smartphone,
  color: '#26A17B',
  methods: 'Tether TRC20',
  features: ['Fast transfers', 'Low network fees', 'Auto-detection'],
  checkColor: '#22c55e',
};

export default function CheckoutStep2({ order, updateOrder, onNext, onBack, isLoggedIn }) {
  const [selectedMethod, setSelectedMethod] = useState(order.payment_method || 'usdt_trc20');

  const handleSelect = (method) => {
    setSelectedMethod(method);
    updateOrder({
      payment_method: method,
      payment_gateway: 'manual'
    });
  };

  const handleContinue = () => {
    if (selectedMethod) onNext();
  };

  const method = USDT_TRC20;
  const Icon = method.icon;
  const isSelected = selectedMethod === method.id;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Payment Method</h2>
        <p className="text-sm text-white/40">We accept USDT TRC20 for instant payment processing</p>
      </div>

      <div className="grid md:grid-cols-2 gap-3 mb-8">
        <button
          onClick={() => handleSelect(method.id)}
          className="relative p-5 rounded-xl text-left transition-all duration-200 hover:border-white/20"
          style={{
            background: isSelected ? `${method.color}08` : 'rgba(255,255,255,0.02)',
            border: `1.5px solid ${isSelected ? method.color + '50' : 'rgba(255,255,255,0.08)'}`,
          }}
        >
          <div className="flex items-start gap-4 mb-4">
            <div
              className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: `${method.color}12`,
                border: `1px solid ${method.color}20`
              }}
            >
              <Icon className="w-5 h-5" style={{ color: method.color }} />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-white mb-0.5">{method.label}</h3>
              <p className="text-xs text-white/35 font-medium">{method.methods}</p>
            </div>
            {isSelected && (
              <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {method.features.map((feature, i) => (
              <span
                key={i}
                className="text-[11px] font-medium flex items-center gap-1.5"
                style={{ color: method.checkColor }}
              >
                <span style={{ fontSize: '10px' }}>✓</span> {feature}
              </span>
            ))}
          </div>
        </button>

        {/* Info card */}
        <div className="p-5 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}>
          <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider mb-3">How it works</div>
          <div className="space-y-2.5 text-xs text-white/35">
            <p>1. Send the exact USDT amount to our wallet address</p>
            <p>2. Your payment is auto-detected within minutes</p>
            <p>3. Optionally paste your TXID to speed up verification</p>
            <p>4. Admin approves and your MT5 account is provisioned</p>
          </div>
        </div>
      </div>

      {/* Selected method detail */}
      <AnimatePresence>
        {selectedMethod && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl p-5 mb-6"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10 border border-primary/20">
                <CheckCircle className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-white">USDT TRC20 Transfer</h3>
            </div>

            <div className="space-y-1.5 text-sm text-white/35 pl-11">
              <p>• Send USDT via the TRC20 (Tron) network only</p>
              <p>• Payment is auto-detected within a few minutes</p>
              <p>• You can optionally paste your TXID to speed up verification</p>
              <p>• Challenge account details are delivered via email after admin approval</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={onBack}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white/35 hover:text-white/60 transition-colors"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          ← Back
        </button>
        <button
          onClick={handleContinue}
          disabled={!selectedMethod}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(90deg, #FF5C00, #FF7A2F)',
            color: 'white',
          }}
        >
          Continue to Payment <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}