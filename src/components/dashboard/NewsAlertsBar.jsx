import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Newspaper, Radio } from 'lucide-react';
import { useNow, formatCountdown } from '@/hooks/useNow';
import { isRestrictedEvent, isInRestrictedWindow } from '@/lib/newsTradingConfig';

/**
 * NewsAlertsBar - horizontal ticker showing upcoming RESTRICTED (high-impact)
 * economic events with live countdowns. Positioned below the promo banner,
 * above the Active Accounts section. Clicking opens the Economic Calendar.
 */
function TickerItem({ event, now }) {
  const diff = new Date(event.event_time).getTime() - now;
  const countdown = formatCountdown(diff) || 'now';
  const inWindow = isInRestrictedWindow(event, now);

  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      {inWindow && <Radio className="w-3 h-3 text-red-400 animate-pulse" />}
      <span className="font-bold text-red-400">{event.currency}</span>
      <span className="text-white/70">{event.title}</span>
      <span className="text-white/30">in</span>
      <span className={`font-mono font-semibold ${inWindow ? 'text-red-400' : 'text-white'}`}>{countdown}</span>
    </span>
  );
}

export default function NewsAlertsBar({ onNavigate }) {
  const now = useNow(1000);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['restricted-events'],
    queryFn: async () => {
      const all = await base44.entities.EconomicEvent.list('event_time', 200);
      return (all || [])
        .filter(e => isRestrictedEvent(e) && new Date(e.event_time).getTime() > Date.now() - 600000)
        .sort((a, b) => new Date(a.event_time) - new Date(b.event_time))
        .slice(0, 20);
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });

  if (isLoading || events.length === 0) return null;

  const tickerItems = [...events, ...events];

  return (
    <button
      onClick={() => onNavigate?.('economic-calendar')}
      className="w-full group relative overflow-hidden rounded-xl transition-all hover:opacity-90"
      style={{ background: 'rgba(7,8,14,0.95)', border: '1px solid rgba(239,68,68,0.25)' }}
    >
      {/* Left label */}
      <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center gap-2 px-4"
        style={{ background: 'linear-gradient(90deg, rgba(7,8,14,0.98) 70%, rgba(7,8,14,0))', paddingRight: '24px' }}>
        <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#ef4444' }} />
        <Newspaper className="w-3.5 h-3.5 text-red-400" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-red-400 hidden sm:inline">News</span>
      </div>

      {/* Scrolling ticker */}
      <div className="flex items-center pl-20 pr-4 py-2.5 overflow-hidden">
        <div className="flex items-center gap-8 whitespace-nowrap" style={{ animation: 'xf-ticker-scroll 60s linear infinite' }}>
          {tickerItems.map((ev, i) => (
            <React.Fragment key={i}>
              <TickerItem event={ev} now={now} />
              {i < tickerItems.length - 1 && <span className="text-white/15">•</span>}
            </React.Fragment>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes xf-ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </button>
  );
}