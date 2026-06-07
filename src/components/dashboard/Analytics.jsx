import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Target, Activity, Award, Plus } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl px-3 py-2 text-xs" style={{ background: 'rgba(14,14,16,0.98)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <p className="font-mono text-muted-foreground mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.dataKey} style={{ color: p.color }} className="font-bold">{p.name}: {typeof p.value === 'number' && Math.abs(p.value) > 100 ? `$${p.value.toLocaleString()}` : p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

function NoAccountGate({ onStartChallenge }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
        <BarChart3 className="w-8 h-8 text-primary/50" />
      </div>
      <div className="text-xl font-black text-foreground mb-2">No Analytics Available</div>
      <div className="text-sm text-muted-foreground mb-6 max-w-md">
        Analytics are only available for active challenge accounts. Purchase a challenge to unlock real-time performance tracking.
      </div>
      <button onClick={onStartChallenge}
        className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold text-white hover:scale-105 transition-all"
        style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)', boxShadow: '0 4px 20px rgba(255,92,0,0.3)' }}>
        <Plus className="w-4 h-4" /> Start New Challenge
      </button>
    </div>
  );
}

export default function Analytics({ onStartChallenge }) {
  const [selectedAccountId, setSelectedAccountId] = useState(null);

  const { data: accounts = [] } = useQuery({
    queryKey: ['challenge-accounts'],
    queryFn: () => base44.entities.ChallengeAccount.list('-created_date', 50),
  });

  const { data: journalEntries = [] } = useQuery({
    queryKey: ['journal-entries'],
    queryFn: () => base44.entities.TradingJournalEntry.list('-entry_date', 30),
  });

  const activeAccounts = accounts.filter(a => a.status === 'active' || a.status === 'funded' || a.status === 'passed');

  // Pull real trade records for the selected account
  const { data: tradeRecords = [] } = useQuery({
    queryKey: ['trade-records-analytics', selectedAccountId || activeAccounts[0]?.id],
    queryFn: () => base44.entities.TradeRecord.filter({
      account_id: (activeAccounts.find(a => a.id === selectedAccountId) || activeAccounts[0])?.id
    }),
    enabled: activeAccounts.length > 0,
  });

  if (activeAccounts.length === 0) return <NoAccountGate onStartChallenge={onStartChallenge} />;

  const account = activeAccounts.find(a => a.id === selectedAccountId) || activeAccounts[0];

  // Build equity curve from real closed trades
  const closedTrades = tradeRecords.filter(t => t.status === 'closed' && t.close_time);
  const openTrades = tradeRecords.filter(t => t.status === 'open');
  const accountSize = account.account_size || 100000;

  // Group closed trades by day for equity curve
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
    equityCurve.push({
      day: new Date(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      equity: parseFloat(runningEquity.toFixed(2)),
    });
  });
  if (equityCurve.length === 1) {
    equityCurve.push({ day: 'Now', equity: account.balance || accountSize });
  }

  // Daily P&L from real trades (last 10 days)
  const dailyPnlMap = {};
  closedTrades.forEach(t => {
    const day = t.close_time?.split(' ')[0] || t.updated_date?.split('T')[0] || '';
    if (!day) return;
    if (!dailyPnlMap[day]) dailyPnlMap[day] = 0;
    dailyPnlMap[day] += t.pnl || 0;
  });
  const dailyPnl = Object.entries(dailyPnlMap).sort().slice(-10).map(([day, pnl]) => ({
    day: new Date(day).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    pnl: parseFloat(pnl.toFixed(2)),
  }));

  // Advanced stats from trades
  const winTrades = closedTrades.filter(t => (t.pnl || 0) > 0);
  const lossTrades = closedTrades.filter(t => (t.pnl || 0) <= 0);
  const realWinRate = closedTrades.length > 0 ? (winTrades.length / closedTrades.length * 100) : 0;
  const avgWin = winTrades.length > 0 ? winTrades.reduce((s, t) => s + t.pnl, 0) / winTrades.length : 0;
  const avgLoss = lossTrades.length > 0 ? Math.abs(lossTrades.reduce((s, t) => s + t.pnl, 0) / lossTrades.length) : 0;
  const profitFactor = avgLoss > 0 ? (avgWin * winTrades.length) / (avgLoss * lossTrades.length) : 0;
  const bestTrade = closedTrades.length > 0 ? Math.max(...closedTrades.map(t => t.pnl || 0)) : 0;
  const worstTrade = closedTrades.length > 0 ? Math.min(...closedTrades.map(t => t.pnl || 0)) : 0;

  // Symbol frequency
  const symbolCount = {};
  tradeRecords.forEach(t => { symbolCount[t.symbol] = (symbolCount[t.symbol] || 0) + 1; });
  const mostTraded = Object.entries(symbolCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

  const totalPnl = account.pnl || 0;
  const winRate = closedTrades.length > 0 ? realWinRate : (account.win_rate || 0);
  const totalTrades = closedTrades.length || account.total_trades || 0;
  const dailyDD = account.daily_drawdown_used || 0;
  const maxDD = account.max_drawdown_used || 0;
  const profitTarget = account.challenge_type === 'instant' ? 0 : (account.phase === 'phase2' ? 5 : 10);
  const progress = account.profit_target_progress || Math.max(0, totalPnl / accountSize * 100);
  const dailyDDLimit = 5;
  const maxDDLimit = 10;

  const metrics = [
    { label: 'Total P&L', value: `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, sub: `${totalPnl >= 0 ? '+' : ''}${account.account_size ? ((totalPnl / account.account_size) * 100).toFixed(2) : '0.00'}%`, color: totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400', icon: TrendingUp },
    { label: 'Win Rate', value: `${winRate.toFixed(1)}%`, sub: `${totalTrades} total trades`, color: winRate >= 50 ? 'text-primary' : 'text-yellow-400', icon: Target },
    { label: 'Daily DD Used', value: `${dailyDD.toFixed(2)}%`, sub: `Limit: ${dailyDDLimit}%`, color: dailyDD > dailyDDLimit * 0.8 ? 'text-red-400' : 'text-emerald-400', icon: Activity },
    { label: 'Max DD Used', value: `${maxDD.toFixed(2)}%`, sub: `Limit: ${maxDDLimit}%`, color: maxDD > maxDDLimit * 0.7 ? 'text-red-400' : 'text-emerald-400', icon: Award },
  ];

  const objectives = [
    { label: 'Profit Target', current: progress, target: profitTarget, color: '#FF5C00', passed: progress >= profitTarget },
    { label: 'Daily Drawdown', current: dailyDD, target: dailyDDLimit, color: '#10b981', passed: dailyDD < dailyDDLimit, reverse: true },
    { label: 'Max Drawdown', current: maxDD, target: maxDDLimit, color: '#10b981', passed: maxDD < maxDDLimit, reverse: true },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-primary" /> Analytics
          </h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">Live performance dashboard</p>
        </div>
        {activeAccounts.length > 1 && (
          <select value={selectedAccountId || activeAccounts[0].id} onChange={e => setSelectedAccountId(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs font-mono text-foreground outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
            {activeAccounts.map(a => <option key={a.id} value={a.id} className="bg-[#0e0e10]">{a.account_id} — ${(a.account_size || 0).toLocaleString()}</option>)}
          </select>
        )}
      </div>

      {/* Account badge */}
      <div className="flex items-center gap-3 mb-6 p-4 rounded-2xl" style={{ background: 'rgba(255,92,0,0.06)', border: '1px solid rgba(255,92,0,0.15)' }}>
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-xs font-mono text-muted-foreground">Account:</span>
        <span className="text-xs font-bold text-foreground">{account.account_id}</span>
        <span className="text-muted-foreground/40">·</span>
        <span className="text-xs font-mono text-primary">${(account.account_size || 0).toLocaleString()}</span>
        <span className="text-muted-foreground/40">·</span>
        <span className="text-xs font-mono text-muted-foreground capitalize">{account.phase?.replace('phase', 'Phase ')}</span>
        <span className="text-muted-foreground/40">·</span>
        <span className="text-xs font-mono capitalize" style={{ color: account.status === 'active' ? '#10b981' : account.status === 'funded' ? '#FF5C00' : '#888' }}>{account.status}</span>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {metrics.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{s.label}</span>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <Icon className={`w-3.5 h-3.5 ${s.color}`} />
                </div>
              </div>
              <div className={`text-2xl font-bold ${s.color} mb-0.5`}>{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.sub}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Trading Objectives (FTMO style) */}
      <div className="rounded-2xl p-6 mb-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="text-sm font-bold text-foreground mb-5">Trading Objectives</div>
        <div className="space-y-5">
          {objectives.map(obj => {
            const pct = Math.min((obj.current / obj.target) * 100, 100);
            const danger = obj.reverse ? pct > 80 : false;
            const barColor = obj.reverse ? (danger ? '#ef4444' : '#10b981') : '#FF5C00';
            return (
              <div key={obj.label}>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${obj.passed ? 'bg-emerald-400' : danger ? 'bg-red-400' : 'bg-yellow-400'}`} />
                    <span className="text-xs font-semibold text-foreground">{obj.label}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className={danger ? 'text-red-400' : 'text-muted-foreground'}>{obj.current.toFixed(2)}%</span>
                    <span className="text-muted-foreground/40">/</span>
                    <span className="text-foreground">{obj.target}%</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${obj.passed ? 'text-emerald-400' : danger ? 'text-red-400' : 'text-yellow-400'}`}
                      style={{ background: obj.passed ? 'rgba(16,185,129,0.1)' : danger ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)' }}>
                      {obj.passed ? '✓ OK' : danger ? '⚠ RISK' : 'Active'}
                    </span>
                  </div>
                </div>
                <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full rounded-full" style={{ background: barColor }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Equity Curve */}
        <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-bold text-foreground">Equity Curve</div>
            <span className={`text-sm font-black ${totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{totalPnl >= 0 ? '+' : ''}${totalPnl.toLocaleString()}</span>
          </div>
          {equityCurve.length > 1 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={equityCurve}>
                <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#666', fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#666', fontFamily: 'monospace' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="equity" stroke="#FF5C00" strokeWidth={2.5} dot={{ fill: '#FF5C00', r: 3 }} name="Equity" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-44 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.06)' }}>
              <span className="text-xs font-mono text-muted-foreground/40">Start trading to build your equity curve</span>
            </div>
          )}
        </div>

        {/* Daily P&L from Journal */}
        <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="text-sm font-bold text-foreground mb-4">Daily P&L (from Journal)</div>
          {dailyPnl.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={dailyPnl}>
                <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#666', fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#666', fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]} name="P&L">
                  {dailyPnl.map((e, i) => <Cell key={i} fill={e.pnl >= 0 ? '#10b981' : '#ef4444'} opacity={0.8} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-44 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.06)' }}>
              <span className="text-xs font-mono text-muted-foreground/40">Add journal entries to see daily P&L</span>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Trade Stats from Real Records */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="text-sm font-bold text-foreground mb-4">Trade Performance (Real Trades)</div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Total Closed', value: closedTrades.length, color: 'text-foreground' },
              { label: 'Open Positions', value: openTrades.length, color: 'text-primary' },
              { label: 'Win Rate', value: `${realWinRate.toFixed(1)}%`, color: realWinRate >= 50 ? 'text-emerald-400' : 'text-yellow-400' },
              { label: 'Profit Factor', value: profitFactor > 0 ? profitFactor.toFixed(2) : '—', color: profitFactor >= 1.5 ? 'text-emerald-400' : 'text-yellow-400' },
              { label: 'Avg Win', value: avgWin > 0 ? `+$${avgWin.toFixed(2)}` : '—', color: 'text-emerald-400' },
              { label: 'Avg Loss', value: avgLoss > 0 ? `-$${avgLoss.toFixed(2)}` : '—', color: 'text-red-400' },
              { label: 'Best Trade', value: bestTrade > 0 ? `+$${bestTrade.toFixed(2)}` : '—', color: 'text-emerald-400' },
              { label: 'Worst Trade', value: worstTrade < 0 ? `-$${Math.abs(worstTrade).toFixed(2)}` : '—', color: 'text-red-400' },
              { label: 'Most Traded', value: mostTraded, color: 'text-primary' },
              { label: 'Win Trades', value: winTrades.length, color: 'text-emerald-400' },
              { label: 'Loss Trades', value: lossTrades.length, color: 'text-red-400' },
              { label: 'Avg R:R', value: avgLoss > 0 ? (avgWin / avgLoss).toFixed(2) : '—', color: 'text-foreground' },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="text-[10px] font-mono text-muted-foreground mb-1">{s.label}</div>
                <div className={`text-sm font-bold ${s.color}`}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="text-sm font-bold text-foreground mb-4">Account Details</div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Balance', value: `$${(account.balance || accountSize).toLocaleString()}` },
              { label: 'Challenge Type', value: account.challenge_type === 'two-step' ? 'Two-Step' : 'Instant' },
              { label: 'Account Type', value: account.account_type || 'Standard' },
              { label: 'Leverage', value: account.leverage || '1:100' },
              { label: 'Platform', value: account.platform || 'XTrading' },
              { label: 'Phase', value: account.phase?.replace('phase', 'Phase ') || 'Phase 1' },
              { label: 'Status', value: account.status || 'active' },
              { label: 'Account ID', value: account.account_id || '—' },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="text-[10px] font-mono text-muted-foreground mb-1">{s.label}</div>
                <div className="text-sm font-bold text-foreground capitalize">{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}