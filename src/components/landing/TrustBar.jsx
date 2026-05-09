import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Globe, Shield, TrendingUp } from 'lucide-react';

const pillars = [
  { icon: TrendingUp, label: 'Trusted by Global Traders', sub: '14,000+ active' },
  { icon: Zap, label: 'Fast Payout Processing', sub: 'Within 24 hours' },
  { icon: Shield, label: 'Professional Trading Environment', sub: 'Institutional grade' },
  { icon: Globe, label: 'Trade With Confidence', sub: '150+ countries' },
];

export default function TrustBar() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="relative py-10 border-y border-white/5 overflow-hidden"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,92,0,0.03), transparent)' }}
      />
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {pillars.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground leading-tight">{p.label}</div>
                  <div className="text-xs text-muted-foreground font-mono mt-0.5">{p.sub}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}