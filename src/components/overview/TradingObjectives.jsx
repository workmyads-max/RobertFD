import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Clock, XCircle } from 'lucide-react';

function ObjectiveRow({ label, current, target, limit, color, unit = '%', inverse = false, i, usdValue, limitUsd, minDays, tradingDays }) {
  // Special case: Minimum Trading Days — show day-by-day dots
  if (unit === 'd') {
    const completed = Math.min(current, minDays);
    const passed = current >= minDays;
    return (
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
        className="group"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {passed
              ? <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-emerald-400" />
              : <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.2)' }} />
            }
            <span className="text-[12px] font-medium text-white/70">{label}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-mono font-semibold" style={{ color: passed ? '#10b981' : color }}>
              {current}d
            </span>
            <span className="text-[10px] font-mono text-white/20">/ {minDays}d min</span>
            {passed && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
                ✓ MET
              </span>
            )}
          </div>
        </div>
        {/* Day dots */}
        <div className="flex gap-1.5 mt-1">
          {Array.from({ length: minDays }).map((_, idx) => {
            const done = idx < current;
            return (
              <motion.div
                key={idx}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.06 + idx * 0.07 }}
                className="flex-1 h-5 rounded-md flex items-center justify-center text-[9px] font-black"
                style={{
                  background: done ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${done ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.07)'}`,
                  color: done ? '#10b981' : 'rgba(255,255,255,0.15)',
                  boxShadow: done ? '0 0 8px rgba(16,185,129,0.2)' : 'none',
                }}
              >
                {done ? '✓' : `D${idx + 1}`}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    );
  }

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
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <StatusIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: statusColor }} />
          <span className="text-[12px] font-medium text-white/70">{label}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* USD value */}
          {usdValue != null && (
            <span className="text-[11px] font-mono font-semibold text-white/40">
              ${Math.abs(usdValue).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              {limitUsd != null && <span className="text-white/20"> / ${Math.abs(limitUsd).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>}
            </span>
          )}
          <span className="text-[12px] font-mono font-semibold" style={{ color: barColor }}>
            {current.toFixed(2)}{unit}
          </span>
          <span className="text-[10px] font-mono text-white/20">
            / {inverse ? limit : target}{unit}
          </span>
          {passed && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-black" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
              ✓ PASSED
            </span>
          )}
          {breached && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-black" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
              ✗ BREACHED
            </span>
          )}
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
  const accountSize = account?.account_size || 100000;
  // Priority: rule_snapshot (admin-configured at purchase time) → rules → fallback 1
  const minDays = account?.rule_snapshot?.min_trading_days ?? rules?.minTradingDays ?? 1;

  // Convert % to USD based on account size
  const profitTargetUsd = (profitTargetPct / 100) * accountSize;
  const profitTargetLimitUsd = ((rules?.profitTarget || 10) / 100) * accountSize;
  const dailyDDUsd = (dailyDDPct / 100) * accountSize;
  const dailyDDLimitUsd = ((rules?.dailyDDLimit || 5) / 100) * accountSize;
  const maxDDUsd = (maxDDPct / 100) * accountSize;
  const maxDDLimitUsd = ((rules?.maxDDLimit || 10) / 100) * accountSize;

  const challengeLabel =
    account?.challenge_type === 'instant_light' ? 'Instant Light'
    : account?.challenge_type === 'instant' ? 'Instant Funding'
    : 'Two-Step Challenge';

  const objectives = [
    {
      label: 'Profit Target',
      current: profitTargetPct,
      target: rules?.profitTarget || 10,
      limit: rules?.profitTarget || 10,
      color: '#FF5C00',
      inverse: false,
      usdValue: profitTargetUsd,
      limitUsd: profitTargetLimitUsd,
    },
    {
      label: 'Max Daily Loss',
      current: dailyDDPct,
      target: rules?.dailyDDLimit || 5,
      limit: rules?.dailyDDLimit || 5,
      color: '#FF8A3D',
      inverse: true,
      usdValue: dailyDDUsd,
      limitUsd: dailyDDLimitUsd,
    },
    {
      label: 'Max Overall Loss',
      current: maxDDPct,
      target: rules?.maxDDLimit || 10,
      limit: rules?.maxDDLimit || 10,
      color: '#8b5cf6',
      inverse: true,
      usdValue: maxDDUsd,
      limitUsd: maxDDLimitUsd,
    },
    {
      label: 'Minimum Trading Days',
      current: tradingDays,
      target: minDays,
      limit: minDays,
      color: '#10b981',
      unit: 'd',
      inverse: false,
      minDays,
      tradingDays,
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
            {phase.replace('phase', 'Phase ')} · {challengeLabel} · ${accountSize.toLocaleString()}
          </p>
        </div>
        {(() => {
          const st = account?.status || 'active';
          const reviewStatus = account?.phase_review_status;
          const fundedReviewStatus = account?.funded_review_status;
          const isUnderReview = (st === 'passed' && (reviewStatus === 'pending_review' || fundedReviewStatus === 'pending_review'));
          const label = isUnderReview ? 'Passed — Under Review' : st;
          const bg = isUnderReview ? 'rgba(96,165,250,0.1)' : st === 'active' ? 'rgba(16,185,129,0.1)' : st === 'passed' ? 'rgba(96,165,250,0.1)' : 'rgba(255,92,0,0.1)';
          const color = isUnderReview ? '#60a5fa' : st === 'active' ? '#10b981' : st === 'passed' ? '#60a5fa' : '#FF5C00';
          return (
            <div className="px-3 py-1.5 rounded-lg text-[10px] font-mono font-semibold capitalize"
              style={{ background: bg, color, border: `1px solid ${color}30` }}>
              {label}
            </div>
          );
        })()}
      </div>
      <div className="space-y-5">
        {objectives.map((obj, i) => <ObjectiveRow key={obj.label} {...obj} i={i} />)}
      </div>
    </div>
  );
}