import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, CheckCircle2, BarChart3, DollarSign, Activity } from 'lucide-react';

function AnimatedNumber({ value, duration = 2, suffix = '' }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const start = 0;
    const end = value;
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + (end - start) * eased);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span>{Math.floor(display).toLocaleString()}{suffix}</span>;
}

function EquityChart() {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const points = [0, 8, 15, 22, 28, 35, 42, 48, 55, 62, 68, 75, 82, 88, 94, 100];
  const width = 280;
  const height = 80;
  const stepX = width / (points.length - 1);

  const pathD = points.map((p, i) => {
    const x = i * stepX;
    const y = height - p / 100 * height;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const areaD = `${pathD} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#10b981" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>
      <motion.path
        d={areaD}
        fill="url(#chartGradient)"
        initial={{ opacity: 0 }}
        animate={{ opacity: animated ? 1 : 0 }}
        transition={{ duration: 1.5, delay: 0.3 }}
      />
      <motion.path
        d={pathD}
        fill="none"
        stroke="url(#lineGradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: animated ? 1 : 0, opacity: animated ? 1 : 0 }}
        transition={{ duration: 2.5, delay: 0.2, ease: 'easeOut' }}
      />
      <motion.circle
        cx={width}
        cy={height - 100 / 100 * height}
        r="3"
        fill="#34d399"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: animated ? 1 : 0, scale: animated ? 1 : 0 }}
        transition={{ delay: 2.2, duration: 0.3 }}
      />
    </svg>
  );
}

export default function DashboardPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="relative w-full max-w-[520px] mx-auto"
    >
      {/* Browser Frame */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: '#16181d',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
        }}
      >
        {/* Browser Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#ef4444' }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#f59e0b' }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#10b981' }} />
          </div>
          <div className="flex-1 text-center">
            <div className="text-[10px] text-muted-foreground">XFunded Trader Dashboard</div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-xs text-muted-foreground">Total Balance</div>
              <div className="text-2xl font-semibold text-foreground">
                $<AnimatedNumber value={124500} duration={2.5} />
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Total P&L</div>
              <div className="text-lg font-semibold" style={{ color: '#10b981' }}>
                +$<AnimatedNumber value={12450} duration={2.5} />
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { icon: Activity, label: 'Win Rate', value: '68%' },
              { icon: BarChart3, label: 'Profit Factor', value: '2.4' },
              { icon: DollarSign, label: 'Avg Win', value: '$1,240' },
            ].map((stat, i) => (
              <div key={i} className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <stat.icon className="w-4 h-4 mb-2" style={{ color: '#FF5C00' }} />
                <div className="text-xs text-muted-foreground">{stat.label}</div>
                <div className="text-sm font-semibold text-foreground">{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Equity Chart */}
          <div className="rounded-lg p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-muted-foreground">Equity Growth</div>
              <div className="flex items-center gap-1 text-xs" style={{ color: '#10b981' }}>
                <TrendingUp className="w-3 h-3" />
                +12.4%
              </div>
            </div>
            <EquityChart />
          </div>

          {/* Recent Activity */}
          <div className="mt-4 space-y-2">
            {[
              { label: 'EURUSD Long', pnl: '+$840', status: 'Closed' },
              { label: 'XAUUSD Short', pnl: '+$1,250', status: 'Closed' },
              { label: 'GBPUSD Long', pnl: '-$320', status: 'Closed' },
            ].map((trade, i) => (
              <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4" style={{ color: trade.pnl.startsWith('+') ? '#10b981' : '#ef4444' }} />
                  <span className="text-xs text-foreground">{trade.label}</span>
                </div>
                <span className={`text-xs font-semibold ${trade.pnl.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                  {trade.pnl}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Notification Cards */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="absolute -right-8 top-12 rounded-lg px-3 py-2.5 shadow-xl"
        style={{ background: '#16181d', border: '1px solid rgba(16,185,129,0.3)' }}
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" style={{ color: '#10b981' }} />
          <div>
            <div className="text-[10px] text-muted-foreground">Payout approved</div>
            <div className="text-xs font-semibold text-foreground">$4,200</div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="absolute -left-8 bottom-20 rounded-lg px-3 py-2.5 shadow-xl"
        style={{ background: '#16181d', border: '1px solid rgba(255,92,0,0.3)' }}
      >
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4" style={{ color: '#FF5C00' }} />
          <div>
            <div className="text-[10px] text-muted-foreground">Phase 2 passed</div>
            <div className="text-xs font-semibold text-foreground">Funded account</div>
          </div>
        </div>
      </motion.div>

      {/* Gentle Float Animation */}
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: -1 }}
      />
    </motion.div>
  );
}