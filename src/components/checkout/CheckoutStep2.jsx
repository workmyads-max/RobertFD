import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Wallet, Smartphone, CheckCircle, ArrowRight } from 'lucide-react';

const PAYMENT_METHODS = [
  {
    id: 'checkout_com',
    label: 'Credit/Debit Card',
    icon: CreditCard,
    color: '#635BFF',
    methods: 'Visa • Mastercard • American Express',
    features: ['Instant confirmation', 'Secure checkout', 'Apple & Google Pay'],
    checkColor: '#22c55e',
  },
  {
    id: 'confirmo',
    label: 'Cryptocurrency',
    icon: Wallet,
    color: '#F7931A',
    methods: 'Bitcoin • Ethereum • USDT • USDC',
    features: ['Lower fees', 'Global access', 'Blockchain secured'],
    checkColor: '#f59e0b',
  },
  {
    id: 'usdt_trc20',
    label: 'USDT TRC20',
    icon: Smartphone,
    color: '#26A17B',
    methods: 'Tether TRC20',
    features: ['Fast transfers', 'Low network fees'],
    checkColor: '#22c55e',
  },
  {
    id: 'bitcoin',
    label: 'Bitcoin',
    icon: Wallet,
    color: '#F7931A',
    methods: 'Bitcoin (BTC)',
    features: ['Decentralized', 'No intermediaries'],
    checkColor: '#f59e0b',
  },
];

export default function CheckoutStep2({ order, updateOrder, onNext, onBack, isLoggedIn }) {
  const [selectedMethod, setSelectedMethod] = useState(order.payment_method || null);

  const handleSelect = (method) => {
    setSelectedMethod(method);
    updateOrder({ 
      payment_method: method,
      payment_gateway: method === 'checkout_com' ? 'checkout_com' : method === 'confirmo' ? 'confirmo' : 'manual'
    });
  };

  const handleContinue = () => {
    if (selectedMethod) onNext();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Choose Payment Method</h2>
        <p className="text-sm text-white/40">Select your preferred payment method for instant processing</p>
      </div>

      <div className="grid md:grid-cols-2 gap-3 mb-8">
        {PAYMENT_METHODS.map((method, index) => {
          const Icon = method.icon;
          const isSelected = selectedMethod === method.id;
          
          return (
            <button
              key={method.id}
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
          );
        })}
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
              <h3 className="text-sm font-semibold text-white">
                {selectedMethod === 'checkout_com' && 'Card Payment via Checkout.com'}
                {selectedMethod === 'confirmo' && 'Crypto Payment via Confirmo'}
                {selectedMethod === 'usdt_trc20' && 'Manual USDT TRC20 Transfer'}
                {selectedMethod === 'bitcoin' && 'Manual Bitcoin Transfer'}
              </h3>
            </div>

            <div className="space-y-1.5 text-sm text-white/35 pl-11">
              {selectedMethod === 'checkout_com' && (
                <>
                  <p>• Secure card processing with SSL encryption</p>
                  <p>• Supports Visa, Mastercard, American Express</p>
                  <p>• Apple Pay and Google Pay available</p>
                  <p>• Instant payment confirmation</p>
                </>
              )}
              {selectedMethod === 'confirmo' && (
                <>
                  <p>• Multi-cryptocurrency support (BTC, ETH, USDT, USDC)</p>
                  <p>• Automatic blockchain confirmation tracking</p>
                  <p>• QR code provided for easy payment</p>
                  <p>• Typically confirms within 10-30 minutes</p>
                </>
              )}
              {(selectedMethod === 'usdt_trc20' || selectedMethod === 'bitcoin') && (
                <>
                  <p>• Manual wallet address will be provided</p>
                  <p>• Send exact amount to the displayed address</p>
                  <p>• Payment confirmation within 1-24 hours</p>
                  <p>• Make sure to use the correct network</p>
                </>
              )}
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