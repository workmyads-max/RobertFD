import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Plus, TrendingUp, TrendingDown, Monitor, BarChart3, DollarSign, Eye, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const STATUS_CONFIG = {
  active: { label: 'Active', color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: CheckCircle },
  pending: { label: 'Pending', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: Clock },
  passed: { label: 'Passed', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', icon: CheckCircle },
  failed: { label: 'Failed', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', icon: XCircle },
  funded: { label: 'Funded', color: '#FF5C00', bg: 'rgba(255,92,0,0.12)', icon: TrendingUp },
};

// Demo accounts shown when no real ones exist
const DEMO_ACCOUNTS = [
  { id: 'demo1', account_id: 'RF-100423', challenge_type: 'two-step', account_type: 'standard', account_size: 100000, platform: 'xtrading', leverage: '1:100', status: 'active', phase: 'phase1', balance: 104280, equity: 104280, pnl: 4280, daily_pnl: 420, daily_drawdown_used: 1.2, max_drawdown_used: 2.1, profit_target_progress: 42.8, win_rate: 74.6, total_trades: 48 },
  { id: 'demo2', account_id: 'RF-082341', challenge_type: 'instant', account_type: 'swing', account_size: 50000, platform: 'xtrading', leverage: '1:30', status: 'funded', phase: 'funded', balance: 52400, equity: 52400, pnl: 2400, daily_pnl: 180, daily_drawdown_used: 0.8, max_drawdown_used: 1.4, profit_target_progress: 100, win_rate: 68.2, total_trades: 31 },
];

function AccountCard({ account, onStartChallenge, onOpenTerminal, onOpenAnalytics }) {
  const [expanded, setExpanded] = useState(false);
  const statusCfg = STATUS_CONFIG[account.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusCfg.icon;
  const isPnlPos = (account.pnl || 0) >= 0;
  const profitTarget = account.challenge_type === 'two-step' ? (account.phase === 'phase1' ? 10 : 5) : 8;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${statusCfg.color}25` }}
    >
      {/* Status bar */}
      <div className="h-1 w-full" style={{ background: statusCfg.color, opacity: 0.7 }} />

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-lg font-black text-foreground font-mono">{account.account_id}</span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5"
                style={{ background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.color}40` }}>
                <StatusIcon className="w-3 h-3" />
                {statusCfg.label}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
              <span className="capitalize">{account.challenge_type === 'two-step' ? 'Two-Step' : 'Instant'}</span>
              <span>•</span>
              <span className="capitalize">{account.account_type}</span>
              <span>•</span>
              <span>{account.leverage}</span>
              <span>•</span>
              <span className="capitalize">{account.phase?.replace('phase', 'Phase ')}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-foreground">${(account.balance || account.account_size)?.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground font-mono">Balance</div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-5">
          {[
            { label: 'P&L', value: `${isPnlPos ? '+' : ''}$${(account.pnl || 0).toLocaleString()}`, color: isPnlPos ? 'text-emerald-400' : 'text-red-400' },
            { label: 'Win Rate', value: `${account.win_rate || 0}%`, color: 'text-foreground' },
            { label: 'Daily DD', value: `${account.daily_drawdown_used || 0}%`, color: 'text-foreground' },
            { label: 'Max DD', value: `${account.max_drawdown_used || 0}%`, color: (account.max_drawdown_used || 0) > 7 ? 'text-red-400' : 'text-foreground' },
            { label: 'Trades', value: account.total_trades || 0, color: 'text-foreground' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-3 text-center"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-[10px] font-mono text-muted-foreground mb-1">{s.label}</div>
              <div className={`text-sm font-bold ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="mb-5">
          <div className="flex justify-between text-xs font-mono mb-1.5">
            <span className="text-muted-foreground">Profit Target Progress</span>
            <span className="text-primary">{account.profit_target_progress?.toFixed(1) || 0}% / {profitTarget}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(((account.profit_target_progress || 0) / profitTarget) * 100, 100)}%` }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="h-full rounded-full bg-primary"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => onOpenTerminal && onOpenTerminal(account)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:scale-105"
            style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)', boxShadow: '0 4px 12px rgba(255,92,0,0.25)' }}>
            <Monitor className="w-3.5 h-3.5" /> Open Terminal
          </button>
          <button onClick={() => onOpenAnalytics && onOpenAnalytics(account)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:bg-white/5"
            style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(var(--foreground))' }}>
            <BarChart3 className="w-3.5 h-3.5" /> Analytics
          </button>
          {account.status === 'funded' && (
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:bg-emerald-500/10"
              style={{ border: '1px solid rgba(16,185,129,0.3)', color: '#10b981' }}>
              <DollarSign className="w-3.5 h-3.5" /> Withdraw
            </button>
          )}
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:bg-white/5 ml-auto"
            style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'hsl(var(--muted-foreground))' }}>
            <Eye className="w-3.5 h-3.5" /> Credentials
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function MyAccounts({ onStartChallenge, onOpenTerminal, onOpenAnalytics }) {
  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['challenge-accounts'],
    queryFn: () => base44.entities.ChallengeAccount.list('-created_date', 50),
  });

  const displayAccounts = accounts.length > 0 ? accounts : DEMO_ACCOUNTS;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
            <Wallet className="w-6 h-6 text-primary" /> My Accounts
          </h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">Manage your challenge and funded accounts</p>
        </div>
        <button onClick={onStartChallenge}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
          style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)', boxShadow: '0 4px 20px rgba(255,92,0,0.3)' }}>
          <Plus className="w-4 h-4" /> New Challenge
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Active', count: displayAccounts.filter(a => a.status === 'active').length, color: '#10b981' },
          { label: 'Funded', count: displayAccounts.filter(a => a.status === 'funded').length, color: '#FF5C00' },
          { label: 'Passed', count: displayAccounts.filter(a => a.status === 'passed').length, color: '#60a5fa' },
          { label: 'Failed', count: displayAccounts.filter(a => a.status === 'failed').length, color: '#ef4444' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-4 text-center"
            style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${s.color}20` }}>
            <div className="text-2xl font-black" style={{ color: s.color }}>{s.count}</div>
            <div className="text-xs font-mono text-muted-foreground">{s.label} Accounts</div>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-4">
          {displayAccounts.map((acc) => (
            <AccountCard key={acc.id || acc.account_id} account={acc} onStartChallenge={onStartChallenge} onOpenTerminal={onOpenTerminal} onOpenAnalytics={onOpenAnalytics} />
          ))}
        </div>
      )}
    </div>
  );
}