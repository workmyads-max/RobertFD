import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Activity, DollarSign, GitBranch, Wallet, TrendingUp, ExternalLink, Flag, Percent, Layers
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import AffiliateOverview from '../affiliate/AffiliateOverview';
import ReferralLink from '../affiliate/ReferralLink';
import CommissionHistory from '../affiliate/CommissionHistory';
import ReferralTree from '../affiliate/ReferralTree';
import AffiliateWithdrawal from '../affiliate/AffiliateWithdrawal';

const ACCENT = '#CCFF00';

const TABS = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'link', label: 'Referral Link', icon: GitBranch },
  { id: 'history', label: 'Commissions', icon: DollarSign },
  { id: 'tree', label: 'Network Tree', icon: Users },
  { id: 'withdraw', label: 'Withdraw', icon: Wallet },
];

// ── 3D Icons ────────────────────────────────────────────────────────────────
function VaultIcon({ size = 52 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <rect x="8" y="20" width="48" height="36" rx="6" fill={ACCENT} opacity="0.85" />
      <rect x="8" y="20" width="48" height="36" rx="6" fill="none" stroke="#AADD00" strokeWidth="1.5" />
      <rect x="12" y="24" width="40" height="28" rx="4" fill="#1a1a1a" opacity="0.3" />
      <circle cx="32" cy="38" r="10" fill="#1a1a1a" stroke={ACCENT} strokeWidth="2" />
      <circle cx="32" cy="38" r="3" fill={ACCENT} />
      <line x1="32" y1="28" x2="32" y2="32" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" />
      <line x1="32" y1="44" x2="32" y2="48" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" />
      <line x1="22" y1="38" x2="26" y2="38" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" />
      <line x1="38" y1="38" x2="42" y2="38" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function MoneyBagIcon({ size = 52 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <ellipse cx="32" cy="44" rx="4" ry="2" fill={ACCENT} opacity="0.3" />
      <path d="M18 28C18 28, 20 14, 32 14C44 14, 46 28, 46 28L48 48C48 48, 46 52, 32 52C18 52, 16 48, 16 48Z" fill={ACCENT} opacity="0.85" stroke="#AADD00" strokeWidth="1.5" />
      <path d="M22 28C22 28, 26 22, 32 22C38 22, 42 28, 42 28" fill="#1a1a1a" opacity="0.3" />
      <text x="32" y="40" textAnchor="middle" fontSize="10" fontWeight="900" fill="#1a1a1a">$</text>
    </svg>
  );
}
function HourglassIcon({ size = 52 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <ellipse cx="32" cy="44" rx="4" ry="2" fill={ACCENT} opacity="0.3" />
      <path d="M20 12L20 24C20 24, 22 32, 32 32C42 32, 44 24, 44 24L44 12Z" fill={ACCENT} opacity="0.85" stroke="#AADD00" strokeWidth="1.5" />
      <path d="M20 52L20 40C20 40, 22 32, 32 32C42 32, 44 40, 44 40L44 52Z" fill={ACCENT} opacity="0.85" stroke="#AADD00" strokeWidth="1.5" />
      <rect x="18" y="9" width="28" height="5" rx="2" fill={ACCENT} />
      <rect x="18" y="50" width="28" height="5" rx="2" fill={ACCENT} />
    </svg>
  );
}

function PerfCard({ label, value, sub, IconComponent, highlight }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ ease: [0.22, 1, 0.36, 1] }}
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: highlight ? ACCENT : '#1a1a1a',
        border: highlight ? 'none' : '1px solid rgba(255,255,255,0.06)',
        padding: '20px', minHeight: '140px',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      }}>
      <div>
        <div className="text-xs font-semibold mb-1" style={{ color: highlight ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.4)' }}>{label}</div>
        <div className="text-3xl font-black" style={{ color: highlight ? '#000' : '#fff' }}>{value}</div>
        {sub && <div className="text-xs mt-1" style={{ color: highlight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.25)' }}>{sub}</div>}
      </div>
      {IconComponent && <div className="absolute bottom-3 right-3 opacity-80"><IconComponent size={52} /></div>}
    </motion.div>
  );
}

export default function Affiliate({ user }) {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: profile } = useQuery({
    queryKey: ['affiliate-profile', user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.AffiliateProfile.filter({ user_email: user?.email }) || [];
      if (profiles.length > 0) return profiles[0];
      const code = 'RF' + Math.random().toString(36).slice(2, 8).toUpperCase();
      return base44.entities.AffiliateProfile.create({
        user_email: user?.email, referral_code: code, tier: 'standard',
        total_earned: 0, total_pending: 0, total_paid: 0,
        referral_clicks: 0, total_referrals: 0, conversions: 0,
        active_funded_traders: 0, is_active: true, is_frozen: false,
      });
    },
    enabled: !!user?.email,
  });

  const { data: commissions = [] } = useQuery({
    queryKey: ['my-commissions', user?.email],
    queryFn: () => base44.entities.AffiliateCommission.filter({ affiliate_email: user?.email }),
    enabled: !!user?.email, refetchInterval: 30000,
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['challenge-accounts', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.ChallengeAccount.filter({ user_email: user.email }, '-created_date', 100);
    },
    enabled: !!user?.email,
  });

  const { data: withdrawals = [] } = useQuery({
    queryKey: ['affiliate-withdrawals', user?.email],
    queryFn: () => base44.entities.WithdrawalRequest.filter({ user_email: user?.email, account_id: 'affiliate' }),
    enabled: !!user?.email,
  });

  const totalEarned = commissions.reduce((s, c) => s + (c.commission_amount || 0), 0);
  const pendingComm = commissions.filter(c => c.status === 'pending').reduce((s, c) => s + (c.commission_amount || 0), 0);
  const paidComm = commissions.filter(c => c.status === 'paid').reduce((s, c) => s + (c.commission_amount || 0), 0);
  const referralCount = profile?.total_referrals || 0;
  const isFrozen = profile?.is_frozen;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-white mb-1">Affiliate & IB</h1>
          <p className="text-xs text-white/30">Multi-level referral & revenue sharing program</p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-black transition-all hover:opacity-90"
          style={{ background: ACCENT }}>
          View All Tiers <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      {/* Tier Progress */}
      <div style={{ background: '#121212', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', padding: '20px 24px', marginBottom: '20px' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span style={{ background: ACCENT, color: '#000', fontWeight: 800, fontSize: '11px', padding: '3px 10px', borderRadius: '6px', letterSpacing: '0.05em' }}>
              TIER {profile?.tier === 'platinum' ? '5' : profile?.tier === 'gold' ? '4' : profile?.tier === 'silver' ? '3' : profile?.tier === 'standard' ? '2' : '1'}
            </span>
            <span className="text-white/40 text-xs">{referralCount} Referred</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/30 text-xs">10 Referred</span>
            <span style={{ background: '#1a1a1a', color: '#666', fontWeight: 700, fontSize: '11px', padding: '3px 10px', borderRadius: '6px', letterSpacing: '0.05em', border: '1px solid rgba(255,255,255,0.08)' }}>
              TIER 2
            </span>
          </div>
        </div>
        <div className="relative h-2 rounded-full mb-3" style={{ background: '#1a1a1a' }}>
          <motion.div className="absolute inset-y-0 left-0 rounded-full"
            initial={{ width: 0 }} animate={{ width: `${Math.min((referralCount / 10) * 100, 100)}%` }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} style={{ background: ACCENT }} />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-white/60 text-xs font-semibold">Benefits</span>
          {[
            { icon: Flag, label: 'First Purchase 15%' },
            { icon: Percent, label: 'Subsequent Purchase 0%' },
            { icon: Layers, label: 'Sub-affiliate 10%' },
          ].map((b, i) => (
            <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
              style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)', color: '#999' }}>
              <b.icon className="w-3 h-3" style={{ color: ACCENT }} />{b.label}
            </div>
          ))}
        </div>
      </div>

      {/* Frozen warning */}
      <AnimatePresence>
        {isFrozen && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-2xl p-4 mb-6 flex items-center gap-3"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <span className="text-red-400 text-sm font-bold">⚠ Your affiliate commissions are currently frozen by admin. Please contact support.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Performance Overview */}
      <h2 className="text-sm font-bold text-white mb-4">Performance Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <PerfCard label="Total Commissions" value={`$${totalEarned.toFixed(2)}`} IconComponent={VaultIcon} highlight />
        <PerfCard label="Available to Withdraw" value={`$${paidComm.toFixed(2)}`} sub={pendingComm > 0 ? `$${pendingComm.toFixed(2)} pending approval` : 'No pending commissions'} IconComponent={MoneyBagIcon} />
        <PerfCard label="Next Reward Available" value={pendingComm > 0 ? 'Pending Review' : 'No pending'} sub="Earn 10 referrals for Tier 2" IconComponent={HourglassIcon} />
      </div>

      {/* Bottom cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="rounded-2xl p-5 flex flex-col justify-between" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.06)', minHeight: '120px' }}>
          <div>
            <div className="text-white/40 text-xs font-semibold mb-1">Referred New Customers</div>
            <div className="text-3xl font-black text-white">{referralCount}</div>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: `${ACCENT}20`, color: ACCENT, border: `1px solid ${ACCENT}40` }}>
              TIER {profile?.tier === 'platinum' ? '5' : profile?.tier === 'gold' ? '4' : profile?.tier === 'silver' ? '3' : '2'}
            </span>
            <Flag className="w-3 h-3" style={{ color: ACCENT }} />
            <span className="text-[10px] font-semibold" style={{ color: ACCENT }}>15%</span>
          </div>
        </div>
        <div className="rounded-2xl p-5 flex flex-col justify-between" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.06)', minHeight: '120px' }}>
          <div>
            <div className="text-white/40 text-xs font-semibold mb-1">Referred Existing Customers</div>
            <div className="text-3xl font-black text-white">{profile?.conversions || 0}</div>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: `${ACCENT}20`, color: ACCENT, border: `1px solid ${ACCENT}40` }}>
              TIER 1
            </span>
            <Percent className="w-3 h-3" style={{ color: ACCENT }} />
            <span className="text-[10px] font-semibold" style={{ color: ACCENT }}>0%</span>
          </div>
        </div>
      </div>

      {/* Code badge */}
      {profile?.referral_code && (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl mb-6"
          style={{ background: `${ACCENT}10`, border: `1px solid ${ACCENT}30` }}>
          <TrendingUp className="w-3.5 h-3.5" style={{ color: ACCENT }} />
          <span className="text-[10px] text-white/50">Your Code</span>
          <span className="text-sm font-black font-mono" style={{ color: ACCENT }}>{profile.referral_code}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl overflow-x-auto"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex-shrink-0"
              style={{
                background: active ? `${ACCENT}20` : 'transparent',
                color: active ? ACCENT : '#888',
                border: active ? `1px solid ${ACCENT}40` : '1px solid transparent',
              }}>
              <Icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}>
          {activeTab === 'overview' && <AffiliateOverview commissions={commissions} profile={profile} accounts={accounts} />}
          {activeTab === 'link' && <ReferralLink profile={profile} />}
          {activeTab === 'history' && <CommissionHistory commissions={commissions} />}
          {activeTab === 'tree' && <ReferralTree commissions={commissions} userEmail={user?.email} />}
          {activeTab === 'withdraw' && <AffiliateWithdrawal profile={profile} commissions={commissions} withdrawals={withdrawals} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}