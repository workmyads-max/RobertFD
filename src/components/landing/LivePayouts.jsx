import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ChevronRight } from 'lucide-react';

const payoutData = [
  { id: 'XF_9', flag: '🇸🇬', country: 'Singapore', amount: '$25,227', days: '2 days' },
  { id: 'XF_22', flag: '🇺🇸', country: 'USA', amount: '$4,413', days: 'Michael' },
  { id: 'XF_7', flag: '🇬🇧', country: 'UK', amount: '$1,561', days: 'Jun-need' },
  { id: 'XF_14', flag: '🇩🇪', country: 'Germany', amount: '$39,000', days: '5 months' },
  { id: 'XF_33', flag: '🇯🇵', country: 'Japan', amount: '$17,368', days: 'Off-st' },
  { id: 'XF_5', flag: '🇦🇺', country: 'Australia', amount: '$3,595', days: 'Ask h' },
  { id: 'XF_8', flag: '🇨🇦', country: 'Canada', amount: '$5,322', days: 'Canada P' },
  { id: 'XF_19', flag: '🇦🇪', country: 'UAE', amount: '$18,900', days: '25m ago' },
  { id: 'XF_2', flag: '🇮🇳', country: 'India', amount: '$7,400', days: '30m ago' },
  { id: 'XF_16', flag: '🇵🇰', country: 'Pakistan', amount: '$5,200', days: '38m ago' },
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
          <h2 className="text-3xl md:text-4xl font-black mb-2">
            Over <span className="text-primary">200K+</span> Verified Payouts
          </h2>
        </motion.div>

        {/* Horizontal Scrolling Cards */}
        <div className="overflow-x-auto pb-4" style={{ scrollbarWidth: 'none' }}>
          <div className="flex gap-4 min-w-max px-6">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="relative w-56 h-48 rounded-2xl overflow-hidden group"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,92,0,0.15), rgba(204,255,0,0.1))',
                  border: '1px solid rgba(255,92,0,0.3)',
                  boxShadow: '0 8px 32px rgba(255,92,0,0.15)',
                }}
              >
                {/* Hover glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
                  style={{ background: 'radial-gradient(circle at 50% 50%, rgba(255,92,0,0.2), transparent)' }} />

                {/* Content */}
                <div className="relative p-5 h-full flex flex-col justify-between">
                  {/* Top Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono text-primary uppercase tracking-wider">Show Payout</span>
                      <span className="text-2xl">{item.flag}</span>
                    </div>
                  </div>

                  {/* Bottom Section */}
                  <div>
                    <div className="mb-3">
                      <div className="text-2xl font-black text-white mb-1">{item.amount}</div>
                      <div className="text-xs text-muted-foreground">{item.days}</div>
                    </div>
                    <button className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg, rgba(255,92,0,0.4), rgba(204,255,0,0.3))', border: '1px solid rgba(255,92,0,0.4)' }}>
                      <span>SHOW PAYOUT</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Accent border gradient */}
                <div className="absolute inset-0 pointer-events-none rounded-2xl" style={{
                  background: 'linear-gradient(135deg, rgba(255,92,0,0.5) 0%, transparent 50%, rgba(204,255,0,0.3) 100%)',
                  opacity: '0.3',
                }} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}