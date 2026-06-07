import React, { useState, useEffect } from 'react';
import { DollarSign, Clock, CheckCircle, Award, Users, TrendingUp, Zap, ArrowRight } from 'lucide-react';

function AnimatedNumber({ value, prefix = '', decimals = 2 }) {
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
  return <>{prefix}{decimals === 0 ? Math.round(displayed) : displayed.toFixed(decimals)}</>;
}

const TIERS = [
  { min: 0, max: 9, rate: 7, label: 'Starter' },
  { min: 10, max: 24, rate: 11, label: 'Silver' },
  { min: 25, max: 49, rate: 17, label: 'Gold' },
  { min: 50, max: Infinity, rate: 25, label: 'Platinum' },
];

function StatRow({ label, value, sub, valueColor }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b last:border-b-0" style={{ borderColor: 'hsl(var(--border))' }}>
      <div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>
      <div className="text-right">
        <div className={`text-sm font-semibold ${valueColor || 'text-foreground'}`}>{value}</div>
        {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
      </div>
    </div>
  );
}

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
  const tierPct = nextTier ? Math.min((activeFunded / nextTier.min) * 100, 100) : 100;

  return (
    <div className="space-y-8">

      {/* Tier status — large institutional panel */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'hsl(var(--border))' }}>
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x" style={{ borderColor: 'hsl(var(--border))' }}>

          {/* Current tier */}
          <div className="p-8">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">Current Tier</div>
            <div className="text-4xl font-semibold text-foreground mb-1">{currentTier.label}</div>
            <div className="text-sm text-muted-foreground">
              Payout reward rate: <span className="font-semibold text-primary">{currentTier.rate}%</span>
            </div>
          </div>

          {/* Tier progress */}
          <div className="p-8">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">
              {nextTier ? `Progress to ${nextTier.label}` : 'Maximum Tier Reached'}
            </div>
            {nextTier ? (
              <>
                <div className="text-4xl font-semibold text-foreground mb-1">
                  {activeFunded}<span className="text-xl text-muted-foreground font-normal"> / {nextTier.min}</span>
                </div>
                <div className="text-sm text-muted-foreground mb-4">active funded traders</div>
                <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all duration-1000" style={{ width: `${tierPct}%` }} />
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">You are at the highest commission tier.</div>
            )}
          </div>

          {/* Tier ladder */}
          <div className="p-8">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">Commission Tiers</div>
            <div className="space-y-3">
              {TIERS.map((t, i) => {
                const isActive = currentTier.label === t.label;
                return (
                  <div key={i} className={`flex items-center justify-between text-sm ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-primary' : 'bg-white/10'}`} />
                      <span className={isActive ? 'font-semibold' : ''}>{t.label}</span>
                      <span className="text-xs opacity-50">{t.min === 0 ? '0' : t.min}–{t.max === Infinity ? '∞' : t.max} traders</span>
                    </div>
                    <span className={`font-semibold ${isActive ? 'text-primary' : ''}`}>{t.rate}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'hsl(var(--border))' }}>
        <div className="grid grid-cols-2 lg:grid-cols-4" style={{ borderColor: 'hsl(var(--border))' }}>
          {[
            { label: 'Total Earned', value: totalEarned, prefix: '$', sub: `${commissions.length} commissions`, color: 'text-foreground' },
            { label: 'Pending Approval', value: totalPending, prefix: '$', sub: 'Awaiting review', color: 'text-yellow-400' },
            { label: 'Approved', value: totalApproved, prefix: '$', sub: 'Ready for payout', color: 'text-emerald-400' },
            { label: 'Total Paid', value: totalPaid, prefix: '$', sub: 'Processed', color: 'text-foreground' },
          ].map(s => (
            <div key={s.label} className="p-4 sm:p-6 border-b lg:border-b-0 border-r even:border-r-0 lg:even:border-r last:border-r-0" style={{ borderColor: 'hsl(var(--border))' }}>
              <div className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2 sm:mb-3">{s.label}</div>
              <div className={`text-xl sm:text-3xl font-semibold tracking-tight mb-1 ${s.color}`}>
                <AnimatedNumber value={s.value} prefix={s.prefix} />
              </div>
              <div className="text-xs text-muted-foreground">{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Two-column breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Commission by type */}
        <div className="rounded-xl border" style={{ borderColor: 'hsl(var(--border))' }}>
          <div className="px-6 py-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
            <div className="text-sm font-semibold text-foreground">Commission Breakdown</div>
          </div>
          <div className="px-6 py-2">
            <StatRow label="Purchase Commissions" value={`$${purchaseComm.toFixed(2)}`} sub="From challenge sales" valueColor="text-primary" />
            <StatRow label="Payout Rewards" value={`$${payoutRewards.toFixed(2)}`} sub="From funded profits" valueColor="text-emerald-400" />
            <StatRow label="Active Funded Traders" value={activeFunded} sub={`${currentTier.label} tier`} />
            <StatRow label="Total Referrals" value={profile?.total_referrals || 0} sub={`${profile?.conversions || 0} converted`} />
          </div>
        </div>

        {/* Level breakdown */}
        <div className="rounded-xl border" style={{ borderColor: 'hsl(var(--border))' }}>
          <div className="px-6 py-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
            <div className="text-sm font-semibold text-foreground">Multi-Level Earnings</div>
          </div>
          <div className="divide-y" style={{ borderColor: 'hsl(var(--border))' }}>
            {[
              { lvl: 1, label: 'Level 1 — Direct Referrals', rate: '8%' },
              { lvl: 2, label: 'Level 2', rate: '2%' },
              { lvl: 3, label: 'Level 3', rate: '1%' },
            ].map(({ lvl, label, rate }) => {
              const lvlComms = commissions.filter(c => c.level === lvl);
              const earned = lvlComms.reduce((s, c) => s + (c.commission_amount || 0), 0);
              const unique = new Set(lvlComms.map(c => c.referred_email)).size;
              return (
                <div key={lvl} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-foreground">{label}</div>
                    <div className="text-xs text-muted-foreground">{unique} unique referrals · {rate} rate</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-emerald-400">${earned.toFixed(2)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}