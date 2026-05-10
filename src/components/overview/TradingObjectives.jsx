import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Clock, XCircle } from 'lucide-react';

function ObjectiveRow({ label, current, target, limit, color, unit = '%', inverse = false, i }) {
  // inverse = true means lower is better (drawdown rules)
  const pct = inverse
    ? Math.min((current / limit) * 100, 100)
    : Math.min((current / target) * 100, 100);

  const passed = inverse ? false : pct >= 100;
  const breached = inverse && current >= limit;
  const warning = inverse ? current > limit * 0.7 : false;

  const barColor = breached ? '#ef4444' : warning ? '#f59e0b' : passed ? '#10b981' : color;
  const StatusIcon = breached ? XCircle : passed ? CheckCircle2 : warning ? AlertTriangle : Clock;
  const statusColor = breached ? '#ef4444' : passed ? '#10b981' : warning ? '#f59e0b' : 'rgba(255,255,255,0.2)';

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="group"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <StatusIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: statusColor }} />
          <span className="text-[12px] font-medium text-white/70">{label}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-mono font-semibold" style={{ color: barColor }}>
            {current.toFixed(2)}{unit}
          </span>
          <span className="text-[10px] font-mono text-white/20">
            / {inverse ? limit : target}{unit}
          </span>
        </div>
      </div>
      <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: i * 0.06 + 0.2 }}
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: `linear-gradient(90deg, ${barColor}70, ${barColor})`,
            boxShadow: `0 0 10px ${barColor}50`,
          }}
        />
      </div>
    </motion.div>
  );
}

export default function TradingObjectives({ account, rules, stats }) {
  if (!stats) return null;

  const { profitTargetPct, dailyDDPct, maxDDPct, tradingDays } = stats;
  const phase = account?.phase || 'phase1';

  const objectives = [
    {
      label: 'Profit Target',
      current: profitTargetPct,
      target: rules?.profitTarget || 10,
      limit: rules?.profitTarget || 10,
      color: '#3b82f6',
      inverse: false,
    },
    {
      label: 'Max Daily Loss',
      current: dailyDDPct,
      target: rules?.dailyDDLimit || 5,
      limit: rules?.dailyDDLimit || 5,
      color: '#06b6d4',
      inverse: true,
    },
    {
      label: 'Max Overall Loss',
      current: maxDDPct,
      target: rules?.maxDDLimit || 10,
      limit: rules?.maxDDLimit || 10,
      color: '#8b5cf6',
      inverse: true,
    },
    {
      label: 'Minimum Trading Days',
      current: tradingDays,
      target: rules?.minTradingDays || 4,
      limit: rules?.minTradingDays || 4,
      color: '#10b981',
      unit: 'd',
      inverse: false,
    },
  ];

  return (
    <div className="rounded-2xl p-6"
      style={{
        background: 'linear-gradient(145deg, rgba(8,14,28,0.98), rgba(10,18,38,0.95))',
        border: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(24px)',
      }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-white tracking-tight">Trading Objectives</h3>
          <p className="text-[11px] text-white/30 font-mono mt-0.5 capitalize">
            {phase.replace('phase', 'Phase ')} · {account?.challenge_type === 'instant' ? 'Instant Funding' : 'Two-Step Challenge'}
          </p>
        </div>
        <div className="px-3 py-1.5 rounded-lg text-[10px] font-mono font-semibold capitalize"
          style={{
            background: account?.status === 'active' ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)',
            color: account?.status === 'active' ? '#10b981' : '#3b82f6',
            border: `1px solid ${account?.status === 'active' ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.2)'}`,
          }}>
          {account?.status || 'active'}
        </div>
      </div>
      <div className="space-y-5">
        {objectives.map((obj, i) => <ObjectiveRow key={obj.label} {...obj} i={i} />)}
      </div>
    </div>
  );
}