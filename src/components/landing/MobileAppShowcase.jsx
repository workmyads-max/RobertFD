import React from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Apple, Play, Bell } from 'lucide-react';

function PhoneMockup({ delay = 0, tilt = 0, label, sublabel, isAndroid }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center gap-4"
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 4 + delay, repeat: Infinity, ease: 'easeInOut' }}
        className="relative"
      >
        {/* Phone frame */}
        <div
          className="relative w-44 md:w-52 rounded-[2.5rem] overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, #1a1b1f, #0e0e10)',
            border: '2px solid rgba(255,92,0,0.2)',
            boxShadow: '0 0 40px rgba(255,92,0,0.12), 0 20px 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)',
            aspectRatio: '9/19.5',
          }}
        >
          {/* Notch */}
          {!isAndroid && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-5 rounded-full bg-black z-20" />
          )}
          {isAndroid && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-black z-20" />
          )}

          {/* Screen content */}
          <div className="absolute inset-0 flex flex-col" style={{ background: '#050505' }}>
            {/* Status bar */}
            <div className="flex justify-between items-center px-5 pt-8 pb-2">
              <span className="text-[9px] font-mono text-muted-foreground">9:41</span>
              <span className="text-[9px] font-mono text-muted-foreground">AlphaFund</span>
            </div>

            {/* Balance card */}
            <div className="mx-3 mb-2 p-3 rounded-xl" style={{ background: 'rgba(255,92,0,0.08)', border: '1px solid rgba(255,92,0,0.15)' }}>
              <div className="text-[8px] text-muted-foreground font-mono mb-1">ACCOUNT BALANCE</div>
              <div className="text-base font-black text-foreground">$100,000</div>
              <div className="text-[9px] text-emerald-400 font-mono mt-0.5">+$4,280 today</div>
            </div>

            {/* Mini chart */}
            <div className="mx-3 mb-2">
              <svg viewBox="0 0 160 50" className="w-full h-10">
                <defs>
                  <linearGradient id="mobileChartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF5C00" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#FF5C00" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polyline fill="none" stroke="#FF5C00" strokeWidth="1.5"
                  points="0,40 15,36 28,38 42,25 55,28 70,16 85,20 100,12 115,15 130,8 145,10 160,6" />
                <polygon fill="url(#mobileChartGrad)"
                  points="0,40 15,36 28,38 42,25 55,28 70,16 85,20 100,12 115,15 130,8 145,10 160,6 160,50 0,50" />
              </svg>
            </div>

            {/* Positions */}
            <div className="mx-3 space-y-1.5">
              {[
                { pair: 'BTC/USD', pnl: '+$1,240', color: 'text-emerald-400' },
                { pair: 'EUR/USD', pnl: '+$380', color: 'text-emerald-400' },
                { pair: 'XAU/USD', pnl: '-$120', color: 'text-red-400' },
              ].map((pos) => (
                <div key={pos.pair} className="flex justify-between items-center py-1.5 px-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <span className="text-[9px] font-mono text-foreground">{pos.pair}</span>
                  <span className={`text-[9px] font-mono font-semibold ${pos.color}`}>{pos.pnl}</span>
                </div>
              ))}
            </div>

            {/* Bottom nav */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-around px-5">
              {['◯', '△', '□', '☆'].map((icon, i) => (
                <span key={i} className={`text-[10px] ${i === 0 ? 'text-primary' : 'text-muted-foreground'}`}>{icon}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Glow underneath */}
        <div
          className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-32 h-8 rounded-full blur-2xl"
          style={{ background: 'rgba(255,92,0,0.3)' }}
        />
      </motion.div>

      {/* Label */}
      <div className="text-center">
        <div className="text-sm font-bold text-foreground">{label}</div>
        <div className="text-xs text-muted-foreground font-mono mt-0.5">{sublabel}</div>
      </div>
    </motion.div>
  );
}

export default function MobileAppShowcase() {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full blur-[120px]"
          style={{ background: 'radial-gradient(ellipse, rgba(255,92,0,0.06) 0%, transparent 70%)' }} />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-light mb-6">
              <Smartphone className="w-4 h-4 text-primary" />
              <span className="text-xs font-mono text-primary uppercase tracking-widest">Coming Soon</span>
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6">
              Trade in Your
              <br />
              <span className="gradient-text">Pocket.</span>
            </h2>

            <p className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-lg">
              The XTrading Terminal mobile app brings institutional-grade trading to your fingertips.
              Real-time charts, instant payouts, and full account management — anywhere, anytime.
            </p>

            <div className="space-y-4 mb-10">
              {[
                { icon: Bell, title: 'Instant Trade Notifications', sub: 'Real-time alerts for fills, drawdowns, and payouts' },
                { icon: Play, title: 'One-Tap Trade Execution', sub: 'Market and limit orders with swipe confirmation' },
                { icon: Smartphone, title: 'Full Dashboard Access', sub: 'Challenge progress, P&L, and analytics on the go' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">{item.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{item.sub}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Download buttons */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-3 px-5 py-3 rounded-xl glass border border-border/40 opacity-60 cursor-not-allowed">
                <Apple className="w-5 h-5 text-foreground" />
                <div>
                  <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Coming Soon</div>
                  <div className="text-sm font-semibold text-foreground">App Store</div>
                </div>
              </div>
              <div className="flex items-center gap-3 px-5 py-3 rounded-xl glass border border-border/40 opacity-60 cursor-not-allowed">
                <Play className="w-5 h-5 text-foreground" />
                <div>
                  <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Coming Soon</div>
                  <div className="text-sm font-semibold text-foreground">Google Play</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right — phone mockups */}
          <div className="flex items-center justify-center gap-8 md:gap-12">
            <PhoneMockup delay={0.2} tilt={-5} label="iOS App" sublabel="iPhone — Coming Q3 2026" isAndroid={false} />
            <div className="mt-12">
              <PhoneMockup delay={0.4} tilt={5} label="Android App" sublabel="Google Play — Coming Q3 2026" isAndroid={true} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}