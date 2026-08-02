import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Gift, Plus, Trash2, Save, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { DEFAULT_B2G1_TIERS, formatSize } from '@/lib/b2g1Promo';

export default function AdminB2G1Promo() {
  const qc = useQueryClient();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  // Fetch settings (admin can read PromotionSettings directly)
  const { data: settings, isLoading } = useQuery({
    queryKey: ['b2g1-promo-settings'],
    queryFn: async () => {
      const results = await base44.entities.PromotionSettings.filter({ setting_key: 'b2g1_promo' });
      if (results[0]) return results[0];
      // Create default record if none exists
      const created = await base44.entities.PromotionSettings.create({
        setting_key: 'b2g1_promo',
        b2g1_enabled: false,
        b2g1_headline: 'BUY 2 CHALLENGES, GET 1 FREE',
        b2g1_subline: 'Buy two challenges of the same size and automatically receive a third, smaller account on us — added to your order at no cost.',
        b2g1_cta_label: 'Shop Challenges',
        b2g1_badge_text: 'LIMITED OFFER',
        b2g1_tier_mapping: DEFAULT_B2G1_TIERS,
      });
      return created;
    },
  });

  useEffect(() => {
    if (settings) {
      setForm({
        b2g1_enabled: settings.b2g1_enabled ?? false,
        b2g1_headline: settings.b2g1_headline || 'BUY 2 CHALLENGES, GET 1 FREE',
        b2g1_subline: settings.b2g1_subline || '',
        b2g1_cta_label: settings.b2g1_cta_label || 'Shop Challenges',
        b2g1_badge_text: settings.b2g1_badge_text || 'LIMITED OFFER',
        b2g1_tier_mapping: settings.b2g1_tier_mapping?.length ? settings.b2g1_tier_mapping : DEFAULT_B2G1_TIERS,
      });
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.PromotionSettings.update(settings.id, form);
      qc.invalidateQueries({ queryKey: ['b2g1-promo-settings'] });
      toast.success('Buy 2 Get 1 Free settings saved!');
    } catch (e) {
      toast.error('Failed to save: ' + (e.message || 'unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const updateTier = (idx, field, value) => {
    setForm(f => ({
      ...f,
      b2g1_tier_mapping: f.b2g1_tier_mapping.map((t, i) =>
        i === idx ? { ...t, [field]: Number(value) } : t
      ),
    }));
  };

  const addTier = () => {
    setForm(f => ({
      ...f,
      b2g1_tier_mapping: [...f.b2g1_tier_mapping, { buy_size: 0, free_size: 0 }],
    }));
  };

  const removeTier = (idx) => {
    setForm(f => ({
      ...f,
      b2g1_tier_mapping: f.b2g1_tier_mapping.filter((_, i) => i !== idx),
    }));
  };

  if (isLoading || !form) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-foreground flex items-center gap-3 mb-2">
          <Gift className="w-7 h-7 text-primary" />
          Buy 2 Get 1 Free
        </h1>
        <p className="text-sm text-muted-foreground">
          Control the promotional popup on the home page and the tiered free-account logic at checkout.
        </p>
      </div>

      {/* Master Toggle */}
      <div className="rounded-2xl p-5 mb-6 flex items-center justify-between"
        style={{ background: form.b2g1_enabled ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${form.b2g1_enabled ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.08)'}` }}>
        <div>
          <div className="text-sm font-bold text-foreground">Promo Active</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {form.b2g1_enabled ? 'Popup is showing and checkout logic is live.' : 'Promo is currently disabled.'}
          </div>
        </div>
        <button
          onClick={() => setForm(f => ({ ...f, b2g1_enabled: !f.b2g1_enabled }))}
          className="relative w-14 h-7 rounded-full transition-colors flex-shrink-0"
          style={{ background: form.b2g1_enabled ? '#10b981' : 'rgba(255,255,255,0.15)' }}
        >
          <motion.div
            animate={{ x: form.b2g1_enabled ? 28 : 2 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-md"
          />
        </button>
      </div>

      {/* Popup Content */}
      <div className="rounded-2xl p-6 mb-6 space-y-5"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Popup Content</div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Badge Text</label>
          <input
            type="text"
            value={form.b2g1_badge_text}
            onChange={e => setForm(f => ({ ...f, b2g1_badge_text: e.target.value }))}
            className="w-full rounded-xl px-4 py-2.5 text-sm text-foreground outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Headline</label>
          <input
            type="text"
            value={form.b2g1_headline}
            onChange={e => setForm(f => ({ ...f, b2g1_headline: e.target.value }))}
            className="w-full rounded-xl px-4 py-2.5 text-sm text-foreground outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Subline</label>
          <textarea
            value={form.b2g1_subline}
            onChange={e => setForm(f => ({ ...f, b2g1_subline: e.target.value }))}
            rows={3}
            className="w-full rounded-xl px-4 py-2.5 text-sm text-foreground outline-none resize-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">CTA Button Label</label>
          <input
            type="text"
            value={form.b2g1_cta_label}
            onChange={e => setForm(f => ({ ...f, b2g1_cta_label: e.target.value }))}
            className="w-full rounded-xl px-4 py-2.5 text-sm text-foreground outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
        </div>
      </div>

      {/* Tier Mapping */}
      <div className="rounded-2xl p-6 mb-6"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Tier Mapping</div>
            <div className="text-xs text-muted-foreground mt-1">When 2 accounts of "Buy Size" are purchased, 1 account of "Free Size" is added.</div>
          </div>
          <button onClick={addTier}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-primary transition-colors hover:bg-primary/10"
            style={{ border: '1px solid rgba(255,92,0,0.2)' }}>
            <Plus className="w-3.5 h-3.5" /> Add Tier
          </button>
        </div>

        <div className="space-y-2">
          {form.b2g1_tier_mapping.map((tier, idx) => (
            <div key={idx} className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2 flex-1">
                <span className="text-[10px] font-mono text-muted-foreground">2 ×</span>
                <span className="text-xs font-bold text-foreground">Buy Size:</span>
                <input
                  type="number"
                  step="1000"
                  value={tier.buy_size}
                  onChange={e => updateTier(idx, 'buy_size', e.target.value)}
                  className="w-28 rounded-lg px-3 py-1.5 text-xs text-foreground outline-none font-mono"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>
              <span className="text-primary text-sm">→</span>
              <div className="flex items-center gap-2 flex-1">
                <span className="text-[10px] font-mono text-primary font-bold">FREE:</span>
                <input
                  type="number"
                  step="1000"
                  value={tier.free_size}
                  onChange={e => updateTier(idx, 'free_size', e.target.value)}
                  className="w-28 rounded-lg px-3 py-1.5 text-xs text-foreground outline-none font-mono"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>
              <button onClick={() => removeTier(idx)}
                className="p-2 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/5 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-4 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        style={{ background: 'linear-gradient(90deg, #FF5C00, #FF7A2F)', boxShadow: '0 4px 24px rgba(255,92,0,0.35)' }}
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save Settings
      </button>
    </div>
  );
}