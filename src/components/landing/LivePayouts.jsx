import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

const payoutData = [
  { id: 'XF_9', flag: '🇸🇬', country: 'Singapore', amount: '$12,400', time: '2m ago' },
  { id: 'XF_22', flag: '🇺🇸', country: 'USA', amount: '$8,750', time: '5m ago' },
  { id: 'XF_7', flag: '🇬🇧', country: 'UK', amount: '$15,200', time: '8m ago' },
  { id: 'XF_14', flag: '🇩🇪', country: 'Germany', amount: '$6,300', time: '12m ago' },
  { id: 'XF_33', flag: '🇯🇵', country: 'Japan', amount: '$22,100', time: '15m ago' },
  { id: 'XF_5', flag: '🇦🇺', country: 'Australia', amount: '$9,850', time: '18m ago' },
  { id: 'XF_8', flag: '🇨🇦', country: 'Canada', amount: '$11,600', time: '22m ago' },
  { id: 'XF_19', flag: '🇦🇪', country: 'UAE', amount: '$18,900', time: '25m ago' },
  { id: 'XF_2', flag: '🇮🇳', country: 'India', amount: '$7,400', time: '30m ago' },
  { id: 'XF_16', flag: '🇵🇰', country: 'Pakistan', amount: '$5,200', time: '38m ago' },
  { id: 'XF_21', flag: '🇧🇷', country: 'Brazil', amount: '$9,100', time: '42m ago' },
  { id: 'XF_28', flag: '🇿🇦', country: 'South Africa', amount: '$6,800', time: '45m ago' },
  { id: 'XF_31', flag: '🇳🇬', country: 'Nigeria', amount: '$4,500', time: '48m ago' },
  { id: 'XF_35', flag: '🇰🇪', country: 'Kenya', amount: '$3,900', time: '52m ago' },
];

export default function LivePayouts() {
  const [items, setItems] = useState(payoutData);

  return (
    <section className="relative py-20">
      <div className="max-w-[1400px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest">Live Feed</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            Live Payouts
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Real-time payouts to traders worldwide.
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          <div className="glass rounded-2xl overflow-hidden border border-white/10">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className="flex items-center justify-between px-6 py-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <span className="text-sm font-mono font-semibold text-white w-20">{item.id}</span>
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-2xl">{item.flag}</span>
                    <span className="text-sm text-muted-foreground">{item.country}</span>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-base font-bold text-accent font-mono">{item.amount}</span>
                  <div className="flex items-center gap-2 w-24">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-mono text-muted-foreground">{item.time}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}