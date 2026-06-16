import React from 'react';
import { Monitor, CheckCircle2, Apple, Smartphone, Globe, Monitor as MonitorIcon } from 'lucide-react';

const ACCENT = '#CCFF00';
const CARD_BG = '#0d2818';

function MT5Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,150,136,0.15)', border: '1px solid rgba(0,150,136,0.3)' }}>
        <span className="text-white font-black text-xs">5</span>
      </div>
      <span className="text-white font-bold text-sm">MetaTrader 5</span>
    </div>
  );
}

const PLATFORM_BUTTONS = [
  { icon: Apple, label: 'App Store', href: '#' },
  { icon: Smartphone, label: 'Google Play', href: '#' },
  { icon: Globe, label: 'Web App', href: '#' },
  { icon: MonitorIcon, label: 'Desktop', href: '#' },
];

export default function PlatformSelectCard({ selected = true, onSelect }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Monitor className="w-5 h-5 text-white" />
        <h3 className="text-lg font-bold text-white">Platform</h3>
      </div>

      <div className="rounded-2xl overflow-hidden relative"
        style={{
          background: 'radial-gradient(ellipse 400px 250px at 50% 50%, rgba(0,150,80,0.15) 0%, transparent 70%), #0d2818',
          border: `1px solid ${ACCENT}40`,
        }}>
        {/* Glow accent */}
        <div className="absolute top-0 left-0 w-full h-1" style={{ background: `linear-gradient(90deg, transparent, ${ACCENT}60, transparent)` }} />

        <div className="p-6">
          {/* MT5 Selected Indicator */}
          <div className="flex items-center gap-4 mb-5">
            <div className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(76,175,80,0.15)', border: '1px solid rgba(76,175,80,0.3)' }}>
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            </div>
            <MT5Logo />
          </div>

          {/* Download Buttons */}
          <div className="flex flex-wrap gap-2">
            {PLATFORM_BUTTONS.map(btn => {
              const Icon = btn.icon;
              return (
                <button key={btn.label}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all hover:brightness-125"
                  style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Icon className="w-4 h-4" />
                  {btn.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}