import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, CheckCircle, Clock, ArrowLeft, Loader2, Shield } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';

const WALLETS = {
  usdt_trc20: { address: 'TRobertFundsUSDTWallet1234567890ABCD', network: 'TRC20', symbol: 'USDT' },
  bitcoin: { address: '1RobertFundsBTCWalletAddressXYZ1234', network: 'Bitcoin', symbol: 'BTC' },
};

const STATUS_STEPS = ['Awaiting Payment', 'Awaiting Confirmation', 'Payment Confirmed', 'Account Delivery'];

export default function CheckoutStep3({ order, updateOrder, onNext, onBack }) {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 min
  const [currentStatus, setCurrentStatus] = useState(0);
  const wallet = WALLETS[order.payment_method] || WALLETS.usdt_trc20;

  const createOrderMutation = useMutation({
    mutationFn: () => base44.entities.Order.create({
      ...order,
      order_id: `RF-${Date.now()}`,
      payment_address: wallet.address,
      payment_status: 'pending',
    }),
    onSuccess: (data) => updateOrder({ order_id: data.order_id }),
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

  const copy = async () => {
    await navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const simulateConfirm = () => {
    setCurrentStatus(1);
    setTimeout(() => { setCurrentStatus(2); setTimeout(() => { setCurrentStatus(3); setTimeout(onNext, 1500); }, 2000); }, 2000);
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div>
          <h2 className="text-2xl font-black text-foreground mb-1">Complete Payment</h2>
          <p className="text-muted-foreground text-sm">Send exact amount to the address below. Do not close this page.</p>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-3 px-5 py-3 rounded-xl"
          style={{ background: timeLeft < 300 ? 'rgba(239,68,68,0.08)' : 'rgba(255,92,0,0.08)', border: `1px solid ${timeLeft < 300 ? 'rgba(239,68,68,0.3)' : 'rgba(255,92,0,0.3)'}` }}>
          <Clock className={`w-4 h-4 ${timeLeft < 300 ? 'text-red-400' : 'text-primary'}`} />
          <span className="text-sm font-mono text-foreground">Session expires in: <strong>{mins}:{secs}</strong></span>
          <span className="ml-auto text-xs font-mono text-muted-foreground">Keep this page open</span>
        </div>

        {/* Payment Amount */}
        <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="text-xs font-mono text-muted-foreground mb-1 uppercase">Send Exactly</div>
          <div className="text-4xl font-black text-primary mb-1">${order.price} {wallet.symbol}</div>
          <div className="text-sm text-muted-foreground font-mono">via {wallet.network} Network</div>
        </div>

        {/* QR + Address */}
        <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex flex-col md:flex-row gap-6 items-center">
            {/* QR Placeholder */}
            <div className="w-40 h-40 rounded-2xl flex-shrink-0 flex items-center justify-center relative overflow-hidden"
              style={{ background: '#ffffff', padding: '12px' }}>
              <div className="w-full h-full rounded-lg flex items-center justify-center"
                style={{ background: 'repeating-conic-gradient(#000 0% 25%, #fff 0% 50%) 0 0 / 8px 8px' }}>
                <div className="w-10 h-10 bg-white rounded flex items-center justify-center">
                  <span className="text-black font-black text-xs">RF</span>
                </div>
              </div>
            </div>

            <div className="flex-1 w-full">
              <div className="text-xs font-mono text-muted-foreground mb-2 uppercase">Wallet Address ({wallet.network})</div>
              <div className="flex items-center gap-2 p-3 rounded-xl mb-4"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <span className="text-xs font-mono text-foreground flex-1 break-all">{wallet.address}</span>
                <button onClick={copy} className="flex-shrink-0 p-2 rounded-lg transition-all hover:bg-primary/20">
                  {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                </button>
              </div>
              <div className="flex items-start gap-2 text-xs text-muted-foreground p-3 rounded-xl"
                style={{ background: 'rgba(255,92,0,0.06)', border: '1px solid rgba(255,92,0,0.15)' }}>
                <Shield className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                <span>Send only <strong className="text-foreground">{wallet.symbol} ({wallet.network})</strong> to this address. Sending other assets will result in permanent loss.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Tracker */}
        <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="text-xs font-mono text-muted-foreground uppercase mb-4">Payment Status</div>
          <div className="space-y-3">
            {STATUS_STEPS.map((s, i) => {
              const done = currentStatus > i;
              const active = currentStatus === i;
              return (
                <div key={s} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                    done ? 'bg-emerald-500 text-white' : active ? 'bg-primary text-white' : 'bg-white/10 text-muted-foreground'
                  }`}>
                    {done ? '✓' : active ? <Loader2 className="w-3 h-3 animate-spin" /> : i + 1}
                  </div>
                  <span className={`text-sm ${active ? 'text-foreground font-semibold' : done ? 'text-emerald-400' : 'text-muted-foreground'}`}>{s}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Manual confirm (demo) */}
        <div className="flex gap-3">
          <button onClick={onBack} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button onClick={simulateConfirm} disabled={currentStatus > 0}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
            style={{ background: 'linear-gradient(90deg, #FF5C00, #FF7A2F)' }}>
            {currentStatus === 0 ? "I've Sent Payment" : "Processing..."}
          </button>
        </div>

        <p className="text-xs text-center text-muted-foreground leading-relaxed px-4">
          🔔 Your funded account credentials will be manually delivered to <strong className="text-foreground">{order.email}</strong> after successful payment confirmation. Estimated delivery: 1-24 hours.
        </p>
      </div>

      {/* Summary sidebar */}
      <div>
        <div className="sticky top-6 rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 className="text-sm font-bold mb-4">Order Details</h3>
          <div className="space-y-3">
            {[
              { label: 'Challenge', value: order.challenge_type === 'two-step' ? 'Two-Step' : 'Instant' },
              { label: 'Account Size', value: `$${order.account_size.toLocaleString()}` },
              { label: 'Model', value: order.account_type === 'swing' ? 'Swing' : 'Standard' },
              { label: 'Payment', value: order.payment_method === 'usdt_trc20' ? 'USDT TRC20' : 'Bitcoin' },
              { label: 'Name', value: order.full_name || '—' },
              { label: 'Email', value: order.email || '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="text-xs font-semibold text-foreground truncate ml-2 max-w-[120px]">{value}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 mt-4 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold">Total</span>
              <span className="text-xl font-black text-primary">${order.price}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}