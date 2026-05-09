import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Users, Shield, Globe } from 'lucide-react';

const highlights = [
  { icon: MapPin, label: 'Headquartered', value: 'Singapore' },
  { icon: Users, label: 'Team Members', value: '120+' },
  { icon: Shield, label: 'Regulated', value: 'Compliant' },
  { icon: Globe, label: 'Countries Served', value: '150+' },
];

export default function AboutSection({ aboutImage }) {
  return (
    <section id="about" className="relative py-32">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="glass rounded-2xl overflow-hidden">
              <img src={aboutImage} alt="Singapore headquarters" className="w-full opacity-70" />
            </div>
            <div className="absolute -bottom-6 -right-6 glass rounded-2xl p-6 max-w-xs">
              <div className="text-xs font-mono text-primary mb-2">ESTABLISHED</div>
              <div className="text-2xl font-black">Since 2022</div>
              <div className="text-sm text-muted-foreground mt-1">Singapore, Southeast Asia</div>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-xs font-mono text-primary uppercase tracking-widest">About AlphaFund</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight mt-4 mb-6">
              The Future of Prop Trading
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              We are a Singapore-based next-generation proprietary trading firm focused on empowering
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