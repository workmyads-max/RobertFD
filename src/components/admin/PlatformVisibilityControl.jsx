import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Eye, EyeOff, RefreshCw, Save } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const FEATURE_LIST = [
  { key: 'analytics', label: 'Analytics', category: 'analytics', icon: '📈' },
  { key: 'market_news', label: 'Market News', category: 'analytics', icon: '📰' },
  { key: 'economic_calendar', label: 'Economic Calendar', category: 'analytics', icon: '📅' },
  { key: 'trading_journal', label: 'Trading Journal', category: 'analytics', icon: '📖' },
  { key: 'affiliate', label: 'Affiliate Program', category: 'user_management', icon: '🤝' },
  { key: 'certificates', label: 'Certificates', category: 'user_management', icon: '🏆' },
  { key: 'withdrawals', label: 'Withdrawals', category: 'user_management', icon: '💰' },
  { key: 'billing', label: 'Billing', category: 'user_management', icon: '💳' },
  { key: 'leaderboard', label: 'Leaderboard', category: 'analytics', icon: '🎯' },
  { key: 'support', label: 'Support', category: 'support', icon: '🆘' },
  { key: 'notifications', label: 'Notifications', category: 'system', icon: '🔔' },
  { key: 'kyc', label: 'KYC Verification', category: 'user_management', icon: '🪪' },
  { key: 'live_chat', label: 'Live Chat', category: 'support', icon: '💬' },
];

export default function PlatformVisibilityControl() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');

  const { data: settings = [] } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: () => base44.entities.PlatformSettings.list('-created_date', 100),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => {
      const existing = settings.find(s => s.setting_key === data.setting_key);
      if (existing) {
        return base44.entities.PlatformSettings.update(existing.id, { is_enabled: data.is_enabled });
      } else {
        return base44.entities.PlatformSettings.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
    },
  });

  const isEnabled = (key) => {
    const setting = settings.find(s => s.setting_key === key);
    return setting ? setting.is_enabled : true;
  };

  const toggleFeature = (key, label) => {
    const current = isEnabled(key);
    updateMutation.mutate({
      setting_key: key,
      label,
      is_enabled: !current,
      category: FEATURE_LIST.find(f => f.key === key)?.category || 'system',
    });
  };

  const getCategories = () => {
    if (filter === 'all') return FEATURE_LIST;
    return FEATURE_LIST.filter(f => f.category === filter);
  };

  const categories = ['all', 'analytics', 'user_management', 'support', 'system'];
  const categoryLabels = {
    all: 'All Features',
    analytics: 'Analytics',
    user_management: 'User Management',
    support: 'Support',
    system: 'System',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FF5C00, #ff8a3d)', boxShadow: '0 0 20px rgba(255,92,0,0.4)' }}>
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-black text-white">Platform Visibility Control</h2>
          </div>
          <p className="text-sm text-slate-400 mt-2">Control feature visibility across the entire platform</p>
        </div>
      </motion.div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        {categories.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              filter === cat
                ? 'text-white'
                : 'text-slate-400 hover:text-slate-300'
            }`}
            style={filter === cat ? {
              background: 'linear-gradient(135deg, rgba(255,92,0,0.3), rgba(139,92,246,0.2))',
              border: '1px solid rgba(255,92,0,0.4)',
              boxShadow: '0 0 12px rgba(255,92,0,0.2)',
            } : { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            {categoryLabels[cat]}
          </button>
        ))}
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence>
          {getCategories().map((feature, idx) => {
            const enabled = isEnabled(feature.key);
            return (
              <motion.div
                key={feature.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => toggleFeature(feature.key, feature.label)}
                className="group cursor-pointer p-4 rounded-xl transition-all hover:scale-102"
                style={{
                  background: enabled
                    ? 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.05))'
                    : 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.05))',
                  border: enabled
                    ? '1px solid rgba(16,185,129,0.3)'
                    : '1px solid rgba(239,68,68,0.3)',
                  boxShadow: enabled
                    ? '0 0 20px rgba(16,185,129,0.15)'
                    : '0 0 20px rgba(239,68,68,0.1)',
                }}>
                
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{feature.icon}</span>
                    <div>
                      <div className="text-sm font-bold text-white">{feature.label}</div>
                      <div className="text-xs text-slate-400 mt-0.5 capitalize">{feature.category.replace('_', ' ')}</div>
                    </div>
                  </div>
                  
                  {/* Toggle Switch */}
                  <div className="ml-auto">
                    <motion.div
                      animate={{
                        background: enabled
                          ? 'linear-gradient(135deg, #10b981, #059669)'
                          : 'linear-gradient(135deg, #ef4444, #dc2626)',
                      }}
                      className="relative w-12 h-7 rounded-full flex items-center px-0.5 transition-all"
                      style={{
                        boxShadow: enabled
                          ? '0 0 12px rgba(16,185,129,0.4)'
                          : '0 0 12px rgba(239,68,68,0.3)',
                      }}>
                      <motion.div
                        animate={{ x: enabled ? 20 : 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                        {enabled ? (
                          <Eye className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <EyeOff className="w-3 h-3 text-red-600" />
                        )}
                      </motion.div>
                    </motion.div>
                  </div>
                </div>

                {/* Status indicator */}
                <div className="mt-3 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full animate-pulse ${enabled ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  <span className={`text-[10px] font-mono font-bold ${enabled ? 'text-emerald-400' : 'text-red-400'}`}>
                    {enabled ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Info Box */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} delay={0.3}
        className="p-4 rounded-xl border" style={{ background: 'rgba(99,102,241,0.08)', borderColor: 'rgba(99,102,241,0.3)' }}>
        <div className="flex gap-3">
          <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0 bg-indigo-400" />
          <div className="text-xs text-indigo-300">
            <p className="font-bold mb-1">Changes apply instantly across the platform.</p>
            <p>Disabled features automatically disappear from user dashboards and become inaccessible. No code restart required.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}