import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, Zap } from 'lucide-react';

function fmt(n, d = 2) { return (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }); }

export default function PerformanceMetrics({ account, trades }) {
  // Use REAL MT5 synced trade records
  const closedTrades = trades.filter(t => t.status === 'closed');
  const openTrades = trades.filter(t => t.status === 'open');
  const wins = closedTrades.filter(t => (t.pnl || 0) > 0);
  const losses = closedTrades.filter(t => (t.pnl || 0) < 0);
  
  // Calculate authentic performance metrics from actual trade history
  const avgWin = wins.length ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : 0;
  const avgLoss = losses.length ? Math.abs(losses.reduce((s, t) => s + t.pnl, 0) / losses.length) : 0;
  const totalLots = closedTrades.reduce((s, t) => s + (t.lots || 0), 0);
  const profitFactor = avgLoss > 0 && wins.length > 0 ? (avgWin * wins.length) / (avgLoss * losses.length) : 0;
  const rrrAvg = avgLoss > 0 ? avgWin / avgLoss : 0;
  const expectancy = closedTrades.length > 0 ? (wins.length / closedTrades.length * avgWin - losses.length / closedTrades.length * avgLoss) : 0;
  const winRate = closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0;

  const metrics = [
    { label: 'Win Rate', value: winRate > 0 ? `${winRate.toFixed(1)}%` : '0%', icon: TrendingUp, color: winRate >= 50 ? '#10b981' : winRate >= 30 ? '#f59e0b' : '#ef4444' },
    { label: 'Profit Factor', value: profitFactor > 0 ? profitFactor.toFixed(2) : '—', icon: TrendingUp, color: profitFactor >= 1.5 ? '#10b981' : profitFactor >= 1 ? '#f59e0b' : '#ef4444' },
    { label: 'Expectancy', value: expectancy !== 0 ? `$${fmt(expectancy)}` : '—', icon: Activity, color: expectancy >= 0 ? '#10b981' : '#ef4444' },
    { label: 'Avg R:R Ratio', value: rrrAvg > 0 ? `1:${rrrAvg.toFixed(2)}` : '—', icon: TrendingUp, color: '#f1f5f9' },
    { label: 'Avg Win', value: avgWin > 0 ? `+$${fmt(avgWin)}` : '—', icon: TrendingUp, color: '#10b981' },
    { label: 'Avg Loss', value: avgLoss > 0 ? `-$${fmt(avgLoss)}` : '—', icon: TrendingDown, color: '#ef4444' },
    { label: 'Total Lots', value: totalLots > 0 ? totalLots.toFixed(2) : '0', icon: Activity, color: '#f1f5f9' },
    { label: 'Winning Trades', value: wins.length, icon: TrendingUp, color: '#10b981' },
    { label: 'Losing Trades', value: losses.length, icon: TrendingDown, color: '#ef4444' },
    { label: 'Total Trades', value: closedTrades.length, icon: Activity, color: '#f1f5f9' },
    { label: 'Open Positions', value: openTrades.length, icon: Zap, color: '#f59e0b' },
  ];

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}>
      <div className="flex items-center justify-between px-5 py-4 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(96,165,250,0.1)' }}>
            <Activity className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <span className="text-sm font-bold text-foreground">Performance Metrics</span>
        </div>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((m, i) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="rounded-xl p-3"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon className="w-3 h-3" style={{ color: m.color }} />
                  <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wide">{m.label}</span>
                </div>
                <div className="text-lg font-black font-mono" style={{ color: m.color }}>{m.value}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}