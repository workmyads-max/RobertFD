import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function CouponInput({ order, onApply, appliedCoupon, onRemove }) {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState(null); // null | 'loading' | 'valid' | 'invalid'
  const [message, setMessage] = useState('');

  const handleApply = async () => {
    if (!code.trim()) return;
    setStatus('loading');
    const results = await base44.entities.Coupon.filter({ code: code.trim().toUpperCase(), is_active: true });
    const coupon = results[0];

    if (!coupon) { setStatus('invalid'); setMessage('Invalid or inactive coupon code.'); return; }

    // Check expiry
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      setStatus('invalid'); setMessage('This coupon has expired.'); return;
    }

    // Check usage limit
    if (coupon.max_uses > 0 && (coupon.uses_count || 0) >= coupon.max_uses) {
      setStatus('invalid'); setMessage('This coupon has reached its usage limit.'); return;
    }

    const discount = coupon.discount_type === 'percentage'
      ? Math.round((order.price * coupon.discount_value) / 100)
      : Math.min(coupon.discount_value, order.price - 1);

    setStatus('valid');
    setMessage(`✓ ${coupon.discount_type === 'percentage' ? `${coupon.discount_value}% OFF` : `$${coupon.discount_value} OFF`} applied`);
    onApply({ ...coupon, discountAmount: discount });
  };

  if (appliedCoupon) {
    return (
      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between rounded-xl px-4 py-3"
        style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)' }}>
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <div>
            <span className="text-xs font-black text-emerald-400 font-mono">{appliedCoupon.code}</span>
            <span className="text-xs text-muted-foreground ml-2">— save ${appliedCoupon.discountAmount}</span>
          </div>
        </div>
        <button onClick={onRemove} className="text-muted-foreground hover:text-red-400 transition-colors text-xs font-mono">Remove</button>
      </motion.div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={code}
            onChange={e => { setCode(e.target.value.toUpperCase()); setStatus(null); }}
            onKeyDown={e => e.key === 'Enter' && handleApply()}
            placeholder="COUPON CODE"
            className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm font-mono text-foreground outline-none uppercase tracking-widest"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${status === 'valid' ? 'rgba(16,185,129,0.5)' : status === 'invalid' ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
            }}
          />
        </div>
        <button onClick={handleApply} disabled={!code.trim() || status === 'loading'}
          className="px-4 py-2.5 rounded-xl text-xs font-bold text-white disabled:opacity-50 transition-all"
          style={{ background: 'rgba(255,92,0,0.8)', border: '1px solid rgba(255,92,0,0.4)' }}>
          {status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
        </button>
      </div>
      <AnimatePresence>
        {message && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className={`text-[11px] font-mono mt-1.5 flex items-center gap-1 ${status === 'valid' ? 'text-emerald-400' : 'text-red-400'}`}>
            {status === 'valid' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}