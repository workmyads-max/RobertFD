import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Copy, CheckCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const EMPTY_FORM = { code: '', name: '', discount_type: 'percentage', discount_value: 10, is_active: true, max_uses: 0, per_user_limit: 1, expires_at: '', notes: '' };

export default function AdminCoupons() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [copied, setCopied] = useState('');
  const qc = useQueryClient();

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ['coupons'],
    queryFn: () => base44.entities.Coupon.list('-created_date', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Coupon.create({ ...data, code: data.code.toUpperCase().trim() }),
    onSuccess: () => { qc.invalidateQueries(['coupons']); setShowForm(false); setForm(EMPTY_FORM); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Coupon.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['coupons']); setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Coupon.delete(id),
    onSuccess: () => qc.invalidateQueries(['coupons']),
  });

  const handleSubmit = () => {
    if (!form.code || !form.discount_value) return;
    if (editingId) updateMutation.mutate({ id: editingId, data: form });
    else createMutation.mutate(form);
  };

  const handleEdit = (c) => { setForm({ ...c }); setEditingId(c.id); setShowForm(true); };

  const handleCopy = (code) => { navigator.clipboard.writeText(code); setCopied(code); setTimeout(() => setCopied(''), 2000); };

  const stats = {
    active: coupons.filter(c => c.is_active).length,
    totalUses: coupons.reduce((s, c) => s + (c.uses_count || 0), 0),
    expired: coupons.filter(c => c.expires_at && new Date(c.expires_at) < new Date()).length,
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-black text-foreground flex items-center gap-3">
            <Tag className="w-6 h-6 text-primary" /> Coupon Management
          </h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">Create and manage discount & redeem codes</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(EMPTY_FORM); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)' }}>
          <Plus className="w-4 h-4" /> Create Coupon
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Active Coupons', value: stats.active, color: '#10b981' },
          { label: 'Total Uses', value: stats.totalUses, color: '#6366f1' },
          { label: 'Expired', value: stats.expired, color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 text-center"
            style={{ background: `${s.color}08`, border: `1px solid ${s.color}25` }}>
            <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs font-mono text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Create/Edit Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="rounded-2xl p-6 mb-6"
            style={{ background: 'rgba(255,92,0,0.06)', border: '1px solid rgba(255,92,0,0.25)' }}>
            <h3 className="text-sm font-black text-foreground mb-4">{editingId ? 'Edit Coupon' : 'New Coupon'}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              {[
                { label: 'Coupon Code', key: 'code', placeholder: 'SAVE20', upper: true },
                { label: 'Display Name', key: 'name', placeholder: 'Summer Sale 20%' },
                { label: 'Notes', key: 'notes', placeholder: 'Internal notes...' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-[10px] font-mono text-muted-foreground uppercase mb-1 block">{f.label}</label>
                  <input value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: f.upper ? e.target.value.toUpperCase() : e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full rounded-xl px-3 py-2.5 text-sm text-foreground outline-none font-mono"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>
              ))}
              <div>
                <label className="text-[10px] font-mono text-muted-foreground uppercase mb-1 block">Discount Type</label>
                <select value={form.discount_type} onChange={e => setForm(p => ({ ...p, discount_type: e.target.value }))}
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-foreground outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount ($)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-mono text-muted-foreground uppercase mb-1 block">
                  Discount Value ({form.discount_type === 'percentage' ? '%' : '$'})
                </label>
                <input type="number" value={form.discount_value || ''} onChange={e => setForm(p => ({ ...p, discount_value: parseFloat(e.target.value) || 0 }))}
                  min="0" max={form.discount_type === 'percentage' ? 100 : 9999}
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-foreground outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
              <div>
                <label className="text-[10px] font-mono text-muted-foreground uppercase mb-1 block">Max Uses (0=unlimited)</label>
                <input type="number" value={form.max_uses || 0} onChange={e => setForm(p => ({ ...p, max_uses: parseInt(e.target.value) || 0 }))}
                  min="0" className="w-full rounded-xl px-3 py-2.5 text-sm text-foreground outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
              <div>
                <label className="text-[10px] font-mono text-muted-foreground uppercase mb-1 block">Per User Limit</label>
                <input type="number" value={form.per_user_limit || 1} onChange={e => setForm(p => ({ ...p, per_user_limit: parseInt(e.target.value) || 1 }))}
                  min="1" className="w-full rounded-xl px-3 py-2.5 text-sm text-foreground outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
              <div>
                <label className="text-[10px] font-mono text-muted-foreground uppercase mb-1 block">Expires At</label>
                <input type="datetime-local" value={form.expires_at || ''} onChange={e => setForm(p => ({ ...p, expires_at: e.target.value }))}
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-foreground outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', colorScheme: 'dark' }} />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)' }}>
                {editingId ? 'Update Coupon' : 'Create Coupon'}
              </button>
              <button onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); }}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Coupons List */}
      {isLoading ? (
        <div className="py-12 text-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : coupons.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }}>
          <Tag className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No coupons created yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {coupons.map((c, idx) => {
            const isExpired = c.expires_at && new Date(c.expires_at) < new Date();
            const usageLeft = c.max_uses > 0 ? c.max_uses - (c.uses_count || 0) : null;
            return (
              <motion.div key={c.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                className="rounded-xl p-4 flex items-center gap-4 flex-wrap"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${c.is_active && !isExpired ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.08)'}`,
                  opacity: isExpired ? 0.6 : 1,
                }}>
                {/* Code */}
                <div className="flex items-center gap-2 min-w-[140px]">
                  <div className="px-3 py-1.5 rounded-lg font-black text-sm font-mono"
                    style={{ background: 'rgba(255,92,0,0.12)', color: '#FF5C00', border: '1px solid rgba(255,92,0,0.3)' }}>
                    {c.code}
                  </div>
                  <button onClick={() => handleCopy(c.code)} className="text-muted-foreground hover:text-primary transition-colors">
                    {copied === c.code ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-foreground">{c.name || c.code}</div>
                  <div className="text-[11px] text-muted-foreground font-mono">
                    {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `$${c.discount_value} OFF`}
                    {c.expires_at && ` · Expires ${new Date(c.expires_at).toLocaleDateString()}`}
                    {c.max_uses > 0 && ` · ${usageLeft} uses left`}
                  </div>
                </div>
                {/* Stats */}
                <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
                  <span className="text-center"><span className="block text-foreground font-black">{c.uses_count || 0}</span>Uses</span>
                  {isExpired && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-yellow-400" style={{ background: 'rgba(245,158,11,0.12)' }}>Expired</span>}
                </div>
                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button onClick={() => updateMutation.mutate({ id: c.id, data: { is_active: !c.is_active } })}
                    className="transition-all">
                    {c.is_active ? <ToggleRight className="w-7 h-7 text-emerald-400" /> : <ToggleLeft className="w-7 h-7 text-muted-foreground" />}
                  </button>
                  <button onClick={() => handleEdit(c)} className="p-2 rounded-lg hover:bg-primary/20 text-primary transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => window.confirm('Delete this coupon?') && deleteMutation.mutate(c.id)}
                    className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}