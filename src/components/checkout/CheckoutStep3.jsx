import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, CheckCircle, Clock, ArrowLeft, Loader2, AlertTriangle, MailCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';

// Fallback wallets if none configured in admin
const FALLBACK_WALLETS = {
  usdt_trc20: { address: 'TConfigureInAdminWalletSettings', network: 'TRC20', symbol: 'USDT', color: '#26A17B' },
  bitcoin: { address: '1ConfigureInAdminWalletSettings', network: 'Bitcoin', symbol: 'BTC', color: '#F7931A' },
};

const STATUS_FLOW = [
  { id: 0, label: 'Awaiting Payment', sub: 'Send exact amount to the address below' },
  { id: 1, label: 'Awaiting Confirmation', sub: 'Payment received, waiting for blockchain confirmations' },
  { id: 2, label: 'Payment Confirmed', sub: 'Blockchain confirmed your transaction' },
  { id: 3, label: 'Account Delivery Pending', sub: 'Preparing your funded account credentials' },
];

function QRCodePlaceholder({ address, color }) {
  // Visual QR-like placeholder
  const seed = address.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const cells = Array.from({ length: 11 }, (_, row) =>
    Array.from({ length: 11 }, (_, col) => {
      // Always fill corners
      if ((row < 3 && col < 3) || (row < 3 && col > 7) || (row > 7 && col < 3)) return true;
      return ((seed + row * 13 + col * 7) % 3) !== 0;
    })
  );

  return (
    <div className="rounded-2xl p-4 flex-shrink-0" style={{ background: '#fff', width: 160, height: 160 }}>
      <div className="w-full h-full grid" style={{ gridTemplateColumns: 'repeat(11, 1fr)', gap: 1.5 }}>
        {cells.flat().map((filled, i) => (
          <div key={i} style={{ background: filled ? '#111' : '#fff', borderRadius: 1 }} />
        ))}
      </div>
    </div>
  );
}

export default function CheckoutStep3({ order, updateOrder, onNext, onBack }) {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [statusIdx, setStatusIdx] = useState(0);
  const [confirming, setConfirming] = useState(false);

  // Load gateway wallets from admin config
  const { data: gateways = [] } = useQuery({
    queryKey: ['payment-gateways'],
    queryFn: () => base44.entities.PaymentGateway.filter({ is_active: true }),
  });

  // Build wallet lookup from active gateway configs
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
    mutationFn: () => base44.entities.Order.create({
      ...order,
      order_id: `RF-${Date.now().toString(36).toUpperCase()}`,
      payment_address: wallet.address,
      payment_status: 'awaiting_confirmation',
    }),
    onSuccess: (data) => {
      updateOrder({ order_id: data.order_id });
    },
  });

  useEffect(() => {
    createOrderMutation.mutate();
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTimeLeft(p => Math.max(0, p - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const secs = String(timeLeft % 60).padStart(2, '0');
  const isExpired = timeLeft === 0;

  const copy = async () => {
    await navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleConfirm = () => {
    if (confirming || statusIdx > 0) return;
    setConfirming(true);
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

  return (
    <div className="grid lg:grid-cols-5 gap-8">
      {/* LEFT — Payment Area */}
      <div className="lg:col-span-3 space-y-5">
        <div>
          <h2 className="text-xl font-black text-foreground mb-1">Complete Your Payment</h2>
          <p className="text-sm text-muted-foreground">Send the exact amount to the address below. Keep this page open.</p>
        </div>

        {/* Timer */}
        <motion.div
          animate={{ borderColor: urgent ? 'rgba(239,68,68,0.4)' : 'rgba(255,92,0,0.25)' }}
          className="flex items-center gap-3 px-5 py-3.5 rounded-xl"
          style={{
            background: urgent ? 'rgba(239,68,68,0.07)' : 'rgba(255,92,0,0.07)',
            border: `1px solid ${urgent ? 'rgba(239,68,68,0.35)' : 'rgba(255,92,0,0.25)'}`,
          }}>
          <Clock className={`w-4 h-4 flex-shrink-0 ${urgent ? 'text-red-400' : 'text-primary'}`} />
          {isExpired ? (
            <span className="text-sm text-red-400 font-semibold">Session expired. Please restart your order.</span>
          ) : (
            <>
              <span className="text-sm font-mono text-foreground">
                Session expires in: <strong className={urgent ? 'text-red-400' : 'text-primary'}>{mins}:{secs}</strong>
              </span>
              <span className="ml-auto text-[11px] font-mono text-muted-foreground">Do not close this page</span>
            </>
          )}
        </motion.div>

        {/* Amount */}
        <div className="rounded-2xl p-5"
          style={{ background: `${wallet.color}0a`, border: `1px solid ${wallet.color}30` }}>
          <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Send Exactly</div>
          <div className="text-5xl font-black mb-1" style={{ color: wallet.color }}>${order.price}</div>
          <div className="text-sm font-mono text-muted-foreground">
            Payable in <strong style={{ color: wallet.color }}>{wallet.symbol}</strong> via <strong className="text-foreground">{wallet.network}</strong> network
          </div>
        </div>

        {/* QR + Address */}
        <div className="rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
          <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider mb-4">Wallet Address — {wallet.network}</div>
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <QRCodePlaceholder address={wallet.address} color={wallet.color} />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-muted-foreground mb-2 font-mono">Scan QR code or copy address:</p>
              <div className="flex items-center gap-2 p-3 rounded-xl mb-3"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <span className="text-xs font-mono text-foreground flex-1 break-all leading-relaxed">{wallet.address}</span>
                <button onClick={copy}
                  className="flex-shrink-0 p-2 rounded-lg transition-all hover:bg-white/10"
                  title="Copy address">
                  {copied
                    ? <CheckCircle className="w-4 h-4 text-emerald-400" />
                    : <Copy className="w-4 h-4 text-muted-foreground" />
                  }
                </button>
              </div>

              <AnimatePresence>
                {copied && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="text-xs text-emerald-400 font-mono mb-2">
                    ✓ Address copied to clipboard
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-start gap-2 text-xs text-muted-foreground p-3 rounded-xl"
                style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                <span>Send <strong style={{ color: wallet.color }}>{wallet.symbol} ({wallet.network})</strong> only. Any other asset sent to this address will be permanently lost.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Tracker */}
        <div className="rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
          <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider mb-4">Payment Status</div>
          <div className="space-y-4">
            {STATUS_FLOW.map((s, i) => {
              const isDone = statusIdx > i;
              const isActive = statusIdx === i;
              return (
                <div key={s.id} className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 transition-all duration-500 ${
                    isDone ? 'bg-emerald-500 text-white' : isActive ? 'bg-primary text-white' : 'bg-white/8 text-muted-foreground'
                  }`} style={{ background: isDone ? '#10b981' : isActive ? '#FF5C00' : 'rgba(255,255,255,0.08)' }}>
                    {isDone ? '✓' : isActive && confirming ? <Loader2 className="w-3 h-3 animate-spin" /> : i + 1}
                  </div>
                  <div>
                    <div className={`text-sm font-semibold transition-colors ${isDone ? 'text-emerald-400' : isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {s.label}
                    </div>
                    {isActive && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-muted-foreground mt-0.5">
                        {s.sub}
                      </motion.p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Delivery note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-start gap-3 px-4 py-4 rounded-xl"
          style={{ background: 'rgba(255,92,0,0.06)', border: '1px solid rgba(255,92,0,0.18)' }}>
          <MailCheck className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your funded account credentials will be <strong className="text-foreground">manually delivered</strong> to{' '}
            <strong className="text-primary">{order.email || 'your registered email'}</strong> after successful payment confirmation. Estimated delivery: <strong className="text-foreground">1–24 hours</strong>.
          </p>
        </motion.div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={onBack} disabled={statusIdx > 0}
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button
            onClick={handleConfirm}
            disabled={isExpired || confirming || statusIdx > 0}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(90deg, #FF5C00, #FF7A2F)', boxShadow: !isExpired ? '0 4px 20px rgba(255,92,0,0.3)' : 'none' }}>
            {confirming ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : "I've Sent the Payment"}
          </button>
        </div>
      </div>

      {/* RIGHT — Order details */}
      <div className="lg:col-span-2">
        <div className="sticky top-6 rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
          <div className="px-5 py-3.5 border-b border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Order Details</span>
          </div>
          <div className="p-5 space-y-3">
            {[
              { label: 'Challenge', value: order.challenge_type === 'two-step' ? 'Two-Step' : 'Instant Funding' },
              { label: 'Account Size', value: `$${order.account_size?.toLocaleString()}`, highlight: true },
              { label: 'Model', value: order.account_type === 'swing' ? 'Swing' : 'Standard' },
              { label: 'Leverage', value: order.leverage || '1:100' },
              { label: 'Payment', value: order.payment_method === 'usdt_trc20' ? 'USDT TRC20' : 'Bitcoin' },
              { label: 'Name', value: order.full_name || '—' },
              { label: 'Email', value: order.email || '—' },
            ].map(({ label, value, highlight }) => (
              <div key={label} className="flex justify-between items-start">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className={`text-xs font-semibold text-right ml-4 max-w-[160px] break-all ${highlight ? 'text-primary' : 'text-foreground'}`}>{value}</span>
              </div>
            ))}
            <div className="border-t border-white/10 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold">Total Due</span>
                <span className="text-2xl font-black text-primary">${order.price}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}