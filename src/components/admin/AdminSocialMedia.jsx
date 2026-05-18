import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Share2, Save, CheckCircle, ToggleLeft, ToggleRight, ExternalLink } from 'lucide-react';

const PLATFORMS = [
  {
    key: 'discord', label: 'Discord', color: '#5865F2',
    urlKey: 'discord_url', enableKey: 'discord_enabled',
    placeholder: 'https://discord.gg/yourserver',
    icon: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.11 18.1.127 18.11a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
      </svg>
    ),
  },
  {
    key: 'instagram', label: 'Instagram', color: '#E1306C',
    urlKey: 'instagram_url', enableKey: 'instagram_enabled',
    placeholder: 'https://instagram.com/yourhandle',
    icon: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
  },
  {
    key: 'twitter', label: 'X / Twitter', color: '#FFFFFF',
    urlKey: 'twitter_url', enableKey: 'twitter_enabled',
    placeholder: 'https://x.com/yourhandle',
    icon: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
  {
    key: 'youtube', label: 'YouTube', color: '#FF0000',
    urlKey: 'youtube_url', enableKey: 'youtube_enabled',
    placeholder: 'https://youtube.com/@yourchannel',
    icon: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
  },
];

export default function AdminSocialMedia() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    discord_url: '', discord_enabled: true,
    instagram_url: '', instagram_enabled: true,
    twitter_url: '', twitter_enabled: true,
    youtube_url: '', youtube_enabled: true,
  });
  const [saved, setSaved] = useState(false);

  const { data: settingsList = [], isLoading } = useQuery({
    queryKey: ['social-media-settings'],
    queryFn: () => base44.entities.SocialMediaSettings.filter({ setting_key: 'global' }),
  });

  useEffect(() => {
    if (settingsList[0]) {
      const s = settingsList[0];
      setForm({
        discord_url: s.discord_url || '',
        discord_enabled: s.discord_enabled !== false,
        instagram_url: s.instagram_url || '',
        instagram_enabled: s.instagram_enabled !== false,
        twitter_url: s.twitter_url || '',
        twitter_enabled: s.twitter_enabled !== false,
        youtube_url: s.youtube_url || '',
        youtube_enabled: s.youtube_enabled !== false,
      });
    }
  }, [settingsList]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const existing = settingsList[0];
      if (existing) {
        return base44.entities.SocialMediaSettings.update(existing.id, form);
      } else {
        return base44.entities.SocialMediaSettings.create({ setting_key: 'global', ...form });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-media-settings'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
            <Share2 className="w-6 h-6 text-primary" /> Social Media Settings
          </h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">Manage community links shown on the trader overview</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-black transition-all"
          style={{ background: saved ? '#10b981' : 'linear-gradient(135deg, #FF5C00, #FF8A3D)', boxShadow: saved ? '0 4px 16px rgba(16,185,129,0.3)' : '0 4px 16px rgba(255,92,0,0.3)' }}>
          {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved!' : 'Save Changes'}
        </motion.button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {PLATFORMS.map((platform, i) => {
          const PlatformIcon = platform.icon;
          const isEnabled = form[platform.enableKey];
          return (
            <motion.div
              key={platform.key}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="rounded-2xl p-5"
              style={{
                background: isEnabled ? `${platform.color}06` : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isEnabled ? platform.color + '25' : 'rgba(255,255,255,0.07)'}`,
                transition: 'all 0.2s',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: isEnabled ? `${platform.color}18` : 'rgba(255,255,255,0.05)', color: isEnabled ? platform.color : 'rgba(255,255,255,0.3)' }}>
                    <PlatformIcon />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">{platform.label}</div>
                    <div className="text-[10px] font-mono text-muted-foreground">
                      {isEnabled ? 'Visible to traders' : 'Hidden'}
                    </div>
                  </div>
                </div>
                {/* Toggle */}
                <button
                  onClick={() => setForm(f => ({ ...f, [platform.enableKey]: !f[platform.enableKey] }))}
                  className="transition-all"
                  title={isEnabled ? 'Disable' : 'Enable'}>
                  {isEnabled
                    ? <ToggleRight className="w-7 h-7" style={{ color: platform.color }} />
                    : <ToggleLeft className="w-7 h-7 text-muted-foreground" />}
                </button>
              </div>

              {/* URL input */}
              <div className="relative">
                <input
                  type="url"
                  value={form[platform.urlKey]}
                  onChange={e => setForm(f => ({ ...f, [platform.urlKey]: e.target.value }))}
                  placeholder={platform.placeholder}
                  className="w-full rounded-xl px-4 py-2.5 text-sm font-mono text-foreground outline-none transition-all pr-10"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${isEnabled && form[platform.urlKey] ? platform.color + '40' : 'rgba(255,255,255,0.1)'}`,
                  }}
                />
                {form[platform.urlKey] && (
                  <a href={form[platform.urlKey]} target="_blank" rel="noopener noreferrer"
                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-80 transition-opacity">
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                  </a>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Preview note */}
      <div className="mt-5 rounded-xl px-4 py-3 flex items-center gap-3"
        style={{ background: 'rgba(255,92,0,0.05)', border: '1px solid rgba(255,92,0,0.15)' }}>
        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse flex-shrink-0" />
        <span className="text-xs font-mono text-muted-foreground">
          Changes appear instantly on the trader Overview page after saving. Only enabled platforms with a URL are shown.
        </span>
      </div>
    </div>
  );
}