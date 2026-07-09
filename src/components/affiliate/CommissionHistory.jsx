import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Zap, TrendingUp, Filter } from 'lucide-react';

const STATUS_STYLES = {
  pending: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Pending' },
  approved: { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', label: 'Approved' },
  paid: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'Paid' },
  rejected: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: 'Rejected' },
};

const LEVEL_COLORS = { 1: '#FF5C00', 2: '#60a5fa', 3: '#a78bfa' };

export default function CommissionHistory({ commissions = [] }) {
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const filtered = commissions.filter(c => {
    const statusOk = filter === 'all' || c.status === filter;
    const typeOk = typeFilter === 'all' || c.commission_type === typeFilter;
    return statusOk && typeOk;
  });

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex gap-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          {['all', 'pending', 'approved', 'paid', 'rejected'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className="px-3 py-2 text-[11px] font-semibold capitalize transition-all relative"
              style={{
                color: filter === s ? '#fff' : 'rgba(255,255,255,0.35)',
                borderBottom: filter === s ? '2px solid #FF5C00' : '2px solid transparent',
              }}>{s}</button>
          ))}
        </div>
        <div className="flex gap-1">
          {['all', 'challenge_purchase', 'payout_reward'].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className="px-3 py-2 text-[11px] font-semibold transition-all"
              style={{
                color: typeFilter === t ? '#fff' : 'rgba(255,255,255,0.35)',
                background: typeFilter === t ? 'rgba(255,255,255,0.07)' : 'transparent',
                border: typeFilter === t ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.06)',
                borderRadius: '6px',
              }}>
              {t === 'all' ? 'All Types' : t === 'challenge_purchase' ? 'Purchases' : 'Payouts'}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/5"
          style={{ background: 'rgba(255,255,255,0.03)' }}>
          <span className="text-xs font-bold text-foreground">Commission Records</span>
          <span className="text-[10px] font-mono text-muted-foreground">{filtered.length} records</span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-4xl mb-3">💼</div>
            <div className="text-sm text-muted-foreground">No commissions found</div>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {filtered.map((c, i) => {
              const st = STATUS_STYLES[c.status] || STATUS_STYLES.pending;
              const lvlColor = LEVEL_COLORS[c.level] || '#FF5C00';
              return (
                <motion.div key={c.id || i}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${lvlColor}15`, border: `1px solid ${lvlColor}25` }}>
                    {c.commission_type === 'payout_reward'
                      ? <Award className="w-4 h-4" style={{ color: '#CCFF00' }} />
                      : <Zap className="w-4 h-4" style={{ color: lvlColor }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-foreground truncate">{c.referred_email || 'Referral'}</div>
                    <div className="text-[10px] font-mono text-muted-foreground">
                      {c.commission_type === 'payout_reward' ? '🏆 Payout Reward' : '💼 Challenge Purchase'} · L{c.level || 1} · {(c.commission_rate || 0)}% rate
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 hidden md:block">
                    <div className="text-[10px] font-mono text-muted-foreground">Source</div>
                    <div className="text-xs font-bold text-foreground">${(c.source_amount || 0).toFixed(0)}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-black text-emerald-400">+${(c.commission_amount || 0).toFixed(2)}</div>
                    <div className="text-[10px] font-mono mt-0.5 px-2 py-0.5 rounded-full inline-block" style={{ background: st.bg, color: st.color }}>
                      {st.label}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}