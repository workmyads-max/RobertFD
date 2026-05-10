import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Star } from 'lucide-react';
import { INSTRUMENTS } from './terminalConfig';

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
      {value?.toFixed(digits) ?? '—'}
    </span>
  );
}

export default function MarketWatch({ prices, selectedSymbol, onSelect }) {
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState(['EUR/USD', 'XAU/USD', 'GBP/USD']);
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', 'Forex', 'Metals', 'Crypto', 'Indices'];
  const filtered = INSTRUMENTS.filter(i => {
    const matchCat  = activeCategory === 'All' || i.category === activeCategory;
    const matchSearch = i.symbol.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const toggleFav = (sym, e) => {
    e.stopPropagation();
    setFavorites(prev => prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym]);
  };

  return (
    <div className="flex flex-col h-full text-xs" style={{ background: '#07070b' }}>
      {/* Search */}
      <div className="p-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Search className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search symbol…"
            className="flex-1 bg-transparent outline-none text-[10px] text-foreground placeholder:text-muted-foreground/40 font-mono" />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex border-b border-white/[0.06] overflow-x-auto flex-shrink-0">
        {categories.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`px-2 py-1.5 text-[9px] font-mono flex-shrink-0 transition-colors ${activeCategory === cat ? 'text-primary border-b border-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Headers */}
      <div className="grid grid-cols-4 px-2 py-1 text-[8px] font-mono text-muted-foreground/50 uppercase border-b border-white/[0.04]">
        <span className="col-span-2">Symbol</span>
        <span className="text-center">Bid</span>
        <span className="text-right">Ask</span>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto">
        {filtered.map(inst => {
          const p = prices[inst.symbol];
          const isUp = (p?.pct || 0) >= 0;
          const isActive = selectedSymbol === inst.symbol;
          const isFav = favorites.includes(inst.symbol);
          const spread = p?.bid && p?.ask ? ((p.ask - p.bid) * 10000).toFixed(1) : '—';

          return (
            <motion.button key={inst.symbol} onClick={() => onSelect(inst.symbol)}
              whileHover={{ x: 2 }}
              className={`w-full grid grid-cols-4 items-center px-2 py-1.5 border-b border-white/[0.03] text-left transition-all group ${isActive ? 'bg-primary/10' : 'hover:bg-white/[0.03]'}`}>
              <div className="col-span-2 flex items-center gap-1.5">
                <button onClick={e => toggleFav(inst.symbol, e)}>
                  <Star className={`w-2.5 h-2.5 ${isFav ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/20'}`} />
                </button>
                <div>
                  <div className={`font-bold text-[10px] ${isActive ? 'text-primary' : 'text-foreground'}`}>{inst.symbol}</div>
                  <div className={`text-[8px] ${isUp ? 'text-emerald-400/60' : 'text-red-400/60'}`}>{isUp ? '+' : ''}{(p?.pct || 0).toFixed(2)}%</div>
                </div>
              </div>
              <div className="text-center text-red-400/80 font-mono text-[10px]">
                {p?.bid ? <PriceFlash value={p.bid} digits={inst.digits} /> : '—'}
              </div>
              <div className="text-right text-emerald-400/80 font-mono text-[10px]">
                {p?.ask ? <PriceFlash value={p.ask} digits={inst.digits} /> : '—'}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}