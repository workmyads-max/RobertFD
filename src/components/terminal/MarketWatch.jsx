import React, { useState, useRef, useEffect } from 'react';
import { Search, Star, TrendingUp, TrendingDown } from 'lucide-react';
import { INSTRUMENTS, isMarketOpen } from './terminalConfig';

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

const CATEGORIES = ['All', 'Forex', 'Metals', 'Crypto', 'Indices', 'Stocks', 'Commodities'];

const CAT_DOT = {
  Forex: '#60a5fa', Metals: '#f59e0b', Crypto: '#a78bfa',
  Indices: '#34d399', Stocks: '#fb923c', Commodities: '#94a3b8',
};

export default function MarketWatch({ prices, selectedSymbol, onSelect }) {
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mw_favorites') || '["EUR/USD","XAU/USD","BTC/USD","TSLA","SPX500"]'); }
    catch { return ['EUR/USD', 'XAU/USD', 'BTC/USD', 'TSLA', 'SPX500']; }
  });
  const [activeCat, setActiveCat] = useState('All');
  const [favOnly, setFavOnly] = useState(false);

  const saveFavs = (f) => { setFavorites(f); try { localStorage.setItem('mw_favorites', JSON.stringify(f)); } catch {} };
  const toggleFav = (sym, e) => { e.stopPropagation(); saveFavs(favorites.includes(sym) ? favorites.filter(s => s !== sym) : [...favorites, sym]); };

  const filtered = INSTRUMENTS.filter(i => {
    const matchCat = activeCat === 'All' || i.category === activeCat;
    const matchQ   = !search || i.symbol.toLowerCase().includes(search.toLowerCase()) || (i.description || '').toLowerCase().includes(search.toLowerCase());
    const matchFav = !favOnly || favorites.includes(i.symbol);
    return matchCat && matchQ && matchFav;
  });

  return (
    <div className="flex flex-col h-full text-xs overflow-hidden" style={{ background: '#0d1117', fontFamily: "'JetBrains Mono', monospace" }}>

      {/* Search bar */}
      <div className="p-2 border-b flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <Search className="w-3 h-3 text-slate-600 flex-shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search…"
            className="flex-1 bg-transparent outline-none text-[10px] text-white placeholder:text-slate-600 font-mono" />
          {search && <button onClick={() => setSearch('')} className="text-slate-600 hover:text-slate-400 text-[11px]">×</button>}
        </div>
      </div>

      {/* Category filter */}
      <div className="flex border-b overflow-x-auto flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.05)', scrollbarWidth: 'none' }}>
        <button onClick={() => setFavOnly(!favOnly)}
          className={`px-2 py-1.5 text-[9px] flex-shrink-0 flex items-center transition-colors ${favOnly ? 'text-yellow-400' : 'text-slate-600'}`}>
          <Star className={`w-3 h-3 ${favOnly ? 'fill-yellow-400' : ''}`} />
        </button>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCat(cat)}
            className={`px-2 py-1.5 text-[8px] font-mono flex-shrink-0 whitespace-nowrap transition-colors border-b-2 ${activeCat === cat ? 'text-orange-400 border-orange-400' : 'text-slate-600 hover:text-slate-400 border-transparent'}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Column headers */}
      <div className="grid px-2 py-1.5 text-[7px] font-mono text-slate-600 uppercase tracking-wider border-b flex-shrink-0"
        style={{ gridTemplateColumns: '1fr 52px 52px', borderColor: 'rgba(255,255,255,0.04)' }}>
        <span>Symbol</span>
        <span className="text-center">Bid</span>
        <span className="text-right">Ask</span>
      </div>

      {/* Instrument rows */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,92,0,0.2) transparent' }}>
        {filtered.length === 0 && (
          <div className="flex items-center justify-center py-10 text-[9px] font-mono text-slate-700">No results</div>
        )}
        {filtered.map(inst => {
          const p = prices[inst.symbol];
          const isUp = (p?.pct || 0) >= 0;
          const isActive = selectedSymbol === inst.symbol;
          const isFav = favorites.includes(inst.symbol);
          const open = isMarketOpen(inst.symbol);
          const dot = CAT_DOT[inst.category] || '#666';

          return (
            <div key={inst.symbol}
              className="grid items-center px-2 py-1.5 border-b cursor-pointer transition-colors group"
              style={{
                gridTemplateColumns: '1fr 52px 52px',
                borderColor: 'rgba(255,255,255,0.03)',
                background: isActive ? `${dot}10` : 'transparent',
              }}
              onClick={() => onSelect(inst.symbol)}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}>

              {/* Symbol cell */}
              <div className="flex items-center gap-1.5 min-w-0">
                <span role="button" tabIndex={0}
                  onClick={e => toggleFav(inst.symbol, e)}
                  onKeyDown={e => e.key === 'Enter' && toggleFav(inst.symbol, e)}
                  className="flex-shrink-0 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ opacity: isFav ? 1 : undefined }}>
                  <Star className={`w-2.5 h-2.5 ${isFav ? 'fill-yellow-400 text-yellow-400' : 'text-slate-700'}`} />
                </span>
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

              {/* Bid */}
              <div className="text-center text-[9px] text-red-400/80">
                {p?.bid != null ? <PriceFlash value={p.bid} digits={inst.digits} /> : <span className="text-slate-700">—</span>}
              </div>

              {/* Ask */}
              <div className="text-right text-[9px] text-emerald-400/80">
                {p?.ask != null ? <PriceFlash value={p.ask} digits={inst.digits} /> : <span className="text-slate-700">—</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 border-t flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
        <span className="text-[7px] font-mono text-slate-700">{filtered.length} / {INSTRUMENTS.length} instruments</span>
      </div>
    </div>
  );
}