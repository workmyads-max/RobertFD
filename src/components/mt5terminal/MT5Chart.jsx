import React, { useState, useMemo } from 'react';
import { LineChart, Line, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

const TIMEFRAMES = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1'];

export default function MT5Chart({ symbol, quote, history }) {
  const [tf, setTf] = useState('M1');
  const mid = quote ? (quote.bid + quote.ask) / 2 : 0;
  const change = history.length >= 2 ? mid - history[0].price : 0;
  const isUp = change >= 0;

  const chartData = useMemo(
    () => history.map((h, i) => ({ i, price: h.price })),
    [history]
  );

  const min = chartData.length ? Math.min(...chartData.map(d => d.price)) : 0;
  const max = chartData.length ? Math.max(...chartData.map(d => d.price)) : 0;
  const pad = (max - min) * 0.1 || max * 0.001;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b flex-shrink-0" style={{ borderColor: 'hsl(var(--border))' }}>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-white">{symbol}</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'hsl(var(--muted-foreground))' }}>
            Spot
          </span>
          <div className="flex items-center gap-1.5">
            <span className={`text-sm font-bold tabular ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
              {mid ? mid.toFixed(quote && mid >= 100 ? 2 : 5) : '--'}
            </span>
            {isUp ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> : <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          {TIMEFRAMES.map(t => (
            <button key={t} onClick={() => setTf(t)}
              className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-colors ${tf === t ? 'text-white' : 'text-muted-foreground hover:text-foreground'}`}
              style={tf === t ? { background: 'rgba(255,92,0,0.15)' } : {}}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Quick order bar */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b flex-shrink-0" style={{ borderColor: 'hsl(var(--border))' }}>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: 'rgba(0,200,83,0.1)', border: '1px solid rgba(0,200,83,0.25)' }}>
          <span className="text-[9px] font-bold text-emerald-400">BUY</span>
          <span className="text-xs font-bold text-emerald-400 tabular">{quote?.ask?.toFixed(quote && quote.ask >= 100 ? 2 : 5) || '--'}</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: 'rgba(244,67,54,0.1)', border: '1px solid rgba(244,67,54,0.25)' }}>
          <span className="text-[9px] font-bold text-red-400">SELL</span>
          <span className="text-xs font-bold text-red-400 tabular">{quote?.bid?.toFixed(quote && quote.bid >= 100 ? 2 : 5) || '--'}</span>
        </div>
        <div className="ml-auto text-[10px] text-muted-foreground tabular">
          Spread: {quote?.spread ? (quote.spread >= 1 ? quote.spread.toFixed(2) : quote.spread.toFixed(5)) : '--'}
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0 relative">
        {chartData.length < 2 ? (
          <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
            Waiting for live price data from MT5...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <YAxis domain={[min - pad, max + pad]} hide />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }}
                labelStyle={{ display: 'none' }}
                formatter={(v) => [Number(v).toFixed(5), 'Price']}
              />
              <ReferenceLine y={mid} stroke="rgba(255,92,0,0.3)" strokeDasharray="2 2" />
              <Line
                type="monotone"
                dataKey="price"
                stroke={isUp ? '#00c853' : '#f44336'}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}