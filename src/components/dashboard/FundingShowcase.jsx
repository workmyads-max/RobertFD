import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Target, Award, Rocket, Star, Sparkles } from 'lucide-react';

// Animated rocket with particle trail
function RocketAnimation() {
  return (
    <div className="relative w-32 h-32">
      {/* Particle trail */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0, y: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
            y: [0, 40 + i * 8],
            x: Math.sin(i * 0.5) * 20,
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.1,
            ease: 'easeOut',
          }}
          className="absolute bottom-0 left-1/2 w-2 h-2 rounded-full"
          style={{
            background: i < 4 ? '#FF5C00' : i < 8 ? '#FF8A3D' : '#CCFF00',
            filter: 'blur(2px)',
          }}
        />
      ))}
      
      {/* Rocket icon */}
      <motion.div
        animate={{ y: [-5, 5, -5] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="relative">
          <Rocket className="w-16 h-16" style={{ color: '#FF5C00' }} />
          {/* Glow effect */}
          <div
            className="absolute inset-0 blur-xl opacity-60"
            style={{ background: '#FF5C00' }}
          />
        </div>
      </motion.div>
      
      {/* Sparkles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`sparkle-${i}`}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.2, 0],
            x: 60 + Math.cos(i * 60 * Math.PI / 180) * 40,
            y: 20 + Math.sin(i * 60 * Math.PI / 180) * 40,
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.3,
            ease: 'easeOut',
          }}
          className="absolute"
        >
          <Star className="w-4 h-4" style={{ color: '#CCFF00' }} />
        </motion.div>
      ))}
    </div>
  );
}

// Animated counter component
function AnimatedCounter({ value, prefix = '', suffix = '', decimals = 0 }) {
  const [displayValue, setDisplayValue] = useState(0);

  React.useEffect(() => {
    const target = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : value;
    const duration = 2000;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
      const current = target * easeProgress;
      
      setDisplayValue(current);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [value]);

  return (
    <span>
      {prefix}
      {displayValue.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  );
}

export default function FundingShowcase({ account }) {
  if (!account || account.status !== 'funded') return null;

  const fundedAmount = account.account_size;
  const currentBalance = account.balance;
  const totalEarnings = (account.pnl || 0);
  const profitShare = totalEarnings * 0.8;

  const stats = [
    { 
      label: 'Funded Capital', 
      value: `$${fundedAmount.toLocaleString()}`, 
      icon: DollarSign, 
      color: '#FF5C00',
      subtext: 'Trading capital'
    },
    { 
      label: 'Current Balance', 
      value: `$${currentBalance.toLocaleString()}`, 
      icon: TrendingUp, 
      color: '#10b981',
      subtext: 'Live balance'
    },
    { 
      label: 'Your Earnings', 
      value: `${profitShare >= 0 ? '+' : ''}$${profitShare.toFixed(2)}`, 
      icon: Award, 
      color: '#CCFF00',
      subtext: '80% profit split'
    },
    { 
      label: 'Next Withdrawal', 
      value: 'Available', 
      icon: Target, 
      color: '#60a5fa',
      subtext: 'Ready to claim'
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="rounded-3xl p-8 relative overflow-hidden mb-6"
      style={{
        background: 'linear-gradient(135deg, rgba(255,92,0,0.12), rgba(204,255,0,0.06))',
        border: '2px solid rgba(255,92,0,0.4)',
        boxShadow: '0 20px 60px rgba(255,92,0,0.2), 0 0 100px rgba(255,92,0,0.1)',
      }}>
      
      {/* Animated background gradient orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.15, 0.1],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, #FF5C00, transparent)' }}
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.1, 0.15, 0.1],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, #CCFF00, transparent)' }}
      />
      
      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 0, x: 0 }}
          animate={{
            opacity: [0, 0.6, 0],
            y: [0, -100 - Math.random() * 100],
            x: Math.sin(i * 0.5) * 50,
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeOut',
          }}
          className="absolute w-1 h-1 rounded-full"
          style={{
            background: i % 2 === 0 ? '#FF5C00' : '#CCFF00',
            left: `${10 + Math.random() * 80}%`,
            top: `${20 + Math.random() * 60}%`,
            filter: 'blur(1px)',
          }}
        />
      ))}

      <div className="relative z-10">
        {/* Header with rocket */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex-1">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5" style={{ color: '#CCFF00' }} />
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                  Funded Trader Status
                </span>
              </div>
              <h2 className="text-3xl font-black text-foreground mb-2">
                🎉 Congratulations, You're Funded!
              </h2>
              <p className="text-sm text-muted-foreground">
                Trade with real capital and withdraw your profits daily
              </p>
            </motion.div>
          </div>
          
          {/* Rocket animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <RocketAnimation />
          </motion.div>
        </div>

        {/* Stats grid with enhanced animations */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((s, idx) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.1 + idx * 0.1, type: 'spring', stiffness: 100 }}
                whileHover={{ 
                  scale: 1.05, 
                  y: -5,
                  transition: { duration: 0.2 }
                }}
                className="rounded-xl p-4 relative group/stat cursor-pointer overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${s.color}15, ${s.color}05)`,
                  border: `1.5px solid ${s.color}40`,
                }}>
                
                {/* Hover glow effect */}
                <motion.div
                  className="absolute inset-0 opacity-0 group-hover/stat:opacity-100"
                  style={{
                    background: `radial-gradient(circle at top right, ${s.color}25, transparent)`,
                  }}
                  transition={{ duration: 0.3 }}
                />
                
                {/* Pulsing border on hover */}
                <motion.div
                  className="absolute inset-0 rounded-xl opacity-0 group-hover/stat:opacity-100"
                  style={{
                    border: `2px solid ${s.color}`,
                    boxShadow: `0 0 20px ${s.color}40`,
                  }}
                  animate={{ opacity: [0, 0.5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70">
                      {s.label}
                    </span>
                    <motion.div
                      whileHover={{ scale: 1.2, rotate: 15 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                    >
                      <Icon className="w-4 h-4" style={{ color: s.color }} />
                    </motion.div>
                  </div>
                  
                  <motion.div
                    className="text-lg font-black"
                    style={{ color: s.color }}
                    whileHover={{ scale: 1.1 }}
                  >
                    {s.value}
                  </motion.div>
                  
                  {s.subtext && (
                    <div className="text-[9px] text-muted-foreground mt-1 font-mono">
                      {s.subtext}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Call to action with enhanced effects */}
        <div className="flex gap-3">
          <motion.button
            whileHover={{ 
              scale: 1.05,
              boxShadow: '0 12px 40px rgba(255,92,0,0.4)',
            }}
            whileTap={{ scale: 0.95 }}
            className="flex-1 py-3 rounded-xl font-bold text-white text-sm transition-all relative overflow-hidden group/btn"
            style={{
              background: 'linear-gradient(90deg, #FF5C00, #FF7A2F)',
              boxShadow: '0 8px 24px rgba(255,92,0,0.3)',
            }}>
            {/* Shine effect */}
            <motion.div
              className="absolute inset-0 opacity-0 group-hover/btn:opacity-100"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
              }}
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
            />
            Request Withdrawal
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-1 py-3 rounded-xl font-bold transition-all"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1.5px solid rgba(255,255,255,0.15)',
              color: 'hsl(var(--foreground))',
            }}>
            View Payout History
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}