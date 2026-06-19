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
  { icon: CheckCircle2, active: false }];


  return (
    <div className="w-12 border-r border-white/[0.04] py-4 flex flex-col items-center gap-3">
      {items.map((Item, i) =>
      <div
        key={i}
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{
          background: Item.active ? 'rgba(255,92,0,0.1)' : 'transparent',
          border: Item.active ? '1px solid rgba(255,92,0,0.25)' : '1px solid transparent'
        }}>
        
          <Item.icon className="w-4 h-4" style={{ color: Item.active ? '#FF5C00' : 'rgba(255,255,255,0.3)' }} />
        </div>
      )}
    </div>);

}

function NotificationCard({ title, amount, position, delay }) {
  return null;




















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
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <motion.path
        d={areaD}
        fill="url(#chartGradient)"
        initial={{ opacity: 0 }}
        animate={{ opacity: animated ? 1 : 0 }}
        transition={{ duration: 1.5, delay: 0.3 }} />
      
      <motion.path
        d={pathD}
        fill="none"
        stroke="url(#lineGradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#glow)"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: animated ? 1 : 0, opacity: animated ? 1 : 0 }}
        transition={{ duration: 2.5, delay: 0.2, ease: 'easeOut' }} />
      
      {/* Animated dot at the end */}
      <motion.circle
        cx={width}
        cy={height - 100 / 100 * height}
        r="3"
        fill="#34d399"
        filter="url(#glow)"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: animated ? 1 : 0, scale: animated ? 1 : 0 }}
        transition={{ delay: 2.2, duration: 0.3 }} />
      
    </svg>);

}

export default function DashboardPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="relative w-full max-w-[520px] mx-auto">
      
      {/* Browser Frame */}
      























































































































      

      {/* Floating Notification Cards */}
      <NotificationCard
        title="Payout approved"
        amount="$4,200"
        position="right"
        delay={0.6} />
      
      <NotificationCard
        title="Phase 2 passed"
        position="left"
        delay={0.8} />
      

      {/* Gentle Float Animation */}
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: -1 }} />
      
    </motion.div>);

}