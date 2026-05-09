import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, CheckCircle2 } from 'lucide-react';

const payoutData = [
  { id: 'ALPHA_9', country: 'SG', amount: '$12,400.00', time: '2m ago' },
  { id: 'FURY_22', country: 'US', amount: '$8,750.00', time: '5m ago' },
  { id: 'NOVA_7', country: 'UK', amount: '$15,200.00', time: '8m ago' },
  { id: 'APEX_14', country: 'DE', amount: '$6,300.00', time: '12m ago' },
  { id: 'BOLT_33', country: 'JP', amount: '$22,100.00', time: '15m ago' },
  { id: 'EDGE_5', country: 'AU', amount: '$9,850.00', time: '18m ago' },
  { id: 'VIPER_8', country: 'CA', amount: '$11,600.00', time: '22m ago' },
  { id: 'STORM_19', country: 'AE', amount: '$18,900.00', time: '25m ago' },
  { id: 'TITAN_2', country: 'IN', amount: '$7,400.00', time: '30m ago' },
  { id: 'BLAZE_11', country: 'FR', amount: '$14,200.00', time: '35m ago' },
];

export default function LivePayouts() {
  const [items, setItems] = useState(payoutData.slice(0, 6));
  const [nextIdx, setNextIdx] = useState(6);

  useEffect(() => {
    const interval = setInterval(() => {
      setItems((prev) => {
        const newItem = { ...payoutData[nextIdx % payoutData.length], time: 'Just now' };
        return [newItem, ...prev.slice(0, 5)];
      });
      setNextIdx((prev) => prev + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, [nextIdx]);

  return (
    <section className="relative py-32">
      <div className="max-w-[1400px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-xs font-mono text-accent uppercase tracking-widest">Live Feed</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6">
            Live Payouts
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Real-time payout activity from traders worldwide.
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto glass rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-4 gap-4 px-6 py-3 border-b border-border/30 text-xs font-mono text-muted-foreground uppercase tracking-wider">
            <span>Trader ID</span>
            <span>Country</span>
            <span>Amount</span>
            <span>Status</span>
          </div>

          {/* Rows */}
          <AnimatePresence initial={false}>
            {items.map((item, i) => (
              <motion.div
                key={item.id + '-' + i}
                initial={{ opacity: 0, y: -20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="grid grid-cols-4 gap-4 px-6 py-4 border-b border-border/10 items-center"
              >
                <span className="text-sm font-mono text-foreground">{item.id}</span>
                <span className="text-sm font-mono text-muted-foreground">{item.country}</span>
                <span className="text-sm font-semibold text-accent">{item.amount}</span>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent" />
                  <span className="text-xs font-mono text-muted-foreground">{item.time}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}