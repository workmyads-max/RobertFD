import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, Clock, Filter, RefreshCw, ExternalLink, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const impactColors = {
  high:   { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.35)', text: 'text-red-400',    dot: 'bg-red-500',    label: 'HIGH' },
  medium: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)', text: 'text-yellow-400', dot: 'bg-yellow-500', label: 'MED' },
  low:    { bg: 'rgba(100,116,139,0.12)', border: 'rgba(100,116,139,0.25)', text: 'text-slate-400',  dot: 'bg-slate-500',  label: 'LOW' },
};

const FILTERS = ['All', 'High Impact', 'USD', 'EUR', 'GBP', 'JPY', 'BTC'];

function CountdownTimer({ eventTime }) {
  const [countdown, setCountdown] = useState('');
  useEffect(() => {
    const calc = () => {
      const now = new Date();
      const [h, m] = eventTime.split(':').map(Number);
      const target = new Date(now);
      target.setHours(h, m, 0, 0);
      if (target < now) target.setDate(target.getDate() + 1);
      const diff = target - now;
      if (diff < 0) { setCountdown('Released'); return; }
      const hours = Math.floor(diff / 3600000);
      const mins  = Math.floor((diff % 3600000) / 60000);
      const secs  = Math.floor((diff % 60000) / 1000);
      setCountdown(hours > 0 ? `${hours}h ${mins}m` : `${mins}m ${secs}s`);
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [eventTime]);
  return <span className="text-[10px] font-mono text-muted-foreground/60">{countdown}</span>;
}

// Fetch real economic calendar data via InvokeLLM with web context
async function fetchRealCalendar() {
  const today = new Date().toISOString().split('T')[0];
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `Fetch today's (${today}) real economic calendar events from Forex Factory or Investing.com. 
    Return the top 15 most important scheduled economic events for today including forex, crypto (major news), and stock market events.
    For each event include: time (HH:MM UTC), country code (US/EU/GB/JP/CA/AU/CH/NZ/BTC), currency (USD/EUR/GBP/JPY/CAD/AUD/CHF/NZD/BTC/ETH), 
    event name, impact (high/medium/low), forecast value (or null), previous value (or null), actual value if already released (or null), category (forex/crypto/stocks).
    Be precise with actual values if the event already happened today. Use real scheduled events only.`,
    add_context_from_internet: true,
    model: 'gemini_3_flash',
    response_json_schema: {
      type: 'object',
      properties: {
        events: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              time:     { type: 'string' },
              country:  { type: 'string' },
              currency: { type: 'string' },
              event:    { type: 'string' },
              impact:   { type: 'string' },
              forecast: { type: 'string' },
              previous: { type: 'string' },
              actual:   { type: 'string' },
              category: { type: 'string' },
            }
          }
        },
        date: { type: 'string' },
        summary: { type: 'string' },
      }
    }
  });
  return result;
}

// Fetch real market sentiment via AI + web
async function fetchSentiment() {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `What is the current market sentiment for USD, EUR, Bitcoin, and overall market fear/greed index as of today? 
    Provide a bullish/bearish/neutral rating and a percentage score (0-100) for each.`,
    add_context_from_internet: true,
    model: 'gemini_3_flash',
    response_json_schema: {
      type: 'object',
      properties: {
        usd:    { type: 'object', properties: { label: { type: 'string' }, pct: { type: 'number' }, color: { type: 'string' } } },
        eur:    { type: 'object', properties: { label: { type: 'string' }, pct: { type: 'number' }, color: { type: 'string' } } },
        btc:    { type: 'object', properties: { label: { type: 'string' }, pct: { type: 'number' }, color: { type: 'string' } } },
        fear_greed: { type: 'object', properties: { label: { type: 'string' }, pct: { type: 'number' }, color: { type: 'string' } } },
      }
    }
  });
  return result;
}

export default function EconomicCalendar() {
  const [activeFilter, setActiveFilter]   = useState('All');
  const [events, setEvents]               = useState([]);
  const [sentiment, setSentiment]         = useState(null);
  const [loading, setLoading]             = useState(true);
  const [sentimentLoading, setSentimentLoading] = useState(true);
  const [error, setError]                 = useState(null);
  const [lastUpdated, setLastUpdated]     = useState(null);
  const [calendarDate, setCalendarDate]   = useState('');

  const loadCalendar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRealCalendar();
      const rawEvents = data?.events || [];
      // Add flag emojis based on country
      const FLAGS = { US:'🇺🇸', EU:'🇪🇺', GB:'🇬🇧', JP:'🇯🇵', CA:'🇨🇦', AU:'🇦🇺', CH:'🇨🇭', NZ:'🇳🇿', BTC:'₿', ETH:'Ξ', CN:'🇨🇳', DE:'🇩🇪', FR:'🇫🇷' };
      const enriched = rawEvents.map((e, i) => ({
        ...e,
        id: i,
        flag: FLAGS[e.country] || '🌐',
        impact: (e.impact || 'medium').toLowerCase(),
        category: e.category || 'forex',
      }));
      // Sort by time
      enriched.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
      setEvents(enriched);
      setCalendarDate(data?.date || new Date().toLocaleDateString());
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      setError('Could not load live calendar data. Please try refreshing.');
    }
    setLoading(false);
  }, []);

  const loadSentiment = useCallback(async () => {
    setSentimentLoading(true);
    try {
      const data = await fetchSentiment();
      if (data) setSentiment(data);
    } catch {}
    setSentimentLoading(false);
  }, []);

  useEffect(() => {
    loadCalendar();
    loadSentiment();
  }, []);

  const filtered = events.filter(e => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'High Impact') return e.impact === 'high';
    return e.currency === activeFilter;
  });

  const highImpactCount = events.filter(e => e.impact === 'high').length;

  const sentimentWidgets = sentiment ? [
    { label: 'USD Sentiment', value: sentiment.usd?.label || '—', pct: sentiment.usd?.pct || 50, color: sentiment.usd?.pct > 50 ? '#10b981' : '#ef4444' },
    { label: 'EUR Sentiment', value: sentiment.eur?.label || '—', pct: sentiment.eur?.pct || 50, color: sentiment.eur?.pct > 50 ? '#10b981' : '#ef4444' },
    { label: 'BTC Momentum',  value: sentiment.btc?.label || '—', pct: sentiment.btc?.pct || 50, color: '#FF5C00' },
    { label: 'Fear & Greed',  value: sentiment.fear_greed?.label || '—', pct: sentiment.fear_greed?.pct || 50, color: '#CCFF00' },
  ] : [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
            <CalendarDays className="w-6 h-6 text-primary" /> Economic Calendar
          </h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">
            Real-time economic events — {calendarDate}
            {lastUpdated && <span className="text-muted-foreground/50"> · Updated {lastUpdated}</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {highImpactCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444' }}>
              <AlertTriangle className="w-3 h-3" /> {highImpactCount} High Impact
            </div>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> LIVE
          </div>
          <button onClick={loadCalendar} disabled={loading}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/5"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Sentiment Widgets */}
      {sentimentWidgets.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {sentimentWidgets.map(s => (
            <div key={s.label} className="rounded-xl p-4"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="text-[10px] font-mono text-muted-foreground mb-1.5">{s.label}</div>
              <div className="text-sm font-bold mb-2" style={{ color: s.color }}>{s.value}</div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${s.pct}%` }} transition={{ duration: 1 }}
                  className="h-full rounded-full" style={{ background: s.color }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        {FILTERS.map(f => (
          <button key={f} onClick={() => setActiveFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all ${activeFilter === f ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}
            style={activeFilter !== f ? { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' } : {}}>
            {f}
          </button>
        ))}
        <span className="ml-auto text-xs font-mono text-muted-foreground">{filtered.length} events</span>
      </div>

      {/* Column headers (desktop) */}
      <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-2 text-[10px] font-mono text-muted-foreground/60 uppercase tracking-widest mb-2 rounded-lg"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <span className="col-span-1">Time</span>
        <span className="col-span-1">Flag</span>
        <span className="col-span-1">Ccy</span>
        <span className="col-span-3">Event</span>
        <span className="col-span-1">Impact</span>
        <span className="col-span-1">Prev</span>
        <span className="col-span-1">Forecast</span>
        <span className="col-span-1">Actual</span>
        <span className="col-span-2">Countdown</span>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <div className="text-sm font-mono text-muted-foreground">Fetching real-time economic data...</div>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl"
          style={{ border: '1px dashed rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.03)' }}>
          <AlertTriangle className="w-8 h-8 text-red-400/60" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <button onClick={loadCalendar} className="text-xs text-primary hover:underline">Try again</button>
        </div>
      )}

      {/* Events */}
      {!loading && !error && (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.01)' }}>
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <AnimatePresence>
            {filtered.map((event, i) => {
              const impact = impactColors[event.impact] || impactColors.low;
              const hasActual = event.actual && event.actual !== 'null' && event.actual !== '—';
              const isHighImpact = event.impact === 'high';

              return (
                <motion.div key={event.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }} transition={{ delay: i * 0.03 }}
                  className="px-4 py-3 transition-all hover:bg-white/[0.03]"
                  style={{
                    background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                    borderLeft: isHighImpact ? '3px solid rgba(239,68,68,0.55)' : '3px solid transparent',
                  }}>
                  {/* Mobile */}
                  <div className="md:hidden">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{event.flag}</span>
                        <span className="text-xs font-mono text-muted-foreground">{event.time}</span>
                        <span className="text-xs font-bold text-foreground">{event.currency}</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono"
                        style={{ background: impact.bg, border: `1px solid ${impact.border}` }}>
                        <span className={`w-1.5 h-1.5 rounded-full ${impact.dot}`} />
                        <span className={impact.text}>{impact.label}</span>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-foreground mb-1.5">{event.event}</div>
                    <div className="flex gap-4 text-[10px] font-mono">
                      <span className="text-muted-foreground">Prev: <span className="text-foreground">{event.previous || '—'}</span></span>
                      <span className="text-muted-foreground">Fcst: <span className="text-foreground">{event.forecast || '—'}</span></span>
                      {hasActual && <span className="text-muted-foreground">Act: <span className="text-emerald-400 font-bold">{event.actual}</span></span>}
                      {!hasActual && <CountdownTimer eventTime={event.time} />}
                    </div>
                  </div>

                  {/* Desktop */}
                  <div className="hidden md:grid grid-cols-12 gap-2 items-center">
                    <span className="col-span-1 text-xs font-mono text-muted-foreground">{event.time} <span className="text-[8px] text-muted-foreground/40">UTC</span></span>
                    <span className="col-span-1 text-base">{event.flag}</span>
                    <span className="col-span-1 text-xs font-mono font-bold text-foreground">{event.currency}</span>
                    <span className="col-span-3 text-sm font-semibold text-foreground leading-tight">{event.event}</span>
                    <div className="col-span-1">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono"
                        style={{ background: impact.bg, border: `1px solid ${impact.border}` }}>
                        <span className={`w-1.5 h-1.5 rounded-full ${impact.dot}`} />
                        <span className={impact.text}>{impact.label}</span>
                      </div>
                    </div>
                    <span className="col-span-1 text-xs font-mono text-muted-foreground">{event.previous || '—'}</span>
                    <span className="col-span-1 text-xs font-mono text-foreground">{event.forecast || '—'}</span>
                    <span className={`col-span-1 text-xs font-mono font-bold ${hasActual ? 'text-emerald-400' : 'text-muted-foreground/30'}`}>
                      {hasActual ? event.actual : '—'}
                    </span>
                    <span className="col-span-2">
                      {hasActual
                        ? <span className="text-[10px] font-mono text-emerald-400/60">✓ Released</span>
                        : <CountdownTimer eventTime={event.time} />}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {filtered.length === 0 && !loading && (
            <div className="text-center py-12 text-sm font-mono text-muted-foreground/40">
              No events for this filter
            </div>
          )}
          </div>
        </div>
      )}

      <div className="mt-6 text-center text-[10px] font-mono text-muted-foreground/30">
        Data sourced via AI-powered real-time web lookup · Not financial advice · Times in UTC
      </div>
    </div>
  );
}