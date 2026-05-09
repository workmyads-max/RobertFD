import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Mail, Clock } from 'lucide-react';

export default function CheckoutStep4({ order }) {
  const txId = order.order_id || `RF-${Date.now().toString(36).toUpperCase()}`;

  return (
    <div className="max-w-2xl mx-auto text-center py-8">
      {/* Success animation */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
        className="relative w-28 h-28 mx-auto mb-8"
      >
        <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: '#10b981' }} />
        <div className="absolute inset-0 rounded-full" style={{ background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.4)' }} />
        <div className="relative w-full h-full rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.2)' }}>
          <CheckCircle className="w-14 h-14 text-emerald-400" />
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <h1 className="text-3xl md:text-4xl font-black text-foreground mb-3">Payment Received!</h1>
        <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
          Your Robert Funds challenge has been successfully ordered. Your account is being prepared.
        </p>
      </motion.div>

      {/* Details card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="rounded-2xl p-6 mb-8 text-left"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Transaction ID', value: txId },
            { label: 'Account Size', value: `$${order.account_size?.toLocaleString()}` },
            { label: 'Challenge Type', value: order.challenge_type === 'two-step' ? 'Two-Step Challenge' : 'Instant Funding' },
            { label: 'Account Model', value: order.account_type === 'swing' ? 'Swing Account' : 'Standard Account' },
            { label: 'Delivery Email', value: order.email },
            { label: 'Est. Delivery', value: '1-24 hours' },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="text-[10px] font-mono text-muted-foreground uppercase mb-1">{label}</div>
              <div className="text-sm font-semibold text-foreground break-all">{value}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Notices */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="space-y-3 mb-8">
        {[
          { icon: Mail, text: `Account credentials will be sent to ${order.email}`, color: 'text-primary' },
          { icon: Clock, text: 'Delivery typically within 1-24 hours after payment confirmation', color: 'text-muted-foreground' },
        ].map(({ icon: Icon, text, color }) => (
          <div key={text} className="flex items-center gap-3 px-5 py-3 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <Icon className={`w-4 h-4 flex-shrink-0 ${color}`} />
            <span className="text-sm text-muted-foreground text-left">{text}</span>
          </div>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
        className="flex flex-col sm:flex-row gap-3 justify-center">
        <a href="/dashboard"
          className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
          style={{ background: 'linear-gradient(90deg, #FF5C00, #FF7A2F)', boxShadow: '0 4px 20px rgba(255,92,0,0.35)' }}>
          Go to Dashboard <ArrowRight className="w-4 h-4" />
        </a>
        <a href="/"
          className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors"
          style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
          Back to Home
        </a>
      </motion.div>
    </div>
  );
}