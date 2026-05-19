import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Target, BarChart3, Award, RefreshCw } from 'lucide-react';

function MiniSparkline({ up = true }) {
  const pts = up
    ? '0,30 15,28 28,22 40,25 52,16 65,18 78,10 90,12 100,6'
    : '0,8 15,10 28,16 40,12 52,22 65,20 78,28 90,25 100,30';
  const color = up ? '#10b981' : '#ef4444';
  const fill = up ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)';
  return (
    <svg viewBox="0 0 100 36" className="w-20 h-8">
      <defs>
        <linearGradient id={`sg${up}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon fill={`url(#sg${up})`} points={`${pts} 100,36 0,36`} />
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={pts} />
    </svg>
  );
}

function StatCard({ label, value, change, up, icon: Icon }) {
  return (
    <div className="rounded-xl p-4 flex flex-col gap-1" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{label}</span>
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
      <div className="text-lg font-black text-foreground">{value}</div>
      <div className={`text-xs font-mono flex items-center gap-1 ${up ? 'text-emerald-400' : 'text-red-400'}`}>
        {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {change}
      </div>
    </div>
  );
}

function ChallengeProgress({ label, current, target, color }) {
  const pct = Math.min((current / target) * 100, 100);
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs font-mono mb-1.5">
        <span className="text-muted-foreground">{label}</span>
        <span style={{ color }}>{current.toFixed(1)}% / {target}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
    </div>
  );
}

export default function DashboardPreview({ dashImage }) {
  const [activeView, setActiveView] = useState('overview');

  const views = [
    { id: 'overview', label: 'Overview' },
    { id: 'trades', label: 'Open Trades' },
    { id: 'payouts', label: 'Payouts' },
  ];

  return (
    <section className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 right-0 w-[500px] h-[500px] rounded-full blur-[140px] -translate-y-1/2"
          style={{ background: 'radial-gradient(ellipse, rgba(255,92,0,0.05) 0%, transparent 70%)' }} />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6">
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           className="text-center mb-12 md:mb-16"
         >
           <span className="text-xs font-mono text-primary uppercase tracking-widest">Dashboard Preview</span>
           <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mt-4 mb-6">
             Your Command Center
           </h2>
           <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
            Institutional-grade analytics at your fingertips. Monitor challenges, track P&L, and request payouts in real time.
          </p>
        </motion.div>

        {/* Dashboard mockup */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative max-w-5xl mx-auto"
        >
          {/* Outer glow */}
          <div className="absolute -inset-1 rounded-3xl blur-2xl"
            style={{ background: 'linear-gradient(135deg, rgba(255,92,0,0.1), rgba(204,255,0,0.04))' }} />

          <div className="relative rounded-2xl overflow-hidden" style={{
            background: 'linear-gradient(145deg, #0e0e10, #0a0a0c)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}>
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-5 py-3 border-b border-white/5">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="text-xs font-mono text-muted-foreground">app.xfundedtrader.com/dashboard</div>
              </div>
              <RefreshCw className="w-3.5 h-3.5 text-muted-foreground/50" />
            </div>

            <div className="flex min-h-0">
              {/* Sidebar */}
              <div className="hidden md:flex flex-col w-44 border-r border-white/5 p-4">
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/5">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center"
                   style={{ background: 'linear-gradient(135deg, #1a0e06, #2a1506)', border: '1px solid rgba(255,92,0,0.4)' }}>
                   <span className="text-primary font-black text-[8px]" style={{ fontFamily: 'Georgia, serif' }}>XF</span>
                  </div>
                  <span className="text-xs font-bold text-foreground">XFunded Trader</span>
                </div>
                {['Dashboard', 'Challenges', 'Open Trades', 'History', 'Payouts', 'Analytics', 'Settings'].map((item, i) => (
                  <div key={item} className={`text-xs py-2 px-2 rounded-lg mb-0.5 font-mono transition-colors ${
                    i === 0 ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'
                  }`}>
                    {item}
                  </div>
                ))}
              </div>

              {/* Main content */}
              <div className="flex-1 p-5 overflow-hidden">
                {/* Top row */}
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <div className="text-xs text-muted-foreground font-mono">Welcome back</div>
                    <div className="text-base font-bold text-foreground">ALPHA_9</div>
                  </div>
                  <div className="flex gap-2">
                    {views.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => setActiveView(v.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                          activeView === v.id ? 'bg-primary/20 text-primary border border-primary/25' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {activeView === 'overview' && (
                    <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      {/* Stats grid */}
                      <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-5">
                        <StatCard label="Account Balance" value="$100,000" change="+4.28%" up icon={DollarSign} />
                        <StatCard label="Total P&L" value="$4,280" change="+4.28%" up icon={TrendingUp} />
                        <StatCard label="Daily Drawdown" value="1.2%" change="3.8% left" up icon={BarChart3} />
                        <StatCard label="Win Rate" value="74.6%" change="+2.1%" up icon={Award} />
                      </div>

                      {/* Challenge progress */}
                      <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-bold text-foreground">Challenge Progress — Phase 1</span>
                          <span className="text-xs font-mono px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,92,0,0.12)', color: '#FF5C00' }}>In Progress</span>
                        </div>
                        <ChallengeProgress label="Profit Target" current={4.28} target={10} color="#FF5C00" />
                        <ChallengeProgress label="Daily Drawdown Used" current={1.2} target={5} color="#10b981" />
                        <ChallengeProgress label="Max Drawdown Used" current={2.1} target={10} color="#10b981" />
                      </div>

                      {/* Mini chart */}
                      <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold text-foreground">Equity Curve</span>
                          <span className="text-xs font-mono text-emerald-400">+$4,280</span>
                        </div>
                        <svg viewBox="0 0 400 80" className="w-full h-16">
                          <defs>
                            <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#FF5C00" stopOpacity="0.25" />
                              <stop offset="100%" stopColor="#FF5C00" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <polyline fill="none" stroke="#FF5C00" strokeWidth="2"
                            points="0,65 30,60 60,58 90,50 120,52 150,40 180,38 210,28 240,32 270,22 300,24 330,18 360,14 390,10 400,8" />
                          <polygon fill="url(#eqGrad)"
                            points="0,65 30,60 60,58 90,50 120,52 150,40 180,38 210,28 240,32 270,22 300,24 330,18 360,14 390,10 400,8 400,80 0,80" />
                        </svg>
                      </div>
                    </motion.div>
                  )}

                  {activeView === 'trades' && (
                    <motion.div key="trades" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="grid grid-cols-5 gap-2 px-4 py-2 text-[10px] font-mono text-muted-foreground uppercase border-b border-white/5">
                          <span>Pair</span><span>Type</span><span>Size</span><span>Entry</span><span>P&L</span>
                        </div>
                        {[
                          { pair: 'BTC/USD', type: 'BUY', size: '0.50', entry: '67,420', pnl: '+$1,210', up: true },
                          { pair: 'EUR/USD', type: 'SELL', size: '2.00', entry: '1.0831', pnl: '+$380', up: true },
                          { pair: 'XAU/USD', type: 'BUY', size: '1.00', entry: '2,338', pnl: '-$120', up: false },
                          { pair: 'NAS100', type: 'BUY', size: '0.30', entry: '18,204', pnl: '+$840', up: true },
                        ].map((t) => (
                          <div key={t.pair} className="grid grid-cols-5 gap-2 px-4 py-2.5 text-xs border-b border-white/4 last:border-0 hover:bg-white/2 transition-colors">
                            <span className="font-mono font-semibold text-foreground">{t.pair}</span>
                            <span className={`font-mono text-[10px] ${t.type === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}>{t.type}</span>
                            <span className="font-mono text-muted-foreground">{t.size}</span>
                            <span className="font-mono text-muted-foreground">{t.entry}</span>
                            <span className={`font-mono font-bold ${t.up ? 'text-emerald-400' : 'text-red-400'}`}>{t.pnl}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {activeView === 'payouts' && (
                    <motion.div key="payouts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="rounded-xl p-4" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
                          <div className="text-[10px] font-mono text-muted-foreground mb-1">Available to Withdraw</div>
                          <div className="text-xl font-black text-emerald-400">$4,280.00</div>
                        </div>
                        <div className="rounded-xl p-4" style={{ background: 'rgba(255,92,0,0.06)', border: '1px solid rgba(255,92,0,0.15)' }}>
                          <div className="text-[10px] font-mono text-muted-foreground mb-1">Total Paid Out</div>
                          <div className="text-xl font-black text-primary">$12,400.00</div>
                        </div>
                      </div>
                      <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="text-xs font-bold text-foreground mb-3">Payout History</div>
                        {[
                          { date: 'May 8, 2026', amount: '$4,280', status: 'Pending', color: 'text-yellow-400' },
                          { date: 'Apr 30, 2026', amount: '$3,920', status: 'Paid', color: 'text-emerald-400' },
                          { date: 'Apr 15, 2026', amount: '$4,200', status: 'Paid', color: 'text-emerald-400' },
                        ].map((p) => (
                          <div key={p.date} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                            <span className="text-xs font-mono text-muted-foreground">{p.date}</span>
                            <span className="text-xs font-semibold text-foreground">{p.amount}</span>
                            <span className={`text-[10px] font-mono ${p.color}`}>{p.status}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}