import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, TrendingUp, TrendingDown, Sun } from 'lucide-react';

const SESSIONS = [
  { id: 'asian',    label: 'Asian Session',    hours: [0, 8],   color: '#6366f1', icon: '🌏' },
  { id: 'london',   label: 'London Session',   hours: [8, 16],  color: '#0ea5e9', icon: '🇬🇧' },
  { id: 'newyork',  label: 'New York Session', hours: [13, 21], color: '#FF5C00', icon: '🗽' },
];

function getSession(hourUTC) {
  if (hourUTC >= 0 && hourUTC < 8) return 'asian';
  if (hourUTC >= 8 && hourUTC < 16) return 'london';
  if (hourUTC >= 13 && hourUTC < 21) return 'newyork';
  return 'off';
}

export default function SessionAnalytics({ trades = [] }) {
  const sessionStats = useMemo(() => {
    const stats = { asian: { pnl: 0, wins: 0, total: 0 }, london: { pnl: 0, wins: 0, total: 0 }, newyork: { pnl: 0, wins: 0, total: 0 } };
    trades.forEach(t => {
      if (!t.open_time) return;
      const parts = t.open_time.split(':');
      const hour = parseInt(parts[0]) || 0;
      const session = getSession(hour);
      if (session !== 'off' && stats[session]) {
        stats[session].pnl += t.pnl || 0;
        stats[session].total++;
        if ((t.pnl || 0) > 0) stats[session].wins++;
      }
    });
    return stats;
  }, [trades]);

  // Hourly PnL breakdown
  const hourlyPnl = useMemo(() => {
    const hours = Array(24).fill(0).map((_, h) => ({ hour: h, pnl: 0, count: 0 }));
    trades.forEach(t => {
      if (!t.open_time) return;
      const h = parseInt(t.open_time.split(':')[0]) || 0;
      if (h >= 0 && h < 24) { hours[h].pnl += t.pnl || 0; hours[h].count++; }
    });
    return hours;
  }, [trades]);

  const maxAbs = Math.max(...hourlyPnl.map(h => Math.abs(h.pnl)), 1);
  const bestSession = SESSIONS.reduce((best, s) => (sessionStats[s.id].pnl > sessionStats[best?.id || 'asian'].pnl ? s : best), SESSIONS[0]);
  const worstSession = SESSIONS.reduce((worst, s) => (sessionStats[s.id].pnl < sessionStats[worst?.id || 'asian'].pnl ? s : worst), SESSIONS[0]);

  return (
    <div className="space-y-6">
      {/* Session Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {SESSIONS.map((session, i) => {
          const stat = sessionStats[session.id];
          const wr = stat.total > 0 ? Math.round((stat.wins / stat.total) * 100) : 0;
          const isBest = bestSession.id === session.id;
          const isWorst = worstSession.id === session.id && stat.pnl < 0;
          return (
            <motion.div key={session.id}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="rounded-2xl p-5"
              style={{
                background: `${session.color}08`,
                border: `1px solid ${session.color}${isBest ? '60' : '25'}`,
                boxShadow: isBest ? `0 0 24px ${session.color}18` : 'none',
              }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{session.icon}</span>
                  <div>
                    <div className="text-sm font-black text-foreground">{session.label}</div>
                    <div className="text-[10px] font-mono text-muted-foreground">{session.hours[0]}:00 – {session.hours[1]}:00 UTC</div>
                  </div>
                </div>
                {isBest && <span className="px-2 py-0.5 rounded-full text-[9px] font-black text-white" style={{ background: session.color }}>BEST</span>}
                {isWorst && <span className="px-2 py-0.5 rounded-full text-[9px] font-black text-red-400" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>RISKY</span>}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'P&L', value: `${stat.pnl >= 0 ? '+' : ''}$${stat.pnl.toFixed(0)}`, color: stat.pnl >= 0 ? '#10b981' : '#ef4444' },
                  { label: 'Trades', value: stat.total, color: session.color },
                  { label: 'Win %', value: `${wr}%`, color: wr >= 50 ? '#10b981' : '#ef4444' },
                ].map(m => (
                  <div key={m.label} className="text-center rounded-lg py-2"
                    style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <div className="text-[9px] font-mono text-muted-foreground">{m.label}</div>
                    <div className="text-sm font-black mt-0.5" style={{ color: m.color }}>{m.value}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Hourly PnL Chart */}
      <div className="rounded-2xl p-5"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-primary" />
          <span className="text-sm font-black text-foreground">Most Profitable Hours</span>
        </div>
        <div className="flex items-end gap-1 h-20">
          {hourlyPnl.map((h, i) => {
            const height = (Math.abs(h.pnl) / maxAbs) * 100;
            const isPos = h.pnl >= 0;
            const session = getSession(h.hour);
            const sc = SESSIONS.find(s => s.id === session);
            return (
              <div key={i} className="flex-1 flex flex-col items-center group relative">
                <div className="w-full rounded-sm transition-all duration-300 group-hover:opacity-100 opacity-70"
                  style={{ height: `${Math.max(height, 2)}%`, background: h.count > 0 ? (isPos ? (sc?.color || '#10b981') : '#ef4444') : 'rgba(255,255,255,0.05)' }} />
                {h.count > 0 && (
                  <div className="absolute bottom-full mb-1 hidden group-hover:block z-10 px-2 py-1 rounded-lg text-[9px] font-mono whitespace-nowrap"
                    style={{ background: '#0d0f16', border: '1px solid rgba(255,255,255,0.15)' }}>
                    {h.hour}:00 · {h.count} trades · ${h.pnl.toFixed(0)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-[9px] font-mono text-muted-foreground mt-1">
          <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:00</span>
        </div>
        <div className="flex gap-4 mt-3">
          {SESSIONS.map(s => (
            <div key={s.id} className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
              <div className="w-2 h-2 rounded-sm" style={{ background: s.color }} />
              {s.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}