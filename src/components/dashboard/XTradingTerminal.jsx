import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Plus, Minus, X, Activity, BarChart3, List, AlertCircle, ChevronDown } from 'lucide-react';

const INSTRUMENTS = [
  { symbol: 'EUR/USD', bid: 1.08312, ask: 1.08318, change: +0.0012, pct: +0.11 },
  { symbol: 'GBP/USD', bid: 1.26841, ask: 1.26849, change: -0.0024, pct: -0.19 },
  { symbol: 'BTC/USD', bid: 67420, ask: 67445, change: +1820, pct: +2.77 },
  { symbol: 'XAU/USD', bid: 2338.42, ask: 2338.90, change: +12.4, pct: +0.53 },
  { symbol: 'NAS100', bid: 18204, ask: 18208, change: -48, pct: -0.26 },
  { symbol: 'USD/JPY', bid: 154.82, ask: 154.86, change: +0.38, pct: +0.25 },
  { symbol: 'ETH/USD', bid: 3124.5, ask: 3125.8, change: +64.2, pct: +2.10 },
];

const OPEN_POSITIONS = [
  { id: 1, symbol: 'BTC/USD', type: 'BUY', size: 0.5, entry: 65600, current: 67420, pnl: +910, sl: 64000, tp: 70000 },
  { id: 2, symbol: 'EUR/USD', type: 'SELL', size: 2.0, entry: 1.0845, current: 1.0831, pnl: +280, sl: 1.0900, tp: 1.0750 },
  { id: 3, symbol: 'XAU/USD', type: 'BUY', size: 1.0, entry: 2350, current: 2338, pnl: -120, sl: 2300, tp: 2400 },
];

function MiniChart({ up = true }) {
  const pts = up
    ? '0,40 20,35 40,30 60,22 80,26 100,18 120,15 140,10 160,12 180,8 200,5'
    : '0,10 20,14 40,20 60,16 80,25 100,22 120,30 140,28 160,35 180,32 200,38';
  const color = up ? '#10b981' : '#ef4444';
  return (
    <svg viewBox="0 0 200 50" className="w-24 h-8">
      <defs>
        <linearGradient id={`mcg${up}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon fill={`url(#mcg${up})`} points={`${pts} 200,50 0,50`} />
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={pts} />
    </svg>
  );
}

function useTickingPrices(initial) {
  const [prices, setPrices] = useState(initial);
  useEffect(() => {
    const t = setInterval(() => {
      setPrices(p => p.map(inst => {
        const move = (Math.random() - 0.5) * inst.bid * 0.0003;
        const newBid = parseFloat((inst.bid + move).toFixed(inst.bid > 100 ? 2 : 5));
        const spread = inst.ask - inst.bid;
        return { ...inst, bid: newBid, ask: parseFloat((newBid + spread).toFixed(inst.bid > 100 ? 2 : 5)) };
      }));
    }, 800);
    return () => clearInterval(t);
  }, []);
  return prices;
}

export default function XTradingTerminal() {
  const prices = useTickingPrices(INSTRUMENTS);
  const [selectedInstrument, setSelectedInstrument] = useState(INSTRUMENTS[0]);
  const [orderType, setOrderType] = useState('BUY');
  const [lots, setLots] = useState('0.10');
  const [sl, setSl] = useState('');
  const [tp, setTp] = useState('');
  const [activeBottom, setActiveBottom] = useState('positions');
  const [positions, setPositions] = useState(OPEN_POSITIONS);

  const currentPrice = prices.find(p => p.symbol === selectedInstrument.symbol) || selectedInstrument;
  const equity = 104280 + positions.reduce((s, p) => s + p.pnl, 0);
  const floatingPnl = positions.reduce((s, p) => s + p.pnl, 0);

  const closePosition = (id) => setPositions(p => p.filter(pos => pos.id !== id));

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] -m-6 md:-m-8">
      {/* Terminal header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 flex-shrink-0"
        style={{ background: 'rgba(6,6,8,0.98)' }}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono text-emerald-400">RF XTRADING TERMINAL</span>
          </div>
          <span className="text-xs font-mono text-muted-foreground">RF-100423 • Standard • 1:100</span>
        </div>
        <div className="flex items-center gap-6 text-xs font-mono">
          <span className="text-muted-foreground">Balance: <span className="text-foreground">$100,000</span></span>
          <span className="text-muted-foreground">Equity: <span className={equity >= 100000 ? 'text-emerald-400' : 'text-red-400'}>${equity.toLocaleString()}</span></span>
          <span className="text-muted-foreground">Float: <span className={floatingPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>{floatingPnl >= 0 ? '+' : ''}${floatingPnl}</span></span>
          <span className="text-muted-foreground">Margin: <span className="text-foreground">$2,140</span></span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT — Watchlist */}
        <div className="w-48 border-r border-white/5 flex flex-col flex-shrink-0 overflow-y-auto"
          style={{ background: 'rgba(6,6,8,0.95)' }}>
          <div className="px-3 py-2 border-b border-white/5">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Watchlist</span>
          </div>
          {prices.map((inst) => {
            const isUp = inst.change >= 0;
            const isSelected = selectedInstrument.symbol === inst.symbol;
            return (
              <button key={inst.symbol} onClick={() => setSelectedInstrument(inst)}
                className={`w-full px-3 py-2.5 text-left border-b border-white/[0.03] transition-all ${isSelected ? 'bg-primary/10' : 'hover:bg-white/5'}`}>
                <div className="flex justify-between mb-0.5">
                  <span className="text-xs font-bold text-foreground">{inst.symbol}</span>
                  <span className={`text-[10px] font-mono ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>{isUp ? '+' : ''}{inst.pct.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[11px] font-mono text-muted-foreground">{inst.bid}</span>
                  <MiniChart up={isUp} />
                </div>
              </button>
            );
          })}
        </div>

        {/* CENTER — Chart area */}
        <div className="flex-1 flex flex-col" style={{ background: '#07070a' }}>
          {/* Price header */}
          <div className="flex items-center gap-6 px-5 py-3 border-b border-white/5">
            <div>
              <div className="text-xl font-black text-foreground">{currentPrice.symbol}</div>
              <div className={`text-sm font-mono ${currentPrice.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {currentPrice.bid} &nbsp;{currentPrice.change >= 0 ? '+' : ''}{currentPrice.change.toFixed(currentPrice.bid > 100 ? 2 : 5)} ({currentPrice.pct >= 0 ? '+' : ''}{currentPrice.pct.toFixed(2)}%)
              </div>
            </div>
            <div className="flex items-center gap-3 ml-auto text-xs font-mono text-muted-foreground">
              {['1m', '5m', '15m', '1h', '4h', '1D'].map(tf => (
                <button key={tf} className="px-2 py-1 rounded hover:bg-white/10 hover:text-foreground transition-colors">{tf}</button>
              ))}
            </div>
          </div>

          {/* Chart placeholder */}
          <div className="flex-1 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-full p-4">
                <svg viewBox="0 0 800 300" className="w-full h-full" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF5C00" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#FF5C00" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {/* Grid lines */}
                  {[0.2, 0.4, 0.6, 0.8].map(y => (
                    <line key={y} x1="0" y1={y * 300} x2="800" y2={y * 300} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                  ))}
                  {[0, 0.2, 0.4, 0.6, 0.8, 1].map(x => (
                    <line key={x} x1={x * 800} y1="0" x2={x * 800} y2="300" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                  ))}
                  {/* Candlestick-like bars */}
                  {Array.from({ length: 40 }, (_, i) => {
                    const x = (i / 40) * 800;
                    const up = Math.random() > 0.45;
                    const h = 20 + Math.random() * 60;
                    const y = 50 + Math.random() * 180;
                    return (
                      <g key={i}>
                        <line x1={x + 8} y1={y - 8} x2={x + 8} y2={y + h + 8} stroke={up ? 'rgba(16,185,129,0.5)' : 'rgba(239,68,68,0.5)'} strokeWidth="1" />
                        <rect x={x + 2} y={y} width="12" height={h} rx="1" fill={up ? 'rgba(16,185,129,0.7)' : 'rgba(239,68,68,0.7)'} />
                      </g>
                    );
                  })}
                  {/* Price line */}
                  <polyline fill="none" stroke="#FF5C00" strokeWidth="1.5" opacity="0.6"
                    points="0,220 40,210 80,195 120,200 160,180 200,175 240,155 280,165 320,145 360,150 400,130 440,125 480,110 520,115 560,100 600,108 640,90 680,95 720,80 760,85 800,72" />
                </svg>
              </div>
            </div>
            <div className="absolute top-4 left-4 text-[10px] font-mono text-muted-foreground/40">
              SIMULATED CHART — LIVE DATA IN PRODUCTION
            </div>
          </div>
        </div>

        {/* RIGHT — Order Panel */}
        <div className="w-56 border-l border-white/5 flex flex-col flex-shrink-0"
          style={{ background: 'rgba(6,6,8,0.95)' }}>
          <div className="px-4 py-3 border-b border-white/5">
            <div className="text-xs font-mono text-muted-foreground uppercase mb-2">Place Order</div>
            <div className="grid grid-cols-2 gap-1 mb-3">
              {['BUY', 'SELL'].map(t => (
                <button key={t} onClick={() => setOrderType(t)}
                  className="py-2 rounded-lg text-xs font-black transition-all"
                  style={{
                    background: orderType === t ? (t === 'BUY' ? '#10b981' : '#ef4444') : 'rgba(255,255,255,0.06)',
                    color: orderType === t ? 'white' : '#666',
                  }}>
                  {t === 'BUY' ? `▲ BUY ${currentPrice.ask}` : `▼ SELL ${currentPrice.bid}`}
                </button>
              ))}
            </div>

            {[
              { label: 'Lots', value: lots, set: setLots },
              { label: 'Stop Loss', value: sl, set: setSl, placeholder: 'Optional' },
              { label: 'Take Profit', value: tp, set: setTp, placeholder: 'Optional' },
            ].map(({ label, value, set, placeholder }) => (
              <div key={label} className="mb-2">
                <div className="text-[10px] font-mono text-muted-foreground mb-1">{label}</div>
                <input value={value} onChange={e => set(e.target.value)} placeholder={placeholder || ''}
                  className="w-full rounded-lg px-3 py-1.5 text-xs font-mono text-foreground outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
            ))}

            <div className="text-[10px] font-mono text-muted-foreground mb-2">Margin Required: ~$134</div>
            <button className="w-full py-2.5 rounded-lg text-xs font-black text-white transition-all hover:opacity-90"
              style={{ background: orderType === 'BUY' ? '#10b981' : '#ef4444' }}>
              {orderType === 'BUY' ? '▲' : '▼'} {orderType} {lots} {selectedInstrument.symbol}
            </button>
          </div>

          {/* Account metrics */}
          <div className="px-4 py-3 space-y-2">
            <div className="text-[10px] font-mono text-muted-foreground uppercase mb-2">Account Metrics</div>
            {[
              { label: 'Daily DD', value: '1.20%', warn: false },
              { label: 'Max DD', value: '2.10%', warn: false },
              { label: 'Target', value: '4.28% / 10%', warn: false },
              { label: 'Free Margin', value: '$97,860', warn: false },
              { label: 'Margin Level', value: '4872%', warn: false },
            ].map(({ label, value, warn }) => (
              <div key={label} className="flex justify-between text-[10px] font-mono">
                <span className="text-muted-foreground">{label}</span>
                <span className={warn ? 'text-red-400' : 'text-foreground'}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM — Positions/History */}
      <div className="border-t border-white/5 flex-shrink-0" style={{ background: 'rgba(6,6,8,0.98)', maxHeight: '200px' }}>
        <div className="flex items-center gap-0 px-4 border-b border-white/5">
          {['positions', 'orders', 'history'].map(t => (
            <button key={t} onClick={() => setActiveBottom(t)}
              className={`px-4 py-2.5 text-xs font-mono capitalize transition-colors ${activeBottom === t ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              {t} {t === 'positions' && `(${positions.length})`}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: '155px' }}>
          {activeBottom === 'positions' && (
            <table className="w-full text-[10px] font-mono">
              <thead>
                <tr className="text-muted-foreground border-b border-white/5">
                  {['Symbol', 'Type', 'Lots', 'Entry', 'Current', 'SL', 'TP', 'P&L', ''].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {positions.map(pos => (
                  <tr key={pos.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                    <td className="px-3 py-2 font-bold text-foreground">{pos.symbol}</td>
                    <td className={`px-3 py-2 font-bold ${pos.type === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}>{pos.type}</td>
                    <td className="px-3 py-2 text-muted-foreground">{pos.size}</td>
                    <td className="px-3 py-2 text-muted-foreground">{pos.entry}</td>
                    <td className="px-3 py-2 text-foreground">{pos.current}</td>
                    <td className="px-3 py-2 text-red-400/70">{pos.sl || '—'}</td>
                    <td className="px-3 py-2 text-emerald-400/70">{pos.tp || '—'}</td>
                    <td className={`px-3 py-2 font-bold ${pos.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{pos.pnl >= 0 ? '+' : ''}${pos.pnl}</td>
                    <td className="px-3 py-2">
                      <button onClick={() => closePosition(pos.id)} className="p-1 rounded hover:bg-red-500/20 text-red-400 transition-colors"><X className="w-3 h-3" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {activeBottom === 'history' && (
            <div className="px-4 py-3 text-xs text-muted-foreground font-mono">No closed trades yet.</div>
          )}
          {activeBottom === 'orders' && (
            <div className="px-4 py-3 text-xs text-muted-foreground font-mono">No pending orders.</div>
          )}
        </div>
      </div>
    </div>
  );
}