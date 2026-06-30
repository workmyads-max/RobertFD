import React, { useState } from 'react';
import { Search, Star } from 'lucide-react';

const SYMBOL_META = {
  EURUSD: { flag: '🇪🇺', cat: 'FX' }, GBPUSD: { flag: '🇬🇧', cat: 'FX' },
  USDJPY: { flag: '🇯🇵', cat: 'FX' }, USDCHF: { flag: '🇨🇭', cat: 'FX' },
  AUDUSD: { flag: '🇦🇺', cat: 'FX' }, USDCAD: { flag: '🇨🇦', cat: 'FX' },
  XAUUSD: { flag: '🥇', cat: 'Metals' }, XAGUSD: { flag: '🥈', cat: 'Metals' },
  BTCUSD: { flag: '₿', cat: 'Crypto' }, US500: { flag: '🇺🇸', cat: 'Indices' },
  US30: { flag: '🇺🇸', cat: 'Indices' }, USTEC: { flag: '🇺🇸', cat: 'Indices' },
};

function fmt(n) {
  if (!n || isNaN(n)) return '--';
  return n >= 100 ? n.toFixed(2) : n.toFixed(5);
}

export default function MT5Watchlist({ symbols, quotes, selected, onSelect }) {
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState(new Set(['XAUUSD', 'EURUSD']));

  const filtered = symbols.filter(s => s.toLowerCase().includes(search.toLowerCase()));

  const toggleFav = (e, sym) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(sym)) next.delete(sym); else next.add(sym);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-2.5 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'hsl(var(--input))' }}>
          <Search className="w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search symbol..."
            className="flex-1 bg-transparent text-xs text-white outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.map(sym => {
          const q = quotes[sym];
          const isSel = selected === sym;
          const meta = SYMBOL_META[sym] || { flag: '•', cat: '' };
          return (
            <button key={sym} onClick={() => onSelect(sym)}
              className="w-full flex items-center gap-2 px-2.5 py-2 transition-colors text-left"
              style={{
                background: isSel ? 'rgba(255,92,0,0.08)' : 'transparent',
                borderBottom: '1px solid hsl(var(--border))',
              }}>
              <Star
                className={`w-3 h-3 flex-shrink-0 cursor-pointer ${favorites.has(sym) ? 'text-primary fill-primary' : 'text-muted-foreground/40'}`}
                onClick={(e) => toggleFav(e, sym)}
              />
              <span className="text-sm flex-shrink-0">{meta.flag}</span>
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-bold ${isSel ? 'text-white' : 'text-foreground'}`}>{sym}</div>
                <div className="text-[9px] text-muted-foreground">{meta.cat}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-[10px] text-emerald-400 tabular font-mono">{fmt(q?.bid)}</div>
                <div className="text-[10px] text-foreground tabular font-mono">{fmt(q?.ask)}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}