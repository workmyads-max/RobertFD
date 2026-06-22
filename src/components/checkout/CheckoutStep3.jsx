import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, CheckCircle, Clock, ArrowLeft, Loader2, AlertTriangle, MailCheck, CreditCard, Wallet, QrCode, Tag } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import CouponInput from './CouponInput';

const FALLBACK_WALLETS = {
  usdt_trc20: { address: 'TConfigureInAdminWalletSettings', network: 'TRC20', symbol: 'USDT', color: '#26A17B' },
  bitcoin: { address: '1ConfigureInAdminWalletSettings', network: 'Bitcoin', symbol: 'BTC', color: '#F7931A' },
};

const STATUS_FLOW = [
  { id: 0, label: 'Awaiting Payment', sub: 'Complete your payment securely' },
  { id: 1, label: 'Payment Processing', sub: 'Verifying your transaction' },
  { id: 2, label: 'Payment Confirmed', sub: 'Payment successfully confirmed' },
  { id: 3, label: 'Account Delivery Pending', sub: 'Preparing your funded account credentials' },
];

export default function CheckoutStep3({ order, updateOrder, onNext, onBack, isLoggedIn }) {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [statusIdx, setStatusIdx] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [checkoutSession, setCheckoutSession] = useState(null);
  const [confirmoInvoice, setConfirmoInvoice] = useState(null);

  const { data: gateways = [] } = useQuery({
    queryKey: ['payment-gateways'],
    queryFn: () => base44.entities.PaymentGateway.filter({ is_active: true }),
  });

  const getWallet = () => {
    const method = order.payment_method;
    for (const gw of gateways) {
      if (!gw.wallets?.length) continue;
      if (method === 'usdt_trc20') {
        const w = gw.wallets.find(w => w.network?.toUpperCase().includes('TRC') || w.currency?.toUpperCase() === 'USDT');
        if (w) return { address: w.address, network: w.network || 'TRC20', symbol: 'USDT', color: '#26A17B' };
      }
      if (method === 'bitcoin') {
        const w = gw.wallets.find(w => w.currency?.toUpperCase() === 'BTC' || w.network?.toUpperCase() === 'BITCOIN');
        if (w) return { address: w.address, network: 'Bitcoin', symbol: 'BTC', color: '#F7931A' };
      }
    }
    return FALLBACK_WALLETS[method] || FALLBACK_WALLETS.usdt_trc20;
  };

  const wallet = getWallet();

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const orderId = `XFT-${Date.now().toString(36).toUpperCase()}`;

      // Check if order already exists (prevent duplicates on re-render)
      if (order.order_id) {
        const existing = await base44.entities.Order.filter({ order_id: order.order_id });
        if (existing && existing.length > 0) {
          return { order_id: order.order_id, exists: true };
        }
      }

      // Affiliate attribution: look up the buyer's AffiliateProfile and use their
      // referred_by_code so the referrer gets credited when the payment confirms.
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

      // Create order directly in Base44 Order entity — no Supabase
      await base44.entities.Order.create({
        order_id: orderId,
        challenge_type: order.challenge_type,
        account_type: order.account_type || 'standard',
        account_size: order.account_size,
        platform: order.platform || 'mt5',
        leverage: order.leverage || '1:100',
        price: order.final_price || order.price,
        payment_method: order.payment_method,
        payment_gateway: order.payment_gateway || 'manual',
        payment_address: wallet?.address || '',
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
      });

      return { order_id: orderId, exists: false };
    },
    onSuccess: (data) => {
      if (!data.exists) {
        updateOrder({ order_id: data.order_id });
      }
    },
  });

  const createCheckoutPaymentMutation = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke('createCheckoutPayment', {
        amount: order.price,
        currency: 'USD',
        order_id: order.order_id,
        email: order.email,
      });
      return res.data;
    },
    onSuccess: (data) => {
      if (data.redirect_url) {
        window.location.href = data.redirect_url;
      }
    },
  });

  const createConfirmoInvoiceMutation = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke('createConfirmoInvoice', {
        amount: order.price,
        currency: 'USD',
        order_id: order.order_id,
        email: order.email,
      });
      return res.data;
    },
    onSuccess: (data) => {
      setConfirmoInvoice(data);
      setStatusIdx(1);
    },
  });

  useEffect(() => {
    // Only create order if not already created
    if (!order.order_id) {
      createOrderMutation.mutate();
    }
  }, []);

  useEffect(() => {
    // Auto-start payment for card/crypto gateways
    if (order.payment_gateway === 'checkout_com' && !checkoutSession) {
      createCheckoutPaymentMutation.mutate();
    }
    if (order.payment_gateway === 'confirmo' && !confirmoInvoice) {
      createConfirmoInvoiceMutation.mutate();
    }
  }, [order.payment_gateway]);

  useEffect(() => {
    const t = setInterval(() => setTimeLeft(p => Math.max(0, p - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const secs = String(timeLeft % 60).padStart(2, '0');
  const isExpired = timeLeft === 0;

  const copy = async () => {
    if (confirmoInvoice?.addresses) {
      const address = Object.values(confirmoInvoice.addresses)[0];
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } else if (wallet?.address) {
      await navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleManualConfirm = () => {
    if (processing || statusIdx > 0) return;
    setProcessing(true);
    const advance = (idx) => {
      setStatusIdx(idx);
      if (idx < 3) {
        setTimeout(() => advance(idx + 1), idx === 0 ? 1800 : 2000);
      } else {
        setTimeout(onNext, 1200);
      }
    };
    advance(1);
  };

  const urgent = timeLeft < 300 && timeLeft > 0;

  // Checkout.com / Card payment
  if (order.payment_gateway === 'checkout_com') {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(99,91,255,0.15)', border: '2px solid rgba(99,91,255,0.4)' }}
        >
          <CreditCard className="w-12 h-12 text-[#635BFF]" />
        </motion.div>
        
        <h2 className="text-2xl font-black text-foreground mb-3">Secure Card Payment</h2>
        <p className="text-muted-foreground mb-8">Redirecting to Checkout.com secure payment gateway...</p>

        {createCheckoutPaymentMutation.isPending && (
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-sm font-mono text-muted-foreground">Initializing payment session...</span>
          </div>
        )}

        {createCheckoutPaymentMutation.isError && (
          <div className="p-4 rounded-xl text-sm text-red-400" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
            Failed to initialize payment. Please try again or contact support.
          </div>
        )}
      </div>
    );
  }

  // Confirmo crypto payment
  if (order.payment_gateway === 'confirmo' && confirmoInvoice) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-foreground mb-2">Crypto Payment via Confirmo</h2>
          <p className="text-sm text-muted-foreground">Send cryptocurrency to complete your purchase</p>
        </div>

        <div className="rounded-2xl p-6 mb-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: '#F7931A15', border: '1px solid #F7931A30' }}>
              <Wallet className="w-8 h-8 text-[#F7931A]" />
            </div>
            <div>
              <div className="text-sm font-bold text-foreground mb-1">Invoice Created</div>
              <div className="text-xs font-mono text-muted-foreground">ID: {confirmoInvoice.invoice_id}</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="text-center">
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-3">Scan QR Code</div>
              <div className="w-48 h-48 mx-auto rounded-2xl overflow-hidden bg-white p-4">
                {confirmoInvoice.qr_code ? (
                  <img src={confirmoInvoice.qr_code} alt="QR Code" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    QR loading...
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-3">Payment Address</div>
              {Object.entries(confirmoInvoice.addresses || {}).map(([crypto, address]) => (
                <div key={crypto} className="mb-4">
                  <div className="text-xs font-bold text-foreground mb-2">{crypto}</div>
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-xs font-mono text-foreground flex-1 break-all">{address}</span>
                    <button onClick={copy} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                      {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                    </button>
                  </div>
                </div>
              ))}

              <div className="mt-4 p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>Send only the specified cryptocurrency to this address. Sending any other asset will result in permanent loss.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onBack} className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <a href={confirmoInvoice.invoice_url} target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-white transition-all"
            style={{ background: 'linear-gradient(90deg, #F7931A, #F59E0B)', boxShadow: '0 4px 20px rgba(247,147,26,0.3)' }}>
            <Wallet className="w-4 h-4" /> Open Payment Page
          </a>
        </div>
      </div>
    );
  }

  // Manual crypto payment (existing flow)
  return (
    <div className="grid lg:grid-cols-5 gap-8">
      <div className="lg:col-span-3 space-y-5">
        <div>
          <h2 className="text-xl font-black text-foreground mb-1">Complete Your Payment</h2>
          <p className="text-sm text-muted-foreground">Send the exact amount to the address below</p>
        </div>

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

        <div className="rounded-2xl p-5" style={{ background: `${wallet?.color}0a`, border: `1px solid ${wallet?.color}30` }}>
          <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Send Exactly</div>
          <div className="text-5xl font-black mb-1" style={{ color: wallet?.color }}>${order.final_price || order.price}</div>
          {order.discount_amount > 0 && (
            <div className="text-xs font-mono text-emerald-400 mb-2">
              Discount applied: -${order.discount_amount}
            </div>
          )}
          <div className="text-sm font-mono text-muted-foreground">
            Payable in <strong style={{ color: wallet?.color }}>{wallet?.symbol}</strong> via <strong className="text-foreground">{wallet?.network}</strong> network
          </div>
        </div>

        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
          <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider mb-4">Wallet Address</div>
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <div className="w-40 h-40 rounded-2xl overflow-hidden bg-white p-4 flex-shrink-0">
              <div className="w-full h-full grid grid-cols-11 gap-1.5">
                {Array.from({ length: 121 }).map((_, i) => (
                  <div key={i} style={{ background: (i % 3) !== 0 ? '#111' : '#fff', borderRadius: 1 }} />
                ))}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 p-3 rounded-xl mb-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <span className="text-xs font-mono text-foreground flex-1 break-all leading-relaxed">{wallet?.address}</span>
                <button onClick={copy} className="flex-shrink-0 p-2 rounded-lg transition-all hover:bg-white/10">
                  {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                </button>
              </div>
              {copied && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-emerald-400 font-mono mb-2">✓ Address copied</motion.div>}
              <div className="flex items-start gap-2 text-xs text-muted-foreground p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                <span>Send <strong style={{ color: wallet?.color }}>{wallet?.symbol}</strong> only</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onBack} disabled={statusIdx > 0} className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button onClick={handleManualConfirm} disabled={isExpired || processing || statusIdx > 0}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(90deg, #FF5C00, #FF7A2F)', boxShadow: !isExpired ? '0 4px 20px rgba(255,92,0,0.3)' : 'none' }}>
            {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : "I've Sent the Payment"}
          </button>
        </div>

        {/* Coupon Code Section - Only for logged-in users */}
        {isLoggedIn && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <CouponInput 
              order={order} 
              updateOrder={updateOrder} 
            />
          </div>
        )}
      </div>

      <div className="lg:col-span-2">
        <div className="sticky top-6 rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
          <div className="px-5 py-3.5 border-b border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Order Details</span>
          </div>
          <div className="p-5 space-y-3">
            {[
              { label: 'Challenge', value: order.challenge_type === 'two-step' ? 'Two-Step' : 'Instant Funding' },
              { label: 'Account Size', value: `$${order.account_size?.toLocaleString()}`, highlight: true },
              { label: 'Payment', value: order.payment_method === 'usdt_trc20' ? 'USDT TRC20' : 'Bitcoin' },
              { label: 'Email', value: order.email || '—' },
            ].map(({ label, value, highlight }) => (
              <div key={label} className="flex justify-between items-start">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className={`text-xs font-semibold text-right ml-4 ${highlight ? 'text-primary' : 'text-foreground'}`}>{value}</span>
              </div>
            ))}
            <div className="border-t border-white/10 pt-3 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground font-mono">${order.price?.toLocaleString()}</span>
              </div>
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