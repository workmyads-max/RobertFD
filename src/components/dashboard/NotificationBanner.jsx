import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Megaphone, Zap, AlertTriangle } from 'lucide-react';

const typeIcon = { announcement: Megaphone, promotion: Zap, market_alert: AlertTriangle };
const typeColor = { announcement: '#FF5C00', promotion: '#CCFF00', market_alert: '#ef4444', maintenance: '#f59e0b' };

export default function NotificationBanner({ notification: n }) {
  const [dismissed, setDismissed] = useState(false);
  if (!n || dismissed) return null;

  const color = typeColor[n.type] || '#FF5C00';
  const Icon = typeIcon[n.type] || Megaphone;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -60, opacity: 0 }}
        className="relative z-50 overflow-hidden"
        style={{ background: `linear-gradient(90deg, ${color}18, ${color}08, ${color}18)`, borderBottom: `1px solid ${color}30` }}
      >
        <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center gap-4">
          <div className="flex items-center gap-2 flex-shrink-0">
            <Icon className="w-4 h-4" style={{ color }} />
            <span className="text-xs font-black uppercase tracking-wider" style={{ color }}>{n.type?.replace('_', ' ')}</span>
          </div>

          {/* Scrolling text */}
          <div className="flex-1 overflow-hidden">
            <div className="ticker-scroll flex gap-16">
              {[1, 2].map(k => (
                <span key={k} className="text-sm text-foreground whitespace-nowrap font-medium">
                  {n.title} - {n.message}
                </span>
              ))}
            </div>
          </div>

          {n.cta_label && n.cta_link && (
            <a href={n.cta_link} target="_blank" rel="noreferrer" className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold text-background"
              style={{ background: color }}>
              {n.cta_label}
            </a>
          )}

          <button onClick={() => setDismissed(true)} className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}