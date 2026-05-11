import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, DollarSign, BarChart3, Target, Shield, Calendar,
  CheckCircle2, XCircle, AlertTriangle, Clock, Award, Activity,
  ChevronRight, Plus, Monitor, Zap
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const MIN_TRADING_DAYS = 5;

function MetricCard({ label, value, sub, color, icon: Icon, warn, i }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.05 }}
      className="rounded-2xl p-4"
      style={{
        background: warn ? 'rgba(239,68,68,0.07)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${warn ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.07)'}`,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{label}</span>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: warn ? 'rgba(239,68,68,0.12)' : 'rgba(255,92,0,0.1)' }}>
          <Icon className={`w-3.5 h-3.5 ${warn ? 'text-red-400' : 'text-primary'}`} />
        </div>
      </div>
      <div className={`text-xl font-black mb-0.5 ${color}`}>{value}</div>
      {sub && <div className="text-[11px] font-mono text-muted-foreground">{sub}</div>}
    </motion.div>
  );
}

function ProgressRow({ label, current, target, color, reverse, i }) {
  const pct = Math.min((current / (target || 1)) * 100, 100);
  const isDanger = reverse ? pct > 80 : false;
  const isPassed = reverse ? current < target : current >= target;
  const barColor = isDanger ? '#ef4444' : color;

  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isPassed ? 'bg-emerald-400' : isDanger ? 'bg-red-400' : 'bg-yellow-400'}`} />
          <span className="text-xs font-semibold text-foreground">{label}</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className={isDanger ? 'text-red-400' : 'text-muted-foreground'}>{typeof current === 'number' ? current.toFixed(2) : current}{typeof current === 'number' && label.includes('%') === false && !label.includes('Days') ? '' : ''}</span>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-foreground">{target}{typeof target === 'number' && label.includes('Days') ? ' days' : typeof target === 'number' && !label.includes('Days') ? '%' : ''}</span>
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${isPassed ? 'bg-emerald-400/10 text-emerald-400' : isDanger ? 'bg-red-400/10 text-red-400' : 'bg-yellow-400/10 text-yellow-400'}`}>
            {isPassed ? '✓ OK' : isDanger ? '⚠ RISK' : 'Active'}
          </span>
        </div>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="h-full rounded-full"
          style={{ background: barColor }}
        />
      </div>
    </motion.div>
  );
}

function RuleChip({ label, value, ok }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${ok ? 'bg-emerald-400/10 text-emerald-400' : 'bg-red-400/10 text-red-400'}`}>
        {ok ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
        {value}
      </span>
    </div>
  );
}

function AccountSelector({ accounts, selected, onSelect }) {
  return (
    <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
      {accounts.map(a => (
        <button key={a.id} onClick={() => onSelect(a)}
          className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-mono transition-all ${selected?.id === a.id ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          style={{
            background: selected?.id === a.id ? 'rgba(255,92,0,0.1)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${selected?.id === a.id ? 'rgba(255,92,0,0.4)' : 'rgba(255,255,255,0.08)'}`,
          }}>
          <div className="font-bold">{a.account_id}</div>
          <div className="text-[10px] opacity-60">${(a.account_size || 0).toLocaleString()}</div>
        </button>
      ))}
    </div>
  );
}

export default function AccountOverview({ onStartChallenge, onNavigate }) {
  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['challenge-accounts'],
    queryFn: () => base44.entities.ChallengeAccount.list('-created_date', 50),
    refetchInterval: 15000,
  });

  const { data: journalEntries = [] } = useQuery({
    queryKey: ['journal-entries'],
    queryFn: () => base44.entities.TradingJournalEntry.list('-entry_date', 30),
  });

  const activeAccounts = accounts.filter(a => a.status === 'active' || a.status === 'funded' || a.status === 'passed');
  const [selectedAccount, setSelectedAccount] = useState(null);

  const account = selectedAccount || activeAccounts[0] || null;

  const { data: tradeRecords = [] } = useQuery({
    queryKey: ['trade-records-overview', account?.id],
    queryFn: () => base44.entities.TradeRecord.filter({ account_id: account.id }),
    enabled: !!account?.id,
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-24"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
          <BarChart3 className="w-8 h-8 text-primary/50" />
        </div>
        <div className="text-xl font-black text-foreground mb-2">No Active Accounts</div>
        <div className="text-sm text-muted-foreground mb-6 max-w-md">Purchase a challenge to unlock the full institutional overview.</div>
        <button onClick={onStartChallenge}
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold text-white hover:scale-105 transition-all"
          style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)', boxShadow: '0 4px 20px rgba(255,92,0,0.3)' }}>
          <Plus className="w-4 h-4" /> Start New Challenge
        </button>
      </div>
    );
  }

  // ── Derived metrics ──────────────────────────────────────────────────────────
  const accountSize = account.account_size || 100000;
  const balance = account.balance || accountSize;
  const equity = account.equity || balance;
  const pnl = account.pnl || 0;
  // Compute today's real P&L from closed trades
  const todayStr = new Date().toISOString().split('T')[0];
  const todayClosedTrades = tradeRecords.filter(t => {
    if (t.status !== 'closed') return false;
    const d = t.close_time || t.updated_date || '';
    return d.startsWith(todayStr) || d.includes(new Date().toLocaleDateString());
  });
  const dailyPnl = todayClosedTrades.length > 0
    ? todayClosedTrades.reduce((s, t) => s + (t.pnl || 0), 0)
    : (account.daily_pnl || 0);
  const floatPnl = equity - balance;
  const winRate = account.win_rate || 0;
  const totalTrades = account.total_trades || 0;
  const dailyDDUsed = account.daily_drawdown_used || 0;
  const maxDDUsed = account.max_drawdown_used || 0;
  const profitTargetProgress = account.profit_target_progress || 0;
  const tradingDays = account.trading_days || 0;

  const isInstant = account.challenge_type === 'instant';
  const isSwing = account.account_type === 'swing';
  const phase = account.phase || 'phase1';

  const dailyDDLimit = isInstant ? 3 : 5;
  const maxDDLimit = isInstant ? 8 : 10;
  const profitTarget = isInstant ? 8 : (phase === 'phase2' ? 5 : 10);

  const dailyDDRemaining = Math.max(0, dailyDDLimit - dailyDDUsed);
  const maxDDRemaining = Math.max(0, maxDDLimit - maxDDUsed);

  // Consistency: how many days with positive PnL / total trading days
  const posJournalDays = journalEntries.filter(e => (e.pnl || 0) > 0).length;
  const consistencyScore = journalEntries.length > 0
    ? Math.round((posJournalDays / journalEntries.length) * 100)
    : 0;

  // Status color
  const statusColors = { active: '#10b981', funded: '#FF5C00', passed: '#60a5fa', failed: '#ef4444', pending: '#f59e0b' };
  const statusColor = statusColors[account.status] || '#888';

  const metrics = [
    { label: 'Account Balance', value: `$${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sub: `Account size: $${accountSize.toLocaleString()}`, color: 'text-foreground', icon: DollarSign },
    { label: 'Equity', value: `$${equity.toFixed(2)}`, sub: equity >= balance ? 'Positive float' : 'Floating loss', color: equity >= balance ? 'text-emerald-400' : 'text-red-400', icon: TrendingUp },
    { label: 'Floating P&L', value: `${floatPnl >= 0 ? '+' : ''}$${floatPnl.toFixed(2)}`, sub: 'Open positions', color: floatPnl >= 0 ? 'text-emerald-400' : 'text-red-400', icon: Activity },
    { label: 'Daily Profit', value: `${dailyPnl >= 0 ? '+' : ''}$${dailyPnl.toFixed(2)}`, sub: 'Today\'s session', color: dailyPnl >= 0 ? 'text-emerald-400' : 'text-red-400', icon: Zap },
    { label: 'Daily DD Remaining', value: `${dailyDDRemaining.toFixed(2)}%`, sub: `Used: ${dailyDDUsed.toFixed(2)}% / ${dailyDDLimit}%`, color: dailyDDRemaining < 1 ? 'text-red-400' : dailyDDRemaining < 2 ? 'text-yellow-400' : 'text-emerald-400', icon: Shield, warn: dailyDDRemaining < 1 },
    { label: 'Max DD Remaining', value: `${maxDDRemaining.toFixed(2)}%`, sub: `Used: ${maxDDUsed.toFixed(2)}% / ${maxDDLimit}%`, color: maxDDRemaining < 2 ? 'text-red-400' : maxDDRemaining < 4 ? 'text-yellow-400' : 'text-emerald-400', icon: BarChart3, warn: maxDDRemaining < 2 },
    { label: 'Trading Days', value: `${tradingDays} / ${MIN_TRADING_DAYS}`, sub: tradingDays >= MIN_TRADING_DAYS ? '✓ Minimum met' : `${MIN_TRADING_DAYS - tradingDays} more needed`, color: tradingDays >= MIN_TRADING_DAYS ? 'text-emerald-400' : 'text-yellow-400', icon: Calendar },
    { label: 'Win Rate', value: `${winRate.toFixed(1)}%`, sub: `${totalTrades} total trades`, color: winRate >= 55 ? 'text-emerald-400' : winRate >= 40 ? 'text-yellow-400' : 'text-red-400', icon: Award },
  ];

  const objectives = [
    { label: 'Profit Target', current: profitTargetProgress, target: profitTarget, color: '#FF5C00', reverse: false },
    { label: 'Daily Drawdown', current: dailyDDUsed, target: dailyDDLimit, color: '#10b981', reverse: true },
    { label: 'Max Drawdown', current: maxDDUsed, target: maxDDLimit, color: '#10b981', reverse: true },
    { label: 'Min Trading Days', current: tradingDays, target: MIN_TRADING_DAYS, color: '#60a5fa', reverse: false },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-primary" /> Account Overview
          </h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">Institutional challenge dashboard — live metrics</p>
        </div>
        <button onClick={onStartChallenge}
          className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
          style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)', boxShadow: '0 4px 16px rgba(255,92,0,0.3)' }}>
          <Plus className="w-4 h-4" /> New Challenge
        </button>
      </div>

      {/* Account selector */}
      {activeAccounts.length > 1 && (
        <AccountSelector accounts={activeAccounts} selected={account} onSelect={setSelectedAccount} />
      )}

      {/* Account badge */}
      <div className="flex flex-wrap items-center gap-3 mb-6 p-4 rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: statusColor }} />
        <span className="text-xs font-mono font-bold text-foreground">{account.account_id}</span>
        <span className="text-muted-foreground/30">·</span>
        <span className="text-xs font-mono text-primary">${accountSize.toLocaleString()}</span>
        <span className="text-muted-foreground/30">·</span>
        <span className="text-xs font-mono text-muted-foreground capitalize">{account.challenge_type === 'two-step' ? 'Two-Step' : 'Instant'}</span>
        <span className="text-muted-foreground/30">·</span>
        <span className="text-xs font-mono text-muted-foreground capitalize">{phase.replace('phase', 'Phase ')}</span>
        <span className="text-muted-foreground/30">·</span>
        <span className="text-xs font-mono text-muted-foreground">{account.leverage || '1:100'}</span>
        <span className="ml-auto px-3 py-1 rounded-full text-xs font-bold capitalize"
          style={{ background: `${statusColor}15`, color: statusColor, border: `1px solid ${statusColor}30` }}>
          {account.status}
        </span>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {metrics.map((m, i) => <MetricCard key={m.label} {...m} i={i} />)}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Trading Objectives */}
        <div className="lg:col-span-2 rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="text-sm font-bold text-foreground mb-5 flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" /> Trading Objectives
          </div>
          <div className="space-y-5">
            {objectives.map((obj, i) => <ProgressRow key={obj.label} {...obj} i={i} />)}
          </div>
        </div>

        {/* Rules & Consistency */}
        <div className="space-y-4">
          {/* Account Rules */}
          <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" /> Account Rules
            </div>
            <RuleChip label="News Trading" value={isSwing ? 'Allowed' : 'Restricted'} ok={isSwing} />
            <RuleChip label="Overnight Holding" value={isSwing ? 'Allowed' : 'Restricted'} ok={isSwing} />
            <RuleChip label="Weekend Holding" value={isSwing ? 'Allowed' : 'Restricted'} ok={isSwing} />
            <RuleChip label="Expert Advisors" value="Allowed" ok={true} />
            <RuleChip label="Copy Trading" value="Allowed" ok={true} />
            <RuleChip label="Min Trading Days" value={`${MIN_TRADING_DAYS} days`} ok={true} />
          </div>

          {/* Consistency Metrics */}
          <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" /> Consistency
            </div>
            <div className="space-y-2">
              {[
                { label: 'Positive Days', value: `${posJournalDays} / ${journalEntries.length || 0}` },
                { label: 'Consistency Score', value: `${consistencyScore}%` },
                { label: 'Avg Win Rate', value: `${winRate.toFixed(1)}%` },
                { label: 'Total Trades', value: totalTrades },
                { label: 'Total P&L', value: `${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}` },
              ].map(s => (
                <div key={s.label} className="flex justify-between text-xs font-mono">
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="text-foreground font-semibold">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="text-sm font-bold text-foreground mb-4">Quick Actions</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Open Terminal', icon: Monitor, page: 'terminal', color: 'text-primary', bg: 'rgba(255,92,0,0.08)', border: 'rgba(255,92,0,0.2)' },
            { label: 'X-Copier', icon: Activity, page: 'xcopier', color: 'text-accent', bg: 'rgba(204,255,0,0.08)', border: 'rgba(204,255,0,0.2)' },
            { label: 'Analytics', icon: BarChart3, page: 'analytics', color: 'text-blue-400', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)' },
            { label: 'Journal', icon: Award, page: 'journal', color: 'text-emerald-400', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
          ].map(a => {
            const Icon = a.icon;
            return (
              <button key={a.label} onClick={() => onNavigate && onNavigate(a.page)}
                className="flex items-center gap-3 p-3 rounded-xl transition-all hover:scale-[1.02]"
                style={{ background: a.bg, border: `1px solid ${a.border}` }}>
                <Icon className={`w-4 h-4 ${a.color}`} />
                <span className="text-sm font-medium text-foreground">{a.label}</span>
                <ChevronRight className="w-3 h-3 text-muted-foreground ml-auto" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}