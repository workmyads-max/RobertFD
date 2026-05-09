import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, CheckCircle, XCircle, Clock, Search } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const STATUS_COLOR = { pending: '#f59e0b', approved: '#60a5fa', processing: '#FF5C00', paid: '#10b981', rejected: '#ef4444' };
const STATUS_OPTS = ['pending','approved','processing','paid','rejected'];

export default function AdminWithdrawals() {
  const [search, setSearch] = useState('');
  const qc = useQueryClient();

  const { data: withdrawals = [], isLoading } = useQuery({
    queryKey: ['admin-withdrawals'],
    queryFn: () => base44.entities.WithdrawalRequest.list('-created_date', 200),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status, notes }) => base44.entities.WithdrawalRequest.update(id, { status, notes }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-withdrawals'] }),
  });

  const filtered = withdrawals.filter(w =>
    !search || w.account_id?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPending = withdrawals.filter(w => w.status === 'pending').reduce((s,w) => s + (w.amount||0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-primary" /> Withdrawal Requests
          </h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">${totalPending.toLocaleString()} pending approval</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-6">
        {STATUS_OPTS.map(s => {
          const count = withdrawals.filter(w => w.status === s).length;
          const sc = STATUS_COLOR[s];
          return (
            <div key={s} className="rounded-xl p-3 text-center" style={{ background: `${sc}0a`, border: `1px solid ${sc}20` }}>
              <div className="text-xl font-black" style={{ color: sc }}>{count}</div>
              <div className="text-[10px] font-mono text-muted-foreground capitalize">{s}</div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-5 w-full max-w-sm"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <Search className="w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by account ID..."
          className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground/50" />
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="grid grid-cols-6 gap-2 px-5 py-3 text-[10px] font-mono text-muted-foreground uppercase border-b border-white/5"
          style={{ background: 'rgba(255,255,255,0.02)' }}>
          <span className="col-span-2">Account</span>
          <span>Amount</span>
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
            <div key={w.id} className="grid grid-cols-6 gap-2 px-5 py-4 border-b border-white/[0.04] hover:bg-white/[0.02] items-center transition-colors">
              <div className="col-span-2 min-w-0">
                <div className="text-xs font-mono font-bold text-foreground">{w.account_id}</div>
                <div className="text-[11px] text-muted-foreground truncate">{w.wallet_address?.slice(0,20)}...</div>
              </div>
              <span className="text-sm font-bold text-emerald-400">${(w.amount||0).toLocaleString()}</span>
              <span className="text-xs text-muted-foreground capitalize">{w.method?.replace('_',' ')}</span>
              <select value={w.status} onChange={e => updateMutation.mutate({ id: w.id, status: e.target.value })}
                className="text-[10px] font-mono px-2 py-1 rounded-lg outline-none capitalize"
                style={{ background: `${sc}15`, color: sc, border: `1px solid ${sc}30` }}>
                {STATUS_OPTS.map(s => <option key={s} value={s} className="bg-[#0e0e10] text-foreground">{s}</option>)}
              </select>
              <div className="flex gap-2">
                <button onClick={() => updateMutation.mutate({ id: w.id, status: 'approved' })}
                  disabled={w.status === 'approved' || w.status === 'paid'}
                  className="p-1.5 rounded-lg hover:bg-emerald-500/10 disabled:opacity-30 transition-colors" title="Approve">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                </button>
                <button onClick={() => updateMutation.mutate({ id: w.id, status: 'rejected' })}
                  disabled={w.status === 'rejected'}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 disabled:opacity-30 transition-colors" title="Reject">
                  <XCircle className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}