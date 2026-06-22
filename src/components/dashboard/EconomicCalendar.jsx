import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Filter, ChevronDown, AlertCircle, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { NEWS_TRADING_RULE_TEXT, NEWS_BLACKOUT_BEFORE_MINUTES, NEWS_BLACKOUT_AFTER_MINUTES } from '@/lib/newsTradingConfig';

const IMPACT_CONFIG = {
  High: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', label: 'High' },
  Medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', label: 'Med' },
  Low: { color: '#6b7280', bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.3)', label: 'Low' },
};

const DATE_TABS = [
  { id: 'today', label: 'Today' },
  { id: 'this-week', label: 'This Week' },
  { id: 'next-week', label: 'Next Week' },
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'JPY', 'AUD', 'NZD', 'CHF', 'CNY'];

// Detect user's local timezone for display
function getUserTz() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch { return 'UTC'; }
}

function formatLocalTime(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatLocalDate(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function getLocalDateKey(isoStr) {
  const d = new Date(isoStr);
  const tz = getUserTz();
  // Get date parts in local timezone
  const localStr = d.toLocaleString('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' });
  return localStr;
}

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as start
  const result = new Date(d.setDate(diff));
  result.setHours(0, 0, 0, 0);
  return result;
}

function startOfNextWeek(date) {
  const sw = startOfWeek(date);
  const nw = new Date(sw);
  nw.setDate(nw.getDate() + 7);
  return nw;
}

export default function EconomicCalendar({ onNavigate }) {
  const [dateTab, setDateTab] = useState('this-week');
  const [impactFilter, setImpactFilter] = useState('High');
  const [currencyFilter, setCurrencyFilter] = useState('ALL');
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowCurrencyDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['economic-events'],
    queryFn: async () => {
      const all = await base44.entities.EconomicEvent.list('event_time', 500);
      return all || [];
    },
    staleTime: 60000,
    refetchInterval: 120000,
  });

  // Trigger a background refresh if data looks stale (last event older than 30 min)
  // or if no events exist — fires the backend function non-blockingly.
  useEffect(() => {
    const refresh = async () => {
      try {
        await base44.functions.invoke('fetchEconomicCalendar', {});
      } catch {}
    };

    const hasUpcoming = events.some(e => new Date(e.event_time).getTime() > Date.now());
    if (!isLoading && events.length === 0) {
      refresh();
    } else if (!isLoading && !hasUpcoming) {
      // All events are in the past — refresh for next week's data
      refresh();
    }
  }, [isLoading, events.length]);

  // Filter events by date tab
  const dateFiltered = useMemo(() => {
    const now = new Date();
    const todayKey = getLocalDateKey(now.toISOString());
    const sw = startOfWeek(now);
    const nw = startOfNextWeek(now);
    const nwEnd = new Date(nw);
    nwEnd.setDate(nwEnd.getDate() + 7);

    return events.filter(e => {
      const eventDate = new Date(e.event_time);
      const eventKey = getLocalDateKey(e.event_time);

      if (dateTab === 'today') return eventKey === todayKey;
      if (dateTab === 'this-week') return eventDate >= sw && eventDate < nw;
      if (dateTab === 'next-week') return eventDate >= nw && eventDate < nwEnd;
      return true;
    });
  }, [events, dateTab]);

  // Filter by impact + currency
  const filtered = useMemo(() => {
    return dateFiltered.filter(e => {
      if (impactFilter !== 'ALL' && e.impact !== impactFilter) return false;
      if (currencyFilter !== 'ALL' && e.currency !== currencyFilter) return false;
      return true;
    });
  }, [dateFiltered, impactFilter, currencyFilter]);

  // Group by local date
  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach(e => {
      const key = getLocalDateKey(e.event_time);
      if (!groups[key]) groups[key] = { date: formatLocalDate(e.event_time), events: [] };
      groups[key].events.push(e);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const hasAny = filtered.length > 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Calendar className="w-6 h-6 text-primary" />
        <h1 className="text-xl font-black text-white">Economic Calendar</h1>
      </div>

      {/* News Trading Rule Note Box */}
      <div className="rounded-xl px-5 py-4 flex items-start gap-3"
        style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-red-400 mb-1">News Trading Rule</div>
          <p className="text-xs text-white/60 leading-relaxed">{NEWS_TRADING_RULE_TEXT}</p>
          <p className="text-[10px] text-white/30 mt-2 font-mono">
            Blackout window: {NEWS_BLACKOUT_BEFORE_MINUTES} min before → {NEWS_BLACKOUT_AFTER_MINUTES} min after (configurable in lib/newsTradingConfig.js)
          </p>
        </div>
      </div>

      {/* Date Tabs */}
      <div className="flex gap-1 p-1 rounded-xl overflow-x-auto"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {DATE_TABS.map(tab => {
          const active = dateTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setDateTab(tab.id)}
              className="flex-1 min-w-[80px] px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all"
              style={{
                background: active ? 'rgba(255,92,0,0.15)' : 'transparent',
                color: active ? '#FF5C00' : 'rgba(255,255,255,0.4)',
                border: active ? '1px solid rgba(255,92,0,0.3)' : '1px solid transparent',
              }}>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Filters: Impact + Currency */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Impact filter */}
        <div className="flex gap-1">
          {['High', 'Medium', 'Low', 'ALL'].map(imp => {
            const cfg = IMPACT_CONFIG[imp];
            const active = impactFilter === imp;
            if (imp === 'ALL') {
              return (
                <button key={imp} onClick={() => setImpactFilter('ALL')}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                  style={{
                    background: active ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                    color: active ? '#fff' : 'rgba(255,255,255,0.4)',
                    border: active ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent',
                  }}>
                  All
                </button>
              );
            }
            return (
              <button key={imp} onClick={() => setImpactFilter(imp)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                style={{
                  background: active ? cfg.bg : 'rgba(255,255,255,0.05)',
                  color: active ? cfg.color : 'rgba(255,255,255,0.4)',
                  border: active ? `1px solid ${cfg.border}` : '1px solid transparent',
                }}>
                {cfg.label}
              </button>
            );
          })}
        </div>

        {/* Currency dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
            style={{
              background: 'rgba(255,255,255,0.05)',
              color: currencyFilter === 'ALL' ? 'rgba(255,255,255,0.5)' : '#FF5C00',
              border: currencyFilter === 'ALL' ? '1px solid transparent' : '1px solid rgba(255,92,0,0.25)',
            }}>
            <Filter className="w-3 h-3" />
            {currencyFilter === 'ALL' ? 'All Currencies' : currencyFilter}
            <ChevronDown className="w-3 h-3" />
          </button>
          <AnimatePresence>
            {showCurrencyDropdown && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                className="absolute z-50 top-full mt-1 left-0 rounded-xl py-1 w-40 max-h-64 overflow-y-auto"
                style={{ background: 'rgba(10,10,12,0.98)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}>
                <button onClick={() => { setCurrencyFilter('ALL'); setShowCurrencyDropdown(false); }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-white/60 hover:bg-white/5 transition-colors">
                  All Currencies
                </button>
                {CURRENCIES.map(c => (
                  <button key={c} onClick={() => { setCurrencyFilter(c); setShowCurrencyDropdown(false); }}
                    className="w-full text-left px-3 py-2 text-xs font-mono font-bold text-white/60 hover:bg-white/5 transition-colors">
                    {c}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Events List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !hasAny ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Clock className="w-10 h-10 text-white/10 mb-3" />
          <p className="text-sm text-white/30">
            No events match your filters for {DATE_TABS.find(t => t.id === dateTab)?.label}.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {grouped.map(([dateKey, group]) => (
            <div key={dateKey}>
              {/* Day header */}
              <div className="sticky top-0 z-10 px-4 py-2 mb-2 rounded-lg text-xs font-bold uppercase tracking-wider text-white/50"
                style={{ background: 'rgba(10,10,12,0.95)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)' }}>
                {group.date}
              </div>
              {/* Events for this day */}
              <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {group.events.map((ev, i) => {
                  const cfg = IMPACT_CONFIG[ev.impact] || IMPACT_CONFIG.Low;
                  return (
                    <div key={ev.id || i}
                      className="flex items-center gap-3 px-4 py-3 border-b last:border-0 hover:bg-white/[0.02] transition-colors"
                      style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                      {/* Time */}
                      <div className="w-12 flex-shrink-0 text-xs font-mono font-bold text-white/60">
                        {formatLocalTime(ev.event_time)}
                      </div>
                      {/* Currency */}
                      <div className="w-12 flex-shrink-0">
                        <span className="px-2 py-1 rounded text-[10px] font-bold font-mono"
                          style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}>
                          {ev.currency}
                        </span>
                      </div>
                      {/* Impact badge */}
                      <div className="w-16 flex-shrink-0">
                        <span className="px-2 py-1 rounded text-[10px] font-bold"
                          style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                          {cfg.label}
                        </span>
                      </div>
                      {/* Title */}
                      <div className="flex-1 min-w-0 text-xs font-medium text-white/80 truncate">
                        {ev.title}
                      </div>
                      {/* Forecast / Previous */}
                      <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
                        <div className="text-right">
                          <div className="text-[8px] uppercase text-white/20 font-mono">Forecast</div>
                          <div className="text-xs font-mono text-white/60">{ev.forecast || '—'}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[8px] uppercase text-white/20 font-mono">Previous</div>
                          <div className="text-xs font-mono text-white/60">{ev.previous || '—'}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}