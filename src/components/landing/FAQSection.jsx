import React from 'react';
import { motion } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: 'How does funding work?',
    a: 'You can choose between our Two-Step Challenge or Instant Funding. With the Two-Step Challenge, you pass two evaluation phases to prove your trading skills, then receive a funded account. With Instant Funding, you get immediate access to a funded account without any evaluation.',
  },
  {
    q: 'How are payouts processed?',
    a: 'Payouts are processed within 24 hours of your withdrawal request. We support bank transfers, crypto (BTC, USDT), and other popular payment methods. With Instant Funding accounts, you can request daily payouts.',
  },
  {
    q: 'Which platforms are supported?',
    a: 'We support MetaTrader 5 (MT5), TradeLocker, and our proprietary web trading terminal. Mobile apps for iOS and Android are currently in development and coming soon.',
  },
  {
    q: 'Are news trades allowed?',
    a: 'Yes, news trading is allowed with certain risk management guidelines in place. Specific rules around high-impact news events are designed to protect both you and the funded capital.',
  },
  {
    q: 'Is swing trading allowed?',
    a: 'Absolutely. You can hold positions overnight and over weekends. We have no restrictions on swing trading strategies, giving you the flexibility to trade your way.',
  },
  {
    q: 'How fast are withdrawals?',
    a: 'Most withdrawals are processed within 24 hours. Instant Funding accounts enjoy priority processing, with many payouts completed within a few hours of the request.',
  },
];

export default function FAQSection() {
  return (
    <section id="faq" className="relative py-32">
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