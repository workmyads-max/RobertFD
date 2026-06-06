/**
 * DDBreachModal — Full-screen unbreachable breach notification.
 * Shown when LiveDDGuard detects a DD breach in the active session.
 * Cannot be dismissed — trader must acknowledge then navigate away.
 */
import React from 'react';
import { motion } from 'framer-motion';
import { XCircle, AlertTriangle } from 'lucide-react';

export default function DDBreachModal({ breach, onAcknowledge }) {
  if (!breach) return null;

  const breachLabels = {
    daily: 'Daily Drawdown Limit Exceeded',
    overall: 'Maximum Drawdown Limit Exceeded',
    trailing: 'Trailing Drawdown Limit Exceeded',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(20px)' }}
    >
      <motion.div
        initial={{ scale: 0.8, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 120 }}
        className="max-w-lg w-full mx-4 rounded-2xl p-8 text-center"
        style={{
          background: 'linear-gradient(135deg, rgba(220,38,38,0.15), rgba(0,0,0,0.8))',
          border: '2px solid rgba(220,38,38,0.5)',
          boxShadow: '0 0 80px rgba(220,38,38,0.3)',
        }}
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="flex justify-center mb-6"
        >
          <XCircle className="w-20 h-20 text-red-500" />
        </motion.div>

        <div className="text-2xl font-black text-red-400 mb-2">
          🚫 Challenge Account Failed
        </div>

        <div className="text-lg font-bold text-white mb-4">
          {breachLabels[breach.breach_type] || 'Drawdown Limit Exceeded'}
        </div>

        <div className="rounded-xl p-4 mb-6 text-left space-y-2"
          style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)' }}>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Account ID</span>
            <span className="font-mono text-white">{breach.account_id}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Account Size</span>
            <span className="font-mono text-white">${(breach.account_size || 0).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Breach Type</span>
            <span className="font-mono text-red-400 uppercase">{breach.breach_type}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">DD at Breach</span>
            <span className="font-mono text-red-400 font-bold">{breach.breach_value?.toFixed(2)}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Current Equity</span>
            <span className="font-mono text-white">${(breach.equity || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-xl mb-6"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground text-left">
            Your account has been automatically closed and all positions have been locked.
            You may purchase a new challenge from the marketplace.
          </p>
        </div>

        <button
          onClick={onAcknowledge}
          className="w-full py-3 rounded-xl font-bold text-white transition-all hover:scale-105"
          style={{
            background: 'linear-gradient(90deg, #dc2626, #b91c1c)',
            boxShadow: '0 4px 20px rgba(220,38,38,0.3)',
          }}
        >
          I Understand — View Dashboard
        </button>
      </motion.div>
    </motion.div>
  );
}