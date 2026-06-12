import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, CheckCircle, Clock, ArrowLeft, Loader2, AlertTriangle, CreditCard, Wallet, Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import CouponInput from './CouponInput';

const FALLBACK_WALLETS = {
  usdt_trc20: { address: 'TConfigureInAdminWalletSettings', network: 'TRC20', symbol: 'USDT', color: '#26A17B' },
  bitcoin: { address: '1ConfigureInAdminWalletSettings', network: 'Bitcoin', symbol: 'BTC', color: '#F7931A' },
};

export default function CheckoutStep3({ order, updateOrder, onNext, onBack, isLoggedIn }) {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [checkoutSession, setCheckoutSession] = useState(null);
  const [confirmoInvoice, setConfirmoInvoice] = useState(null);
  
  // Manual crypto proof submission state
  const [createdOrderId, setCreatedOrderId] = useState(null);
  const [orderCreated, setOrderCreated] = useState(false);
  const [txid, setTxid] = useState('');
  const [amountSent, setAmountSent] = useState('');
  const [submittingProof, setSubmittingProof] = useState(false);
  const [orderCreationError, setOrderCreationError] = useState(null);

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
      try {
        const orderData = {
          order_id: `RF-${Date.now().toString(36).toUpperCase()}`,
          user_email: order.email,
          email: order.email,
          full_name: order.full_name,
          username: order.username,
          phone: order.phone || '',
          country: order.country || '',
          challenge_type: order.challenge_type,
          account_type: order.account_type || 'standard',
          account_size: order.account_size,
          leverage: order.leverage || '1:100',
          platform: order.platform || 'mt5',
          price: order.price,
          payment_method: order.payment_method,
          payment_gateway: 'manual',
          payment_status: 'pending',
          payment_address: wallet?.address || '',
          affiliate_code: order.affiliate_code || '',
          coupon_code: order.coupon_code || '',
          discount_amount: order.discount_amount || 0,
          rule_snapshot: order.rule_snapshot || null,
        };
        const created = await base44.entities.Order.create(orderData);
        
        // Sync to Supabase
        await base44.functions.invoke('createManualOrderInSupabase', {
          order_id: created.order_id,
          email: order.email,
          orderData: { ...orderData },
        });
        
        return created;
      } catch (error) {
        console.error('Order creation failed:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      setCreatedOrderId(data.order_id);
      setOrderCreated(true);
      updateOrder({ order_id: data.order_id });
    },
    onError: (error) => {
      setOrderCreationError(error.message);
      console.error('Order creation error:', error);
    },
  });

  const submitProofMutation = useMutation({
    mutationFn: async () => {
      if (!txid.trim()) {
        throw new Error('Please enter your transaction ID');
      }
      const res = await base44.functions.invoke('manualCryptoReview', {
        action: 'submit_proof',
        order_id: createdOrderId,
        txid: txid.trim(),
        amount: parseFloat(amountSent) || order.final_price || order.price,
        network: order.payment_method,
        screenshot_url: '',
      });
      if (!res.data?.success) {
        throw new Error(res.data?.error || 'Submission failed');
      }
      return res.data;
    },
    onSuccess: () => {
      setSubmittingProof(false);
      setTimeout(() => onNext(), 500);
    },
    onError: (error) => {
      alert('Error submitting proof: ' + error.message);
      setSubmittingProof(false);
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
    },
  });

  useEffect(() => {
    createOrderMutation.mutate();
  }, []);

  useEffect(() => {
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

  const handleProofSubmit = () => {
    setSubmittingProof(true);
    submitProofMutation.mutate();
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

  // Manual crypto payment with TXID submission
  return (
    <div className="grid lg:grid-cols-5 gap-8">
      <div className="lg:col-span-3 space-y-5">
        <div>
          <h2 className="text-xl font-black text-foreground mb-1">Complete Your Payment</h2>
          <p className="text-sm text-muted-foreground">Send the exact amount and submit your TXID</p>
        </div>

        {orderCreationError && (
          <div className="p-4 rounded-xl text-sm text-red-400" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
            Failed to create order: {orderCreationError}. Please refresh and try again.
          </div>
        )}

        {!orderCreated && !orderCreationError && (
          <div className="flex items-center justify-center gap-3 py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-sm font-mono text-muted-foreground">Creating your order...</span>
          </div>
        )}

        {orderCreated && (
          <>
            <motion.div animate={{ borderColor: urgent ? 'rgba(239,68,68,0.4)' : 'rgba(255,92,0,0.25)' }}
              className="flex items-center gap-3 px-5 py-3.5 rounded-xl"
              style={{ background: urgent ? 'rgba(239,68,68,0.07)' : 'rgba(255,92,0,0.07)', border: `1px solid ${urgent ? 'rgba(239,68,68,0.35)' : 'rgba(255,92,0,0.25)'}` }}>
              <Clock className={`w-4 h-4 flex-shrink-0 ${urgent ? 'text-red-400' : 'text-primary'}`} />
              {isExpired ? (
                <span className="text-sm text-red-400 font-semibold">Session expired</span>
              ) : (
                <>
                  <span className="text-sm font-mono text-foreground">Session expires in: <strong className={urgent ? 'text-red-400' : 'text-primary'}>{mins}:{secs}</strong></span>
                  <span className="ml-auto text-[11px] font-mono text-muted-foreground">Order ID: {createdOrderId}</span>
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

            {/* TXID Submission Form */}
            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
              <div className="flex items-center gap-2 mb-4">
                <Send className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Submit Payment Proof</h3>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1.5 block">Transaction ID (TXID) *</label>
                  <input
                    type="text"
                    value={txid}
                    onChange={(e) => setTxid(e.target.value)}
                    placeholder="e.g., a1b2c3d4e5f6..."
                    className="w-full px-3 py-2.5 rounded-xl text-sm font-mono bg-white/5 border border-white/10 text-foreground outline-none focus:border-primary/50 transition-colors"
                    style={{ minHeight: '44px' }}
                  />
                </div>
                
                <div>
                  <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1.5 block">Amount Sent</label>
                  <input
                    type="number"
                    value={amountSent}
                    onChange={(e) => setAmountSent(e.target.value)}
                    placeholder={order.final_price || order.price}
                    className="w-full px-3 py-2.5 rounded-xl text-sm font-mono bg-white/5 border border-white/10 text-foreground outline-none focus:border-primary/50 transition-colors"
                    style={{ minHeight: '44px' }}
                  />
                </div>

                <button
                  onClick={handleProofSubmit}
                  disabled={submittingProof || !txid.trim()}
                  className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(90deg, #FF5C00, #FF7A2F)', boxShadow: '0 4px 20px rgba(255,92,0,0.3)' }}>
                  {submittingProof ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Submitting Proof...</>
                  ) : (
                    <><Send className="w-4 h-4" /> Submit Payment Proof</>
                  )}
                </button>

                <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
                  After submission, our team will verify your payment within 1-24 hours. You will receive your account credentials via email.
                </p>
              </div>
            </div>
          </>
        )}

        <div className="flex gap-3">
          <button onClick={onBack} disabled={submittingProof} className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <ArrowLeft className="w-4 h-4" /> Back
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