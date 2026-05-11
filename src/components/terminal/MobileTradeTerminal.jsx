import React, { useState } from 'react';
import { ChevronDown, Plus, Minus, TrendingUp, TrendingDown, X } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis } from 'recharts';

// Generate mock chart data
const generateChartData = () => {
  let price = 80800;
  return Array.from({ length: 50 }).map((_, i) => {
    price += (Math.random() - 0.48) * 50;
    return { time: i, price: Math.round(price * 100) / 100 };
  });
};

// Generate mock open positions
const generateOpenPositions = () => {
  const symbols = ['EUR/USD', 'GBP/USD', 'AUD/USD', 'USD/JPY', 'USD/CHF', 'CAD/USD', 'NZD/USD', 'EUR/GBP', 'EUR/JPY', 'GBP/JPY', 'AUD/JPY', 'CHF/JPY'];
  return symbols.map((sym, i) => ({
    id: i + 1,
    symbol: sym,
    direction: i % 2 === 0 ? 'BUY' : 'SELL',
    lots: (0.01 + i * 0.01).toFixed(2),
    entry: (80000 + Math.random() * 1000).toFixed(2),
    current: (80600 + Math.random() * 500).toFixed(2),
    pnl: (Math.random() * 500 - 250).toFixed(2),
    margin: (100 + i * 50).toFixed(0),
    sl: (79500 + Math.random() * 200).toFixed(2),
    tp: (81500 + Math.random() * 300).toFixed(2),
    time: '11:27:11 AM'
  }));
};

export default function MobileTradeTerminal() {
  const [symbol, setSymbol] = useState('EUR/USD');
  const [lots, setLots] = useState(0.01);
  const [timeframe, setTimeframe] = useState('1h');
  const [chartData] = useState(generateChartData());
  const [positions] = useState(generateOpenPositions());
  const currentPrice = 1.17683;
  const priceChange = 0.00042;
  const priceChangePercent = 0.036;

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2 border-b flex justify-between items-center" style={{ borderColor: 'rgba(255,255,255,0.1)', background: '#0a0a0a' }}>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold" style={{ background: 'rgba(255,92,0,0.15)', border: '1px solid rgba(255,92,0,0.3)' }}>
          {symbol} <ChevronDown className="w-3.5 h-3.5" />
        </button>
        <div className="text-[10px] font-mono" style={{ color: '#666' }}>11:27:11 UTC</div>
      </div>

      {/* Price Bar */}
      <div className="px-4 py-2 border-b flex justify-between items-center" style={{ borderColor: 'rgba(255,255,255,0.08)', background: '#050505' }}>
        <div className="flex items-center gap-2">
          <div>
            <div className={`text-xl font-black ${priceChange < 0 ? 'text-red-400' : 'text-green-400'}`}>
              {currentPrice.toFixed(5)}
            </div>
            <div className={`text-xs font-mono ${priceChange < 0 ? 'text-red-400' : 'text-green-400'}`}>
              {priceChange > 0 ? '+' : ''}{priceChange.toFixed(5)} ({priceChangePercent > 0 ? '+' : ''}{priceChangePercent.toFixed(3)}%)
            </div>
          </div>
        </div>
        <div className="text-right text-xs">
          <div style={{ color: '#666' }}>1.17583</div>
          <div style={{ color: '#666' }}>1.17895</div>
        </div>
      </div>

      {/* Timeframe Selector */}
      <div className="px-4 py-1.5 border-b flex gap-1 overflow-x-auto" style={{ borderColor: 'rgba(255,255,255,0.08)', background: '#0a0a0a', scrollbarWidth: 'none' }}>
        {['1m', '5m', '15m', '1h', '4h', '1D', 'W', 'M'].map((tf) => (
          <button
            key={tf}
            onClick={() => {}}
            className={`px-2.5 py-1 rounded text-xs font-mono whitespace-nowrap transition-all ${tf === timeframe ? 'font-bold' : ''}`}
            style={{
              background: tf === timeframe ? 'rgba(255,92,0,0.2)' : 'rgba(255,255,255,0.05)',
              color: tf === timeframe ? '#FF5C00' : '#666',
              border: `1px solid ${tf === timeframe ? 'rgba(255,92,0,0.4)' : 'rgba(255,255,255,0.08)'}`
            }}>
            {tf}
          </button>
        ))}
      </div>

      {/* Chart - Bigger Area */}
      <div className="flex-1 px-2 py-2 overflow-hidden" style={{ background: '#0f0f0f', minHeight: '45%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 15, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF5C00" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#FF5C00" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" stroke="#333" style={{ fontSize: '9px' }} />
            <YAxis stroke="#333" style={{ fontSize: '9px' }} />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#FF5C00"
              dot={false}
              strokeWidth={2}
              fill="url(#colorPrice)"
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Lot Size & Trading Controls */}
      <div className="px-4 py-3 border-t flex items-center justify-between gap-3" style={{ borderColor: 'rgba(255,255,255,0.1)', background: '#000', flexShrink: 0 }}>
        {/* SELL */}
        <button className="flex-1 py-2.5 rounded-lg font-bold text-white text-xs transition-all hover:opacity-90 active:scale-95" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 4px 12px rgba(239,68,68,0.3)' }}>
          SELL
        </button>

        {/* Lot Control */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.04)' }}>
            <button onClick={() => setLots(Math.max(0.01, lots - 0.01))} className="text-xs hover:opacity-70">
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-xs font-bold w-6 text-center">{lots.toFixed(2)}</span>
            <button onClick={() => setLots(lots + 0.01)} className="text-xs hover:opacity-70">
              <Plus className="w-3 h-3" />
            </button>
          </div>
          <span className="text-[8px]" style={{ color: '#666' }}>Lots</span>
        </div>

        {/* BUY */}
        <button className="flex-1 py-2.5 rounded-lg font-bold text-white text-xs transition-all hover:opacity-90 active:scale-95" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
          BUY
        </button>
      </div>

      {/* Open Positions Table - Full Width */}
      <div className="flex-1 border-t flex flex-col overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.1)', background: '#000', minHeight: '55%' }}>
        {/* Table Header */}
        <div className="px-3 py-2 bg-black border-b flex items-center justify-between text-xs font-bold sticky top-0" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div style={{ width: '12%' }}>SYMBOL</div>
          <div style={{ width: '10%' }}>DIR</div>
          <div style={{ width: '10%' }}>LOTS</div>
          <div style={{ width: '12%' }}>ENTRY</div>
          <div style={{ width: '12%' }}>CURRENT</div>
          <div style={{ width: '12%' }}>P&L</div>
          <div style={{ width: '10%' }}>MARGIN</div>
          <div style={{ width: '8%' }}></div>
        </div>

        {/* Positions List */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#444 transparent' }}>
          {positions.map((pos) => (
            <div key={pos.id} className="px-3 py-2 border-b flex items-center justify-between text-xs hover:bg-white/[0.02] transition-colors" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              <div style={{ width: '12%' }} className="font-mono font-bold">{pos.symbol}</div>
              <div style={{ width: '10%', color: pos.direction === 'BUY' ? '#10b981' : '#ef4444' }} className="font-bold">
                {pos.direction === 'BUY' ? '▲' : '▼'} {pos.direction}
              </div>
              <div style={{ width: '10%' }} className="font-mono">{pos.lots}</div>
              <div style={{ width: '12%' }} className="font-mono">{pos.entry}</div>
              <div style={{ width: '12%' }} className="font-mono text-orange-400">{pos.current}</div>
              <div style={{ width: '12%', color: parseFloat(pos.pnl) >= 0 ? '#10b981' : '#ef4444' }} className="font-bold">
                {parseFloat(pos.pnl) >= 0 ? '+' : ''}{pos.pnl}
              </div>
              <div style={{ width: '10%' }} className="font-mono text-slate-400">${pos.margin}</div>
              <button style={{ width: '8%' }} className="text-slate-500 hover:text-red-400 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}