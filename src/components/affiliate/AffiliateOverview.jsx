import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Clock, CheckCircle, Award, Users, TrendingUp, Zap, Star } from 'lucide-react';

function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 2 }) {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = parseFloat(value) || 0;
    if (end === 0) return;
    const duration = 1200;
    const step = 16;
    const increment = end / (duration / step);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) { start = end; clearInterval(timer); }
      setDisplayed(start);
    }, step);
    return () => clearInterval(timer);
  }, [value]);
  return <>{prefix}{decimals === 0 ? Math.round(displayed) : displayed.toFixed(decimals)}{suffix}</>;
}

const TIERS = [
  { min: 0, max: 9, rate: 7, label: 'Starter', color: '#60a5fa' },
  { min: 10, max: 24, rate: 11, label: 'Silver', color: '#a78bfa' },
  { min: 25, max: 49, rate: 17, label: 'Gold', color: '#fbbf24' },
  { min: 50, max: Infinity, rate: 25, label: 'Platinum', color: '#FF5C00' },
];

export default function AffiliateOverview({ commissions = [], profile, accounts = [] }) {
  const totalEarned = commissions.reduce((s, c) => s + (c.commission_amount || 0), 0);
  const totalPending = commissions.filter(c => c.status === 'pending').reduce((s, c) => s + (c.commission_amount || 0), 0);
  const totalPaid = commissions.filter(c => c.status === 'paid').reduce((s, c) => s + (c.commission_amount || 0), 0);
  const totalApproved = commissions.filter(c => c.status === 'approved').reduce((s, c) => s + (c.commission_amount || 0), 0);
  const payoutRewards = commissions.filter(c => c.commission_type === 'payout_reward').reduce((s, c) => s + (c.commission_amount || 0), 0);
  const purchaseComm = commissions.filter(c => c.commission_type === 'challenge_purchase').reduce((s, c) => s + (c.commission_amount || 0), 0);

  const activeFunded = profile?.active_funded_traders || 0;
  const currentTier = TIERS.find(t => activeFunded >= t.min && activeFunded <= t.max) || TIERS[0];
  const nextTier = TIERS.find(t => t.min > activeFunded);

  const stats = [
    { label: 'Total Earned', value: totalEarned, prefix: '$', color: '#10b981', icon: DollarSign, sub: `${commissions.length} commissions` },
    { label: 'Pending', value: totalPending, prefix: '$', color: '#f59e0b', icon: Clock, sub: 'Awaiting approval' },
    { label: 'Approved', value: totalApproved, prefix: '$', color: '#60a5fa', icon: CheckCircle, sub: 'Ready for payout' },
    { label: 'Total Paid', value: totalPaid, prefix: '$', color: '#10b981', icon: CheckCircle, sub: 'Processed' },
    { label: 'Payout Rewards', value: payoutRewards, prefix: '$', color: '#CCFF00', icon: Award, sub: 'From funded profits' },
    { label: 'Purchase Comm.', value: purchaseComm, prefix: '$', color: '#FF5C00', icon: Zap, sub: 'Challenge sales' },
    { label: 'Active Funded', value: activeFunded, prefix: '', decimals: 0, color: currentTier.color, icon: Users, sub: `${currentTier.label} tier` },
    { label: 'Total Referrals', value: profile?.total_referrals || 0, prefix: '', decimals: 0, color: '#a78bfa', icon: TrendingUp, sub: `${profile?.conversions || 0} converted` },
  ];

  return (
    <div>
      {/* Tier Banner */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-5 mb-6 flex items-center gap-5 flex-wrap"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(255,92,0,0.1)' }}>
          <Star className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
            Current Tier
          </div>
          <div className="text-xl font-bold text-foreground">{currentTier.label}</div>
          <div className="text-xs text-muted-foreground">
            Payout Reward Rate: <span className="font-bold text-primary">{currentTier.rate}%</span>
            {nextTier && (
              <span className="ml-3">→ {nextTier.min - activeFunded} more traders for {nextTier.label} ({nextTier.rate}%)</span>
            )}
          </div>
        </div>
        {/* Tier progress */}
        <div className="hidden md:flex items-center gap-3">
          {TIERS.map((t, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full border-2 transition-all"
                style={{
                  background: activeFunded >= t.min ? t.color : 'transparent',
                  borderColor: activeFunded >= t.min ? t.color : 'rgba(255,255,255,0.2)',
                }} />
              <span className="text-[9px] font-medium text-muted-foreground">{t.rate}%</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="rounded-2xl p-5"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{s.label}</span>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,92,0,0.1)' }}>
                  <Icon className="w-3.5 h-3.5 text-primary" />
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground">
                <AnimatedNumber value={s.value} prefix={s.prefix} decimals={s.decimals ?? 2} />
              </div>
              {s.sub && <div className="text-xs text-muted-foreground mt-1">{s.sub}</div>}
            </motion.div>
          );
        })}
      </div>

      {/* Level Breakdown */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        {[
          { lvl: 1, label: 'Level 1 — Direct', rate: '8%' },
          { lvl: 2, label: 'Level 2', rate: '2%' },
          { lvl: 3, label: 'Level 3', rate: '1%' },
        ].map(({ lvl, label, rate }) => {
          const lvlComms = commissions.filter(c => c.level === lvl);
          const earned = lvlComms.reduce((s, c) => s + (c.commission_amount || 0), 0);
          const unique = new Set(lvlComms.map(c => c.referred_email)).size;
          return (
            <motion.div key={lvl} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + lvl * 0.1 }}
              className="rounded-2xl p-5"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-primary"
                  style={{ background: 'rgba(255,92,0,0.1)' }}>L{lvl}</div>
                <div className="text-base font-bold text-primary">{rate}</div>
              </div>
              <div className="text-xs font-medium text-muted-foreground mb-1">{label}</div>
              <div className="text-xl font-bold text-emerald-400 mb-0.5">${earned.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">{unique} unique referrals</div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}