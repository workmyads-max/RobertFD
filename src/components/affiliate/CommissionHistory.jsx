import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Zap, Briefcase, Trophy } from 'lucide-react';

const ORANGE = '#FF5C00';
const CARD = '#15171e';
const BORDER = 'rgba(255,255,255,0.07)';

const STATUS_STYLES = {
  pending: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', label: 'Pending' },
  approved: { color: '#818cf8', bg: 'rgba(129,140,248,0.08)', label: 'Approved' },
  paid: { color: '#10b981', bg: 'rgba(16,185,129,0.08)', label: 'Paid' },
  rejected: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', label: 'Rejected' },
};

const LEVEL_COLORS = { 1: ORANGE, 2: '#818cf8', 3: '#c084fc' };

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'paid', label: 'Paid' },
  { id: 'rejected', label: 'Rejected' },
];

const TYPE_FILTERS = [
  { id: 'all', label: 'All Types' },
  { id: 'challenge_purchase', label: 'Purchases', icon: Briefcase },
  { id: 'payout_reward', label: 'Payouts', icon: Trophy },
];

export default function CommissionHistory({ commissions = [] }) {
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const filtered = commissions.filter(c => {
    const sOk = filter === 'all' || c.status === filter;
    const tOk = typeFilter === 'all' || c.commission_type === typeFilter;
    return sOk && tOk;
  });

  return (
    <div>
      {/* Filter Pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          {FILTERS.map(s => (
            <button key={s.id} onClick={() => setFilter(s.id)}
              className="px-3 py-1.5 rounded-lg text-[10px] font-bold capitalize transition-all"
              style={{
                background: filter === s.id ? `${ORANGE}15` : 'transparent',
                color: filter === s.id ? ORANGE : 'rgba(255,255,255,0.4)',
                border: filter === s.id ? `1px solid ${ORANGE}30` : '1px solid transparent',
              }}>{s.label}</button>
          ))}
        </div>
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          {TYPE_FILTERS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTypeFilter(t.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                style={{
                  background: typeFilter === t.id ? `${ORANGE}15` : 'transparent',
                  color: typeFilter === t.id ? ORANGE : 'rgba(255,255,255,0.4)',
                  border: typeFilter === t.id ? `1px solid ${ORANGE}30` : '1px solid transparent',
                }}>
                {Icon && <Icon className="w-3 h-3" />}
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Commission Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.04]" style={{ background: 'rgba(255,255,255,0.015)' }}>
          <span className="text-[11px] font-bold text-white uppercase tracking-[0.08em]">Commission Records</span>
          <span className="text-[10px] font-mono text-white/15">{filtered.length} records</span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <Briefcase className="w-6 h-6 text-white/10" />
            </div>
            <div className="text-sm font-bold text-white/25 mb-1">No commissions found</div>
            <div className="text-[10px] text-white/10">Share your referral link to start earning</div>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.025]">
            {filtered.map((c, i) => {
              const st = STATUS_STYLES[c.status] || STATUS_STYLES.pending;
              const lvlColor = LEVEL_COLORS[c.level] || ORANGE;
              const isPayout = c.commission_type === 'payout_reward';
              return (
                <motion.div key={c.id || i}
                  initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.005] transition-colors">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${lvlColor}0d`, border: `1px solid ${lvlColor}1a` }}>
                    {isPayout ? <Award className="w-4 h-4" style={{ color: '#a3e635' }} /> : <Zap className="w-4 h-4" style={{ color: lvlColor }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold text-white truncate">{c.referred_email || 'Referral'}</div>
                    <div className="text-[9px] font-mono text-white/20">
                      {isPayout ? '🏆 Payout Reward' : '💼 Challenge Purchase'} · L{c.level || 1} · {(c.commission_rate || 0)}% rate
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <div className="text-[8px] font-mono text-white/15 uppercase tracking-wider">Source</div>
                    <div className="text-[11px] font-bold text-white/50">${(c.source_amount || 0).toFixed(0)}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-black text-emerald-400">+${(c.commission_amount || 0).toFixed(2)}</div>
                    <div className="text-[9px] font-mono mt-0.5 px-2 py-0.5 rounded-full inline-block font-bold" style={{ background: st.bg, color: st.color, border: `1px solid ${st.color}20` }}>
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