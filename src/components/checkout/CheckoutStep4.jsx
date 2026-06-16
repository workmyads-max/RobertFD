import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Mail, Clock, Shield, LayoutDashboard } from 'lucide-react';

export default function CheckoutStep4({ order, onGoToDashboard }) {
  const [visible, setVisible] = useState(false);
  const txId = order.order_id || `RF-${Date.now().toString(36).toUpperCase()}`;

  useEffect(() => {
    setTimeout(() => setVisible(true), 200);
  }, []);

  const details = [
    { label: 'Transaction ID', value: txId, mono: true },
    { label: 'Account Size', value: `$${order.account_size?.toLocaleString()}` },
    { label: 'Challenge Type', value: order.challenge_type === 'two-step' ? 'Two-Step Challenge' : 'Instant Funding' },
    { label: 'Account Model', value: order.account_type === 'swing' ? 'Swing Account' : 'Standard Account' },
    { label: 'Leverage', value: order.leverage || '1:100' },
    { label: 'Delivery Email', value: order.email || '—', mono: true },
    { label: 'Est. Delivery', value: '1–24 hours after confirmation' },
  ];

  return (
    <div className="max-w-2xl mx-auto text-center py-6">
      {/* Animated checkmark */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 14, stiffness: 160, delay: 0.1 }}
        className="relative w-32 h-32 mx-auto mb-8"
      >
        {/* Outer pulse rings */}
        {[1, 2].map(i => (
          <motion.div
            key={i}
            animate={{ scale: [1, 1.8, 1.8], opacity: [0.4, 0, 0] }}
            transition={{ duration: 2, delay: i * 0.4, repeat: Infinity }}
            className="absolute inset-0 rounded-full"
            style={{ border: '1px solid #10b981', borderRadius: '50%' }}
          />
        ))}
        {/* Icon */}
        <div className="relative w-32 h-32 rounded-full flex items-center justify-center"
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.2), rgba(16,185,129,0.05))', border: '2px solid rgba(16,185,129,0.4)' }}>
          <CheckCircle className="w-16 h-16 text-emerald-400" strokeWidth={1.5} />
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <div className="text-[11px] font-mono text-emerald-400 uppercase tracking-widest mb-3">Payment Received</div>
        <h1 className="text-3xl md:text-4xl font-black text-foreground mb-3 tracking-tight">
          Order Confirmed! 🎉
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto leading-relaxed mb-8">
          Your <strong className="text-foreground">${order.account_size?.toLocaleString()} {order.challenge_type === 'two-step' ? 'Two-Step Challenge' : 'Instant Funding'}</strong> account is being prepared by the XFunded team.
        </p>
      </motion.div>

      {/* Transaction details */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="rounded-2xl overflow-hidden mb-6 text-left"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <div className="px-5 py-3.5 border-b border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Transaction Details</span>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {details.map(({ label, value, mono }) => (
            <div key={label}>
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">{label}</div>
              <div className={`text-sm font-semibold text-foreground break-all ${mono ? 'font-mono text-xs' : ''}`}>{value}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Notices */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
        className="space-y-3 mb-8"
      >
        {[
          {
            icon: Mail,
            color: 'text-primary',
            bg: 'rgba(255,92,0,0.07)',
            border: 'rgba(255,92,0,0.18)',
            text: `Funded account credentials will be sent to ${order.email || 'your email address'}.`,
          },
          {
            icon: Clock,
            color: 'text-muted-foreground',
            bg: 'rgba(255,255,255,0.04)',
            border: 'rgba(255,255,255,0.08)',
            text: 'Delivery is typically completed within 1–24 hours after blockchain confirmation.',
          },
          {
            icon: Shield,
            color: 'text-emerald-400',
            bg: 'rgba(16,185,129,0.06)',
            border: 'rgba(16,185,129,0.18)',
            text: 'Your account is protected under XFunded Trader\'s Trader Agreement. Keep your credentials private.',
          },
        ].map(({ icon: Icon, color, bg, border, text }) => (
          <div key={text} className="flex items-center gap-3 px-5 py-3.5 rounded-xl text-left"
            style={{ background: bg, border: `1px solid ${border}` }}>
            <Icon className={`w-4 h-4 flex-shrink-0 ${color}`} />
            <span className="text-sm text-muted-foreground">{text}</span>
          </div>
        ))}
      </motion.div>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
        className="flex flex-col sm:flex-row gap-3 justify-center"
      >
        {onGoToDashboard ? (
          <button onClick={onGoToDashboard}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
            style={{ background: 'linear-gradient(90deg, #FF5C00, #FF7A2F)', boxShadow: '0 4px 24px rgba(255,92,0,0.35)' }}>
            <LayoutDashboard className="w-4 h-4" /> Go to My Accounts
          </button>
        ) : (
          <a href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
            style={{ background: 'linear-gradient(90deg, #FF5C00, #FF7A2F)', boxShadow: '0 4px 24px rgba(255,92,0,0.35)' }}>
            <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
          </a>
        )}
      </motion.div>
    </div>
  );
}