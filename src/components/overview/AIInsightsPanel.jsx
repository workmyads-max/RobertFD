import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Zap, RefreshCw, TrendingUp, Shield, Clock, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

function ScoreBar({ label, value, color }) {
  return (
    <div>
      <div className="flex justify-between text-[9px] font-mono mb-1">
        <span className="text-white/35">{label}</span>
        <span style={{ color }}>{value}/10</span>
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(value / 10) * 100}%` }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}70, ${color})`, boxShadow: `0 0 6px ${color}40` }}
        />
      </div>
    </div>
  );
}

export default function AIInsightsPanel({ account, trades = [] }) {
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const winRate = account?.win_rate || 0;
  const pnl     = account?.pnl || 0;
  const totalTrades = account?.total_trades || 0;
  const dd      = account?.daily_drawdown_used || 0;
  const maxDD   = account?.max_drawdown_used || 0;
  const tradingDays = account?.trading_days || 0;

  // Calculate real scores from actual data
  const closedTrades = trades.filter(t => t.status === 'closed');
  const winners = closedTrades.filter(t => t.pnl > 0);
  const realWinRate = closedTrades.length > 0 ? (winners.length / closedTrades.length) * 100 : winRate;
  const avgWin  = winners.length > 0 ? winners.reduce((s, t) => s + t.pnl, 0) / winners.length : 0;
  const losers  = closedTrades.filter(t => t.pnl <= 0);
  const avgLoss = losers.length > 0 ? Math.abs(losers.reduce((s, t) => s + t.pnl, 0) / losers.length) : 1;
  const rr      = avgLoss > 0 ? avgWin / avgLoss : 0;

  const riskScore      = Math.round(Math.min(10, Math.max(1, 10 - dd * 1.5)));
  const consistScore   = Math.round(Math.min(10, Math.max(1, realWinRate / 10)));
  const patienceScore  = Math.round(Math.min(10, tradingDays * 1.2));
  const disciplineScore= Math.round((riskScore * 0.4 + consistScore * 0.3 + (pnl > 0 ? 7 : 4) * 0.3));
  const overallScore   = Math.round((riskScore + consistScore + patienceScore + disciplineScore) / 4 * 10);

  const scores = [
    { label: 'Risk Mgmt', value: riskScore, color: '#00f5a0' },
    { label: 'Consistency', value: consistScore, color: '#0095ff' },
    { label: 'Patience', value: patienceScore, color: '#a855f7' },
    { label: 'Discipline', value: disciplineScore, color: '#f59e0b' },
  ];

  const generateInsight = async () => {
    if (loading) return;
    setLoading(true);
    try {
      // Build rich context from real trade data
      const symbols = [...new Set(closedTrades.map(t => t.symbol))];
      const bySymbol = {};
      symbols.forEach(sym => {
        const symTrades = closedTrades.filter(t => t.symbol === sym);
        bySymbol[sym] = {
          trades: symTrades.length,
          pnl: symTrades.reduce((s, t) => s + (t.pnl || 0), 0).toFixed(2),
          winRate: symTrades.length > 0 ? ((symTrades.filter(t=>t.pnl>0).length / symTrades.length) * 100).toFixed(0) : 0,
        };
      });

      const prompt = `You are an expert prop trading coach at a professional funded trading firm. Analyze this trader's REAL performance data and provide 3 specific, actionable insights. Be direct, professional, and data-driven. Max 180 words total.

Account: $${(account?.account_size || 100000).toLocaleString()} ${account?.challenge_type || 'two-step'} | Phase: ${account?.phase || 'phase1'} | Status: ${account?.status || 'active'}
Real Win Rate: ${realWinRate.toFixed(1)}% | Total Trades: ${closedTrades.length} | Net P&L: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}
Daily DD Used: ${dd.toFixed(2)}% | Max DD Used: ${maxDD.toFixed(2)}% | Trading Days: ${tradingDays}
Avg Win: $${avgWin.toFixed(2)} | Avg Loss: $${avgLoss.toFixed(2)} | R:R Ratio: ${rr.toFixed(2)}
Most Traded Symbols: ${symbols.slice(0, 5).join(', ') || 'N/A'}
${symbols.length > 0 ? 'Symbol Breakdown: ' + Object.entries(bySymbol).slice(0,3).map(([s,v]) => `${s}(${v.trades}T,${v.winRate}%WR,$${v.pnl}PnL)`).join(' | ') : ''}

Provide exactly 3 bullet points:
• [Strength]: What this trader does well
• [Weakness]: The main risk/problem area  
• [Action]: One specific improvement to implement now`;

      const result = await base44.integrations.Core.InvokeLLM({ prompt });
      setInsight(result);
      setGenerated(true);
    } catch {
      setInsight(
        `• Strong risk management foundation - daily DD usage of ${dd.toFixed(2)}% shows disciplined approach.\n` +
        `• Win rate of ${realWinRate.toFixed(1)}% needs improvement - aim for 55%+ with better entry timing.\n` +
        `• Action: Focus on R:R ratio above 1.5:1. ${rr < 1.5 ? 'Currently below target - tighten stop losses and extend take profits.' : 'Good - maintain this discipline.'}`
      );
      setGenerated(true);
    }
    setLoading(false);
  };

  return (
    <div className="rounded-2xl overflow-hidden h-full"
      style={{
        background: 'linear-gradient(135deg, rgba(10,14,28,0.97), rgba(14,20,38,0.95))',
        border: '1px solid rgba(168,85,247,0.12)',
        backdropFilter: 'blur(20px)',
      }}>
      <div className="px-5 py-4 border-b border-white/[0.04] flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white/90 flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-400/80" /> AI Trading Coach
          </h3>
          <p className="text-[9px] text-white/25 font-mono mt-0.5">Real-time performance analysis</p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
          <span className="text-[9px] font-mono text-purple-400/70">LIVE DATA</span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Score summary */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl p-3 text-center"
            style={{ background: 'rgba(168,85,247,0.07)', border: '1px solid rgba(168,85,247,0.15)' }}>
            <div className="text-2xl font-black" style={{ color: '#a855f7' }}>{overallScore}</div>
            <div className="text-[9px] text-white/30 font-mono">Trader Score</div>
          </div>
          <div className="rounded-xl p-3 space-y-1.5">
            {scores.map(s => <ScoreBar key={s.label} {...s} />)}
          </div>
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Win Rate', value: `${realWinRate.toFixed(0)}%`, color: realWinRate >= 50 ? '#10b981' : '#f59e0b', Icon: TrendingUp },
            { label: 'R:R Ratio', value: `${rr.toFixed(2)}`, color: rr >= 1.5 ? '#10b981' : '#ef4444', Icon: Shield },
            { label: 'Trade Days', value: tradingDays, color: '#60a5fa', Icon: Clock },
          ].map(({ label, value, color, Icon: ItemIcon }) => (
            <div key={label} className="rounded-xl p-2.5 text-center"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <ItemIcon className="w-3 h-3 mx-auto mb-1" style={{ color }} />
              <div className="text-sm font-bold font-mono" style={{ color }}>{value}</div>
              <div className="text-[8px] text-white/25 font-mono">{label}</div>
            </div>
          ))}
        </div>

        {/* AI Insight */}
        <AnimatePresence mode="wait">
          {!generated ? (
            <motion.button key="btn" onClick={generateInsight} disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }} whileTap={{ scale: 0.98 }}
              className="w-full py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
              style={{
                background: loading ? 'rgba(168,85,247,0.07)' : 'rgba(168,85,247,0.12)',
                border: '1px solid rgba(168,85,247,0.25)',
                color: '#c084fc',
              }}>
              {loading
                ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Analyzing your trades...</>
                : <><Zap className="w-3.5 h-3.5" /> Generate AI Analysis</>}
            </motion.button>
          ) : (
            <motion.div key="insight" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl text-[11px] leading-relaxed text-white/60 whitespace-pre-line"
              style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.15)' }}>
              {insight}
              <button onClick={() => { setGenerated(false); setInsight(''); }}
                className="mt-3 flex items-center gap-1 text-[9px] font-mono text-purple-400/50 hover:text-purple-400 transition-colors">
                <RefreshCw className="w-3 h-3" /> Regenerate
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}