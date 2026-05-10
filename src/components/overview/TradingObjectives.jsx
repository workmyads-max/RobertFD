import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

function ObjectiveBar({ label, current, target, color, unit = '%' }) {
  const pct = Math.min((current / target) * 100, 100);
  const status = pct >= 100 ? 'done' : pct > 70 ? 'warn' : 'ok';
  const barColor = status === 'done' ? '#00f5a0' : status === 'warn' ? '#f59e0b' : color;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-mono text-white/50">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono" style={{ color: barColor }}>
            {current.toFixed(2)}{unit} / {target}{unit}
          </span>
          {status === 'done'
            ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            : <Clock className="w-3.5 h-3.5 text-white/20" />}
        </div>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${barColor}80, ${barColor})`,
            boxShadow: `0 0 8px ${barColor}40`,
          }}
        />
      </div>
    </div>
  );
}

export default function TradingObjectives({ account, rules }) {
  const profitProgress = account?.profit_target_progress || 0;
  const profitTarget = rules?.profitTarget || 10;
  const dailyDD = account?.daily_drawdown_used || 0;
  const dailyDDLimit = rules?.dailyDDLimit || 5;
  const maxDD = account?.max_drawdown_used || 0;
  const maxDDLimit = rules?.maxDDLimit || 10;
  const tradingDays = account?.trading_days || 0;
  const minDays = rules?.minTradingDays || 4;

  const objectives = [
    { label: 'Profit Target', current: profitProgress, target: profitTarget, color: '#0095ff' },
    { label: 'Daily Drawdown Used', current: dailyDD, target: dailyDDLimit, color: '#f59e0b' },
    { label: 'Max Drawdown Used', current: maxDD, target: maxDDLimit, color: '#ef4444' },
    { label: 'Min Trading Days', current: tradingDays, target: minDays, color: '#a855f7', unit: 'd' },
  ];

  return (
    <div className="rounded-2xl p-5"
      style={{
        background: 'linear-gradient(135deg, rgba(8,12,24,0.95), rgba(12,18,35,0.95))',
        border: '1px solid rgba(0,149,255,0.1)',
        backdropFilter: 'blur(20px)',
      }}>
      <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
        <span className="w-1.5 h-4 rounded-full bg-blue-500 inline-block" />
        Trading Objectives
        <span className="text-[9px] font-mono text-white/30 ml-auto capitalize">{account?.phase?.replace('phase', 'Phase ')} Challenge</span>
      </h3>
      <div className="space-y-4">
        {objectives.map(obj => <ObjectiveBar key={obj.label} {...obj} />)}
      </div>
    </div>
  );
}