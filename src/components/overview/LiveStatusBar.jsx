import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Activity, Shield, Wifi, Zap } from 'lucide-react';
import { SESSIONS } from '../terminal/terminalConfig';

function StatusDot({ color, active }) {
  return (
    <div className="relative w-2 h-2">
      <div className="absolute inset-0 rounded-full" style={{ background: color, opacity: 0.3 }} />
      <motion.div 
        className="absolute inset-0 rounded-full" 
        style={{ background: color }}
        animate={active ? { scale: [1, 1.4, 1], opacity: [1, 0.8, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </div>
  );
}

export default function LiveStatusBar({ account }) {
  const [latency, setLatency] = useState(15);
  const [time, setTime] = useState(new Date());
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [fade, setFade] = useState(true);

  const quotes = [
    { text: "Trade what you see, not what you think", author: "Unknown" },
    { text: "Cut losses quickly, let winners run", author: "Paul Tudor Jones" },
    { text: "Patience is more important than speed", author: "Warren Buffett" },
    { text: "The best trade is often no trade", author: "Unknown" },
    { text: "Risk management is everything", author: "Unknown" },
    { text: "Plan the trade, trade the plan", author: "Unknown" },
  ];

  useEffect(() => {
    const t1 = setInterval(() => setTime(new Date()), 1000);
    const t2 = setInterval(() => setLatency(8 + Math.floor(Math.random() * 15)), 2500);
    const t3 = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setQuoteIndex(i => (i + 1) % quotes.length);
        setFade(true);
      }, 300);
    }, 10000);
    return () => { clearInterval(t1); clearInterval(t2); clearInterval(t3); };
  }, []);

  const utcStr = time.toUTCString().slice(17, 25);
  const utcHour = time.getUTCHours();

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="relative overflow-hidden rounded-2xl"
      style={{
        background: 'linear-gradient(135deg, rgba(12,16,26,0.95) 0%, rgba(15,20,35,0.92) 50%, rgba(10,14,28,0.95) 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}>
      
      {/* Subtle top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px" 
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,92,0,0.4), transparent)' }} />

      <div className="flex items-center gap-0 px-5 py-2.5">
        {/* Time Section */}
        <div className="flex items-center gap-2.5 pr-5 border-r border-white/[0.06]">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" 
            style={{ background: 'rgba(255,92,0,0.08)', border: '1px solid rgba(255,92,0,0.15)' }}>
            <Clock className="w-3.5 h-3.5" style={{ color: '#FF5C00' }} />
          </div>
          <div>
            <div className="text-[10px] font-mono text-white/35 mb-0.5">Server Time</div>
            <div className="text-sm font-bold font-mono" style={{ color: '#FF5C00' }}>{utcStr}</div>
          </div>
        </div>

        {/* Market Sessions */}
        <div className="flex items-center gap-2 px-5 border-r border-white/[0.06]">
          <div className="text-[10px] font-semibold text-white/35 uppercase tracking-wider mr-1">Markets</div>
          {SESSIONS.map(s => {
            const isOpen = s.open < s.close
              ? utcHour >= s.open && utcHour < s.close
              : utcHour >= s.open || utcHour < s.close;
            return (
              <motion.div 
                key={s.name}
                initial={false}
                animate={{ scale: isOpen ? [1, 1.05, 1] : 1 }}
                transition={{ duration: 2, repeat: isOpen ? Infinity : 0 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all"
                style={{
                  background: isOpen ? 'rgba(255,255,255,0.04)' : 'transparent',
                  border: `1px solid ${isOpen ? 'rgba(255,255,255,0.1)' : 'transparent'}`,
                  color: isOpen ? '#FFFFFF' : 'rgba(255,255,255,0.2)',
                }}>
                {isOpen && (
                  <motion.div 
                    className="w-1.5 h-1.5 rounded-full" 
                    style={{ background: s.color }}
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
                {s.name.split(' ')[0]}
              </motion.div>
            );
          })}
        </div>

        {/* Right Section - Status & Quote */}
        <div className="flex items-center gap-4 pl-5 flex-1 min-w-0">
          {/* Platform Status */}
          <div className="hidden sm:flex items-center gap-2">
            <StatusDot color="#10b981" active={true} />
            <div className="text-[10px]">
              <span className="text-white/40 font-medium">Platform </span>
              <span className="text-emerald-400 font-bold">Online</span>
            </div>
          </div>

          {/* Latency */}
          <div className="hidden md:flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" 
              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
              <Zap className="w-3.5 h-3.5" style={{ color: '#10b981' }} />
            </div>
            <div className="text-[10px]">
              <span className="text-white/40 font-medium">Latency </span>
              <span className="text-white/70 font-bold font-mono">{latency}ms</span>
            </div>
          </div>

          {/* Trading Quote */}
          <div className="hidden lg:flex items-center gap-2 flex-1 min-w-0">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" 
              style={{ background: 'rgba(255,92,0,0.08)', border: '1px solid rgba(255,92,0,0.15)' }}>
              <Activity className="w-3.5 h-3.5" style={{ color: '#FF5C00' }} />
            </div>
            <div className="flex-1 min-w-0 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={quoteIndex}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: fade ? 1 : 0, x: fade ? 0 : -8 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.3 }}
                  className="text-[10px] truncate"
                >
                  <span className="text-white/50 italic">{quotes[quoteIndex].text}</span>
                  {quotes[quoteIndex].author && (
                    <span className="text-white/30 ml-1">— {quotes[quoteIndex].author}</span>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* MT5 Status */}
          <div className="hidden xl:flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" 
              style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
              <Shield className="w-3.5 h-3.5" style={{ color: '#3b82f6' }} />
            </div>
            <div className="text-[10px]">
              <span className="text-white/40 font-medium">MT5 </span>
              <span className="text-orange-400 font-bold">Live</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}