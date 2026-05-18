import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function RiskHeatmap({ trades = [] }) {
  const dailyMap = useMemo(() => {
    const map = {};
    trades.forEach(t => {
      if (!t.open_time && !t.close_time) return;
      const dateKey = (t.close_time || t.open_time || '').substring(0, 10);
      if (!dateKey || dateKey === 'undefined') return;
      if (!map[dateKey]) map[dateKey] = { pnl: 0, count: 0, ddSpike: false };
      map[dateKey].pnl += t.pnl || 0;
      map[dateKey].count++;
    });
    return map;
  }, [trades]);

  // Build last 12 weeks
  const weeks = useMemo(() => {
    const result = [];
    const today = new Date();
    for (let w = 11; w >= 0; w--) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(today);
        date.setDate(today.getDate() - (w * 7) - (6 - d));
        const key = date.toISOString().substring(0, 10);
        week.push({ date: key, day: date.getDay(), month: date.getMonth(), dayOfMonth: date.getDate(), data: dailyMap[key] || null });
      }
      result.push(week);
    }
    return result;
  }, [dailyMap]);

  const maxPnl = useMemo(() => {
    const vals = Object.values(dailyMap).map(d => Math.abs(d.pnl));
    return Math.max(...vals, 1);
  }, [dailyMap]);

  const getColor = (data) => {
    if (!data || data.count === 0) return 'rgba(255,255,255,0.04)';
    const intensity = Math.min(Math.abs(data.pnl) / maxPnl, 1);
    if (data.pnl > 0) return `rgba(16,185,129,${0.15 + intensity * 0.7})`;
    if (data.pnl < -100) return `rgba(239,68,68,${0.15 + intensity * 0.7})`;
    return `rgba(245,158,11,${0.2 + intensity * 0.5})`;
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl p-6"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2 mb-5">
          <Flame className="w-4 h-4 text-primary" />
          <span className="text-sm font-black text-foreground">Performance Heatmap — Last 12 Weeks</span>
        </div>

        {/* Day labels */}
        <div className="flex gap-1 mb-1">
          <div className="w-8 flex-shrink-0" />
          {DAYS.map(d => (
            <div key={d} className="flex-1 text-center text-[9px] font-mono text-muted-foreground">{d[0]}</div>
          ))}
        </div>

        {/* Grid */}
        <div className="space-y-1">
          {weeks.map((week, wi) => {
            const showMonth = week[0].dayOfMonth <= 7;
            return (
              <div key={wi} className="flex gap-1 items-center">
                <div className="w-8 text-[8px] font-mono text-muted-foreground flex-shrink-0">
                  {showMonth ? MONTHS[week[0].month] : ''}
                </div>
                {week.map((cell, di) => (
                  <motion.div key={di}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: (wi * 7 + di) * 0.003 }}
                    className="flex-1 aspect-square rounded-sm group relative cursor-pointer transition-transform hover:scale-125 hover:z-10"
                    style={{ background: getColor(cell.data), minWidth: 12, minHeight: 12 }}>
                    {cell.data && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-20 px-2 py-1 rounded-lg text-[9px] font-mono whitespace-nowrap"
                        style={{ background: '#0d0f16', border: '1px solid rgba(255,255,255,0.15)' }}>
                        {cell.date} · {cell.data.count} trades · ${cell.data.pnl.toFixed(0)}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 flex-wrap">
          <span className="text-[10px] font-mono text-muted-foreground">Legend:</span>
          {[
            { color: 'rgba(16,185,129,0.8)', label: 'Profitable Day' },
            { color: 'rgba(239,68,68,0.8)', label: 'Loss Day' },
            { color: 'rgba(245,158,11,0.6)', label: 'Risky Day' },
            { color: 'rgba(255,255,255,0.04)', label: 'No Trades' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ background: l.color }} />
              <span className="text-[10px] font-mono text-muted-foreground">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Trading Days', value: Object.keys(dailyMap).length, color: '#6366f1' },
          { label: 'Profitable Days', value: Object.values(dailyMap).filter(d => d.pnl > 0).length, color: '#10b981' },
          { label: 'Loss Days', value: Object.values(dailyMap).filter(d => d.pnl < 0).length, color: '#ef4444' },
          { label: 'Best Day P&L', value: `$${Math.max(...Object.values(dailyMap).map(d => d.pnl), 0).toFixed(0)}`, color: '#FF5C00' },
        ].map((s, i) => (
          <motion.div key={s.label}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="rounded-2xl p-4 text-center"
            style={{ background: `${s.color}08`, border: `1px solid ${s.color}25` }}>
            <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[10px] font-mono text-muted-foreground mt-1">{s.label}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}