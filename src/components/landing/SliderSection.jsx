import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, TrendingUp, Zap, Monitor, DollarSign, Award, BarChart3 } from 'lucide-react';

function DashboardSlide() {
  return (
    <div className="glass rounded-2xl overflow-hidden relative">
      <div className="absolute top-0 right-0 w-48 h-48 bg-primary/8 rounded-full blur-3xl pointer-events-none" />
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/6">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
        </div>
        <span className="flex-1 text-center text-[10px] font-mono text-muted-foreground">Robert Wealth Dashboard</span>
      </div>
      <div className="p-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Balance', value: '$100,000', Icon: DollarSign, color: 'text-primary' },
            { label: 'Today P&L', value: '+$4,280', Icon: TrendingUp, color: 'text-emerald-400' },
            { label: 'Win Rate', value: '74.6%', Icon: Award, color: 'text-accent' },
          ].map(({ label, value, Icon, color }) => (
            <div key={label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-mono text-muted-foreground uppercase">{label}</span>
                <Icon className={`w-3 h-3 ${color}`} />
              </div>
              <div className={`text-sm font-black ${color}`}>{value}</div>
            </div>
          ))}
        </div>
        {/* Chart */}
        <div className="rounded-xl p-3 mb-4" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-foreground">Equity Curve</span>
            <span className="text-[10px] font-mono text-emerald-400">+4.28%</span>
          </div>
          <svg viewBox="0 0 300 60" className="w-full h-12">
            <defs>
              <linearGradient id="dashGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF5C00" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#FF5C00" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polyline fill="none" stroke="#FF5C00" strokeWidth="1.5"
              points="0,50 25,46 50,44 75,38 100,40 125,30 150,28 175,20 200,24 225,16 250,12 275,10 300,6" />
            <polygon fill="url(#dashGrad2)"
              points="0,50 25,46 50,44 75,38 100,40 125,30 150,28 175,20 200,24 225,16 250,12 275,10 300,6 300,60 0,60" />
          </svg>
        </div>
        {/* Progress */}
        <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-foreground">Challenge Progress</span>
            <span className="text-[10px] font-mono text-primary">Phase 1</span>
          </div>
          {[
            { label: 'Profit Target', pct: 43, color: '#FF5C00' },
            { label: 'Drawdown Used', pct: 24, color: '#10b981' },
          ].map((p) => (
            <div key={p.label} className="mb-2 last:mb-0">
              <div className="flex justify-between text-[9px] font-mono mb-1">
                <span className="text-muted-foreground">{p.label}</span>
                <span style={{ color: p.color }}>{p.pct}%</span>
              </div>
              <div className="h-1 rounded-full bg-white/5">
                <div className="h-full rounded-full transition-all" style={{ width: `${p.pct}%`, background: p.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PayoutSlide() {
  return (
    <div className="glass rounded-2xl overflow-hidden relative">
      <div className="absolute top-0 right-0 w-48 h-48 bg-accent/8 rounded-full blur-3xl pointer-events-none" />
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/6">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
        </div>
        <span className="flex-1 text-center text-[10px] font-mono text-muted-foreground">Payout Dashboard</span>
      </div>
      <div className="p-5 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Available', value: '$4,280', color: 'text-emerald-400', bg: 'rgba(16,185,129,0.07)' },
            { label: 'Total Paid', value: '$12,400', color: 'text-primary', bg: 'rgba(255,92,0,0.07)' },
          ].map((item) => (
            <div key={item.label} className="rounded-xl p-4 text-center" style={{ background: item.bg, border: `1px solid ${item.bg.replace('0.07', '0.2')}` }}>
              <div className="text-[9px] font-mono text-muted-foreground mb-1">{item.label}</div>
              <div className={`text-xl font-black ${item.color}`}>{item.value}</div>
            </div>
          ))}
        </div>
        {[
          { date: 'May 8', amount: '$4,280', status: 'Processing', statusColor: 'text-yellow-400' },
          { date: 'Apr 30', amount: '$3,920', status: 'Paid', statusColor: 'text-emerald-400' },
          { date: 'Apr 15', amount: '$4,200', status: 'Paid', statusColor: 'text-emerald-400' },
        ].map((p) => (
          <div key={p.date} className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span className="text-xs font-mono text-muted-foreground">{p.date}</span>
            <span className="text-xs font-semibold text-foreground">{p.amount}</span>
            <span className={`text-[10px] font-mono ${p.statusColor}`}>{p.status}</span>
          </div>
        ))}
        <button className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(90deg, #FF5C00, #FF7A2F)', boxShadow: '0 4px 16px rgba(255,92,0,0.3)' }}>
          <DollarSign className="w-4 h-4" /> Request Payout
        </button>
      </div>
    </div>
  );
}

function PlatformSlide({ image }) {
  return (
    <div className="glass rounded-2xl overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
      <img src={image} alt="Platform" className="w-full rounded-xl opacity-80" />
      <div className="absolute inset-0 flex flex-col justify-end p-6">
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <Monitor className="w-5 h-5 text-primary" />
            <span className="text-sm font-bold text-foreground">Multi-Platform Access</span>
          </div>
          <div className="flex gap-2">
            {['MT5', 'TradeLocker', 'Web Terminal'].map((p) => (
              <span key={p} className="px-2.5 py-1 rounded-full text-[10px] font-mono" style={{ background: 'rgba(255,92,0,0.12)', color: '#FF5C00', border: '1px solid rgba(255,92,0,0.2)' }}>{p}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const slides = [
  {
    id: 1,
    tag: 'Funded Trader Experience',
    title: 'Your Professional Trading Command Center',
    subtitle: 'Access institutional-grade capital and real-time analytics to maximize your trading potential.',
    icon: TrendingUp,
    features: ['Up to $200K Funded Capital', 'Advanced Analytics Dashboard', '80/20 Profit Split', 'Real-Time Challenge Tracking'],
    preview: 'dashboard',
  },
  {
    id: 2,
    tag: 'Instant Payouts',
    title: 'Get Paid. Every Day. No Delays.',
    subtitle: 'Request daily payouts with our lightning-fast withdrawal system. Processing within hours.',
    icon: Zap,
    features: ['Daily Payout Requests', 'Instant Processing', 'Zero Hidden Fees', 'Full Payout History'],
    preview: 'payout',
  },
  {
    id: 3,
    tag: 'Multi-Platform',
    title: 'Trade Anywhere. Any Device.',
    subtitle: 'Access MT5, TradeLocker, and our proprietary web terminal seamlessly.',
    icon: Monitor,
    features: ['MetaTrader 5 (MT5)', 'TradeLocker Platform', 'Web Trading Terminal', 'Mobile Apps Coming Soon'],
    preview: 'platform',
  },
];

export default function SliderSection({ images }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrent((prev) => (prev + 1) % slides.length), 7000);
    return () => clearInterval(timer);
  }, []);

  const slide = slides[current];
  const Icon = slide.icon;

  const renderPreview = () => {
    if (slide.preview === 'dashboard') return <DashboardSlide />;
    if (slide.preview === 'payout') return <PayoutSlide />;
    return <PlatformSlide image={images[2]} />;
  };

  return (
    <section id="how-it-works" className="relative py-32 overflow-hidden">
      <div className="absolute inset-0">
        <AnimatePresence mode="wait">
          <motion.img key={current} src={images[current]} alt=""
            initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 0.08, scale: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 1 }} className="w-full h-full object-cover" />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/60" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6">
        <div className="flex items-center gap-3 mb-12">
          {slides.map((s, i) => (
            <button key={s.id} onClick={() => setCurrent(i)}
              className={`h-1 rounded-full transition-all duration-500 ${i === current ? 'w-12 bg-primary' : 'w-6 bg-border'}`} />
          ))}
          <span className="ml-4 text-xs font-mono text-muted-foreground">
            {String(current + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
          </span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={current}
            initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="grid lg:grid-cols-2 gap-16 items-center"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-light mb-6">
                <Icon className="w-4 h-4 text-primary" />
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{slide.tag}</span>
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-5xl font-black tracking-tight mb-6">{slide.title}</h2>
              <p className="text-lg text-muted-foreground mb-10 max-w-lg leading-relaxed">{slide.subtitle}</p>
              <div className="grid grid-cols-2 gap-3">
                {slide.features.map((feature, i) => (
                  <motion.div key={feature} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="flex items-center gap-2.5 py-2.5 px-3 rounded-xl"
                    style={{ background: 'rgba(255,92,0,0.05)', border: '1px solid rgba(255,92,0,0.12)' }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="absolute -inset-4 rounded-3xl blur-2xl opacity-30"
                style={{ background: 'radial-gradient(ellipse, rgba(255,92,0,0.15), transparent)' }} />
              <div className="relative">{renderPreview()}</div>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-3 mt-12">
          <button onClick={() => setCurrent((current - 1 + slides.length) % slides.length)}
            className="w-12 h-12 rounded-full border border-border flex items-center justify-center hover:border-primary/50 transition-colors">
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <button onClick={() => setCurrent((current + 1) % slides.length)}
            className="w-12 h-12 rounded-full border border-border flex items-center justify-center hover:border-primary/50 transition-colors">
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </section>
  );
}