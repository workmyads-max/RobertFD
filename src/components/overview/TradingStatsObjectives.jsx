import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Award, CalendarDays, Shield } from 'lucide-react';
import { Card, CardHeader } from './OverviewCards';

function fmt(n, d = 2) { return (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }); }

function DisciplineGauge({ score }) {
  const r = 68, cx = 100, cy = 95;
  const circ = Math.PI * r;
  const dash = (Math.min(Math.max(score, 0), 100) / 100) * circ;
  const color = score < 30 ? '#ef4444' : score < 80 ? '#f59e0b' : '#10b981';
  const label = score < 30 ? 'Poor' : score < 80 ? 'Average' : 'Excellent';

  return (
    <div className="flex flex-col items-center">
      <svg width="200" height="115" viewBox="0 0 200 115">
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity="0.6" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" strokeLinecap="round" />
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke="url(#gaugeGrad)" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: 'stroke-dasharray 1.4s cubic-bezier(0.22,1,0.36,1)', filter: `drop-shadow(0 0 8px ${color}66)` }} />
        {[0, 25, 50, 75, 100].map(v => {
          const angle = Math.PI * (v / 100);
          const tx = cx - r * Math.cos(angle);
          const ty = cy - r * Math.sin(angle);
          const lx = cx - (r + 16) * Math.cos(angle);
          const ly = cy - (r + 16) * Math.sin(angle);
          return (
            <g key={v}>
              <circle cx={tx} cy={ty} r="2" fill="rgba(255,255,255,0.2)" />
              <text x={lx} y={ly + 3} textAnchor="middle" fontSize="7.5" fill="rgba(255,255,255,0.3)" fontFamily="monospace">{v}</text>
            </g>
          );
        })}
        <text x={cx} y={cy - 14} textAnchor="middle" fontSize="28" fontWeight="900" fill={color} fontFamily="monospace"
          style={{ filter: `drop-shadow(0 0 10px ${color}80)` }}>{score}%</text>
        <text x={cx} y={cy + 7} textAnchor="middle" fontSize="11" fill={color} fontWeight="700" letterSpacing="1">{label.toUpperCase()}</text>
      </svg>
    </div>
  );
}

export default function TradingStatsObjectives({ account, tradeRecords }) {
  const snap = account?.rule_snapshot || {};
  const accountSize = account?.account_size || 100000;
  const balance = account?.balance || accountSize;
  const equity = account?.equity || balance;

  const dailyDDLimit = snap.daily_dd_limit ?? 5;
  const maxDDLimit = snap.max_dd_limit ?? 10;
  const profitTarget = account?.phase === 'phase2' ? (snap.phase2_target ?? 5) : (snap.phase1_target ?? 10);
  const minDays = snap.min_trading_days ?? 4;

  const tradingDaySet = new Set();
  tradeRecords.filter(t => t.status === 'closed' && t.close_time).forEach(t => {
    const d = new Date(t.close_time);
    const bangkokOffset = 7 * 60;
    const localDate = new Date(d.getTime() + (bangkokOffset + d.getTimezoneOffset()) * 60000);
    tradingDaySet.add(localDate.toISOString().split('T')[0]);
  });
  const tradingDays = tradingDaySet.size;

  const dailyDDUsed = account?.daily_drawdown_used || 0;
  const maxDDUsed = account?.max_drawdown_used || 0;
  const profitTargetPct = account?.profit_target_progress ?? Math.max(0, ((equity - accountSize) / accountSize) * 100);

  const objectives = [
    { label: `Min ${minDays} Trading Days`, result: `${tradingDays} / ${minDays}`, pass: tradingDays >= minDays, pct: Math.min((tradingDays / minDays) * 100, 100) },
    { label: `Max Daily Loss`, result: `-${fmt(dailyDDUsed)}%`, pass: dailyDDUsed < dailyDDLimit, danger: dailyDDUsed >= dailyDDLimit, pct: Math.min((dailyDDUsed / dailyDDLimit) * 100, 100) },
    { label: `Max Overall Loss`, result: `-${fmt(maxDDUsed)}%`, pass: maxDDUsed < maxDDLimit, danger: maxDDUsed >= maxDDLimit, pct: Math.min((maxDDUsed / maxDDLimit) * 100, 100) },
    { label: `Profit Target`, result: `${profitTargetPct.toFixed(1)}%`, pass: profitTargetPct >= profitTarget, pct: Math.min((profitTargetPct / profitTarget) * 100, 100) },
  ];

  const scores = [
    tradingDays >= minDays ? 100 : Math.round((tradingDays / minDays) * 60),
    dailyDDUsed < dailyDDLimit * 0.5 ? 100 : dailyDDUsed < dailyDDLimit ? 60 : 0,
    maxDDUsed < maxDDLimit * 0.5 ? 100 : maxDDUsed < maxDDLimit ? 60 : 0,
    profitTargetPct >= profitTarget ? 100 : Math.round((profitTargetPct / profitTarget) * 60),
  ];
  const disciplineScore = Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,92,0,0.1)' }}>
            <Award className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-sm font-bold text-foreground">Trading Stats & Objectives</span>
        </div>
      </CardHeader>

      <div className="grid md:grid-cols-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="p-5 border-b md:border-b-0 md:border-r" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-foreground">Discipline Score</span>
            <div className="flex items-center gap-3 text-[10px] text-white/35">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Poor</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />Avg</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />Great</span>
            </div>
          </div>
          <DisciplineGauge score={disciplineScore} />
          <div className="mt-4 space-y-2.5">
            {[
              { label: 'Trading Days', score: scores[0] },
              { label: 'Daily DD', score: scores[1] },
              { label: 'Max DD', score: scores[2] },
              { label: 'Profit Target', score: scores[3] },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-3 text-xs">
                <span className="text-white/40 w-24 shrink-0">{s.label}</span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <motion.div className="h-full rounded-full"
                    initial={{ width: 0 }} animate={{ width: `${s.score}%` }}
                    transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                    style={{ background: s.score >= 80 ? '#10b981' : s.score >= 30 ? '#f59e0b' : '#ef4444' }} />
                </div>
                <span className="font-mono font-bold w-8 text-right text-[11px]"
                  style={{ color: s.score >= 80 ? '#10b981' : s.score >= 30 ? '#f59e0b' : '#ef4444' }}>
                  {s.score}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5">
          <div className="text-sm font-bold text-foreground mb-4">Trading Objectives</div>
          <div className="space-y-3">
            {objectives.map(obj => {
              const barColor = obj.danger ? '#ef4444' : obj.pass ? '#10b981' : '#f59e0b';
              return (
                <div key={obj.label} className="rounded-xl p-3.5" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${obj.pass ? 'rgba(16,185,129,0.15)' : obj.danger ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)'}` }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-white/70">{obj.label}</span>
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${obj.pass ? 'bg-emerald-500' : obj.danger ? 'bg-red-500' : 'bg-white/10'}`}>
                      {obj.pass ? <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                        : <X className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <motion.div className="h-full rounded-full"
                        initial={{ width: 0 }} animate={{ width: `${obj.pct}%` }}
                        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                        style={{ background: barColor }} />
                    </div>
                    <span className="text-[11px] font-mono font-bold shrink-0" style={{ color: obj.danger ? '#ef4444' : 'rgba(255,255,255,0.5)' }}>{obj.result}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}