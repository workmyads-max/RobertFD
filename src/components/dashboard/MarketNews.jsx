import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Newspaper, TrendingUp, TrendingDown, Zap, Globe, Clock, ExternalLink } from 'lucide-react';

const NEWS = [
  { id: 1, title: 'Fed Signals Possible Rate Cut in Q3 as Inflation Cools to 2.4%', category: 'forex', sentiment: 'bullish', source: 'Reuters', time: '2m ago', tags: ['USD', 'FOMC', 'Rates'], breaking: true, summary: 'Federal Reserve officials hinted at a potential rate reduction following softer-than-expected CPI data released this morning.' },
  { id: 2, title: 'Bitcoin Surges Past $72,000 on ETF Inflows Record', category: 'crypto', sentiment: 'bullish', source: 'Bloomberg', time: '8m ago', tags: ['BTC', 'ETF', 'Crypto'], breaking: true, summary: 'Spot Bitcoin ETFs recorded $842M in net inflows yesterday, pushing total AUM past $60 billion for the first time.' },
  { id: 3, title: 'Apple Q2 Earnings Beat Estimates: $1.53 EPS vs $1.43 Expected', category: 'stocks', sentiment: 'bullish', source: 'CNBC', time: '15m ago', tags: ['AAPL', 'Earnings', 'Tech'], breaking: false, summary: 'Apple reported stronger-than-expected earnings driven by services revenue growth of 14% year-over-year.' },
  { id: 4, title: 'EUR/USD Falls Below 1.08 Ahead of ECB Rate Decision', category: 'forex', sentiment: 'bearish', source: 'FXStreet', time: '22m ago', tags: ['EUR', 'USD', 'ECB'], breaking: false, summary: 'The euro weakened as traders positioned ahead of Thursday\'s ECB meeting where a hold is widely anticipated.' },
  { id: 5, title: 'Gold Hits All-Time High at $2,450/oz Amid Dollar Weakness', category: 'forex', sentiment: 'bullish', source: 'Kitco', time: '35m ago', tags: ['XAU', 'Gold', 'Safe Haven'], breaking: false, summary: 'Precious metals surged as the DXY fell to a 6-week low, driven by soft US jobs data and geopolitical tensions.' },
  { id: 6, title: 'Ethereum Network Upgrade Scheduled for Next Month', category: 'crypto', sentiment: 'neutral', source: 'CoinDesk', time: '48m ago', tags: ['ETH', 'Network', 'Upgrade'], breaking: false, summary: 'The Ethereum Foundation confirmed the Dencun upgrade date, expected to reduce Layer-2 fees by up to 90%.' },
  { id: 7, title: 'S&P 500 Eyes New Record as Tech Rally Continues', category: 'stocks', sentiment: 'bullish', source: 'MarketWatch', time: '1h ago', tags: ['SPX', 'Tech', 'Rally'], breaking: false, summary: 'The benchmark US equity index approached new all-time highs as mega-cap technology stocks led the charge.' },
  { id: 8, title: 'BOJ Maintains Ultra-Low Rates Despite Yen Weakness', category: 'forex', sentiment: 'bearish', source: 'Nikkei', time: '1h ago', tags: ['JPY', 'BOJ', 'Japan'], breaking: false, summary: 'The Bank of Japan kept its key short-term interest rate at -0.1%, disappointing markets expecting a hawkish pivot.' },
];

const categories = ['All', 'Forex', 'Crypto', 'Stocks'];

const sentimentConfig = {
  bullish: { color: 'text-emerald-400', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', icon: TrendingUp },
  bearish: { color: 'text-red-400', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', icon: TrendingDown },
  neutral: { color: 'text-yellow-400', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', icon: Globe },
};

const categoryColor = {
  forex: '#FF5C00',
  crypto: '#CCFF00',
  stocks: '#60a5fa',
};

export default function MarketNews() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [expanded, setExpanded] = useState(null);

  const filtered = NEWS.filter(n =>
    activeCategory === 'All' || n.category === activeCategory.toLowerCase()
  );

  const breaking = NEWS.filter(n => n.breaking);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
            <Newspaper className="w-6 h-6 text-primary" />
            Market News
          </h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">Real-time financial news & market intelligence</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono"
          style={{ background: 'rgba(255,92,0,0.1)', border: '1px solid rgba(255,92,0,0.25)', color: '#FF5C00' }}>
          <Zap className="w-3 h-3" />
          LIVE FEED
        </div>
      </div>

      {/* Breaking News Ticker */}
      {breaking.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl overflow-hidden mb-6 flex items-center"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}
        >
          <div className="flex-shrink-0 px-4 py-3 flex items-center gap-2 border-r"
            style={{ background: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.25)' }}>
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-black text-red-400 uppercase tracking-wider">Breaking</span>
          </div>
          <div className="overflow-hidden flex-1 px-4 py-3">
            <div className="flex gap-8 ticker-scroll">
              {[...breaking, ...breaking].map((n, i) => (
                <span key={i} className="text-sm text-foreground whitespace-nowrap">{n.title} &nbsp;&nbsp;•</span>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Trending Topics */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <span className="text-xs font-mono text-muted-foreground">Trending:</span>
        {['#FedRates', '#BitcoinETF', '#GoldRally', '#TechEarnings', '#ECBDecision', '#JPYWeakness'].map((tag) => (
          <span key={tag} className="px-3 py-1 rounded-full text-xs font-mono text-primary cursor-pointer hover:bg-primary/10 transition-colors"
            style={{ background: 'rgba(255,92,0,0.06)', border: '1px solid rgba(255,92,0,0.15)' }}>
            {tag}
          </span>
        ))}
      </div>

      {/* Category filters */}
      <div className="flex items-center gap-2 mb-6">
        {categories.map((c) => (
          <button key={c} onClick={() => setActiveCategory(c)}
            className={`px-4 py-1.5 rounded-full text-xs font-mono transition-all ${
              activeCategory === c ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
            }`}
            style={activeCategory !== c ? { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' } : {}}>
            {c}
          </button>
        ))}
      </div>

      {/* News cards */}
      <div className="space-y-3">
        {filtered.map((news, i) => {
          const sentiment = sentimentConfig[news.sentiment];
          const SentimentIcon = sentiment.icon;
          const isExpanded = expanded === news.id;
          const catColor = categoryColor[news.category];

          return (
            <motion.div
              key={news.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setExpanded(isExpanded ? null : news.id)}
              className="rounded-2xl p-5 cursor-pointer transition-all hover:scale-[1.01]"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: sentiment.bg, border: `1px solid ${sentiment.border}` }}>
                    <SentimentIcon className={`w-4 h-4 ${sentiment.color}`} />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {news.breaking && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-red-500/20 text-red-400 border border-red-500/30 uppercase">Breaking</span>
                    )}
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono capitalize"
                      style={{ background: `${catColor}15`, color: catColor, border: `1px solid ${catColor}30` }}>
                      {news.category}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">{news.source}</span>
                    <span className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground ml-auto">
                      <Clock className="w-3 h-3" />{news.time}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-foreground leading-snug mb-2">{news.title}</h3>

                  {isExpanded && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      className="text-xs text-muted-foreground leading-relaxed mb-3"
                    >
                      {news.summary}
                    </motion.p>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    {news.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] font-mono text-muted-foreground"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        {tag}
                      </span>
                    ))}
                    <ExternalLink className="w-3 h-3 text-muted-foreground/50 ml-auto" />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}