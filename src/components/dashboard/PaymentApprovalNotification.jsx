import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function PaymentApprovalNotification({ user, onDismiss }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!user?.email) return;

    const checkAndShow = async () => {
      // Check if user has already seen this notification
      const hasSeen = localStorage.getItem(`payment_approval_seen_${user.email}`);
      if (hasSeen) return;

      // Check for pending payment approval notifications (popup or all display modes)
      const notifications = await base44.entities.Notification.filter({
        user_email: user.email,
        type: 'system',
        is_active: true,
      }, '-created_date', 10);

      const paymentApproval = notifications.find(n => 
        n.title?.includes('Payment Approved') || n.message?.includes('provisioned')
      );

      if (paymentApproval && !hasSeen) {
        setIsVisible(true);
      }
    };

    checkAndShow();
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
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed top-4 right-4 z-50 w-full max-w-md"
        >
          <div
            className="rounded-2xl overflow-hidden shadow-2xl"
            style={{
              background: '#1a2624',
              border: '1px solid #3a4e4a',
            }}
          >
            <div className="flex items-start gap-3 p-4">
              {/* Icon */}
              <div className="flex-shrink-0">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ border: '1px solid #3a4e4a' }}
                >
                  <CheckCircle className="w-5 h-5" style={{ color: '#4ade80' }} />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white mb-1">
                  Payment Approved — Challenge Account Ready
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Your payment for instant $10000 challenge has been verified. Your account is being provisioned.
                </p>
              </div>

              {/* Close button */}
              <button
                onClick={handleClose}
                className="flex-shrink-0 text-gray-500 hover:text-gray-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}