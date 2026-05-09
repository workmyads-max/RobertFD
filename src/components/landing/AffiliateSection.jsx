import React from 'react';
import { motion } from 'framer-motion';
import { Users, DollarSign, BarChart3, ArrowRight } from 'lucide-react';

const perks = [
  { icon: DollarSign, title: 'Up to 15% Commission', description: 'Earn on every challenge purchase made through your referral link.' },
  { icon: BarChart3, title: 'Real-Time Tracking', description: 'Monitor your referrals, clicks, and earnings from a dedicated dashboard.' },
  { icon: Users, title: 'Unlimited Referrals', description: 'No cap on how many traders you can refer. Scale without limits.' },
];

export default function AffiliateSection() {
  return (
    <section id="affiliate" className="relative py-32">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="glass rounded-3xl overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-0">
            {/* Left */}
            <div className="p-10 lg:p-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <span className="text-xs font-mono text-primary uppercase tracking-widest">Partner Program</span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight mt-4 mb-6">
                  Earn While You Trade
                </h2>
                <p className="text-muted-foreground text-lg mb-10 max-w-md">
                  Join our affiliate program and earn commission on every trader you refer.
                  Instant payouts, real-time analytics, and unlimited earning potential.
                </p>
                <a href="#" className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-full font-semibold hover:bg-primary/90 transition-all group glow-orange-sm">
                  Join Affiliate Program
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </a>
              </motion.div>
            </div>

            {/* Right */}
            <div className="p-10 lg:p-16 bg-secondary/30">
              <div className="space-y-8">
                {perks.map((perk, i) => {
                  const Icon = perk.icon;
                  return (
                    <motion.div
                      key={perk.title}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="flex gap-5"
                    >
                      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold mb-1">{perk.title}</h3>
                        <p className="text-sm text-muted-foreground">{perk.description}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}