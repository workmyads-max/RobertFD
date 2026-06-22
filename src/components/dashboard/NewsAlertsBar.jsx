import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Newspaper } from 'lucide-react';

/**
 * NewsAlertsBar — horizontal ticker bar showing upcoming High-impact economic events.
 * Positioned below the promo banner and above the Active Accounts section.
 * Clicking the bar navigates to the Economic Calendar page.
 */
function useCountdown(targetTime) {
  const [text, setText] = useState('');

  useEffect(() => {
    if (!targetTime) return;
    const target = new Date(targetTime).getTime();

    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) { setText('now'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (h > 0) setText(`${h}h ${m}m`);
      else if (m > 0) setText(`${m}m ${s}s`);
      else setText(`${s}s`);
    };

    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [targetTime]);

  return text;
}

function TickerItem({ event }) {
  const countdown = useCountdown(event.event_time);
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <span className="font-bold text-[#FF7A00]">{event.currency}</span>
      <span className="text-white/70">{event.title}</span>
      <span className="text-white/30">in</span>
      <span className="font-mono font-semibold text-white">{countdown}</span>
    </span>
  );
}

export default function NewsAlertsBar({ onNavigate }) {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['high-impact-events'],
    queryFn: async () => {
      const all = await base44.entities.EconomicEvent.list('event_time', 200);
      const now = Date.now();
      return (all || [])
        .filter(e => e.impact === 'High' && new Date(e.event_time).getTime() > now)
        .sort((a, b) => new Date(a.event_time) - new Date(b.event_time))
        .slice(0, 20);
    },
    refetchInterval: 60000, // refresh every minute
    staleTime: 30000,
  });

  // Hide bar entirely while loading or if no upcoming high-impact events
  if (isLoading || events.length === 0) return null;

  // Duplicate events for seamless scroll loop
  const tickerItems = [...events, ...events];

  return (
    <button
      onClick={() => onNavigate?.('economic-calendar')}
      className="w-full group relative overflow-hidden rounded-xl transition-all hover:opacity-90"
      style={{
        background: 'rgba(7,8,14,0.95)',
        border: '1px solid rgba(255,92,0,0.25)',
      }}
    >
      {/* Left label — non-scrolling */}
      <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center gap-2 px-4"
        style={{
          background: 'linear-gradient(90deg, rgba(7,8,14,0.98) 70%, rgba(7,8,14,0))',
          paddingRight: '24px',
        }}>
        <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#FF5C00' }} />
        <Newspaper className="w-3.5 h-3.5 text-[#FF7A00]" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF7A00] hidden sm:inline">News</span>
      </div>

      {/* Scrolling ticker */}
      <div className="flex items-center pl-20 pr-4 py-2.5 overflow-hidden">
        <div
          className="flex items-center gap-8 whitespace-nowrap"
          style={{
            animation: 'xf-ticker-scroll 60s linear infinite',
          }}
        >
          {tickerItems.map((ev, i) => (
            <React.Fragment key={i}>
              <TickerItem event={ev} />
              {i < tickerItems.length - 1 && (
                <span className="text-white/15">•</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes xf-ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </button>
  );
}