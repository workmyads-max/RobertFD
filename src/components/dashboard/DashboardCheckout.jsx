import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import CheckoutStep2 from '../checkout/CheckoutStep2';
import CheckoutStep3 from '../checkout/CheckoutStep3';
import CheckoutStep4 from '../checkout/CheckoutStep4';
import PlatformSelectStep from '../checkout/PlatformSelectStep';
import CouponInput from '../checkout/CouponInput';

// ONLY logged-in users can purchase - guest checkout is disabled
const STEPS = ['Platform', 'Payment Method', 'Payment', 'Confirmation'];

export default function DashboardCheckout({ initialOrder, onBack, onComplete }) {
  const [step, setStep] = useState(1);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState({
    challenge_type: 'two-step',
    account_type: 'standard',
    account_size: 100000,
    platform: 'match_trader',
    leverage: '1:100',
    price: 517,
    discount_amount: 0,
    final_price: 517,
    payment_method: '',
    full_name: '', username: '', email: '', phone: '',
    country: '', city: '', address: '', postal_code: '',
    ...initialOrder,
  });

  useEffect(() => {
    // Check authentication - redirect to login if not logged in
    const checkAuth = async () => {
      try {
        const user = await base44.auth.me();
        if (!user || !user.email) {
          // Not authenticated - redirect to login
          window.location.href = '/login?redirect=/dashboard?tab=buy-challenge';
          return;
        }
        // Auto-populate user data
        setOrder(o => ({
          ...o,
          full_name: user.full_name || o.full_name,
          email: user.email || o.email,
          username: user.full_name?.toLowerCase().replace(/\s+/g, '_') || o.username,
          phone: user.phone || o.phone,
          country: user.country || o.country,
          city: user.city || o.city,
          address: user.address || o.address,
          postal_code: user.postal_code || o.postal_code,
        }));
        setLoading(false);
      } catch (e) {
        // Not authenticated - redirect to login
        window.location.href = '/login?redirect=/dashboard?tab=buy-challenge';
      }
    };
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const updateOrder = (data) => setOrder(o => ({ ...o, ...data }));

  const handleApplyCoupon = (coupon) => {
    setAppliedCoupon(coupon);
    const discount = coupon.discountAmount || 0;
    setOrder(o => ({ ...o, discount_amount: discount, final_price: Math.max(1, o.price - discount), coupon_code: coupon.code }));
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setOrder(o => ({ ...o, discount_amount: 0, final_price: o.price, coupon_code: undefined }));
  };

  return (
    <div>
      {/* Coupon Input - Step 2 & 3 */}
      {(step === 2 || step === 3) && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-2">Discount Code</div>
          <CouponInput order={order} appliedCoupon={appliedCoupon} onApply={handleApplyCoupon} onRemove={handleRemoveCoupon} />
        </motion.div>
      )}

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

      <AnimatePresence mode="wait">
        <motion.div key={step}
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
          {step === 1 && <PlatformSelectStep order={order} updateOrder={updateOrder} onNext={() => setStep(2)} />}
          {step === 2 && <CheckoutStep2 order={{...order, final_price: order.final_price || order.price}} updateOrder={updateOrder} onNext={() => setStep(3)} onBack={() => setStep(2)} isLoggedIn={true} />}
          {step === 3 && <CheckoutStep3 order={{...order, final_price: order.final_price || order.price}} updateOrder={updateOrder} onNext={() => setStep(4)} onBack={() => setStep(3)} isLoggedIn={true} />}
          {step === 4 && <CheckoutStep4 order={order} onGoToDashboard={onComplete || onBack} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}