import React from 'react';
import { Monitor, CheckCircle2, Apple, Smartphone, Globe, MonitorSmartphone } from 'lucide-react';

const MT5_LOGO = 'https://upload.wikimedia.org/wikipedia/commons/f/fa/MetaTrader_5_Clear_240px.png';
const MT5_LOGO_FALLBACK = 'https://commons.wikimedia.org/wiki/Special:FilePath/MetaTrader_5_Clear_240px.png';

const PLATFORM_BUTTONS = [
  { icon: Apple, label: 'App Store', href: 'https://www.metatrader5.com/en/mobile-trading/iphone' },
  { icon: Smartphone, label: 'Google Play', href: 'https://play.google.com/store/apps/details?id=net.metaquotes.metatrader5' },
  { icon: Globe, label: 'Web Terminal', href: 'https://trade.mql5.com' },
  { icon: MonitorSmartphone, label: 'Desktop', href: 'https://www.metatrader5.com/en/download' },
];

export default function PlatformSelectCard({ selected = true, onSelect }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,92,0,0.1)', border: '1px solid rgba(255,92,0,0.2)' }}>
          <Monitor className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground leading-none">Platform</h3>
          <p className="text-[11px] text-muted-foreground mt-1">Choose your trading environment</p>
        </div>
      </div>

      {/* Selection card */}
      <div className="rounded-2xl overflow-hidden relative"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
        {/* Top accent line */}
        <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, hsl(var(--primary)), transparent)' }} />

        <div className="p-6">
          {/* Selected indicator */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)' }}>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <img
              src={MT5_LOGO}
              alt="MetaTrader 5"
              className="w-12 h-12 object-contain flex-shrink-0"
              onError={(e) => { e.target.onerror = null; e.target.src = MT5_LOGO_FALLBACK; }}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-foreground">MetaTrader 5</span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider"
                  style={{ background: 'rgba(255,92,0,0.12)', color: 'hsl(var(--primary))', border: '1px solid rgba(255,92,0,0.25)' }}>
                  Selected
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Powered by MetaQuotes Software Corp.</p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px w-full mb-5" style={{ background: 'hsl(var(--border))' }} />

          {/* Download label */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Available on</span>
            <span className="text-[11px] text-muted-foreground">All devices</span>
          </div>

          {/* Download buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PLATFORM_BUTTONS.map(btn => {
              const Icon = btn.icon;
              return (
                <a key={btn.label} href={btn.href} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all hover:border-primary/40"
                  style={{ background: 'rgba(255,255,255,0.03)', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))' }}>
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  {btn.label}
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}