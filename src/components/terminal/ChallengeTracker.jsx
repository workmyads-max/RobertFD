import React from 'react';
import { motion } from 'framer-motion';
import { Target, Shield, TrendingUp, Calendar, Zap } from 'lucide-react';

export default function ChallengeTracker({ account, rules, balance, equity }) {
  const accountSize = account?.account_size || 100000;
  const pnl         = equity - accountSize;
  const profitPct   = (pnl / accountSize) * 100;
  const dailyDD     = Math.max(0, ((balance - equity) / accountSize) * 100);
  const maxDD       = Math.max(0, ((accountSize - equity) / accountSize) * 100);

  const items = [
    {
      label: 'Profit Target',
      current: Math.max(0, profitPct),
      target:  rules?.profitTarget || 10,
      color:   '#FF5C00',
      icon:    Target,
      unit:    '%',
    },
    {
      label: 'Daily DD Used',
      current: dailyDD,
      target:  rules?.dailyDDLimit || 5,
      color:   dailyDD > (rules?.dailyDDLimit * 0.8) ? '#ef4444' : '#10b981',
      icon:    Shield,
      unit:    '%',
    },
    {
      label: 'Max DD Used',
      current: maxDD,
      target:  rules?.maxDDLimit || 10,
      color:   maxDD > (rules?.maxDDLimit * 0.8) ? '#ef4444' : '#10b981',
      icon:    TrendingUp,
      unit:    '%',
    },
  ];

  const phase      = account?.phase || 'phase1';
  const tradingDays = account?.trading_days || 0;
  const minDays    = rules?.minTradingDays || 4;
  const status     = account?.status || 'active';

  const statusMeta = {
    active:  { label: 'ACTIVE',  color: 'text-emerald-400', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)' },
    passed:  { label: 'PASSED',  color: 'text-primary',     bg: 'rgba(255,92,0,0.12)',   border: 'rgba(255,92,0,0.3)'   },
    failed:  { label: 'FAILED',  color: 'text-red-400',     bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)'  },
    funded:  { label: 'FUNDED',  color: 'text-yellow-400',  bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
    pending: { label: 'PENDING', color: 'text-blue-400',    bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.3)' },
  };
  const sm = statusMeta[status] || statusMeta.active;

  return (
    <div className="p-3 space-y-3 text-xs">
      {/* Status + Phase */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[9px] text-muted-foreground uppercase tracking-widest mb-0.5">
            {account?.challenge_type === 'instant' ? 'Instant' : 'Two-Step'} Challenge
          </div>
          <div className="font-black text-foreground capitalize">
            {phase.replace('phase', 'Phase ')} — ${accountSize.toLocaleString()}
          </div>
        </div>
        <div className="px-2 py-1 rounded text-[9px] font-black" style={{ background: sm.bg, border: `1px solid ${sm.border}`, color: sm.color }}>
          {sm.label}
        </div>
      </div>

      {/* Progress Bars */}
      <div className="space-y-3">
        {items.map((item, idx) => {
          const Icon = item.icon;
          const pct = Math.min((item.current / item.target) * 100, 100);
          const exceeded = item.current >= item.target;
          return (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1">
                  <Icon className="w-3 h-3" style={{ color: item.color }} />
                  <span className="text-[9px] text-muted-foreground">{item.label}</span>
                </div>
                <span className="text-[10px] font-mono font-bold" style={{ color: exceeded && idx > 0 ? '#ef4444' : item.color }}>
                  {item.current.toFixed(2)}% / {item.target}%
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${item.color}, ${item.color}cc)`, boxShadow: `0 0 8px ${item.color}60` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Trading Days */}
      <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2">
          <Calendar className="w-3 h-3 text-blue-400" />
          <span className="text-[9px] text-muted-foreground">Trading Days</span>
        </div>
        <span className="font-mono font-bold text-[10px] text-blue-400">{tradingDays} / {minDays} min</span>
      </div>

      {/* Rules */}
      <div className="space-y-1">
        <div className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">Account Rules</div>
        {[
          { label: 'News Trading',       allowed: rules?.newsTrading },
          { label: 'Overnight Holding',  allowed: rules?.overnightHolding },
          { label: 'Weekend Holding',    allowed: rules?.weekendHolding },
          { label: 'EA Allowed',         allowed: true },
        ].map(r => (
          <div key={r.label} className="flex items-center justify-between text-[9px] font-mono">
            <span className="text-muted-foreground">{r.label}</span>
            <span className={r.allowed ? 'text-emerald-400 font-bold' : 'text-red-400/60'}>
              {r.allowed ? '✓ ON' : '✗ OFF'}
            </span>
          </div>
        ))}
      </div>

      {/* Leverage display */}
      <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'rgba(255,92,0,0.06)', border: '1px solid rgba(255,92,0,0.18)' }}>
        <div className="flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-primary" />
          <span className="text-[9px] text-muted-foreground">Leverage</span>
        </div>
        <span className="font-mono font-bold text-primary text-[11px]">1:{rules?.leverage || 100}</span>
      </div>
    </div>
  );
}