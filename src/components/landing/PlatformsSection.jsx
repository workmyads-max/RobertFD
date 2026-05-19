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
            <div className="relative h-[500px] lg:h-auto overflow-hidden p-8 flex items-center justify-center">
              {/* Animated phone mockups with premium design */}
              <div className="relative w-full max-w-lg mx-auto">
                {/* Back phone (iOS - Left) */}
                <motion.div
                  initial={{ opacity: 0, x: -80, rotateY: -20, rotateX: 10 }}
                  whileInView={{ opacity: 0.7, x: -60, rotateY: -15, rotateX: 5 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute left-0 top-4 w-36 h-72"
                  style={{
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {/* Phone frame */}
                  <div className="relative w-full h-full rounded-[2.5rem] p-1.5"
                    style={{
                      background: 'linear-gradient(135deg, #2a2a2e, #1a1a1e)',
                      boxShadow: '0 0 40px rgba(255,92,0,0.25), inset 0 0 20px rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,92,0,0.3)',
                    }}
                  >
                    {/* Screen */}
                    <div className="w-full h-full rounded-[2.2rem] overflow-hidden relative" style={{ background: '#000' }}>
                      {/* Chart */}
                      <motion.svg viewBox="0 0 120 80" className="w-full h-full">
                        <motion.polyline
                          fill="none"
                          stroke="#FF5C00"
                          strokeWidth="2"
                          points="0,70 15,65 30,68 45,55 60,58 75,45 90,48 105,35 120,30"
                          initial={{ pathLength: 0 }}
                          whileInView={{ pathLength: 1 }}
                          transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 0.5 }}
                        />
                        <defs>
                          <linearGradient id="iosGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#FF5C00" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#FF5C00" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <polygon
                          fill="url(#iosGrad)"
                          points="0,70 15,65 30,68 45,55 60,58 75,45 90,48 105,35 120,30 120,80 0,80"
                        />
                      </motion.svg>
                      {/* Notch */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-6 bg-black rounded-b-2xl" />
                    </div>
                  </div>
                  {/* Side button */}
                  <div className="absolute -right-0.5 top-16 w-1 h-8 rounded-r-md bg-gradient-to-b from-gray-600 to-gray-800" />
                </motion.div>

                {/* Front phone (Android - Right) */}
                <motion.div
                  initial={{ opacity: 0, x: 80, rotateY: 20, rotateX: 10 }}
                  whileInView={{ opacity: 0.7, x: 60, rotateY: 15, rotateX: 5 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute right-0 top-4 w-36 h-72"
                  style={{
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {/* Phone frame */}
                  <div className="relative w-full h-full rounded-[2.5rem] p-1.5"
                    style={{
                      background: 'linear-gradient(135deg, #1e2a1a, #0f1410)',
                      boxShadow: '0 0 40px rgba(204,255,0,0.25), inset 0 0 20px rgba(255,255,255,0.05)',
                      border: '1px solid rgba(204,255,0,0.3)',
                    }}
                  >
                    {/* Screen */}
                    <div className="w-full h-full rounded-[2.2rem] overflow-hidden relative" style={{ background: '#000' }}>
                      {/* Candlesticks */}
                      <div className="w-full h-full p-3 flex items-end justify-around gap-1">
                        {[
                          { h: 25, color: '#10b981', wick: 15 },
                          { h: 40, color: '#ef4444', wick: 20 },
                          { h: 30, color: '#10b981', wick: 12 },
                          { h: 50, color: '#10b981', wick: 18 },
                          { h: 35, color: '#ef4444', wick: 16 },
                        ].map((candle, i) => (
                          <motion.div
                            key={i}
                            className="flex flex-col items-center"
                            initial={{ opacity: 0, scale: 0 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.8 + i * 0.1 }}
                          >
                            {/* Wick top */}
                            <div className="w-px mb-0.5" style={{ height: candle.wick * 0.4, background: candle.color }} />
                            {/* Body */}
                            <div className="w-3 rounded-sm" style={{ height: candle.h, background: candle.color }} />
                            {/* Wick bottom */}
                            <div className="w-px mt-0.5" style={{ height: candle.wick * 0.3, background: candle.color }} />
                          </motion.div>
                        ))}
                      </div>
                      {/* Camera hole */}
                      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-black border border-gray-700" />
                    </div>
                  </div>
                  {/* Side buttons */}
                  <div className="absolute -right-0.5 top-14 w-1 h-6 rounded-r-md bg-gradient-to-b from-gray-600 to-gray-800" />
                  <div className="absolute -right-0.5 top-24 w-1 h-8 rounded-r-md bg-gradient-to-b from-gray-600 to-gray-800" />
                </motion.div>

                {/* Center phone (Main - Premium iPhone Pro style) */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.85, y: 30, rotateX: 10 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="relative w-48 h-80 mx-auto"
                  style={{
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {/* Titanium frame with gradient */}
                  <div className="absolute inset-0 rounded-[2.8rem] p-[3px]"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,92,0,0.4), rgba(255,140,61,0.3), rgba(255,92,0,0.4))',
                      boxShadow: `
                        0 0 80px rgba(255,92,0,0.4),
                        0 0 120px rgba(255,92,0,0.2),
                        inset 0 0 40px rgba(255,255,255,0.1),
                        inset 0 0 80px rgba(0,0,0,0.3)
                      `,
                    }}
                  >
                    {/* Inner frame */}
                    <div className="w-full h-full rounded-[2.6rem] p-[2px]"
                      style={{
                        background: 'linear-gradient(180deg, #2a2a2e, #0a0a0c)',
                        boxShadow: 'inset 0 2px 8px rgba(255,255,255,0.1)',
                      }}
                    >
                      {/* Screen display */}
                      <div className="w-full h-full rounded-[2.4rem] overflow-hidden relative" style={{ background: '#000000' }}>
                        {/* Dynamic Island */}
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-7 bg-black rounded-full z-20 flex items-center justify-center gap-2">
                          <motion.div
                            className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                            animate={{ opacity: [0.6, 1, 0.6] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                          <motion.div
                            className="w-1.5 h-1.5 rounded-full bg-blue-500"
                            animate={{ opacity: [0.6, 1, 0.6] }}
                            transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                          />
                        </div>

                        {/* Status bar */}
                        <div className="absolute top-2 left-0 right-0 h-8 flex items-center justify-between px-5 z-10">
                          <span className="text-[9px] font-medium text-white/70">9:41</span>
                          <div className="flex items-center gap-1.5">
                            {/* Signal */}
                            <div className="flex gap-0.5 items-end">
                              {[1, 2, 3, 4].map(h => (
                                <div key={h} className="w-1 rounded-sm bg-white/70" style={{ height: h * 1.5 }} />
                              ))}
                            </div>
                            {/* WiFi */}
                            <div className="w-3 h-2 rounded-t-full border-t border-white/70" />
                            {/* Battery */}
                            <div className="w-5 h-2.5 rounded-sm border border-white/70 p-0.5">
                              <div className="h-full w-3/4 rounded-sm bg-gradient-to-r from-emerald-400 to-emerald-500" />
                            </div>
                          </div>
                        </div>

                        {/* Trading Terminal UI */}
                        <div className="absolute inset-0 top-10 p-4">
                          {/* Symbol & Price Header */}
                          <motion.div
                            className="text-center mb-3"
                            animate={{ y: [0, -2, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                          >
                            <div className="flex items-center justify-center gap-2 mb-1">
                              <span className="text-[10px] font-bold text-white/90">BTC/USD</span>
                              <motion.span
                                className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400"
                                animate={{ opacity: [0.7, 1, 0.7] }}
                                transition={{ duration: 2, repeat: Infinity }}
                              >
                                +2.34%
                              </motion.span>
                            </div>
                            <motion.div
                              className="text-2xl font-black"
                              style={{
                                background: 'linear-gradient(135deg, #FF5C00, #FF8A3D)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                              }}
                              animate={{ scale: [1, 1.03, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              $95,842.30
                            </motion.div>
                          </motion.div>

                          {/* Advanced Chart */}
                          <div className="h-24 mb-3 rounded-xl overflow-hidden relative group">
                            <div className="absolute inset-0" style={{ background: 'rgba(255,92,0,0.05)' }}>
                              <svg viewBox="0 0 160 80" className="w-full h-full">
                                {/* Grid lines */}
                                {[20, 40, 60].map(y => (
                                  <line key={y} x1="0" y1={y} x2="160" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                                ))}
                                {/* Main chart line */}
                                <motion.polyline
                                  fill="none"
                                  stroke="url(#mainChartGrad)"
                                  strokeWidth="2.5"
                                  points="0,70 20,65 40,68 60,50 80,55 100,40 120,35 140,25 160,20"
                                  initial={{ pathLength: 0 }}
                                  whileInView={{ pathLength: 1 }}
                                  transition={{ duration: 3, repeat: Infinity, repeatDelay: 0.5 }}
                                  style={{ filter: 'drop-shadow(0 0 8px rgba(255,92,0,0.6))' }}
                                />
                                {/* Gradient fill */}
                                <defs>
                                  <linearGradient id="mainChartGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#FF5C00" />
                                    <stop offset="100%" stopColor="#FF8A3D" />
                                  </linearGradient>
                                  <linearGradient id="mainChartFill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#FF5C00" stopOpacity="0.3" />
                                    <stop offset="100%" stopColor="#FF5C00" stopOpacity="0" />
                                  </linearGradient>
                                </defs>
                                <polygon
                                  fill="url(#mainChartFill)"
                                  points="0,70 20,65 40,68 60,50 80,55 100,40 120,35 140,25 160,20 160,80 0,80"
                                />
                                {/* Pulsing dot at end */}
                                <motion.circle
                                  cx="160"
                                  cy="20"
                                  r="4"
                                  fill="#FF5C00"
                                  animate={{ scale: [1, 1.3, 1], opacity: [0.8, 0.4, 0.8] }}
                                  transition={{ duration: 1.5, repeat: Infinity }}
                                />
                              </svg>
                            </div>
                          </div>

                          {/* Order Book Preview */}
                          <div className="mb-3 rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <div className="flex justify-between text-[7px] font-mono text-white/40 mb-1">
                              <span>Best Ask</span>
                              <span>Best Bid</span>
                            </div>
                            <div className="flex justify-between text-[9px] font-bold">
                              <span className="text-red-400">95,843.50</span>
                              <span className="text-emerald-400">95,841.00</span>
                            </div>
                          </div>

                          {/* Trading Buttons */}
                          <div className="grid grid-cols-2 gap-2">
                            <motion.button
                              className="py-2.5 rounded-xl text-[9px] font-black flex items-center justify-center gap-1.5"
                              style={{
                                background: 'linear-gradient(135deg, rgba(16,185,129,0.25), rgba(16,185,129,0.15))',
                                border: '1px solid rgba(16,185,129,0.4)',
                                boxShadow: '0 0 20px rgba(16,185,129,0.2), inset 0 0 10px rgba(16,185,129,0.1)',
                              }}
                              whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(16,185,129,0.35)' }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <span className="text-emerald-400">BUY</span>
                              <span className="text-[10px]">📈</span>
                            </motion.button>
                            <motion.button
                              className="py-2.5 rounded-xl text-[9px] font-black flex items-center justify-center gap-1.5"
                              style={{
                                background: 'linear-gradient(135deg, rgba(239,68,68,0.25), rgba(239,68,68,0.15))',
                                border: '1px solid rgba(239,68,68,0.4)',
                                boxShadow: '0 0 20px rgba(239,68,68,0.2), inset 0 0 10px rgba(239,68,68,0.1)',
                              }}
                              whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(239,68,68,0.35)' }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <span className="text-red-400">SELL</span>
                              <span className="text-[10px]">📉</span>
                            </motion.button>
                          </div>
                        </div>

                        {/* Home indicator */}
                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-20 h-1 rounded-full bg-white/40" />
                      </div>
                    </div>
                  </div>

                  {/* Side buttons - Premium design */}
                  <div className="absolute -left-0.5 top-16 w-1.5 h-8 rounded-l-md bg-gradient-to-r from-gray-500 to-gray-700 shadow-lg" />
                  <div className="absolute -right-0.5 top-14 w-1.5 h-6 rounded-r-md bg-gradient-to-l from-gray-500 to-gray-700 shadow-lg" />
                  <div className="absolute -right-0.5 top-24 w-1.5 h-10 rounded-r-md bg-gradient-to-l from-gray-500 to-gray-700 shadow-lg" />

                  {/* Floating "Pro" badge */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5, y: -10 }}
                    whileInView={{ opacity: 1, scale: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 1.2, type: 'spring' }}
                    className="absolute -top-3 -right-3 px-3 py-1.5 rounded-full text-[9px] font-black"
                    style={{
                      background: 'linear-gradient(135deg, #FF5C00, #FF8A3D)',
                      boxShadow: '0 0 20px rgba(255,92,255,0,0.4), 0 0 40px rgba(255,92,0,0.2)',
                      border: '2px solid rgba(255,255,255,0.3)',
                    }}
                  >
                    PRO
                  </motion.div>
                </motion.div>

                {/* Floating platform badges */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 1.4 }}
                  className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-[10px] font-bold flex items-center gap-2"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <span className="text-white">iOS</span>
                  <span className="w-1 h-1 rounded-full bg-primary" />
                  <span className="text-white">Android</span>
                </motion.div>
              </div>

              {/* Enhanced background effects */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Rotating gradient ring */}
                <motion.div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full"
                  style={{
                    background: 'conic-gradient(from 0deg, rgba(255,92,0,0.1), rgba(204,255,0,0.1), rgba(255,92,0,0.1))',
                    filter: 'blur(60px)',
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                />
                {/* Additional glows */}
                <div className="absolute top-1/4 left-1/4 w-40 h-40 rounded-full blur-3xl opacity-25" style={{ background: '#FF5C00' }} />
                <div className="absolute bottom-1/4 right-1/4 w-40 h-40 rounded-full blur-3xl opacity-25" style={{ background: '#CCFF00' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-[100px] opacity-15" style={{ background: 'radial-gradient(circle, rgba(255,92,0,0.3), transparent)' }} />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}