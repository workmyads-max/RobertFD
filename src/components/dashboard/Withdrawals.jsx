import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Plus, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const STATUS_CFG = {
  pending: { label: 'Pending', color: '#f59e0b', icon: Clock },
  approved: { label: 'Approved', color: '#60a5fa', icon: CheckCircle },
  processing: { label: 'Processing', color: '#FF5C00', icon: AlertCircle },
  paid: { label: 'Paid', color: '#10b981', icon: CheckCircle },
  rejected: { label: 'Rejected', color: '#ef4444', icon: XCircle },
};

const METHODS = [
  { id: 'usdt_trc20', label: 'USDT TRC20', icon: '₮' },
  { id: 'bitcoin', label: 'Bitcoin', icon: '₿' },
  { id: 'bank_wire', label: 'Bank Wire', icon: '🏦' },
];

export default function Withdrawals() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ account_id: 'RF-100423', amount: '', method: 'usdt_trc20', wallet_address: '' });
  const qc = useQueryClient();

  const { data: withdrawals = [] } = useQuery({
    queryKey: ['withdrawals'],
    queryFn: () => base44.entities.WithdrawalRequest.list('-created_date', 20),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.WithdrawalRequest.create({ ...data, status: 'pending' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['withdrawals'] }); setShowForm(false); setForm({ account_id: 'RF-100423', amount: '', method: 'usdt_trc20', wallet_address: '' }); },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-primary" /> Withdrawals
          </h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">Request and track your profit withdrawals</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
          style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)', boxShadow: '0 4px 20px rgba(255,92,0,0.3)' }}>
          <Plus className="w-4 h-4" /> Request Payout
        </button>
      </div>

      {/* Eligibility card */}
      <div className="rounded-2xl p-6 mb-6" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)' }}>
            <CheckCircle className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="text-sm font-bold text-foreground mb-0.5">Payout Eligible</div>
            <div className="text-xs text-muted-foreground">You have <span className="text-emerald-400 font-bold">$4,280 available</span> for withdrawal from funded account RF-082341</div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-2xl font-black text-emerald-400">$4,280</div>
            <div className="text-xs text-muted-foreground font-mono">Available</div>
          </div>
        </div>
      </div>

      {/* Withdrawal list */}
      <div className="space-y-3">
        {withdrawals.length === 0 && (
          <div className="text-center py-12 rounded-2xl" style={{ border: '1px dashed rgba(255,255,255,0.1)' }}>
            <DollarSign className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No withdrawal requests yet.</p>
          </div>
        )}
        {withdrawals.map((w, i) => {
          const cfg = STATUS_CFG[w.status] || STATUS_CFG.pending;
          const Icon = cfg.icon;
          return (
            <motion.div key={w.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-foreground">${w.amount?.toLocaleString()} {METHODS.find(m => m.id === w.method)?.label}</div>
                  <div className="text-xs text-muted-foreground font-mono">Account: {w.account_id} • {new Date(w.created_date).toLocaleDateString()}</div>
                </div>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                  style={{ background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
                  <Icon className="w-3 h-3" /> {cfg.label}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Form modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="w-full max-w-md rounded-2xl"
              style={{ background: '#0e0e10', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center justify-between p-5 border-b border-white/5">
                <h2 className="text-lg font-black">Request Payout</h2>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground text-xl">×</button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-mono text-muted-foreground mb-1.5 block uppercase">Amount (USD)</label>
                  <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="Enter amount"
                    className="w-full rounded-xl px-4 py-3 text-sm text-foreground outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>
                <div>
                  <label className="text-xs font-mono text-muted-foreground mb-2 block uppercase">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {METHODS.map(m => (
                      <button key={m.id} onClick={() => setForm(f => ({ ...f, method: m.id }))}
                        className="py-2.5 rounded-xl text-xs font-semibold transition-all"
                        style={{ background: form.method === m.id ? 'rgba(255,92,0,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${form.method === m.id ? 'rgba(255,92,0,0.5)' : 'rgba(255,255,255,0.08)'}`, color: form.method === m.id ? '#FF5C00' : '#666' }}>
                        {m.icon} {m.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-mono text-muted-foreground mb-1.5 block uppercase">Wallet Address</label>
                  <input value={form.wallet_address} onChange={e => setForm(f => ({ ...f, wallet_address: e.target.value }))} placeholder="Your withdrawal address"
                    className="w-full rounded-xl px-4 py-3 text-sm text-foreground outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl text-sm text-muted-foreground hover:text-foreground" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>Cancel</button>
                  <button onClick={() => createMutation.mutate(form)} disabled={!form.amount || !form.wallet_address || createMutation.isPending}
                    className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40"
                    style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)' }}>
                    {createMutation.isPending ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}