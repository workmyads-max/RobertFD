import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, CheckCircle2, Zap } from 'lucide-react';

const payoutData = [
  { id: 'XF_9', country: 'SG', countryName: 'Singapore', amount: '$12,400.00', time: '2m ago' },
  { id: 'XF_22', country: 'US', countryName: 'United States', amount: '$8,750.00', time: '5m ago' },
  { id: 'XF_7', country: 'GB', countryName: 'United Kingdom', amount: '$15,200.00', time: '8m ago' },
  { id: 'XF_14', country: 'DE', countryName: 'Germany', amount: '$6,300.00', time: '12m ago' },
  { id: 'XF_33', country: 'JP', countryName: 'Japan', amount: '$22,100.00', time: '15m ago' },
  { id: 'XF_5', country: 'AU', countryName: 'Australia', amount: '$9,850.00', time: '18m ago' },
  { id: 'XF_8', country: 'CA', countryName: 'Canada', amount: '$11,600.00', time: '22m ago' },
  { id: 'XF_19', country: 'AE', countryName: 'UAE', amount: '$18,900.00', time: '25m ago' },
  { id: 'XF_2', country: 'IN', countryName: 'India', amount: '$7,400.00', time: '30m ago' },
  { id: 'XF_11', country: 'FR', countryName: 'France', amount: '$14,200.00', time: '35m ago' },
  { id: 'XF_16', country: 'PK', countryName: 'Pakistan', amount: '$5,200.00', time: '38m ago' },
  { id: 'XF_21', country: 'BR', countryName: 'Brazil', amount: '$9,100.00', time: '42m ago' },
  { id: 'XF_28', country: 'ZA', countryName: 'South Africa', amount: '$6,800.00', time: '45m ago' },
  { id: 'XF_31', country: 'NG', countryName: 'Nigeria', amount: '$4,500.00', time: '48m ago' },
  { id: 'XF_35', country: 'KE', countryName: 'Kenya', amount: '$3,900.00', time: '52m ago' },
];

const countryFlags = {
  SG: '🇸🇬', US: '🇺🇸', GB: '🇬🇧', DE: '🇩🇪', JP: '🇯🇵', AU: '🇦🇺',
  CA: '🇨🇦', AE: '🇦🇪', IN: '🇮🇳', FR: '🇫🇷', PK: '🇵🇰', BR: '🇧🇷',
  ZA: '🇿🇦', NG: '🇳🇬', KE: '🇰🇪',
};

export default function LivePayouts() {
  const [items, setItems] = useState(payoutData.slice(0, 7));
  const [nextIdx, setNextIdx] = useState(7);
  const [hoveredId, setHoveredId] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setItems((prev) => {
        const newItem = { ...payoutData[nextIdx % payoutData.length], time: 'Just now' };
        return [newItem, ...prev.slice(0, 6)];
      });
      setNextIdx((prev) => prev + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, [nextIdx]);

  return (
    <section className="relative py-32 overflow-hidden">
      {/* Animated background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full blur-[120px]"
          style={{ background: 'radial-gradient(ellipse, rgba(204,255,0,0.08) 0%, transparent 70%)' }}
          animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.1, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full glass-light">
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

        <div className="max-w-4xl mx-auto">
          {/* Glass card with enhanced design */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="glass rounded-3xl overflow-hidden relative"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 0 60px rgba(204,255,0,0.05), inset 0 0 40px rgba(255,255,255,0.02)',
            }}
          >
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-border/30 text-xs font-mono text-muted-foreground uppercase tracking-wider">
              <span className="col-span-3">Trader ID</span>
              <span className="col-span-3">Country</span>
              <span className="col-span-3">Amount</span>
              <span className="col-span-3">Status</span>
            </div>

            {/* Rows */}
            <AnimatePresence initial={false}>
              {items.map((item, i) => (
                <motion.div
                  key={item.id + '-' + i}
                  initial={{ opacity: 0, x: -30, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  exit={{ opacity: 0, x: 30, height: 0 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="group grid grid-cols-12 gap-4 px-6 py-4 border-b border-border/10 items-center hover:bg-white/[0.03] transition-all cursor-pointer relative overflow-hidden"
                  onMouseEnter={() => setHoveredId(item.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {/* Animated background on hover */}
                  {hoveredId === item.id && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0"
                      style={{ background: 'linear-gradient(90deg, rgba(204,255,0,0.08), transparent)' }}
                    />
                  )}
                  
                  {/* Trader ID with glow */}
                  <div className="col-span-3 relative z-10">
                    <span className="text-sm font-mono text-foreground font-semibold group-hover:text-accent transition-colors">
                      {item.id}
                    </span>
                  </div>
                  
                  {/* Country with flag */}
                  <div className="col-span-3 relative z-10">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{countryFlags[item.country] || '🌍'}</span>
                      <div className="flex flex-col">
                        <span className="text-sm font-mono text-foreground font-medium">{item.countryName}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Amount with animation */}
                  <div className="col-span-3 relative z-10">
                    <motion.div
                      className="flex items-center gap-2"
                      initial={{ scale: 0.95 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <span className="text-sm font-bold text-accent font-mono">{item.amount}</span>
                      {parseFloat(item.amount.replace(/[^0-9.-]+/g, '')) < 6000 && (
                        <Zap className="w-3 h-3 text-accent/60" />
                      )}
                    </motion.div>
                  </div>
                  
                  {/* Status */}
                  <div className="col-span-3 relative z-10">
                    <div className="flex items-center gap-2">
                      <motion.div
                        className="w-2 h-2 rounded-full bg-accent"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                      />
                      <span className="text-xs font-mono text-muted-foreground">{item.time}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Bottom indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 1 }}
            className="flex justify-center mt-6 gap-2"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-accent/30"
                animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
              />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}