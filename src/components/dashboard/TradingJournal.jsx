import React, { useState, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Info, Settings, Download, ExternalLink, Plus, BookOpen } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAccountTradeData } from '@/hooks/useAccountTradeData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import JournalEntryForm from './JournalEntryForm';
import JournalAnalytics from './JournalAnalytics';

const TABS = ['Daily PnL', 'Closed trades', 'Charts', 'My Journal'];

function fmt(n, d = 2) {
  if (n == null) return '—';
  const abs = Math.abs(n);
  if (abs >= 1000) return `$${n >= 0 ? '' : '-'}${abs.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}`;
  return `$${n >= 0 ? '' : '-'}${abs.toFixed(d)}`;
}

// ─── Daily PnL Calendar ────────────────────────────────────────────────────────
function DailyPnLTab({ trades }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // Build map: "YYYY-MM-DD" → { pnl, trades }
  const dayMap = useMemo(() => {
    const map = {};
    trades.filter(t => t.status === 'closed' && t.close_time).forEach(t => {
      const d = new Date(t.close_time);
      const key = d.toISOString().split('T')[0];
      if (!map[key]) map[key] = { pnl: 0, count: 0 };
      map[key].pnl += t.pnl || 0;
      map[key].count++;
    });
    return map;
  }, [trades]);

  // Monthly totals
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthlyPnl = Object.entries(dayMap)
    .filter(([k]) => k.startsWith(monthPrefix))
    .reduce((s, [, v]) => s + v.pnl, 0);
  const tradingDays = Object.keys(dayMap).filter(k => k.startsWith(monthPrefix)).length;

  // Calendar grid (Mon–Sun)
  const firstDay = new Date(year, month, 1);
  // Offset: Mon=0 … Sun=6
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const cells = [];
  // Leading days from prev month
  for (let i = startOffset - 1; i >= 0; i--) {
    cells.push({ day: prevMonthDays - i, current: false });
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, current: true });
  }
  // Trailing days
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, current: false });
  }

  const todayKey = today.toISOString().split('T')[0];
  const DAY_HEADERS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const goToday = () => setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));

  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button onClick={goToday} className="px-3 py-1.5 rounded text-sm font-medium border"
            style={{ borderColor: 'rgba(255,255,255,0.15)', color: '#e2e8f0', background: 'rgba(255,255,255,0.05)' }}>
            Today
          </button>
          <button onClick={prevMonth} className="w-7 h-7 rounded flex items-center justify-center hover:bg-white/5">
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <span className="text-sm font-semibold text-foreground min-w-[110px] text-center">{monthLabel}</span>
          <button onClick={nextMonth} className="w-7 h-7 rounded flex items-center justify-center hover:bg-white/5">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">Monthly stats:</span>
          <span className="font-semibold" style={{ color: monthlyPnl >= 0 ? '#4ade80' : '#f87171' }}>{fmt(monthlyPnl)}</span>
          <span className="text-muted-foreground">Trading days: <strong className="text-foreground">{tradingDays}</strong></span>
          <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/5">
            <Settings className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="rounded-lg overflow-hidden border" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          {DAY_HEADERS.map(d => (
            <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
          ))}
        </div>

        {/* Weeks */}
        {[0, 1, 2, 3, 4, 5].map(week => (
          <div key={week} className="grid grid-cols-7 border-b last:border-b-0 min-h-[64px] sm:min-h-[90px]" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            {cells.slice(week * 7, week * 7 + 7).map((cell, idx) => {
              if (!cell) return <div key={idx} className="border-r last:border-r-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }} />;
              const dateKey = cell.current
                ? `${year}-${String(month + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`
                : null;
              const data = dateKey ? dayMap[dateKey] : null;
              const isToday = dateKey === todayKey;
              return (
                <div key={idx}
                  className="border-r last:border-r-0 p-1.5 relative"
                  style={{ borderColor: 'rgba(255,255,255,0.05)', background: isToday ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                  <div className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1
                    ${!cell.current ? 'text-muted-foreground/30' : isToday ? 'bg-blue-500 text-white' : 'text-muted-foreground'}`}>
                    {cell.day}
                  </div>
                  {data && cell.current && (
                    <div className="rounded px-1.5 py-1" style={{ background: data.pnl >= 0 ? 'rgba(20,83,45,0.8)' : 'rgba(127,29,29,0.8)' }}>
                      <div className="text-xs font-bold" style={{ color: data.pnl >= 0 ? '#4ade80' : '#f87171' }}>
                        {fmt(data.pnl)}
                      </div>
                      <div className="text-[10px] text-white/70">Trades: {data.count}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {tradingDays === 0 && (
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">No closed trades this month</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Once you close positions, your daily PnL will appear here</p>
        </div>
      )}
      <div className="mt-3 text-center text-xs" style={{ color: '#60a5fa' }}>
        The trades are in the platform time which might differ from CE(S)T
      </div>
    </div>
  );
}

// ─── Closed Trades Tab ─────────────────────────────────────────────────────────
function TradeRow({ trade, index }) {
  const [expanded, setExpanded] = useState(false);
  const isBuy = trade.type === 'BUY';
  const pnl = trade.pnl || 0;

  const openTime = trade.open_time ? new Date(trade.open_time) : null;
  const closeTime = trade.close_time ? new Date(trade.close_time) : null;

  const durationMs = openTime && closeTime ? closeTime - openTime : 0;
  const durH = Math.floor(durationMs / 3600000);
  const durM = Math.floor((durationMs % 3600000) / 60000);
  const durS = Math.floor((durationMs % 60000) / 1000);
  const duration = durationMs > 0
    ? `${String(durH).padStart(2,'0')}:${String(durM).padStart(2,'0')}:${String(durS).padStart(2,'0')}`
    : '—';

  // Pips estimate
  const pips = trade.entry && trade.close
    ? Math.abs(trade.close - trade.entry) * (trade.entry > 10 ? 10 : 1000)
    : 0;

  const fmtDate = (d) => d ? d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—';

  return (
    <>
      <tr className="border-b hover:bg-white/[0.02] cursor-pointer transition-colors"
        style={{ borderColor: 'rgba(255,255,255,0.05)' }}
        onClick={() => setExpanded(e => !e)}>
        <td className="px-3 py-3">
          <div className="text-xs font-mono text-muted-foreground">{trade.trade_id?.slice(0,10) || String(index + 1)}</div>
          <div className="text-xs font-medium"
            style={{ color: isBuy ? '#4ade80' : '#f87171' }}>
            {isBuy ? '↗ Buy' : '↘ Sell'}
          </div>
          <div className="text-[10px] text-muted-foreground">{openTime ? fmtDate(openTime) : '—'}</div>
        </td>
        <td className="px-3 py-3 text-sm text-center text-foreground">{trade.lots || '—'}</td>
        <td className="px-3 py-3 text-sm font-mono font-medium text-center text-foreground">{trade.symbol || '—'}</td>
        <td className="px-3 py-3 text-center">
          <span className="text-sm font-bold font-mono" style={{ color: pnl >= 0 ? '#4ade80' : '#f87171' }}>
            {pnl >= 0 ? '+' : ''}{fmt(pnl)}
          </span>
        </td>
        <td className="px-3 py-3 text-xs font-mono text-center text-muted-foreground hidden sm:table-cell">{pips > 0 ? pips.toFixed(1) : '—'}</td>
        <td className="px-3 py-3 text-xs font-mono text-center text-muted-foreground hidden sm:table-cell">{duration}</td>
        <td className="px-3 py-3 text-center hidden sm:table-cell">
          <button className="p-1 rounded hover:bg-white/10">
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </td>
        <td className="px-3 py-3 text-center text-muted-foreground">
          {expanded ? <ChevronUp className="w-4 h-4 mx-auto" /> : <ChevronDown className="w-4 h-4 mx-auto" />}
        </td>
      </tr>

      {expanded && (
        <tr>
          <td colSpan={8} className="px-4 pb-4">
            <div className="rounded-xl p-4 mt-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {/* Price */}
              <div>
                <div className="text-[10px] font-bold text-muted-foreground mb-2 flex items-center gap-1">$ Price</div>
                <div className="space-y-1.5 text-xs">
                  {[
                    ['Type', trade.type, isBuy ? '#4ade80' : '#f87171'],
                    ['Open', trade.entry > 0 ? trade.entry.toFixed(5) : '—'],
                    ['Close', trade.close > 0 ? trade.close.toFixed(5) : '—'],
                  ].map(([k, v, c]) => (
                    <div key={k} className="flex justify-between gap-3">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="font-mono" style={{ color: c || '#f1f5f9' }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Trade Protection */}
              <div>
                <div className="text-[10px] font-bold text-muted-foreground mb-2 flex items-center gap-1.5">
                  <input type="checkbox" className="w-3 h-3 accent-primary" readOnly checked={!!(trade.sl || trade.tp)} />
                  Trade Protection
                </div>
                <div className="space-y-1.5 text-xs">
                  {[
                    ['SL', trade.sl > 0 ? trade.sl.toFixed(5) : '—'],
                    ['SL Pips', '—'],
                    ['TP', trade.tp > 0 ? trade.tp.toFixed(5) : '—'],
                    ['TP Pips', '—'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="font-mono text-foreground">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Results */}
              <div>
                <div className="text-[10px] font-bold text-muted-foreground mb-2 flex items-center gap-1">
                  <span style={{ color: '#4ade80' }}>✓</span> Results
                </div>
                <div className="space-y-1.5 text-xs">
                  {[
                    ['Gross profit', pnl, pnl >= 0 ? '#4ade80' : '#f87171'],
                    ['Swap', trade.swap || 0, '#94a3b8'],
                    ['Comm.', 0, '#94a3b8'],
                    ['Net profit', pnl + (trade.swap || 0), (pnl + (trade.swap || 0)) >= 0 ? '#4ade80' : '#f87171'],
                  ].map(([k, v, c]) => (
                    <div key={k} className="flex justify-between gap-3">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="font-mono font-bold" style={{ color: c }}>{typeof v === 'number' ? fmt(v) : v}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Time */}
              <div>
                <div className="text-[10px] font-bold text-muted-foreground mb-2">Time</div>
                <div className="space-y-2 text-xs">
                  <div>
                    <div className="text-muted-foreground mb-0.5">Open</div>
                    <div className="font-mono text-foreground">{openTime ? fmtDate(openTime) : '—'}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-0.5">Closed</div>
                    <div className="font-mono text-foreground">{closeTime ? fmtDate(closeTime) : '—'}</div>
                  </div>
                </div>
              </div>
              {/* Trade Stats */}
              <div>
                <div className="text-[10px] font-bold text-muted-foreground mb-2 flex items-center gap-1">
                  Trade Stats <Info className="w-3 h-3" />
                </div>
                <div className="space-y-1.5 text-xs">
                  {(() => {
                    const entry = trade.entry || 0;
                    const close = trade.close || entry;
                    const pipSize = entry > 10 ? 0.0001 : 0.00001;
                    const mae = isBuy ? Math.min(0, close - entry) : Math.min(0, entry - close);
                    const mfe = isBuy ? Math.max(0, close - entry) : Math.max(0, entry - close);
                    return [
                      ['MAE Pip', mae !== 0 ? (mae / pipSize).toFixed(1) : '—'],
                      ['MAE', mae !== 0 ? (entry + mae).toFixed(5) : entry > 0 ? entry.toFixed(5) : '—'],
                      ['MFE Pip', mfe !== 0 ? (mfe / pipSize).toFixed(1) : '—'],
                      ['MFE', mfe !== 0 ? (entry + mfe).toFixed(5) : close > 0 ? close.toFixed(5) : '—'],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-3">
                        <span className="text-muted-foreground">{k}</span>
                        <span className="font-mono text-foreground">{v}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>

            {/* Notes area */}
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-muted-foreground mb-1.5">Entry strategy</div>
                <textarea className="w-full rounded-lg px-3 py-2 text-sm resize-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', height: 56 }}
                  placeholder="Describe your entry strategy..." />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1.5">Exit strategy</div>
                <textarea className="w-full rounded-lg px-3 py-2 text-sm resize-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', height: 56 }}
                  placeholder="Describe your exit strategy..." />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1.5">Comments on trade</div>
                <textarea className="w-full rounded-lg px-3 py-2 text-sm resize-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', height: 56 }}
                  placeholder="Any comments..." />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1.5">Tags</div>
                <input className="w-full rounded-lg px-3 py-2 text-sm"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }}
                  placeholder="Select tags..." />
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function ClosedTradesTab({ trades }) {
  const [sortBy, setSortBy] = useState('Close Time');
  const [search, setSearch] = useState('');

  const closed = trades.filter(t => t.status === 'closed');
  const sorted = [...closed].sort((a, b) => {
    if (sortBy === 'Close Time') return new Date(b.close_time || 0) - new Date(a.close_time || 0);
    if (sortBy === 'Open Time') return new Date(b.open_time || 0) - new Date(a.open_time || 0);
    if (sortBy === 'PnL') return (b.pnl || 0) - (a.pnl || 0);
    return 0;
  });
  const filtered = sorted.filter(t =>
    !search || (t.trade_id?.includes(search) || t.symbol?.toLowerCase().includes(search.toLowerCase()))
  );

  const handleExport = () => {
    const csv = ['Trade ID,Type,Symbol,Lots,Entry,Close,PnL,Open Time,Close Time']
      .concat(filtered.map(t =>
        `${t.trade_id || ''},${t.type || ''},${t.symbol || ''},${t.lots || ''},${t.entry || ''},${t.close || ''},${t.pnl || ''},${t.open_time || ''},${t.close_time || ''}`
      )).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'trades.csv'; a.click();
  };

  return (
    <div>
      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div>
          <div className="text-[10px] text-muted-foreground mb-1">Sort by</div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="px-3 py-1.5 rounded text-sm text-foreground outline-none"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <option>Close Time</option>
            <option>Open Time</option>
            <option>PnL</option>
          </select>
        </div>
        <div className="flex-1">
          <div className="text-[10px] text-muted-foreground mb-1">Search tickets or tags</div>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Select..."
            className="w-full max-w-xs px-3 py-1.5 rounded text-sm text-foreground outline-none placeholder:text-muted-foreground"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }} />
        </div>
        <div className="ml-auto mt-4">
          <button onClick={handleExport}
            className="flex items-center gap-2 px-4 py-1.5 rounded text-sm font-medium"
            style={{ background: '#3b82f6', color: 'white' }}>
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">No closed trades found</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)' }}>
                {['Type', 'Volume', 'Symbol', 'PnL', 'Pips', 'Duration', '', ''].map((h, i) => (
                  <th key={i} className={`px-3 py-2.5 text-left text-[10px] font-medium text-muted-foreground ${i >= 4 && i <= 6 ? 'hidden sm:table-cell' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => <TradeRow key={t.id || i} trade={t} index={i} />)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Charts Tab ────────────────────────────────────────────────────────────────
function ChartsTab({ trades }) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [volumeFilter, setVolumeFilter] = useState('all');
  const [symbolFilter, setSymbolFilter] = useState('all');

  const closed = trades.filter(t => t.status === 'closed');
  const symbols = [...new Set(closed.map(t => t.symbol).filter(Boolean))];

  const filtered = closed.filter(t => {
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;
    if (symbolFilter !== 'all' && t.symbol !== symbolFilter) return false;
    return true;
  });

  // Open time hour chart
  const hourMap = {};
  filtered.forEach(t => {
    if (!t.open_time) return;
    const h = new Date(t.open_time).getHours();
    const key = `${String(h).padStart(2,'0')}:00`;
    if (!hourMap[key]) hourMap[key] = 0;
    hourMap[key] += t.pnl || 0;
  });
  const hourData = Object.entries(hourMap).sort().map(([h, pnl]) => ({ label: h, pnl }));

  // Buy vs Sell
  const buyPnl = filtered.filter(t => t.type === 'BUY').reduce((s, t) => s + (t.pnl || 0), 0);
  const sellPnl = filtered.filter(t => t.type === 'SELL').reduce((s, t) => s + (t.pnl || 0), 0);
  const bsData = [
    { label: 'Sell', pnl: sellPnl, color: '#f87171' },
    { label: 'Buy', pnl: buyPnl, color: '#4ade80' },
  ];

  // Volume (lots)
  const volMap = {};
  filtered.forEach(t => {
    const lots = (t.lots || 0).toFixed(1);
    if (!volMap[lots]) volMap[lots] = 0;
    volMap[lots] += t.pnl || 0;
  });
  const volData = Object.entries(volMap).sort().map(([label, pnl]) => ({ label, pnl }));

  // Symbol chart
  const symbolMap = {};
  filtered.forEach(t => {
    if (!t.symbol) return;
    if (!symbolMap[t.symbol]) symbolMap[t.symbol] = 0;
    symbolMap[t.symbol] += t.pnl || 0;
  });
  const symbolData = Object.entries(symbolMap).map(([label, pnl]) => ({ label, pnl }));

  const ChartCard = ({ title, data, color = '#4ade80' }) => (
    <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="text-sm font-semibold text-foreground mb-4">{title}</div>
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-xs text-muted-foreground">No data</div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} barSize={32}>
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}
              tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(1)+'k' : v.toFixed(0)}`} />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
              formatter={(v) => [fmt(v), 'PnL']}
            />
            <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.color || (d.pnl >= 0 ? '#4ade80' : '#f87171')} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );

  const handleExport = () => {
    const csv = ['Symbol,Type,Lots,PnL']
      .concat(filtered.map(t => `${t.symbol||''},${t.type||''},${t.lots||''},${t.pnl||''}`)).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'charts.csv'; a.click();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Select..."
          className="px-3 py-1.5 rounded text-sm text-foreground outline-none placeholder:text-muted-foreground"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }} />
        <div className="flex items-center gap-2">
          <span className="text-xs text-red-400">Filter Trades</span>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="px-2 py-1 rounded text-xs text-foreground outline-none"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <option value="all">Type ▾</option>
            <option value="BUY">Buy</option>
            <option value="SELL">Sell</option>
          </select>
          <select value={volumeFilter} onChange={e => setVolumeFilter(e.target.value)}
            className="px-2 py-1 rounded text-xs text-foreground outline-none"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <option value="all">Volume ▾</option>
            <option value="0.01">0.01</option>
            <option value="0.1">0.1</option>
            <option value="1">1</option>
          </select>
          <select value={symbolFilter} onChange={e => setSymbolFilter(e.target.value)}
            className="px-2 py-1 rounded text-xs text-foreground outline-none"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <option value="all">Symbol ▾</option>
            {symbols.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="ml-auto">
          <button onClick={handleExport}
            className="flex items-center gap-2 px-4 py-1.5 rounded text-sm font-medium"
            style={{ background: '#3b82f6', color: 'white' }}>
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Open time hour" data={hourData} />
        <ChartCard title="Buy & Sell" data={bsData} />
        <ChartCard title="Volume" data={volData} />
        <ChartCard title="Symbol" data={symbolData} />
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function TradingJournal({ user }) {
  const [tab, setTab] = useState('Daily PnL');
  const [selectedAccountId, setSelectedAccountId] = useState(null);

  const userEmail = user?.email || '';

  // Use getUserAccounts backend function (case-insensitive email match) — same as Dashboard
  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ['challenge-accounts', userEmail],
    queryFn: async () => {
      if (!userEmail) return [];
      const res = await base44.functions.invoke('getUserAccounts', {});
      return res?.data?.accounts || [];
    },
    enabled: !!userEmail,
    select: d => d.filter(a => !a.is_trashed && ['active', 'funded', 'passed'].includes(a.status)),
  });

  const account = accounts.find(a => a.id === selectedAccountId) || accounts[0] || null;

  // Use centralized trade data hook — same as AccountOverview (getAccountTradeRecords backend)
  const { closedTrades: trades = [], isLoading } = useAccountTradeData(account, { refetchIntervalMs: 15000 });

  // ── Actual journal entries (TradingJournalEntry entity) ──────────────────
  const qc = useQueryClient();
  const { data: journalEntries = [] } = useQuery({
    queryKey: ['journal-entries', userEmail, account?.account_id],
    queryFn: () => base44.entities.TradingJournalEntry.filter(
      { user_email: userEmail, account_id: account?.account_id },
      '-entry_date', 100
    ),
    enabled: !!userEmail && !!account?.account_id,
  });

  const [showEntryForm, setShowEntryForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <h1 className="text-xl font-bold text-foreground">Trading journal</h1>
        <Info className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Account selector */}
      {accounts.length > 1 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {accounts.map(a => (
            <button key={a.id} onClick={() => setSelectedAccountId(a.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-mono transition-all"
              style={{
                background: account?.id === a.id ? 'rgba(255,92,0,0.12)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${account?.id === a.id ? 'rgba(255,92,0,0.4)' : 'rgba(255,255,255,0.1)'}`,
                color: account?.id === a.id ? '#FF5C00' : '#94a3b8',
              }}>
              {a.mt_login || a.account_id} · ${(a.account_size || 0).toLocaleString()}
            </button>
          ))}
        </div>
      )}

      {/* Empty state — no accounts */}
      {accounts.length === 0 && (
        <div className="text-center py-20 rounded-2xl" style={{ border: '1px dashed rgba(255,255,255,0.1)' }}>
          <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No active trading accounts</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Purchase a challenge to start journaling your trades</p>
        </div>
      )}

      {/* Tabs — only show when accounts exist */}
      {accounts.length > 0 && (
        <div className="flex border-b mb-6 overflow-x-auto scrollbar-hide" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-4 py-2.5 text-sm font-medium border-b-2 transition-colors mr-1 whitespace-nowrap flex-shrink-0"
              style={{
                borderBottomColor: tab === t ? '#3b82f6' : 'transparent',
                color: tab === t ? '#3b82f6' : '#94a3b8',
              }}>
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {accounts.length === 0 ? null : (isLoading || accountsLoading) ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {tab === 'Daily PnL' && <DailyPnLTab trades={trades} />}
          {tab === 'Closed trades' && <ClosedTradesTab trades={trades} />}
          {tab === 'Charts' && <ChartsTab trades={trades} />}
          {tab === 'My Journal' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-foreground">My Journal Entries</h2>
                <button
                  onClick={() => { setEditingEntry(null); setShowEntryForm(true); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all"
                  style={{ background: 'linear-gradient(90deg, #FF5C00, #FF7A2F)', boxShadow: '0 4px 12px rgba(255,92,0,0.3)' }}>
                  <Plus className="w-4 h-4" /> New Entry
                </button>
              </div>

              <JournalAnalytics entries={journalEntries} />

              {journalEntries.length === 0 ? (
                <div className="text-center py-16 rounded-2xl mt-4" style={{ border: '1px dashed rgba(255,255,255,0.1)' }}>
                  <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">No journal entries yet. Start tracking your trading!</p>
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  {journalEntries.slice(0, 30).map(entry => (
                    <div key={entry.id}
                      onClick={() => { setEditingEntry(entry); setShowEntryForm(true); }}
                      className="rounded-xl p-4 cursor-pointer hover:bg-white/[0.03] transition-colors"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-primary">{entry.entry_date}</span>
                          <span className="text-xs font-mono text-muted-foreground capitalize">{entry.period_type || 'daily'}</span>
                          {(entry.emotions || []).slice(0, 3).map(e => (
                            <span key={e} className="px-2 py-0.5 rounded-full text-[10px] font-mono capitalize"
                              style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}>{e}</span>
                          ))}
                        </div>
                        <div className="flex items-center gap-4">
                          {entry.pnl != null && (
                            <span className="text-sm font-bold font-mono" style={{ color: entry.pnl >= 0 ? '#4ade80' : '#f87171' }}>
                              {entry.pnl >= 0 ? '+' : ''}${entry.pnl}
                            </span>
                          )}
                          {entry.win_rate != null && (
                            <span className="text-xs text-muted-foreground">WR: {entry.win_rate}%</span>
                          )}
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                      {entry.notes && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{entry.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {showEntryForm && (
                <AnimatePresence>
                <JournalEntryForm
                  entry={editingEntry}
                  accountId={account?.account_id}
                  userEmail={userEmail}
                  onClose={() => { setShowEntryForm(false); setEditingEntry(null); }}
                  onSaved={() => {
                    setShowEntryForm(false);
                    setEditingEntry(null);
                    qc.invalidateQueries({ queryKey: ['journal-entries', userEmail, account?.account_id] });
                  }}
                />
                </AnimatePresence>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}