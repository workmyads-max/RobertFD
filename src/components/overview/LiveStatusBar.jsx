import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wifi, Clock, Shield, Activity } from 'lucide-react';
import { SESSIONS, getActiveSession } from '../terminal/terminalConfig';

function Dot({ color, pulse }) {
  return (
    <div className="relative flex-shrink-0">
      <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {pulse && (
        <motion.div
          animate={{ scale: [1, 2.5, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 rounded-full"
          style={{ background: color }}
        />
      )}
    </div>
  );
}

export default function LiveStatusBar({ account }) {
  const [latency, setLatency] = useState(12);
  const [time, setTime] = useState(new Date());
  const [quoteIndex, setQuoteIndex] = useState(0);

  const quotes = [
    "Trade what you see, not what you think",
    "Cut losses quickly, let winners run",
    "Patience is not a virtue, it's a necessity",
    "The best trade is often the one you don't make",
    "Risk management is more important than profits",
    "Plan the trade, trade the plan",
  ];

  useEffect(() => {
    const t1 = setInterval(() => setTime(new Date()), 1000);
    const t2 = setInterval(() => setLatency(6 + Math.floor(Math.random() * 18)), 3000);
    const t3 = setInterval(() => setQuoteIndex(i => (i + 1) % quotes.length), 8000);
    return () => { clearInterval(t1); clearInterval(t2); clearInterval(t3); };
  }, []);

  const utcStr = time.toUTCString().slice(17, 25);
  const utcHour = time.getUTCHours();
  const isActive = account?.status === 'active' || account?.status === 'funded';

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-0 overflow-x-auto rounded-xl"
      style={{
        background: 'linear-gradient(145deg, rgba(8,14,28,0.98), rgba(10,18,38,0.95))',
        border: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(24px)',
        scrollbarWidth: 'none',
      }}>

      {/* UTC Time */}
      <div className="flex items-center gap-2 px-4 py-3 border-r border-white/[0.05]">
        <Clock className="w-3 h-3 text-white/25" />
        <span className="text-[11px] font-mono text-orange-400/60">{utcStr}</span>
        <span className="text-[9px] font-mono text-white/20">UTC</span>
      </div>

      {/* Sessions */}
      <div className="flex items-center gap-1 px-4 py-3 border-r border-white/[0.05]">
        {SESSIONS.map(s => {
          const isOpen = s.open < s.close
            ? utcHour >= s.open && utcHour < s.close
            : utcHour >= s.open || utcHour < s.close;
          return (
            <div key={s.name} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-mono transition-all"
              style={{
                background: isOpen ? `${s.color}12` : 'transparent',
                color: isOpen ? s.color : 'rgba(255,255,255,0.15)',
                border: `1px solid ${isOpen ? `${s.color}25` : 'transparent'}`,
              }}>
              {isOpen && <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}
                className="w-1 h-1 rounded-full" style={{ background: s.color }} />}
              {s.name.split(' ')[0]}
            </div>
          );
        })}
      </div>

      {/* Status pills */}
      <div className="flex items-center gap-4 px-4 py-3 flex-1">
        <div className="flex items-center gap-2">
          <Dot color="#10b981" pulse />
          <span className="text-[10px] font-mono text-white/40">Platform</span>
          <span className="text-[10px] font-mono text-emerald-400">Connected</span>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <Dot color={latency < 20 ? '#10b981' : '#f59e0b'} />
          <span className="text-[10px] font-mono text-white/40">Latency</span>
          <span className="text-[10px] font-mono text-white/60">{latency}ms</span>
        </div>
        <div className="hidden md:flex items-center gap-2 flex-1 min-w-0">
          <Activity className="w-3 h-3 text-orange-400/50 flex-shrink-0" />
          <span className="text-[10px] font-medium text-white/50 truncate">{quotes[quoteIndex]}</span>
        </div>
        <div className="hidden lg:flex items-center gap-2">
          <Shield className="w-3 h-3 text-blue-400/50" />
          <span className="text-[10px] font-mono text-white/40">MT5</span>
          <span className="text-[10px] font-mono text-orange-400">Live</span>
        </div>
      </div>
    </motion.div>
  );
}