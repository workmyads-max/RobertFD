import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Plus, Trash2, ToggleLeft, ToggleRight, Megaphone, Zap, AlertTriangle, Settings, DollarSign, Info, Bell, Edit } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const typeConfig = {
  announcement: { icon: Megaphone, label: 'Announcement', color: '#FF5C00' },
  maintenance: { icon: Settings, label: 'Maintenance', color: '#f59e0b' },
  rule_update: { icon: Info, label: 'Rule Update', color: '#60a5fa' },
  promotion: { icon: Zap, label: 'Promotion', color: '#CCFF00' },
  payout: { icon: DollarSign, label: 'Payout Alert', color: '#10b981' },
  market_alert: { icon: AlertTriangle, label: 'Market Alert', color: '#ef4444' },
  system: { icon: Bell, label: 'System', color: '#888' },
};

const BLANK = {
  title: '', message: '', type: 'announcement', priority: 'medium',
  display_mode: 'sidebar', is_active: true, cta_label: '', cta_link: '', target: 'all',
};

export default function AdminNotifications() {
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(BLANK);
  const qc = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['all-notifications'],
    queryFn: () => base44.entities.Notification.list('-created_date', 50),
  });

  const createMutation = useMutation({
    mutationFn: (data) => editItem
      ? base44.entities.Notification.update(editItem.id, data)
      : base44.entities.Notification.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['all-notifications'] }); qc.invalidateQueries({ queryKey: ['notifications'] }); setShowForm(false); setEditItem(null); setForm(BLANK); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['all-notifications'] }); qc.invalidateQueries({ queryKey: ['notifications'] }); },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.Notification.update(id, { is_active }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['all-notifications'] }); qc.invalidateQueries({ queryKey: ['notifications'] }); },
  });

  const openEdit = (n) => { setEditItem(n); setForm({ ...n }); setShowForm(true); };
  const openNew = () => { setEditItem(null); setForm(BLANK); setShowForm(true); };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
            <Shield className="w-6 h-6 text-primary" /> Manage Notifications
          </h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">Admin control panel - push announcements to all users</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
          style={{ background: 'linear-gradient(90deg, #FF5C00, #FF7A2F)', boxShadow: '0 4px 16px rgba(255,92,0,0.3)' }}>
          <Plus className="w-4 h-4" /> New Notification
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total', value: notifications.length },
          { label: 'Active', value: notifications.filter(n => n.is_active).length },
          { label: 'Inactive', value: notifications.filter(n => !n.is_active).length },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-4 text-center"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="text-2xl font-black text-foreground">{s.value}</div>
            <div className="text-xs font-mono text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-12 rounded-2xl" style={{ border: '1px dashed rgba(255,255,255,0.1)' }}>
            <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No notifications created yet.</p>
          </div>
        ) : notifications.map((n, i) => {
          const cfg = typeConfig[n.type] || typeConfig.system;
          const Icon = cfg.icon;
          return (
            <motion.div key={n.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="rounded-2xl p-5 transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${n.is_active ? 'rgba(255,92,0,0.2)' : 'rgba(255,255,255,0.07)'}`, opacity: n.is_active ? 1 : 0.6 }}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${cfg.color}15`, border: `1px solid ${cfg.color}30` }}>
                  <Icon className="w-5 h-5" style={{ color: cfg.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-bold text-foreground">{n.title}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono" style={{ background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}25` }}>{cfg.label}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-muted-foreground" style={{ background: 'rgba(255,255,255,0.05)' }}>{n.display_mode}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ml-auto ${n.is_active ? 'text-emerald-400' : 'text-muted-foreground'}`}
                      style={{ background: n.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${n.is_active ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.08)'}` }}>
                      {n.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{n.message}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => openEdit(n)} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <Edit className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                  </button>
                  <button onClick={() => toggleMutation.mutate({ id: n.id, is_active: !n.is_active })}
                    className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                    {n.is_active ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5 text-muted-foreground" />}
                  </button>
                  <button onClick={() => deleteMutation.mutate(n.id)} className="p-2 rounded-lg hover:bg-red-500/10 transition-colors">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl overflow-y-auto max-h-[90vh]"
              style={{ background: '#0e0e10', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center justify-between p-5 border-b border-white/5">
                <h2 className="text-lg font-black text-foreground">{editItem ? 'Edit Notification' : 'Create Notification'}</h2>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground text-xl">×</button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-mono text-muted-foreground mb-1.5 block uppercase">Title *</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Notification title..."
                    className="w-full rounded-xl px-4 py-2.5 text-sm text-foreground outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} required />
                </div>
                <div>
                  <label className="text-xs font-mono text-muted-foreground mb-1.5 block uppercase">Message *</label>
                  <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={3}
                    placeholder="Notification message..."
                    className="w-full rounded-xl px-4 py-3 text-sm text-foreground outline-none resize-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'type', label: 'Type', options: Object.entries(typeConfig).map(([v, c]) => ({ v, l: c.label })) },
                    { key: 'priority', label: 'Priority', options: [{ v: 'low', l: 'Low' }, { v: 'medium', l: 'Medium' }, { v: 'high', l: 'High' }, { v: 'critical', l: 'Critical' }] },
                    { key: 'display_mode', label: 'Display Mode', options: [{ v: 'popup', l: 'Popup' }, { v: 'banner', l: 'Banner' }, { v: 'sidebar', l: 'Sidebar' }, { v: 'all', l: 'All' }] },
                    { key: 'target', label: 'Target', options: [{ v: 'all', l: 'All Users' }, { v: 'funded', l: 'Funded' }, { v: 'challenge', l: 'Challenge' }, { v: 'admin', l: 'Admins Only' }] },
                  ].map(({ key, label, options }) => (
                    <div key={key}>
                      <label className="text-xs font-mono text-muted-foreground mb-1.5 block uppercase">{label}</label>
                      <select value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                        className="w-full rounded-xl px-4 py-2.5 text-sm text-foreground outline-none"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-mono text-muted-foreground mb-1.5 block uppercase">CTA Label</label>
                    <input value={form.cta_label} onChange={e => setForm(f => ({ ...f, cta_label: e.target.value }))} placeholder="e.g. Learn More"
                      className="w-full rounded-xl px-4 py-2.5 text-sm text-foreground outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-muted-foreground mb-1.5 block uppercase">CTA Link</label>
                    <input value={form.cta_link} onChange={e => setForm(f => ({ ...f, cta_link: e.target.value }))} placeholder="https://..."
                      className="w-full rounded-xl px-4 py-2.5 text-sm text-foreground outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                    className="w-4 h-4 accent-orange-500" />
                  <label htmlFor="is_active" className="text-sm text-foreground cursor-pointer">Active (visible to users)</label>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                    style={{ border: '1px solid rgba(255,255,255,0.1)' }}>Cancel</button>
                  <button onClick={() => createMutation.mutate(form)} disabled={!form.title || !form.message || createMutation.isPending}
                    className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
                    style={{ background: 'linear-gradient(90deg, #FF5C00, #FF7A2F)', boxShadow: '0 4px 16px rgba(255,92,0,0.3)' }}>
                    {createMutation.isPending ? 'Saving...' : editItem ? 'Update' : 'Publish'}
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