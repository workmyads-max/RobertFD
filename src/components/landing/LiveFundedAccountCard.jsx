import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Activity } from 'lucide-react';

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

// Live price ticker component
function LivePriceTicker() {
  const [prices, setPrices] = useState([
    { symbol: 'XAUUSD', value: 2034.50, change: 0.42 },
    { symbol: 'BTCUSD', value: 67234, change: 1.20 },
    { symbol: 'EURUSD', value: 1.0856, change: -0.15 },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPrices(prev => prev.map(p => ({
        ...p,
        value: p.value * (1 + (Math.random() - 0.5) * 0.002),
        change: p.change + (Math.random() - 0.5) * 0.1,
      })));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-4 px-4 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
      {prices.map(p => (
        <div key={p.symbol} className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">{p.symbol}</span>
          <span className="text-xs font-mono text-foreground">{p.value.toFixed(p.symbol.includes('USD') && p.value > 100 ? 2 : 4)}</span>
          <span className={`text-xs font-mono ${p.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {p.change >= 0 ? '▲' : '▼'} {Math.abs(p.change).toFixed(2)}%
          </span>
        </div>
      ))}
    </div>
  );
}

// Main animated chart card
export default function LiveFundedAccountCard() {
  const [chartPoints, setChartPoints] = useState([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Generate realistic upward trending chart points
    const points = [];
    let value = 100000;
    for (let i = 0; i < 8; i++) {
      value = value * (1 + (Math.random() - 0.3) * 0.08);
      points.push({ x: i * 40, y: 120 - (value - 100000) / 800, value });
    }
    // Ensure final point is highest
    points[points.length - 1].y = 15;
    points[points.length - 1].value = 184250;
    setChartPoints(points);
  }, []);

  const polylinePoints = chartPoints.map(p => `${p.x},${p.y}`).join(' ');
  const fillPoints = `0,120 ${polylinePoints} ${chartPoints[chartPoints.length - 1]?.x || 280},120`;

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="relative"
    >
      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        whileHover={{ y: -4 }}
        className="rounded-2xl p-6"
        style={{
          background: '#16181d',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="text-xs text-muted-foreground mb-0.5">Funded account</div>
            <div className="text-base font-medium text-foreground">Performance</div>
          </div>
          <div className="text-right">
            <div className="text-xl font-semibold text-foreground">
              $<AnimatedNumber value={184250} duration={2500} />
            </div>
            <div className="text-sm font-medium text-emerald-400">+84.25%</div>
          </div>
        </div>

        {/* Chart */}
        <div className="relative h-32 mb-6">
          <svg viewBox="0 0 280 120" className="w-full h-full">
            {/* Grid lines */}
            {[20, 40, 60, 80, 100].map(y => (
              <line key={y} x1="0" y1={y} x2="280" y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            ))}
            
            {/* Gradient fill */}
            <defs>
              <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF5C00" stopOpacity="0.15" />
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
            
            {/* Animated line */}
            {mounted && (
              <motion.polyline
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 2, delay: 0.5, ease: 'easeOut' }}
                fill="none"
                stroke="#FF5C00"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={polylinePoints}
              />
            )}
            
            {/* Data points */}
            {mounted && chartPoints.map((p, i) => (
              <motion.circle
                key={i}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: i === chartPoints.length - 1 ? 1 : 0.6 }}
                transition={{ duration: 0.4, delay: 0.5 + i * 0.15 }}
                cx={p.x}
                cy={p.y}
                r={i === chartPoints.length - 1 ? 5 : 3}
                fill="#FF5C00"
              />
            ))}
            
            {/* Pulsing endpoint */}
            {mounted && (
              <motion.circle
                cx={chartPoints[chartPoints.length - 1]?.x}
                cy={chartPoints[chartPoints.length - 1]?.y}
                r="12"
                fill="rgba(255,92,0,0.15)"
                stroke="#FF5C00"
                strokeWidth="1.5"
                animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0.2, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </svg>
        </div>

        {/* Bottom Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Profit', value: '+84%', positive: true },
            { label: 'Win rate', value: '73%' },
            { label: 'Trades', value: '247' },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <div className="text-xs text-muted-foreground mb-0.5">{stat.label}</div>
              <div className={`text-sm font-semibold ${stat.positive ? 'text-emerald-400' : 'text-foreground'}`}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.8, 0.4, 0.8] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-emerald-400"
            />
            <span className="text-xs text-muted-foreground">Active</span>
          </div>
          <span className="text-xs text-muted-foreground">Phase 2 → Funded</span>
        </div>
      </motion.div>

      {/* Floating Price Ticker */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="absolute -top-3 -right-3"
      >
        <LivePriceTicker />
      </motion.div>
    </motion.div>
  );
}