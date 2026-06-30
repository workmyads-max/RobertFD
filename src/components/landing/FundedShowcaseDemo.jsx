import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Award, Target } from 'lucide-react';

export default function FundedShowcaseDemo() {
  const stats = [
    { label: 'Funded Capital', value: '$100,000', icon: DollarSign, subtext: 'Trading capital' },
    { label: 'Current Balance', value: '$104,280', icon: TrendingUp, subtext: 'Live balance', positive: true },
    { label: 'Your Earnings', value: '+$3,424', icon: Award, subtext: '80% profit split', positive: true },
    { label: 'Next Withdrawal', value: 'Available', icon: Target, subtext: 'Ready to claim' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl p-6 md:p-8"
      style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
            Funded Trader Status
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-2">
            Congratulations, you're funded
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Trade with real capital and withdraw your profits daily
          </p>
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">Account active</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              className="rounded-xl p-4"
              style={{ background: 'hsl(var(--secondary))', border: '1px solid hsl(var(--border))' }}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {s.label}
                </span>
                <Icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className={`text-xl font-bold tabular ${s.positive ? 'text-emerald-400' : 'text-foreground'}`}>
                {s.value}
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">{s.subtext}</div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}