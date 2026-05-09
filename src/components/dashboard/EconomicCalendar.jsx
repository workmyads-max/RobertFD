import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, Clock, Filter, TrendingUp, Globe, AlertTriangle, Activity, RefreshCw } from 'lucide-react';

const MOCK_EVENTS = [
  { id: 1, time: '08:30', country: 'US', flag: '🇺🇸', currency: 'USD', event: 'Non-Farm Payrolls', impact: 'high', forecast: '180K', previous: '165K', actual: '199K', category: 'forex' },
  { id: 2, time: '10:00', country: 'US', flag: '🇺🇸', currency: 'USD', event: 'ISM Manufacturing PMI', impact: 'high', forecast: '49.8', previous: '48.7', actual: null, category: 'forex' },
  { id: 3, time: '12:30', country: 'EU', flag: '🇪🇺', currency: 'EUR', event: 'ECB Interest Rate Decision', impact: 'high', forecast: '4.50%', previous: '4.50%', actual: null, category: 'forex' },
  { id: 4, time: '07:00', country: 'GB', flag: '🇬🇧', currency: 'GBP', event: 'UK GDP (QoQ)', impact: 'medium', forecast: '0.1%', previous: '-0.1%', actual: '0.2%', category: 'forex' },
  { id: 5, time: '14:00', country: 'US', flag: '🇺🇸', currency: 'USD', event: 'FOMC Meeting Minutes', impact: 'high', forecast: '—', previous: '—', actual: null, category: 'forex' },
  { id: 6, time: '09:30', country: 'JP', flag: '🇯🇵', currency: 'JPY', event: 'Bank of Japan Rate Decision', impact: 'high', forecast: '-0.10%', previous: '-0.10%', actual: null, category: 'forex' },
  { id: 7, time: '15:30', country: 'US', flag: '🇺🇸', currency: 'USD', event: 'Crude Oil Inventories', impact: 'medium', forecast: '-1.2M', previous: '-2.4M', actual: '-1.8M', category: 'stocks' },
  { id: 8, time: '13:00', country: 'CA', flag: '🇨🇦', currency: 'CAD', event: 'Canada Employment Change', impact: 'medium', forecast: '20K', previous: '41.4K', actual: null, category: 'forex' },
  { id: 9, time: '16:00', country: 'BTC', flag: '₿', currency: 'BTC', event: 'Bitcoin Halving Countdown', impact: 'high', forecast: '—', previous: '—', actual: null, category: 'crypto' },
  { id: 10, time: '11:00', country: 'AU', flag: '🇦🇺', currency: 'AUD', event: 'RBA Interest Rate Statement', impact: 'high', forecast: '4.35%', previous: '4.35%', actual: '4.35%', category: 'forex' },
  { id: 11, time: '17:30', country: 'US', flag: '🇺🇸', currency: 'USD', event: 'S&P 500 Earnings (AAPL)', impact: 'high', forecast: '$1.43 EPS', previous: '$1.29 EPS', actual: null, category: 'stocks' },
  { id: 12, time: '08:00', country: 'DE', flag: '🇩🇪', currency: 'EUR', event: 'German CPI (YoY)', impact: 'medium', forecast: '2.4%', previous: '2.5%', actual: '2.3%', category: 'forex' },
];

const impactColors = {
  high: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.35)', text: 'text-red-400', dot: 'bg-red-500', label: 'HIGH' },
  medium: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)', text: 'text-yellow-400', dot: 'bg-yellow-500', label: 'MED' },
  low: { bg: 'rgba(100,116,139,0.12)', border: 'rgba(100,116,139,0.25)', text: 'text-slate-400', dot: 'bg-slate-500', label: 'LOW' },
};

const filters = ['All', 'High Impact', 'Forex', 'Crypto', 'Stocks'];

function CountdownTimer({ time }) {
  const [countdown, setCountdown] = useState('');
  useEffect(() => {
    const calc = () => {
      const now = new Date();
      const [h, m] = time.split(':').map(Number);
      const target = new Date(now);
      target.setHours(h, m, 0, 0);
      if (target < now) target.setDate(target.getDate() + 1);
      const diff = target - now;
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      setCountdown(diff < 0 ? 'Released' : `${hours}h ${mins}m`);
    };
    calc();
    const t = setInterval(calc, 60000);
    return () => clearInterval(t);
  }, [time]);
  return <span className="text-[10px] font-mono text-muted-foreground">{countdown}</span>;
}

export default function EconomicCalendar() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filtered = MOCK_EVENTS.filter(e => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'High Impact') return e.impact === 'high';
    if (activeFilter === 'Forex') return e.category === 'forex';
    if (activeFilter === 'Crypto') return e.category === 'crypto';
    if (activeFilter === 'Stocks') return e.category === 'stocks';
    return true;
  });

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1200);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
            <CalendarDays className="w-6 h-6 text-primary" />
            Economic Calendar
          </h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">Real-time global economic events & releases</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            LIVE
          </div>
          <button onClick={handleRefresh}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/5"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <RefreshCw className={`w-4 h-4 text-muted-foreground ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Sentiment widgets */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'USD Sentiment', value: 'Bullish', pct: 68, color: '#10b981' },
          { label: 'EUR Sentiment', value: 'Bearish', pct: 38, color: '#ef4444' },
          { label: 'BTC Momentum', value: 'Bullish', pct: 74, color: '#FF5C00' },
          { label: 'Market Fear', value: 'Greed', pct: 62, color: '#CCFF00' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-4"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="text-[10px] font-mono text-muted-foreground mb-2">{s.label}</div>
            <div className="text-sm font-bold mb-2" style={{ color: s.color }}>{s.value}</div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${s.pct}%` }}
                transition={{ duration: 1, delay: 0.2 }}
                className="h-full rounded-full"
                style={{ background: s.color }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground" />
        {filters.map((f) => (
          <button key={f} onClick={() => setActiveFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-mono transition-all ${
              activeFilter === f
                ? 'bg-primary text-white'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            style={activeFilter !== f ? { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' } : {}}>
            {f}
          </button>
        ))}
        <span className="ml-auto text-xs font-mono text-muted-foreground">{filtered.length} events</span>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1 hidden md:grid">
        <span className="col-span-1">Time</span>
        <span className="col-span-1">Flag</span>
        <span className="col-span-1">Ccy</span>
        <span className="col-span-4">Event</span>
        <span className="col-span-1">Impact</span>
        <span className="col-span-1">Prev</span>
        <span className="col-span-1">Forecast</span>
        <span className="col-span-1">Actual</span>
        <span className="col-span-1">In</span>
      </div>

      {/* Events */}
      <div className="space-y-1.5">
        <AnimatePresence>
          {filtered.map((event, i) => {
            const impact = impactColors[event.impact];
            const hasActual = event.actual !== null;
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-xl px-4 py-3 transition-all hover:bg-white/[0.02]"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                {/* Mobile layout */}
                <div className="md:hidden">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{event.flag}</span>
                      <span className="text-xs font-mono text-muted-foreground">{event.time}</span>
                      <span className="text-xs font-bold text-foreground">{event.currency}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono"
                      style={{ background: impact.bg, border: `1px solid ${impact.border}` }}>
                      <span className={`w-1.5 h-1.5 rounded-full ${impact.dot}`} />
                      <span className={impact.text}>{impact.label}</span>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-foreground mb-2">{event.event}</div>
                  <div className="flex gap-4 text-[10px] font-mono">
                    <span className="text-muted-foreground">Prev: <span className="text-foreground">{event.previous}</span></span>
                    <span className="text-muted-foreground">Fcst: <span className="text-foreground">{event.forecast}</span></span>
                    {hasActual && <span className="text-muted-foreground">Act: <span className="text-emerald-400 font-bold">{event.actual}</span></span>}
                  </div>
                </div>

                {/* Desktop layout */}
                <div className="hidden md:grid grid-cols-12 gap-2 items-center">
                  <span className="col-span-1 text-xs font-mono text-muted-foreground">{event.time}</span>
                  <span className="col-span-1 text-base">{event.flag}</span>
                  <span className="col-span-1 text-xs font-mono font-bold text-foreground">{event.currency}</span>
                  <span className="col-span-4 text-sm font-semibold text-foreground">{event.event}</span>
                  <div className="col-span-1">
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono"
                      style={{ background: impact.bg, border: `1px solid ${impact.border}` }}>
                      <span className={`w-1.5 h-1.5 rounded-full ${impact.dot}`} />
                      <span className={impact.text}>{impact.label}</span>
                    </div>
                  </div>
                  <span className="col-span-1 text-xs font-mono text-muted-foreground">{event.previous}</span>
                  <span className="col-span-1 text-xs font-mono text-foreground">{event.forecast}</span>
                  <span className={`col-span-1 text-xs font-mono font-bold ${hasActual ? 'text-emerald-400' : 'text-muted-foreground/40'}`}>
                    {hasActual ? event.actual : '—'}
                  </span>
                  <span className="col-span-1">
                    {!hasActual && <CountdownTimer time={event.time} />}
                    {hasActual && <span className="text-[10px] font-mono text-emerald-400/60">Released</span>}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}