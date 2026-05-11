import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Settings, TrendingUp, TrendingDown, Plus, Minus } from 'lucide-react';

// Mock data for demonstration
const TOOLS = [
  { id: 'crosshair', icon: '🎯' },
  { id: 'measure', icon: '📏' },
  { id: 'menu', icon: '☰' },
  { id: 'back', icon: '↶' },
  { id: 'tools', icon: '∿' },
  { id: 'trend', icon: '📈' },
  { id: 'text', icon: 'T' },
  { id: 'emoji', icon: '😊' },
  { id: 'magnet', icon: '🧲' },
  { id: 'info', icon: 'ⓘ' },
  { id: 'sound', icon: '🔊' },
  { id: 'light', icon: '💡' },
  { id: 'lock', icon: '🔒' },
  { id: 'eye', icon: '👁' },
];

export default function MobileTradeTerminal() {
  const [symbol, setSymbol] = useState('BTCUSD');
  const [lots, setLots] = useState(0.01);
  const [timeframe, setTimeframe] = useState('5m');
  const [showVolume, setShowVolume] = useState(false);
  const [activeTab, setActiveTab] = useState('chart');

  return (
    <div className="flex flex-col h-screen bg-black text-white" style={{ fontFamily: "'Roboto', sans-serif" }}>
      {/* Status Bar */}
      <div className="px-4 py-2 flex justify-between items-center text-xs border-b" style={{ borderColor: 'rgba(255,255,255,0.1)', background: '#0a0a0a' }}>
        <span>10:42</span>
        <div className="flex gap-1">
          <span>📶</span>
          <span>📡</span>
          <span className="text-green-400">30%</span>
        </div>
      </div>

      {/* Symbol & Tabs Bar */}
      <div className="px-3 py-2 border-b flex justify-between items-center" style={{ borderColor: 'rgba(255,255,255,0.1)', background: '#0f0f0f' }}>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold" style={{ background: 'rgba(100,150,255,0.1)', border: '1px solid rgba(100,150,255,0.3)' }}>
          {symbol} <ChevronDown className="w-3 h-3" />
        </button>
        <div className="flex gap-1 text-[10px]">
          <div className="px-2 py-1 text-center" style={{ color: '#888' }}>
            <div>⊞</div>
            <div>MARKETS</div>
          </div>
          <div className="px-2 py-1 text-center" style={{ color: '#888' }}>
            <div>📊</div>
            <div>TRADES</div>
          </div>
          <div className="px-2 py-1 text-center" style={{ color: '#888' }}>
            <div>💼</div>
            <div>P&L</div>
            <div>$0.00</div>
          </div>
        </div>
        <div className="text-[10px] text-center" style={{ color: '#888' }}>
          <div>💰</div>
          <div>$0.00</div>
        </div>
      </div>

      {/* Chart Tools Bar */}
      <div className="px-3 py-2 flex justify-between items-center border-b" style={{ borderColor: 'rgba(255,255,255,0.1)', background: '#0a0a0a' }}>
        <div className="flex gap-2 items-center text-xs">
          <span className="font-bold">{timeframe}</span>
          <button style={{ color: '#888' }}>☰</button>
          <button style={{ color: '#888' }}>∞</button>
          <button style={{ color: '#888' }}>↶</button>
        </div>
        <span className="text-xs" style={{ color: '#888' }}>unnamed</span>
        <button className="w-6 h-6 flex items-center justify-center rounded" style={{ border: '1px solid #555' }}>
          ⚙
        </button>
      </div>

      {/* Main Content - Left Sidebar + Chart + Right Ladder */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar Tools */}
        <div className="w-12 border-r flex flex-col items-center py-2 gap-2" style={{ borderColor: 'rgba(255,255,255,0.1)', background: '#070707' }}>
          {TOOLS.map((tool) => (
            <button key={tool.id} className="w-8 h-8 flex items-center justify-center rounded text-xs hover:opacity-70 transition-opacity" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              {tool.icon}
            </button>
          ))}
        </div>

        {/* Chart Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-black">
          {/* Price Display */}
          <div className="px-3 py-2 flex justify-between items-center text-sm border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <div className="flex items-center gap-1">
              <span className="text-green-400 text-lg">+</span>
              <span className="text-green-400 font-bold text-lg">80,642.20</span>
              <span className="text-xs ml-1">0.00 (0.00%)</span>
            </div>
            <span className="text-xs" style={{ color: '#888' }}>82,800.00</span>
          </div>

          {/* Volume Control */}
          {!showVolume && (
            <div className="px-3 py-2 flex justify-between items-center border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <span className="text-xs">Volume</span>
              <button onClick={() => setShowVolume(!showVolume)} className="text-xs">
                ↑
              </button>
            </div>
          )}

          {/* Chart Placeholder */}
          <div className="flex-1 relative px-3 overflow-y-auto" style={{ borderRight: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="absolute inset-0 flex items-center justify-center text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
              📊 Chart Area
            </div>

            {/* Price Ladder on Right */}
            <div className="absolute right-0 top-0 bottom-0 w-24 flex flex-col justify-between text-right pr-2 py-2 text-[10px]" style={{ background: 'linear-gradient(to left, rgba(0,0,0,0.8), transparent)' }}>
              {['82,800.00', '82,600.00', '82,400.00', '82,200.00', '82,000.00', '81,800.00', '81,600.00', '81,400.00', '81,200.00', '81,000.00', '80,800.00'].map((price, i) => (
                <div key={i} style={{ color: '#666' }}>{price}</div>
              ))}
            </div>
          </div>

          {/* Volume Chart */}
          {showVolume && (
            <div className="h-20 border-t flex items-end justify-center gap-0.5 px-2 py-1" style={{ borderColor: 'rgba(255,255,255,0.1)', background: '#0a0a0a' }}>
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="flex-1" style={{ background: i % 3 === 0 ? '#10b981' : '#ef4444', height: `${30 + Math.random() * 50}%` }} />
              ))}
              <div className="absolute bottom-1 left-2 text-[10px]">🅣</div>
              <div className="absolute bottom-1 right-2 text-[10px]">03:00 — 05:00</div>
            </div>
          )}

          {/* Bottom Controls */}
          <div className="px-3 py-2 border-t flex justify-between items-center text-xs" style={{ borderColor: 'rgba(255,255,255,0.1)', background: '#0a0a0a', color: '#888' }}>
            <button className="flex items-center gap-1">Date Range 📅</button>
            <span>04:42:26 UTC+1</span>
            <div className="flex gap-1">
              <button>%</button>
              <button>log</button>
              <button>auto</button>
            </div>
          </div>

          {/* Order Controls */}
          <div className="px-3 py-2 border-t flex justify-between items-center text-[10px]" style={{ borderColor: 'rgba(255,255,255,0.1)', background: '#0a0a0a', color: '#888' }}>
            <button>MARKET 📊</button>
            <button>RISK</button>
            <button>SL</button>
            <button>TP</button>
            <button>↑</button>
          </div>

          {/* Bottom Info */}
          <div className="px-3 py-1 text-center text-xs" style={{ background: '#0a0a0a', color: '#888' }}>
            Init. Margin: -$403.22 (0.40%)
          </div>
        </div>
      </div>

      {/* Trading Controls Bottom */}
      <div className="px-3 py-3 flex items-center justify-between gap-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)', background: '#000' }}>
        {/* SELL Button */}
        <button className="flex-1 py-3 rounded-lg font-bold text-white flex flex-col items-center gap-0.5" style={{ background: '#ef4444' }}>
          <TrendingDown className="w-4 h-4" />
          <span>80,642.20</span>
          <span className="text-xs">SELL</span>
        </button>

        {/* Lot Size Control */}
        <div className="flex flex-col items-center gap-2">
          <button className="flex items-center gap-2 px-2 py-1 rounded" style={{ border: '1px solid rgba(255,255,255,0.2)' }}>
            <Minus className="w-3 h-3" />
            <span className="text-sm font-bold">{lots}</span>
            <Plus className="w-3 h-3" />
          </button>
          <span className="text-[10px]" style={{ color: '#888' }}>Lots</span>
        </div>

        {/* BUY Button */}
        <button className="flex-1 py-3 rounded-lg font-bold text-white flex flex-col items-center gap-0.5" style={{ background: '#10b981' }}>
          <span className="text-xs">80,644.13</span>
          <TrendingUp className="w-4 h-4" />
          <span>BUY</span>
        </button>
      </div>
    </div>
  );
}