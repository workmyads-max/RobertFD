import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Newspaper, TrendingUp, TrendingDown, Zap, Globe, Clock, RefreshCw, AlertTriangle, ExternalLink } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const CATEGORIES = ['All', 'Forex', 'Crypto', 'Stocks', 'Commodities'];

const sentimentConfig = {
  bullish: { color: 'text-emerald-400', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.2)',  icon: TrendingUp  },
  bearish: { color: 'text-red-400',     bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.2)',   icon: TrendingDown },
  neutral: { color: 'text-yellow-400',  bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.2)',  icon: Globe        },
};

const categoryColor = {
  forex: '#FF5C00', crypto: '#CCFF00', stocks: '#60a5fa', commodities: '#f59e0b',
};

async function fetchRealNews(category = 'all') {
  const today = new Date().toISOString().split('T')[0];
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `Fetch today's (${today}) top 12 real financial market news headlines from sources like Reuters, Bloomberg, CNBC, FXStreet, CoinDesk, MarketWatch, Kitco.
    Focus on: ${category === 'all' ? 'forex, crypto, stocks, and commodities' : category} market news.
    For each article include: title, summary (2-3 sentences), source name, category (forex/crypto/stocks/commodities), 
    sentiment (bullish/bearish/neutral), time_ago (e.g. "5m ago", "1h ago"), is_breaking (true/false), 
    tags (array of 2-3 ticker symbols or keywords), url (if known, else null).
    Only include real news from today. Be precise and institutional in tone.`,
    add_context_from_internet: true,
    model: 'gemini_3_flash',
    response_json_schema: {
      type: 'object',
      properties: {
        articles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title:       { type: 'string' },
              summary:     { type: 'string' },
              source:      { type: 'string' },
              category:    { type: 'string' },
              sentiment:   { type: 'string' },
              time_ago:    { type: 'string' },
              is_breaking: { type: 'boolean' },
              tags:        { type: 'array', items: { type: 'string' } },
              url:         { type: 'string' },
            }
          }
        },
        trending_topics: { type: 'array', items: { type: 'string' } },
        market_summary: { type: 'string' },
      }
    }
  });
  return result;
}

export default function MarketNews() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [articles, setArticles]             = useState([]);
  const [trendingTopics, setTrendingTopics] = useState([]);
  const [marketSummary, setMarketSummary]   = useState('');
  const [expanded, setExpanded]             = useState(null);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [lastUpdated, setLastUpdated]       = useState(null);

  const loadNews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRealNews(activeCategory.toLowerCase());
      setArticles((data?.articles || []).map((a, i) => ({ ...a, id: i })));
      setTrendingTopics(data?.trending_topics || []);
      setMarketSummary(data?.market_summary || '');
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      setError('Could not load live news. Please refresh.');
    }
    setLoading(false);
  }, [activeCategory]);

  useEffect(() => {
    loadNews();
  }, [activeCategory]);

  const breaking = articles.filter(a => a.is_breaking);
  const displayed = activeCategory === 'All' ? articles : articles.filter(a => a.category === activeCategory.toLowerCase());

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
            <Newspaper className="w-6 h-6 text-primary" /> Market News
          </h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">
            Real-time financial news & market intelligence
            {lastUpdated && <span className="text-muted-foreground/50"> · {lastUpdated}</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono"
            style={{ background: 'rgba(255,92,0,0.1)', border: '1px solid rgba(255,92,0,0.25)', color: '#FF5C00' }}>
            <Zap className="w-3 h-3" /> LIVE FEED
          </div>
          <button onClick={loadNews} disabled={loading}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/5 transition"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Market Summary */}
      {marketSummary && !loading && (
        <div className="rounded-xl p-4 mb-5 text-sm text-muted-foreground leading-relaxed"
          style={{ background: 'rgba(255,92,0,0.04)', border: '1px solid rgba(255,92,0,0.12)' }}>
          <span className="text-primary font-bold mr-2">Market Summary:</span>{marketSummary}
        </div>
      )}

      {/* Breaking Ticker */}
      <AnimatePresence>
        {breaking.length > 0 && !loading && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-xl overflow-hidden mb-5 flex items-center"
            style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <div className="flex-shrink-0 px-3 py-2.5 flex items-center gap-2 border-r"
              style={{ background: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.2)' }}>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-black text-red-400 uppercase tracking-wider">Breaking</span>
            </div>
            <div className="overflow-hidden flex-1 px-4 py-2.5">
              <div className="flex gap-8 ticker-scroll">
                {[...breaking, ...breaking].map((n, i) => (
                  <span key={i} className="text-sm text-foreground whitespace-nowrap">{n.title} &nbsp;&nbsp;•</span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trending Topics */}
      {trendingTopics.length > 0 && !loading && (
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <span className="text-xs font-mono text-muted-foreground flex-shrink-0">Trending:</span>
          {trendingTopics.map(tag => (
            <span key={tag} className="px-2.5 py-1 rounded-full text-xs font-mono text-primary cursor-pointer hover:bg-primary/10 transition-colors"
              style={{ background: 'rgba(255,92,0,0.06)', border: '1px solid rgba(255,92,0,0.15)' }}>
              {tag.startsWith('#') ? tag : `#${tag}`}
            </span>
          ))}
        </div>
      )}

      {/* Category Filters */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setActiveCategory(c)}
            className={`px-4 py-1.5 rounded-full text-xs font-mono transition-all ${activeCategory === c ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}
            style={activeCategory !== c ? { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' } : {}}>
            {c}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <div className="text-sm font-mono text-muted-foreground">Fetching live financial news...</div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl"
          style={{ border: '1px dashed rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.03)' }}>
          <AlertTriangle className="w-8 h-8 text-red-400/60" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <button onClick={loadNews} className="text-xs text-primary hover:underline">Retry</button>
        </div>
      )}

      {/* News Cards */}
      {!loading && !error && (
        <div className="space-y-3">
          {displayed.length === 0 && (
            <div className="text-center py-12 text-sm font-mono text-muted-foreground/40">No news found for this category</div>
          )}
          {displayed.map((news, i) => {
            const sentiment = sentimentConfig[news.sentiment] || sentimentConfig.neutral;
            const SentimentIcon = sentiment.icon;
            const isExpanded = expanded === news.id;
            const catColor = categoryColor[news.category] || '#888';

            return (
              <motion.div key={news.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setExpanded(isExpanded ? null : news.id)}
                className="rounded-2xl p-5 cursor-pointer transition-all hover:bg-white/[0.03]"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: sentiment.bg, border: `1px solid ${sentiment.border}` }}>
                      <SentimentIcon className={`w-4 h-4 ${sentiment.color}`} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {news.is_breaking && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-red-500/20 text-red-400 border border-red-500/30 uppercase">Breaking</span>
                      )}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono capitalize"
                        style={{ background: `${catColor}15`, color: catColor, border: `1px solid ${catColor}30` }}>
                        {news.category}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">{news.source}</span>
                      <span className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground ml-auto">
                        <Clock className="w-3 h-3" />{news.time_ago}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-foreground leading-snug mb-2">{news.title}</h3>
                    <AnimatePresence>
                      {isExpanded && news.summary && (
                        <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                          className="text-xs text-muted-foreground leading-relaxed mb-3">
                          {news.summary}
                        </motion.p>
                      )}
                    </AnimatePresence>
                    <div className="flex items-center gap-2 flex-wrap">
                      {(news.tags || []).map(tag => (
                        <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] font-mono text-muted-foreground"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                          {tag}
                        </span>
                      ))}
                      {news.url && (
                        <a href={news.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                          className="ml-auto flex items-center gap-1 text-[10px] font-mono text-primary hover:underline">
                          <ExternalLink className="w-3 h-3" /> Read
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="mt-6 text-center text-[10px] font-mono text-muted-foreground/30">
        AI-curated live financial news · Not financial advice · Robert Funds Research
      </div>
    </div>
  );
}