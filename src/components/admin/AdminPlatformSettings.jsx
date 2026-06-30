import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Eye, EyeOff, Save, Plus, Edit2, Trash2, AlertCircle, ToggleLeft, ToggleRight, UserPlus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const PLATFORMS = [
  { id: 'match_trader', name: 'Match Trader', icon: '📊', color: '#10b981' },
  { id: 'mt5', name: 'MetaTrader 5', icon: '📈', color: '#0066CC' },
  { id: 'tradelocker', name: 'TradeLocker', icon: '🔓', color: '#00A86B' },
];

const TRADEABLE_PLATFORMS = [
  { key: 'match_trader', label: 'Match Trader', icon: '📊', color: '#10b981' },
  { key: 'xtrading', label: 'XTrading', icon: '⚡', color: '#FF5C00' },
  { key: 'mt5', label: 'MetaTrader 5', icon: '📈', color: '#0066CC' },
  { key: 'tradelocker', label: 'TradeLocker', icon: '🔓', color: '#00A86B' },
];

function AuthSettingsPanel() {
  const qc = useQueryClient();

  const { data: settings = [] } = useQuery({
    queryKey: ['platform-settings-auth'],
    queryFn: () => base44.entities.PlatformSettings.filter({ category: 'auth' }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ key, label, enabled }) => {
      const existing = settings.find(s => s.setting_key === key);
      if (existing) {
        return base44.entities.PlatformSettings.update(existing.id, { is_enabled: enabled });
      }
      return base44.entities.PlatformSettings.create({ setting_key: key, label, category: 'auth', is_enabled: enabled });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['platform-settings-auth'] }),
  });

  const getSetting = (key, defaultVal = true) => {
    const s = settings.find(p => p.setting_key === key);
    return s ? s.is_enabled !== false : defaultVal;
  };

  const registrationEnabled = getSetting('registration_enabled', true);

  return (
    <div className="rounded-2xl p-5 mb-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <h3 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
        <UserPlus className="w-4 h-4 text-primary" /> Authentication Settings
      </h3>
      <p className="text-[11px] font-mono text-muted-foreground mb-4">Control platform registration and access settings.</p>
      <div className="flex items-center justify-between px-4 py-3 rounded-xl max-w-sm"
        style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${registrationEnabled ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.07)'}` }}>
        <div className="flex items-center gap-3">
          <span className="text-xl">👤</span>
          <div>
            <div className="text-xs font-bold text-foreground">New Registrations</div>
            <div className="text-[10px] font-mono" style={{ color: registrationEnabled ? '#10b981' : '#666' }}>
              {registrationEnabled ? 'Open - Anyone can register' : 'Closed - Registrations disabled'}
            </div>
          </div>
        </div>
        <button
          onClick={() => toggleMutation.mutate({ key: 'registration_enabled', label: 'Registration Enabled', enabled: !registrationEnabled })}
          disabled={toggleMutation.isPending}
          className="transition-all ml-4"
        >
          {registrationEnabled
            ? <ToggleRight className="w-8 h-8 text-emerald-400" />
            : <ToggleLeft className="w-8 h-8 text-muted-foreground" />}
        </button>
      </div>
      {!registrationEnabled && (
        <p className="text-xs text-yellow-400 mt-2 ml-1">⚠️ New users visiting /register will see: "Registrations are currently disabled."</p>
      )}
    </div>
  );
}

export default function AdminPlatformSettings() {
  const [selectedPlatform, setSelectedPlatform] = useState('mt5');
  const [editingId, setEditingId] = useState(null);
  const [showSecrets, setShowSecrets] = useState({});
  const [formData, setFormData] = useState({});
  const qc = useQueryClient();

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['trading-providers'],
    queryFn: () => base44.entities.TradingPlatformProvider.list('-created_date', 50),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TradingPlatformProvider.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trading-providers'] });
      setFormData({});
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TradingPlatformProvider.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trading-providers'] });
      setEditingId(null);
      setFormData({});
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TradingPlatformProvider.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trading-providers'] }),
  });

  const selectedProviders = providers.filter(p => p.platform_name === selectedPlatform);
  const platformConfig = PLATFORMS.find(p => p.id === selectedPlatform);

  // Platform visibility toggles via PlatformSettings entity
  const { data: platformSettings = [] } = useQuery({
    queryKey: ['platform-settings-trading'],
    queryFn: () => base44.entities.PlatformSettings.filter({ category: 'trading' }),
  });

  const togglePlatformMutation = useMutation({
    mutationFn: async ({ key, enabled }) => {
      const existing = platformSettings.find(s => s.setting_key === key);
      if (existing) {
        return base44.entities.PlatformSettings.update(existing.id, { is_enabled: enabled });
      } else {
        return base44.entities.PlatformSettings.create({ setting_key: key, label: key, category: 'trading', is_enabled: enabled });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['platform-settings-trading'] }),
  });

  const isPlatformEnabled = (key) => {
    const s = platformSettings.find(p => p.setting_key === key);
    return s ? s.is_enabled !== false : true; // default enabled
  };

  const handleSubmit = () => {
    if (!formData.api_key) return alert('API Key required');
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate({ ...formData, platform_name: selectedPlatform });
    }
  };

  const handleEdit = (provider) => {
    setEditingId(provider.id);
    setFormData(provider);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-4xl font-black text-foreground flex items-center gap-3">
          <Settings className="w-6 h-6 text-primary" /> Trading Platform API
        </h1>
        <p className="text-base text-muted-foreground font-mono mt-1">Configure MT5 and TradeLocker API credentials</p>
      </div>

      {/* Authentication Settings */}
      <AuthSettingsPanel />

      {/* Platform Availability Toggles */}
      <div className="rounded-2xl p-5 mb-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
          <ToggleRight className="w-4 h-4 text-primary" /> Platform Availability for Traders
        </h3>
        <p className="text-[11px] font-mono text-muted-foreground mb-4">Enable or disable platforms in the checkout and marketplace.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {TRADEABLE_PLATFORMS.map(p => {
            const enabled = isPlatformEnabled(p.key);
            return (
              <div key={p.key} className="flex items-center justify-between px-4 py-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${enabled ? p.color + '30' : 'rgba(255,255,255,0.07)'}` }}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{p.icon}</span>
                  <div>
                    <div className="text-xs font-bold text-foreground">{p.label}</div>
                    <div className="text-[10px] font-mono" style={{ color: enabled ? p.color : '#666' }}>{enabled ? 'Available' : 'Disabled'}</div>
                  </div>
                </div>
                <button
                  onClick={() => togglePlatformMutation.mutate({ key: p.key, enabled: !enabled })}
                  disabled={togglePlatformMutation.isPending}
                  className="transition-all"
                >
                  {enabled
                    ? <ToggleRight className="w-8 h-8" style={{ color: p.color }} />
                    : <ToggleLeft className="w-8 h-8 text-muted-foreground" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Platform tabs */}
      <div className="flex gap-3 mb-6">
        {PLATFORMS.map(p => (
          <motion.button key={p.id} onClick={() => { setSelectedPlatform(p.id); setEditingId(null); setFormData({}); }}
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all"
            style={{
              background: selectedPlatform === p.id ? 'rgba(255,92,0,0.15)' : 'rgba(255,255,255,0.04)',
              border: `2px solid ${selectedPlatform === p.id ? 'rgba(255,92,0,0.4)' : 'rgba(255,255,255,0.08)'}`,
              color: selectedPlatform === p.id ? '#FF5C00' : 'hsl(var(--muted-foreground))',
            }}>
            <span className="text-lg">{p.icon}</span>
            {p.name}
          </motion.button>
        ))}
      </div>

      {/* Form */}
      <motion.div className="rounded-2xl p-6 mb-6 border"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}>
        <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
          {editingId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {editingId ? 'Edit Provider' : 'Add New Provider'}
        </h3>

        <div className="grid grid-cols-2 gap-4 mb-4">
          {[
            { label: 'API Key', key: 'api_key', secret: true },
            { label: 'API Secret', key: 'api_secret', secret: true },
            { label: 'Server URL', key: 'server_url', placeholder: 'https://api.yourprovider.com' },
            { label: 'MT5 Server Name', key: 'server_name', placeholder: 'YourBroker-Live' },
            { label: 'Demo API Key', key: 'demo_api_key', secret: true },
            { label: 'Demo API Secret', key: 'demo_api_secret', secret: true },
            { label: 'Demo Server URL', key: 'demo_server_url', placeholder: 'https://demo-api.example.com' },
          ].map(({ label, key, secret, placeholder }) => (
            <div key={key}>
              <label className="text-xs font-mono text-muted-foreground mb-1.5 block uppercase">{label}</label>
              <div className="relative">
                <input
                  type={secret && !showSecrets[key] ? 'password' : 'text'}
                  value={formData[key] || ''}
                  onChange={e => setFormData(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full rounded-xl px-4 py-2.5 text-sm text-foreground outline-none pr-10"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                {secret && (
                  <button
                    onClick={() => setShowSecrets(s => ({ ...s, [key]: !s[key] }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showSecrets[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mb-4">
          <label className="text-xs font-mono text-muted-foreground mb-1.5 block uppercase">Notes</label>
          <textarea
            value={formData.notes || ''}
            onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))}
            placeholder="Internal notes..."
            className="w-full rounded-xl px-4 py-2.5 text-sm text-foreground outline-none resize-none"
            rows="2"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
        </div>

        <div className="flex gap-3">
          <button onClick={handleSubmit}
            disabled={createMutation.isPending || updateMutation.isPending}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
            style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)' }}>
            <Save className="w-4 h-4" /> {editingId ? 'Update' : 'Add'} Provider
          </button>
          {editingId && (
            <button onClick={() => { setEditingId(null); setFormData({}); }}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
              Cancel
            </button>
          )}
        </div>
      </motion.div>

      {/* List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="py-12 text-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : selectedProviders.length === 0 ? (
          <div className="rounded-2xl p-8 text-center border"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <AlertCircle className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">No {platformConfig?.name} providers configured yet</p>
          </div>
        ) : (
          selectedProviders.map((provider, idx) => (
            <motion.div key={provider.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="rounded-xl p-4 border"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold ${provider.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {provider.is_active ? '🟢 Active' : '🔴 Inactive'}
                    </span>
                    {provider.server_url && <span className="text-xs text-muted-foreground/70">{provider.server_url}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">{provider.notes || 'No notes'}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(provider)}
                    className="p-2 rounded-lg hover:bg-primary/20 text-primary transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteMutation.mutate(provider.id)}
                    className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}