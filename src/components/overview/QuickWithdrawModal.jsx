import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, X, Copy, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const DISPLAY_PROFIT_SPLIT = 0.80;
const DISPLAY_WITHDRAWAL_FEE = 25;

export default function QuickWithdrawModal({ account, onClose, onSuccess }) {
  const qc = useQueryClient();
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [copied, setCopied] = useState(false);

  const gross = parseFloat(amount) || 0;
  const traderShare = gross * DISPLAY_PROFIT_SPLIT;
  const affiliateReward = traderShare * 0.09;
  const finalAmount = Math.max(0, traderShare - affiliateReward - DISPLAY_WITHDRAWAL_FEE);

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke('requestTraderWithdrawal', {
        account_id: account.account_id,
        amount: gross,
        method: 'usdt_trc20',
        wallet_address: address,
      });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['withdrawals'] });
      onSuccess?.();
      onClose();
    },
  });

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setAddress(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  const canSubmit = gross > 0 && address.trim().length > 10 && !createMutation.isPending && finalAmount > 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(14px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
          className="w-full max-w-md rounded-2xl overflow-hidden"
          style={{ background: '#0c0d14', border: '1px solid rgba(255,255,255,0.1)' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div>
                <div className="text-sm font-bold text-foreground">Request Withdrawal</div>
                <div className="text-[10px] font-mono text-muted-foreground">80/20 Split · USDT TRC20 · Account {account?.account_id}</div>
              </div>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* 80/20 split info banner */}
            <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.18)' }}>
              <div className="flex-1">
                <div className="text-xs font-bold text-emerald-400 mb-0.5">80/20 Profit Split</div>
                <div className="text-[10px] font-mono text-muted-foreground">You keep 80% · $25 processing fee · ~9% affiliate deduction</div>
              </div>
              <div className="text-right">
                <div className="text-[9px] font-mono text-muted-foreground">Profit Split</div>
                <div className="text-sm font-black text-emerald-400">80%</div>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Gross Profit Amount (USD)
              </label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="e.g. 1000"
                className="w-full rounded-xl px-4 py-3 text-sm text-foreground outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>

            {/* USDT TRC20 Address */}
            <div>
              <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1.5 block">
                USDT TRC20 Wallet Address
              </label>
              <div className="relative">
                <input
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Paste your TRC20 wallet address"
                  className="w-full rounded-xl px-4 py-3 pr-24 text-sm text-foreground outline-none font-mono"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <button
                  onClick={handlePaste}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                  style={{ background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.08)', color: copied ? '#10b981' : '#aaa', border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'}` }}
                >
                  {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Pasted' : 'Paste'}
                </button>
              </div>
              <p className="text-[9px] font-mono text-muted-foreground mt-1.5">⚠️ Only TRC20 (Tron network) addresses accepted. Wrong network = permanent loss.</p>
            </div>

            {/* Live breakdown */}
            {gross > 0 && (
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="px-4 py-2 text-[9px] font-mono text-muted-foreground uppercase tracking-widest" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  Payout Breakdown
                </div>
                {[
                  { label: 'Gross Profit', val: `$${gross.toFixed(2)}`, color: 'text-foreground' },
                  { label: 'Company Share (20%)', val: `-$${(gross * 0.2).toFixed(2)}`, color: 'text-red-400' },
                  { label: 'Your Share (80%)', val: `$${traderShare.toFixed(2)}`, color: 'text-emerald-400' },
                  { label: 'Sponsor Reward (~9%)', val: `-$${affiliateReward.toFixed(2)}`, color: 'text-yellow-400' },
                  { label: 'Processing Fee', val: `-$${DISPLAY_WITHDRAWAL_FEE.toFixed(2)}`, color: 'text-muted-foreground' },
                ].map((row, i) => (
                  <div key={i} className="flex justify-between px-4 py-2 border-b border-white/[0.04]">
                    <span className="text-xs text-muted-foreground">{row.label}</span>
                    <span className={`text-xs font-mono ${row.color}`}>{row.val}</span>
                  </div>
                ))}
                <div className="flex justify-between px-4 py-3 border-t border-white/10" style={{ background: 'rgba(16,185,129,0.06)' }}>
                  <span className="text-xs font-bold text-foreground">You Receive (est.)</span>
                  <span className="text-sm font-black text-emerald-400">${finalAmount.toFixed(2)} USDT</span>
                </div>
              </div>
            )}

            {createMutation.isError && (
              <div className="text-xs text-red-400 text-center py-2">
                {createMutation.error?.message || 'Request failed. Please try again.'}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button onClick={onClose}
                className="flex-1 py-3 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                Cancel
              </button>
              <button
                onClick={() => createMutation.mutate()}
                disabled={!canSubmit}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-all"
                style={{ background: 'linear-gradient(90deg,#10b981,#059669)' }}>
                {createMutation.isPending ? 'Submitting…' : 'Submit Request'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}