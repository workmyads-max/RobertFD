import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function CouponInput({ order, updateOrder }) {
  const [code, setCode] = useState(order.coupon_code || '');
  const [status, setStatus] = useState(null); // null | 'loading' | 'valid' | 'invalid'
  const [message, setMessage] = useState('');
  const [applied, setApplied] = useState(!!order.coupon_code && order.discount_amount > 0);

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

    // Check applicable challenge types
    if (coupon.applicable_challenge_types?.length > 0 && order.challenge_type && !coupon.applicable_challenge_types.includes(order.challenge_type)) {
      setStatus('invalid'); setMessage(`This coupon is not valid for ${order.challenge_type} challenges.`); return;
    }

    // Check applicable account sizes
    if (coupon.applicable_account_sizes?.length > 0 && order.account_size && !coupon.applicable_account_sizes.includes(order.account_size)) {
      setStatus('invalid'); setMessage(`This coupon is not valid for $${order.account_size?.toLocaleString()} accounts.`); return;
    }

    // Check applicable platforms
    if (coupon.applicable_platforms?.length > 0 && order.platform && !coupon.applicable_platforms.includes(order.platform)) {
      setStatus('invalid'); setMessage(`This coupon is not valid for the selected platform.`); return;
    }

    const discount = coupon.discount_type === 'percentage'
      ? Math.round((order.price * coupon.discount_value) / 100)
      : Math.min(coupon.discount_value, order.price - 1);

    setStatus('valid');
    setMessage(`✓ ${coupon.discount_type === 'percentage' ? `${coupon.discount_value}% OFF` : `$${coupon.discount_value} OFF`} applied`);
    setApplied(true);
    
    // Update order with coupon data
    updateOrder({
      coupon_code: coupon.code,
      discount_amount: discount,
      final_price: order.price - discount,
    });
  };

  const handleRemove = () => {
    setCode('');
    setStatus(null);
    setMessage('');
    setApplied(false);
    updateOrder({
      coupon_code: '',
      discount_amount: 0,
      final_price: order.price,
    });
  };

  if (applied) {
    return (
      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between rounded-xl px-4 py-3"
        style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)' }}>
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <div>
            <span className="text-xs font-black text-emerald-400 font-mono">{code}</span>
            <span className="text-xs text-muted-foreground ml-2">— save ${order.discount_amount}</span>
          </div>
        </div>
        <button onClick={handleRemove} className="text-muted-foreground hover:text-red-400 transition-colors text-xs font-mono">Remove</button>
      </motion.div>
    );
  }

  return (
    <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex items-center gap-2 mb-3">
        <Tag className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">Have a Coupon Code?</h3>
      </div>
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