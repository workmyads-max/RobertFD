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


      </div>
    </section>
  );
}