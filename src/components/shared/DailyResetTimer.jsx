import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Timer } from 'lucide-react';
import { getDailyResetCountdown } from '../terminal/terminalConfig';

/**
 * Live countdown timer to the next Daily DD reset at 3:00 AM GMT+4 (23:00 UTC).
 * Drop this anywhere - Overview, Terminal account bar, Account Cards, Analytics.
 */
export default function DailyResetTimer({ compact = false, dailyDDUsed = 0, dailyDDLimit = 5 }) {
  const [countdown, setCountdown] = useState(getDailyResetCountdown());

  useEffect(() => {
    const t = setInterval(() => setCountdown(getDailyResetCountdown()), 1000);
    return () => clearInterval(t);
  }, []);

  const pct = Math.min((dailyDDUsed / dailyDDLimit) * 100, 100);
  const isWarning = pct >= 70;
  const isCritical = pct >= 90;
  const color = isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981';

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-[10px] font-mono"
        style={{ color: isCritical ? '#ef4444' : isWarning ? '#f59e0b' : 'rgba(255,255,255,0.4)' }}>
        <Timer className="w-3 h-3 flex-shrink-0" />
        <span>Reset {countdown.label}</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl p-3 space-y-2"
      style={{
        background: isCritical ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${isCritical ? 'rgba(239,68,68,0.3)' : isWarning ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.07)'}`,
      }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Timer className="w-3.5 h-3.5" style={{ color }} />
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Daily DD Reset</span>
        </div>
        <span className="text-[11px] font-mono font-bold tabular-nums" style={{ color }}>
          {countdown.label}
        </span>
      </div>
      {/* Daily DD bar */}
      <div>
        <div className="flex justify-between text-[9px] font-mono text-muted-foreground/60 mb-1">
          <span>Daily DD Used</span>
          <span>{dailyDDUsed.toFixed(2)}% / {dailyDDLimit}%</span>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8 }}
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${color}80, ${color})` }}
          />
        </div>
      </div>
      <div className="text-[8px] font-mono text-muted-foreground/30 text-center">
        Resets at 3:00 AM GMT+4 daily
      </div>
    </div>
  );
}