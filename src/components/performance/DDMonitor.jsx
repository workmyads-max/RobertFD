import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, Clock, Target, AlertTriangle } from 'lucide-react';

function AnimatedBar({ value, max, color, label, sublabel, warning = false }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="mb-4">
      <div className="flex justify-between text-xs font-mono mb-1.5">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-bold" style={{ color: warning && pct > 70 ? '#ef4444' : color }}>
          {value?.toFixed(2)}% <span className="text-muted-foreground font-normal">/ {max}%</span>
        </span>
      </div>
      <div className="h-3 rounded-full overflow-hidden relative" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="h-full rounded-full relative overflow-hidden"
          style={{
            background: pct > 80 ? 'linear-gradient(90deg,#ef4444,#dc2626)' : pct > 60 ? 'linear-gradient(90deg,#f59e0b,#d97706)' : `linear-gradient(90deg,${color},${color}bb)`,
            boxShadow: pct > 80 ? '0 0 12px rgba(239,68,68,0.4)' : `0 0 8px ${color}40`,
          }}>
          {pct > 10 && (
            <motion.div animate={{ x: ['-100%', '200%'] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 opacity-20" style={{ background: 'linear-gradient(90deg,transparent,white,transparent)' }} />
          )}
        </motion.div>
      </div>
      {sublabel && <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{sublabel}</div>}
    </div>
  );
}

function ResetCountdown() {
  const [timeToReset, setTimeToReset] = useState('');

  useEffect(() => {
    const calc = () => {
      const now = new Date();
      // 3:00 AM GMT+4 = 23:00 UTC previous day
      const resetUTC = new Date();
      resetUTC.setUTCHours(23, 0, 0, 0);
      if (now.getUTCHours() >= 23) resetUTC.setUTCDate(resetUTC.getUTCDate() + 1);
      const diff = resetUTC - now;
      if (diff < 0) return setTimeToReset('00:00:00');
      const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
      setTimeToReset(`${h}:${m}:${s}`);
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
      style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
      <Clock className="w-3.5 h-3.5 text-indigo-400" />
      <span className="text-[10px] font-mono text-muted-foreground">Daily DD resets in</span>
      <span className="text-sm font-black text-indigo-400 font-mono">{timeToReset}</span>
      <span className="text-[9px] text-muted-foreground ml-auto">03:00 GMT+4</span>
    </div>
  );
}

export default function DDMonitor({ account, expanded = false }) {
  if (!account) return (
    <div className="rounded-2xl p-6 flex items-center justify-center h-full"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <p className="text-muted-foreground text-sm">No account selected</p>
    </div>
  );

  const dailyDDUsed = account.daily_drawdown_used || 0;
  const maxDDUsed = account.max_drawdown_used || 0;
  const profitProgress = account.profit_target_progress || 0;
  const profitTarget = account.challenge_type === 'two-step' ? (account.phase === 'phase1' ? 10 : 5) : 8;
  const dailyRemaining = Math.max(5 - dailyDDUsed, 0);
  const maxRemaining = Math.max(10 - maxDDUsed, 0);

  return (
    <div className="rounded-2xl p-6 h-full"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex items-center gap-2 mb-5">
        <TrendingDown className="w-4 h-4 text-primary" />
        <span className="text-sm font-black text-foreground">Drawdown Monitor</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-mono text-muted-foreground">Live</span>
        </div>
      </div>

      <AnimatedBar value={dailyDDUsed} max={5} color="#f59e0b" label="Daily DD Used" sublabel="Resets at 3:00 AM GMT+4" warning />
      <AnimatedBar value={maxDDUsed} max={10} color="#ef4444" label="Max DD Used" sublabel="Does not reset - permanent limit" warning />
      <AnimatedBar value={profitProgress} max={profitTarget} color="#10b981" label="Profit Target Progress" sublabel={`Target: ${profitTarget}%`} />

      <div className="grid grid-cols-2 gap-3 mb-4 mt-2">
        {[
          { label: 'Daily Remaining', value: `${dailyRemaining.toFixed(2)}%`, color: dailyRemaining < 1 ? '#ef4444' : '#10b981' },
          { label: 'Max DD Remaining', value: `${maxRemaining.toFixed(2)}%`, color: maxRemaining < 2 ? '#ef4444' : '#f59e0b' },
        ].map(m => (
          <div key={m.label} className="rounded-xl p-3 text-center"
            style={{ background: `${m.color}0a`, border: `1px solid ${m.color}25` }}>
            <div className="text-[10px] font-mono text-muted-foreground mb-1">{m.label}</div>
            <div className="text-lg font-black" style={{ color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      {dailyDDUsed > 3.5 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-3 text-xs"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
          <span className="text-red-300">⚠ Approaching Daily DD Limit - Reduce position size</span>
        </motion.div>
      )}

      <ResetCountdown />
    </div>
  );
}