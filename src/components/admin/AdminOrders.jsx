import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, CheckCircle, XCircle, Clock, Search, Eye } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Confirm payment and provision MT5 account via manualCryptoReview backend.
 * This is the SAME path used by AdminPaymentReview and all automatic webhooks.
 * Handles 409 Conflict gracefully when MT5 account already exists.
 */
async function confirmAndProvisionAccount(order) {
  try {
    const res = await base44.functions.invoke('manualCryptoReview', {
      action: 'approve_payment',
      order_id: order.order_id,
      notes: 'Confirmed via Admin Orders panel',
    });
    if (!res.data?.success) {
      throw new Error(res.data?.error || 'Approval failed');
    }
    return res.data;
  } catch (error) {
    // Handle 409 Conflict — MT5 account already exists
    if (error.message?.includes('409') || error.message?.includes('already')) {
      // Just update the order status without calling MT5 API again
      await base44.entities.Order.update(order.id, {
        payment_status: 'confirmed',
        manually_approved: true,
        approved_at: new Date().toISOString(),
      });
      return { success: true, message: 'Order confirmed. MT5 account already exists.' };
    }
    throw error;
  }
}

const STATUS_OPTS = ['pending', 'awaiting_confirmation', 'confirmed', 'failed'];
const STATUS_COLOR = { pending: '#f59e0b', awaiting_confirmation: '#a78bfa', confirmed: '#10b981', failed: '#ef4444' };
const STATUS_LABEL = { pending: 'Pending', awaiting_confirmation: 'Awaiting', confirmed: 'Confirmed', failed: 'Rejected' };
const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'awaiting_confirmation', label: 'Awaiting' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'failed', label: 'Rejected' },
];

export default function AdminOrders() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const qc = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 200),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Order.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-orders'] }); setSelected(null); },
  });

  const confirmMutation = useMutation({
    mutationFn: async (order) => {
      try {
        const result = await base44.functions.invoke('manualCryptoReview', {
          action: 'approve_payment',
          order_id: order.order_id,
          notes: 'Confirmed via Admin Orders panel'
        });
        if (!result?.success) {
          throw new Error(result?.error || 'Approval failed');
        }
        // Handle 409 gracefully — account already exists
        if (result?.provision_error?.includes('409') || result?.provision_error?.includes('already')) {
          return { success: true, message: 'Order confirmed. MT5 account already exists.' };
        }
        return result;
      } catch (error) {
        // Handle 409 Conflict — MT5 account already exists
        if (error.message?.includes('409') || error.message?.includes('already')) {
          await base44.entities.Order.update(order.id, {
            payment_status: 'confirmed',
            manually_approved: true,
            approved_at: new Date().toISOString(),
          });
          return { success: true, message: 'Order confirmed. MT5 account already exists.' };
        }
        throw error;
      }
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      qc.invalidateQueries({ queryKey: ['admin-accounts'] });
      qc.invalidateQueries({ queryKey: ['challenge-accounts'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
      setSelected(null);
      alert(result?.message || '✅ Account activated successfully!');
    },
    onError: (err) => {
      // Only show error for real failures, not 409
      if (err.message?.includes('409') || err.message?.includes('already')) {
        alert('✅ Order confirmed — MT5 account already active');
        qc.invalidateQueries({ queryKey: ['admin-orders'] });
        setSelected(null);
      } else {
        alert(`❌ Error: ${err?.message || 'Failed to activate account'}`);
      }
    },
  });

  const filtered = orders.filter(o => {
    const matchSearch = !search || (o.order_id?.toLowerCase().includes(search.toLowerCase()) || o.email?.toLowerCase().includes(search.toLowerCase()) || o.full_name?.toLowerCase().includes(search.toLowerCase()));
    const matchFilter = filter === 'all' || o.payment_status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-primary" /> Orders
          </h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">{orders.length} total orders</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 min-w-48"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <Search className="w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders, email..."
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50" />
        </div>
        <div className="flex gap-2">
          {FILTER_TABS.map(tab => (
            <button key={tab.id} onClick={() => setFilter(tab.id)}
              className="px-3 py-2 rounded-xl text-xs font-bold transition-all"
              style={{
                background: filter === tab.id ? 'rgba(255,92,0,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${filter === tab.id ? 'rgba(255,92,0,0.4)' : 'rgba(255,255,255,0.08)'}`,
                color: filter === tab.id ? '#FF5C00' : 'hsl(var(--muted-foreground))',
              }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="grid grid-cols-7 gap-2 px-5 py-3 text-[10px] font-mono text-muted-foreground uppercase border-b border-white/5"
          style={{ background: 'rgba(255,255,255,0.02)' }}>
          <span className="col-span-2">Order / Customer</span>
          <span>Type</span>
          <span>Size</span>
          <span>Price</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
        {isLoading ? (
          <div className="py-12 text-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">No orders found.</div>
        ) : filtered.map((o, i) => {
          const sc = STATUS_COLOR[o.payment_status] || '#888';
          return (
            <div key={o.id} className="grid grid-cols-7 gap-2 px-5 py-3.5 border-b border-white/[0.04] hover:bg-white/[0.02] items-center transition-colors">
              <div className="col-span-2 min-w-0">
                <div className="text-xs font-mono font-bold text-foreground truncate">{o.order_id || `ORD-${o.id?.slice(0,8)}`}</div>
                <div className="text-[11px] text-muted-foreground truncate">{o.full_name || o.email || '—'}</div>
              </div>
              <span className="text-xs text-muted-foreground capitalize">{o.challenge_type === 'two-step' ? '2-Step' : 'Instant'}</span>
              <span className="text-xs text-foreground">${(o.account_size||0).toLocaleString()}</span>
              <span className="text-xs font-bold text-foreground">${o.price}</span>
              <div>
                <select value={o.payment_status} onChange={e => updateMutation.mutate({ id: o.id, data: { payment_status: e.target.value } })}
                  className="text-[10px] font-mono px-2 py-1 rounded-lg outline-none capitalize"
                  style={{ background: `${sc}15`, color: sc, border: `1px solid ${sc}30` }}>
                  {STATUS_OPTS.map(s => <option key={s} value={s} className="bg-[#0e0e10] text-foreground capitalize">{s}</option>)}
                </select>
              </div>
              <button onClick={() => setSelected(o)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                <Eye className="w-3.5 h-3.5" /> View
              </button>
            </div>
          );
        })}
      </div>

      {/* Order detail modal */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl max-h-[85vh] overflow-y-auto"
              style={{ background: '#0e0e10', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center justify-between p-5 border-b border-white/5">
                <h2 className="text-base font-black">Order: {selected.order_id}</h2>
                <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground text-xl">×</button>
              </div>
              <div className="p-5 grid grid-cols-2 gap-4">
                {[
                  { l: 'Order ID', v: selected.order_id },
                  { l: 'Status', v: selected.payment_status },
                  { l: 'Full Name', v: selected.full_name },
                  { l: 'Username', v: selected.username },
                  { l: 'Email', v: selected.email },
                  { l: 'Phone', v: selected.phone },
                  { l: 'Country', v: selected.country },
                  { l: 'City', v: selected.city },
                  { l: 'Challenge Type', v: selected.challenge_type },
                  { l: 'Account Size', v: `$${(selected.account_size||0).toLocaleString()}` },
                  { l: 'Account Model', v: selected.account_type },
                  { l: 'Leverage', v: selected.leverage },
                  { l: 'Platform', v: selected.platform },
                  { l: 'Price', v: `$${selected.price}` },
                  { l: 'Payment Method', v: selected.payment_method },
                  { l: 'Wallet / Address', v: selected.payment_address },
                ].map(({ l, v }) => (
                  <div key={l}>
                    <div className="text-[10px] font-mono text-muted-foreground mb-0.5 uppercase">{l}</div>
                    <div className="text-xs font-semibold text-foreground break-all">{v || '—'}</div>
                  </div>
                ))}
              </div>
              <div className="px-5 pb-5 flex gap-3">
                {selected.payment_status === 'confirmed' || selected.mt_login ? (
                  <div className="flex-1 py-2.5 rounded-xl text-xs font-bold text-emerald-400 text-center"
                    style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
                    ✅ Already Active
                  </div>
                ) : (
                  <button onClick={() => confirmMutation.mutate(selected)}
                    disabled={confirmMutation.isPending || updateMutation.isPending}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white disabled:opacity-50 cursor-pointer"
                    style={{ background: 'linear-gradient(90deg,#10b981,#059669)' }}>
                    {confirmMutation.isPending ? '⏳ Activating...' : '✓ Confirm & Activate'}
                  </button>
                )}
                <button onClick={() => updateMutation.mutate({ id: selected.id, data: { payment_status: 'failed' } })}
                  disabled={confirmMutation.isPending || updateMutation.isPending}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white disabled:opacity-50 cursor-pointer"
                  style={{ background: 'rgba(239,68,68,0.8)' }}>
                  {updateMutation.isPending ? '⏳...' : '✗ Reject Order'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}