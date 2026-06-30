import React, { useState } from 'react';
import { Loader2, Minus, Plus, Calculator } from 'lucide-react';

const VOLUME_PRESETS = [0.01, 0.10, 0.50, 1.00];

function fmtPrice(n, isHigh) {
  if (!n || isNaN(n)) return '--';
  return n >= 100 ? n.toFixed(2) : n.toFixed(5);
}

export default function MT5OrderPanel({ symbol, quote, volume, onVolume, onBuy, onSell, loading, leverage }) {
  const [tab, setTab] = useState('market');
  const [sl, setSl] = useState('');
  const [tp, setTp] = useState('');

  const bid = quote?.bid || 0;
  const ask = quote?.ask || 0;
  const spread = ask - bid;
  // Rough margin estimate: contract size 100000 for FX, volume * price / leverage
  const contractSize = symbol?.includes('XAU') ? 100 : symbol?.includes('XAG') ? 5000 : 100000;
  const margin = ask > 0 ? (volume * contractSize * ask) / leverage : 0;
  const pipValue = symbol?.includes('JPY') ? (volume * 1000) / 100 : volume * 10;

  const adjustVol = (delta) => {
    const next = Math.max(0.01, Math.round((volume + delta) * 100) / 100);
    onVolume(next);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2.5 border-b flex-shrink-0" style={{ borderColor: 'hsl(var(--border))' }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-white">{symbol}</div>
            <div className="text-[9px] text-muted-foreground">Spot Metals · Live</div>
          </div>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider"
            style={{ background: 'rgba(255,92,0,0.1)', color: 'hsl(var(--primary))', border: '1px solid rgba(255,92,0,0.2)' }}>
            {leverage ? `1:${leverage}` : '1:100'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-3 py-2 flex-shrink-0">
        {['market', 'pending'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors ${tab === t ? 'text-white' : 'text-muted-foreground'}`}
            style={tab === t ? { background: 'rgba(255,92,0,0.12)', border: '1px solid rgba(255,92,0,0.25)' } : { border: '1px solid hsl(var(--border))' }}>
            {t}
          </button>
        ))}
      </div>

      <div className="px-3 flex-1 overflow-y-auto">
        {/* Volume */}
        <div className="mb-3">
          <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block mb-1.5">Volume (lots)</label>
          <div className="flex items-center gap-1">
            <button onClick={() => adjustVol(-0.01)} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-white"
              style={{ background: 'hsl(var(--input))', border: '1px solid hsl(var(--border))' }}>
              <Minus className="w-3 h-3" />
            </button>
            <input type="number" step="0.01" min="0.01" value={volume}
              onChange={(e) => onVolume(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
              className="flex-1 text-center text-sm font-bold text-white tabular bg-transparent rounded-lg py-1.5 outline-none"
              style={{ background: 'hsl(var(--input))', border: '1px solid hsl(var(--border))' }} />
            <button onClick={() => adjustVol(0.01)} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-white"
              style={{ background: 'hsl(var(--input))', border: '1px solid hsl(var(--border))' }}>
              <Plus className="w-3 h-3" />
            </button>
          </div>
          <div className="flex gap-1 mt-1.5">
            {VOLUME_PRESETS.map(v => (
              <button key={v} onClick={() => onVolume(v)}
                className={`flex-1 py-1 rounded text-[10px] font-mono tabular transition-colors ${volume === v ? 'text-white' : 'text-muted-foreground hover:text-foreground'}`}
                style={volume === v ? { background: 'rgba(255,92,0,0.12)' } : { background: 'hsl(var(--input))' }}>
                {v.toFixed(2)}
              </button>
            ))}
          </div>
        </div>

        {/* SL / TP */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block mb-1">SL</label>
            <input type="number" step="0.00001" value={sl} onChange={(e) => setSl(e.target.value)} placeholder="--"
              className="w-full px-2.5 py-1.5 rounded-lg text-xs text-white tabular bg-transparent outline-none"
              style={{ background: 'hsl(var(--input))', border: '1px solid hsl(var(--border))' }} />
          </div>
          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block mb-1">TP</label>
            <input type="number" step="0.00001" value={tp} onChange={(e) => setTp(e.target.value)} placeholder="--"
              className="w-full px-2.5 py-1.5 rounded-lg text-xs text-white tabular bg-transparent outline-none"
              style={{ background: 'hsl(var(--input))', border: '1px solid hsl(var(--border))' }} />
          </div>
        </div>

        {/* Calculations */}
        <div className="rounded-lg p-2.5 space-y-1.5 mb-3" style={{ background: 'hsl(var(--input))' }}>
          <div className="flex justify-between text-[10px]">
            <span className="text-muted-foreground">Spread</span>
            <span className="text-white tabular font-mono">{spread ? spread.toFixed(spread >= 1 ? 2 : 5) : '--'} pts</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-muted-foreground">Margin</span>
            <span className="text-white tabular font-mono">${margin.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-muted-foreground">Pip value</span>
            <span className="text-white tabular font-mono">${pipValue.toFixed(2)}</span>
          </div>
        </div>

        <button className="w-full flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] text-muted-foreground hover:text-foreground transition-colors mb-1"
          style={{ border: '1px solid hsl(var(--border))' }}>
          <Calculator className="w-3 h-3" /> Position size calculator
        </button>
      </div>

      {/* Execution buttons */}
      <div className="p-3 pt-2 flex-shrink-0 space-y-2" style={{ borderTop: '1px solid hsl(var(--border))' }}>
        <button onClick={onSell} disabled={loading || !bid}
          className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(90deg,#f44336,#d32f2f)' }}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>SELL {fmtPrice(bid)}</>}
        </button>
        <button onClick={onBuy} disabled={loading || !ask}
          className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(90deg,#00c853,#00a040)' }}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>BUY {fmtPrice(ask)}</>}
        </button>
      </div>
    </div>
  );
}