import React from 'react';
import { motion } from 'framer-motion';
import { Shield, TrendingDown, Target, Newspaper, Moon, Settings } from 'lucide-react';

const rules = [
  {
    icon: TrendingDown,
    title: 'Daily Drawdown Limits',
    description: 'A maximum daily loss limit protects your funded account and enforces disciplined risk management.',
  },
  {
    icon: Shield,
    title: 'Maximum Drawdown',
    description: 'Overall drawdown limits ensure long-term capital preservation across all trading sessions.',
  },
  {
    icon: Target,
    title: 'Profit Targets',
    description: 'Clear profit targets for each evaluation phase so you always know exactly what to aim for.',
  },
  {
    icon: Newspaper,
    title: 'News Trading Rules',
    description: 'Trade during high-impact news events with specific guidelines to manage volatility risk.',
  },
  {
    icon: Moon,
    title: 'Swing Trading Allowed',
    description: 'Hold positions overnight and over weekends. No restrictions on swing trading strategies.',
  },
  {
    icon: Settings,
    title: 'Professional Conditions',
    description: 'Institutional-grade execution, tight spreads, and deep liquidity for optimal trading conditions.',
  },
];

export default function RulesSection() {
   return (
     <section className="relative py-20 md:py-32">
       <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           className="text-center mb-14 md:mb-20"
         >
           <span className="text-xs font-mono text-primary uppercase tracking-widest">Trading Rules</span>
           <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mt-4 mb-6">
             Clear & Fair Rules
           </h2>
           <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
            Transparent trading conditions designed for professional traders.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 max-w-6xl mx-auto">
          {rules.map((rule, i) => {
            const Icon = rule.icon;
            return (
              <motion.div
                key={rule.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="glass rounded-2xl p-5 sm:p-8 hover:-translate-y-1 transition-all duration-500 group"
                >
                <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl bg-secondary flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-5 sm:w-6 h-5 sm:h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <h3 className="text-base sm:text-lg font-bold mb-2 sm:mb-3">{rule.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{rule.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}