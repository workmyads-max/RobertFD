import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Shield, BarChart3, ChevronRight, TrendingUp, Activity, Zap } from 'lucide-react';

/**
 * Account Overview Card Props
 * @typedef {Object} AccountOverviewCardProps
 * @property {'active' | 'inactive' | 'passed' | 'failed'} [status] - Account status
 * @property {string} [phase] - Current phase (e.g., 'Phase 1')
 * @property {string} [challengeType] - Challenge type name
 * @property {string} [mt5Login] - MT5 login ID
 * @property {string} [leverage] - Leverage ratio
 * @property {number} [accountSize] - Account size in USD
 * @property {string} [expirationDate] - Expiration date string
 * @property {number} [profitTargetProgress] - Progress percentage (0-100)
 * @property {number} [todaysPnl] - Today's P&L
 * @property {number} [liveEquity] - Current equity
 * @property {number} [unrealizedPnl] - Unrealized P&L
 * @property {() => void} [onViewCredentials] - View credentials handler
 * @property {() => void} [onAccountMetrics] - Account metrics handler
 * @property {() => void} [onFullDetail] - Full detail handler
 */

export default function AccountOverviewCard({
  status = 'active',
  phase = 'Phase 1',
  challengeType = 'Two-Step Challenge',
  mt5Login = '12345678',
  leverage = '1:100',
  accountSize = 10000,
  expirationDate = '2024-12-31',
  profitTargetProgress = 45.5,
  todaysPnl = 250.75,
  liveEquity = 10250.75,
  unrealizedPnl = 125.50,
  onViewCredentials,
  onAccountMetrics,
  onFullDetail,
  className,
  ...props
}) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const getPnlColor = (value) => {
    if (value > 0) return 'text-[#00c853]';
    if (value < 0) return 'text-[#ff4444]';
    return 'text-[#808080]';
  };

  const getStatusColor = () => {
    switch (status) {
      case 'active': return 'text-[#00c853] border-[#00c853]';
      case 'passed': return 'text-[#00c853] border-[#00c853]';
      case 'failed': return 'text-[#ff4444] border-[#ff4444]';
      default: return 'text-[#808080] border-[#808080]';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn(
        'w-full rounded-xl border bg-[#15171e] text-white shadow-sm',
        className
      )}
      style={{ borderColor: '#2a2e39' }}
      {...props}
    >
      <div className="p-6">
        {/* Header Section */}
        <div className="mb-5">
          {/* Badges */}
          <div className="flex items-center gap-2 mb-3">
            <span className={cn(
              'px-2.5 py-1 rounded-full text-xs font-semibold border',
              getStatusColor()
            )}>
              {status === 'active' ? 'Active' : status}
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold border border-[#ff6b2c] text-[#ff6b2c]">
              {phase}
            </span>
          </div>

          {/* Title and Account Meta */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white mb-1">{challengeType}</h3>
            <p className="text-xs text-[#808080]">
              MT5 Login: {mt5Login} • {leverage} leverage
            </p>
          </div>

          {/* Account Size and Expiration */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] text-[#808080] uppercase tracking-wider mb-0.5">Account Size</p>
              <p className="text-xl font-bold text-white">{formatCurrency(accountSize)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-[#808080] uppercase tracking-wider mb-0.5">Expires</p>
              <p className="text-sm text-[#808080]">Exp: {expirationDate}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-[#808080] uppercase tracking-wider">Profit Target Progress</span>
              <span className="text-xs font-semibold text-[#ff6b2c]">{profitTargetProgress.toFixed(1)}%</span>
            </div>
            <div className="relative w-full h-1.5 bg-[#2a2e39] rounded-full overflow-hidden">
              <motion.div
                className="absolute left-0 top-0 h-full bg-[#ff6b2c] rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: `${profitTargetProgress}%` }}
                transition={{ duration: 0.8, ease: 'easeInOut' }}
              />
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <button
            onClick={onViewCredentials}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-[#ff6b2c] text-[#ff6b2c] text-xs font-semibold hover:bg-[#ff6b2c]/10 transition-colors"
          >
            <Shield className="w-3.5 h-3.5" />
            View Credentials
          </button>
          <button
            onClick={onAccountMetrics}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-[#2a2e39] text-white text-xs font-semibold hover:bg-[#2a2e39] transition-colors"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Account Metrics
          </button>
          <button
            onClick={onFullDetail}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-[#ff6b2c] text-[#ff6b2c] text-xs font-semibold hover:bg-[#ff6b2c]/10 transition-colors"
          >
            Full Detail
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#2a2e39]">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <TrendingUp className="w-3 h-3 text-[#808080]" />
              <span className="text-[9px] text-[#808080] uppercase tracking-wider">Today's P&L</span>
            </div>
            <p className={cn('text-sm font-bold', getPnlColor(todaysPnl))}>
              {todaysPnl >= 0 ? '+' : ''}{formatCurrency(todaysPnl)}
            </p>
          </div>
          <div className="text-center border-l border-[#2a2e39]">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Activity className="w-3 h-3 text-[#808080]" />
              <span className="text-[9px] text-[#808080] uppercase tracking-wider">Live Equity</span>
            </div>
            <p className="text-sm font-bold text-[#2979ff]">{formatCurrency(liveEquity)}</p>
          </div>
          <div className="text-center border-l border-[#2a2e39]">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Zap className="w-3 h-3 text-[#808080]" />
              <span className="text-[9px] text-[#808080] uppercase tracking-wider">Unrealized PnL</span>
            </div>
            <p className={cn('text-sm font-bold', getPnlColor(unrealizedPnl))}>
              {unrealizedPnl >= 0 ? '+' : ''}{formatCurrency(unrealizedPnl)}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}