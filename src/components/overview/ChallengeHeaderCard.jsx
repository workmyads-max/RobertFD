import React from 'react';
import { motion } from 'framer-motion';
import { Copy, CalendarDays, ChevronRight } from 'lucide-react';

function fmt(n, d = 2) { return (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }); }

export default function ChallengeHeaderCard({ account, liveEquity, liveUnrealizedPnl, setShowCredentials, onNavigate }) {
  if (!account) return null;

  const balance = account.balance ?? account.account_size ?? 0;
  const equity = liveEquity ?? (account.equity ?? balance);
  const unrealizedPnl = liveUnrealizedPnl ?? (equity - balance);
  const todayPnl = account.daily_pnl ?? 0;
  
  const challengeLabel = account.challenge_type === 'two-step' ? '2-Step Challenge'
    : account.challenge_type === 'instant' ? 'Instant Funding' : 'Instant Light';
  const statusLabel = account.status === 'active' ? 'Active' : account.status === 'funded' ? 'Funded'
    : account.status === 'passed' ? 'Passed' : account.status;
  const statusColor = account.status === 'active' ? '#10b981' : account.status === 'funded' ? '#FF5C00'
    : account.status === 'passed' ? '#60a5fa' : '#ef4444';
  const phase = (account.phase || 'phase1').replace('phase', 'Phase ');
  
  const progressPct = Math.min((account.profit_target_progress || 0) / (account.rule_snapshot?.phase1_target || 10) * 100, 100);
  const endDate = account.provisioned_at
    ? new Date(new Date(account.provisioned_at).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,92,0,0.25)',
      }}>
      {/* Header Section */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase"
                style={{ background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}35` }}>
                {statusLabel}
              </span>
              <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide"
                style={{ background: 'rgba(255,92,0,0.15)', color: '#FF5C00', border: '1px solid rgba(255,92,0,0.25)' }}>
                {phase}
              </span>
            </div>
            <h3 className="text-xl font-black text-white mb-1">{challengeLabel}</h3>
            <div className="text-xs font-mono text-white/40">
              MT5 Login: <span className="text-white/70">{account.mt_login || '—'}</span> · {account.leverage || '1:100'} leverage
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-[10px] text-white/40 uppercase tracking-wide mb-1">Account Size</div>
            <div className="text-3xl font-black text-white">${(account.account_size || 0).toLocaleString()}</div>
            <div className="text-[10px] text-white/40 font-mono mt-1">Exp: {endDate}</div>
          </div>
        </div>

        {/* Profit Target Progress */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-white/50">Profit Target Progress</span>
            <span className="text-xs font-bold text-primary">{progressPct.toFixed(1)}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden bg-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #FF5C00, #FF8A3D)' }}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <button
          onClick={() => setShowCredentials?.(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all hover:opacity-90"
          style={{ background: 'rgba(255,92,0,0.15)', border: '1px solid rgba(255,92,0,0.3)', color: '#FF5C00' }}
        >
          <Copy className="w-3.5 h-3.5" />
          Copy Credentials
        </button>
        <button
          onClick={() => onNavigate?.('accounts')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all hover:opacity-90"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}
        >
          <CalendarDays className="w-3.5 h-3.5" />
          Account MetriX
        </button>
        <button
          onClick={() => onNavigate?.('accounts')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold ml-auto transition-all hover:opacity-90"
          style={{ background: 'rgba(255,92,0,0.15)', border: '1px solid rgba(255,92,0,0.3)', color: '#FF5C00' }}
        >
          Full Detail
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* MT5 Live Metrics */}
      <div className="grid grid-cols-3">
        <div className="px-5 py-4 text-center border-r" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <div className="text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-1">Today's PnL</div>
          <div className={`text-2xl font-black font-mono ${todayPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {todayPnl >= 0 ? '+' : ''}${fmt(todayPnl)}
          </div>
        </div>
        <div className="px-5 py-4 text-center border-r" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <div className="text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-1">Live Equity</div>
          <div className="text-2xl font-black font-mono text-blue-400">${fmt(equity)}</div>
        </div>
        <div className="px-5 py-4 text-center">
          <div className="text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-1">Unrealized PnL</div>
          <div className={`text-2xl font-black font-mono ${unrealizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {unrealizedPnl >= 0 ? '+' : ''}${fmt(unrealizedPnl)}
          </div>
        </div>
      </div>
    </div>
  );
}