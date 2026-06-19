import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Users, Shield, Globe } from 'lucide-react';

const highlights = [
{ icon: MapPin, label: 'Headquartered', value: 'Dubai' },
{ icon: Users, label: 'Team Members', value: '120+' },
{ icon: Shield, label: 'Regulated', value: 'Compliant' },
{ icon: Globe, label: 'Countries Served', value: '150+' }];


export default function AboutSection({ aboutImage }) {
  return (
    <section id="about" className="relative py-32">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Trading Export Visualization */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative h-[450px] flex items-center justify-center">
            
            <div className="glass rounded-2xl overflow-hidden relative w-full h-full flex items-center justify-center">
              {/* Background trading pattern */}
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: 'linear-gradient(rgba(255,92,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,92,0,0.1) 1px, transparent 1px)',
                backgroundSize: '30px 30px'
              }} />

              {/* Main trading visualization */}
              <div className="relative w-full h-full p-8">
                {/* Candlestick chart */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg viewBox="0 0 400 300" className="w-full h-full">
                    {/* Grid lines */}
                    <defs>
                      <linearGradient id="candleUp" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#00f5a0" />
                        <stop offset="100%" stopColor="#00a86b" />
                      </linearGradient>
                      <linearGradient id="candleDown" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#FF5C00" />
                        <stop offset="100%" stopColor="#cc4900" />
                      </linearGradient>
                    </defs>
                    
                    {/* Candlestick 1 */}
                    <line x1="50" y1="180" x2="50" y2="120" stroke="#00f5a0" strokeWidth="2" />
                    <rect x="40" y="180" width="20" height="40" fill="#00f5a0" rx="2" />
                    
                    {/* Candlestick 2 */}
                    <line x1="90" y1="160" x2="90" y2="200" stroke="#FF5C00" strokeWidth="2" />
                    <rect x="80" y="160" width="20" height="40" fill="#FF5C00" rx="2" />
                    
                    {/* Candlestick 3 */}
                    <line x1="130" y1="190" x2="130" y2="110" stroke="#00f5a0" strokeWidth="2" />
                    <rect x="120" y="140" width="20" height="50" fill="#00f5a0" rx="2" />
                    
                    {/* Candlestick 4 */}
                    <line x1="170" y1="150" x2="170" y2="100" stroke="#00f5a0" strokeWidth="2" />
                    <rect x="160" y="110" width="20" height="40" fill="#00f5a0" rx="2" />
                    
                    {/* Candlestick 5 */}
                    <line x1="210" y1="130" x2="210" y2="170" stroke="#FF5C00" strokeWidth="2" />
                    <rect x="200" y="130" width="20" height="40" fill="#FF5C00" rx="2" />
                    
                    {/* Candlestick 6 */}
                    <line x1="250" y1="160" x2="250" y2="90" stroke="#00f5a0" strokeWidth="2" />
                    <rect x="240" y="100" width="20" height="60" fill="#00f5a0" rx="2" />
                    
                    {/* Candlestick 7 */}
                    <line x1="290" y1="120" x2="290" y2="80" stroke="#00f5a0" strokeWidth="2" />
                    <rect x="280" y="90" width="20" height="30" fill="#00f5a0" rx="2" />
                    
                    {/* Candlestick 8 */}
                    <line x1="330" y1="110" x2="330" y2="70" stroke="#00f5a0" strokeWidth="2" />
                    <rect x="320" y="80" width="20" height="30" fill="#00f5a0" rx="2" />
                    
                    {/* Trend line */}
                    <polyline points="50,150 90,180 130,165 170,125 210,150 250,125 290,100 330,90"
                    fill="none" stroke="#CCFF00" strokeWidth="2" strokeDasharray="4 4" opacity="0.6" />
                  </svg>
                </div>

                {/* Trading stats overlay */}
                <div className="absolute top-4 left-4 right-4 grid grid-cols-3 gap-3">
                  <div className="glass rounded-lg p-3 border border-white/5 text-center">
                    <div className="text-xs text-muted-foreground">Win Rate</div>
                    <div className="text-lg font-bold text-accent">78%</div>
                  </div>
                  <div className="glass rounded-lg p-3 border border-white/5 text-center">
                    <div className="text-xs text-muted-foreground">Profit</div>
                    <div className="text-lg font-bold" style={{ color: '#00f5a0' }}>+24.5%</div>
                  </div>
                  <div className="glass rounded-lg p-3 border border-white/5 text-center">
                    <div className="text-xs text-muted-foreground">Trades</div>
                    <div className="text-lg font-bold text-primary">1,247</div>
                  </div>
                </div>

                {/* XFT Brand badge */}
                








                

                {/* Floating elements */}
                










                
              </div>
            </div>

            {/* Floating stats card */}
            









            

            {/* Decorative glow elements */}
            <motion.div
              className="absolute -top-4 -left-4 w-32 h-32 rounded-full blur-3xl opacity-25"
              style={{ background: '#FF5C00' }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.25, 0.4, 0.25] }}
              transition={{ duration: 4, repeat: Infinity }} />
            
            



            
            
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}>
            
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
                  </div>);

              })}
            </div>
          </motion.div>
        </div>
      </div>
    </section>);

}