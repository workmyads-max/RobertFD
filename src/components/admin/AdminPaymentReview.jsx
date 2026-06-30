import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, CheckCircle, XCircle, AlertTriangle, MessageSquare, Eye, RefreshCw, Loader2, ExternalLink, Copy, Flag, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const STATUS_COLORS = {
  awaiting_confirmation: { bg: 'rgba(234,179,8,0.12)', border: 'rgba(234,179,8,0.3)', text: '#fbbf24', label: 'Awaiting Review' },
  pending: { bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.3)', text: '#818cf8', label: 'Pending' },
  confirmed: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', text: '#34d399', label: 'Confirmed' },
  failed: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', text: '#f87171', label: 'Rejected' },
};

const EXPLORER_URLS = {
  TRC20: 'https://tronscan.org/#/transaction/',
  BTC: 'https://blockstream.info/tx/',
  ETH: 'https://etherscan.io/tx/',
  BEP20: 'https://bscscan.com/tx/',
};

function getExplorerUrl(txid, network) {
  if (!txid) return null;
  const base = EXPLORER_URLS[network?.toUpperCase()] || EXPLORER_URLS.TRC20;
  return `${base}${txid}`;
}

function RiskIndicator({ order }) {
  const risks = [];
  if (order.duplicate_txid_warning) risks.push({ label: 'Duplicate TXID', color: '#ef4444' });
  if (!order.transaction_id) risks.push({ label: 'No TXID', color: '#f59e0b' });
  if (order.price > 1000) risks.push({ label: 'High Value', color: '#f59e0b' });

  if (risks.length === 0) return <span className="text-xs text-emerald-400 font-mono">✓ Low Risk</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {risks.map((r, i) => (
        <span key={i} className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ background: `${r.color}20`, color: r.color, border: `1px solid ${r.color}40` }}>
          ⚠ {r.label}
        </span>
      ))}
    </div>
  );
}

function ActionModal({ order, onClose, onSuccess }) {
  const [actionType, setActionType] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAction = async (type) => {
    setLoading(true);
    const response = await base44.functions.invoke('manualCryptoReview', {
      action: type === 'approve' ? 'approve_payment' : type === 'reject' ? 'reject_payment' : type === 'info' ? 'request_info' : 'mark_fraud',
      order_id: order.order_id,
      notes,
      reason: notes,
    });
    setLoading(false);
    if (response.data?.success) onSuccess(type);
    else alert(response.data?.error || 'Action failed');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="w-full max-w-lg rounded-2xl p-6 space-y-4"
        style={{ background: 'rgba(14,14,20,0.98)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white">Review Order #{order.order_id?.slice(-8)}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-white text-xl leading-none">×</button>
        </div>

        {/* Order details */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            ['Trader', order.email || order.full_name],
            ['Amount', `$${order.price}`],
            ['Challenge', `${order.challenge_type} ${order.account_size}`],
            ['Method', order.payment_method],
            ['TXID', order.transaction_id ? `${order.transaction_id.slice(0, 16)}...` : '-'],
            ['Network', order.proof_network || 'Unknown'],
          ].map(([k, v]) => (
            <div key={k} className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <span className="text-muted-foreground block">{k}</span>
              <span className="text-white font-medium">{v}</span>
            </div>
          ))}
        </div>

        {order.transaction_id && (
          <a href={getExplorerUrl(order.transaction_id, order.proof_network)} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors">
            <ExternalLink className="w-3 h-3" /> View on blockchain explorer
          </a>
        )}

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Admin Notes (required for reject/fraud)</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            placeholder="Internal notes, rejection reason, or fraud details..."
            className="w-full rounded-lg px-3 py-2 text-sm text-white resize-none outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => handleAction('approve')} disabled={loading}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
            style={{ background: 'linear-gradient(90deg,#10b981,#059669)', color: 'white' }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Approve
          </button>
          <button onClick={() => handleAction('reject')} disabled={loading || !notes}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
            style={{ background: 'linear-gradient(90deg,#ef4444,#dc2626)', color: 'white' }}>
            <XCircle className="w-4 h-4" /> Reject
          </button>
          <button onClick={() => handleAction('info')} disabled={loading || !notes}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
            style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8' }}>
            <MessageSquare className="w-4 h-4" /> Request Info
          </button>
          <button onClick={() => handleAction('fraud')} disabled={loading || !notes}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
            <Flag className="w-4 h-4" /> Mark Fraud
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function AdminPaymentReview() {
  const qc = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('awaiting_confirmation');

  const { data: reviews = [], isLoading, refetch } = useQuery({
    queryKey: ['payment-reviews'],
    queryFn: async () => {
      const res = await base44.functions.invoke('manualCryptoReview', { action: 'get_pending_reviews' });
      return res.data?.reviews || [];
    },
    refetchInterval: 30000,
  });

  const filtered = reviews.filter(r => filterStatus === 'all' || r.payment_status === filterStatus);
  const pendingCount = reviews.filter(r => r.payment_status === 'awaiting_confirmation').length;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground flex items-center gap-3 mb-1">
            <Shield className="w-6 h-6 text-primary" /> Payment Review Queue
          </h1>
          <p className="text-sm text-muted-foreground font-mono">
            Manual crypto payments requiring admin verification before challenge provisioning
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <div className="px-3 py-1.5 rounded-lg text-sm font-bold" style={{ background: 'rgba(234,179,8,0.15)', border: '1px solid rgba(234,179,8,0.3)', color: '#fbbf24' }}>
              {pendingCount} Pending Review
            </div>
          )}
          <button onClick={() => refetch()} className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Security notice */}
      <div className="rounded-xl p-4 mb-6 flex items-start gap-3" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
        <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <span className="text-emerald-400 font-bold">Secure Payment Gate Active</span>
          <p className="text-muted-foreground mt-0.5">No challenge account will be provisioned until admin manually approves payment proof. All approvals are audit-logged.</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { value: 'awaiting_confirmation', label: 'Awaiting Review' },
          { value: 'pending', label: 'Pending' },
          { value: 'all', label: 'All' },
        ].map(f => (
          <button key={f.value} onClick={() => setFilterStatus(f.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === f.value ? 'text-white' : 'text-muted-foreground hover:text-white'}`}
            style={filterStatus === f.value ? { background: 'rgba(255,92,0,0.2)', border: '1px solid rgba(255,92,0,0.4)' } : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl p-12 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}>
          <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground">No payments pending review.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order, i) => {
            const sc = STATUS_COLORS[order.payment_status] || STATUS_COLORS.pending;
            let proofData = {};
            try { proofData = JSON.parse(order.notes || '{}'); } catch {}

            return (
              <motion.div key={order.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span className="text-sm font-bold text-white">{order.full_name || order.email}</span>
                      <span className="text-xs text-muted-foreground font-mono">{order.email}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: sc.bg, border: `1px solid ${sc.border}`, color: sc.text }}>
                        {sc.label}
                      </span>
                      {order.duplicate_txid_warning && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                          ⚠ Duplicate TXID
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-3">
                      <div>
                        <span className="text-muted-foreground/60 block">Challenge</span>
                        <span className="text-white font-medium capitalize">{order.challenge_type}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground/60 block">Account Size</span>
                        <span className="text-primary font-bold">${Number(order.account_size || 0).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground/60 block">Price</span>
                        <span className="text-emerald-400 font-bold">${order.price}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground/60 block">Method</span>
                        <span className="text-white capitalize">{order.payment_method?.replace(/_/g, ' ')}</span>
                      </div>
                    </div>

                    {order.transaction_id && (
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex-1 rounded-lg px-3 py-2 flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                          <span className="text-[10px] text-muted-foreground">TXID:</span>
                          <span className="text-xs font-mono text-white truncate">{order.transaction_id}</span>
                          <button onClick={() => navigator.clipboard.writeText(order.transaction_id)} className="text-muted-foreground hover:text-white">
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        {getExplorerUrl(order.transaction_id, proofData.network || order.payment_method) && (
                          <a href={getExplorerUrl(order.transaction_id, proofData.network || order.payment_method)} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 whitespace-nowrap">
                            <ExternalLink className="w-3 h-3" /> Explorer
                          </a>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <RiskIndicator order={order} />
                      <div className="flex items-center gap-1 text-xs text-muted-foreground/60">
                        <Clock className="w-3 h-3" />
                        {order.created_date ? new Date(order.created_date).toLocaleDateString() : '-'}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button onClick={() => setSelectedOrder(order)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white transition-colors"
                      style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)' }}>
                      <Eye className="w-4 h-4" /> Review
                    </button>
                    {proofData.screenshot_url && (
                      <a href={proofData.screenshot_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-center"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
                        📷 Screenshot
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {selectedOrder && (
          <ActionModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onSuccess={(type) => {
              setSelectedOrder(null);
              qc.invalidateQueries({ queryKey: ['payment-reviews'] });
              refetch();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}