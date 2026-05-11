import React, { useRef, useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { INSTRUMENTS, isMarketOpen } from './terminalConfig';

const CAT_DOT = {
  Forex: '#60a5fa', Metals: '#f59e0b', Crypto: '#a78bfa',
  Indices: '#34d399', Stocks: '#fb923c', Commodities: '#94a3b8',
};

function PriceFlash({ value, digits }) {
  const [flash, setFlash] = useState(null);
  const prev = useRef(value);
  useEffect(() => {
    if (prev.current !== null && prev.current !== value) {
      setFlash(value > prev.current ? 'up' : 'down');
      const t = setTimeout(() => setFlash(null), 350);
      prev.current = value;
      return () => clearTimeout(t);
    }
    prev.current = value;
  }, [value]);
  return (
    <span className={`font-mono transition-colors duration-200 ${flash === 'up' ? 'text-emerald-300' : flash === 'down' ? 'text-red-300' : ''}`}>
      {value != null ? value.toFixed(digits) : '—'}
    </span>
  );
}

export default function MarketWatch({ prices, selectedSymbol, onSelect }) {
  return (
    <div className="flex flex-col h-full text-xs overflow-hidden" style={{ background: '#0d1117', fontFamily: "'JetBrains Mono', monospace" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b flex-shrink-0"
        style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.01)' }}>
        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Market Watch</span>
        <span className="text-[8px] font-mono text-slate-700">{INSTRUMENTS.length} symbols</span>
      </div>

      {/* Column headers */}
      <div className="grid px-2 py-1.5 text-[7px] font-mono text-slate-600 uppercase tracking-wider border-b flex-shrink-0"
        style={{ gridTemplateColumns: '1fr 50px 50px', borderColor: 'rgba(255,255,255,0.04)' }}>
        <span>Symbol</span>
        <span className="text-center text-red-500/60">Sell</span>
        <span className="text-right text-emerald-500/60">Buy</span>
      </div>

      {/* Instrument rows — fully scrollable */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,92,0,0.2) transparent' }}>
        {INSTRUMENTS.map(inst => {
          const p = prices[inst.symbol];
          const isUp = (p?.pct || 0) >= 0;
          const isActive = selectedSymbol === inst.symbol;
          const open = isMarketOpen(inst.symbol);
          const dot = CAT_DOT[inst.category] || '#666';

          return (
            <div key={inst.symbol}
              className="grid items-center px-2 py-1.5 border-b cursor-pointer group"
              style={{
                gridTemplateColumns: '1fr 50px 50px',
                borderColor: 'rgba(255,255,255,0.03)',
                background: isActive ? 'rgba(255,92,0,0.08)' : 'transparent',
                borderLeft: isActive ? '2px solid rgba(255,92,0,0.6)' : '2px solid transparent',
                transition: 'background 0.12s',
              }}
              onClick={() => onSelect(inst.symbol)}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}>

              {/* Symbol cell */}
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-1 h-3 rounded-full flex-shrink-0" style={{ background: dot, opacity: 0.7 }} />
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className={`text-[10px] font-bold truncate ${isActive ? 'text-orange-400' : 'text-slate-200'}`}>{inst.symbol}</span>
                    {!open && <span className="text-[7px] text-yellow-500/60">●</span>}
                  </div>
                  <div className={`text-[7px] flex items-center gap-0.5 ${isUp ? 'text-emerald-500/70' : 'text-red-500/70'}`}>
                    {isUp ? <TrendingUp className="w-2 h-2" /> : <TrendingDown className="w-2 h-2" />}
                    {isUp ? '+' : ''}{(p?.pct || 0).toFixed(2)}%
                  </div>
                </div>
              </div>

              <div className="text-center text-[9px] text-red-400/80">
                {p?.bid != null ? <PriceFlash value={p.bid} digits={inst.digits} /> : <span className="text-slate-700">—</span>}
              </div>
              <div className="text-right text-[9px] text-emerald-400/80">
                {p?.ask != null ? <PriceFlash value={p.ask} digits={inst.digits} /> : <span className="text-slate-700">—</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}