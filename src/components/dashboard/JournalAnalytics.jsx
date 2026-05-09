import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Target, Brain, Activity, Flame, AlertTriangle } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl px-3 py-2 text-xs"
        style={{ background: 'rgba(14,14,16,0.95)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <p className="font-mono text-muted-foreground mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }} className="font-bold">{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function JournalAnalytics({ entries }) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-16 rounded-2xl" style={{ border: '1px dashed rgba(255,255,255,0.1)' }}>
        <Activity className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground">Add journal entries to see analytics</p>
      </div>
    );
  }

  const pnlData = entries.slice(0, 14).reverse().map((e, i) => ({
    date: e.entry_date?.slice(5) || `Day ${i + 1}`,
    pnl: e.pnl || 0,
  }));

  const winRateData = entries.slice(0, 10).reverse().map((e, i) => ({
    date: e.entry_date?.slice(5) || `Day ${i + 1}`,
    winRate: e.win_rate || 0,
  }));

  const emotionCounts = {};
  entries.forEach(e => (e.emotions || []).forEach(em => { emotionCounts[em] = (emotionCounts[em] || 0) + 1; }));
  const emotionData = Object.entries(emotionCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

  const disciplineData = entries.slice(0, 10).reverse().map((e, i) => ({
    date: e.entry_date?.slice(5) || `Day ${i + 1}`,
    discipline: e.discipline_score || 0,
    consistency: e.consistency_score || 0,
  }));

  const totalWins = entries.reduce((s, e) => s + (e.winning_trades || 0), 0);
  const totalLosses = entries.reduce((s, e) => s + (e.losing_trades || 0), 0);
  const bestTrade = Math.max(...entries.map(e => e.best_trade_pnl || 0));
  const worstTrade = Math.min(...entries.map(e => e.worst_trade_pnl || 0));
  const avgDiscipline = entries.reduce((s, e) => s + (e.discipline_score || 0), 0) / entries.length;
  const positiveDays = entries.filter(e => (e.pnl || 0) > 0).length;
  const negativeDays = entries.filter(e => (e.pnl || 0) < 0).length;

  return (
    <div className="space-y-6">
      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Positive Days', value: positiveDays, icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Negative Days', value: negativeDays, icon: AlertTriangle, color: 'text-red-400' },
          { label: 'Best Trade', value: `+$${bestTrade}`, icon: Flame, color: 'text-primary' },
          { label: 'Avg Discipline', value: `${avgDiscipline.toFixed(1)}/10`, icon: Brain, color: 'text-accent' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="rounded-2xl p-4"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-muted-foreground uppercase">{s.label}</span>
                <Icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
            </motion.div>
          );
        })}
      </div>

      {/* P&L Chart */}
      <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="text-sm font-bold text-foreground mb-4">Daily P&L History</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={pnlData}>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#666', fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#666', fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
              {pnlData.map((entry, index) => (
                <Cell key={index} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} opacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Win Rate & Discipline charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="text-sm font-bold text-foreground mb-4">Win Rate Trend</div>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={winRateData}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#666', fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#666', fontFamily: 'monospace' }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="winRate" stroke="#FF5C00" strokeWidth={2} dot={{ fill: '#FF5C00', r: 3 }} name="Win Rate %" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="text-sm font-bold text-foreground mb-4">Discipline & Consistency</div>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={disciplineData}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#666', fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#666', fontFamily: 'monospace' }} axisLine={false} tickLine={false} domain={[0, 10]} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="discipline" stroke="#FF5C00" strokeWidth={2} dot={false} name="Discipline" />
              <Line type="monotone" dataKey="consistency" stroke="#CCFF00" strokeWidth={2} dot={false} name="Consistency" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Emotional patterns */}
      {emotionData.length > 0 && (
        <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-foreground">Emotional Patterns</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {emotionData.map((e) => {
              const posColors = ['confident', 'disciplined', 'calm', 'patient'];
              const color = posColors.includes(e.name) ? '#10b981' : '#ef4444';
              return (
                <div key={e.name} className="flex items-center gap-2 px-4 py-2 rounded-xl"
                  style={{ background: `${color}10`, border: `1px solid ${color}25` }}>
                  <span className="text-sm font-mono capitalize" style={{ color }}>{e.name}</span>
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded-full text-white text-[10px]"
                    style={{ background: color }}>{e.count}x</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Trading day heatmap */}
      <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="text-sm font-bold text-foreground mb-4">Trading Day Results</div>
        <div className="flex gap-2 flex-wrap">
          {entries.map((e, i) => {
            const pnl = e.pnl || 0;
            const isPos = pnl > 0;
            const intensity = Math.min(Math.abs(pnl) / 1000, 1);
            return (
              <div key={e.id} title={`${e.entry_date}: ${pnl >= 0 ? '+' : ''}$${pnl}`}
                className="w-8 h-8 rounded-lg cursor-pointer transition-transform hover:scale-110"
                style={{
                  background: pnl === 0 ? 'rgba(255,255,255,0.05)'
                    : isPos ? `rgba(16,185,129,${0.2 + intensity * 0.6})`
                    : `rgba(239,68,68,${0.2 + intensity * 0.6})`,
                  border: `1px solid ${pnl === 0 ? 'rgba(255,255,255,0.08)' : isPos ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                }}
              />
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 text-[10px] font-mono text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500/50" /> Profit day</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500/50" /> Loss day</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-white/10" /> Flat</span>
        </div>
      </div>
    </div>
  );
}