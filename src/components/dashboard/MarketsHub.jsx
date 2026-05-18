import React, { useState } from 'react';
import { CalendarDays, Newspaper } from 'lucide-react';
import EconomicCalendar from './EconomicCalendar';
import MarketNews from './MarketNews';

export default function MarketsHub() {
  const [activeTab, setActiveTab] = useState('calendar');

  return (
    <div>
      {/* Tab switcher */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        {[
          { id: 'calendar', label: 'Economic Calendar', icon: CalendarDays },
          { id: 'news', label: 'Market News', icon: Newspaper },
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: active ? 'rgba(255,92,0,0.15)' : 'transparent',
                color: active ? '#FF5C00' : 'hsl(var(--muted-foreground))',
                border: active ? '1px solid rgba(255,92,0,0.3)' : '1px solid transparent',
              }}>
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'calendar' && <EconomicCalendar />}
      {activeTab === 'news' && <MarketNews />}
    </div>
  );
}