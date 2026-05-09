import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronRight } from 'lucide-react';

const navLinks = [
  { label: 'Start Challenge', href: '#challenge' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Affiliate Program', href: '#affiliate' },
  { label: 'FAQ', href: '#faq' },
  { label: 'About Us', href: '#about' },
  { label: 'Contact Us', href: '#contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (href) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? 'glass py-3' : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center glow-orange-sm">
              <span className="text-white font-bold text-sm font-mono">A</span>
            </div>
            <span className="text-foreground font-bold text-xl tracking-tight">
              ALPHA<span className="text-primary">FUND</span>
            </span>
          </a>

          {/* Desktop Links */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => scrollTo(link.href)}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-300 relative group"
              >
                {link.label}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-primary group-hover:w-3/4 transition-all duration-300" />
              </button>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <button className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              Login
            </button>
            <button className="px-4 py-2 text-sm text-foreground border border-border rounded-full hover:border-primary/50 transition-all">
              Register
            </button>
            <button
              onClick={() => scrollTo('#challenge')}
              className="relative px-5 py-2 text-sm font-semibold text-white bg-primary rounded-full hover:bg-primary/90 transition-all pulse-ring"
            >
              Start Challenge
              <ChevronRight className="inline w-4 h-4 ml-1" />
            </button>
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden text-foreground p-2"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 glass pt-24 px-6 lg:hidden overflow-y-auto"
          >
            <div className="space-y-1">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => scrollTo(link.href)}
                  className="block w-full text-left px-4 py-3 text-lg text-foreground hover:text-primary transition-colors border-b border-border/30"
                >
                  {link.label}
                </button>
              ))}
            </div>
            <div className="mt-8 space-y-3">
              <button className="w-full py-3 text-sm text-foreground border border-border rounded-full hover:border-primary/50">
                Login
              </button>
              <button className="w-full py-3 text-sm text-foreground border border-border rounded-full hover:border-primary/50">
                Register
              </button>
              <button
                onClick={() => scrollTo('#challenge')}
                className="w-full py-3 text-sm font-semibold text-white bg-primary rounded-full"
              >
                Start Challenge
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}