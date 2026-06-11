import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, TrendingUp, TrendingDown, Activity, Shield, Calendar, DollarSign, Wallet, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

function fmt(n, d = 2) { 
  return (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }); 
}

export default function MT5AccountCard({ account, livePositions, tradeRecords, onRefresh }) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const balance = account?.balance || account?.account_size || 0;
  const unrealizedPnl = livePositions?.reduce((s, p) => s + (p.pnl || 0), 0) || 0;
  const equity = balance + unrealizedPnl;
  
  const todayTrades = (tradeRecords || []).filter(t => {
    if (t.status !== 'closed' || !t.close_time) return false;
    const closeDate = new Date(t.close_time);
    const now = new Date();
    return closeDate.toDateString() === now.toDateString();
  });
  const todayPnl = todayTrades.reduce((s, t) => s + (t.pnl || 0), 0);

  const startDate = account?.provisioned_at 
    ? new Date(account.provisioned_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'N/A';

  const phase = (account?.phase || 'phase1').replace('phase', 'Phase ');
  const status = account?.status === 'active' ? 'Active' 
    : account?.status === 'funded' ? 'Funded'
    : account?.status === 'passed' ? 'Passed'
    : account?.status || 'Unknown';
  
  const statusColor = account?.status === 'active' ? '#10b981'
    : account?.status === 'funded' ? '#FF5C00'
    : account?.status === 'passed' ? '#60a5fa'
    : '#94a3b8';

  const challengeType = account?.challenge_type === 'two-step' ? '2-STEP'
    : account?.challenge_type === 'instant' ? 'INSTANT'
    : 'INST.LIGHT';

  const progressPct = Math.min((account?.profit_target_progress || 0) / (account?.rule_snapshot?.phase1_target || 10) * 100, 100);

  const snap = account?.rule_snapshot || {};
  const accountSize = account?.account_size || 100000;
  const dailyDDLimit = snap?.daily_dd_limit ?? 5;
  const maxDDLimit = snap?.max_dd_limit ?? 10;
  const dailyStartBalance = account?.daily_start_balance || accountSize;
  
  const dailyLossUsed = Math.max(0, dailyStartBalance - equity);
  const todayPermittedLoss = Math.max(0, (dailyStartBalance * dailyDDLimit / 100) - dailyLossUsed);
  const maxPermittedLoss = Math.max(0, (accountSize * maxDDLimit / 100) - Math.max(0, accountSize - equity));

  const totalProfit = account?.status === 'funded' ? (equity - accountSize) : 0;
  const totalWithdrawals = 0;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh?.();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(13,15,19,0.98) 0%, rgba(18,22,30,0.95) 100%)',
          border: '1px solid rgba(255,69,0,0.3)',
          boxShadow: '0 0 40px rgba(255,69,0,0.08)',
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-0.5" 
          style={{ background: 'linear-gradient(90deg, transparent, #FF5C00, transparent)' }} />

        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md text-[10px] font-black text-white"
                style={{ background: '#FF5C00' }}>
                {challengeType}
              </span>
              <span className="px-2.5 py-1 rounded-md text-[10px] font-bold text-white/70"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                {phase}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: statusColor, boxShadow: `0 0 12px ${statusColor}60` }} />
              <span className="text-[10px] font-bold" style={{ color: statusColor }}>{status}</span>
            </div>
          </div>

          <div className="text-xs font-mono text-white/40 mb-1">
            {account?.mt_login ? `MT5-${account.mt_login}` : `#${account?.account_id || account?.id?.slice(0, 8)}`}
          </div>

          <div className="text-3xl font-black text-white mb-3 tracking-tight">
            ${fmt(accountSize, 0)}
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between text-[10px] font-semibold mb-1.5">
              <span className="text-white/40">Profit Target</span>
              <span style={{ color: '#FF5C00' }}>{progressPct.toFixed(1)}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <motion.div 
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                style={{ background: 'linear-gradient(90deg, #FF5C00, #FF8A3D)' }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <DollarSign className="w-3 h-3 text-blue-400" />
                <span className="text-[9px] font-semibold text-white/40">Balance</span>
              </div>
              <div className="text-lg font-black text-white">${fmt(balance, 0)}</div>
            </div>
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Activity className="w-3 h-3 text-cyan-400" />
                <span className="text-[9px] font-semibold text-white/40">Equity</span>
              </div>
              <div className="text-lg font-black text-white" style={{ color: equity >= balance ? '#10b981' : '#ef4444' }}>
                ${fmt(equity, 0)}
              </div>
            </div>
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Wallet className="w-3 h-3 text-purple-400" />
                <span className="text-[9px] font-semibold text-white/40">Unrealized P&L</span>
              </div>
              <div className="text-lg font-black" style={{ color: unrealizedPnl >= 0 ? '#10b981' : '#ef4444' }}>
                {unrealizedPnl >= 0 ? '+' : ''}${fmt(unrealizedPnl, 0)}
              </div>
            </div>
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                {todayPnl >= 0 ? <TrendingUp className="w-3 h-3 text-emerald-400" /> : <TrendingDown className="w-3 h-3 text-red-400" />}
                <span className="text-[9px] font-semibold text-white/40">Today's P&L</span>
              </div>
              <div className="text-lg font-black" style={{ color: todayPnl >= 0 ? '#10b981' : '#ef4444' }}>
                {todayPnl >= 0 ? '+' : ''}${fmt(todayPnl, 0)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,69,0,0.05)', border: '1px solid rgba(255,69,0,0.15)' }}>
              <div className="flex items-center gap-1.5 mb-1">
                <Shield className="w-3 h-3 text-orange-400" />
                <span className="text-[9px] font-semibold text-white/50">Today Permitted Loss</span>
              </div>
              <div className="text-base font-black text-orange-400">${fmt(todayPermittedLoss, 0)}</div>
              <div className="text-[9px] text-white/30 mt-0.5">{dailyDDLimit}% daily DD</div>
            </div>
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,69,0,0.05)', border: '1px solid rgba(255,69,0,0.15)' }}>
              <div className="flex items-center gap-1.5 mb-1">
                <Shield className="w-3 h-3 text-orange-400" />
                <span className="text-[9px] font-semibold text-white/50">Max Permitted Loss</span>
              </div>
              <div className="text-base font-black text-orange-400">${fmt(maxPermittedLoss, 0)}</div>
              <div className="text-[9px] text-white/30 mt-0.5">{maxDDLimit}% max DD</div>
            </div>
          </div>

          {account?.status === 'funded' && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-xl p-3" style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)' }}>
                <div className="text-[9px] font-semibold text-white/50 mb-1">Total Profit</div>
                <div className="text-base font-black text-emerald-400">${fmt(totalProfit, 0)}</div>
              </div>
              <div className="rounded-xl p-3" style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)' }}>
                <div className="text-[9px] font-semibold text-white/50 mb-1">Total Withdrawals</div>
                <div className="text-base font-black text-blue-400">${fmt(totalWithdrawals, 0)}</div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-[10px] text-white/30 mb-4">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3" />
              <span>Started: {startDate}</span>
            </div>
            <div>{account?.leverage || '1:100'} leverage</div>
          </div>

          <div className="flex gap-2">
            <Link to="/dashboard/account-overview"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold text-white transition-all"
              style={{ background: '#FF5C00', boxShadow: '0 4px 15px rgba(255,92,0,0.3)' }}>
              Account Status <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={handleRefresh}
              className="px-4 py-3 rounded-xl text-xs font-semibold transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex overflow-x-auto rounded-xl border"
        style={{
          background: 'rgba(13,15,19,0.95)',
          borderColor: 'rgba(255,255,255,0.08)',
          scrollbarWidth: 'none',
        }}
      >
        {[
          { label: 'SIZE', value: `$${fmt(accountSize, 0)}` },
          { label: 'TYPE', value: account?.challenge_type === 'two-step' ? 'Two-Step' : account?.challenge_type === 'instant' ? 'Instant' : 'Inst.Light' },
          { label: 'MODEL', value: account?.account_type === 'swing' ? 'Swing' : 'Standard' },
          { label: 'PHASE', value: phase },
          { label: 'LEVERAGE', value: account?.leverage || '1:100' },
          { label: 'PLATFORM', value: (account?.platform || 'MT5').toUpperCase() },
          { label: 'ID', value: account?.mt_login || account?.account_id || 'N/A' },
        ].map((item, i) => (
          <div key={item.label} 
            className="flex-1 px-3 py-3 min-w-[80px] flex-shrink-0 border-r last:border-r-0"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="text-[7px] font-mono uppercase text-white/30 tracking-widest mb-1">{item.label}</div>
            <div className="text-[10px] font-bold text-white/70 font-mono truncate">{item.value}</div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}