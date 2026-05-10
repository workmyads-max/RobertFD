import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CheckoutStep1 from '../components/checkout/CheckoutStep1';
import CheckoutStep2 from '../components/checkout/CheckoutStep2';
import CheckoutStep3 from '../components/checkout/CheckoutStep3';
import CheckoutStep4 from '../components/checkout/CheckoutStep4';
import { ChevronLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const PRICES = {
  'two-step': { 5000: 49, 10000: 89, 25000: 235, 50000: 349, 100000: 517, 200000: 1089 },
  'instant': { 10000: 270, 25000: 607, 50000: 1350, 100000: 2430, 200000: 4850 },
};

// Steps differ based on whether user is already logged in
const STEPS_GUEST  = ['Personal Info', 'Payment Method', 'Payment', 'Confirmation'];
const STEPS_MEMBER = ['Payment Method', 'Payment', 'Confirmation'];

export default function Checkout() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [step, setStep] = useState(1);
  const [order, setOrder] = useState({
    challenge_type: 'two-step',
    account_type: 'standard',
    account_size: 100000,
    platform: 'xtrading',
    leverage: '1:100',
    price: 517,
    payment_method: '',
    full_name: '', username: '', email: '', phone: '',
    country: '', city: '', address: '', postal_code: '',
  });

  useEffect(() => {
    // Read params from URL
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type') || 'two-step';
    const size = parseInt(params.get('size') || '100000');
    const acctType = params.get('account_type') || 'standard';
    const price = PRICES[type]?.[size] || 517;
    const leverage = acctType === 'swing' ? '1:30' : '1:100';
    setOrder(o => ({ ...o, challenge_type: type, account_size: size, price, account_type: acctType, leverage }));

    // Check auth status and pre-fill if logged in
    base44.auth.me().then(user => {
      if (user?.email) {
        setIsLoggedIn(true);
        setOrder(o => ({
          ...o,
          full_name: user.full_name || o.full_name,
          email: user.email || o.email,
          username: user.full_name?.toLowerCase().replace(/\s+/g, '_') || o.username,
        }));
      }
      setAuthChecked(true);
    }).catch(() => setAuthChecked(true));
  }, []);

  const updateOrder = (data) => setOrder(o => ({ ...o, ...data }));

  // For logged-in users: skip personal info step (step 1 maps to payment method)
  const STEPS = isLoggedIn ? STEPS_MEMBER : STEPS_GUEST;

  // Map visual step to component step (for logged-in users, shift by 1)
  const componentStep = isLoggedIn ? step + 1 : step;
  const prevStep = () => setStep(s => Math.max(1, s - 1));
  const nextStep = () => setStep(s => s + 1);

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-inter">
      {/* Header */}
      <div className="border-b border-white/5" style={{ background: 'rgba(8,8,10,0.98)' }}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #1a0e06, #2a1506)', border: '1px solid rgba(255,92,0,0.4)' }}>
              <span className="text-primary font-black text-xs" style={{ fontFamily: 'Georgia, serif' }}>RF</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-foreground font-bold text-sm">Robert</span>
              <span className="text-primary font-black text-sm">Funds</span>
            </div>
          </a>
          <div className="flex items-center gap-4">
            {isLoggedIn && (
              <span className="text-[10px] font-mono px-2 py-1 rounded-full text-emerald-400"
                style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                ● Signed in · {order.email}
              </span>
            )}
            <a href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back
            </a>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="border-b border-white/5" style={{ background: 'rgba(8,8,10,0.7)' }}>
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center gap-0">
            {STEPS.map((s, i) => {
              const num = i + 1;
              const isActive = step === num;
              const isDone = step > num;
              return (
                <React.Fragment key={s}>
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isDone ? 'bg-emerald-500 text-white' : isActive ? 'bg-primary text-white' : 'bg-white/10 text-muted-foreground'
                    }`}>
                      {isDone ? '✓' : num}
                    </div>
                    <span className={`text-xs font-mono hidden sm:block ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>{s}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-px mx-3 transition-all ${isDone ? 'bg-emerald-500/50' : 'bg-white/10'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Guest: show personal info on step 1 */}
            {!isLoggedIn && componentStep === 1 && (
              <CheckoutStep1 order={order} updateOrder={updateOrder} onNext={nextStep} prices={PRICES} />
            )}
            {/* Payment method */}
            {componentStep === 2 && (
              <CheckoutStep2 order={order} updateOrder={updateOrder} onNext={nextStep} onBack={prevStep} />
            )}
            {/* Payment/confirmation */}
            {componentStep === 3 && (
              <CheckoutStep3 order={order} updateOrder={updateOrder} onNext={nextStep} onBack={prevStep} />
            )}
            {componentStep === 4 && <CheckoutStep4 order={order} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}