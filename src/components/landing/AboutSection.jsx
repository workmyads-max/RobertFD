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
          {/* XFT Logo Design */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative h-[450px] flex items-center justify-center"
          >
            <div className="glass rounded-2xl overflow-hidden relative w-full h-full flex items-center justify-center">
              {/* Background gradient mesh */}
              <div className="absolute inset-0" style={{ 
                  backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,92,0,0.08) 0%, transparent 70%)'
                }} />

              {/* XFT Logo - Static Design */}
              <div className="relative w-80 h-80">
                <svg viewBox="0 0 400 400" className="w-full h-full">
                  <defs>
                    <linearGradient id="xftGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FF5C00" />
                      <stop offset="100%" stopColor="#FF8A3D" />
                    </linearGradient>
                    <linearGradient id="xftGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#CCFF00" />
                      <stop offset="100%" stopColor="#FF5C00" />
                    </linearGradient>
                    <filter id="glow2">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Abstract X shape */}
                  <g filter="url(#glow2)">
                    <rect x="120" y="100" width="40" height="200" rx="8" fill="url(#xftGrad1)" transform="rotate(45 140 200)" opacity="0.9" />
                    <rect x="240" y="100" width="40" height="200" rx="8" fill="url(#xftGrad1)" transform="rotate(-45 260 200)" opacity="0.9" />
                  </g>

                  {/* F shape integrated */}
                  <g filter="url(#glow2)">
                    <path d="M 220 140 L 300 140 L 300 180 L 260 180 L 260 220 L 300 220 L 300 260 L 220 260 Z" fill="url(#xftGrad2)" opacity="0.85" />
                  </g>

                  {/* T shape on top */}
                  <g filter="url(#glow2)">
                    <rect x="100" y="80" width="200" height="35" rx="6" fill="url(#xftGrad2)" opacity="0.9" />
                    <rect x="185" y="115" width="30" height="85" rx="6" fill="url(#xftGrad2)" opacity="0.9" />
                  </g>

                  {/* Decorative circles */}
                  <circle cx="320" cy="120" r="12" fill="#CCFF00" opacity="0.5" filter="url(#glow2)" />
                  <circle cx="80" cy="280" r="8" fill="#FF5C00" opacity="0.4" filter="url(#glow2)" />
                  <circle cx="320" cy="300" r="10" fill="#FF8A3D" opacity="0.3" filter="url(#glow2)" />
                </svg>
              </div>

              {/* Floating XFT Badge */}
              <motion.div 
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, type: 'spring' }}
                className="absolute top-8 right-8 glass rounded-xl p-4 border border-primary/30"
              >
                <div className="text-xs font-mono text-primary mb-1">XFT</div>
                <div className="text-lg font-black gradient-text">XfundedTrader</div>
              </motion.div>
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