import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, Server, Clock, Activity, Zap, Globe } from 'lucide-react';
import { SESSIONS, getActiveSession } from '../terminal/terminalConfig.js';

function PulseIndicator({ color = '#00f5a0', label, value, sublabel }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
      style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
      <motion.div
        animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.1, 0.8] }}
        transition={{ duration: 1.8, repeat: Infinity }}
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: color, boxShadow: `0 0 6px ${color}` }}
      />
      <div>
        <div className="text-[9px] text-white/30 font-mono uppercase leading-none">{label}</div>
        <div className="text-[10px] font-bold font-mono leading-tight" style={{ color }}>{value}</div>
        {sublabel && <div className="text-[8px] text-white/20">{sublabel}</div>}
      </div>
    </div>
  );
}

function SessionClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const activeSession = getActiveSession();
  const utcHour = now.getUTCHours();

  return (
    <div className="flex items-center gap-2">
      {SESSIONS.map(s => {
        const isOpen = (() => {
          if (s.open < s.close) return utcHour >= s.open && utcHour < s.close;
          return utcHour >= s.open || utcHour < s.close;
        })();
        return (
          <div key={s.name} className="flex items-center gap-1 px-2 py-1 rounded-md text-[8px] font-mono"
            style={{
              background: isOpen ? `${s.color}15` : 'rgba(255,255,255,0.02)',
              color: isOpen ? s.color : 'rgba(255,255,255,0.2)',
              border: `1px solid ${isOpen ? `${s.color}30` : 'rgba(255,255,255,0.04)'}`,
            }}>
            {isOpen && (
              <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}
                className="w-1 h-1 rounded-full" style={{ background: s.color }} />
            )}
            {s.name.split(' ')[0]}
          </div>
        );
      })}
    </div>
  );
}

export default function LiveStatusBar({ account }) {
  const [latency, setLatency] = useState(12);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t1 = setInterval(() => setTime(new Date()), 1000);
    const t2 = setInterval(() => setLatency(8 + Math.floor(Math.random() * 20)), 3000);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, []);

  const utcStr = time.toUTCString().slice(17, 25);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl px-4 py-2.5 flex items-center gap-3 flex-wrap"
      style={{
        background: 'linear-gradient(90deg, rgba(8,12,24,0.95), rgba(12,18,35,0.95))',
        border: '1px solid rgba(0,149,255,0.08)',
        backdropFilter: 'blur(20px)',
      }}>

      {/* UTC Clock */}
      <div className="flex items-center gap-1.5 text-[10px] font-mono text-blue-400/60">
        <Clock className="w-3 h-3" />
        <span>{utcStr} UTC</span>
      </div>

      <div className="w-px h-4 bg-white/[0.06]" />

      {/* Sessions */}
      <SessionClock />

      <div className="w-px h-4 bg-white/[0.06]" />

      {/* Status pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <PulseIndicator color="#00f5a0" label="Platform" value="Connected" />
        <PulseIndicator color="#0095ff" label="Latency" value={`${latency}ms`} />
        <PulseIndicator
          color={account?.status === 'active' || account?.status === 'funded' ? '#00f5a0' : '#f59e0b'}
          label="Account"
          value={account?.status?.toUpperCase() || 'INACTIVE'}
        />
        <PulseIndicator color="#a855f7" label="MT5" value="Live" sublabel="v5.0" />
      </div>
    </motion.div>
  );
}