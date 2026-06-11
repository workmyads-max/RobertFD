import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Award, CalendarDays, BarChart3 } from 'lucide-react';
import { Card, CardHeader, SectionLabel } from './OverviewCards';

function fmt(n, d = 2) { return (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }); }

function StatRow({ label, value, valueColor, bar, barPct }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
      <div className="flex items-center gap-2">
        <div className="w-1 h-1 rounded-full bg-white/20" />
        <span className="text-xs text-white/45">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {bar && (
          <div className="w-16 h-1 rounded-full overflow-hidden hidden sm:block" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full" style={{ width: `${Math.min(barPct, 100)}%`, background: valueColor || '#FF5C00' }} />
          </div>
        )}
        <span className="text-xs font-bold font-mono" style={{ color: valueColor || '#f1f5f9' }}>{value}</span>
      </div>
    </div>
  );
}

export function StatisticsPanel({ account, tradeRecords }) {
  const balance = account?.balance || account?.account_size || 0;
  const equity = account?.equity || balance;
  const accountSize = account?.account_size || 100000;
  const closedTrades = tradeRecords.filter(t => t.status === 'closed');
  const wins = closedTrades.filter(t => (t.pnl || 0) > 0);
  const losses = closedTrades.filter(t => (t.pnl || 0) < 0);
  const avgWin = wins.length ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : 0;
  const avgLoss = losses.length ? Math.abs(losses.reduce((s, t) => s + t.pnl, 0) / losses.length) : 0;
  const totalLots = closedTrades.reduce((s, t) => s + (t.lots || 0), 0);
  const profitFactor = avgLoss > 0 && wins.length > 0 ? (avgWin * wins.length) / (avgLoss * losses.length) : 0;
  const rrrAvg = avgLoss > 0 ? avgWin / avgLoss : 0;
  const expectancy = closedTrades.length > 0 ? (wins.length / closedTrades.length * avgWin - losses.length / closedTrades.length * avgLoss) : 0;
  const winRate = account?.win_rate || (closedTrades.length ? wins.length / closedTrades.length * 100 : 0);
  const totalTrades = account?.total_trades || closedTrades.length;
  const totalPnl = balance - accountSize;

  const stats = [
    { label: 'Equity', value: `$${fmt(equity)}`, color: equity >= accountSize ? '#10b981' : '#ef4444', bar: true, barPct: (equity / accountSize) * 50 },
    { label: 'Balance', value: `$${fmt(balance)}`, color: '#60a5fa' },
    { label: 'Win Rate', value: winRate > 0 ? `${winRate.toFixed(1)}%` : '0%', color: winRate >= 50 ? '#10b981' : '#f59e0b', bar: true, barPct: winRate },
    { label: 'Avg. Profit', value: avgWin > 0 ? `+$${fmt(avgWin)}` : '—', color: '#10b981' },
    { label: 'Avg. Loss', value: avgLoss > 0 ? `-$${fmt(avgLoss)}` : '—', color: '#ef4444' },
    { label: 'Total Trades', value: totalTrades || '0', color: '#f1f5f9' },
    { label: 'Lots Traded', value: totalLots > 0 ? totalLots.toFixed(2) : '0', color: '#f1f5f9' },
    { label: 'Total P&L', value: totalPnl >= 0 ? `+$${fmt(totalPnl)}` : `-$${fmt(Math.abs(totalPnl))}`, color: totalPnl >= 0 ? '#10b981' : '#ef4444' },
    { label: 'Avg. RRR', value: rrrAvg > 0 ? rrrAvg.toFixed(2) : '—', color: '#f1f5f9' },
    { label: 'Expectancy', value: expectancy !== 0 ? `${expectancy >= 0 ? '+' : ''}$${fmt(expectancy)}` : '—', color: expectancy >= 0 ? '#10b981' : '#ef4444' },
    { label: 'Profit Factor', value: profitFactor > 0 ? profitFactor.toFixed(2) : '—', color: profitFactor >= 1.5 ? '#10b981' : profitFactor >= 1 ? '#f59e0b' : '#ef4444' },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(96,165,250,0.1)' }}>
            <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <span className="text-sm font-bold text-foreground">Statistics</span>
        </div>
        <SectionLabel>Synchronized From MT5</SectionLabel>
      </CardHeader>
      <div className="px-5 py-2">
        {stats.map(s => <StatRow key={s.label} label={s.label} value={s.value} valueColor={s.color} bar={s.bar} barPct={s.barPct} />)}
      </div>
    </Card>
  );
}

export function DailySummaryPanel({ tradeRecords }) {
  const rows = useMemo(() => {
    const byDay = {};
    tradeRecords.filter(t => t.status === 'closed' && t.close_time).forEach(t => {
      const day = (t.close_time || '').split('T')[0] || (t.close_time || '').split(' ')[0];
      if (!day) return;
      if (!byDay[day]) byDay[day] = { trades: 0, lots: 0, pnl: 0 };
      byDay[day].trades++;
      byDay[day].lots += t.lots || 0;
      byDay[day].pnl += t.pnl || 0;
    });
    return Object.entries(byDay).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 20)
      .map(([day, d]) => ({ day, trades: d.trades, lots: d.lots.toFixed(2), pnl: d.pnl }));
  }, [tradeRecords]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.1)' }}>
            <CalendarDays className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <span className="text-sm font-bold text-foreground">Daily Summary</span>
        </div>
        <SectionLabel>From MT5 Records</SectionLabel>
      </CardHeader>
      {rows.length === 0 ? (
        <div className="py-12 text-center text-sm text-white/30">No closed trades yet</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {['Date', 'Trades', 'Lots', 'Result'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-white/30">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.day} className="border-b hover:bg-white/[0.02] transition-colors" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  <td className="px-5 py-3 font-mono text-white/50 text-[11px]">
                    {new Date(r.day).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3 text-foreground font-semibold">{r.trades}</td>
                  <td className="px-5 py-3 font-mono text-white/50">{r.lots}</td>
                  <td className="px-5 py-3">
                    <span className={`px-3 py-1 rounded-lg text-[11px] font-bold font-mono ${r.pnl >= 0 ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>
                      {r.pnl >= 0 ? '+' : ''}${fmt(r.pnl)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}