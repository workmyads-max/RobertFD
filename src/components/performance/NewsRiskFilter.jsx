import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Newspaper, AlertTriangle, Shield, Clock, Ban, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const HIGH_IMPACT_EVENTS = [
  { name: 'Non-Farm Payrolls (NFP)', symbol: 'USD', impact: 'critical', description: 'US employment data - highest impact event', restricted: true },
  { name: 'Federal Reserve Rate Decision (FOMC)', symbol: 'USD', impact: 'critical', description: 'Fed interest rate announcement and statement', restricted: true },
  { name: 'Consumer Price Index (CPI)', symbol: 'USD', impact: 'critical', description: 'US inflation data release', restricted: true },
  { name: 'ECB Interest Rate Decision', symbol: 'EUR', impact: 'high', description: 'European Central Bank policy announcement', restricted: true },
  { name: 'Bank of England Rate Decision', symbol: 'GBP', impact: 'high', description: 'BoE monetary policy statement', restricted: true },
  { name: 'Bank of Japan Rate Decision', symbol: 'JPY', impact: 'high', description: 'BoJ monetary policy statement', restricted: true },
  { name: 'GDP (Advance)', symbol: 'USD', impact: 'high', description: 'US Gross Domestic Product preliminary reading', restricted: false },
  { name: 'Retail Sales', symbol: 'USD', impact: 'medium', description: 'US consumer spending data', restricted: false },
  { name: 'PMI Manufacturing', symbol: 'USD', impact: 'medium', description: 'Manufacturing activity index', restricted: false },
  { name: 'Unemployment Claims', symbol: 'USD', impact: 'medium', description: 'Weekly jobless claims', restricted: false },
];

const IMPACT_CONFIG = {
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'CRITICAL', border: 'rgba(239,68,68,0.3)' },
  high: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'HIGH', border: 'rgba(245,158,11,0.3)' },
  medium: { color: '#6366f1', bg: 'rgba(99,102,241,0.1)', label: 'MEDIUM', border: 'rgba(99,102,241,0.3)' },
};

const CURRENCY_FLAGS = { USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', JPY: '🇯🇵', CHF: '🇨🇭', CAD: '🇨🇦', AUD: '🇦🇺', NZD: '🇳🇿' };

export default function NewsRiskFilter({ account }) {
  const [filter, setFilter] = useState('all');
  const isSwing = account?.account_type === 'swing';

  const restrictedEvents = HIGH_IMPACT_EVENTS.filter(e => e.restricted && !isSwing);
  const warningCount = restrictedEvents.length;

  const filteredEvents = HIGH_IMPACT_EVENTS.filter(e => {
    if (filter === 'restricted') return e.restricted && !isSwing;
    if (filter === 'critical') return e.impact === 'critical';
    if (filter === 'high') return e.impact === 'high';
    return true;
  });

  return (
    <div>
      {/* Account type notice */}
      <div className="rounded-2xl p-4 mb-6 flex items-start gap-4"
        style={{ background: isSwing ? 'rgba(16,185,129,0.07)' : 'rgba(239,68,68,0.07)', border: `1px solid ${isSwing ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}` }}>
        {isSwing
          ? <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          : <Ban className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />}
        <div>
          <div className={`text-sm font-bold mb-1 ${isSwing ? 'text-emerald-400' : 'text-red-400'}`}>
            {isSwing ? 'Swing Account - News Trading Allowed' : 'Standard Account - News Restrictions Active'}
          </div>
          <div className="text-xs text-muted-foreground">
            {isSwing
              ? 'Your 1:30 swing account is exempt from news trading restrictions. You may hold positions during all economic releases.'
              : `Your 1:100 standard account cannot hold positions during ${warningCount} high-impact events. Violations will result in account breach.`}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Restricted Events', value: isSwing ? 0 : restrictedEvents.length, color: '#ef4444' },
          { label: 'Critical Impact', value: HIGH_IMPACT_EVENTS.filter(e => e.impact === 'critical').length, color: '#f59e0b' },
          { label: 'Your Status', value: isSwing ? 'EXEMPT' : 'RESTRICTED', color: isSwing ? '#10b981' : '#ef4444' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 text-center"
            style={{ background: `${s.color}08`, border: `1px solid ${s.color}22` }}>
            <div className="text-xl font-black" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[11px] font-mono text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {[
          { id: 'all', label: 'All Events' },
          { id: 'restricted', label: 'Restricted' },
          { id: 'critical', label: 'Critical Only' },
          { id: 'high', label: 'High Impact' },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: filter === f.id ? 'rgba(255,92,0,0.15)' : 'rgba(255,255,255,0.04)',
              color: filter === f.id ? '#FF5C00' : 'rgba(255,255,255,0.4)',
              border: `1px solid ${filter === f.id ? 'rgba(255,92,0,0.3)' : 'rgba(255,255,255,0.08)'}`,
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Events list */}
      <div className="space-y-3">
        {filteredEvents.map((event, i) => {
          const cfg = IMPACT_CONFIG[event.impact];
          const isRestricted = event.restricted && !isSwing;
          return (
            <motion.div key={event.name}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="rounded-xl p-4 flex items-center gap-4 flex-wrap"
              style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${isRestricted ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.07)'}` }}>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="text-xl flex-shrink-0">{CURRENCY_FLAGS[event.symbol] || '🌍'}</div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-foreground truncate">{event.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">{event.description}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black"
                  style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                  {cfg.label}
                </span>
                <span className="text-xs font-mono text-muted-foreground">{event.symbol}</span>
                {isRestricted
                  ? <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-red-400"
                      style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
                      <Ban className="w-2.5 h-2.5" /> RESTRICTED
                    </span>
                  : <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-400"
                      style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                      <CheckCircle className="w-2.5 h-2.5" /> ALLOWED
                    </span>
                }
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Policy reminder */}
      {!isSwing && (
        <div className="mt-6 rounded-2xl p-4 flex items-start gap-3"
          style={{ background: 'rgba(255,92,0,0.05)', border: '1px solid rgba(255,92,0,0.15)' }}>
          <AlertTriangle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground">
            <strong className="text-foreground">Policy Reminder:</strong> Opening or holding positions 2 minutes before and after restricted news events on a Standard (1:100) account constitutes a rule violation. Switch to a Swing account for full news trading access.
          </div>
        </div>
      )}
    </div>
  );
}