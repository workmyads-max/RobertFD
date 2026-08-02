import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, CheckCircle, Clock, ArrowLeft, AlertTriangle, Link2, Loader2, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';

const WALLET_ADDRESS = 'TNmcxBokqW3ddNZDPSz6ij2spX92RmDxT5';
const QR_IMAGE_URL = 'https://media.base44.com/images/public/69ff44f98e27baf8957d0676/76ccfcda2_image.png';

export default function CheckoutStep3({ order, updateOrder, onNext, onBack, isLoggedIn }) {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [txidInput, setTxidInput] = useState('');
  const [txidSubmitting, setTxidSubmitting] = useState(false);
  const [txidError, setTxidError] = useState('');
  const [paymentDetected, setPaymentDetected] = useState(false);
  const [paymentDetectedTxid, setPaymentDetectedTxid] = useState('');

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const orderId = order.order_id || `XFT-${Date.now().toString(36).toUpperCase()}`;

      if (order.order_id) {
        const existing = await base44.entities.Order.filter({ order_id: order.order_id });
        if (existing && existing.length > 0) {
          return { order_id: order.order_id, exists: true };
        }
      }

      let affiliateCode = order.affiliate_code || '';
      if (!affiliateCode && order.email) {
        try {
          const profiles = await base44.entities.AffiliateProfile.filter({ user_email: order.email });
          if (profiles && profiles.length > 0 && profiles[0].referred_by_code) {
            affiliateCode = profiles[0].referred_by_code;
          }
        } catch (e) {
          console.warn('[checkout] affiliate profile lookup failed (non-blocking):', e?.message || e);
        }
      }

      await base44.entities.Order.create({
        order_id: orderId,
        challenge_type: order.challenge_type,
        account_type: order.account_type || 'standard',
        account_size: order.account_size,
        platform: order.platform || 'mt5',
        leverage: order.leverage || '1:100',
        price: order.final_price || order.price,
        payment_method: 'usdt_trc20',
        payment_gateway: 'manual',
        payment_address: WALLET_ADDRESS,
        payment_status: 'awaiting_confirmation',
        full_name: order.full_name || '',
        username: order.username || '',
        email: order.email || '',
        phone: order.phone || '',
        country: order.country || '',
        city: order.city || '',
        address: order.address || '',
        postal_code: order.postal_code || '',
        coupon_code: order.coupon_code || '',
        discount_amount: order.discount_amount || 0,
        affiliate_code: affiliateCode,
        promo_applied: order.promo_applied || false,
        promo_type: order.promo_type || '',
        promo_quantity: order.promo_quantity || 1,
        promo_free_account_size: order.promo_free_account_size || 0,
        promo_free_account_provisioned: false,
      });

      return { order_id: orderId, exists: false };
    },
    onSuccess: (data) => {
      if (!data.exists) {
        updateOrder({ order_id: data.order_id });
      }
    },
  });

  useEffect(() => {
    if (!order.order_id) {
      createOrderMutation.mutate();
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    const t = setInterval(() => setTimeLeft(p => Math.max(0, p - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  // Poll order status for auto-detection
  useEffect(() => {
    if (!order.order_id || paymentDetected) return;

    const pollInterval = setInterval(async () => {
      try {
        const orders = await base44.entities.Order.filter({ order_id: order.order_id });
        if (orders[0] && orders[0].payment_status === 'confirming') {
          setPaymentDetected(true);
          setPaymentDetectedTxid(orders[0].transaction_id || '');
          setTimeout(() => onNext(), 3000);
        }
      } catch (e) {}
    }, 10000);

    return () => clearInterval(pollInterval);
  }, [order.order_id, paymentDetected]);

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const secs = String(timeLeft % 60).padStart(2, '0');
  const isExpired = timeLeft === 0;

  const copy = async () => {
    await navigator.clipboard.writeText(WALLET_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmitTxid = async () => {
    if (!txidInput.trim()) return;
    setTxidSubmitting(true);
    setTxidError('');

    try {
      const res = await base44.functions.invoke('checkTronPayment', {
        action: 'submit_txid',
        order_id: order.order_id,
        txid: txidInput.trim(),
      });

      if (res.data?.success) {
        setPaymentDetected(true);
        setPaymentDetectedTxid(txidInput.trim());
        setTimeout(() => onNext(), 3000);
      } else {
        setTxidError(res.data?.error || 'Failed to submit TXID');
      }
    } catch (e) {
      setTxidError(e.response?.data?.error || e.message || 'Failed to submit TXID');
    } finally {
      setTxidSubmitting(false);
    }
  };

  const urgent = timeLeft < 300 && timeLeft > 0;

  // ── Payment detected view ───────────────────────────────────────────────────
  if (paymentDetected) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 14, stiffness: 160 }}
          className="w-32 h-32 mx-auto mb-8 rounded-full flex items-center justify-center"
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.2), rgba(16,185,129,0.05))', border: '2px solid rgba(16,185,129,0.4)' }}
        >
          <CheckCircle className="w-16 h-16 text-emerald-400" strokeWidth={1.5} />
        </motion.div>
        <div className="text-[11px] font-mono text-emerald-400 uppercase tracking-widest mb-3">Payment Received</div>
        <h1 className="text-3xl font-black text-foreground mb-3">Payment Detected! 🎉</h1>
        <p className="text-muted-foreground max-w-md mx-auto leading-relaxed mb-6">
          Your USDT payment of <strong className="text-foreground">${order.final_price || order.price}</strong> has been detected on the blockchain. Your challenge account is being prepared by our team.
        </p>
        {paymentDetectedTxid && (
          <div className="inline-block px-4 py-2 rounded-xl mb-6 max-w-md" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="text-[10px] font-mono text-muted-foreground uppercase block mb-1">Transaction Hash</span>
            <span className="text-xs font-mono text-foreground break-all">{paymentDetectedTxid}</span>
          </div>
        )}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Redirecting to confirmation...</span>
        </div>
      </div>
    );
  }

  // ── Payment screen ──────────────────────────────────────────────────────────
  return (
    <div className="grid lg:grid-cols-5 gap-8">
      <div className="lg:col-span-3 space-y-5">
        <div>
          <h2 className="text-xl font-black text-foreground mb-1">Complete Your Payment</h2>
          <p className="text-sm text-muted-foreground">Send the exact amount in USDT (TRC20) to the address below</p>
        </div>

        {/* Timer */}
        <motion.div animate={{ borderColor: urgent ? 'rgba(239,68,68,0.4)' : 'rgba(255,92,0,0.25)' }}
          className="flex items-center gap-3 px-5 py-3.5 rounded-xl"
          style={{ background: urgent ? 'rgba(239,68,68,0.07)' : 'rgba(255,92,0,0.07)', border: `1px solid ${urgent ? 'rgba(239,68,68,0.35)' : 'rgba(255,92,0,0.25)'}` }}>
          <Clock className={`w-4 h-4 flex-shrink-0 ${urgent ? 'text-red-400' : 'text-primary'}`} />
          {isExpired ? (
            <span className="text-sm text-red-400 font-semibold">Session expired</span>
          ) : (
            <>
              <span className="text-sm font-mono text-foreground">Session expires in: <strong className={urgent ? 'text-red-400' : 'text-primary'}>{mins}:{secs}</strong></span>
              <span className="ml-auto text-[11px] font-mono text-muted-foreground">Do not close this page</span>
            </>
          )}
        </motion.div>

        {/* Amount */}
        <div className="rounded-2xl p-5" style={{ background: 'rgba(38,161,123,0.05)', border: '1px solid rgba(38,161,123,0.2)' }}>
          <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Send Exactly</div>
          <div className="text-5xl font-black mb-1 text-[#26A17B]">${order.final_price || order.price}</div>
          {order.discount_amount > 0 && (
            <div className="text-xs font-mono text-emerald-400 mb-2">
              Discount applied: -${order.discount_amount}
            </div>
          )}
          <div className="text-sm font-mono text-muted-foreground">
            Payable in <strong className="text-[#26A17B]">USDT</strong> via <strong className="text-foreground">TRC20</strong> network
          </div>
        </div>

        {/* Wallet + QR */}
        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
          <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider mb-4">Wallet Address</div>
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <div className="w-40 h-40 rounded-2xl overflow-hidden bg-white p-3 flex-shrink-0">
              <img src={QR_IMAGE_URL} alt="USDT TRC20 QR Code" className="w-full h-full object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 p-3 rounded-xl mb-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <span className="text-xs font-mono text-foreground flex-1 break-all leading-relaxed">{WALLET_ADDRESS}</span>
                <button onClick={copy} className="flex-shrink-0 p-2 rounded-lg transition-all hover:bg-white/10">
                  {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                </button>
              </div>
              {copied && <div className="text-xs text-emerald-400 font-mono mb-2">✓ Address copied</div>}
              <div className="flex items-start gap-2 text-xs text-muted-foreground p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                <span>Send <strong className="text-[#26A17B]">USDT TRC20</strong> only. Sending any other token or using a different network will result in permanent loss.</span>
              </div>
            </div>
          </div>
        </div>

        {/* TXID Paste Field (Optional) */}
        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,92,0,0.04)', border: '1px solid rgba(255,92,0,0.15)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-foreground">Speed Up Verification (Optional)</span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Paste your transaction hash (TXID) after sending payment to speed up the verification process. This helps us match your payment instantly.
          </p>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Link2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <input
                type="text"
                value={txidInput}
                onChange={(e) => { setTxidInput(e.target.value); setTxidError(''); }}
                placeholder="Paste your transaction hash (TXID)..."
                className="flex-1 bg-transparent text-xs font-mono text-foreground outline-none placeholder:text-muted-foreground/50"
              />
            </div>
            <button
              onClick={handleSubmitTxid}
              disabled={!txidInput.trim() || txidSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-white disabled:opacity-50 transition-all whitespace-nowrap"
              style={{ background: 'linear-gradient(90deg, #FF5C00, #FF7A2F)' }}
            >
              {txidSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit TXID'}
            </button>
          </div>
          {txidError && (
            <p className="text-xs text-red-400 font-mono mt-2">{txidError}</p>
          )}
        </div>

        {/* Auto-detection notice */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.12)' }}>
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <p className="text-xs text-muted-foreground">
            <strong className="text-emerald-400">Auto-detection active.</strong> Your payment will be detected automatically within a few minutes. No need to close this page.
          </p>
        </div>

        {/* Back + Send Payment buttons */}
        <div className="flex gap-3">
          <button onClick={onBack} className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <motion.button
            onClick={onNext}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all"
            style={{ background: 'linear-gradient(90deg, #FF5C00, #FF7A2F)', boxShadow: '0 4px 24px rgba(255,92,0,0.35)' }}
          >
            <CheckCircle className="w-4 h-4" />
            I've Sent Payment — Continue
          </motion.button>
        </div>
      </div>

      {/* Order Summary */}
      <div className="lg:col-span-2">
        <div className="sticky top-6 rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
          <div className="px-5 py-3.5 border-b border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Order Details</span>
          </div>
          <div className="p-5 space-y-3">
            {[
              { label: 'Challenge', value: order.challenge_type === 'two-step' ? 'Two-Step' : 'Instant Funding' },
              { label: 'Account Size', value: `$${order.account_size?.toLocaleString()}`, highlight: true },
              { label: 'Payment', value: 'USDT TRC20' },
              { label: 'Email', value: order.email || '-' },
            ].map(({ label, value, highlight }) => (
              <div key={label} className="flex justify-between items-start">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className={`text-xs font-semibold text-right ml-4 ${highlight ? 'text-primary' : 'text-foreground'}`}>{value}</span>
              </div>
            ))}

            {/* B2G1 Promo summary */}
            {order.promo_applied && (
              <div className="rounded-xl p-3 my-2" style={{ background: 'rgba(255,92,0,0.06)', border: '1px solid rgba(255,92,0,0.2)' }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-[10px] font-mono text-primary uppercase tracking-widest">Buy 2 Get 1 Free Active</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">{order.promo_quantity}× ${order.account_size?.toLocaleString()} Accounts</span>
                    <span className="text-foreground font-mono">${order.price?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-emerald-400 font-bold">FREE ${order.promo_free_account_size?.toLocaleString()} Account</span>
                    <span className="text-emerald-400 font-mono">$0</span>
                  </div>
                </div>
              </div>
            )}

            <div className="border-t border-white/10 pt-3 space-y-2">
              {!order.promo_applied && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground font-mono">${order.price?.toLocaleString()}</span>
                </div>
              )}
              {order.discount_amount > 0 && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-emerald-400">Discount ({order.coupon_code})</span>
                  <span className="text-emerald-400 font-mono">-${order.discount_amount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-white/10">
                <span className="text-sm font-bold">Total Due</span>
                <span className="text-2xl font-black text-primary">${order.final_price?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}