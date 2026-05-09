import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp } from 'lucide-react';

const traders = [
  { rank: 1, name: 'ALPHA_9', country: 'SG', pnl: '+$42,800', winRate: '78%', payouts: '$112,400' },
  { rank: 2, name: 'FURY_22', country: 'US', pnl: '+$38,200', winRate: '74%', payouts: '$98,750' },
  { rank: 3, name: 'NOVA_7', country: 'UK', pnl: '+$35,600', winRate: '71%', payouts: '$87,200' },
  { rank: 4, name: 'BOLT_33', country: 'JP', pnl: '+$31,100', winRate: '69%', payouts: '$76,100' },
  { rank: 5, name: 'STORM_19', country: 'AE', pnl: '+$28,900', winRate: '67%', payouts: '$68,900' },
  { rank: 6, name: 'EDGE_5', country: 'AU', pnl: '+$25,400', winRate: '65%', payouts: '$59,850' },
  { rank: 7, name: 'BLAZE_11', country: 'FR', pnl: '+$22,800', winRate: '63%', payouts: '$54,200' },
  { rank: 8, name: 'TITAN_2', country: 'IN', pnl: '+$19,600', winRate: '61%', payouts: '$47,400' },
];

export default function Leaderboard() {
  return (
    <section className="relative py-32">
      <div className="max-w-[1400px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-xs font-mono text-primary uppercase tracking-widest">Top Performers</span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mt-4 mb-6">
            Leaderboard
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            The most profitable funded traders this month.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto glass rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-6 gap-4 px-6 py-3 border-b border-border/30 text-xs font-mono text-muted-foreground uppercase tracking-wider">
            <span>Rank</span>
            <span>Trader</span>
            <span>Country</span>
            <span>P&L</span>
            <span>Win Rate</span>
            <span>Payouts</span>
          </div>

          {traders.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="grid grid-cols-6 gap-4 px-6 py-4 border-b border-border/10 items-center hover:bg-secondary/30 transition-colors"
            >
              <span className="flex items-center gap-2">
                {t.rank <= 3 ? (
                  <Trophy className={`w-4 h-4 ${
                    t.rank === 1 ? 'text-yellow-500' : t.rank === 2 ? 'text-gray-400' : 'text-orange-600'
                  }`} />
                ) : (
                  <span className="text-sm font-mono text-muted-foreground">#{t.rank}</span>
                )}
              </span>
              <span className="text-sm font-mono font-semibold text-foreground">{t.name}</span>
              <span className="text-sm font-mono text-muted-foreground">{t.country}</span>
              <span className="text-sm font-semibold text-accent">{t.pnl}</span>
              <span className="text-sm font-mono text-foreground">{t.winRate}</span>
              <span className="text-sm font-mono text-primary">{t.payouts}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}