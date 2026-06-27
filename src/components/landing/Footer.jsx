import React from 'react';
import { Link } from 'react-router-dom';
import XFLogo from '@/components/shared/XFLogo';
import RiskDisclaimer from '@/components/shared/RiskDisclaimer';
import { Mail, MapPin, Phone, ExternalLink, Twitter, MessageCircle, Send, Instagram, Linkedin } from 'lucide-react';

const PRODUCT_LINKS = [
{ label: 'Start Challenge', href: '/challenges' },
{ label: 'Instant Funding', href: '/challenges' },
{ label: 'Pricing', href: '/#pricing' },
{ label: 'Platforms', href: '/#platforms' },
{ label: 'Leaderboard', href: '/dashboard' }];


const COMPANY_LINKS = [
{ label: 'About Us', href: '/#about' },
{ label: 'Careers', href: 'mailto:careers@xfundedtrader.com' },
{ label: 'Press Kit', href: 'mailto:press@xfundedtrader.com' },
{ label: 'Blog', href: '#' },
{ label: 'Contact', href: 'mailto:support@xfundedtrader.com' }];


const LEGAL_LINKS = [
{ label: 'Terms & Conditions', href: '/terms' },
{ label: 'Privacy Policy', href: '/privacy' },
{ label: 'Risk Disclosure', href: '/risk-disclosure' },
{ label: 'AML Policy', href: '/aml-policy' }];


const SUPPORT_LINKS = [
{ label: 'Help Center', href: '#faq' },
{ label: 'FAQ', href: '#faq' },
{ label: 'Live Chat', href: '#', isChat: true },
{ label: 'Email Support', href: 'mailto:support@xfundedtrader.com', isMail: true }];


const SOCIALS = [
{ label: 'Twitter / X', icon: Twitter, href: '#' },
{ label: 'Discord', icon: MessageCircle, href: '#' },
{ label: 'Telegram', icon: Send, href: '#' },
{ label: 'Instagram', icon: Instagram, href: '#' },
{ label: 'LinkedIn', icon: Linkedin, href: '#' }];


function FooterLink({ item }) {
  const cls = "text-sm text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center gap-1 group";

  const isExternal = item.href?.startsWith('mailto:') || item.href?.startsWith('http');

  if (item.isChat) {
    return (
      <button
        onClick={() => {
          const chatBtn = document.querySelector('[data-livechat]') || document.querySelector('.live-chat-trigger');
          if (chatBtn) chatBtn.click();
        }}
        className={cls}>
        
        {item.label}
      </button>);

  }

  if (isExternal) {
    return (
      <a href={item.href} className={cls} target={item.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
        {item.label}
        {item.href.startsWith('http') && <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />}
      </a>);

  }

  return (
    <Link to={item.href} className={cls}>
      {item.label}
    </Link>);

}

export default function Footer() {
  return (
    <footer id="contact" className="relative overflow-hidden" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>

      {/* Subtle bg watermark */}
      <div className="absolute bottom-0 left-0 right-0 text-center pointer-events-none select-none overflow-hidden">
        <span className="text-[10vw] font-black text-foreground/[0.018] leading-none tracking-tighter font-mono">
          XFUNDED TRADER
        </span>
      </div>

      {/* Main footer content */}
      <div className="relative z-10 max-w-[1400px] mx-auto px-8 pt-24 pb-0">

        {/* Top grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-12 mb-16">

          {/* Brand column — 2 cols wide */}
          <div className="sm:col-span-2 lg:col-span-2">
            {/* Logo — large */}
            <div className="mb-6">
              <XFLogo size="xl" animate />
            </div>

            <p className="text-base text-muted-foreground leading-relaxed mb-6 max-w-xs">
              Dubai-based institutional proprietary trading firm. We fund elite traders with significant capital and share up to 80% of profits.
            </p>

            {/* Company registration */}
            <div className="mb-5 p-3 rounded-xl text-xs font-mono space-y-1"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="text-primary/80 font-semibold mb-1 uppercase tracking-widest text-[10px]">Company Info</div>
              <div className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0 text-primary/60" />
                <span>Dubai International Financial Centre, UAE</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-3 h-3 flex-shrink-0 text-primary/60" />
                <a href="mailto:support@xfundedtrader.com" className="hover:text-primary transition-colors">
                  support@xfundedtrader.com
                </a>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-3 h-3 flex-shrink-0 text-primary/60" />
                <span>Available via Live Chat & Email</span>
              </div>
              <div className="text-muted-foreground/50 text-[10px] pt-1">
                Reg. No: XFT-2026-DIFC · Established 2026
              </div>
            </div>

            {/* Social icons */}
            <div className="flex items-center gap-3 flex-wrap">
              {SOCIALS.map((s) => {
                const Icon = s.icon;
                return (
                  <a key={s.label} href={s.href} title={s.label} target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
                  style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                    <Icon className="w-3.5 h-3.5" />
                  </a>);

              })}
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-foreground mb-4"
            style={{ color: 'rgba(255,92,0,0.9)' }}>Product</h4>
            <ul className="space-y-3">
              {PRODUCT_LINKS.map((item) =>
              <li key={item.label}><FooterLink item={item} /></li>
              )}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ color: 'rgba(255,92,0,0.9)' }}>Company</h4>
            <ul className="space-y-3">
              {COMPANY_LINKS.map((item) =>
              <li key={item.label}><FooterLink item={item} /></li>
              )}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ color: 'rgba(255,92,0,0.9)' }}>Legal</h4>
            <ul className="space-y-3">
              {LEGAL_LINKS.map((item) =>
              <li key={item.label}><FooterLink item={item} /></li>
              )}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ color: 'rgba(255,92,0,0.9)' }}>Support</h4>
            <ul className="space-y-3">
              {SUPPORT_LINKS.map((item) =>
              <li key={item.label}><FooterLink item={item} /></li>
              )}
            </ul>
            {/* Response time badge */}
            


            
          </div>
        </div>

        {/* Risk Disclaimer — full text (centralized in RiskDisclaimer component) */}
        <RiskDisclaimer variant="full" />
      </div>

      {/* Bottom copyright bar */}
      <div className="relative z-10 mt-10" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.25)' }}>
        <div className="max-w-[1400px] mx-auto px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground/70 text-center sm:text-left">
            © {new Date().getFullYear()} XFundedTrader.com — Prove Your Edge. Get Funded.
          </p>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            {[
            { label: 'Terms', href: '/terms' },
            { label: 'Privacy', href: '/privacy' },
            { label: 'Risk Disclosure', href: '/risk-disclosure' }].
            map((link) =>
            <Link key={link.label} to={link.href}
            className="text-xs text-muted-foreground/60 hover:text-primary transition-colors whitespace-nowrap">
                {link.label}
              </Link>
            )}
          </div>
        </div>
      </div>
    </footer>);

}