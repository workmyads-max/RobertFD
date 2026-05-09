import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Copy, CheckCircle, TrendingUp, DollarSign, Link, ChevronRight,
  Award, Zap, BarChart3, Clock, Share2, ArrowDownRight
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const LEVEL_CONFIG = {
  1: { pct: 9, color: '#FF5C00', bg: 'rgba(255,92,0,0.1)', border: 'rgba(255,92,0,0.25)', label: 'Direct' },
  2: { pct: 4, color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.25)', label: 'Level 2' },
  3: { pct: 1, color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.25)', label: 'Level 3' },
};

function StatCard({ label, value, color, icon: Icon, sub, i }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
      className="rounded-2xl p-5"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{label}</span>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
      </div>
      <div className="text-2xl font-black" style={{ color }}>{value}</div>
      {sub && <div className="text-xs font-mono text-muted-foreground mt-1">{sub}</div>}
    </motion.div>
  );
}

function CommissionRow({ c, index }) {
  const lvl = LEVEL_CONFIG[c.level] || LEVEL_CONFIG[1];
  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.04 }}
      className="flex items-center gap-4 px-5 py-3.5 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: lvl.bg, border: `1px solid ${lvl.border}` }}>
        <span className="text-[10px] font-black" style={{ color: lvl.color }}>L{c.level}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-foreground">{c.referred_email || 'Referral'}</div>
        <div className="text-[10px] font-mono text-muted-foreground capitalize">
          {c.commission_type === 'payout_reward' ? '🏆 Payout Reward' : '💼 Challenge Purchase'} • {lvl.pct}% rate
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-sm font-bold text-emerald-400">+${(c.commission_amount || 0).toFixed(2)}</div>
        <div className={`text-[10px] font-mono capitalize ${c.status === 'paid' ? 'text-emerald-400' : c.status === 'approved' ? 'text-blue-400' : 'text-yellow-400'}`}>
          {c.status}
        </div>
      </div>
    </motion.div>
  );
}

export default function Affiliate({ user }) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const qc = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['affiliate-profile', user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.AffiliateProfile.filter({ user_email: user?.email });
      if (profiles.length > 0) return profiles[0];
      // Auto-create profile if missing
      const code = 'RF' + Math.random().toString(36).slice(2, 8).toUpperCase();
      return base44.entities.AffiliateProfile.create({
        user_email: user?.email,
        referral_code: code,
        total_earned: 0, total_pending: 0, total_paid: 0,
        referral_clicks: 0, total_referrals: 0, conversions: 0,
      });
    },
    enabled: !!user?.email,
  });

  const { data: commissions = [] } = useQuery({
    queryKey: ['my-commissions', user?.email],
    queryFn: () => base44.entities.AffiliateCommission.filter({ affiliate_email: user?.email }),
    enabled: !!user?.email,
  });

  const refLink = profile
    ? `https://robertfunds.com/?ref=${profile.referral_code}`
    : 'Loading...';

  const copy = async () => {
    await navigator.clipboard.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalEarned = commissions.reduce((s, c) => s + (c.commission_amount || 0), 0);
  const totalPending = commissions.filter(c => c.status === 'pending').reduce((s, c) => s + (c.commission_amount || 0), 0);
  const totalPaid = commissions.filter(c => c.status === 'paid').reduce((s, c) => s + (c.commission_amount || 0), 0);
  const l1 = commissions.filter(c => c.level === 1);
  const l2 = commissions.filter(c => c.level === 2);
  const l3 = commissions.filter(c => c.level === 3);
  const payoutRewards = commissions.filter(c => c.commission_type === 'payout_reward');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
            <Users className="w-6 h-6 text-primary" /> Affiliate Program
          </h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">Multi-level referral & trading reward system</p>
        </div>
        {profile?.referral_code && (
          <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono"
            style={{ background: 'rgba(255,92,0,0.08)', border: '1px solid rgba(255,92,0,0.2)', color: '#FF5C00' }}>
            <Zap className="w-3 h-3" /> Code: {profile.referral_code}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Earned" value={`$${totalEarned.toFixed(2)}`} color="#10b981" icon={DollarSign} sub={`${commissions.length} commissions`} i={0} />
        <StatCard label="Pending" value={`$${totalPending.toFixed(2)}`} color="#f59e0b" icon={Clock} sub="Awaiting approval" i={1} />
        <StatCard label="Total Paid" value={`$${totalPaid.toFixed(2)}`} color="#60a5fa" icon={CheckCircle} sub="Processed" i={2} />
        <StatCard label="Payout Rewards" value={`$${payoutRewards.reduce((s,c)=>s+(c.commission_amount||0),0).toFixed(2)}`} color="#CCFF00" icon={Award} sub="From trader profits" i={3} />
      </div>

      {/* Referral link */}
      <div className="rounded-2xl p-5 mb-6"
        style={{ background: 'rgba(255,92,0,0.06)', border: '1px solid rgba(255,92,0,0.2)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Link className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-foreground">Your Referral Link</span>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl mb-3"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <span className="flex-1 text-sm font-mono text-foreground truncate">{refLink}</span>
          <button onClick={copy} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0 transition-all"
            style={{ background: copied ? 'rgba(16,185,129,0.2)' : 'rgba(255,92,0,0.15)', color: copied ? '#10b981' : '#FF5C00', border: `1px solid ${copied ? 'rgba(16,185,129,0.4)' : 'rgba(255,92,0,0.4)'}` }}>
            {copied ? <><CheckCircle className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
          </button>
        </div>
        {/* Commission tiers */}
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(LEVEL_CONFIG).map(([lvl, cfg]) => (
            <div key={lvl} className="rounded-xl p-3 text-center"
              style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
              <div className="text-xs font-mono mb-0.5" style={{ color: cfg.color }}>{cfg.label}</div>
              <div className="text-xl font-black" style={{ color: cfg.color }}>{cfg.pct}%</div>
              <div className="text-[10px] text-muted-foreground">commission</div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground mt-3">
          <span className="text-primary font-semibold">+9%</span> direct commission on every challenge purchase.
          <span className="text-accent font-semibold ml-2">+9% payout reward</span> when your direct referral receives a profit payout.
        </p>
      </div>

      {/* Level breakdown */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { lvl: 1, label: 'Level 1 (Direct)', count: new Set(l1.map(c=>c.referred_email)).size, earned: l1.reduce((s,c)=>s+(c.commission_amount||0),0), color: '#FF5C00' },
          { lvl: 2, label: 'Level 2', count: new Set(l2.map(c=>c.referred_email)).size, earned: l2.reduce((s,c)=>s+(c.commission_amount||0),0), color: '#60a5fa' },
          { lvl: 3, label: 'Level 3', count: new Set(l3.map(c=>c.referred_email)).size, earned: l3.reduce((s,c)=>s+(c.commission_amount||0),0), color: '#a78bfa' },
        ].map((item) => (
          <div key={item.lvl} className="rounded-2xl p-4"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-black"
                style={{ background: `${item.color}20`, color: item.color }}>L{item.lvl}</div>
              <span className="text-xs font-semibold text-foreground">{item.label}</span>
            </div>
            <div className="text-2xl font-black" style={{ color: item.color }}>{item.count}</div>
            <div className="text-[10px] font-mono text-muted-foreground mb-2">Unique referrals</div>
            <div className="text-sm font-bold text-emerald-400">${item.earned.toFixed(2)}</div>
            <div className="text-[10px] font-mono text-muted-foreground">Total earned</div>
          </div>
        ))}
      </div>

      {/* Commission history */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/5"
          style={{ background: 'rgba(255,255,255,0.02)' }}>
          <span className="text-xs font-bold text-foreground">Commission History</span>
          <span className="text-[10px] font-mono text-muted-foreground">{commissions.length} records</span>
        </div>
        {commissions.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No commissions yet. Share your referral link to start earning!
          </div>
        ) : (
          commissions.slice(0, 20).map((c, i) => <CommissionRow key={c.id} c={c} index={i} />)
        )}
      </div>
    </div>
  );
}