import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Gift, Check, Copy } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function FirstTimePromoBanner({ onStartChallenge }) {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  // Get promotion settings
  const { data: settings } = useQuery({
    queryKey: ['promotion-settings'],
    queryFn: async () => {
      const settingsList = await base44.entities.PromotionSettings.filter({ setting_key: 'first_time_discount' });
      return settingsList[0] || null;
    },
    refetchInterval: 30000,
  });

  // Get challenge plans for max account size display
  const { data: plans = [] } = useQuery({
    queryKey: ['challenge-plans-all'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getChallengePlans', {});
      return res?.data?.plans || res?.plans || [];
    },
    staleTime: 60000,
  });

  // Always show banner - eligibility checked at checkout
  const shouldShow = true;

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

  const discountPercent = settings?.first_time_discount_percent || 25;
  const maxAccountSize = settings?.max_account_size_for_discount || 200000;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="relative rounded-2xl overflow-hidden mb-8"
      style={{
        background: '#141416',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="grid lg:grid-cols-2 gap-0">
        {/* Left Content */}
        <div className="p-8 lg:p-10 flex flex-col justify-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center justify-center px-4 py-1.5 rounded-full mb-5 w-fit"
            style={{ background: '#FF4500' }}
          >
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">LIMITED TIME OFFER</span>
          </motion.div>

          {/* Headline */}
          <h2 className="text-3xl lg:text-4xl font-black text-white mb-3 tracking-tight leading-tight">
            Your First Challenge, {discountPercent}% Off
          </h2>

          {/* Subtext */}
          <p className="text-sm text-[#B0B0B0] mb-8 leading-relaxed">
            Applies to all Stellar challenges from $10K to ${maxAccountSize.toLocaleString()}. New users only.
          </p>

          {/* Coupon Code Box */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">USE COUPON CODE</div>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleCopy}
              className="flex items-center gap-4 px-5 py-4 rounded-xl w-full sm:w-auto"
              style={{
                background: 'rgba(20,20,22,0.8)',
                border: '2px dashed #333333',
              }}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0" style={{ background: '#CCFF00' }}>
                <Gift className="w-5 h-5 text-black" />
              </div>
              <div className="flex-1 text-left">
                <div className="text-xs font-semibold text-white/50 mb-0.5">Coupon Code</div>
                <div className="text-xl font-black text-white tracking-wider">
                  {settings?.first_time_discount_code || 'NEW25'}
                </div>
              </div>
              <div className="flex-shrink-0">
                {copied ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: '#CCFF00' }}>
                    <Check className="w-4 h-4 text-black" strokeWidth={2.5} />
                    <span className="text-xs font-bold text-black">Copied!</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <Copy className="w-4 h-4 text-white/70" strokeWidth={2} />
                    <span className="text-xs font-bold text-white/70">Copy</span>
                  </div>
                )}
              </div>
            </motion.button>
          </motion.div>
        </div>

        {/* Right Card */}
        <div className="relative hidden lg:flex items-center justify-center p-8 lg:p-10">
          <motion.div
            initial={{ opacity: 0, rotate: 0, x: 20 }}
            animate={{ opacity: 1, rotate: 0, x: 0 }}
            transition={{ delay: 0.2 }}
            className="relative w-full max-w-md rounded-2xl overflow-hidden p-6"
            style={{
              background: '#CCFF00',
              boxShadow: '0 20px 60px rgba(204,255,0,0.3)',
            }}
          >
            {/* New Users Only Ribbon */}
            <div
              className="absolute -top-2 -right-2 z-10 shadow-xl overflow-visible"
              style={{
                background: '#FF4500',
                transform: 'translateX(8px) translateY(8px) rotate(12deg)',
              }}
            >
              <span className="block px-6 py-3 text-[10px] font-black text-white uppercase tracking-wider whitespace-nowrap">NEW USERS ONLY</span>
            </div>

            {/* Gift Icon */}
            <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(0,0,0,0.1)' }}>
              <Gift className="w-5 h-5 text-black" />
            </div>

            {/* Headline */}
            <h3 className="text-lg font-bold text-black mb-4 leading-snug">Start Your Challenge at {discountPercent}% Off</h3>

            {/* Separator */}
            <div className="h-px mb-4" style={{ background: 'rgba(0,0,0,0.15)' }} />

            {/* Checklist */}
            <div className="space-y-2.5 mb-5">
              <div className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(0,0,0,0.1)' }}
                >
                  <Check className="w-3 h-3 text-black" strokeWidth={3} />
                </div>
                <span className="text-sm font-medium text-black">All Stellar challenges</span>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(0,0,0,0.1)' }}
                >
                  <Check className="w-3 h-3 text-black" strokeWidth={3} />
                </div>
                <span className="text-sm font-medium text-black">Accounts $10K through ${maxAccountSize.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(0,0,0,0.1)' }}
                >
                  <Check className="w-3 h-3 text-black" strokeWidth={3} />
                </div>
                <span className="text-sm font-medium text-black">Not applicable on resets</span>
              </div>
            </div>

            {/* CTA */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onStartChallenge}
              className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all"
              style={{
                background: '#FF4500',
                boxShadow: '0 4px 15px rgba(255,69,0,0.4)',
              }}
            >
              Claim Your Discount →
            </motion.button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}