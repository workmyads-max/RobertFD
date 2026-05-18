import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, Award } from 'lucide-react';

export default function TradeQualityPanel({ trades = [] }) {
  const stats = useMemo(() => {
    const closed = trades.filter(t => t.status === 'closed' && t.entry && t.close);
    if (closed.length === 0) return null;

    const withSL = closed.filter(t => t.sl);
    const withTP = closed.filter(t => t.tp);
    const slDiscipline = Math.round((withSL.length / closed.length) * 100);
    const tpDiscipline = Math.round((withTP.length / closed.length) * 100);

    // RR analysis
    const rrVals = closed.filter(t => t.sl && t.tp && t.entry).map(t => {
      const risk = Math.abs(t.entry - t.sl);
      const reward = Math.abs(t.tp - t.entry);
      return risk > 0 ? reward / risk : 0;
    }).filter(r => r > 0);
    const avgRR = rrVals.length > 0 ? rrVals.reduce((a, b) => a + b, 0) / rrVals.length : 0;

    // Winners vs losers analysis
    const winners = closed.filter(t => (t.pnl || 0) > 0);
    const losers = closed.filter(t => (t.pnl || 0) < 0);
    const avgWin = winners.length > 0 ? winners.reduce((a, t) => a + (t.pnl || 0), 0) / winners.length : 0;
    const avgLoss = losers.length > 0 ? Math.abs(losers.reduce((a, t) => a + (t.pnl || 0), 0) / losers.length) : 0;
    const profitFactor = avgLoss > 0 ? (avgWin * winners.length) / (avgLoss * losers.length) : 0;

    const quality = slDiscipline >= 80 && avgRR >= 1.5 ? 'Excellent' : slDiscipline >= 60 && avgRR >= 1 ? 'Good' : slDiscipline >= 40 ? 'Average' : 'Poor';
    const qualityColor = quality === 'Excellent' ? '#10b981' : quality === 'Good' ? '#6366f1' : quality === 'Average' ? '#f59e0b' : '#ef4444';

    return { slDiscipline, tpDiscipline, avgRR, profitFactor, avgWin, avgLoss, quality, qualityColor, total: closed.length, withSL: withSL.length, withTP: withTP.length };
  }, [trades]);

  if (!stats) return (
    <div className="rounded-2xl p-8 text-center"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <Target className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
      <p className="text-muted-foreground text-sm">No closed trades to analyze</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Quality Score Header */}
      <div className="rounded-2xl p-6 text-center"
        style={{ background: `${stats.qualityColor}08`, border: `1px solid ${stats.qualityColor}30` }}>
        <Award className="w-8 h-8 mx-auto mb-2" style={{ color: stats.qualityColor }} />
        <div className="text-3xl font-black mb-1" style={{ color: stats.qualityColor }}>{stats.quality}</div>
        <div className="text-sm text-muted-foreground">Overall Trade Quality</div>
        <div className="text-[11px] font-mono text-muted-foreground mt-1">Based on {stats.total} analyzed trades</div>
      </div>

      {/* Metrics Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {[
          { label: 'Stop Loss Discipline', value: `${stats.slDiscipline}%`, sub: `${stats.withSL}/${stats.total} trades have SL`, color: stats.slDiscipline >= 80 ? '#10b981' : stats.slDiscipline >= 60 ? '#f59e0b' : '#ef4444', desc: 'Higher = more disciplined risk management' },
          { label: 'Take Profit Usage', value: `${stats.tpDiscipline}%`, sub: `${stats.withTP}/${stats.total} trades have TP`, color: stats.tpDiscipline >= 60 ? '#10b981' : '#f59e0b', desc: 'Structured exits improve consistency' },
          { label: 'Avg Risk/Reward', value: `1:${stats.avgRR.toFixed(2)}`, sub: stats.avgRR >= 1.5 ? '✓ Excellent RR' : stats.avgRR >= 1 ? '~ Acceptable' : '✗ Below 1:1', color: stats.avgRR >= 1.5 ? '#10b981' : stats.avgRR >= 1 ? '#f59e0b' : '#ef4444', desc: 'Target minimum 1:1.5 RR ratio' },
          { label: 'Profit Factor', value: stats.profitFactor.toFixed(2), sub: stats.profitFactor >= 2 ? '✓ Strong' : stats.profitFactor >= 1.2 ? '~ Moderate' : '✗ Needs improvement', color: stats.profitFactor >= 2 ? '#10b981' : stats.profitFactor >= 1.2 ? '#f59e0b' : '#ef4444', desc: 'Gross profit ÷ gross loss' },
          { label: 'Avg Win', value: `$${stats.avgWin.toFixed(0)}`, sub: 'Per winning trade', color: '#10b981', desc: 'Average profit on winning trades' },
          { label: 'Avg Loss', value: `-$${stats.avgLoss.toFixed(0)}`, sub: 'Per losing trade', color: '#ef4444', desc: 'Average loss on losing trades' },
        ].map((m, i) => (
          <motion.div key={m.label}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="rounded-2xl p-5"
            style={{ background: `${m.color}06`, border: `1px solid ${m.color}20` }}>
            <div className="flex items-start justify-between mb-2">
              <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{m.label}</div>
              <div className="text-xl font-black" style={{ color: m.color }}>{m.value}</div>
            </div>
            <div className="text-xs font-semibold text-foreground mb-1">{m.sub}</div>
            <div className="text-[10px] text-muted-foreground">{m.desc}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}