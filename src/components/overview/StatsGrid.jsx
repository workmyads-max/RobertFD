import React from 'react';
import { motion } from 'framer-motion';

function StatRow({ label, value, accent, i }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.04 }}
      className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0"
    >
      <span className="text-[11px] text-white/35 font-mono uppercase tracking-wider">{label}</span>
      <span className="text-[12px] font-semibold font-mono" style={{ color: accent || 'rgba(255,255,255,0.75)' }}>{value}</span>
    </motion.div>
  );
}

export default function StatsGrid({ account, stats }) {
  if (!stats) return null;

  const { avgProfit, avgLoss, profitFactor, expectancy, rrr, lots, wins, losses, totalTrades, openPositions } = stats;

  const performanceRows = [
    { label: 'Profit Factor', value: isFinite(profitFactor) ? profitFactor.toFixed(2) : '∞', accent: profitFactor >= 1.5 ? '#10b981' : profitFactor >= 1 ? '#f59e0b' : '#ef4444' },
    { label: 'Expectancy', value: `$${expectancy.toFixed(2)}`, accent: expectancy >= 0 ? '#10b981' : '#ef4444' },
    { label: 'Avg RR Ratio', value: `1:${rrr.toFixed(2)}`, accent: rrr >= 1.5 ? '#10b981' : '#3b82f6' },
    { label: 'Avg Win', value: `$${avgProfit.toFixed(2)}`, accent: '#10b981' },
    { label: 'Avg Loss', value: `$${avgLoss.toFixed(2)}`, accent: '#ef4444' },
    { label: 'Total Lots', value: lots.toFixed(2), accent: 'rgba(255,255,255,0.6)' },
    { label: 'Winning Trades', value: wins, accent: '#10b981' },
    { label: 'Losing Trades', value: losses, accent: '#ef4444' },
    { label: 'Total Trades', value: totalTrades, accent: 'rgba(255,255,255,0.6)' },
    { label: 'Open Positions', value: openPositions, accent: '#3b82f6' },
  ];

  const accountRows = [
    { label: 'Account Size', value: `$${(account?.account_size || 0).toLocaleString()}` },
    { label: 'Challenge Type', value: account?.challenge_type === 'instant' ? 'Instant Funding' : 'Two-Step' },
    { label: 'Account Model', value: account?.account_type === 'swing' ? 'Swing' : 'Standard' },
    { label: 'Phase', value: (account?.phase || 'phase1').replace('phase', 'Phase ') },
    { label: 'Leverage', value: account?.leverage || '1:100' },
    { label: 'Platform', value: account?.platform || 'xTrading' },
    { label: 'Server', value: account?.server || 'rf-live.com' },
    { label: 'Account ID', value: account?.account_id || account?.id?.slice(0, 8) || 'N/A', accent: '#3b82f6' },
    { label: 'Status', value: (account?.status || 'active').toUpperCase(), accent: account?.status === 'active' ? '#10b981' : '#f59e0b' },
    { label: 'Login', value: account?.login_credentials || '—' },
  ];

  return (
    <div className="grid md:grid-cols-2 gap-3">
      {/* Performance stats */}
      <div className="rounded-2xl px-5 py-4"
        style={{
          background: 'linear-gradient(145deg, rgba(8,14,28,0.98), rgba(10,18,38,0.95))',
          border: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(24px)',
        }}>
        <h3 className="text-sm font-semibold text-white mb-3 tracking-tight">Performance Metrics</h3>
        {performanceRows.map((r, i) => <StatRow key={r.label} {...r} i={i} />)}
      </div>

      {/* Account details */}
      <div className="rounded-2xl px-5 py-4"
        style={{
          background: 'linear-gradient(145deg, rgba(8,14,28,0.98), rgba(10,18,38,0.95))',
          border: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(24px)',
        }}>
        <h3 className="text-sm font-semibold text-white mb-3 tracking-tight">Account Details</h3>
        {accountRows.map((r, i) => <StatRow key={r.label} {...r} i={i} />)}
      </div>
    </div>
  );
}