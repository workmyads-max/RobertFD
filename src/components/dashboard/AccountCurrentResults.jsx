/**
 * FTMO-style "Current Results" + "Free Trial" side card
 * Uses real MT5-synced data from ChallengeAccount + TradeRecord
 */
import React, { useState, useMemo } from 'react';
import { Info, Download } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

function fmt(n, d = 2) {
  return (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}

function InfoTip({ text }) {
  const [show, setShow] = React.useState(false);
  return (
    <span className="relative inline-flex items-center cursor-pointer" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <Info className="w-3.5 h-3.5 text-muted-foreground" />
      {show && (
        <span className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 text-xs rounded-xl px-3 py-2.5 text-center shadow-2xl"
          style={{ background: '#1a1b2e', border: '1px solid rgba(255,255,255,0.12)', color: '#e2e8f0' }}>
          {text}
        </span>
      )}
    </span>
  );
}

function buildEquityCurve(trades, accountSize) {
  const closed = trades
    .filter(t => t.status === 'closed' && t.pnl != null)
    .sort((a, b) => new Date(a.close_time || 0) - new Date(b.close_time || 0));

  if (closed.length === 0) return [{ label: 'Start', balance: accountSize, equity: accountSize }];

  const points = [{ label: 'Start', balance: accountSize, equity: accountSize }];
  let running = accountSize;
  closed.forEach((t, i) => {
    running = parseFloat((running + (t.pnl || 0)).toFixed(2));
    const ts = t.close_time ? new Date(t.close_time) : null;
    const label = ts ? ts.toLocaleString('en-GB', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : `T${i + 1}`;
    points.push({ label, balance: running, equity: running });
  });
  return points;
}

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-xl text-[11px] font-mono shadow-xl"
      style={{ background: 'rgba(6,10,22,0.97)', border: '1px solid rgba(255,255,255,0.1)' }}>
      <div className="text-white/40 text-[9px] mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>{p.name}: ${fmt(p.value)}</div>
      ))}
    </div>
  );
};

export default function AccountCurrentResults({ account, liveEquity, liveUnrealizedPnl }) {
  const accountSize = account?.account_size || 100000;
  const balance = account?.balance ?? accountSize;
  // ⚡ Prefer live values passed from parent (updated every 5s from positions poll)
  const equity = liveEquity ?? (account?.equity ?? balance);
  const unrealizedPnl = liveUnrealizedPnl ?? (equity - balance);
  const snap = account?.rule_snapshot || {};

  const { data: trades = [] } = useQuery({
    queryKey: ['trade-records-results', account?.account_id],
    queryFn: () => base44.entities.TradeRecord.filter({ account_id: account.account_id }),
    enabled: !!account?.account_id,
    refetchInterval: 5000,  // ⚡ 5s
    staleTime: 3000,
  });

  const equityData = useMemo(() => buildEquityCurve(trades, accountSize), [trades, accountSize]);

  const provisioned = account?.provisioned_at ? new Date(account.provisioned_at) : new Date();
  const endDate = new Date(provisioned.getTime() + 30 * 24 * 60 * 60 * 1000);
  const fmtDate = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const phaseLabel = account?.phase === 'funded' ? 'Funded' : account?.phase === 'phase2' ? 'Phase 2' : 'Phase 1';
  const statusLabel = account?.status === 'active' ? 'Ongoing' : account?.status === 'passed' ? 'Passed' : account?.status === 'funded' ? 'Funded' : account?.status || 'Active';
  const statusColor = account?.status === 'active' ? '#10b981' : account?.status === 'funded' ? '#FF5C00' : '#60a5fa';

  const challengeLabel = account?.challenge_type === 'two-step' ? '2-Step'
    : account?.challenge_type === 'instant' ? 'Instant'
    : 'Instant Light';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* LEFT: Current Results */}
      <div className="lg:col-span-2 rounded-xl overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>

        <div className="px-4 sm:px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <span className="text-sm font-bold text-foreground">Current Results</span>
        </div>

        {/* Metric row - MOBILE: stack vertically */}
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x border-b"
          style={{ divideColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.06)' }}>
          {[
            {
              label: 'Balance',
              value: `$${fmt(balance)}`,
              tip: 'The total closed-trade balance of your account, excluding any open position floating P&L.',
              color: '#f1f5f9',
            },
            {
              label: 'Equity',
              value: `$${fmt(equity)}`,
              tip: 'The real-time value of the account, accounting for both open and closed positions. It reflects your balance plus or minus any unrealised profits or losses from current open trades.',
              color: equity >= accountSize ? '#10b981' : '#ef4444',
            },
            {
              label: 'Unrealized PnL',
              value: `${unrealizedPnl >= 0 ? '+' : ''}$${fmt(unrealizedPnl)}`,
              tip: 'The value of your open positions indicating unrealised profit or loss based on whether the sum is positive or negative.',
              color: unrealizedPnl > 0 ? '#10b981' : unrealizedPnl < 0 ? '#ef4444' : '#94a3b8',
            },
          ].map((m, i) => (
            <div key={m.label} className="px-4 sm:px-5 py-4">
              <div className="text-xs text-muted-foreground flex items-center gap-1.5 mb-2">
                {m.label} <InfoTip text={m.tip} />
              </div>
              <div className="text-lg sm:text-xl font-black font-mono" style={{ color: m.color }}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* Chart controls - MOBILE: stack */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-4 sm:px-5 py-3 border-b text-xs"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-muted-foreground whitespace-nowrap">Trading Objective Lines</span>
            <div className="flex rounded-lg overflow-hidden border border-white/10 text-xs">
              <span className="px-3 py-1 text-muted-foreground hover:bg-white/5 cursor-pointer">On</span>
              <span className="px-3 py-1 text-white font-semibold" style={{ background: '#3b82f6' }}>Off</span>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-muted-foreground whitespace-nowrap">PnL Values</span>
            <select className="flex-1 sm:flex-none px-3 py-1.5 rounded text-xs text-foreground outline-none"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', minHeight: '36px' }}>
              <option>Absolute</option>
              <option>Percentage</option>
            </select>
          </div>
        </div>

        {/* Equity Chart - MOBILE: responsive */}
        <div className="px-4 sm:px-5 pt-4 pb-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 text-xs">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-bold"
              style={{ background: '#3b82f6', color: 'white' }}>
              ${fmt(balance)} Balance
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-bold"
              style={{ background: '#eab308', color: '#000' }}>
              ${fmt(equity)} Equity
            </span>
          </div>
          <div className="w-full" style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                <defs>
                  <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <ReferenceLine y={accountSize} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4"
                  label={{ value: `$${fmt(accountSize, 0)} Account size`, position: 'insideBottomLeft', fontSize: 9, fill: 'rgba(255,255,255,0.3)' }} />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}
                  axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}
                  axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} width={48} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="equity" stroke="#10b981" strokeWidth={2}
                  fill="url(#equityGrad)" dot={false}
                  activeDot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} name="Equity" />
                <Area type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={1.5}
                  fill="none" dot={false} strokeDasharray="4 2"
                  activeDot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }} name="Balance" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* RIGHT: Account Info - MOBILE: below chart */}
      <div className="rounded-xl overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>

        <div className="px-4 sm:px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <span className="text-sm font-bold text-foreground">{challengeLabel} Challenge</span>
        </div>

        <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          {[
            {
              label: 'Result',
              value: (
                <span className="px-3 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: `${statusColor}20`, color: statusColor, border: `1px solid ${statusColor}40` }}>
                  {statusLabel}
                </span>
              ),
            },
            { label: 'Status', value: <span className="font-bold text-foreground">Active</span> },
            {
              label: challengeLabel + ':',
              value: <span className="font-mono font-bold text-foreground">{account?.mt_login || '—'}</span>,
            },
            { label: 'Start:', value: <span className="font-semibold text-foreground">{fmtDate(provisioned)}</span> },
            {
              label: 'End:',
              value: (
                <span className="flex items-center gap-1 font-semibold text-foreground">
                  {fmtDate(endDate)} <InfoTip text="Challenge end date — 30 days from account activation." />
                </span>
              ),
            },
            {
              label: 'Account size:',
              value: <span className="font-bold text-foreground">${(accountSize).toLocaleString()}.00</span>,
            },
            {
              label: 'Account type:',
              value: <span className="font-bold text-foreground">{account?.account_type === 'swing' ? 'Swing' : 'Standard'}</span>,
            },
            {
              label: 'Platform (MT5):',
              value: (
                <a href="https://www.metatrader5.com/en/download" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline font-semibold text-sm">
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
              ),
            },
          ].map((row, i) => (
            <div key={i} className="flex items-center justify-between px-4 sm:px-5 py-3"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span className="text-xs text-muted-foreground">{row.label}</span>
              <span className="text-sm text-foreground text-right break-words max-w-[150px] sm:max-w-none">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}