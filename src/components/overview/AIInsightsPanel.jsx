import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Zap, TrendingUp, AlertTriangle, Star, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const DISCIPLINE_FACTORS = [
  { label: 'Risk Management', key: 'risk' },
  { label: 'Consistency', key: 'consistency' },
  { label: 'Patience', key: 'patience' },
  { label: 'Discipline', key: 'discipline' },
];

function ScoreBar({ label, value, color }) {
  return (
    <div>
      <div className="flex justify-between text-[9px] font-mono mb-1">
        <span className="text-white/40">{label}</span>
        <span style={{ color }}>{value}/10</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(value / 10) * 100}%` }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}80, ${color})`, boxShadow: `0 0 6px ${color}40` }}
        />
      </div>
    </div>
  );
}

function RadarChart({ scores }) {
  const cx = 80, cy = 80, r = 60;
  const labels = scores.map(s => s.label);
  const values = scores.map(s => s.value / 10);
  const n = scores.length;
  const angles = labels.map((_, i) => (i / n) * 2 * Math.PI - Math.PI / 2);

  const toXY = (angle, radius) => ({
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  });

  const outerPts  = angles.map(a => toXY(a, r));
  const valuePts  = angles.map((a, i) => toXY(a, r * values[i]));
  const outerPath = outerPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';
  const valuePath = valuePts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';

  return (
    <svg width={160} height={160}>
      {/* Grid */}
      {[0.25, 0.5, 0.75, 1].map(scale => (
        <path key={scale}
          d={outerPts.map((p, i) => {
            const x = cx + (p.x - cx) * scale;
            const y = cy + (p.y - cy) * scale;
            return `${i === 0 ? 'M' : 'L'}${x},${y}`;
          }).join(' ') + 'Z'}
          fill="none" stroke="rgba(0,149,255,0.08)" strokeWidth="1"
        />
      ))}
      {/* Axes */}
      {outerPts.map((p, i) => (
        <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(0,149,255,0.1)" strokeWidth="1" />
      ))}
      {/* Value area */}
      <path d={valuePath} fill="rgba(0,149,255,0.15)" stroke="#0095ff" strokeWidth="1.5" />
      {/* Labels */}
      {outerPts.map((p, i) => {
        const lx = cx + (p.x - cx) * 1.25;
        const ly = cy + (p.y - cy) * 1.25;
        return (
          <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
            fontSize="8" fill="rgba(255,255,255,0.4)" fontFamily="monospace">
            {labels[i].split(' ')[0]}
          </text>
        );
      })}
    </svg>
  );
}

export default function AIInsightsPanel({ account }) {
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const winRate = account?.win_rate || 0;
  const pnl     = account?.pnl || 0;
  const trades  = account?.total_trades || 0;
  const dd      = account?.daily_drawdown_used || 0;

  const disciplineScore = Math.min(10, Math.max(0, Math.round(
    (winRate / 10) * 0.4 + (pnl > 0 ? 8 : 4) * 0.3 + (dd < 2 ? 9 : dd < 4 ? 6 : 3) * 0.3
  )));

  const scores = [
    { label: 'Risk Management', value: dd < 2 ? 9 : dd < 4 ? 6 : 3, color: '#00f5a0' },
    { label: 'Consistency', value: Math.min(10, Math.round(winRate / 10)), color: '#0095ff' },
    { label: 'Patience', value: Math.min(10, Math.round((account?.trading_days || 0) * 1.5)), color: '#a855f7' },
    { label: 'Discipline', value: disciplineScore, color: '#f59e0b' },
  ];

  const generateInsight = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const prompt = `You are an expert prop trading coach. Analyze this trader's performance in 2-3 short bullet points (max 150 words total). Be direct and actionable.
Account: $${account?.account_size?.toLocaleString() || '100,000'} ${account?.challenge_type || 'two-step'} challenge
Win Rate: ${winRate.toFixed(1)}% | Trades: ${trades} | P&L: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} | Daily DD: ${dd.toFixed(2)}% | Phase: ${account?.phase || 'phase1'}
Provide: 1 strength, 1 weakness, 1 actionable tip.`;

      const result = await base44.integrations.Core.InvokeLLM({ prompt });
      setInsight(result);
      setGenerated(true);
    } catch {
      setInsight('• Maintain consistent risk management — never exceed 1% per trade.\n• Focus on high-probability setups during London & NY sessions.\n• Keep a daily trading journal to identify patterns in your decision-making.');
      setGenerated(true);
    }
    setLoading(false);
  };

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(8,12,24,0.95), rgba(12,18,35,0.95))',
        border: '1px solid rgba(168,85,247,0.15)',
        backdropFilter: 'blur(20px)',
      }}>
      <div className="px-6 py-4 border-b border-white/[0.04] flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-white tracking-wide flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-400" /> AI Trading Insights
          </h3>
          <p className="text-[10px] text-white/30 font-mono mt-0.5">Powered by intelligent analysis</p>
        </div>
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="px-2 py-1 rounded-full text-[9px] font-mono font-bold"
          style={{ background: 'rgba(168,85,247,0.15)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.3)' }}>
          BETA
        </motion.div>
      </div>

      <div className="p-6 space-y-5">
        {/* Radar + Scores */}
        <div className="flex items-center gap-6 flex-wrap">
          <RadarChart scores={scores} />
          <div className="flex-1 space-y-3 min-w-[180px]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-white/40 font-mono uppercase">Trader Score</span>
              <span className="text-2xl font-black" style={{ color: '#a855f7' }}>{disciplineScore * 10}</span>
            </div>
            {scores.map(s => <ScoreBar key={s.label} label={s.label} value={s.value} color={s.color} />)}
          </div>
        </div>

        {/* AI Insight */}
        <div>
          <AnimatePresence mode="wait">
            {!generated ? (
              <motion.button
                key="btn"
                onClick={generateInsight}
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                style={{
                  background: loading ? 'rgba(168,85,247,0.1)' : 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(0,149,255,0.1))',
                  border: '1px solid rgba(168,85,247,0.3)',
                  color: '#a855f7',
                }}>
                {loading
                  ? <><RefreshCw className="w-4 h-4 animate-spin" /> Analyzing...</>
                  : <><Zap className="w-4 h-4" /> Generate AI Analysis</>}
              </motion.button>
            ) : (
              <motion.div
                key="insight"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl text-[11px] leading-relaxed text-white/70 whitespace-pre-line"
                style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)' }}>
                {insight}
                <button onClick={() => { setGenerated(false); setInsight(''); }}
                  className="mt-3 flex items-center gap-1 text-[9px] font-mono text-purple-400/60 hover:text-purple-400">
                  <RefreshCw className="w-3 h-3" /> Regenerate
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}