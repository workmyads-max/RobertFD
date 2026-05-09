import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, AlertCircle, CheckCircle, Info } from 'lucide-react';

const NOTIFICATION_ICONS = {
  announcement: Bell,
  maintenance: AlertCircle,
  rule_update: Info,
  promotion: Bell,
  payout: CheckCircle,
  market_alert: AlertCircle,
  system: Info,
};

const NOTIFICATION_COLORS = {
  announcement: { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.3)', text: '#3b82f6' },
  maintenance: { bg: 'rgba(255,152,0,0.15)', border: 'rgba(255,152,0,0.3)', text: '#ffa500' },
  rule_update: { bg: 'rgba(96,165,250,0.15)', border: 'rgba(96,165,250,0.3)', text: '#60a5fa' },
  promotion: { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)', text: '#10b981' },
  payout: { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)', text: '#10b981' },
  market_alert: { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)', text: '#ef4444' },
  system: { bg: 'rgba(107,114,128,0.15)', border: 'rgba(107,114,128,0.3)', text: '#6b7280' },
};

export default function DashboardPopupNotification({ notification, onClose }) {
  const [shouldShow, setShouldShow] = useState(true);

  useEffect(() => {
    if (notification?.expires_at) {
      const expiresTime = new Date(notification.expires_at).getTime();
      const now = new Date().getTime();
      if (expiresTime <= now) {
        setShouldShow(false);
        return;
      }
      const timer = setTimeout(() => setShouldShow(false), expiresTime - now);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  if (!shouldShow || !notification) return null;

  const Icon = NOTIFICATION_ICONS[notification.type] || Bell;
  const colors = NOTIFICATION_COLORS[notification.type] || NOTIFICATION_COLORS.announcement;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="fixed top-6 right-6 z-[60] max-w-sm"
          style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: '12px', padding: '16px' }}>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-0.5">
              <Icon className="w-5 h-5" style={{ color: colors.text }} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-foreground mb-1">{notification.title}</h3>
              <p className="text-xs text-muted-foreground mb-3">{notification.message}</p>
              {notification.cta_label && notification.cta_link && (
                <a href={notification.cta_link}
                  className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:scale-105"
                  style={{ background: colors.text + '20', color: colors.text }}>
                  {notification.cta_label} →
                </a>
              )}
            </div>
            <button
              onClick={() => setShouldShow(false)}
              className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}