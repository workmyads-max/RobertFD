import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Clock } from 'lucide-react';

export default function AccountBreachAlert({ account }) {
  const [timeLeft, setTimeLeft] = useState(86400); // 24 hours in seconds
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setVisible(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${mins}m ${secs}s`;
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
          className="rounded-xl p-4 mb-4 border-l-4 flex items-start gap-4"
          style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderLeft: '4px solid #ef4444' }}>
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-red-400 mb-1">⚠ Account Breach Detected</div>
            <div className="text-xs text-muted-foreground mb-2">
              Account {account?.account_id} has exceeded drawdown limits. Trading suspended for 24 hours.
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-red-400/80">
              <Clock className="w-3 h-3" />
              Time remaining: <span className="font-bold">{formatTime(timeLeft)}</span>
            </div>
          </div>
          <button onClick={() => setVisible(false)}
            className="p-1 hover:bg-red-500/20 rounded transition-colors flex-shrink-0">
            <X className="w-4 h-4 text-red-400" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}