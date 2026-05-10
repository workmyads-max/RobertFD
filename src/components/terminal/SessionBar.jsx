import React, { useState, useEffect } from 'react';
import { SESSIONS, getActiveSession } from './terminalConfig';

function useTime() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export default function SessionBar() {
  const now = useTime();
  const utcHour   = now.getUTCHours();
  const utcMin    = now.getUTCMinutes();
  const utcSec    = now.getUTCSeconds();
  const active    = getActiveSession();

  const isSessionActive = (s) => {
    if (s.open < s.close) return utcHour >= s.open && utcHour < s.close;
    return utcHour >= s.open || utcHour < s.close;
  };

  const utcStr = `${String(now.getUTCHours()).padStart(2,'0')}:${String(now.getUTCMinutes()).padStart(2,'0')}:${String(now.getUTCSeconds()).padStart(2,'0')} UTC`;

  return (
    <div className="flex items-center gap-px text-[10px] font-mono flex-shrink-0 overflow-x-auto"
      style={{ background: 'rgba(5,5,9,0.98)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Clock */}
      <div className="px-3 py-1.5 border-r border-white/[0.06] text-muted-foreground flex-shrink-0">
        {utcStr}
      </div>
      {/* Sessions */}
      {SESSIONS.map(s => {
        const on = isSessionActive(s);
        return (
          <div key={s.name} className="flex items-center gap-1.5 px-3 py-1.5 border-r border-white/[0.06] flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: on ? s.color : 'rgba(255,255,255,0.15)' }} />
            <span style={{ color: on ? s.color : 'rgba(255,255,255,0.3)' }}>{s.name}</span>
            {on && <span className="text-[8px] font-bold" style={{ color: s.color }}>OPEN</span>}
          </div>
        );
      })}
      {/* Active session label */}
      {active && (
        <div className="ml-auto px-3 flex-shrink-0" style={{ color: active.color }}>
          {active.name} Session Active
        </div>
      )}
    </div>
  );
}