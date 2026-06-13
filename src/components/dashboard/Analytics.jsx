import React, { useState } from 'react';
import { BarChart3, Plus, TrendingUp, Target, Activity, Award, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg px-3 py-2 text-xs shadow-xl" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-semibold">
          {typeof p.value === 'number' && Math.abs(p.value) > 100 ? `$${p.value.toLocaleString()}` : p.value}
        </p>
      ))}
    </div>
  );
};

function StatRow({ label, value, valueColor }) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-b-0" style={{ borderColor: 'hsl(var(--border))' }}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium ${valueColor || 'text-foreground'}`}>{value}</span>
    </div>
  );
}

function ObjectiveBar({ label, current, target, color, passed, danger }) {
  const pct = Math.min((current / target) * 100, 100);
  const status = passed ? 'On Track' : danger ? 'At Risk' : 'In Progress';
  const statusColor = passed ? 'text-emerald-400' : danger ? 'text-red-400' : 'text-muted-foreground';
  return (
    <div className="py-3.5 border-b last:border-b-0" style={{ borderColor: 'hsl(var(--border))' }}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium text-foreground">{label}</div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-foreground">{current.toFixed(2)}%<span className="text-muted-foreground"> / {target}%</span></span>
          <span className={`text-xs font-medium ${statusColor} hidden sm:inline`}>{status}</span>
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function EmptyState({ onStartChallenge }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="text-base font-semibold text-foreground mb-2">No Analytics Available</div>
      <div className="text-sm text-muted-foreground mb-6 max-w-sm">
        Analytics require an active challenge account.
      </div>
      <button onClick={onStartChallenge}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-opacity"
        style={{ background: '#FF5C00' }}>
        <Plus className="w-4 h-4" /> Start a Challenge
      </button>
    </div>
  );
}

export default function Analytics({ onStartChallenge }) {
  const [selectedAccountId, setSelectedAccountId] = useState(null);

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const { data: accounts = [] } = useQuery({
    queryKey: ['challenge-accounts', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.ChallengeAccount.filter({ user_email: user.email }, '-created_date', 100);
    },
    enabled: !!user?.email,
  });

  const { data: journalEntries = [] } = useQuery({
    queryKey: ['journal-entries', user?.email],
    queryFn: () => base44.entities.TradingJournalEntry.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const activeAccounts = accounts.filter(a => ['active', 'funded', 'passed'].includes(a.status));

  // Resolve the selected account object first, then query trades by its account_id string
  const account = activeAccounts.find(a => a.id === selectedAccountId) || activeAccounts[0] || null;

  const { data: tradeRecords = [] } = useQuery({
    queryKey: ['trade-records-analytics', account?.account_id],
    queryFn: () => base44.entities.TradeRecord.filter({ account_id: account.account_id }),
    enabled: !!account?.account_id,
  });

  if (activeAccounts.length === 0) return <EmptyState onStartChallenge={onStartChallenge} />;
  const accountSize = account.account_size || 100000;

  // Build equity curve
  const closedTrades = tradeRecords.filter(t => t.status === 'closed' && t.close_time);
  const openTrades = tradeRecords.filter(t => t.status === 'open');
  const tradesByDay = {};
  closedTrades.forEach(t => {
    const day = t.close_time?.split(' ')[0] || t.updated_date?.split('T')[0] || 'Unknown';
    if (!tradesByDay[day]) tradesByDay[day] = 0;
    tradesByDay[day] += t.pnl || 0;
  });
  let runningEquity = accountSize;
  const equityCurve = [{ day: 'Start', equity: accountSize }];
  Object.entries(tradesByDay).sort().forEach(([day, pnl]) => {
    runningEquity += pnl;
    equityCurve.push({ day: new Date(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), equity: parseFloat(runningEquity.toFixed(2)) });
  });
  if (equityCurve.length === 1) equityCurve.push({ day: 'Now', equity: account.balance || accountSize });

  // Daily P&L
  const dailyPnlMap = {};
  closedTrades.forEach(t => {
    const day = t.close_time?.split(' ')[0] || t.updated_date?.split('T')[0] || '';
    if (!day) return;
    if (!dailyPnlMap[day]) dailyPnlMap[day] = 0;
    dailyPnlMap[day] += t.pnl || 0;
  });
  const dailyPnl = Object.entries(dailyPnlMap).sort().slice(-10).map(([day, pnl]) => ({
    day: new Date(day).toLocaleDateString('en-US', { weekday: 'short' }),
    pnl: parseFloat(pnl.toFixed(2)),
  }));

  // Stats
  const winTrades = closedTrades.filter(t => (t.pnl || 0) > 0);
  const lossTrades = closedTrades.filter(t => (t.pnl || 0) <= 0);
  const realWinRate = closedTrades.length > 0 ? (winTrades.length / closedTrades.length * 100) : 0;
  const avgWin = winTrades.length > 0 ? winTrades.reduce((s, t) => s + t.pnl, 0) / winTrades.length : 0;
  const avgLoss = lossTrades.length > 0 ? Math.abs(lossTrades.reduce((s, t) => s + t.pnl, 0) / lossTrades.length) : 0;
  const profitFactor = avgLoss > 0 ? (avgWin * winTrades.length) / (avgLoss * lossTrades.length) : 0;
  const bestTrade = closedTrades.length > 0 ? Math.max(...closedTrades.map(t => t.pnl || 0)) : 0;
  const worstTrade = closedTrades.length > 0 ? Math.min(...closedTrades.map(t => t.pnl || 0)) : 0;
  const symbolCount = {};
  tradeRecords.forEach(t => { symbolCount[t.symbol] = (symbolCount[t.symbol] || 0) + 1; });
  const mostTraded = Object.entries(symbolCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

  const totalPnl = account.pnl || 0;
  // Always prefer synced account values from MT5 — TradeRecord data may be incomplete
  const winRate = account.win_rate || (closedTrades.length > 0 ? realWinRate : 0);
  const totalTrades = account.total_trades || closedTrades.length || 0;
  const dailyDD = account.daily_drawdown_used || 0;
  const maxDD = account.max_drawdown_used || 0;
  // Read limits from rule_snapshot — never hardcoded
  const snap = account.rule_snapshot || {};
  const dailyDDLimit = snap.daily_dd_limit ?? 5;
  const maxDDLimit = snap.max_dd_limit ?? 10;
  const profitTarget = account.phase === 'phase2'
    ? (snap.phase2_target ?? 5)
    : (snap.phase1_target ?? (account.challenge_type === 'two-step' ? 10 : 8));
  const progress = account.profit_target_progress || Math.max(0, totalPnl / accountSize * 100);

  return (
    <div className="space-y-8">

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Performance dashboard for your challenge accounts</p>
        </div>
        {activeAccounts.length > 1 && (
          <select value={selectedAccountId || activeAccounts[0].id} onChange={e => setSelectedAccountId(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm text-foreground outline-none"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
            {activeAccounts.map(a => <option key={a.id} value={a.id} className="bg-card">{a.account_id} — ${(a.account_size || 0).toLocaleString()}</option>)}
          </select>
        )}
      </div>

      {/* Account context bar */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-4 px-4 sm:px-5 py-3 rounded-lg text-sm"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="font-medium text-foreground text-xs sm:text-sm">{account.account_id}</span>
        </div>
        <span className="text-muted-foreground/30 hidden sm:inline">|</span>
        <span className="text-muted-foreground text-xs sm:text-sm">${(account.account_size || 0).toLocaleString()}</span>
        <span className="text-muted-foreground/30 hidden sm:inline">|</span>
        <span className="text-muted-foreground capitalize text-xs sm:text-sm">{account.phase?.replace('phase', 'Phase ')}</span>
        <span className="text-muted-foreground/30 hidden sm:inline">|</span>
        <span className="capitalize text-xs sm:text-sm" style={{ color: account.status === 'active' ? '#10b981' : account.status === 'funded' ? '#FF5C00' : '#888' }}>{account.status}</span>
      </div>

      {/* KPI strip */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'hsl(var(--border))' }}>
        <div className="grid grid-cols-2 lg:grid-cols-4" style={{ borderColor: 'hsl(var(--border))' }}>
          {[
            { label: 'Total P&L', value: `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, sub: `${account.account_size ? ((totalPnl / account.account_size) * 100).toFixed(2) : '0.00'}% of account`, color: totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400' },
            { label: 'Win Rate', value: `${winRate.toFixed(1)}%`, sub: `${totalTrades} closed trades`, color: winRate >= 50 ? 'text-foreground' : 'text-yellow-400' },
            { label: 'Daily DD Used', value: `${dailyDD.toFixed(2)}%`, sub: `limit: ${dailyDDLimit}%`, color: dailyDD > dailyDDLimit * 0.8 ? 'text-red-400' : 'text-foreground' },
            { label: 'Max DD Used', value: `${maxDD.toFixed(2)}%`, sub: `limit: ${maxDDLimit}%`, color: maxDD > maxDDLimit * 0.7 ? 'text-red-400' : 'text-foreground' },
          ].map(s => (
            <div key={s.label} className="p-4 sm:p-6 border-b lg:border-b-0 border-r last:border-r-0 even:border-r-0 lg:even:border-r" style={{ borderColor: 'hsl(var(--border))' }}>
              <div className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2 sm:mb-3">{s.label}</div>
              <div className={`text-xl sm:text-3xl font-semibold tracking-tight mb-1 ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Trading Objectives */}
      <div className="rounded-xl border" style={{ borderColor: 'hsl(var(--border))' }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
          <div className="text-sm font-semibold text-foreground">Trading Objectives</div>
        </div>
        <div className="px-6 py-2">
          <ObjectiveBar label="Profit Target" current={progress} target={profitTarget || 10} color="#FF5C00" passed={progress >= (profitTarget || 10)} danger={false} />
          <ObjectiveBar label="Daily Drawdown" current={dailyDD} target={dailyDDLimit} color="#10b981" passed={dailyDD < dailyDDLimit} danger={dailyDD > dailyDDLimit * 0.8} />
          <ObjectiveBar label="Max Drawdown" current={maxDD} target={maxDDLimit} color="#10b981" passed={maxDD < maxDDLimit} danger={maxDD > maxDDLimit * 0.7} />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border" style={{ borderColor: 'hsl(var(--border))' }}>
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
            <div className="text-sm font-semibold text-foreground">Equity Curve</div>
            <span className={`text-sm font-semibold ${totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {totalPnl >= 0 ? '+' : ''}${totalPnl.toLocaleString()}
            </span>
          </div>
          <div className="p-6">
            {equityCurve.length > 1 ? (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={equityCurve}>
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="equity" stroke="#FF5C00" strokeWidth={2} dot={false} name="Equity" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-44 rounded-lg border border-dashed" style={{ borderColor: 'hsl(var(--border))' }}>
                <span className="text-xs text-muted-foreground">No trade history yet</span>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border" style={{ borderColor: 'hsl(var(--border))' }}>
          <div className="px-6 py-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
            <div className="text-sm font-semibold text-foreground">Daily P&L</div>
          </div>
          <div className="p-6">
            {dailyPnl.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={dailyPnl} barSize={16}>
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="pnl" radius={[3, 3, 0, 0]} name="P&L">
                    {dailyPnl.map((e, i) => <Cell key={i} fill={e.pnl >= 0 ? '#10b981' : '#ef4444'} fillOpacity={0.85} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-44 rounded-lg border border-dashed" style={{ borderColor: 'hsl(var(--border))' }}>
                <span className="text-xs text-muted-foreground">No closed trades yet</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border" style={{ borderColor: 'hsl(var(--border))' }}>
          <div className="px-6 py-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
            <div className="text-sm font-semibold text-foreground">Trade Performance</div>
          </div>
          <div className="px-6 py-2">
            <StatRow label="Total Closed" value={account.total_trades || closedTrades.length} />
            <StatRow label="Open Positions" value={openTrades.length} valueColor="text-primary" />
            <StatRow label="Win Rate" value={`${winRate.toFixed(1)}%`} valueColor={winRate >= 50 ? 'text-emerald-400' : 'text-yellow-400'} />
            <StatRow label="Max Drawdown Used" value={`${maxDD.toFixed(2)}%`} valueColor={maxDD > (snap.max_dd_limit ?? 10) * 0.7 ? 'text-red-400' : 'text-foreground'} />
            <StatRow label="Profit Factor" value={profitFactor > 0 ? profitFactor.toFixed(2) : '—'} valueColor={profitFactor >= 1.5 ? 'text-emerald-400' : undefined} />
            <StatRow label="Average Win" value={avgWin > 0 ? `+$${avgWin.toFixed(2)}` : '—'} valueColor="text-emerald-400" />
            <StatRow label="Average Loss" value={avgLoss > 0 ? `-$${avgLoss.toFixed(2)}` : '—'} valueColor="text-red-400" />
            <StatRow label="Best Trade" value={bestTrade > 0 ? `+$${bestTrade.toFixed(2)}` : '—'} valueColor="text-emerald-400" />
            <StatRow label="Worst Trade" value={worstTrade < 0 ? `-$${Math.abs(worstTrade).toFixed(2)}` : '—'} valueColor="text-red-400" />
            <StatRow label="Most Traded" value={mostTraded} valueColor="text-primary" />
          </div>
        </div>

        <div className="rounded-xl border" style={{ borderColor: 'hsl(var(--border))' }}>
          <div className="px-6 py-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
            <div className="text-sm font-semibold text-foreground">Account Details</div>
          </div>
          <div className="px-6 py-2">
            <StatRow label="Balance" value={`$${(account.balance || accountSize).toLocaleString()}`} />
            <StatRow label="Equity" value={`$${(account.equity || account.balance || accountSize).toLocaleString()}`} />
            <StatRow label="Account Size" value={`$${accountSize.toLocaleString()}`} />
            <StatRow label="Challenge Type" value={account.challenge_type === 'two-step' ? 'Two-Step' : 'Instant'} />
            <StatRow label="Account Type" value={account.account_type || 'Standard'} />
            <StatRow label="Leverage" value={account.leverage || '1:100'} />
            <StatRow label="Phase" value={account.phase?.replace('phase', 'Phase ') || 'Phase 1'} />
            <StatRow label="Last Synced" value={account.last_synced_at ? new Date(account.last_synced_at).toLocaleTimeString() : '—'} />
          </div>
        </div>
      </div>

      {/* Trade History Table */}
      <div className="rounded-xl border" style={{ borderColor: 'hsl(var(--border))' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
          <div className="text-sm font-semibold text-foreground">Trade History</div>
          <span className="text-xs text-muted-foreground">{closedTrades.length} closed trades</span>
        </div>
        {closedTrades.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="w-8 h-8 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No closed trades recorded yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Trades appear here after the MT5 sync completes</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b" style={{ borderColor: 'hsl(var(--border))' }}>
                  {['Symbol', 'Type', 'Lots', 'Entry', 'Close', 'P&L', 'Open Time', 'Close Time'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...closedTrades].sort((a, b) => new Date(b.close_time) - new Date(a.close_time)).slice(0, 50).map((t, i) => {
                  const pnl = t.pnl || 0;
                  const isWin = pnl > 0;
                  return (
                    <tr key={t.id || i} className="border-b hover:bg-white/[0.02] transition-colors" style={{ borderColor: 'hsl(var(--border))' }}>
                      <td className="px-4 py-3 font-medium text-foreground font-mono">{t.symbol || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${t.type === 'BUY' ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>
                          {t.type === 'BUY' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {t.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-mono">{(t.lots || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-muted-foreground font-mono">{(t.entry || 0).toFixed(5)}</td>
                      <td className="px-4 py-3 text-muted-foreground font-mono">{(t.close || t.entry || 0).toFixed(5)}</td>
                      <td className={`px-4 py-3 font-bold font-mono ${isWin ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isWin ? '+' : ''}${pnl.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{t.open_time ? new Date(t.open_time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{t.close_time ? new Date(t.close_time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}