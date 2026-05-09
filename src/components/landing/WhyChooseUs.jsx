import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Globe, Shield, BarChart3, HeadphonesIcon, Building, FileText, DollarSign } from 'lucide-react';
import MiniRocket from './MiniRocket';

const features = [
  { icon: Zap, title: 'Fast Payouts', description: 'Lightning-fast withdrawals processed within hours, not days.' },
  { icon: Globe, title: 'Global Traders', description: 'Serving traders from 150+ countries across every timezone.' },
  { icon: Shield, title: 'Secure Infrastructure', description: 'Bank-grade security with SOC2 compliance and encrypted data.' },
  { icon: BarChart3, title: 'Advanced Analytics', description: 'AI-powered trading analytics and real-time performance tracking.' },
  { icon: HeadphonesIcon, title: 'Professional Support', description: '24/7 dedicated support team with average 15-minute response time.' },
  { icon: Building, title: 'Institutional Liquidity', description: 'Tier-1 liquidity providers ensuring deep pools and tight spreads.' },
  { icon: FileText, title: 'Transparent Rules', description: 'No hidden conditions. Every rule is documented and verifiable.' },
  { icon: DollarSign, title: 'Best Industry Pricing', description: 'The most competitive challenge pricing in the prop trading industry.' },
];

export default function WhyChooseUs() {
  return (
    <section className="relative py-32 overflow-hidden">
      <MiniRocket size={36} className="absolute left-8 top-24 opacity-20" rotate={15} delay={0} />
      <MiniRocket size={26} className="absolute right-12 bottom-24 opacity-20" rotate={-45} delay={0.3} />
      <div className="max-w-[1400px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <span className="text-xs font-mono text-primary uppercase tracking-widest">Why Robert Funds</span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mt-4 mb-6">
            Built for Elite Traders
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Every feature is designed to give you an unfair advantage.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="glass rounded-2xl p-6 hover:-translate-y-1 transition-all duration-500 group"
              >
                <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <h3 className="text-base font-bold mb-2">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}