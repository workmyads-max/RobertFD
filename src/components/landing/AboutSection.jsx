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
          {/* Animated 3D Geometric Shape */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative h-[450px] flex items-center justify-center"
          >
            <div className="glass rounded-2xl overflow-hidden relative w-full h-full flex items-center justify-center">
              {/* Animated background grid */}
              <motion.div 
                className="absolute inset-0"
                style={{ 
                  backgroundImage: 'linear-gradient(rgba(255,92,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,92,0,0.05) 1px, transparent 1px)',
                  backgroundSize: '50px 50px'
                }}
              />

              {/* 3D Rotating Shape */}
              <motion.div
                className="relative w-64 h-64"
                animate={{ rotateX: [0, 360], rotateY: [0, 360], rotateZ: [0, 180] }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
              >
                <svg
                  viewBox="0 0 400 400"
                  className="w-full h-full"
                  style={{
                    filter: 'drop-shadow(0 0 40px rgba(255, 92, 0, 0.4))'
                  }}
                >
                  {/* Main boomerang shape with gradient */}
                  <defs>
                    <linearGradient id="xftGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FF5C00" />
                      <stop offset="50%" stopColor="#FF8A3D" />
                      <stop offset="100%" stopColor="#CCFF00" />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Primary shape */}
                  <path
                    d="M 80 320 Q 120 280 150 250 Q 200 200 280 140 Q 320 100 340 80 Q 360 60 380 80 Q 400 100 360 160 Q 300 240 240 300 Q 180 360 120 360 Q 80 360 60 340 Q 40 320 80 320 Z"
                    fill="url(#xftGradient)"
                    filter="url(#glow)"
                    opacity="0.9"
                  />

                  {/* Secondary darker shape for depth */}
                  <path
                    d="M 100 300 Q 130 270 160 240 Q 200 200 260 150 Q 290 120 310 100 Q 330 80 345 100 Q 360 120 330 170 Q 280 250 220 310 Q 160 360 110 360 Q 90 360 80 340 Q 70 320 100 300 Z"
                    fill="#FF5C00"
                    opacity="0.6"
                  />

                  {/* Accent glow element */}
                  <circle cx="300" cy="150" r="25" fill="#CCFF00" opacity="0.4" filter="url(#glow)" />
                </svg>
              </motion.div>

              {/* Floating XFT Badge */}
              <motion.div 
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, type: 'spring' }}
                className="absolute top-8 right-8 glass rounded-xl p-4 border border-primary/30"
              >
                <div className="text-xs font-mono text-primary mb-1">XFT</div>
                <div className="text-xl font-black gradient-text">Momentum</div>
              </motion.div>

              {/* Scanning line effect */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(180deg, transparent, rgba(204,255,0,0.08), transparent)' }}
                animate={{ top: ['-100%', '200%'] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
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
              className="absolute -top-4 -left-4 w-32 h-32 rounded-full blur-3xl opacity-25"
              style={{ background: '#FF5C00' }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.25, 0.4, 0.25] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <motion.div 
              className="absolute -bottom-4 -right-4 w-40 h-40 rounded-full blur-3xl opacity-20"
              style={{ background: '#8b5cf6' }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.35, 0.2] }}
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