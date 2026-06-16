import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Target, Shield, Activity, RefreshCw, 
  BarChart3, AlertTriangle, Zap, DollarSign, Layers, Clock 
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

const TIMEFRAMES = [
  { id: 'M1',  label: 'M1',  desc: '1-Minute Scalping' },
  { id: 'M5',  label: 'M5',  desc: '5-Minute Intraday' },
  { id: 'M15', label: 'M15', desc: '15-Minute Swing' },
];

// ─── AI Signal Fetcher ───────────────────────────────────────────────────────
async function fetchXAUUSDSignal(timeframe) {
  const now = new Date();
  const timestamp = now.toISOString();

  const tfDescriptions = {
    M1:  '1-minute scalping chart — focus on micro price action, order flow, tick volume, tight S/R levels, and momentum bursts',
    M5:  '5-minute intraday chart — focus on short-term trends, VWAP, EMA crossovers, and immediate support/resistance zones',
    M15: '15-minute swing chart — focus on intraday structure, Fibonacci retracements, MACD divergences, and session-based levels',
  };

  const smcStrategy = `
SCALPING/SMC STRATEGY RULES (${timeframe}):
1. MARKET STRUCTURE: Identify the higher-timeframe trend first (M15 for M1, H1 for M5, H4 for M15). Only trade in direction of the higher timeframe trend.
2. ORDER BLOCKS: Find the most recent bullish/bearish order block that caused a strong displacement. Wait for price to return to that zone.
3. LIQUIDITY SWEEPS: Look for stop hunts at recent swing highs/lows. After a liquidity grab + displacement in opposite direction = entry confirmation.
4. FAIR VALUE GAPS (FVG): Identify imbalances between candles. Price often retraces to fill 50% of the FVG before continuing.
5. ENTRY: Enter on a lower timeframe confirmation (engulfing candle, pin bar rejection) at the order block / FVG zone.
6. STOP LOSS: Place 2-3 pips beyond the order block boundary or recent swing structure that would invalidate the setup.
7. TAKE PROFIT: First target at the nearest opposing liquidity pool. Second target at the next structural level or session high/low.
8. RISK MANAGEMENT: Risk 1% per trade. Minimum 1:2 risk-reward. If RR is less than 1:2, skip the trade.
9. CONFLUENCE REQUIRED: At least 3 of: trend alignment, order block reaction, FVG fill, RSI divergence, or liquidity sweep.
10. NO TRADE ZONES: Avoid trading during major news events (NFP, FOMC, CPI), avoid low-liquidity Asian session close overlap, avoid spread widening periods.`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are an elite XAUUSD scalper using Smart Money Concepts (SMC) and ICT methodology. Perform ${timeframe}-specific analysis for XAUUSD right now (${timestamp}).

Use web search for LIVE data:
1. Current XAUUSD spot price (bid/ask with spread)
2. ${tfDescriptions[timeframe]}
3. Three higher timeframes for trend context: ${timeframe === 'M1' ? 'M5, M15, H1' : timeframe === 'M5' ? 'M15, H1, H4' : 'H1, H4, D1'}
4. Key SMC levels: order blocks, breaker blocks, FVG zones, liquidity pools (equal highs/lows)
5. Session context: which session (London/NY/Asian) is active and what that means for gold
6. Recent economic data affecting gold in the last 2 hours

${smcStrategy}

Output: Complete signal analysis with SMC terminology. If the setup meets all confluence rules, provide the precise trade signal. If no valid setup exists, return NO_SIGNAL with the specific reason why.`,

    add_context_from_internet: true,
    model: 'gemini_3_flash',

    response_json_schema: {
      type: 'object',
      properties: {
        signal: {
          type: 'object',
          properties: {
            direction: { type: 'string', description: 'BUY, SELL, or NO_SIGNAL' },
            confidence: { type: 'number', description: '0-100' },
            entry_price: { type: 'number' },
            take_profit_1: { type: 'number', description: 'First TP target' },
            take_profit_2: { type: 'number', description: 'Second TP target' },
            stop_loss: { type: 'number' },
            risk_reward_ratio: { type: 'string', description: 'e.g. 1:2.5' },
            timeframe: { type: 'string' },
            lot_size_suggestion: { type: 'string', description: 'Based on 1% risk, e.g. 0.01 per $1000' },
          }
        },
        current_price: { type: 'number' },
        spread: { type: 'string' },
        smc_analysis: {
          type: 'object',
          properties: {
            higher_tf_trend: { type: 'string', description: 'BULLISH/BEARISH/NEUTRAL with the H4/D1/H1 direction' },
            order_block_zone: { type: 'string', description: 'e.g. 2650.50 - 2652.00 (Bullish OB)' },
            fvg_zone: { type: 'string', description: 'Fair Value Gap zone if present' },
            liquidity_pools: { type: 'string', description: 'Key liquidity targets above/below' },
            session_bias: { type: 'string', description: 'London/NY/Asian session and its typical gold behavior' },
          }
        },
        technical_levels: {
          type: 'object',
          properties: {
            pivot_point: { type: 'number' },
            r1: { type: 'number' },
            r2: { type: 'number' },
            s1: { type: 'number' },
            s2: { type: 'number' },
            daily_open: { type: 'number' },
          }
        },
        analysis_summary: { type: 'string' },
        risk_disclaimer: { type: 'string' },
        generated_at: { type: 'string' },
      }
    }
  });

  return result;
}

// ─── Signal Card ─────────────────────────────────────────────────────────────
function SignalCard({ signal, currentPrice }) {
  if (!signal) return null;

  const isBuy = signal.direction === 'BUY';
  const isNoSignal = signal.direction === 'NO_SIGNAL';

  if (isNoSignal) {
    return (
      <div className="rounded-2xl p-6 text-center"
        style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)' }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(245,158,11,0.08)' }}>
          <AlertTriangle className="w-7 h-7 text-yellow-400" />
        </div>
        <h3 className="text-lg font-bold text-yellow-400 mb-2">No Trade Signal</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          No valid SMC setup detected. Wait for a higher-probability confluence before entering.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono"
          style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b' }}>
          Confidence: {signal.confidence}%
        </div>
      </div>
    );
  }

  const priceDiff = signal.entry_price && currentPrice 
    ? ((signal.entry_price - currentPrice) / currentPrice * 100).toFixed(2) 
    : null;

  const tp1Pips = signal.entry_price && signal.take_profit_1 
    ? Math.abs(signal.take_profit_1 - signal.entry_price).toFixed(1) : '—';
  const tp2Pips = signal.entry_price && signal.take_profit_2 
    ? Math.abs(signal.take_profit_2 - signal.entry_price).toFixed(1) : '—';
  const slPips = signal.entry_price && signal.stop_loss
    ? Math.abs(signal.stop_loss - signal.entry_price).toFixed(1) : '—';

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
      
      {/* Header */}
      <div className="px-6 py-5 flex items-center justify-between flex-wrap gap-4"
        style={{ 
          background: isBuy 
            ? 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02))' 
            : 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(239,68,68,0.02))',
          borderBottom: `1px solid ${isBuy ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}`
        }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ 
              background: isBuy ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
              border: `1px solid ${isBuy ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`
            }}>
            {isBuy 
              ? <TrendingUp className="w-7 h-7 text-emerald-400" />
              : <TrendingDown className="w-7 h-7 text-red-400" />
            }
          </div>
          <div>
            <div className={`text-2xl font-black ${isBuy ? 'text-emerald-400' : 'text-red-400'}`}>
              {signal.direction} XAUUSD
            </div>
            <div className="text-xs text-muted-foreground font-mono mt-0.5 flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: 'rgba(255,92,0,0.15)', color: '#FF5C00' }}>{signal.timeframe}</span>
              Confidence {signal.confidence}%
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground font-mono">Spot Price</div>
          <div className="text-2xl font-black text-white">${currentPrice?.toFixed(2) || '—'}</div>
          <div className="text-[10px] font-mono text-muted-foreground/60">Spread: {signal.spread || '—'}</div>
        </div>
      </div>

      {/* Price Levels */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="px-4 py-4 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1.5">
            <Target className="w-3 h-3 text-blue-400" />
            <span className="text-[10px] font-mono text-muted-foreground uppercase">Entry</span>
          </div>
          <div className="text-lg font-black text-blue-400">${signal.entry_price?.toFixed(2) || '—'}</div>
          {priceDiff && (
            <div className={`text-[10px] font-mono mt-1 ${Number(priceDiff) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {Number(priceDiff) >= 0 ? '+' : ''}{priceDiff}%
            </div>
          )}
        </div>
        <div className="px-4 py-4 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1.5">
            <Shield className="w-3 h-3 text-red-400" />
            <span className="text-[10px] font-mono text-muted-foreground uppercase">Stop Loss</span>
          </div>
          <div className="text-lg font-black text-red-400">${signal.stop_loss?.toFixed(2) || '—'}</div>
          <div className="text-[10px] font-mono text-red-400/60 mt-1">-{slPips} pips</div>
        </div>
        <div className="px-4 py-4 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1.5">
            <DollarSign className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] font-mono text-muted-foreground uppercase">TP 1</span>
          </div>
          <div className="text-lg font-black text-emerald-400">${signal.take_profit_1?.toFixed(2) || '—'}</div>
          <div className="text-[10px] font-mono text-emerald-400/60 mt-1">+{tp1Pips} pips</div>
        </div>
        <div className="px-4 py-4 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1.5">
            <DollarSign className="w-3 h-3 text-emerald-300" />
            <span className="text-[10px] font-mono text-muted-foreground uppercase">TP 2</span>
          </div>
          <div className="text-lg font-black text-emerald-300">${signal.take_profit_2?.toFixed(2) || '—'}</div>
          <div className="text-[10px] font-mono text-emerald-300/60 mt-1">+{tp2Pips} pips</div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="px-6 py-3 flex items-center justify-center gap-6 border-t flex-wrap"
        style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.015)' }}>
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-white/40" />
          <span className="text-xs text-muted-foreground">R:R</span>
          <span className="text-sm font-bold font-mono text-emerald-400">{signal.risk_reward_ratio || '—'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-white/40" />
          <span className="text-xs text-muted-foreground">Confidence</span>
          <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <motion.div 
              initial={{ width: 0 }} animate={{ width: `${signal.confidence || 0}%` }}
              transition={{ duration: 1 }}
              className="h-full rounded-full"
              style={{ background: (signal.confidence || 0) >= 70 ? '#10b981' : '#f59e0b' }} />
          </div>
        </div>
        {signal.lot_size_suggestion && (
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-muted-foreground">Suggested Size</span>
            <span className="text-xs font-bold font-mono text-primary">{signal.lot_size_suggestion}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SMC Analysis Panel ──────────────────────────────────────────────────────
function SMCAnalysisPanel({ smc }) {
  if (!smc) return null;
  const rows = [
    { label: 'HTF Trend', value: smc.higher_tf_trend || '—', 
      color: smc.higher_tf_trend?.includes('BULLISH') ? '#10b981' : smc.higher_tf_trend?.includes('BEARISH') ? '#ef4444' : '#f59e0b' },
    { label: 'Order Block', value: smc.order_block_zone || '—', color: '#60a5fa' },
    { label: 'FVG Zone', value: smc.fvg_zone || '—', color: '#c084fc' },
    { label: 'Liquidity Pools', value: smc.liquidity_pools || '—', color: '#f59e0b' },
    { label: 'Session Bias', value: smc.session_bias || '—', color: '#FF5C00' },
  ];

  return (
    <div className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-blue-400" /> SMC / ICT Analysis
      </h3>
      <div className="space-y-2.5">
        {rows.map(r => (
          <div key={r.label} className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-mono">{r.label}</span>
            <span className="text-xs font-bold font-mono text-right max-w-[60%]" style={{ color: r.color }}>{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LevelsPanel({ levels }) {
  if (!levels) return null;
  const rows = [
    { label: 'Pivot', value: levels.pivot_point ? `$${levels.pivot_point.toFixed(2)}` : '—', color: '#f1f5f9' },
    { label: 'R1', value: levels.r1 ? `$${levels.r1.toFixed(2)}` : '—', color: '#f87171' },
    { label: 'R2', value: levels.r2 ? `$${levels.r2.toFixed(2)}` : '—', color: '#ef4444' },
    { label: 'S1', value: levels.s1 ? `$${levels.s1.toFixed(2)}` : '—', color: '#60a5fa' },
    { label: 'S2', value: levels.s2 ? `$${levels.s2.toFixed(2)}` : '—', color: '#3b82f6' },
    { label: 'Daily Open', value: levels.daily_open ? `$${levels.daily_open.toFixed(2)}` : '—', color: '#f1f5f9' },
  ];

  return (
    <div className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
        <Target className="w-4 h-4 text-emerald-400" /> Key Levels
      </h3>
      <div className="space-y-2.5">
        {rows.map(r => (
          <div key={r.label} className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-mono">{r.label}</span>
            <span className="text-xs font-bold font-mono" style={{ color: r.color }}>{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function MarketSignals() {
  const [activeTf, setActiveTf] = useState('M1');
  const [signal, setSignal] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [levels, setLevels] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadSignal = useCallback(async (tf) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchXAUUSDSignal(tf);
      setSignal(data?.signal ? { ...data.signal, spread: data?.spread, timeframe: tf } : null);
      setAnalysis({
        current_price: data?.current_price,
        smc: data?.smc_analysis || null,
        summary: data?.analysis_summary || '',
        disclaimer: data?.risk_disclaimer || '',
        generatedAt: data?.generated_at || new Date().toISOString(),
      });
      setLevels(data?.technical_levels || null);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      setError('Unable to generate signal. Please refresh.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSignal(activeTf);
  }, [activeTf]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
            <Zap className="w-6 h-6 text-primary" /> XAUUSD Trade Signals
          </h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">
            SMC / ICT Scalping Strategy · {analysis?.generatedAt ? new Date(analysis.generatedAt).toLocaleString() : '—'}
            {lastUpdated && <span className="text-muted-foreground/50"> · Updated {lastUpdated}</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono"
            style={{ background: 'rgba(255,92,0,0.1)', border: '1px solid rgba(255,92,0,0.25)', color: '#FF5C00' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> LIVE
          </div>
          <button onClick={() => loadSignal(activeTf)} disabled={loading}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/5"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Timeframe Selector */}
      <div className="flex items-center gap-2 mb-6">
        <Clock className="w-4 h-4 text-muted-foreground" />
        {TIMEFRAMES.map(tf => (
          <button key={tf.id} onClick={() => { setActiveTf(tf.id); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all ${
              activeTf === tf.id 
                ? 'text-white' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            style={activeTf === tf.id 
              ? { background: 'rgba(255,92,0,0.15)', border: '1px solid rgba(255,92,0,0.3)' } 
              : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {tf.label}
            <span className="block text-[9px] font-normal opacity-60 mt-0.5">{tf.desc}</span>
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <div className="text-sm font-mono text-muted-foreground">Running SMC/ICT analysis on XAUUSD {activeTf}...</div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl"
          style={{ border: '1px dashed rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.03)' }}>
          <AlertTriangle className="w-8 h-8 text-red-400/60" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <button onClick={() => loadSignal(activeTf)} className="text-xs text-primary hover:underline">Try again</button>
        </div>
      )}

      {/* Signal Content */}
      {!loading && !error && signal && (
        <div className="space-y-6">
          <SignalCard signal={signal} currentPrice={analysis?.current_price || signal?.entry_price} />

          <div className="grid md:grid-cols-2 gap-4">
            <SMCAnalysisPanel smc={analysis?.smc} />
            <LevelsPanel levels={levels} />
          </div>

          {analysis?.summary && (
            <div className="rounded-xl p-5" 
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" /> Trade Analysis
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {analysis.summary}
              </p>
            </div>
          )}

          <div className="text-center text-[10px] font-mono text-muted-foreground/30">
            {analysis?.disclaimer || 'AI-generated SMC analysis · Not financial advice · Trade at your own risk'}
          </div>
        </div>
      )}
    </div>
  );
}