import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Target, Shield, Activity, RefreshCw, 
  BarChart3, AlertTriangle, Clock, Zap, DollarSign, Layers 
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

// ─── AI Signal Fetcher ───────────────────────────────────────────────────────
async function fetchXAUUSDSignal() {
  const now = new Date();
  const timestamp = now.toISOString();

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a world-class institutional gold (XAUUSD) trader with 20+ years of experience. Perform a comprehensive multi-timeframe technical and fundamental analysis for XAUUSD right now (${timestamp}).

Use your web search capability to fetch the LATEST real-time data:
1. Current XAUUSD spot price (live bid/ask)
2. Key technical levels: H4 and D1 support/resistance zones, pivot points
3. Technical indicators on H1, H4, D1: RSI (14), MACD, 50 & 200 EMA, Bollinger Bands
4. Market structure: higher highs/lower lows, trend direction, key chart patterns
5. Fundamental drivers: USD DXY index level, Fed rate expectations (CME FedWatch), US bond yields (10Y), gold ETF flows, geopolitical risk factors
6. Upcoming high-impact news events that could affect gold in the next 6 hours
7. Volume profile and order flow context (if available)

Your trading strategy:
- ONLY generate a signal when there is a confluence of at least 3 confirming factors across different timeframes
- Prioritize trend-following setups on H4/D1 timeframe (highest probability)
- Use Fibonacci retracement levels (0.382, 0.5, 0.618) for entry zones on pullbacks
- Set TP at the next structural S/R level with at least 1:2 risk-reward
- Set SL just beyond the recent structural level that would invalidate the setup
- If market conditions are unclear or ranging with no clear direction, DO NOT force a signal — state "NO SIGNAL" for direction

Return a detailed signal analysis. If you have strong conviction (3+ confluences), provide the trade signal. Otherwise return "NO SIGNAL" with explanation why.`,

    add_context_from_internet: true,
    model: 'gemini_3_flash',

    response_json_schema: {
      type: 'object',
      properties: {
        signal: {
          type: 'object',
          properties: {
            direction: { type: 'string', description: 'BUY, SELL, or NO_SIGNAL' },
            confidence: { type: 'number', description: '0-100 confidence score' },
            entry_price: { type: 'number', description: 'Suggested entry price' },
            take_profit: { type: 'number', description: 'Take profit level' },
            stop_loss: { type: 'number', description: 'Stop loss level' },
            risk_reward_ratio: { type: 'string', description: 'e.g. 1:2.5' },
            timeframe: { type: 'string', description: 'Primary timeframe for this trade' },
          }
        },
        current_price: { type: 'number' },
        spread: { type: 'string', description: 'Current bid/ask spread' },
        technical_analysis: {
          type: 'object',
          properties: {
            trend_h4: { type: 'string', description: 'BULLISH/BEARISH/NEUTRAL' },
            trend_d1: { type: 'string', description: 'BULLISH/BEARISH/NEUTRAL' },
            rsi_h4: { type: 'number' },
            rsi_d1: { type: 'number' },
            key_support: { type: 'number', description: 'Nearest key support level' },
            key_resistance: { type: 'number', description: 'Nearest key resistance level' },
            ema_alignment: { type: 'string', description: 'e.g. Bullish alignment (EMA50 > EMA200) or Bearish cross' },
          }
        },
        fundamentals: {
          type: 'object',
          properties: {
            dxy_level: { type: 'number', description: 'USD Dollar Index' },
            fed_sentiment: { type: 'string', description: 'Hawkish/Dovish/Neutral' },
            ten_year_yield: { type: 'string' },
            key_driver: { type: 'string', description: 'Primary fundamental driver for gold today' },
          }
        },
        analysis_summary: { type: 'string', description: '2-3 paragraph institutional-grade analysis' },
        risk_disclaimer: { type: 'string' },
        generated_at: { type: 'string' },
      }
    }
  });

  return result;
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function SignalCard({ signal, currentPrice }) {
  if (!signal) return null;

  const isBuy = signal.direction === 'BUY';
  const isNoSignal = signal.direction === 'NO_SIGNAL';
  const priceDiff = signal.entry_price && currentPrice 
    ? ((signal.entry_price - currentPrice) / currentPrice * 100).toFixed(2) 
    : null;

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
          Market conditions are unclear. No high-conviction setup detected. 
          Wait for clearer structure before entering.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono"
          style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b' }}>
          Confidence: {signal.confidence}%
        </div>
      </div>
    );
  }

  const entryDiff = (signal.entry_price || 0) - (currentPrice || 0);
  const tpPips = signal.entry_price && signal.take_profit 
    ? Math.abs(signal.take_profit - signal.entry_price).toFixed(1)
    : '—';
  const slPips = signal.entry_price && signal.stop_loss
    ? Math.abs(signal.stop_loss - signal.entry_price).toFixed(1)
    : '—';

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
      
      {/* Header */}
      <div className="px-6 py-5 flex items-center justify-between"
        style={{ 
          background: isBuy 
            ? 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02))' 
            : 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(239,68,68,0.02))',
          borderBottom: `1px solid ${isBuy ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}`
        }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ 
              background: isBuy ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
              border: `1px solid ${isBuy ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`
            }}>
            {isBuy 
              ? <TrendingUp className="w-6 h-6 text-emerald-400" />
              : <TrendingDown className="w-6 h-6 text-red-400" />
            }
          </div>
          <div>
            <div className={`text-2xl font-black ${isBuy ? 'text-emerald-400' : 'text-red-400'}`}>
              {signal.direction} XAUUSD
            </div>
            <div className="text-xs text-muted-foreground font-mono mt-0.5">
              {signal.timeframe} · Confidence {signal.confidence}%
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground font-mono">Spot Price</div>
          <div className="text-xl font-black text-white">{currentPrice?.toFixed(2) || '—'}</div>
          <div className="text-[10px] font-mono text-muted-foreground/60">Spread: {signal.spread || '—'}</div>
        </div>
      </div>

      {/* Price Levels */}
      <div className="grid grid-cols-3 divide-x" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="px-4 py-4 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1.5">
            <Target className="w-3 h-3 text-blue-400" />
            <span className="text-[10px] font-mono text-muted-foreground uppercase">Entry</span>
          </div>
          <div className="text-lg font-black text-blue-400">
            ${signal.entry_price?.toFixed(2) || '—'}
          </div>
          {priceDiff && (
            <div className={`text-[10px] font-mono mt-1 ${Number(priceDiff) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {Number(priceDiff) >= 0 ? '+' : ''}{priceDiff}% from spot
            </div>
          )}
        </div>
        <div className="px-4 py-4 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1.5">
            <DollarSign className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] font-mono text-muted-foreground uppercase">Take Profit</span>
          </div>
          <div className="text-lg font-black text-emerald-400">
            ${signal.take_profit?.toFixed(2) || '—'}
          </div>
          <div className="text-[10px] font-mono text-emerald-400/60 mt-1">+{tpPips} pips</div>
        </div>
        <div className="px-4 py-4 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1.5">
            <Shield className="w-3 h-3 text-red-400" />
            <span className="text-[10px] font-mono text-muted-foreground uppercase">Stop Loss</span>
          </div>
          <div className="text-lg font-black text-red-400">
            ${signal.stop_loss?.toFixed(2) || '—'}
          </div>
          <div className="text-[10px] font-mono text-red-400/60 mt-1">-{slPips} pips</div>
        </div>
      </div>

      {/* Risk/Reward badge */}
      <div className="px-6 py-3 flex items-center justify-center gap-6 border-t"
        style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.015)' }}>
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-white/40" />
          <span className="text-xs text-muted-foreground">R:R</span>
          <span className={`text-sm font-bold font-mono ${signal.risk_reward_ratio ? 'text-emerald-400' : 'text-muted-foreground'}`}>
            {signal.risk_reward_ratio || '—'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-white/40" />
          <span className="text-xs text-muted-foreground">Confidence</span>
          <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <motion.div 
              initial={{ width: 0 }} 
              animate={{ width: `${signal.confidence || 0}%` }}
              transition={{ duration: 1 }}
              className="h-full rounded-full"
              style={{ 
                background: (signal.confidence || 0) >= 70 ? '#10b981' : '#f59e0b' 
              }} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function TechnicalPanel({ ta }) {
  if (!ta) return null;
  const rows = [
    { label: 'H4 Trend', value: ta.trend_h4, color: ta.trend_h4 === 'BULLISH' ? '#10b981' : ta.trend_h4 === 'BEARISH' ? '#ef4444' : '#f59e0b' },
    { label: 'D1 Trend', value: ta.trend_d1, color: ta.trend_d1 === 'BULLISH' ? '#10b981' : ta.trend_d1 === 'BEARISH' ? '#ef4444' : '#f59e0b' },
    { label: 'RSI H4', value: ta.rsi_h4 != null ? ta.rsi_h4.toFixed(1) : '—', color: ta.rsi_h4 > 70 ? '#ef4444' : ta.rsi_h4 < 30 ? '#10b981' : '#f1f5f9' },
    { label: 'RSI D1', value: ta.rsi_d1 != null ? ta.rsi_d1.toFixed(1) : '—', color: ta.rsi_d1 > 70 ? '#ef4444' : ta.rsi_d1 < 30 ? '#10b981' : '#f1f5f9' },
    { label: 'Support', value: ta.key_support ? `$${ta.key_support.toFixed(2)}` : '—', color: '#60a5fa' },
    { label: 'Resistance', value: ta.key_resistance ? `$${ta.key_resistance.toFixed(2)}` : '—', color: '#f87171' },
    { label: 'EMA Alignment', value: ta.ema_alignment || '—', color: '#f1f5f9' },
  ];

  return (
    <div className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-blue-400" /> Technical Analysis
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

function FundamentalPanel({ fund }) {
  if (!fund) return null;
  const rows = [
    { label: 'USD DXY', value: fund.dxy_level ? fund.dxy_level.toFixed(2) : '—', color: '#f1f5f9' },
    { label: 'Fed Stance', value: fund.fed_sentiment || '—', 
      color: fund.fed_sentiment?.toLowerCase().includes('dovish') ? '#10b981' : fund.fed_sentiment?.toLowerCase().includes('hawkish') ? '#ef4444' : '#f59e0b' },
    { label: '10Y Yield', value: fund.ten_year_yield || '—', color: '#f1f5f9' },
    { label: 'Key Driver', value: fund.key_driver || '—', color: '#FF5C00' },
  ];

  return (
    <div className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
        <GlobeIcon className="w-4 h-4 text-emerald-400" /> Fundamentals
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

function GlobeIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function MarketSignals() {
  const [signal, setSignal] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadSignal = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchXAUUSDSignal();
      setSignal(data?.signal || null);
      setAnalysis({
        current_price: data?.current_price,
        spread: data?.spread,
        technical: data?.technical_analysis || null,
        fundamental: data?.fundamentals || null,
        summary: data?.analysis_summary || '',
        disclaimer: data?.risk_disclaimer || '',
        generatedAt: data?.generated_at || new Date().toISOString(),
      });
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      setError('Unable to generate signal. Please refresh.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSignal();
  }, []);

  const isNoSignal = signal?.direction === 'NO_SIGNAL';

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
            <Zap className="w-6 h-6 text-primary" /> XAUUSD Trade Signal
          </h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">
            AI-powered institutional analysis · {analysis?.generatedAt ? new Date(analysis.generatedAt).toLocaleString() : '—'}
            {lastUpdated && <span className="text-muted-foreground/50"> · Updated {lastUpdated}</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono"
            style={{ background: 'rgba(255,92,0,0.1)', border: '1px solid rgba(255,92,0,0.25)', color: '#FF5C00' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> LIVE
          </div>
          <button onClick={loadSignal} disabled={loading}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/5"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <div className="text-sm font-mono text-muted-foreground">Analyzing XAUUSD across multiple timeframes...</div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl"
          style={{ border: '1px dashed rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.03)' }}>
          <AlertTriangle className="w-8 h-8 text-red-400/60" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <button onClick={loadSignal} className="text-xs text-primary hover:underline">Try again</button>
        </div>
      )}

      {/* Signal Content */}
      {!loading && !error && signal && (
        <div className="space-y-6">
          {/* Signal Card */}
          <SignalCard signal={{...signal, spread: analysis?.spread || signal?.spread}} currentPrice={analysis?.current_price || signal?.entry_price} />

          {/* Analysis Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            <TechnicalPanel ta={analysis?.technical} />
            <FundamentalPanel fund={analysis?.fundamental} />
          </div>

          {/* Analysis Summary */}
          {analysis?.summary && (
            <div className="rounded-xl p-5" 
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" /> Institutional Analysis
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {analysis.summary}
              </p>
            </div>
          )}

          {/* Disclaimer */}
          <div className="text-center text-[10px] font-mono text-muted-foreground/30">
            {analysis?.disclaimer || 'AI-generated analysis · Not financial advice · Trade at your own risk'}
          </div>
        </div>
      )}
    </div>
  );
}