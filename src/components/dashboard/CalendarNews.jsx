import React, { useState } from 'react';
import { CalendarDays, Newspaper } from 'lucide-react';
import EconomicCalendar from './EconomicCalendar';
import MarketNews from './MarketNews';

export default function CalendarNews() {
  const [tab, setTab] = useState('calendar');

  return (
    <div>
      {/* Tab switcher */}
      <div className="flex gap-0 mb-6 rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(255,255,255,0.08)', width: 'fit-content', background: 'rgba(255,255,255,0.03)' }}>
        <button
          onClick={() => setTab('calendar')}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold transition-all ${tab === 'calendar' ? 'text-white' : 'text-muted-foreground hover:text-foreground'}`}
          style={tab === 'calendar' ? { background: 'rgba(255,92,0,0.15)', borderRight: '1px solid rgba(255,92,0,0.2)' } : { borderRight: '1px solid rgba(255,255,255,0.06)' }}
        >
          <CalendarDays className={`w-4 h-4 ${tab === 'calendar' ? 'text-primary' : 'text-muted-foreground'}`} />
          Economic Calendar
        </button>
        <button
          onClick={() => setTab('news')}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold transition-all ${tab === 'news' ? 'text-white' : 'text-muted-foreground hover:text-foreground'}`}
          style={tab === 'news' ? { background: 'rgba(255,92,0,0.15)' } : {}}
        >
          <Newspaper className={`w-4 h-4 ${tab === 'news' ? 'text-primary' : 'text-muted-foreground'}`} />
          Market News
        </button>
      </div>

      {tab === 'calendar' && <EconomicCalendar />}
      {tab === 'news' && <MarketNews />}
    </div>
  );
}