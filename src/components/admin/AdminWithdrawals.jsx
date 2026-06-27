import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, CheckCircle, XCircle, Clock, Search, Eye, Percent, Edit3 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { retryWithBackoff } from '@/lib/retryWithBackoff';

const STATUS_COLOR = { pending: '#f59e0b', approved: '#60a5fa', processing: '#FF5C00', paid: '#10b981', rejected: '#ef4444' };
const STATUS_OPTS = ['pending','approved','processing','paid','rejected'];

async function approveAndDistribute(withdrawal, qc, overrideSplit, overrideFee, adminNotes) {
  // All logic is now backend-secured via adminApproveWithdrawal function
  // Idempotency, duplicate payout_reward protection, and audit trail are backend-enforced
  const res = await retryWithBackoff(() => base44.functions.invoke('adminApproveWithdrawal', {
    withdrawal_id: withdrawal.id,
    override_split_pct: overrideSplit ? parseFloat(overrideSplit) : undefined,
    override_fee: overrideFee ? parseFloat(overrideFee) : undefined,
    admin_notes: adminNotes || '',
  }));
  if (res.data?.error) throw new Error(res.data.error);
  qc.invalidateQueries({ queryKey: ['admin-withdrawals'] });
  qc.invalidateQueries({ queryKey: ['withdrawals'] });
  return res.data;
}

export default function AdminWithdrawals() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [editFee, setEditFee] = useState('');
  const [editSplit, setEditSplit] = useState('');
  const [copied, setCopied] = useState('');
  const qc = useQueryClient();

  const copy = (val, key) => {
    navigator.clipboard.writeText(val).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(''), 1600);
  };

  const { data: withdrawals = [], isLoading } = useQuery({
    queryKey: ['admin-withdrawals'],
    queryFn: () => base44.entities.WithdrawalRequest.list('-created_date', 200),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.WithdrawalRequest.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-withdrawals'] });
      qc.invalidateQueries({ queryKey: ['withdrawals'] });
      setSelected(null);
    },
  });

  const approveMutation = useMutation({
    mutationFn: (w) => approveAndDistribute(w, qc, editSplit, editFee, document.getElementById('admin-notes')?.value),
    onSuccess: () => setSelected(null),
  });

  const rejectMutation = useMutation({
    mutationFn: async (w) => {
      const res = await retryWithBackoff(() => base44.functions.invoke('adminApproveWithdrawal', {
        withdrawal_id: w.id,
        action: 'reject',
        admin_notes: document.getElementById('admin-notes')?.value || '',
      }));
      if (res.data?.error) throw new Error(res.data.error);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-withdrawals'] });
      qc.invalidateQueries({ queryKey: ['withdrawals'] });
      setSelected(null);
    },
  });

  // Fetch account + user details for the detail modal (mt_login, trader name)
  const { data: detailData } = useQuery({
    queryKey: ['withdrawal-detail', selected?.id],
    queryFn: async () => {
      if (!selected) return null;
      const [accounts, users] = await Promise.all([
        base44.entities.ChallengeAccount.filter({ account_id: selected.account_id }),
        base44.entities.User.filter({ email: selected.user_email }),
      ]);
      return {
        mt_login: accounts[0]?.mt_login || '',
        trader_name: users[0]?.full_name || '',
      };
    },
    enabled: !!selected,
    staleTime: 120000,
  });

  // Track A — challenge profit payouts ONLY. Affiliate/commission payouts
  // (account_id === 'affiliate') are managed separately and never mixed in here.
  const challengeWithdrawals = withdrawals.filter(w => w.account_id && w.account_id !== 'affiliate');

  const filtered = challengeWithdrawals.filter(w =>
    !search || w.account_id?.toLowerCase().includes(search.toLowerCase()) || w.user_email?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPending = challengeWithdrawals.filter(w => w.status === 'pending').reduce((s, w) => s + (w.amount || 0), 0);
  const totalPaid = challengeWithdrawals.filter(w => w.status === 'paid').reduce((s, w) => s + (w.final_amount || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-primary" /> Challenge Reward Payouts
          </h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">${totalPending.toLocaleString()} pending • ${totalPaid.toLocaleString()} paid</p>
          <p className="text-[11px] text-muted-foreground/70 mt-1">Track A — trading reward payouts only. Affiliate/commission payouts are managed separately.</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-6">
        {STATUS_OPTS.map(s => {
          const count = challengeWithdrawals.filter(w => w.status === s).length;
          const total = challengeWithdrawals.filter(w => w.status === s).reduce((acc, w) => acc + (w.amount || 0), 0);
          const sc = STATUS_COLOR[s];
          return (
            <div key={s} className="rounded-xl p-3 text-center" style={{ background: `${sc}0a`, border: `1px solid ${sc}20` }}>
              <div className="text-xl font-black" style={{ color: sc }}>{count}</div>
              <div className="text-[10px] font-mono text-muted-foreground capitalize mb-0.5">{s}</div>
              <div className="text-[10px] font-mono" style={{ color: sc }}>${total.toLocaleString()}</div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-5 w-full max-w-sm"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <Search className="w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by account or email..."
          className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground/50" />
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="grid grid-cols-7 gap-2 px-5 py-3 text-[10px] font-mono text-muted-foreground uppercase border-b border-white/5"
          style={{ background: 'rgba(255,255,255,0.02)' }}>
          <span className="col-span-2">Account / Email</span>
          <span>Amount</span>
          <span>Final</span>
          <span>Method</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
        {isLoading ? (
          <div className="py-12 text-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">No withdrawal requests.</div>
        ) : filtered.map((w) => {
          const sc = STATUS_COLOR[w.status] || '#888';
          return (
            <div key={w.id} className="grid grid-cols-7 gap-2 px-5 py-4 border-b border-white/[0.04] hover:bg-white/[0.02] items-center transition-colors">
              <div className="col-span-2 min-w-0">
                <div className="text-xs font-mono font-bold text-foreground">{w.account_id}</div>
                <div className="text-[11px] text-muted-foreground truncate">{w.user_email}</div>
                {w.wallet_address && <div className="text-[10px] font-mono text-primary/70 truncate" title={w.wallet_address}>💳 {w.wallet_address}</div>}
              </div>
              <span className="text-sm font-bold text-foreground">${(w.amount || 0).toLocaleString()}</span>
              <span className="text-sm font-bold text-emerald-400">${(w.final_amount || 0).toFixed(2)}</span>
              <span className="text-xs text-muted-foreground capitalize">{w.method?.replace('_', ' ')}</span>
              <select value={w.status} onChange={e => {
                  const newStatus = e.target.value;
                  // "approved" and "rejected" MUST go through the backend function
                  // (adminApproveWithdrawal) — it handles MT5 account renewal, balance
                  // deduction, notifications, certificates, and audit trail. A direct
                  // entity update would skip all of that and leave the payout half-processed.
                  if (newStatus === 'approved') {
                    approveMutation.mutate(w);
                  } else if (newStatus === 'rejected') {
                    rejectMutation.mutate(w);
                  } else {
                    updateMutation.mutate({ id: w.id, data: { status: newStatus } });
                  }
                }}
                className="text-[10px] font-mono px-2 py-1 rounded-lg outline-none capitalize"
                style={{ background: `${sc}15`, color: sc, border: `1px solid ${sc}30` }}>
                {STATUS_OPTS.map(s => <option key={s} value={s} className="bg-[#0e0e10] text-foreground">{s}</option>)}
              </select>
              <div className="flex gap-1.5">
                <button onClick={() => { setSelected(w); setEditFee(String(w.withdrawal_fee || 25)); setEditSplit(String(w.profit_split_pct || 80)); }}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" title="View / Edit">
                  <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <button onClick={() => approveMutation.mutate(w)}
                  disabled={w.status === 'approved' || w.status === 'paid' || approveMutation.isPending}
                  className="p-1.5 rounded-lg hover:bg-emerald-500/10 disabled:opacity-30 transition-colors" title="Approve & Distribute">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                </button>
                <button onClick={() => rejectMutation.mutate(w)}
                  disabled={w.status === 'rejected' || w.status === 'paid' || rejectMutation.isPending}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 disabled:opacity-30 transition-colors" title="Reject">
                  <XCircle className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail & edit modal */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl max-h-[85vh] overflow-y-auto"
              style={{ background: '#0e0e10', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center justify-between p-5 border-b border-white/5">
                <h2 className="text-base font-black">Withdrawal Detail</h2>
                <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground text-xl">×</button>
              </div>
              <div className="p-5 space-y-4">
                {/* Payout destination — clearly visible for sending the payout */}
                <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <div className="text-xs font-bold text-emerald-400 flex items-center gap-2"><DollarSign className="w-3.5 h-3.5" /> Send Payout To</div>
                  {[
                    { l: 'Trader Name', v: detailData?.trader_name || selected.user_email },
                    { l: 'MT5 Current Account', v: detailData?.mt_login || '—' },
                    { l: `Wallet (${selected.method?.replace('_', ' ') || 'n/a'})`, v: selected.wallet_address },
                  ].map(({ l, v }) => (
                    <div key={l} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[10px] font-mono text-muted-foreground uppercase">{l}</div>
                        <div className="text-xs font-semibold text-foreground break-all">{v || '—'}</div>
                      </div>
                      {v && v !== '—' && (
                        <button onClick={() => copy(v, l)}
                          className="shrink-0 text-[10px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground transition-colors">
                          {copied === l ? '✓ Copied' : 'Copy'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* New Account per Payout notice */}
                <div className="rounded-xl px-4 py-3 text-[11px] leading-relaxed"
                  style={{ background: 'rgba(255,92,0,0.06)', border: '1px solid rgba(255,92,0,0.2)', color: 'rgba(255,255,255,0.7)' }}>
                  ⚡ Approving this payout retires the trader's current simulation funded account and automatically issues a <span className="text-primary font-bold">fresh simulation funded account of the same size</span> (New Account per Payout).
                </div>

                {/* Info */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { l: 'Trader Name', v: detailData?.trader_name || '—' },
                    { l: 'User Email', v: selected.user_email },
                    { l: 'Account ID', v: selected.account_id },
                    { l: 'MT5 Login', v: detailData?.mt_login || '—' },
                    { l: 'Amount', v: `$${selected.amount}` },
                    { l: 'Method', v: selected.method?.replace('_', ' ') },
                    { l: 'Wallet Address', v: selected.wallet_address },
                    { l: 'Status', v: selected.status },
                  ].map(({ l, v }) => (
                    <div key={l}>
                      <div className="text-[10px] font-mono text-muted-foreground mb-0.5 uppercase">{l}</div>
                      <div className="text-xs font-semibold text-foreground break-all">{v || '—'}</div>
                    </div>
                  ))}
                </div>

                {/* Editable fields */}
                <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="text-xs font-bold text-foreground flex items-center gap-2"><Edit3 className="w-3.5 h-3.5 text-primary" /> Override Settings</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-mono text-muted-foreground block mb-1">Trader Split %</label>
                      <input type="number" value={editSplit} onChange={e => setEditSplit(e.target.value)} min="0" max="100"
                        className="w-full rounded-lg px-3 py-2 text-xs outline-none text-foreground"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-muted-foreground block mb-1">Withdrawal Fee $</label>
                      <input type="number" value={editFee} onChange={e => setEditFee(e.target.value)}
                        className="w-full rounded-lg px-3 py-2 text-xs outline-none text-foreground"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-muted-foreground block mb-1">Admin Notes</label>
                    <input defaultValue={selected.admin_notes || ''} id="admin-notes"
                      className="w-full rounded-lg px-3 py-2 text-xs outline-none text-foreground"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                  </div>
                </div>

                {/* Breakdown */}
                {(() => {
                  const gross = selected.amount || 0;
                  const split = parseFloat(editSplit) || 80;
                  const fee = parseFloat(editFee) || 25;
                  const traderShare = gross * (split / 100);
                  const companyShare = gross - traderShare;
                  const finalAmount = Math.max(0, traderShare - fee);
                  return (
                    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div className="px-4 py-2 text-[10px] font-mono text-muted-foreground uppercase bg-white/[0.02]">Calculated Breakdown</div>
                      {[
                        { l: 'Gross', v: `$${gross.toLocaleString()}`, c: 'text-foreground' },
                        { l: `Company (${100 - split}%)`, v: `-$${companyShare.toFixed(2)}`, c: 'text-red-400' },
                        { l: `Trader (${split}%)`, v: `$${traderShare.toFixed(2)}`, c: 'text-emerald-400' },
                        { l: 'Processing Fee', v: `-$${fee.toFixed(2)}`, c: 'text-yellow-400' },
                        { l: 'Final Payout', v: `$${finalAmount.toFixed(2)}`, c: 'text-primary', bold: true },
                      ].map((r, i) => (
                        <div key={i} className="flex justify-between px-4 py-2 border-b border-white/[0.04] last:border-0">
                          <span className="text-xs text-muted-foreground">{r.l}</span>
                          <span className={`text-xs font-mono ${r.bold ? 'font-black' : ''} ${r.c}`}>{r.v}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                <div className="grid grid-cols-3 gap-3 pt-2">
                  <button
                    onClick={() => rejectMutation.mutate(selected)}
                    disabled={selected.status === 'rejected' || selected.status === 'paid' || rejectMutation.isPending}
                    className="py-2.5 rounded-xl text-xs font-bold text-white disabled:opacity-40"
                    style={{ background: 'linear-gradient(90deg,#ef4444,#dc2626)' }}>
                    {rejectMutation.isPending ? '⏳...' : '✕ Reject'}
                  </button>
                  <button
                    onClick={() => updateMutation.mutate({ id: selected.id, data: {
                      profit_split_pct: parseFloat(editSplit) || 80,
                      withdrawal_fee: parseFloat(editFee) || 25,
                      admin_notes: document.getElementById('admin-notes')?.value || '',
                    }})}
                    className="py-2.5 rounded-xl text-xs font-bold text-white"
                    style={{ background: 'rgba(96,165,250,0.8)' }}>
                    💾 Save
                  </button>
                  <button onClick={() => approveMutation.mutate(selected)}
                    disabled={selected.status === 'paid' || approveMutation.isPending}
                    className="py-2.5 rounded-xl text-xs font-bold text-white disabled:opacity-40"
                    style={{ background: 'linear-gradient(90deg,#10b981,#059669)' }}>
                    {approveMutation.isPending ? '⏳ Processing...' : '✓ Approve & Distribute'}
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