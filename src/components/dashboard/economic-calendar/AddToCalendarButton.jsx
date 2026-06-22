import React from 'react';
import { CalendarPlus } from 'lucide-react';

/**
 * AddToCalendarButton — generates a Google Calendar event link and opens it
 * in a new tab. Simple, no .ics file generation needed.
 */
export default function AddToCalendarButton({ event }) {
  const handleClick = (e) => {
    e.stopPropagation();
    if (!event?.event_time || !event?.title) return;

    const start = new Date(event.event_time);
    const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour duration

    const fmt = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `${event.currency}: ${event.title}`,
      dates: `${fmt(start)}/${fmt(end)}`,
      details: `Impact: ${event.impact}\nCurrency: ${event.currency}\nForecast: ${event.forecast || '—'}\nPrevious: ${event.previous || '—'}`,
      location: 'Economic Calendar',
    });

    window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, '_blank');
  };

  return (
    <button
      onClick={handleClick}
      title="Add to Google Calendar"
      className="p-1.5 rounded-lg text-white/25 hover:text-primary hover:bg-primary/10 transition-all"
    >
      <CalendarPlus className="w-3.5 h-3.5" />
    </button>
  );
}