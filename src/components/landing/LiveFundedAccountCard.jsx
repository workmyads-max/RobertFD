import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// Animated counter component
function AnimatedNumber({ value, prefix = '', suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(value * easeOut);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, duration]);
  
  const formatted = value >= 1000000 
    ? (count / 1000000).toFixed(2) + 'M'
    : value >= 1000 
      ? Math.floor(count).toLocaleString()
      : count.toFixed(2);
  
  return <span>{prefix}{formatted}{suffix}</span>;
}

// Main animated chart card
export default function LiveFundedAccountCard() {
  const [mounted, setMounted] = useState(false);

  // Realistic equity curve data - steady upward trend with natural pullbacks
  // Y values: start low, end high, with realistic dips along the way
  const chartData = [
    { x: 0, y: 95 },   // Start
    { x: 35, y: 88 },  // Small dip
    { x: 70, y: 82 },  // Another dip
    { x: 105, y: 75 }, // Recovery starts
    { x: 140, y: 68 }, // Continuing up
    { x: 175, y: 62 }, // Steady growth
    { x: 210, y: 52 }, // Strong climb
    { x: 245, y: 42 }, // Almost there
    { x: 280, y: 28 }, // Peak (lower y = higher on chart)
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  const polylinePoints = chartData.map(p => `${p.x},${p.y}`).join(' ');
  const fillPoints = `0,120 ${polylinePoints} 280,120`;

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
    >
      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        whileHover={{ y: -4 }}
        className="rounded-2xl"
        style={{
          background: '#16181d',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        }}
      >
        {/* Header - 28px padding */}
        <div className="px-7 pt-7 pb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[13px] text-muted-foreground mb-1">Funded account</div>
              <div className="text-[16px] font-medium text-foreground">Performance</div>
            </div>
            <div className="text-right">
              <div className="text-[26px] font-semibold text-foreground leading-none">
                $<AnimatedNumber value={184250} duration={2000} />
              </div>
              <div className="text-[15px] font-medium text-emerald-400 mt-1">+84.25%</div>
            </div>
          </div>
        </div>

        {/* Chart - 160px height, 24px gap from header */}
        <div className="px-7" style={{ height: '160px' }}>
          <svg viewBox="0 0 280 120" className="w-full h-full">
            {/* Grid lines - very faint */}
            {[30, 60, 90].map(y => (
              <line key={y} x1="0" y1={y} x2="280" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            ))}
            
            {/* Gradient fill */}
            <defs>
              <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF5C00" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#FF5C00" stopOpacity="0" />
              </linearGradient>
            </defs>
            
            {/* Fill area */}
            {mounted && (
              <motion.polygon
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 2, delay: 0.5 }}
                points={fillPoints}
                fill="url(#chartFill)"
              />
            )}
            
            {/* Animated line - smooth curve */}
            {mounted && (
              <motion.polyline
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 2, delay: 0.5, ease: 'easeOut' }}
                fill="none"
                stroke="#FF5C00"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={polylinePoints}
              />
            )}
            
            {/* Data points */}
            {mounted && chartData.map((p, i) => (
              <motion.circle
                key={i}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: i === chartData.length - 1 ? 1 : 0 }}
                transition={{ duration: 0.4, delay: 0.5 + i * 0.12 }}
                cx={p.x}
                cy={p.y}
                r={i === chartData.length - 1 ? 5 : 3}
                fill="#FF5C00"
              />
            ))}
            
            {/* Pulsing endpoint - subtle */}
            {mounted && (
              <motion.circle
                cx={chartData[chartData.length - 1].x}
                cy={chartData[chartData.length - 1].y}
                r="14"
                fill="rgba(255,92,0,0.1)"
                stroke="#FF5C00"
                strokeWidth="1"
                animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0.2, 0.5] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
          </svg>
        </div>

        {/* Bottom Stats - 24px gap from chart */}
        <div className="px-7 mt-6">
          <div className="flex items-center justify-between">
            {/* Profit */}
            <div className="flex-1">
              <div className="text-[13px] text-muted-foreground mb-1">Profit</div>
              <div className="text-[18px] font-semibold text-emerald-400 leading-none">+84%</div>
            </div>
            {/* Divider */}
            <div className="w-px h-10" style={{ background: 'rgba(255,255,255,0.06)' }} />
            {/* Win rate */}
            <div className="flex-1 text-center">
              <div className="text-[13px] text-muted-foreground mb-1">Win rate</div>
              <div className="text-[18px] font-semibold text-foreground leading-none">73%</div>
            </div>
            {/* Divider */}
            <div className="w-px h-10" style={{ background: 'rgba(255,255,255,0.06)' }} />
            {/* Trades */}
            <div className="flex-1 text-right">
              <div className="text-[13px] text-muted-foreground mb-1">Trades</div>
              <div className="text-[18px] font-semibold text-foreground leading-none">247</div>
            </div>
          </div>
        </div>

        {/* Status Bar - 20px gap from stats, top border */}
        <div className="px-7 mt-5 pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.7, 0.35, 0.7] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                className="w-2 h-2 rounded-full bg-emerald-400"
              />
              <span className="text-[13px] text-muted-foreground">Active</span>
            </div>
            <span className="text-[13px] text-muted-foreground">Phase 2 → Funded</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}