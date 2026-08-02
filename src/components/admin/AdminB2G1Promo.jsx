import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gift, Save, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

const DEFAULT_SETTINGS = {
  setting_key: 'b2g1_promo',
  b2g1_enabled: false,
  b2g1_headline: 'BUY 2 CHALLENGES, GET 1 FREE',
  b2g1_subline: 'Buy two challenges of the same size and automatically receive a third, smaller account on us — added to your order at no cost.',
  b2g1_cta_label: 'Shop Challenges',
  b2g1_badge_text: 'LIMITED OFFER',
  b2g1_tier_mapping: [
    { buy_size: 25000, free_size: 10000 },
    { buy_size: 50000, free_size: 25000 },
    { buy_size: 100000, free_size: 50000 },
    { buy_size: 200000, free_size: 100000 },
  ],
};

export default function AdminB2G1Promo() {
  const [form, setForm] = useState(DEFAULT_SETTINGS);
  const [editMode, setEditMode] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-b2g1-settings'],
    queryFn: async () => {
      const list = await base44.entities.PromotionSettings.filter({ setting_key: 'b2g1_promo' });
      return list[0] || null;
    },
  });

  useEffect(() => {
    if (settings) {
      setForm({
        setting_key: 'b2g1_promo',
        b2g1_enabled: settings.b2g1_enabled ?? false,
        b2g1_headline: settings.b2g1_headline || DEFAULT_SETTINGS.b2g1_headline,
        b2g1_subline: settings.b2g1_subline || DEFAULT_SETTINGS.b2g1_subline,
        b2g1_cta_label: settings.b2g1_cta_label || DEFAULT_SETTINGS.b2g1_cta_label,
        b2g1_badge_text: settings.b2g1_badge_text || DEFAULT_SETTINGS.b2g1_badge_text,
        b2g1_tier_mapping: settings.b2g1_tier_mapping?.length ? settings.b2g1_tier_mapping : DEFAULT_SETTINGS.b2g1_tier_mapping,
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (settings?.id) {
        await base44.entities.PromotionSettings.update(settings.id, form);
      } else {
        await base44.entities.PromotionSettings.create(form);
      }
    },
    onSuccess: () => {
      toast.success('B2G1 promo settings saved');
      setEditMode(false);
    },
    onError: (e) => toast.error('Failed to save: ' + e.message),
  });

  const updateTier = (idx, field, value) => {
    setForm(f => ({
      ...f,
      b2g1_tier_mapping: f.b2g1_tier_mapping.map((t, i) =>
        i === idx ? { ...t, [field]: Number(value) } : t
      ),
    }));
  };

  const addTier = () => {
    setForm(f => ({ ...f, b2g1_tier_mapping: [...f.b2g1_tier_mapping, { buy_size: 0, free_size: 0 }] }));
  };

  const removeTier = (idx) => {
    setForm(f => ({ ...f, b2g1_tier_mapping: f.b2g1_tier_mapping.filter((_, i) => i !== idx) }));
  };

  if (isLoading) {
    return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <Gift className="w-6 h-6 text-primary" /> Buy 2 Get 1 Free
          </h1>
          <p className="text-sm text-white/30 mt-1">Manage the promotional offer</p>
        </div>
        <button onClick={() => setEditMode(!editMode)}
          className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
          style={{
            background: editMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,92,0,0.1)',
            border: `1px solid ${editMode ? 'rgba(255,255,255,0.1)' : 'rgba(255,92,0,0.3)'}`,
            color: editMode ? 'white/60' : '#FF5C00',
          }}>
          {editMode ? 'Cancel' : 'Edit Settings'}
        </button>
      </div>

      {/* Toggle */}
      <div className="rounded-2xl p-5 mb-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-white">Promo Status</div>
            <div className="text-xs text-white/40 mt-0.5">
              {form.b2g1_enabled ? 'Active — popup and banners are visible' : 'Inactive — promo is hidden'}
            </div>
          </div>
          <button
            onClick={() => editMode && setForm(f => ({ ...f, b2g1_enabled: !f.b2g1_enabled }))}
            disabled={!editMode}
            className="flex items-center gap-2 transition-all"
          >
            {form.b2g1_enabled
              ? <ToggleRight className="w-12 h-12 text-primary" />
              : <ToggleLeft className="w-12 h-12 text-white/20" />}
          </button>
        </div>
      </div>

      {/* Text fields */}
      <div className="rounded-2xl p-5 mb-6 space-y-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div>
          <label className="block text-[11px] font-mono text-white/40 uppercase tracking-wider mb-1.5">Headline</label>
          <input type="text" value={form.b2g1_headline} disabled={!editMode}
            onChange={e => setForm(f => ({ ...f, b2g1_headline: e.target.value }))}
            className="w-full rounded-xl px-4 py-2.5 text-sm text-white outline-none disabled:opacity-50"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
        </div>
        <div>
          <label className="block text-[11px] font-mono text-white/40 uppercase tracking-wider mb-1.5">Subline</label>
          <textarea value={form.b2g1_subline} disabled={!editMode} rows={3}
            onChange={e => setForm(f => ({ ...f, b2g1_subline: e.target.value }))}
            className="w-full rounded-xl px-4 py-2.5 text-sm text-white outline-none disabled:opacity-50 resize-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-mono text-white/40 uppercase tracking-wider mb-1.5">CTA Label</label>
            <input type="text" value={form.b2g1_cta_label} disabled={!editMode}
              onChange={e => setForm(f => ({ ...f, b2g1_cta_label: e.target.value }))}
              className="w-full rounded-xl px-4 py-2.5 text-sm text-white outline-none disabled:opacity-50"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
          </div>
          <div>
            <label className="block text-[11px] font-mono text-white/40 uppercase tracking-wider mb-1.5">Badge Text</label>
            <input type="text" value={form.b2g1_badge_text} disabled={!editMode}
              onChange={e => setForm(f => ({ ...f, b2g1_badge_text: e.target.value }))}
              className="w-full rounded-xl px-4 py-2.5 text-sm text-white outline-none disabled:opacity-50"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
          </div>
        </div>
      </div>

      {/* Tier mapping */}
      <div className="rounded-2xl p-5 mb-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-bold text-white">Tier Mapping</div>
          {editMode && (
            <button onClick={addTier} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-primary"
              style={{ background: 'rgba(255,92,0,0.1)', border: '1px solid rgba(255,92,0,0.2)' }}>
              <Plus className="w-3.5 h-3.5" /> Add Tier
            </button>
          )}
        </div>
        <div className="space-y-2">
          {form.b2g1_tier_mapping.map((tier, idx) => (
            <div key={idx} className="flex items-center gap-3 px-3 py-2 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-center gap-2 flex-1">
                <span className="text-[10px] font-mono text-white/40">2×</span>
                <input type="number" value={tier.buy_size} disabled={!editMode}
                  onChange={e => updateTier(idx, 'buy_size', e.target.value)}
                  className="w-24 rounded-lg px-3 py-1.5 text-sm text-white outline-none disabled:opacity-50"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
              <span className="text-white/20">→</span>
              <div className="flex items-center gap-2 flex-1">
                <span className="text-[10px] font-mono text-primary">FREE</span>
                <input type="number" value={tier.free_size} disabled={!editMode}
                  onChange={e => updateTier(idx, 'free_size', e.target.value)}
                  className="w-24 rounded-lg px-3 py-1.5 text-sm text-white outline-none disabled:opacity-50"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
              {editMode && (
                <button onClick={() => removeTier(idx)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {editMode && (
        <motion.button
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
          className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all"
          style={{ background: 'linear-gradient(90deg, #FF5C00, #FF7A2F)' }}>
          <Save className="w-4 h-4" /> {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
        </motion.button>
      )}
    </div>
  );
}