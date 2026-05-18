import React from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, TrendingDown } from 'lucide-react';

const RISK_CONFIG = {
  low:    { color: '#10b981', label: 'LOW RISK',    glow: 'rgba(16,185,129,0.3)'  },
  medium: { color: '#f59e0b', label: 'MEDIUM RISK', glow: 'rgba(245,158,11,0.3)' },
  high:   { color: '#ef4444', label: 'HIGH RISK',   glow: 'rgba(239,68,68,0.3)'  },
};

export default function RiskScoreGauge({ score = 0, level = 'low', factors = [], expanded = false }) {
  const cfg = RISK_CONFIG[level] || RISK_CONFIG.low;
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="rounded-2xl p-6 h-full"
      style={{ background: `${cfg.color}08`, border: `1px solid ${cfg.color}25` }}>
      <div className="flex items-center gap-2 mb-5">
        <Shield className="w-4 h-4" style={{ color: cfg.color }} />
        <span className="text-sm font-black text-foreground">Risk Score Engine</span>
        <span className="ml-auto px-2 py-0.5 rounded-full text-[9px] font-black"
          style={{ background: `${cfg.color}20`, color: cfg.color, border: `1px solid ${cfg.color}40` }}>
          LIVE
        </span>
      </div>

      {/* SVG Gauge */}
      <div className="flex justify-center mb-5">
        <div className="relative w-36 h-36">
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
            <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
            <motion.circle
              cx="60" cy="60" r="54" fill="none"
              stroke={cfg.color} strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
              style={{ filter: `drop-shadow(0 0 8px ${cfg.glow})` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div className="text-3xl font-black" style={{ color: cfg.color }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
              {score}
            </motion.div>
            <div className="text-[9px] font-mono text-muted-foreground">/ 100</div>
          </div>
        </div>
      </div>

      <div className="text-center mb-5">
        <div className="text-sm font-black tracking-widest" style={{ color: cfg.color }}>{cfg.label}</div>
        <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
          {score < 30 ? 'Trading within safe parameters' : score < 60 ? 'Some risk factors detected' : 'Immediate attention required'}
        </div>
      </div>

      {/* Risk Factors */}
      <div className="space-y-2">
        <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">Risk Factors</div>
        {factors.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-3 rounded-xl"
            style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
            ✓ No risk factors detected
          </div>
        ) : factors.slice(0, expanded ? 10 : 4).map((f, i) => {
          const fc = f.severity === 'high' ? '#ef4444' : f.severity === 'medium' ? '#f59e0b' : '#10b981';
          return (
            <motion.div key={i}
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between px-3 py-2 rounded-lg"
              style={{ background: `${fc}0a`, border: `1px solid ${fc}20` }}>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: fc }} />
                <span className="text-xs text-foreground">{f.label}</span>
              </div>
              <span className="text-[10px] font-mono font-bold" style={{ color: fc }}>{f.value}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}