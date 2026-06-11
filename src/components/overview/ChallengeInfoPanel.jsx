import React from 'react';
import { motion } from 'framer-motion';
import { Info, Download } from 'lucide-react';

export default function ChallengeInfoPanel({ account, rules }) {
  const accountSize = account?.account_size || 0;
  const startDate = account?.created_date ? new Date(account.created_date).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  }) : 'N/A';

  const endDate = account?.created_date ? new Date(new Date(account.created_date).setDate(new Date(account.created_date).getDate() + 30)).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  }) : 'N/A';

  const items = [
    { label: 'Result', value: account?.status === 'passed' ? 'Passed' : account?.status, isBadge: true },
    { label: 'Status', value: account?.status === 'active' ? 'Active' : account?.status },
    { label: account?.challenge_type === 'instant' ? 'Instant' : '2-Step', value: account?.mt_login || 'N/A' },
    { label: 'Start', value: startDate },
    { label: 'End', value: endDate, hasInfo: true },
    { label: 'Account size', value: `$${accountSize.toLocaleString()}` },
    { label: 'Account type', value: account?.account_type === 'swing' ? 'Swing' : 'Standard' },
    { label: 'Platform (MT5)', value: 'Download', isLink: true },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      className="rounded-2xl overflow-hidden h-full"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,92,0,0.1)' }}>
            <Info className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-sm font-bold text-foreground">
            {account?.challenge_type === 'instant' ? 'Instant Challenge' : '2-Step Challenge'}
          </span>
        </div>
      </div>

      {/* Data List */}
      <div className="p-5 space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <span className="text-[11px] text-white/40">{item.label}</span>
            <div className="flex items-center gap-2">
              {item.isBadge ? (
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                  item.value === 'Passed' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                  item.value === 'Active' ? 'bg-primary/20 text-primary border border-primary/30' :
                  'bg-white/5 text-white/40 border border-white/10'
                }`}>
                  {item.value}
                </span>
              ) : item.isLink ? (
                <a href="#" className="text-[11px] font-semibold text-primary hover:text-primary/80 flex items-center gap-1">
                  <Download className="w-3 h-3" /> {item.value}
                </a>
              ) : (
                <span className="text-[11px] font-semibold text-white">{item.value}</span>
              )}
              {item.hasInfo && (
                <Info className="w-3 h-3 text-white/20" />
              )}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}