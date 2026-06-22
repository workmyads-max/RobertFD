import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronDown, AlertCircle, Clock, ShieldAlert } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNow } from '@/hooks/useNow';
import {
  NEWS_TRADING_RULE_TEXT,
  NEWS_BLACKOUT_BEFORE_MINUTES,
  NEWS_BLACKOUT_AFTER_MINUTES,
  isRestrictedEvent,
} from '@/lib/newsTradingConfig';
import EventRow from './economic-calendar/EventRow';

const IMPACT_FILTERS = [
  { id: 'High', label: 'High', color: '#ef4444' },
  { id: 'Medium', label: 'Medium', color: '#f59e0b' },
  { id: 'Low', label: 'Low', color: '#6b7280' },
  { id: 'ALL', label: 'All', color: '#94a3b8' },
];

const DATE_TABS = [
  { id: 'today', label: 'Today' },
  { id: 'this-week', label: 'This Week' },
  { id: 'next-week', label: 'Next Week' },
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'JPY', 'AUD', 'NZD', 'CHF', 'CNY'];

function getLocalDateKey(isoStr) {
  return new Date(isoStr).toLocaleString('en-CA', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
}

function formatDayHeader(isoStr) {
  return new Date(isoStr).toLocaleDateString('en-US', {
    weekday: 'long', day: '2-digit', month: 'short',
  });
}

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const r = new Date(d.setDate(diff));
  r.setHours(0, 0, 0, 0);
  return r;
}

export default function EconomicCalendar({ onNavigate }) {
  const now = useNow(1000);

  const [dateTab, setDateTab] = useState('this-week');
  const [impactFilter, setImpactFilter] = useState('High');
  const [currencyFilter, setCurrencyFilter] = useState('ALL');
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const dropdownRef = useRef(null);

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

  // Auto-refresh feed if data looks stale or empty
  useEffect(() => {
    const refresh = async () => {
      try { await base44.functions.invoke('fetchEconomicCalendar', {}); } catch {}
    };
    const hasUpcoming = events.some(e => new Date(e.event_time).getTime() > Date.now());
    if (!isLoading && (events.length === 0 || !hasUpcoming)) refresh();
  }, [isLoading, events.length]);

  // Filter by date tab
  const dateFiltered = useMemo(() => {
    const today = new Date();
    const todayKey = getLocalDateKey(today.toISOString());
    const sw = startOfWeek(today);
    const nw = new Date(sw); nw.setDate(nw.getDate() + 7);
    const nwEnd = new Date(nw); nwEnd.setDate(nwEnd.getDate() + 7);

    return events.filter(e => {
      const ed = new Date(e.event_time);
      const ek = getLocalDateKey(e.event_time);
      if (dateTab === 'today') return ek === todayKey;
      if (dateTab === 'this-week') return ed >= sw && ed < nw;
      if (dateTab === 'next-week') return ed >= nw && ed < nwEnd;
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
      if (!groups[key]) groups[key] = { date: formatDayHeader(e.event_time), events: [] };
      groups[key].events.push(e);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const restrictedCount = filtered.filter(isRestrictedEvent).length;

  return (
    <div className="space-y-4 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,92,0,0.1)', border: '1px solid rgba(255,92,0,0.2)' }}>
          <Calendar className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">Economic Calendar</h1>
          <p className="text-[11px] text-white/30">FTMO-style news event tracker · auto-refreshed every 30 min</p>
        </div>
      </div>

      {/* News Trading Rule Note Box */}
      <div className="rounded-xl px-5 py-4 flex items-start gap-3"
        style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.18)' }}>
        <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <div className="text-[11px] font-black uppercase tracking-widest text-red-400 mb-1">News Trading Rule</div>
          <p className="text-xs text-white/55 leading-relaxed">{NEWS_TRADING_RULE_TEXT}</p>
          <p className="text-[10px] text-white/25 mt-2 font-mono">
            Blackout window: {NEWS_BLACKOUT_BEFORE_MINUTES} min before → {NEWS_BLACKOUT_AFTER_MINUTES} min after · Restricted events shown below
          </p>
        </div>
      </div>

      {/* Controls Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Date Tabs */}
        <div className="flex gap-1 p-1 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {DATE_TABS.map(tab => {
            const active = dateTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setDateTab(tab.id)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: active ? 'rgba(255,92,0,0.15)' : 'transparent',
                  color: active ? '#FF5C00' : 'rgba(255,255,255,0.4)',
                }}>
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Impact Filters */}
        <div className="flex gap-1 p-1 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {IMPACT_FILTERS.map(imp => {
            const active = impactFilter === imp.id;
            return (
              <button key={imp.id} onClick={() => setImpactFilter(imp.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                style={{
                  background: active ? `${imp.color}15` : 'transparent',
                  color: active ? imp.color : 'rgba(255,255,255,0.35)',
                  border: active ? `1px solid ${imp.color}30` : '1px solid transparent',
                }}>
                {imp.label}
              </button>
            );
          })}
        </div>

        {/* Currency Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: currencyFilter === 'ALL' ? 'rgba(255,255,255,0.4)' : '#FF5C00',
            }}>
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

        {/* Restricted count badge */}
        {restrictedCount > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
            <span className="text-[11px] font-bold text-red-400">{restrictedCount} Restricted</span>
          </div>
        )}
      </div>

      {/* Table Header (desktop only) */}
      {!isLoading && filtered.length > 0 && (
        <div className="hidden md:flex items-center rounded-xl px-1 py-2 text-[10px] font-mono uppercase tracking-wider text-white/25"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="w-[3px] flex-shrink-0" />
          <div className="flex-1 min-w-0 px-4">Description</div>
          <div className="w-24 flex-shrink-0 px-3">Instrument</div>
          <div className="w-28 flex-shrink-0 px-3">Date / Countdown</div>
          <div className="w-16 flex-shrink-0 px-2 text-center">Actual</div>
          <div className="w-16 flex-shrink-0 px-2 text-center">Forecast</div>
          <div className="w-16 flex-shrink-0 px-2 text-center">Previous</div>
          <div className="w-12 flex-shrink-0 px-2 text-center">Set</div>
        </div>
      )}

      {/* Events List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Clock className="w-10 h-10 text-white/10 mb-3" />
          <p className="text-sm text-white/30">No events match your filters for {DATE_TABS.find(t => t.id === dateTab)?.label}.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(([dateKey, group]) => (
            <div key={dateKey}>
              {/* Day header */}
              <div className="sticky top-0 z-10 px-4 py-2 mb-1 rounded-lg text-xs font-bold uppercase tracking-wider text-white/50"
                style={{ background: 'rgba(10,10,12,0.95)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)' }}>
                {group.date}
                <span className="ml-2 text-white/20 font-normal normal-case">· {group.events.length} event{group.events.length !== 1 ? 's' : ''}</span>
              </div>
              {/* Events */}
              <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {group.events.map((ev) => (
                  <EventRow key={ev.id} event={ev} now={now} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}