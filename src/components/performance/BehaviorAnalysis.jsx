import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Brain, AlertTriangle, Zap, TrendingDown } from 'lucide-react';

function ScoreRing({ score, label, color }) {
  const r = 28, circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-20 h-20">
        <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
          <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
          <motion.circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="6"
            strokeLinecap="round" strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            style={{ filter: `drop-shadow(0 0 4px ${color}80)` }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-base font-black" style={{ color }}>{score}</span>
        </div>
      </div>
      <div className="text-[10px] font-mono text-muted-foreground text-center mt-1 leading-tight">{label}</div>
    </div>
  );
}

export default function BehaviorAnalysis({ trades = [], account }) {
  const analysis = useMemo(() => {
    if (trades.length < 3) return null;
    const sorted = [...trades].sort((a, b) => new Date(a.open_time) - new Date(b.open_time));

    // Revenge trading: loss followed by larger lot
    let revengeCount = 0;
    for (let i = 1; i < sorted.length; i++) {
      if ((sorted[i-1].pnl || 0) < 0 && (sorted[i].lots || 0) > (sorted[i-1].lots || 0) * 1.5) revengeCount++;
    }

    // FOMO: rapid entry after loss (< 2 min)
    let fomoCount = 0;
    for (let i = 1; i < sorted.length; i++) {
      const diff = new Date(sorted[i].open_time) - new Date(sorted[i-1].close_time);
      if ((sorted[i-1].pnl || 0) < 0 && !isNaN(diff) && diff < 120000) fomoCount++;
    }

    // Lot consistency
    const lots = trades.map(t => t.lots).filter(Boolean);
    const avgLot = lots.reduce((a, b) => a + b, 0) / lots.length;
    const variance = lots.reduce((a, b) => a + Math.pow(b - avgLot, 2), 0) / lots.length;
    const stdDev = Math.sqrt(variance);
    const consistencyScore = Math.max(0, Math.round(100 - (stdDev / avgLot) * 50));

    // Discipline: no SL trades
    const noSLTrades = trades.filter(t => !t.sl);
    const disciplineScore = Math.round(100 - (noSLTrades.length / trades.length) * 60);

    // Emotional stability (inverse of revenge + fomo frequency)
    const emotionalScore = Math.max(0, Math.round(100 - ((revengeCount + fomoCount) / Math.max(trades.length / 10, 1)) * 20));

    const patterns = [];
    if (revengeCount > 2) patterns.push({ type: 'danger', label: 'Revenge Trading', desc: `${revengeCount} instances detected after losses`, icon: '🎯' });
    if (fomoCount > 2) patterns.push({ type: 'warning', label: 'FOMO Entries', desc: `${fomoCount} rapid re-entries after losses`, icon: '⚡' });
    if (noSLTrades.length > trades.length * 0.3) patterns.push({ type: 'danger', label: 'Missing Stop Losses', desc: `${noSLTrades.length} trades without SL`, icon: '⚠' });
    if (stdDev > avgLot * 0.5) patterns.push({ type: 'warning', label: 'Inconsistent Lot Sizing', desc: `High variance in position sizes detected`, icon: '📊' });

    return { revengeCount, fomoCount, consistencyScore, disciplineScore, emotionalScore, patterns };
  }, [trades]);

  if (!analysis) return (
    <div className="rounded-2xl p-8 text-center"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <Brain className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
      <p className="text-muted-foreground text-sm">Need at least 3 closed trades for behavioral analysis</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Score Rings */}
      <div className="rounded-2xl p-6"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2 mb-5">
          <Brain className="w-4 h-4 text-primary" />
          <span className="text-sm font-black text-foreground">Behavioral Intelligence Scores</span>
        </div>
        <div className="flex justify-around flex-wrap gap-6">
          <ScoreRing score={analysis.disciplineScore} label="Discipline Score" color="#10b981" />
          <ScoreRing score={analysis.emotionalScore} label="Emotional Stability" color="#6366f1" />
          <ScoreRing score={analysis.consistencyScore} label="Consistency Score" color="#FF5C00" />
        </div>
      </div>

      {/* Detected Patterns */}
      <div className="rounded-2xl p-6"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-black text-foreground">Detected Behavioral Patterns</span>
        </div>
        {analysis.patterns.length === 0 ? (
          <div className="text-center py-6 rounded-xl" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div className="text-2xl mb-2">✅</div>
            <div className="text-sm font-bold text-emerald-400">No harmful patterns detected</div>
            <div className="text-xs text-muted-foreground mt-1">Trading behavior looks disciplined</div>
          </div>
        ) : (
          <div className="space-y-3">
            {analysis.patterns.map((p, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                className="flex items-start gap-3 rounded-xl p-4"
                style={{
                  background: p.type === 'danger' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)',
                  border: `1px solid ${p.type === 'danger' ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.25)'}`,
                }}>
                <span className="text-xl flex-shrink-0">{p.icon}</span>
                <div>
                  <div className="text-sm font-bold" style={{ color: p.type === 'danger' ? '#ef4444' : '#f59e0b' }}>{p.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{p.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}