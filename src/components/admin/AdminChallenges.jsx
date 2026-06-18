import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Edit2, Trash2, Plus, Save, X, Search, Loader2, CheckCircle, Eye, EyeOff, Star, Globe, GlobeLock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const CHALLENGE_TYPE_LABELS = {
  'two-step': 'Two-Step',
  'instant': 'Instant',
  'instant_light': 'Instant Light',
};

const EMPTY_FORM = {
  plan_id: '',
  name: '',
  type: 'two-step',
  account_type: 'standard',
  size: 10000,
  price: 0,
  leverage_standard: '1:100',
  leverage_swing: '1:30',
  phase1_target: 10,
  phase2_target: 5,
  daily_dd: 5,
  max_dd: 10,
  profit_split: 80,
  max_lots: 20,
  news_trading: false,
  overnight_holding: false,
  weekend_holding: false,
  hedging: false,
  is_active: true,
  is_visible: true,
  is_popular: false,
  sort_order: 0,
  min_trading_days: 4,
};

export default function AdminChallenges() {
  const qc = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({});
  const [saved, setSaved] = useState(false);

  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ['challenge-plans-admin'],
    queryFn: () => base44.entities.ChallengePlan.list('sort_order', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ChallengePlan.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['challenge-plans-admin'] }); qc.invalidateQueries({ queryKey: ['challenge-plans'] }); setShowAddForm(false); setFormData({}); flashSaved(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ChallengePlan.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['challenge-plans-admin'] }); qc.invalidateQueries({ queryKey: ['challenge-plans'] }); setEditingId(null); setFormData({}); flashSaved(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ChallengePlan.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['challenge-plans-admin'] }); qc.invalidateQueries({ queryKey: ['challenge-plans'] }); },
  });

  const flashSaved = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const filtered = challenges.filter(ch => {
    const matchSearch = ch.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = filterType === 'all' || ch.type === filterType;
    return matchSearch && matchType;
  });

  const handleEdit = (ch) => { setEditingId(ch.id); setFormData({ ...ch }); setShowAddForm(false); };
  const handleAddNew = () => { setShowAddForm(true); setEditingId(null); setFormData({ ...EMPTY_FORM, plan_id: `plan-${Date.now()}` }); };

  const handleSave = () => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (ch) => {
    if (window.confirm(`Delete "${ch.name}"?`)) deleteMutation.mutate(ch.id);
  };

  const quickUpdateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ChallengePlan.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['challenge-plans-admin'] }); qc.invalidateQueries({ queryKey: ['challenge-plans'] }); },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground flex items-center gap-3 mb-1">
            <Zap className="w-6 h-6 text-primary" /> Manage Challenges
          </h1>
          <p className="text-sm text-muted-foreground font-mono">All challenge plans — synced with Supabase</p>
        </div>
        {saved && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-emerald-400"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <CheckCircle className="w-4 h-4" /> Saved
          </motion.div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button onClick={handleAddNew}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold text-white"
          style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)' }}>
          <Plus className="w-4 h-4" /> Add Plan
        </button>

        <div className="flex-1 relative min-w-[200px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search plans..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg text-sm text-foreground outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
        </div>

        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm text-foreground outline-none"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <option value="all">All Types</option>
          <option value="two-step">Two-Step</option>
          <option value="instant">Instant</option>
          <option value="instant_light">Instant Light</option>
        </select>

        <div className="text-xs font-mono text-muted-foreground flex items-center">
          {filtered.length} plan{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="rounded-xl p-6 mb-6"
            style={{ background: 'rgba(255,92,0,0.06)', border: '1px solid rgba(255,92,0,0.2)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-foreground">New Challenge Plan</h3>
              <button onClick={() => setShowAddForm(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <ChallengeForm formData={formData} setFormData={setFormData} onSave={handleSave} onCancel={() => setShowAddForm(false)} isPending={isPending} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="rounded-lg p-8 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }}>
              <p className="text-sm text-muted-foreground">No plans found.</p>
            </div>
          ) : (
            filtered.map((ch, idx) => (
              <motion.div key={ch.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                className="rounded-xl border"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>

                {editingId === ch.id ? (
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-foreground">Editing: {ch.name}</h3>
                      <button onClick={() => setEditingId(null)}><X className="w-4 h-4 text-muted-foreground" /></button>
                    </div>
                    <ChallengeForm formData={formData} setFormData={setFormData} onSave={handleSave} onCancel={() => setEditingId(null)} isPending={isPending} />
                  </div>
                ) : (
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className="text-sm font-bold text-foreground">{ch.name}</span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono text-primary"
                            style={{ background: 'rgba(255,92,0,0.12)', border: '1px solid rgba(255,92,0,0.2)' }}>
                            ${ch.price}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono"
                            style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}>
                            {CHALLENGE_TYPE_LABELS[ch.type] || ch.type}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono capitalize"
                            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
                            {ch.account_type}
                          </span>
                          {!ch.is_active && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono text-red-400"
                              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                              Inactive
                            </span>
                          )}
                          {ch.is_visible === false && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono text-blue-400"
                              style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                              Hidden
                            </span>
                          )}
                          {ch.is_popular && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono text-yellow-400"
                              style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.2)' }}>
                              ⭐ Popular
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs text-muted-foreground/70 mb-3">
                          <div>Size: <span className="text-foreground font-mono">${ch.size?.toLocaleString()}</span></div>
                          <div>P1 Target: <span className="text-primary font-bold">{ch.phase1_target}%</span></div>
                          {ch.type === 'two-step' && <div>P2 Target: <span className="text-primary font-bold">{ch.phase2_target}%</span></div>}
                          <div>Daily DD: <span className="text-red-400 font-bold">{ch.daily_dd}%</span></div>
                          <div>Max DD: <span className="text-red-400 font-bold">{ch.max_dd}%</span></div>
                          <div>Split: <span className="text-emerald-400 font-bold">{ch.profit_split}%</span></div>
                          <div>Lots: <span className="text-foreground font-mono">{ch.max_lots}</span></div>
                          <div>Lev Std: <span className="text-foreground font-mono">{ch.leverage_standard}</span></div>
                          <div>Lev Swing: <span className="text-foreground font-mono">{ch.leverage_swing}</span></div>
                          <div>Order: <span className="text-foreground font-mono">{ch.sort_order}</span></div>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          {[
                            { key: 'news_trading', label: 'News' },
                            { key: 'overnight_holding', label: 'Overnight' },
                            { key: 'weekend_holding', label: 'Weekend' },
                            { key: 'hedging', label: 'Hedging' },
                          ].map(r => (
                            <span key={r.key} className={`px-2 py-0.5 rounded text-[10px] font-mono ${ch[r.key] ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                              {ch[r.key] ? '✓' : '✗'} {r.label}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-1.5 flex-shrink-0 ml-4 items-center">
                        {/* Quick toggle: Marketplace visibility */}
                        <button
                          onClick={() => quickUpdateMutation.mutate({ id: ch.id, data: { is_visible: ch.is_visible === false ? true : false } })}
                          title={ch.is_visible !== false ? 'Hide from marketplace' : 'Show in marketplace'}
                          className={`p-2 rounded-lg transition-colors ${ch.is_visible !== false ? 'text-blue-400 hover:bg-blue-500/20' : 'text-muted-foreground hover:bg-white/10'}`}>
                          {ch.is_visible !== false ? <Globe className="w-4 h-4" /> : <GlobeLock className="w-4 h-4" />}
                        </button>
                        {/* Quick toggle: Active */}
                        <button
                          onClick={() => quickUpdateMutation.mutate({ id: ch.id, data: { is_active: !ch.is_active } })}
                          title={ch.is_active ? 'Disable plan' : 'Enable plan'}
                          className={`p-2 rounded-lg transition-colors ${ch.is_active ? 'text-emerald-400 hover:bg-emerald-500/20' : 'text-muted-foreground hover:bg-white/10'}`}>
                          {ch.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        {/* Quick toggle: Popular */}
                        <button
                          onClick={() => quickUpdateMutation.mutate({ id: ch.id, data: { is_popular: !ch.is_popular } })}
                          title={ch.is_popular ? 'Remove popular' : 'Mark as popular'}
                          className={`p-2 rounded-lg transition-colors ${ch.is_popular ? 'text-yellow-400 hover:bg-yellow-500/20' : 'text-muted-foreground hover:bg-white/10'}`}>
                          <Star className="w-4 h-4" fill={ch.is_popular ? 'currentColor' : 'none'} />
                        </button>
                        <button onClick={() => handleEdit(ch)} className="p-2 rounded-lg hover:bg-primary/20 text-primary transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(ch)} disabled={deleteMutation.isPending}
                          className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function ChallengeForm({ formData, setFormData, onSave, onCancel, isPending }) {
  const set = (key, val) => setFormData(f => ({ ...f, [key]: val }));

  const field = (label, key, type = 'text') => (
    <div>
      <label className="text-xs font-mono text-muted-foreground mb-1 block">{label}</label>
      <input type={type} value={formData[key] ?? ''} onChange={e => set(key, type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
        className="w-full rounded-lg px-3 py-2 text-sm text-foreground outline-none"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {field('Name', 'name')}
        <div>
          <label className="text-xs font-mono text-muted-foreground mb-1 block">Challenge Type</label>
          <select value={formData.type} onChange={e => set('type', e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm text-foreground outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <option value="two-step">Two-Step</option>
            <option value="instant">Instant</option>
            <option value="instant_light">Instant Light</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-mono text-muted-foreground mb-1 block">Account Type</label>
          <select value={formData.account_type} onChange={e => set('account_type', e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm text-foreground outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <option value="standard">Standard</option>
            <option value="swing">Swing</option>
          </select>
        </div>
        {field('Plan ID', 'plan_id')}
        {field('Account Size ($)', 'size', 'number')}
        {field('Price (USD)', 'price', 'number')}
        {field('Leverage Std', 'leverage_standard')}
        {field('Leverage Swing', 'leverage_swing')}
        {field('P1 Target (%)', 'phase1_target', 'number')}
        {formData.type === 'two-step' && field('P2 Target (%)', 'phase2_target', 'number')}
        {field('Daily DD (%)', 'daily_dd', 'number')}
        {field('Max DD (%)', 'max_dd', 'number')}
        {field('Profit Split (%)', 'profit_split', 'number')}
        {field('Max Lots', 'max_lots', 'number')}
        {field('Min Trading Days', 'min_trading_days', 'number')}
        {field('Sort Order', 'sort_order', 'number')}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { key: 'news_trading', label: 'News Trading' },
          { key: 'overnight_holding', label: 'Overnight Holding' },
          { key: 'weekend_holding', label: 'Weekend Holding' },
          { key: 'hedging', label: 'Hedging' },
          { key: 'is_active', label: 'Active (purchasable)' },
          { key: 'is_visible', label: 'Visible in Marketplace' },
          { key: 'is_popular', label: 'Mark as Popular' },
        ].map(r => (
          <label key={r.key} className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={!!formData[r.key]} onChange={e => set(r.key, e.target.checked)} className="rounded" />
            <span className="text-xs text-foreground">{r.label}</span>
          </label>
        ))}
      </div>

      <div className="flex gap-2 pt-2">
        <button onClick={onSave} disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-50"
          style={{ background: 'linear-gradient(90deg,#10b981,#059669)' }}>
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isPending ? 'Saving...' : 'Save Plan'}
        </button>
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
          Cancel
        </button>
      </div>
    </div>
  );
}