import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SESSIONS } from './terminalConfig';

export default function SessionBar() {
  const [time, setTime] = useState(new Date());
  const [latency, setLatency] = useState(8);

  useEffect(() => {
    const t1 = setInterval(() => setTime(new Date()), 1000);
    const t2 = setInterval(() => setLatency(4 + Math.floor(Math.random() * 20)), 4000);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, []);

  const utcHour = time.getUTCHours();
  const utcMin  = time.getUTCMinutes();
  const utcSec  = time.getUTCSeconds();
  const utcStr  = `${String(utcHour).padStart(2,'0')}:${String(utcMin).padStart(2,'0')}:${String(utcSec).padStart(2,'0')}`;
  const utcTime = utcHour + utcMin / 60;

  const isSessionOpen = (s) =>
    s.open < s.close ? utcTime >= s.open && utcTime < s.close : utcTime >= s.open || utcTime < s.close;

  return (
    <div className="flex items-center gap-0 overflow-x-auto flex-shrink-0 border-b border-white/[0.06]"
      style={{ background: 'rgba(5,5,9,0.98)', scrollbarWidth: 'none', height: '28px' }}>

      {/* UTC Clock */}
      <div className="flex items-center gap-1.5 px-3 border-r border-white/[0.05] h-full flex-shrink-0">
        <span className="text-[9px] font-mono text-white/25">UTC</span>
        <span className="text-[10px] font-mono text-primary/70 font-bold">{utcStr}</span>
      </div>

      {/* Sessions */}
      {SESSIONS.map(s => {
        const isOpen = isSessionOpen(s);
        return (
          <div key={s.name}
            className="flex items-center gap-1.5 px-3 h-full border-r border-white/[0.05] flex-shrink-0 transition-all"
            style={{ background: isOpen ? `${s.color}08` : 'transparent' }}>
            {isOpen && (
              <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}
                className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: s.color }} />
            )}
            <span className="text-[9px] font-mono font-bold" style={{ color: isOpen ? s.color : 'rgba(255,255,255,0.2)' }}>
              {s.name.split(' ')[0]}
            </span>
            {isOpen && (
              <span className="text-[8px] font-mono" style={{ color: `${s.color}90` }}>OPEN</span>
            )}
          </div>
        );
      })}

      {/* Platform status */}
      <div className="flex items-center gap-3 px-3 ml-auto flex-shrink-0">
        <div className="flex items-center gap-1">
          <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}
            className="w-1 h-1 rounded-full bg-emerald-400" />
          <span className="text-[8px] font-mono text-emerald-400/70">LIVE</span>
        </div>
        <span className="text-[8px] font-mono text-white/20">{latency}ms</span>
      </div>
    </div>
  );
}