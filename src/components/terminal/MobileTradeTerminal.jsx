import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, Minus, TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, ResponsiveContainer, XAxis, YAxis } from 'recharts';

// Generate mock chart data
const generateChartData = () => {
  let price = 80800;
  return Array.from({ length: 50 }).map((_, i) => {
    price += (Math.random() - 0.48) * 50;
    return { time: i, price: Math.round(price * 100) / 100, volume: Math.floor(Math.random() * 1000) + 500 };
  });
};

export default function MobileTradeTerminal() {
  const [symbol, setSymbol] = useState('BTCUSD');
  const [lots, setLots] = useState(0.01);
  const [timeframe, setTimeframe] = useState('5m');
  const [showVolume, setShowVolume] = useState(false);
  const [chartData] = useState(generateChartData());
  const currentPrice = 80642.20;
  const priceChange = -157.80;
  const priceChangePercent = -0.19;

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2 border-b flex justify-between items-center" style={{ borderColor: 'rgba(255,255,255,0.1)', background: '#0a0a0a' }}>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}>
          {symbol} <ChevronDown className="w-3.5 h-3.5" />
        </button>
        <div className="text-[10px] font-mono" style={{ color: '#666' }}>Time</div>
      </div>

      {/* Price Bar */}
      <div className="px-4 py-2 border-b flex justify-between items-center" style={{ borderColor: 'rgba(255,255,255,0.08)', background: '#050505' }}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono">📈</span>
          <div>
            <div className={`text-lg font-black ${priceChange < 0 ? 'text-red-400' : 'text-green-400'}`}>
              {currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className={`text-xs font-mono ${priceChange < 0 ? 'text-red-400' : 'text-green-400'}`}>
              {priceChange > 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent}%)
            </div>
          </div>
        </div>
      </div>

      {/* Timeframe Selector */}
      <div className="px-4 py-1.5 border-b flex gap-1 overflow-x-auto" style={{ borderColor: 'rgba(255,255,255,0.08)', background: '#0a0a0a', scrollbarWidth: 'none' }}>
        {['1m', '5m', '15m', '1h', '4h', '1D'].map((tf) => (
          <button
            key={tf}
            onClick={() => {}}
            className={`px-2.5 py-1 rounded text-xs font-mono whitespace-nowrap transition-all ${tf === timeframe ? 'font-bold' : ''}`}
            style={{
              background: tf === timeframe ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)',
              color: tf === timeframe ? '#3b82f6' : '#666',
              border: `1px solid ${tf === timeframe ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.08)'}`
            }}>
            {tf}
          </button>
        ))}
      </div>

      {/* Chart - Main Area */}
      <div className="flex-1 px-3 py-3 overflow-hidden" style={{ background: '#0f0f0f' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" stroke="#444" style={{ fontSize: '10px' }} />
            <YAxis stroke="#444" style={{ fontSize: '10px' }} domain={['dataMin - 100', 'dataMax + 100']} />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#3b82f6"
              dot={false}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorPrice)"
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Volume Chart */}
      {showVolume && (
        <div className="h-16 px-3 py-1.5 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)', background: '#0a0a0a' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <Bar dataKey="volume" fill="#6b7280" radius={[2, 2, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Lot Size & Trading Controls */}
      <div className="px-4 py-4 border-t flex items-center justify-between gap-3" style={{ borderColor: 'rgba(255,255,255,0.1)', background: '#000' }}>
        {/* SELL */}
        <button className="flex-1 py-3 rounded-lg font-bold text-white text-sm transition-all hover:opacity-90 active:scale-95" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 4px 12px rgba(239,68,68,0.3)' }}>
          <div className="text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>80,642.20</div>
          SELL
        </button>

        {/* Lot Control */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.04)' }}>
            <button onClick={() => setLots(Math.max(0.01, lots - 0.01))} className="text-xs hover:opacity-70">
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold w-8 text-center">{lots.toFixed(2)}</span>
            <button onClick={() => setLots(lots + 0.01)} className="text-xs hover:opacity-70">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <span className="text-[9px]" style={{ color: '#666' }}>Lots</span>
        </div>

        {/* BUY */}
        <button className="flex-1 py-3 rounded-lg font-bold text-white text-sm transition-all hover:opacity-90 active:scale-95" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
          <div className="text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>80,644.13</div>
          BUY
        </button>
      </div>
    </div>
  );
}