import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function PaymentApprovalNotification({ user, onDismiss }) {
  const [isVisible, setIsVisible] = useState(false);
  const hasChecked = useRef(false);
  const rateLimitRef = useRef(false);

  useEffect(() => {
    const email = user?.email;
    if (!email) return;
    // Already ran (guards against strict mode double-invoke and re-renders)
    if (hasChecked.current) return;
    // Already dismissed in a previous session — never make an API call
    if (localStorage.getItem(`payment_approval_seen_${email}`)) return;
    // Rate limit guard - only check once per session
    if (rateLimitRef.current) return;

    hasChecked.current = true;
    rateLimitRef.current = true;

    // Small delay so the dashboard doesn't hammer the API during the initial
    // burst of parallel queries on mount
    const timer = setTimeout(async () => {
      try {
        const notifications = await base44.entities.Notification.filter({
          user_email: email,
          type: 'system',
          is_active: true,
        }, '-created_date', 5);

        const paymentApproval = notifications.find(n =>
          n.title?.includes('Payment Approved') || n.message?.includes('provisioned')
        );

        if (paymentApproval) {
          setIsVisible(true);
        }
      } catch (error) {
        // Silently fail on rate limit or network errors
        if (error.message?.includes('Rate limit')) {
          console.warn('PaymentApprovalNotification: Rate limited, skipping check');
        }
      }
    }, 5000); // wait 5 s after mount before querying

    return () => clearTimeout(timer);
  }, [user?.email]);

  const handleClose = () => {
    if (user?.email) {
      localStorage.setItem(`payment_approval_seen_${user.email}`, 'true');
    }
    setIsVisible(false);
    onDismiss?.();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            onClick={handleClose}
          />
          
          {/* Centered modal popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ pointerEvents: 'none' }}
          >
            <div
              className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
              style={{ 
                background: '#1a2624',
                border: '1px solid #3a4e4a',
                pointerEvents: 'auto',
              }}
            >
              {/* Header with icon and close button */}
              <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: '#3a4e4a' }}>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid #3a4e4a' }}
                  >
                    <CheckCircle className="w-5 h-5" style={{ color: '#4ade80' }} />
                  </div>
                  <h3 className="text-base font-bold text-white">
                    Payment Approved
                  </h3>
                </div>
                <button
                  onClick={handleClose}
                  className="text-gray-500 hover:text-gray-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body content */}
              <div className="p-5">
                <h4 className="text-sm font-semibold text-white mb-2">
                  Challenge Account Ready
                </h4>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Your payment for instant $10000 challenge has been verified. Your account is being provisioned.
                </p>

                {/* Info box */}
                <div 
                  className="mt-4 p-3 rounded-xl"
                  style={{ background: 'rgba(58,78,74,0.3)', border: '1px solid rgba(58,78,74,0.5)' }}
                >
                  <p className="text-xs text-gray-300">
                    ⏱️ Account credentials will be available in 2-5 minutes. Check your email for login details.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}