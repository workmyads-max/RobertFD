import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// SVG icons for each platform
const DiscordIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.11 18.1.127 18.11a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

const InstagramIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const XIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const YouTubeIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const SOCIAL_CONFIG = [
  { key: 'discord',   Icon: DiscordIcon,   label: 'Discord',   color: '#5865F2', glow: 'rgba(88,101,242,0.4)',  urlKey: 'discord_url',   enableKey: 'discord_enabled'   },
  { key: 'instagram', Icon: InstagramIcon, label: 'Instagram', color: '#E1306C', glow: 'rgba(225,48,108,0.4)',  urlKey: 'instagram_url', enableKey: 'instagram_enabled' },
  { key: 'twitter',   Icon: XIcon,         label: 'X',         color: '#FFFFFF', glow: 'rgba(255,255,255,0.3)', urlKey: 'twitter_url',   enableKey: 'twitter_enabled'   },
  { key: 'youtube',   Icon: YouTubeIcon,   label: 'YouTube',   color: '#FF0000', glow: 'rgba(255,0,0,0.4)',     urlKey: 'youtube_url',   enableKey: 'youtube_enabled'   },
];

export default function SocialMediaWidget() {
  const { data: settingsList = [] } = useQuery({
    queryKey: ['social-media-settings'],
    queryFn: () => base44.entities.SocialMediaSettings.filter({ setting_key: 'global' }),
    refetchInterval: 60000,
  });

  const settings = settingsList[0] || null;

  // If no settings record exists yet, show all platforms as placeholder (no URLs = no links shown)
  // If settings exist, filter by enabled + has URL
  const activePlatforms = settings
    ? SOCIAL_CONFIG.filter(p => {
        const url = settings[p.urlKey];
        const enabled = settings[p.enableKey] !== false;
        return enabled && url && url.trim() !== '';
      })
    : [];

  if (activePlatforms.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl p-4"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Community</span>
        </div>
        <span className="text-[9px] font-mono text-muted-foreground/50">Join Us</span>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {activePlatforms.map((platform, i) => {
          const { Icon, label, color, glow, urlKey } = platform;
          const url = settings[urlKey];
          return (
            <motion.a
              key={platform.key}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.06, type: 'spring', stiffness: 300 }}
              whileHover={{ scale: 1.15, y: -3 }}
              whileTap={{ scale: 0.92 }}
              title={label}
              className="relative group flex items-center gap-2 px-3 py-2 rounded-xl transition-all cursor-pointer"
              style={{
                background: `${color}10`,
                border: `1px solid ${color}25`,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = `${color}20`;
                e.currentTarget.style.border = `1px solid ${color}50`;
                e.currentTarget.style.boxShadow = `0 0 16px ${glow}, 0 4px 24px ${glow}`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = `${color}10`;
                e.currentTarget.style.border = `1px solid ${color}25`;
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <span style={{ color }}><Icon size={16} /></span>
              <span className="text-[11px] font-semibold hidden sm:block" style={{ color }}>{label}</span>
              {/* Glow pulse on hover */}
              <motion.div
                className="absolute inset-0 rounded-xl pointer-events-none opacity-0 group-hover:opacity-100"
                style={{ background: `radial-gradient(ellipse at center, ${glow} 0%, transparent 70%)` }}
                transition={{ duration: 0.2 }}
              />
            </motion.a>
          );
        })}
      </div>
    </motion.div>
  );
}