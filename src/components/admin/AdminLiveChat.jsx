import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Settings, Save, RefreshCw, Bell, Mail, Phone, Globe } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export default function AdminLiveChat() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState({
    discord_url: '',
    discord_enabled: true,
    instagram_url: '',
    instagram_enabled: true,
    twitter_url: '',
    twitter_enabled: true,
    youtube_url: '',
    youtube_enabled: true,
    support_email: 'support@robertfunds.com',
    support_phone: '+971 4 123 4567',
    auto_response_enabled: true,
    business_hours: '24/7',
  });

  // Fetch current settings
  const { data: currentSettings, isLoading } = useQuery({
    queryKey: ['social-media-settings'],
    queryFn: () => base44.entities.SocialMediaSettings.filter({ setting_key: 'global' }).then(data => data[0]),
    retry: 1,
  });

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const settingData = {
        setting_key: 'global',
        discord_url: data.discord_url || '',
        discord_enabled: data.discord_enabled ?? true,
        instagram_url: data.instagram_url || '',
        instagram_enabled: data.instagram_enabled ?? true,
        twitter_url: data.twitter_url || '',
        twitter_enabled: data.twitter_enabled ?? true,
        youtube_url: data.youtube_url || '',
        youtube_enabled: data.youtube_enabled ?? true,
      };
      if (currentSettings?.id) {
        return base44.entities.SocialMediaSettings.update(currentSettings.id, settingData);
      }
      return base44.entities.SocialMediaSettings.create(settingData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-media-settings'] });
    },
  });

  useEffect(() => {
    if (currentSettings) {
      setSettings(prev => ({ ...prev, ...currentSettings }));
    }
  }, [currentSettings]);

  const handleSave = () => {
    updateMutation.mutate(settings);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" 
            style={{ background: 'rgba(255,92,0,0.12)', border: '1px solid rgba(255,92,0,0.2)' }}>
            <MessageCircle className="w-5 h-5 text-primary" />
          </div>
          Live Chat Settings
        </h1>
        <p className="text-sm text-white/30 font-mono mt-1">Configure live chat widget and support channels</p>
      </div>

      <div className="space-y-4">
        {/* Support Contact Info */}
        <div className="rounded-2xl p-6" 
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Support Contact Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-mono text-white/40 mb-1.5 block uppercase">Support Email</label>
              <input
                value={settings.support_email}
                onChange={e => setSettings(s => ({ ...s, support_email: e.target.value }))}
                className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
              />
            </div>
            <div>
              <label className="text-[11px] font-mono text-white/40 mb-1.5 block uppercase">Support Phone</label>
              <input
                value={settings.support_phone}
                onChange={e => setSettings(s => ({ ...s, support_phone: e.target.value }))}
                className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
              />
            </div>
            <div>
              <label className="text-[11px] font-mono text-white/40 mb-1.5 block uppercase">Business Hours</label>
              <input
                value={settings.business_hours}
                onChange={e => setSettings(s => ({ ...s, business_hours: e.target.value }))}
                className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
              />
            </div>
          </div>
        </div>

        {/* Social Media Channels */}
        <div className="rounded-2xl p-6" 
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Social Media Channels
          </h3>
          <div className="space-y-4">
            {[
              { key: 'discord', label: 'Discord', icon: '🎮' },
              { key: 'instagram', label: 'Instagram', icon: '📸' },
              { key: 'twitter', label: 'Twitter/X', icon: '🐦' },
              { key: 'youtube', label: 'YouTube', icon: '📺' },
            ].map(social => (
              <div key={social.key} className="flex items-center gap-4 p-4 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-2xl">{social.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-semibold text-white">{social.label}</span>
                    <label className="flex items-center gap-2 text-xs text-white/50">
                      <input
                        type="checkbox"
                        checked={settings[`${social.key}_enabled`]}
                        onChange={e => setSettings(s => ({ ...s, [`${social.key}_enabled`]: e.target.checked }))}
                        className="w-4 h-4"
                      />
                      Enabled
                    </label>
                  </div>
                  <input
                    value={settings[`${social.key}_url`] || ''}
                    onChange={e => setSettings(s => ({ ...s, [`${social.key}_url`]: e.target.value }))}
                    placeholder={`Enter ${social.label} URL`}
                    className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Auto Response */}
        <div className="rounded-2xl p-6" 
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Auto Response Settings
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-white">Enable Auto-Response</div>
              <div className="text-xs text-white/40 mt-1">Automatically greet visitors when chat opens</div>
            </div>
            <button
              onClick={() => setSettings(s => ({ ...s, auto_response_enabled: !s.auto_response_enabled }))}
              className={`w-14 h-7 rounded-full transition-all relative ${
                settings.auto_response_enabled ? 'bg-primary' : 'bg-white/10'
              }`}
            >
              <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all ${
                settings.auto_response_enabled ? 'left-8' : 'left-1'
              }`} />
            </button>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50"
          style={{ background: 'linear-gradient(90deg, #FF5C00, #FF7A2F)' }}>
          {updateMutation.isPending ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}