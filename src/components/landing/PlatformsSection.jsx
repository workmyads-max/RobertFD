import React from 'react';
import { motion } from 'framer-motion';
import { Monitor, Smartphone, Globe, Lock } from 'lucide-react';

const platforms = [
  {
    icon: Monitor,
    title: 'MetaTrader 5',
    subtitle: 'MT5',
    description: 'Industry-standard platform with advanced charting, Expert Advisors, and institutional execution.',
    available: true,
  },
  {
    icon: Globe,
    title: 'TradeLocker',
    subtitle: 'Web-Based',
    description: 'Next-generation web trading platform with modern UI, real-time analytics, and seamless execution.',
    available: true,
  },
  {
    icon: Monitor,
    title: 'Proprietary Terminal',
    subtitle: 'Web Trading',
    description: 'Our custom-built web trading terminal with advanced order management and portfolio analytics.',
    available: true,
  },
];

export default function PlatformsSection({ mobileImage }) {
   return (
     <section className="relative py-20 md:py-32">
       <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           className="text-center mb-14 md:mb-20"
         >
           <span className="text-xs font-mono text-primary uppercase tracking-widest">Trading Platforms</span>
           <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mt-4 mb-6">
             Your Trading Ecosystem
           </h2>
           <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
            Trade on world-class platforms with institutional-grade technology.
          </p>
        </motion.div>

        {/* Bento Layout */}
        <div className="grid lg:grid-cols-3 gap-3 sm:gap-6 max-w-6xl mx-auto mb-6 md:mb-8">
          {platforms.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="glass rounded-2xl p-5 sm:p-8 hover:-translate-y-1 transition-all duration-500 group"
                >
                <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="w-11 sm:w-14 h-11 sm:h-14 rounded-xl bg-secondary flex items-center justify-center group-hover:bg-primary/20 transition-colors flex-shrink-0">
                    <Icon className="w-5 sm:w-7 h-5 sm:h-7 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold">{p.title}</h3>
                    <span className="text-xs font-mono text-muted-foreground">{p.subtitle}</span>
                  </div>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-4">{p.description}</p>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent" />
                  <span className="text-xs font-mono text-accent">Available Now</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Mobile Apps Coming Soon */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass rounded-2xl overflow-hidden max-w-6xl mx-auto"
        >
          <div className="grid lg:grid-cols-2 items-center">
            <div className="p-6 sm:p-10 lg:p-14">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-light mb-4 sm:mb-6">
                <Smartphone className="w-4 h-4 text-primary" />
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Coming Soon</span>
              </div>
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-black mb-3 sm:mb-4">
                Mobile Apps
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
                Trade on the go with our upcoming iOS and Android apps. Full platform functionality in your pocket.
              </p>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 px-4 py-2 glass-light rounded-full">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">iOS</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 glass-light rounded-full">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Android</span>
                </div>
              </div>
            </div>
            <div className="relative h-80 lg:h-auto overflow-hidden p-6 flex items-center justify-center">
              {/* Animated phone mockups */}
              <div className="relative w-full max-w-md mx-auto">
                {/* Back phone (iOS) */}
                <motion.div
                  initial={{ opacity: 0, x: -60, rotateY: -15 }}
                  whileInView={{ opacity: 0.6, x: -40, rotateY: -10 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className="absolute left-0 top-8 w-32 h-64 rounded-3xl border-2"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,92,0,0.1), rgba(255,92,0,0.05))',
                    borderColor: 'rgba(255,92,0,0.3)',
                    boxShadow: '0 0 30px rgba(255,92,0,0.2)',
                  }}
                >
                  {/* Screen content */}
                  <div className="absolute inset-2 rounded-2xl overflow-hidden" style={{ background: 'rgba(0,0,0,0.8)' }}>
                    {/* Animated chart lines */}
                    <motion.svg viewBox="0 0 100 60" className="w-full h-full">
                      <motion.polyline
                        fill="none"
                        stroke="#FF5C00"
                        strokeWidth="1.5"
                        points="0,50 20,45 40,48 60,30 80,35 100,20"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                      />
                    </motion.svg>
                  </div>
                  {/* iOS notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-3 bg-black rounded-b-lg" />
                </motion.div>

                {/* Front phone (Android) */}
                <motion.div
                  initial={{ opacity: 0, x: 60, rotateY: 15 }}
                  whileInView={{ opacity: 0.6, x: 40, rotateY: 10 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.4 }}
                  className="absolute right-0 top-8 w-32 h-64 rounded-3xl border-2"
                  style={{
                    background: 'linear-gradient(135deg, rgba(204,255,0,0.1), rgba(204,255,0,0.05))',
                    borderColor: 'rgba(204,255,0,0.3)',
                    boxShadow: '0 0 30px rgba(204,255,0,0.2)',
                  }}
                >
                  {/* Screen content */}
                  <div className="absolute inset-2 rounded-2xl overflow-hidden" style={{ background: 'rgba(0,0,0,0.8)' }}>
                    {/* Animated candlesticks */}
                    <motion.div className="w-full h-full p-2 flex items-end justify-around gap-1">
                      {[
                        { h: 20, color: '#10b981' },
                        { h: 35, color: '#ef4444' },
                        { h: 25, color: '#10b981' },
                        { h: 40, color: '#10b981' },
                        { h: 30, color: '#ef4444' },
                      ].map((candle, i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          whileInView={{ height: `${candle.h}%` }}
                          transition={{ duration: 0.6, delay: 0.6 + i * 0.1 }}
                          className="w-2 rounded-sm"
                          style={{ background: candle.color }}
                        />
                      ))}
                    </motion.div>
                  </div>
                  {/* Android camera hole */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-black rounded-full" />
                </motion.div>

                {/* Center phone (Main) */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="relative w-40 h-72 mx-auto rounded-[2.5rem] border-2 overflow-hidden"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,92,0,0.15), rgba(14,14,16,0.95))',
                    borderColor: 'rgba(255,92,0,0.5)',
                    boxShadow: '0 0 60px rgba(255,92,0,0.3), inset 0 0 40px rgba(255,92,0,0.1)',
                  }}
                >
                  {/* Screen bezel */}
                  <div className="absolute inset-1 rounded-[2rem] overflow-hidden" style={{ background: '#0a0a0c' }}>
                    {/* Status bar */}
                    <div className="absolute top-0 left-0 right-0 h-6 flex items-center justify-between px-4">
                      <span className="text-[6px] text-white/60">9:41</span>
                      <div className="flex gap-1">
                        <div className="w-3 h-2 rounded-sm bg-white/60" />
                        <div className="w-2 h-2 rounded-full bg-white/60" />
                      </div>
                    </div>

                    {/* Trading terminal UI */}
                    <div className="absolute inset-0 top-6 p-3">
                      {/* Symbol header */}
                      <motion.div
                        className="flex items-center justify-between mb-2"
                        animate={{ x: [0, 2, 0] }}
                        transition={{ duration: 3, repeat: Infinity }}
                      >
                        <span className="text-[9px] font-bold text-white">BTC/USD</span>
                        <motion.span
                          className="text-[8px] text-emerald-400"
                          animate={{ opacity: [0.7, 1, 0.7] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          +2.34%
                        </motion.span>
                      </motion.div>

                      {/* Price display */}
                      <motion.div
                        className="text-center mb-2"
                        animate={{ scale: [1, 1.02, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <span className="text-lg font-black text-primary">$95,842</span>
                      </motion.div>

                      {/* Mini chart */}
                      <div className="h-16 mb-2 rounded-lg overflow-hidden" style={{ background: 'rgba(255,92,0,0.05)' }}>
                        <svg viewBox="0 0 120 50" className="w-full h-full">
                          <motion.polyline
                            fill="none"
                            stroke="#FF5C00"
                            strokeWidth="1.5"
                            points="0,45 15,42 30,38 45,40 60,30 75,28 90,20 105,18 120,12"
                            initial={{ pathLength: 0 }}
                            whileInView={{ pathLength: 1 }}
                            transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 0.5 }}
                          />
                          <defs>
                            <linearGradient id="phoneChartGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#FF5C00" stopOpacity="0.3" />
                              <stop offset="100%" stopColor="#FF5C00" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <polygon
                            fill="url(#phoneChartGrad)"
                            points="0,45 15,42 30,38 45,40 60,30 75,28 90,20 105,18 120,12 120,50 0,50"
                          />
                        </svg>
                      </div>

                      {/* Action buttons */}
                      <div className="grid grid-cols-2 gap-1.5">
                        <motion.button
                          className="py-2 rounded-lg text-[8px] font-bold"
                          style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)' }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <span className="text-emerald-400">BUY</span>
                        </motion.button>
                        <motion.button
                          className="py-2 rounded-lg text-[8px] font-bold"
                          style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)' }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <span className="text-red-400">SELL</span>
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  {/* Home indicator */}
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full bg-white/30" />
                </motion.div>

                {/* Floating badges */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 1 }}
                  className="absolute -top-2 -right-2 px-3 py-1.5 rounded-full text-[9px] font-bold"
                  style={{
                    background: 'rgba(255,92,0,0.2)',
                    border: '1px solid rgba(255,92,0,0.4)',
                    color: '#FF5C00',
                  }}
                >
                  iOS + Android
                </motion.div>
              </div>

              {/* Background glow effects */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full blur-3xl opacity-20" style={{ background: '#FF5C00' }} />
                <div className="absolute bottom-1/4 right-1/4 w-32 h-32 rounded-full blur-3xl opacity-20" style={{ background: '#CCFF00' }} />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}