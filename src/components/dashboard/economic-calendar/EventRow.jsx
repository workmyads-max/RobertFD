import React from 'react';
import { AlertTriangle, Radio } from 'lucide-react';
import ImpactBars from './ImpactBars';
import CurrencyFlag from './CurrencyFlag';
import Countdown from './Countdown';
import AddToCalendarButton from './AddToCalendarButton';
import { isRestrictedEvent, isInRestrictedWindow } from '@/lib/newsTradingConfig';

/**
 * EventRow - one economic event row in the FTMO-style table.
 *
 * Restricted (High-impact) events get:
 *   - Red left border
 *   - Subtle red background tint
 *   - "Restricted event" tag with warning icon
 *   - Pulsing "RESTRICTED WINDOW ACTIVE" state when inside the blackout window
 */
export default function EventRow({ event, now }) {
  const restricted = isRestrictedEvent(event);
  const inWindow = restricted && isInRestrictedWindow(event, now);
  const expired = new Date(event.event_time).getTime() < now;

  const localTime = new Date(event.event_time).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
  const localDate = new Date(event.event_time).toLocaleDateString('en-US', {
    day: '2-digit', month: 'short',
  });

  return (
    <div
      className="flex items-stretch border-b last:border-0 transition-colors group"
      style={{
        borderColor: 'rgba(255,255,255,0.04)',
        background: inWindow ? 'rgba(239,68,68,0.08)' : restricted ? 'rgba(239,68,68,0.03)' : 'transparent',
      }}
    >
      {/* Red left border for restricted events / pulsing for active window */}
      <div
        className="w-[3px] flex-shrink-0"
        style={{
          background: inWindow ? '#ef4444' : restricted ? '#ef4444' : 'transparent',
          opacity: inWindow ? 1 : restricted ? 0.6 : 0,
          animation: inWindow ? 'xf-restricted-pulse 1.2s ease-in-out infinite' : 'none',
        }}
      />

      {/* Description */}
      <div className="flex-1 min-w-0 px-4 py-3 flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-1">
          <ImpactBars impact={event.impact} />
          <span className="text-xs font-medium text-white/85 truncate">{event.title}</span>
        </div>
        {restricted && (
          <div className="flex items-center gap-1.5 mt-1">
            {inWindow ? (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider text-white"
                style={{
                  background: '#ef4444',
                  animation: 'xf-restricted-pulse 1.2s ease-in-out infinite',
                }}
              >
                <Radio className="w-2.5 h-2.5" /> Restricted Window Active
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider text-red-400"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}
              >
                <AlertTriangle className="w-2.5 h-2.5" /> Restricted Event
              </span>
            )}
          </div>
        )}
      </div>

      {/* Instrument */}
      <div className="w-24 flex-shrink-0 px-3 py-3 flex items-center">
        <CurrencyFlag currency={event.currency} />
      </div>

      {/* Date + Countdown */}
      <div className="w-28 flex-shrink-0 px-3 py-3 flex flex-col justify-center">
        <div className="text-[11px] font-mono text-white/60">{localDate}</div>
        <div className="text-xs font-bold text-white/80">{localTime}</div>
        <div className="mt-0.5">
          {expired ? (
            <span className="text-[10px] font-mono text-white/20">Expired</span>
          ) : (
            <Countdown targetTime={event.event_time} now={now} />
          )}
        </div>
      </div>

      {/* Actual */}
      <div className="w-16 flex-shrink-0 px-2 py-3 flex items-center justify-center">
        <span className="text-xs font-mono text-white/40">-</span>
      </div>

      {/* Forecast */}
      <div className="w-16 flex-shrink-0 px-2 py-3 flex items-center justify-center">
        <span className="text-xs font-mono text-white/60">{event.forecast || '-'}</span>
      </div>

      {/* Previous */}
      <div className="w-16 flex-shrink-0 px-2 py-3 flex items-center justify-center">
        <span className="text-xs font-mono text-white/60">{event.previous || '-'}</span>
      </div>

      {/* Actions */}
      <div className="w-12 flex-shrink-0 px-2 py-3 flex items-center justify-center">
        <AddToCalendarButton event={event} />
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes xf-restricted-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}