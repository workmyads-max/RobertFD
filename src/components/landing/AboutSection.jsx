import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Users, Shield, Globe } from 'lucide-react';

const highlights = [
{ icon: MapPin, label: 'Headquartered', value: 'Dubai' },
  { icon: Users, label: 'Team Members', value: '120+' },
  { icon: Shield, label: 'Regulated', value: 'Compliant' },
  { icon: Globe, label: 'Countries Served', value: '150+' },
];

export default function AboutSection({ aboutImage }) {
  return (
    <section id="about" className="relative py-32">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Animated UI/UX Visualization */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="glass rounded-2xl overflow-hidden relative h-[400px] circuit-bg">
              {/* Animated grid background */}
              <motion.div 
                className="absolute inset-0 opacity-20"
                style={{ 
                  backgroundImage: 'linear-gradient(rgba(255,92,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,92,0,0.1) 1px, transparent 1px)',
                  backgroundSize: '40px 40px'
                }}
                animate={{ backgroundPosition: ['0px 0px', '40px 40px'] }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              />
              
              {/* Floating chart cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="absolute top-8 left-8 right-8 h-32 glass rounded-xl border border-primary/20 p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-primary">XAU/USD</span>
                  <span className="text-xs font-mono text-accent">+2.4%</span>
                </div>
                <motion.div 
                  className="h-16 flex items-end gap-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                    <motion.div
                      key={i}
                      className="flex-1 rounded-t bg-gradient-to-t from-primary/60 to-primary/20"
                      style={{ height: `${h}%` }}
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ delay: 0.5 + i * 0.05, duration: 0.3 }}
                    />
                  ))}
                </motion.div>
              </motion.div>

              {/* Middle stats row */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="absolute top-44 left-8 right-8 grid grid-cols-3 gap-3"
              >
                {[
                  { label: 'Traders', value: '15K+', color: '#FF5C00' },
                  { label: 'Payouts', value: '$50M', color: '#CCFF00' },
                  { label: 'Countries', value: '150+', color: '#8b5cf6' },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    className="glass rounded-lg p-3 border border-white/5 text-center"
                    whileHover={{ scale: 1.05, borderColor: 'rgba(255,92,0,0.3)' }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <motion.div 
                      className="text-lg font-black"
                      style={{ color: stat.color }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.6 + i * 0.1, type: 'spring' }}
                    >
                      {stat.value}
                    </motion.div>
                    <div className="text-[9px] font-mono text-muted-foreground mt-1">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Bottom animated line chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 }}
                className="absolute bottom-8 left-8 right-8 glass rounded-xl border border-primary/20 p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono text-muted-foreground">Performance</span>
                  <motion.div 
                    className="w-2 h-2 rounded-full bg-accent"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
                <svg className="h-20 w-full" viewBox="0 0 400 80" preserveAspectRatio="none">
                  <motion.path
                    d="M0,60 Q40,55 80,40 T160,35 T240,45 T320,25 T400,15"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="2"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2, delay: 0.8, ease: 'easeInOut' }}
                  />
                  <motion.path
                    d="M0,60 Q40,55 80,40 T160,35 T240,45 T320,25 T400,15 L400,80 L0,80 Z"
                    fill="url(#gradientFill)"
                    opacity="0.2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.2 }}
                    transition={{ delay: 1.5 }}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#FF5C00" />
                      <stop offset="100%" stopColor="#CCFF00" />
                    </linearGradient>
                    <linearGradient id="gradientFill" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#FF5C00" />
                      <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                  </defs>
                </svg>
              </motion.div>

              {/* Scanning line effect */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(180deg, transparent, rgba(204,255,0,0.05), transparent)' }}
                animate={{ top: ['-100%', '200%'] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear', delay: 1 }}
              />
            </div>

            {/* Floating stats card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="absolute -bottom-6 -right-6 glass rounded-2xl p-6 max-w-xs border border-primary/20"
            >
              <div className="text-xs font-mono text-primary mb-2">ESTABLISHED</div>
              <div className="text-2xl font-black">Since 2026</div>
              <div className="text-sm text-muted-foreground mt-1">Dubai, UAE</div>
            </motion.div>

            {/* Decorative glow elements */}
            <motion.div 
              className="absolute -top-4 -left-4 w-24 h-24 rounded-full blur-3xl opacity-20"
              style={{ background: '#FF5C00' }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.3, 0.2] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <motion.div 
              className="absolute -bottom-4 -right-4 w-32 h-32 rounded-full blur-3xl opacity-15"
              style={{ background: '#CCFF00' }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.25, 0.15] }}
              transition={{ duration: 5, repeat: Infinity, delay: 1 }}
            />
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-xs font-mono text-primary uppercase tracking-widest">About XFunded Trader</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight mt-4 mb-6">
              The Future of Prop Trading
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              We are a Dubai-based next-generation proprietary trading firm focused on empowering
              traders globally with fair evaluation models, advanced trading technology, and fast payouts.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-10">
              Our mission is to democratize access to institutional-grade trading capital, enabling talented
              traders from every corner of the world to realize their full potential without personal financial risk.
            </p>

            <div className="grid grid-cols-2 gap-6">
              {highlights.map((h) => {
                const Icon = h.icon;
                return (
                  <div key={h.label} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">{h.label}</div>
                      <div className="text-lg font-bold">{h.value}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}