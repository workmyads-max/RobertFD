import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import CheckoutStep1 from '../checkout/CheckoutStep1';
import CheckoutStep2 from '../checkout/CheckoutStep2';
import CheckoutStep3 from '../checkout/CheckoutStep3';
import CheckoutStep4 from '../checkout/CheckoutStep4';
import PlatformSelectStep from '../checkout/PlatformSelectStep';
import TermsModal from '../checkout/TermsModal';

const STEPS = ['Platform', 'Personal Info', 'Payment Method', 'Payment', 'Confirmation'];

export default function DashboardCheckout({ initialOrder, onBack, onComplete }) {
  const [step, setStep] = useState(1);
  const [showTerms, setShowTerms] = useState(false);
  const [order, setOrder] = useState({
    challenge_type: 'two-step',
    account_type: 'standard',
    account_size: 100000,
    platform: 'match_trader',
    leverage: '1:100',
    price: 517,
    payment_method: '',
    full_name: '', username: '', email: '', phone: '',
    country: '', city: '', address: '', postal_code: '',
    ...initialOrder,
  });

  const updateOrder = (data) => setOrder(o => ({ ...o, ...data }));

  // Show terms before going to payment step
  const handleStep2Next = () => setShowTerms(true);

  return (
    <div>
      {/* Back button + progress */}
      <div className="flex items-center gap-4 mb-8">
        {step === 1 && (
          <button onClick={onBack}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back to Marketplace
          </button>
        )}
        {step > 1 && step < 4 && (
          <button onClick={() => setStep(s => s - 1)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        )}
        <div className="flex items-center gap-0 flex-1">
          {STEPS.map((s, i) => {
            const num = i + 1;
            const isActive = step === num;
            const isDone = step > num;
            return (
              <React.Fragment key={s}>
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                    isDone ? 'bg-emerald-500 text-white' : isActive ? 'bg-primary text-white' : 'bg-white/10 text-muted-foreground'
                  }`}>
                    {isDone ? '✓' : num}
                  </div>
                  <span className={`text-xs font-mono hidden sm:block ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>{s}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-px mx-2 transition-all ${isDone ? 'bg-emerald-500/50' : 'bg-white/10'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <TermsModal
        open={showTerms}
        onClose={() => setShowTerms(false)}
        onAccept={() => { setShowTerms(false); setStep(3); }}
      />

      <AnimatePresence mode="wait">
        <motion.div key={step}
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
          {step === 1 && <PlatformSelectStep order={order} updateOrder={updateOrder} onNext={() => setStep(2)} />}
          {step === 2 && <CheckoutStep1 order={order} updateOrder={updateOrder} onNext={() => setStep(3)} />}
          {step === 3 && <CheckoutStep2 order={order} updateOrder={updateOrder} onNext={handleStep2Next} onBack={() => setStep(2)} />}
          {step === 4 && <CheckoutStep3 order={order} updateOrder={updateOrder} onNext={() => setStep(5)} onBack={() => setStep(3)} />}
          {step === 5 && <CheckoutStep4 order={order} onGoToDashboard={onComplete || onBack} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}