import React from 'react';
import { formatCountdown } from '@/hooks/useNow';

/**
 * Countdown — live ticking countdown to a target time.
 * Shows "HH:MM:SS" format, or "Expired" in grey for past events.
 * Receives `now` from parent (single timer) for performance.
 */
export default function Countdown({ targetTime, now }) {
  if (!targetTime) return <span className="text-xs text-white/20">—</span>;

  const diff = new Date(targetTime).getTime() - now;
  const text = formatCountdown(diff);

  if (!text) {
    return <span className="text-[11px] font-mono text-white/25">Expired</span>;
  }

  return (
    <span className="text-[11px] font-mono font-semibold text-white/50 tabular">{text}</span>
  );
}