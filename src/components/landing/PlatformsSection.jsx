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
    <section className="relative py-32">
      <div className="max-w-[1400px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <span className="text-xs font-mono text-primary uppercase tracking-widest">Trading Platforms</span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mt-4 mb-6">
            Your Trading Ecosystem
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Trade on world-class platforms with institutional-grade technology.
          </p>
        </motion.div>

        {/* Bento Layout */}
        <div className="grid lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-8">
          {platforms.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="glass rounded-2xl p-8 hover:-translate-y-1 transition-all duration-500 group"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-7 h-7 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{p.title}</h3>
                    <span className="text-xs font-mono text-muted-foreground">{p.subtitle}</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{p.description}</p>
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
            <div className="p-10 lg:p-14">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-light mb-6">
                <Smartphone className="w-4 h-4 text-primary" />
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Coming Soon</span>
              </div>
              <h3 className="text-3xl md:text-4xl font-black mb-4">
                Mobile Apps
              </h3>
              <p className="text-muted-foreground mb-6">
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
            <div className="relative h-64 lg:h-auto overflow-hidden">
              <img src={mobileImage} alt="Mobile trading" className="w-full h-full object-cover opacity-40" />
              <div className="absolute inset-0 bg-gradient-to-r from-card to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="px-6 py-3 glass rounded-full text-sm font-mono text-muted-foreground border border-primary/20">
                  CONFIDENTIAL — Q3 2026
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}