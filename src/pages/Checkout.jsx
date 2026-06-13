import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CheckoutStep1 from '../components/checkout/CheckoutStep1';
import CheckoutStep2 from '../components/checkout/CheckoutStep2';
import CheckoutStep3 from '../components/checkout/CheckoutStep3';
import CheckoutStep4 from '../components/checkout/CheckoutStep4';
import TermsModal from '../components/checkout/TermsModal';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// ONLY logged-in users can purchase - guest checkout is disabled
const STEPS = ['Payment Method', 'Payment', 'Confirmation'];

export default function Checkout() {
  // All hooks at top level - React rules require consistent order
  const [redirecting, setRedirecting] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [planLoaded, setPlanLoaded] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [step, setStep] = useState(1);
  const [order, setOrder] = useState({
    challenge_type: 'two-step',
    account_type: 'standard',
    account_size: 100000,
    platform: 'xtrading',
    leverage: '1:100',
    price: 0,
    discount_amount: 0,
    final_price: 0,
    payment_method: '',
    full_name: '', username: '', email: '', phone: '',
    country: '', city: '', address: '', postal_code: '',
    coupon_code: '',
    rule_snapshot: null,
  });

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        const user = await base44.auth.me();
        if (user && user.email) {
          // Logged in - redirect to dashboard checkout
          const params = new URLSearchParams(window.location.search);
          window.location.href = '/dashboard?tab=checkout&' + params.toString();
          return;
        }
      } catch (e) {
        // Not logged in - continue with guest checkout (will redirect to login)
      }
      setRedirecting(false);
    };
    checkAuthAndRedirect();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type') || 'two-step';
    const size = parseInt(params.get('size') || '100000');
    const acctType = params.get('account_type') || 'standard';
    const leverage = acctType === 'swing' ? '1:30' : '1:100';

    // Fetch price and full rule snapshot from ChallengePlan DB
    const loadPlan = async () => {
      let basePrice = 0;
      let ruleSnapshot = null;
      try {
        const res = await base44.functions.invoke('getChallengePlans', {});
        const plans = res?.data?.plans || [];
        const match = plans.find(p =>
          p.type === type &&
          (p.account_type || 'standard') === acctType &&
          p.size === size &&
          p.is_active !== false
        );
        if (match) {
          basePrice = match.price;
          ruleSnapshot = {
            daily_dd_limit: match.daily_dd,
            max_dd_limit: match.max_dd,
            trailing_dd: match.type === 'instant_light',
            phase1_target: match.phase1_target,
            phase2_target: match.phase2_target,
            leverage: acctType === 'swing' ? match.leverage_swing : match.leverage_standard,
            max_lots: match.max_lots,
            weekend_holding: match.weekend_holding,
            overnight_holding: match.overnight_holding,
            news_trading: match.news_trading,
            hedging: match.hedging,
            profit_split: match.profit_split,
          };
        }
      } catch (e) {
        console.error('Failed to load plan price from DB:', e.message);
      }
      return { basePrice, ruleSnapshot, leverage };
    };

    // Check authentication - ONLY logged-in users can purchase
    const checkAuth = async () => {
      try {
        const user = await base44.auth.me();
        if (!user || !user.email) {
          // Guest user - redirect to login
          window.location.href = '/login?redirect=/checkout?' + params.toString();
          return;
        }
        return user;
      } catch (e) {
        // Not authenticated - redirect to login
        window.location.href = '/login?redirect=/checkout?' + params.toString();
        return null;
      }
    };

    // Load plan + auth in parallel
    Promise.all([loadPlan(), checkAuth()]).then(([{ basePrice, ruleSnapshot, leverage }, user]) => {
      if (!user) return; // Will redirect
      
      setIsLoggedIn(true);
      setOrder({
        challenge_type: type,
        account_type: acctType,
        account_size: size,
        platform: 'xtrading',
        leverage,
        price: basePrice,
        discount_amount: 0,
        final_price: basePrice,
        payment_method: '',
        full_name: user.full_name || '',
        email: user.email || '',
        username: user.full_name?.toLowerCase().replace(/\s+/g, '_') || '',
        phone: user.phone || '',
        country: user.country || '',
        city: user.city || '',
        address: user.address || '',
        postal_code: user.postal_code || '',
        coupon_code: '',
        rule_snapshot: ruleSnapshot,
      });
      setAuthChecked(true);
      setPlanLoaded(true);
    });
  }, []);

  if (redirecting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const updateOrder = (data) => setOrder(o => ({ ...o, ...data }));

  // All users are logged-in (guests are redirected)
  const componentStep = step;
  const prevStep = () => setStep(s => Math.max(1, s - 1));
  const nextStep = () => setStep(s => s + 1);

  // Show terms gate first if not yet accepted
  if (authChecked && !termsAccepted) {
    return (
      <AnimatePresence>
        {showTerms || true ? (
          <TermsModal
            order={order}
            onAccept={() => { setTermsAccepted(true); setShowTerms(false); }}
            onDecline={() => { window.location.href = '/'; }}
          />
        ) : null}
      </AnimatePresence>
    );
  }

  if (!authChecked || !planLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground font-mono">Loading plan details...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-inter">
      {/* Header */}
      <div className="border-b border-white/5" style={{ background: 'rgba(8,8,10,0.98)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
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
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="hidden sm:inline text-[10px] font-mono px-2 py-1 rounded-full text-emerald-400"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
              ● Signed in · {order.email}
            </span>
            <a href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back
            </a>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="border-b border-white/5" style={{ background: 'rgba(8,8,10,0.7)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
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

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Step 1: Payment Method */}
            {componentStep === 1 && (
              <CheckoutStep2 order={order} updateOrder={updateOrder} onNext={nextStep} onBack={prevStep} isLoggedIn={true} />
            )}
            {/* Step 2: Payment */}
            {componentStep === 2 && (
              <CheckoutStep3 order={order} updateOrder={updateOrder} onNext={nextStep} onBack={prevStep} isLoggedIn={true} />
            )}
            {/* Step 3: Confirmation */}
            {componentStep === 3 && <CheckoutStep4 order={order} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}