import React from 'react';
import { motion } from 'framer-motion';
import XFLogo from '@/components/shared/XFLogo';

const links = {
  Product: ['Start Challenge', 'Instant Funding', 'Pricing', 'Platforms', 'Leaderboard'],
  Company: ['About Us', 'Careers', 'Press Kit', 'Blog', 'Contact'],
  Legal: ['Terms & Conditions', 'Privacy Policy', 'Risk Disclosure', 'AML Policy'],
  Support: ['Help Center', 'FAQ', 'Live Chat', 'Email Support'],
};

export default function Footer() {
  return (
    <footer id="contact" className="relative pt-32 pb-12 overflow-hidden">
      {/* Watermark */}
      <div className="absolute bottom-0 left-0 right-0 text-center pointer-events-none select-none">
        <span className="text-[12vw] font-black text-foreground/[0.015] leading-none tracking-tighter font-mono">
          XFUNDED TRADER
        </span>
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="mb-6">
              <XFLogo size="sm" />
            </div>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              Dubai-based institutional proprietary trading firm. Empowering elite traders worldwide.
            </p>
            <p className="text-xs text-primary/70 font-mono mb-4">Established Since 2026</p>
            <div className="text-xs text-muted-foreground">
              <p>support@xfundedtrader.com</p>
              <p className="mt-1">Dubai International Financial Centre, UAE</p>
            </div>
          </div>

          {/* Links */}
          {Object.entries(links).map(([title, items]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-foreground mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-border/30 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} XFunded Trader. All rights reserved. — Established Since 2026
            </p>
            <div className="flex items-center gap-6">
              {['Twitter', 'Discord', 'Telegram', 'Instagram', 'LinkedIn'].map((social) => (
                <a key={social} href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                  {social}
                </a>
              ))}
            </div>
          </div>

          <div className="mt-8 p-4 glass-light rounded-xl">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              <strong>Risk Disclosure:</strong> Trading foreign exchange, cryptocurrencies, and CFDs carries a
              high level of risk and may not be suitable for all investors. XFunded Trader does not provide financial
              advice. Past performance is not indicative of future results. By using our services, you acknowledge
              and accept the risks involved in trading financial instruments.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}