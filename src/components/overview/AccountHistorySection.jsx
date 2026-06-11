import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays } from 'lucide-react';
import { Card, CardHeader } from './OverviewCards';

const HISTORY_TABS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'passed', label: 'Passed' },
  { id: 'failed', label: 'Failed' },
];

export default function AccountHistorySection({ accounts, onSelectAccount }) {
  const [tab, setTab] = useState('all');
  const filtered = tab === 'all' ? accounts : accounts.filter(a => a.status === tab);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,92,0,0.12)' }}>
            <CalendarDays className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-sm font-bold text-foreground">Account History</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
            style={{ background: 'rgba(255,255,255,0.07)', color: '#94a3b8' }}>{accounts.length}</span>
        </div>
      </CardHeader>
      <div className="flex gap-0 border-b overflow-x-auto" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        {HISTORY_TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-5 py-3 text-xs font-semibold whitespace-nowrap transition-all relative ${tab === t.id ? 'text-primary' : 'text-white/35 hover:text-white/60'}`}>
            {t.label}
            {tab === t.id && <motion.div layoutId="tab-line" className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-primary" />}
          </button>
        ))}
      </div>
      <div>
        {filtered.length === 0 ? (
          <div className="py-10 text-center text-sm text-white/30">No accounts found</div>
        ) : (
          <div className="divide-y" style={{ divideColor: 'rgba(255,255,255,0.04)' }}>
            {filtered.map((acc) => {
              const sc = acc.status === 'active' ? { label: 'Active', color: '#10b981', badge: 'AC' }
                : acc.status === 'passed' ? { label: 'Passed', color: '#60a5fa', badge: 'PA' }
                : acc.status === 'funded' ? { label: 'Funded', color: '#FF5C00', badge: 'FU' }
                : { label: 'Not Passed', color: '#ef4444', badge: 'NO' };
              const cLabel = acc.challenge_type === 'two-step' ? '2-Step' : acc.challenge_type === 'instant' ? 'Instant' : 'Inst. Light';
              
              return (
                <button
                  key={acc.id}
                  onClick={() => onSelectAccount?.(acc)}
                  className="w-full flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${sc.color}12`, border: `1px solid ${sc.color}25` }}>
                      <span className="text-[8px] font-black" style={{ color: sc.color }}>{sc.badge}</span>
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-bold text-foreground font-mono">{cLabel} · {acc.mt_login || acc.account_id?.slice(0, 12)}</div>
                      <div className="text-[10px] text-white/35">${(acc.account_size || 0).toLocaleString()} · {(acc.phase || 'phase1').replace('phase', 'Phase ')}</div>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide"
                    style={{ background: `${sc.color}15`, color: sc.color, border: `1px solid ${sc.color}30` }}>
                    {sc.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}