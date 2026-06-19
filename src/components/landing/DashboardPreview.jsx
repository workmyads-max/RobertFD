import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, CheckCircle2 } from 'lucide-react';

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

function MiniSidebar() {
  const items = [
    { icon: Wallet, active: true },
    { icon: TrendingUp, active: false },
    { icon: CheckCircle2, active: false },
  ];

  return (
    <div className="w-12 border-r border-white/[0.04] py-4 flex flex-col items-center gap-3">
      {items.map((Item, i) => (
        <div
          key={i}
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{
            background: Item.active ? 'rgba(255,92,0,0.1)' : 'transparent',
            border: Item.active ? '1px solid rgba(255,92,0,0.25)' : '1px solid transparent',
          }}
        >
          <Item.icon className="w-4 h-4" style={{ color: Item.active ? '#FF5C00' : 'rgba(255,255,255,0.3)' }} />
        </div>
      ))}
    </div>
  );
}

function NotificationCard({ title, amount, position, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: position === 'right' ? 20 : -20, y: position === 'right' ? -10 : 10 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="absolute rounded-xl p-3 shadow-lg"
      style={{
        background: '#16181d',
        border: '1px solid rgba(255,255,255,0.08)',
        top: position === 'right' ? '20%' : 'auto',
        bottom: position === 'left' ? '15%' : 'auto',
        right: position === 'right' ? '-12px' : 'auto',
        left: position === 'left' ? '-12px' : 'auto',
        zIndex: 0,
      }}
    >
      <div className="text-[9px] text-muted-foreground mb-0.5">{title}</div>
      {amount && <div className="text-xs font-semibold text-emerald-400">{amount}</div>}
      {!amount && <div className="text-xs font-semibold text-foreground">✓ Verified</div>}
    </motion.div>
  );
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
    const y = height - (p / 100) * height;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const areaD = `${pathD} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
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
        stroke="#10b981"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: animated ? 1 : 0, opacity: animated ? 1 : 0 }}
        transition={{ duration: 2, delay: 0.2, ease: 'easeOut' }}
      />
    </svg>
  );
}

export default function DashboardPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="relative w-full max-w-[520px] mx-auto"
    >
      {/* Browser Frame */}
      <div
        className="rounded-[14px] overflow-hidden shadow-2xl"
        style={{
          background: '#16181d',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        }}
      >
        {/* Browser Top Bar */}
        <div
          className="flex items-center px-4 py-2.5"
          style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
        >
          {/* Window Dots */}
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#ff5f57' }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#febc2e' }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#28c840' }} />
          </div>
          {/* URL Pill */}
          <div
            className="flex-1 mx-4 px-3 py-1 rounded-md text-[10px] font-mono text-center"
            style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)' }}
          >
            app.xfundedtrader.com
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex">
          <MiniSidebar />

          {/* Main Content */}
          <div className="flex-1 p-4 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs text-muted-foreground">Good evening</div>
                <div className="text-sm font-semibold text-foreground">Yify</div>
              </div>
              <div
                className="px-2.5 py-1 rounded-md text-[10px] font-medium"
                style={{ background: 'rgba(255,92,0,0.1)', border: '1px solid rgba(255,92,0,0.2)', color: '#FF5C00' }}
              >
                $200K Funded
              </div>
            </div>

            {/* Account Card */}
            <div
              className="rounded-xl p-4 mb-4"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full" style={{ background: '#10b981' }} />
                <span className="text-[10px] text-muted-foreground">Funded account · Phase 2</span>
              </div>
              <div className="text-2xl font-semibold text-foreground mb-1">
                $<AnimatedNumber value={184250} duration={2.5} />
              </div>
              <div className="text-xs font-semibold text-emerald-400 mb-3">
                +<AnimatedNumber value={84.25} duration={2} suffix="%" />
              </div>
              <EquityChart />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: 'Profit', value: '+84%', color: 'text-emerald-400' },
                { label: 'Win rate', value: '73%' },
                { label: 'Trades', value: '247' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-lg p-2.5 text-center"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <div className="text-[9px] text-muted-foreground mb-1">{stat.label}</div>
                  <div className={`text-xs font-semibold ${stat.color || 'text-foreground'}`}>{stat.value}</div>
                </div>
              ))}
            </div>

            {/* Account Rows */}
            <div className="space-y-2">
              {[
                { id: 'XFT-MQK9', size: 200000, status: 'Active' },
                { id: 'XFT-PL72', size: 100000, status: 'Phase 2' },
              ].map((acc) => (
                <div
                  key={acc.id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center"
                      style={{ background: 'rgba(255,92,0,0.1)' }}>
                      <Wallet className="w-3 h-3" style={{ color: '#FF5C00' }} />
                    </div>
                    <div>
                      <div className="text-[10px] font-mono font-medium text-foreground">{acc.id}</div>
                      <div className="text-[9px] text-muted-foreground">${acc.size.toLocaleString()}</div>
                    </div>
                  </div>
                  <div
                    className="text-[9px] font-medium px-2 py-0.5 rounded"
                    style={{
                      background: acc.status === 'Active' ? 'rgba(16,185,129,0.1)' : 'rgba(255,92,0,0.1)',
                      color: acc.status === 'Active' ? '#10b981' : '#FF5C00',
                      border: `1px solid ${acc.status === 'Active' ? 'rgba(16,185,129,0.2)' : 'rgba(255,92,0,0.2)'}`,
                    }}
                  >
                    {acc.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Notification Cards */}
      <NotificationCard
        title="Payout approved"
        amount="$4,200"
        position="right"
        delay={0.6}
      />
      <NotificationCard
        title="Phase 2 passed"
        position="left"
        delay={0.8}
      />

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