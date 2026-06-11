import React from 'react';
import { motion } from 'framer-motion';
import { Copy, BarChart3, ChevronRight, Info, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function AccountInfoCard({ account, rules, livePositions, onCopyCredentials, onNavigate }) {
  const accountSize = account?.account_size || 0;
  const balance = account?.balance || accountSize;
  const equity = account?.equity || balance;
  const liveUnrealizedPnl = (livePositions || []).reduce((s, p) => s + (p.pnl || 0), 0);
  const liveEquity = livePositions?.length > 0 ? balance + liveUnrealizedPnl : equity;
  const dailyPnl = account?.daily_pnl || 0;

  const profitTarget = account?.phase === 'phase2'
    ? (rules?.phase2Target || 5)
    : (rules?.phase1Target || 10);
  const targetAmount = accountSize * (profitTarget / 100);
  const currentProfit = balance - accountSize;
  const progressPercent = Math.min(100, (currentProfit / targetAmount) * 100);

  const startDate = account?.created_date ? new Date(account.created_date).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  }) : 'N/A';

  const endDate = account?.created_date ? new Date(new Date(account.created_date).setDate(new Date(account.created_date).getDate() + 30)).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  }) : 'N/A';

  const handleCopyCredentials = () => {
    if (account?.mt_login && account?.mt_password) {
      const creds = `Login: ${account.mt_login}\nPassword: ${account.mt_password}\nServer: ${account.mt_server || 'MT5-Server'}`;
      navigator.clipboard.writeText(creds);
      toast.success('Credentials copied to clipboard');
      onCopyCredentials?.();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {account?.status === 'passed' && (
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Passed
                </span>
              )}
              {account?.phase === 'phase1' && (
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-primary/20 text-primary border border-primary/30">
                  Phase 1
                </span>
              )}
              {account?.phase === 'phase2' && (
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-primary/20 text-primary border border-primary/30">
                  Phase 2
                </span>
              )}
              {account?.status === 'funded' && (
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Funded
                </span>
              )}
            </div>
            <div>
              <div className="text-lg font-bold text-white mb-0.5">
                {account?.challenge_type === 'instant' ? 'Instant Challenge' :
                 account?.challenge_type === 'instant_light' ? 'Instant Light Challenge' :
                 '2-Step Challenge'}
              </div>
              <div className="text-[11px] text-white/40">
                MT5 Login: {account?.mt_login || 'N/A'} · {account?.leverage || '1:100'} leverage
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-white/40 mb-1">Account Size</div>
            <div className="text-xl font-black text-white">${accountSize.toLocaleString()}</div>
            <div className="text-[10px] text-white/40 mt-1">Exp: {endDate}</div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-5 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.max(0, Math.min(100, progressPercent))}%`,
                background: 'linear-gradient(90deg, #FF5C00, #FF7A2F)'
              }}
            />
          </div>
          <span className="text-xs font-mono font-bold text-primary min-w-[48px] text-right">
            {progressPercent.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Action Row */}
      <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyCredentials}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-white/5 hover:bg-white/10 transition-colors text-white/70 hover:text-white"
          >
            <Copy className="w-3 h-3" /> Copy Credentials
          </button>
          <button
            onClick={() => onNavigate?.('account-overview')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-white/5 hover:bg-white/10 transition-colors text-white/70 hover:text-white"
          >
            <BarChart3 className="w-3 h-3" /> Account Metrics
          </button>
        </div>
        <button
          onClick={() => onNavigate?.('account-overview')}
          className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          Full Detail <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Stats Row */}
      <div className="px-5 py-4 grid grid-cols-3 gap-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div>
          <div className="text-[9px] text-white/40 mb-1">Today's P&L</div>
          <div className={`text-lg font-black font-mono ${dailyPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {dailyPnl >= 0 ? '+' : ''}${Math.abs(dailyPnl).toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-[9px] text-white/40 mb-1">Live Equity</div>
          <div className="text-lg font-black font-mono text-blue-400">
            ${liveEquity.toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-[9px] text-white/40 mb-1">Unrealized P&L</div>
          <div className={`text-lg font-black font-mono ${liveUnrealizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {liveUnrealizedPnl >= 0 ? '+' : ''}${Math.abs(liveUnrealizedPnl).toFixed(2)}
          </div>
        </div>
      </div>
    </motion.div>
  );
}