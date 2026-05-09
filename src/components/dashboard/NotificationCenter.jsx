import React from 'react';
import { motion } from 'framer-motion';
import { Bell, AlertTriangle, Zap, DollarSign, Megaphone, Settings, Info, Clock } from 'lucide-react';

const typeConfig = {
  announcement: { icon: Megaphone, color: '#FF5C00', bg: 'rgba(255,92,0,0.1)', border: 'rgba(255,92,0,0.25)' },
  maintenance: { icon: Settings, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
  rule_update: { icon: Info, color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.25)' },
  promotion: { icon: Zap, color: '#CCFF00', bg: 'rgba(204,255,0,0.1)', border: 'rgba(204,255,0,0.25)' },
  payout: { icon: DollarSign, color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)' },
  market_alert: { icon: AlertTriangle, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)' },
  system: { icon: Bell, color: '#888', bg: 'rgba(136,136,136,0.1)', border: 'rgba(136,136,136,0.2)' },
};

const priorityLabel = { low: 'LOW', medium: 'MED', high: 'HIGH', critical: '⚡ CRITICAL' };
const priorityColor = { low: '#666', medium: '#f59e0b', high: '#ef4444', critical: '#ef4444' };

export default function NotificationCenter({ notifications }) {
  if (!notifications || notifications.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-black text-foreground mb-6 flex items-center gap-3">
          <Bell className="w-6 h-6 text-primary" /> Notifications
        </h1>
        <div className="text-center py-16 rounded-2xl" style={{ border: '1px dashed rgba(255,255,255,0.1)' }}>
          <Bell className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No notifications right now.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
          <Bell className="w-6 h-6 text-primary" /> Notifications
        </h1>
        <span className="px-3 py-1 rounded-full text-xs font-mono bg-primary/15 text-primary border border-primary/25">
          {notifications.length} active
        </span>
      </div>

      <div className="space-y-3">
        {notifications.map((n, i) => {
          const cfg = typeConfig[n.type] || typeConfig.system;
          const Icon = cfg.icon;
          return (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-2xl p-5 transition-all"
              style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${cfg.color}20`, border: `1px solid ${cfg.color}40` }}>
                  <Icon className="w-5 h-5" style={{ color: cfg.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-sm font-bold text-foreground">{n.title}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold"
                      style={{ color: priorityColor[n.priority], background: `${priorityColor[n.priority]}15`, border: `1px solid ${priorityColor[n.priority]}30` }}>
                      {priorityLabel[n.priority]}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">{n.message}</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    {n.cta_label && n.cta_link && (
                      <a href={n.cta_link} target="_blank" rel="noreferrer"
                        className="px-4 py-1.5 rounded-full text-xs font-semibold text-white transition-all hover:opacity-90"
                        style={{ background: cfg.color }}>
                        {n.cta_label}
                      </a>
                    )}
                    <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground ml-auto">
                      <Clock className="w-3 h-3" />
                      {n.created_date ? new Date(n.created_date).toLocaleDateString() : 'Recent'}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}