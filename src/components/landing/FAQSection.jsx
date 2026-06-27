import React from 'react';
import { motion } from 'framer-motion';
import MiniRocket from './MiniRocket';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: 'How does funding work?',
    a: 'You can choose between our Two-Step Challenge, Instant Funding, or Instant Light. With the Two-Step Challenge, you pass two evaluation phases (10% target in Phase 1, 5% in Phase 2) to prove your trading skills, then receive a simulation funded account. With Instant Funding, you get immediate access to a simulation funded account without any evaluation. Instant Light offers the same benefits at 50% lower cost with trailing drawdown protection.',
  },
  {
    q: 'What are the reward targets for each phase?',
    a: 'For the Two-Step Challenge: Phase 1 requires a 10% reward target, and Phase 2 requires a 5% reward target. There are no consistency rules - you can achieve these targets in any trading style you prefer. Instant Funding and Instant Light have no reward targets since there\'s no evaluation phase.',
  },
  {
    q: 'What are the drawdown rules?',
    a: 'All accounts have a 5% daily drawdown limit and a 10% maximum drawdown. For Instant Light accounts, the maximum drawdown is trailing - it moves up as your balance grows, providing extra protection. Daily drawdown resets at 23:00 UTC (3:00 AM GMT+4).',
  },
  {
    q: 'How are payouts processed?',
    a: 'Payouts are processed within 24 hours of your withdrawal request. Two-Step Challenge accounts have bi-weekly payout schedules, while Instant Funding and Instant Light accounts enjoy daily payout requests. We support bank transfers, crypto (BTC, USDT TRC20), and other popular payment methods. You keep 80% of your rewards on all plans.',
  },
  {
    q: 'Which platforms are supported?',
    a: 'We support MetaTrader 5 (MT5), TradeLocker, and our proprietary web trading terminal. All platforms offer advanced charting, real-time data, and mobile compatibility. Mobile apps for iOS and Android are currently in development and coming soon.',
  },
  {
    q: 'What leverage do I get?',
    a: 'Two-Step Challenge offers 1:100 leverage in standard mode or 1:30 in swing mode. The 1:100 mode has restrictions on news trading, overnight holding, and weekend holding. The 1:30 swing mode unlocks all trading styles with full freedom. Instant Funding and Instant Light accounts operate at 1:30 leverage with no trading restrictions.',
  },
  {
    q: 'Are news trades allowed?',
    a: 'Yes, but with conditions. Two-Step Challenge accounts with 1:100 leverage cannot trade during high-impact news events. However, if you choose 1:30 swing mode, news trading is fully allowed. Instant Funding and Instant Light accounts (which operate at 1:30) can trade news without any restrictions.',
  },
  {
    q: 'Is swing trading allowed?',
    a: 'Absolutely. You can hold positions overnight and over weekends with no restrictions. Two-Step Challenge accounts need to be in 1:30 swing mode for overnight/weekend holding. Instant Funding and Instant Light accounts have full swing trading freedom from day one.',
  },
  {
    q: 'Are there any consistency rules?',
    a: 'No! We don\'t have any consistency rules. You don\'t need to trade a minimum number of days, achieve profits across multiple days, or meet any lot size requirements. You can pass your evaluation in a single trade if your strategy allows it.',
  },
  {
    q: 'What is trailing drawdown (Instant Light)?',
    a: 'Trailing drawdown is a protective feature exclusive to Instant Light accounts. The maximum drawdown level "trails" or follows your balance upward. For example, if you start with $10,000 and a 10% trailing DD ($1,000), your floor is $9,000. If your balance grows to $11,000, your floor moves up to $9,900. This protects your profits while giving you room to trade.',
  },
  {
    q: 'How fast are withdrawals?',
    a: 'Most withdrawals are processed within 24 hours. Instant Funding and Instant Light accounts enjoy priority processing, with many payouts completed within a few hours of the request. All payouts are secure and support multiple methods including crypto and bank transfers.',
  },
  {
    q: 'What happens if I breach the drawdown rules?',
    a: 'If you breach the daily or maximum drawdown limit, your account will be automatically closed. However, you can purchase a new challenge at any time. Our Risk Shield technology provides real-time alerts and automatic stop-loss enforcement to help you stay within limits.',
  },
  {
    q: 'Can I use Expert Advisors (EAs)?',
    a: 'Yes! Expert Advisors and algorithmic trading strategies are fully supported on MT5. However, HFT (High-Frequency Trading) and arbitrage strategies are not permitted. Our systems detect and flag these activities to maintain fair trading conditions for all traders.',
  },
  {
    q: 'Is there a time limit to pass the challenge?',
    a: 'No, there is no time limit to pass the Two-Step Challenge. You can take as long as you need to reach the reward targets. However, we recommend having a structured trading plan and maintaining consistent risk management throughout your evaluation.',
  },
  {
    q: 'What is the reward split?',
    a: 'All plans offer an 80/20 reward split - you keep 80% of the rewards you generate, and the company retains 20%. This is one of the most competitive splits in the prop trading industry. Reward splits are calculated on realized P&L from closed positions.',
  },
  {
    q: 'Can I upgrade my account size later?',
    a: 'Yes! You can request an account upgrade at any time. The upgrade fee is prorated based on the difference between your current plan and the new plan. Contact support or visit your dashboard to process an upgrade request.',
  },
];

export default function FAQSection() {
  return (
    <section id="faq" className="relative py-32 overflow-hidden">
      <MiniRocket size={28} className="absolute right-8 top-20 opacity-20" rotate={-15} delay={0.2} />
      <MiniRocket size={20} className="absolute left-8 bottom-20 opacity-15" rotate={30} delay={0.5} />
      <div className="max-w-[1400px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-xs font-mono text-primary uppercase tracking-widest">Support</span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mt-4 mb-6">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Everything you need to know about getting funded.
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <AccordionItem value={`faq-${i}`} className="glass rounded-xl border-none px-6">
                  <AccordionTrigger className="text-left text-foreground hover:no-underline py-5 text-base font-semibold">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}