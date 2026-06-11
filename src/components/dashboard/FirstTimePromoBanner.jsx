import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Gift, Check, Copy, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function FirstTimePromoBanner({ onStartChallenge }) {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if user has already used discount
  const { data: userDiscount } = useQuery({
    queryKey: ['first-time-discount', 'user'],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (!user) return null;
      const discounts = await base44.entities.FirstTimeDiscount.filter({ user_email: user.email });
      return discounts[0] || null;
    },
    refetchInterval: 10000,
  });

  // Get promotion settings
  const { data: settings } = useQuery({
    queryKey: ['promotion-settings'],
    queryFn: async () => {
      const settingsList = await base44.entities.PromotionSettings.filter({ setting_key: 'first_time_discount' });
      return settingsList[0] || null;
    },
    refetchInterval: 30000,
  });

  // Check if banner should be shown
  const shouldShow = settings?.is_first_time_discount_active && 
                     !userDiscount?.is_used && 
                     !isDismissed;

  // Countdown timer
  useEffect(() => {
    if (!settings?.discount_end_date) return;
    
    const calculateTimeLeft = () => {
      const endDate = new Date(settings.discount_end_date);
      const now = new Date();
      const difference = endDate - now;

      if (difference <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [settings?.discount_end_date]);

  const handleCopy = () => {
    navigator.clipboard.writeText(settings?.first_time_discount_code || 'NEW25');
    setCopied(true);
    toast.success('Coupon code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!shouldShow) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="relative rounded-3xl overflow-hidden mb-8"
      style={{
        background: 'linear-gradient(135deg, #1a1628 0%, #121018 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Dismiss button */}
      <button
        onClick={() => setIsDismissed(true)}
        className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/5 transition-colors z-20"
      >
        <X className="w-4 h-4 text-white/40" />
      </button>

      <div className="grid md:grid-cols-2 gap-0">
        {/* Left Content */}
        <div className="p-8 md:p-10">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-block px-4 py-1.5 rounded-full mb-4"
            style={{ background: '#FF5C00' }}
          >
            <span className="text-xs font-bold text-white uppercase tracking-wider">Limited Time Offer</span>
          </motion.div>

          {/* Headline */}
          <h2 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tight">
            Your First Challenge, 25% Off
          </h2>

          {/* Subtext */}
          <p className="text-sm text-white/50 mb-6 leading-relaxed">
            Applies to all Stellar plans up to $50K account sizes. New users only.
          </p>

          {/* Coupon Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCopy}
            className="flex items-center gap-3 px-5 py-3.5 rounded-xl mb-5"
            style={{
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
            }}
          >
            <span className="text-sm font-bold text-white">Coupon:</span>
            <span className="text-base font-black text-white tracking-wide">
              {settings?.first_time_discount_code || 'NEW25'}
            </span>
            {copied ? (
              <Check className="w-4 h-4 text-white" />
            ) : (
              <Copy className="w-4 h-4 text-white/70" />
            )}
          </motion.button>

          {/* Countdown */}
          {settings?.discount_end_date && (
            <div className="flex items-center gap-2 text-white/70">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">Offer ends in</span>
              <span className="text-sm font-mono font-bold text-white">
                {String(timeLeft.hours).padStart(2, '0')}H :{String(timeLeft.minutes).padStart(2, '0')}M :{String(timeLeft.seconds).padStart(2, '0')}S
              </span>
            </div>
          )}
        </div>

        {/* Right Card */}
        <div className="relative hidden md:block">
          <motion.div
            initial={{ opacity: 0, rotate: -5, x: 20 }}
            animate={{ opacity: 1, rotate: 3, x: 0 }}
            transition={{ delay: 0.2 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div
              className="relative w-full max-w-sm mx-8 rounded-2xl overflow-hidden p-6"
              style={{
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #A855F7 100%)',
                boxShadow: '0 20px 60px rgba(79,70,229,0.4)',
                transform: 'rotate(3deg)',
              }}
            >
              {/* New Users Only Ribbon */}
              <div
                className="absolute -top-3 -right-3 px-4 py-2 rounded-lg transform rotate-12 z-10"
                style={{ background: '#CCFF00' }}
              >
                <span className="text-xs font-black text-black uppercase tracking-wider">New Users Only</span>
              </div>

              {/* Gift Icon */}
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(255,255,255,0.2)' }}>
                <Gift className="w-6 h-6 text-white" />
              </div>

              {/* Headline */}
              <h3 className="text-lg font-bold text-white mb-4">Start Your Challenge at 25% Off</h3>

              {/* Separator */}
              <div className="h-px mb-4" style={{ background: 'rgba(255,255,255,0.2)' }} />

              {/* Checklist */}
              <div className="space-y-3">
                {[
                  'All Stellar challenges',
                  'Accounts $2K through $50K',
                  'Not applicable on resets',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: '#CCFF00' }}
                    >
                      <Check className="w-3 h-3 text-black" strokeWidth={3} />
                    </div>
                    <span className="text-sm font-medium text-white/90">{item}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onStartChallenge}
                className="w-full mt-6 py-3 rounded-xl text-sm font-bold text-white"
                style={{
                  background: '#FF5C00',
                  boxShadow: '0 4px 15px rgba(255,92,0,0.4)',
                }}
              >
                Claim Your Discount →
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}