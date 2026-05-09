import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Target, Award } from 'lucide-react';

export default function FundingShowcase({ account }) {
  if (!account || account.status !== 'funded') return null;

  const fundedAmount = account.account_size;
  const currentBalance = account.balance;
  const totalEarnings = (account.pnl || 0);
  const profitShare = totalEarnings * 0.8; // 80% trader, 20% company

  const stats = [
    { label: 'Funded Capital', value: `$${fundedAmount.toLocaleString()}`, icon: DollarSign, color: '#FF5C00' },
    { label: 'Current Balance', value: `$${currentBalance.toLocaleString()}`, icon: TrendingUp, color: '#10b981' },
    { label: 'Your Earnings', value: `${profitShare >= 0 ? '+' : ''}$${profitShare.toFixed(2)}`, icon: Award, color: '#CCFF00' },
    { label: 'Next Withdrawal', value: 'Available', icon: Target, color: '#60a5fa' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl p-8 relative overflow-hidden mb-6"
      style={{
        background: 'linear-gradient(135deg, rgba(255,92,0,0.1), rgba(204,255,0,0.05))',
        border: '2px solid rgba(255,92,0,0.3)',
        boxShadow: '0 20px 60px rgba(255,92,0,0.15)',
      }}>
      {/* Animated background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-10"
        style={{
          background: 'radial-gradient(circle, #FF5C00, transparent)',
          animation: 'pulse 4s ease-in-out infinite',
        }} />
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-10"
        style={{
          background: 'radial-gradient(circle, #CCFF00, transparent)',
          animation: 'pulse 4s ease-in-out 2s infinite',
        }} />

      <div className="relative z-10">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <div className="mb-8">
            <motion.h2 className="text-3xl font-black text-foreground mb-2 flex items-center gap-3"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}>
              🎉 Congratulations, You're Funded!
            </motion.h2>
            <p className="text-sm text-muted-foreground">Trade with real capital and withdraw your profits daily</p>
          </div>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((s, idx) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + idx * 0.05 }}
                whileHover={{ scale: 1.05 }}
                className="rounded-xl p-4 relative group/stat cursor-pointer"
                style={{
                  background: `linear-gradient(135deg, ${s.color}15, ${s.color}05)`,
                  border: `1.5px solid ${s.color}40`,
                }}>
                <motion.div className="absolute inset-0 opacity-0 group-hover/stat:opacity-100 transition-opacity"
                  style={{
                    background: `radial-gradient(circle at top right, ${s.color}20, transparent)`,
                    borderRadius: '11px',
                  }} />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground/70">{s.label}</span>
                    <motion.div whileHover={{ scale: 1.1, rotate: 10 }}>
                      <Icon className="w-4 h-4" style={{ color: s.color }} />
                    </motion.div>
                  </div>
                  <motion.div className="text-xl font-black" style={{ color: s.color }}
                    whileHover={{ scale: 1.05 }}>
                    {s.value}
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Call to action */}
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-1 py-3 rounded-xl font-bold text-white text-sm transition-all"
            style={{
              background: 'linear-gradient(90deg, #FF5C00, #FF7A2F)',
              boxShadow: '0 8px 24px rgba(255,92,0,0.3)',
            }}>
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