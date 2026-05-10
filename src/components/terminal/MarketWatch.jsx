import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Star, TrendingUp, TrendingDown } from 'lucide-react';
import { INSTRUMENTS, isMarketOpen } from './terminalConfig';

function PriceFlash({ value, digits }) {
  const [flash, setFlash] = useState(null);
  const prev = useRef(value);
  useEffect(() => {
    if (prev.current !== null && prev.current !== value) {
      setFlash(value > prev.current ? 'up' : 'down');
      const t = setTimeout(() => setFlash(null), 400);
      prev.current = value;
      return () => clearTimeout(t);
    }
    prev.current = value;
  }, [value]);
  return (
    <span className={`font-mono transition-colors duration-200 ${flash === 'up' ? 'text-emerald-300' : flash === 'down' ? 'text-red-300' : 'text-foreground'}`}>
      {value != null ? value.toFixed(digits) : '—'}
    </span>
  );
}

const CATEGORIES = ['All', 'Forex', 'Metals', 'Crypto', 'Indices', 'Stocks', 'Commodities'];

const CAT_COLORS = {
  Forex: '#60a5fa', Metals: '#f59e0b', Crypto: '#a78bfa',
  Indices: '#34d399', Stocks: '#fb923c', Commodities: '#94a3b8',
};

export default function MarketWatch({ prices, selectedSymbol, onSelect }) {
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mw_favorites') || '["EUR/USD","XAU/USD","BTC/USD","TSLA","SPX500"]'); }
    catch { return ['EUR/USD', 'XAU/USD', 'BTC/USD', 'TSLA', 'SPX500']; }
  });
  const [activeCategory, setActiveCategory] = useState('All');
  const [showFavOnly, setShowFavOnly] = useState(false);

  const saveFavs = (favs) => {
    setFavorites(favs);
    try { localStorage.setItem('mw_favorites', JSON.stringify(favs)); } catch {}
  };

  const filtered = INSTRUMENTS.filter(i => {
    const matchCat = activeCategory === 'All' || i.category === activeCategory;
    const matchSearch = !search || 
      i.symbol.toLowerCase().includes(search.toLowerCase()) ||
      (i.description || '').toLowerCase().includes(search.toLowerCase());
    const matchFav = !showFavOnly || favorites.includes(i.symbol);
    return matchCat && matchSearch && matchFav;
  });

  const toggleFav = (sym, e) => {
    e.stopPropagation();
    saveFavs(favorites.includes(sym) ? favorites.filter(s => s !== sym) : [...favorites, sym]);
  };

  return (
    <div className="flex flex-col h-full text-xs" style={{ background: '#07070b' }}>
      {/* Search */}
      <div className="p-2 border-b border-white/[0.06] flex-shrink-0">
        <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Search className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search symbol, name…"
            className="flex-1 bg-transparent outline-none text-[10px] text-foreground placeholder:text-muted-foreground/40 font-mono" />
          {search && (
            <button onClick={() => setSearch('')} className="text-muted-foreground/50 hover:text-muted-foreground text-[10px]">×</button>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex border-b border-white/[0.06] overflow-x-auto flex-shrink-0" style={{ scrollbarWidth: 'none' }}>
        <button onClick={() => setShowFavOnly(!showFavOnly)}
          className={`px-2 py-1.5 text-[8px] font-mono flex-shrink-0 transition-colors flex items-center gap-0.5 ${showFavOnly ? 'text-yellow-400' : 'text-muted-foreground'}`}>
          <Star className={`w-2.5 h-2.5 ${showFavOnly ? 'fill-yellow-400' : ''}`} />
        </button>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`px-2 py-1.5 text-[8px] font-mono flex-shrink-0 transition-colors whitespace-nowrap border-b-2 ${activeCategory === cat ? 'text-primary border-primary' : 'text-muted-foreground hover:text-foreground border-transparent'}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Headers */}
      <div className="grid grid-cols-4 px-2 py-1 text-[7px] font-mono text-muted-foreground/50 uppercase border-b border-white/[0.04] flex-shrink-0">
        <span className="col-span-2">Symbol</span>
        <span className="text-center">Bid</span>
        <span className="text-right">Ask</span>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
        {filtered.length === 0 && (
          <div className="flex items-center justify-center py-8 text-[10px] font-mono text-muted-foreground/30">
            No symbols found
          </div>
        )}
        {filtered.map(inst => {
          const p = prices[inst.symbol];
          const isUp = (p?.pct || 0) >= 0;
          const isActive = selectedSymbol === inst.symbol;
          const isFav = favorites.includes(inst.symbol);
          const marketOpen = isMarketOpen(inst.symbol);
          const catColor = CAT_COLORS[inst.category] || '#666';

          return (
            <motion.button key={inst.symbol} onClick={() => onSelect(inst.symbol)}
              className={`w-full grid grid-cols-4 items-center px-2 py-1.5 border-b border-white/[0.03] text-left transition-all group ${isActive ? '' : 'hover:bg-white/[0.03]'}`}
              style={{ background: isActive ? `${catColor}12` : 'transparent' }}>
              <div className="col-span-2 flex items-center gap-1.5">
                <button onClick={e => toggleFav(inst.symbol, e)} className="flex-shrink-0">
                  <Star className={`w-2.5 h-2.5 ${isFav ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/20'}`} />
                </button>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <div className="w-1 h-3 rounded-sm flex-shrink-0" style={{ background: catColor, opacity: 0.6 }} />
                    <span className={`font-bold text-[10px] truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>{inst.symbol}</span>
                    {!marketOpen && <span className="text-[7px] text-yellow-400/70 flex-shrink-0">🔒</span>}
                  </div>
                  <div className={`text-[7px] flex items-center gap-0.5 ${isUp ? 'text-emerald-400/60' : 'text-red-400/60'}`}>
                    {isUp ? <TrendingUp className="w-2 h-2" /> : <TrendingDown className="w-2 h-2" />}
                    {isUp ? '+' : ''}{(p?.pct || 0).toFixed(2)}%
                  </div>
                </div>
              </div>
              <div className="text-center text-red-400/80 font-mono text-[9px]">
                {p?.bid != null ? <PriceFlash value={p.bid} digits={inst.digits} /> : '—'}
              </div>
              <div className="text-right text-emerald-400/80 font-mono text-[9px]">
                {p?.ask != null ? <PriceFlash value={p.ask} digits={inst.digits} /> : '—'}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-2 py-1.5 border-t border-white/[0.06] flex-shrink-0"
        style={{ background: 'rgba(255,255,255,0.02)' }}>
        <span className="text-[8px] font-mono text-muted-foreground/40">
          {filtered.length} / {INSTRUMENTS.length} symbols
        </span>
      </div>
    </div>
  );
}