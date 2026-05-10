import React from 'react';
import { motion } from 'framer-motion';

export default function StatsGrid({ account }) {
  const stats = [
    { label: 'Account Size', value: `$${(account?.account_size || 0).toLocaleString()}` },
    { label: 'Challenge Type', value: account?.challenge_type === 'instant' ? 'Instant Funding' : 'Two-Step' },
    { label: 'Account Type', value: account?.account_type === 'swing' ? 'Swing' : 'Standard' },
    { label: 'Phase', value: (account?.phase || 'phase1').replace('phase', 'Phase ') },
    { label: 'Leverage', value: account?.leverage || '1:100' },
    { label: 'Platform', value: account?.platform || 'xTrading' },
    { label: 'Server', value: account?.server || 'rf-live.robertfunds.com' },
    { label: 'Total Trades', value: account?.total_trades || 0 },
    { label: 'Win Rate', value: `${(account?.win_rate || 0).toFixed(1)}%` },
    { label: 'Trading Days', value: account?.trading_days || 0 },
    { label: 'Status', value: (account?.status || 'active').toUpperCase() },
    { label: 'Account ID', value: account?.account_id || account?.id?.slice(0, 8) || 'N/A' },
  ];

  return (
    <div className="rounded-2xl p-5"
      style={{
        background: 'linear-gradient(135deg, rgba(8,12,24,0.95), rgba(12,18,35,0.95))',
        border: '1px solid rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
      }}>
      <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
        <span className="w-1.5 h-4 rounded-full bg-white/20 inline-block" />
        Account Details
      </h3>
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
        {stats.map((s, i) => (
          <motion.div key={s.label}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.03 }}
            className="px-3 py-2.5"
            style={{ background: 'linear-gradient(135deg, rgba(8,12,24,0.95), rgba(12,18,35,0.95))' }}>
            <div className="text-[8px] font-mono uppercase text-white/20 tracking-widest">{s.label}</div>
            <div className="text-[11px] font-bold text-blue-400 mt-0.5 truncate">{s.value}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}