import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertOctagon, ShieldAlert, Info, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const SEVERITY_CONFIG = {
  critical: { icon: ShieldAlert,    color: '#a855f7', bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.25)', label: 'CRITICAL' },
  high:     { icon: AlertOctagon,   color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)',   label: 'HIGH'     },
  medium:   { icon: AlertOctagon,   color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', label: 'MEDIUM'   },
  low:      { icon: Info,           color: '#60a5fa', bg: 'rgba(96,165,250,0.06)', border: 'rgba(96,165,250,0.2)',  label: 'LOW'      },
};

const VIOLATION_DESCRIPTIONS = {
  hft_detection:          'High-frequency trading or arbitrage patterns detected.',
  ultra_fast_scalping:    'Ultra-fast scalping activity (trades < 10 seconds) detected.',
  martingale_grid:        'Martingale or grid trading pattern detected.',
  consistency_manipulation: 'Consistency rule violation: single trade exceeds 50% of total profits.',
  suspicious_lot_sizing:  'Unusual lot sizing patterns detected.',
  hedge_abuse:            'Prohibited hedging activity detected on Standard account.',
  copy_trading_signal:    'Possible copy trading or signal service usage detected.',
  toxic_flow:             'Abnormal stop-hunt ratio flagged.',
  unusual_dd_behavior:    'Drawdown usage approaching limit — review your risk management.',
  overnight_violation:    'Overnight position holding violation on Standard account.',
  synthetic_arbitrage:    'Synthetic arbitrage via correlated instruments detected.',
  news_trading_violation: 'News trading detected during high-impact event blackout.',
  weekend_holding_violation: 'Weekend position holding on Standard account detected.',
};

export default function UserWarningPanel({ userEmail }) {
  const { data: accounts = [] } = useQuery({
    queryKey: ['user-accounts-warnings', userEmail],
    queryFn: () => base44.entities.ChallengeAccount.filter({ user_email: userEmail }),
    enabled: !!userEmail,
  });

  const accountIds = accounts.map(a => a.account_id);

  const { data: allFlags = [] } = useQuery({
    queryKey: ['user-risk-flags', userEmail],
    queryFn: async () => {
      const allFlagsData = [];
      for (const accId of accountIds) {
        const flags = await base44.entities.RiskFlag.filter({ account_id: accId, status: 'active' });
        allFlagsData.push(...flags);
      }
      return allFlagsData;
    },
    enabled: accountIds.length > 0,
    refetchInterval: 30000,
  });

  if (allFlags.length === 0) return null;

  const criticalCount = allFlags.filter(f => f.severity === 'critical').length;
  const highCount = allFlags.filter(f => f.severity === 'high').length;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden mb-4"
        style={{ border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.04)' }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(239,68,68,0.06)' }}>
          <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div className="flex-1">
            <div className="text-sm font-bold text-white">⚠️ Risk Warning — Account Under Review</div>
            <div className="text-xs text-white/40 mt-0.5">
              {allFlags.length} active violation{allFlags.length !== 1 ? 's' : ''} detected
              {criticalCount > 0 && ` · ${criticalCount} critical`}
              {highCount > 0 && ` · ${highCount} high severity`}
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold font-mono text-red-400"
            style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
            {criticalCount + highCount > 0 ? 'ACTION REQUIRED' : 'REVIEW ACTIVE'}
          </div>
        </div>

        {/* Flag list */}
        <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          {allFlags.slice(0, 5).map((flag, i) => {
            const cfg = SEVERITY_CONFIG[flag.severity] || SEVERITY_CONFIG.low;
            const Icon = cfg.icon;
            return (
              <motion.div key={flag.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-start gap-4 px-5 py-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                  <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-white capitalize">
                      {flag.flag_type?.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full"
                      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-xs text-white/50 leading-relaxed">
                    {VIOLATION_DESCRIPTIONS[flag.flag_type] || flag.description}
                  </p>
                  {flag.account_id && (
                    <div className="text-[10px] font-mono text-white/25 mt-1">Account: {flag.account_id}</div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Footer note */}
        <div className="px-5 py-4 text-xs text-white/30 leading-relaxed"
          style={{ background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          🔒 Our risk management team has been notified. Continued violations may result in account suspension.
          Please review our trading rules to ensure compliance.
        </div>
      </motion.div>
    </AnimatePresence>
  );
}