import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, AlertTriangle, Zap, TrendingDown, Shield } from 'lucide-react';

export default function LiveRiskNotifications({ account, riskScore, violations }) {
  const [dismissed, setDismissed] = useState([]);

  const alerts = [];
  if (account) {
    const dailyDD = account.daily_drawdown_used || 0;
    const maxDD = account.max_drawdown_used || 0;

    if (dailyDD > 4) alerts.push({ id: 'daily-dd-critical', icon: TrendingDown, color: '#ef4444', title: 'Critical: Daily DD Limit Near', msg: `${dailyDD.toFixed(2)}% used of 5% limit - stop trading today` });
    else if (dailyDD > 3) alerts.push({ id: 'daily-dd-warn', icon: TrendingDown, color: '#f59e0b', title: 'Approaching Daily DD Limit', msg: `${dailyDD.toFixed(2)}% used - consider reducing exposure` });

    if (maxDD > 8) alerts.push({ id: 'max-dd-critical', icon: AlertTriangle, color: '#ef4444', title: 'Max DD Critical Level', msg: `${maxDD.toFixed(2)}% of 10% used - account at risk` });
    if (riskScore?.score >= 60) alerts.push({ id: 'high-risk', icon: Shield, color: '#ef4444', title: 'High Risk Score Detected', msg: `Risk score: ${riskScore.score}/100 - review trading behavior` });
    violations.forEach((v, i) => alerts.push({ id: `viol-${i}`, icon: Zap, color: '#ef4444', title: v.label, msg: v.desc }));
  }

  const visible = alerts.filter(a => !dismissed.includes(a.id));
  if (visible.length === 0) return null;

  return (
    <div className="mb-5 space-y-2">
      <AnimatePresence>
        {visible.slice(0, 3).map((alert, i) => {
          const Icon = alert.icon;
          return (
            <motion.div key={alert.id}
              initial={{ opacity: 0, x: -12, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              exit={{ opacity: 0, x: 12, height: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{
                background: `${alert.color}0d`,
                border: `1px solid ${alert.color}35`,
                boxShadow: `0 0 16px ${alert.color}12`,
              }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${alert.color}20` }}>
                <Icon className="w-3.5 h-3.5" style={{ color: alert.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold" style={{ color: alert.color }}>{alert.title}</div>
                <div className="text-[11px] text-muted-foreground truncate">{alert.msg}</div>
              </div>
              <button onClick={() => setDismissed(d => [...d, alert.id])}
                className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}