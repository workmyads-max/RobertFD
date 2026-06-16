import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Activity, DollarSign, GitBranch, Wallet, Radio, TrendingUp
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import AffiliateOverview from '../affiliate/AffiliateOverview';
import ReferralLink from '../affiliate/ReferralLink';
import CommissionHistory from '../affiliate/CommissionHistory';
import ReferralTree from '../affiliate/ReferralTree';
import AffiliateWithdrawal from '../affiliate/AffiliateWithdrawal';

const ORANGE = '#FF5C00';
const CARD = '#15171e';

const TABS = [
{ id: 'overview', label: 'Overview', icon: Activity },
{ id: 'link', label: 'Referral Link', icon: GitBranch },
{ id: 'history', label: 'Commissions', icon: DollarSign },
{ id: 'tree', label: 'Network Tree', icon: Users },
{ id: 'withdraw', label: 'Withdraw', icon: Wallet },
];

export default function Affiliate({ user }) {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: profile } = useQuery({
    queryKey: ['affiliate-profile', user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.AffiliateProfile.filter({ user_email: user?.email }) || [];
      if (profiles.length > 0) return profiles[0];
      const code = 'RF' + Math.random().toString(36).slice(2, 8).toUpperCase();
      return base44.entities.AffiliateProfile.create({
        user_email: user?.email,
        referral_code: code,
        tier: 'standard',
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
    enabled: !!user?.email,
    refetchInterval: 30000,
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

  const isFrozen = profile?.is_frozen;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-2"
            style={{ background: `${ORANGE}0d`, border: `1px solid ${ORANGE}22` }}>
            <Radio className="w-3 h-3 animate-pulse" style={{ color: ORANGE }} />
            <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: ORANGE }}>Partner Program</span>
          </div>
          <h1 className="text-4xl font-black text-foreground flex items-center gap-3">
            <Users className="w-7 h-7 text-primary" /> Affiliate & IB
          </h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">
            Institutional-grade multi-level referral & revenue sharing ecosystem
          </p>
        </div>

        {/* Quick stats */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="rounded-xl px-4 py-2.5 text-center"
            style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.16)' }}>
            <div className="text-[10px] font-mono text-white/25 uppercase tracking-wider">Total Earned</div>
            <div className="text-lg font-black text-emerald-400">${totalEarned.toFixed(2)}</div>
          </div>
          <div className="rounded-xl px-4 py-2.5 text-center"
            style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.16)' }}>
            <div className="text-[10px] font-mono text-white/25 uppercase tracking-wider">Pending</div>
            <div className="text-lg font-black text-amber-400">${pendingComm.toFixed(2)}</div>
          </div>
          {profile?.referral_code && (
            <div className="rounded-xl px-4 py-2.5 flex items-center gap-2"
              style={{ background: `${ORANGE}0a`, border: `1px solid ${ORANGE}1a` }}>
              <TrendingUp className="w-3.5 h-3.5" style={{ color: ORANGE }} />
              <div>
                <div className="text-[10px] font-mono text-white/25 uppercase tracking-wider">Code</div>
                <div className="text-sm font-black font-mono" style={{ color: ORANGE }}>{profile.referral_code}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Frozen warning */}
      <AnimatePresence>
        {isFrozen && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-2xl p-4 mb-6 flex items-center gap-3"
            style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <span className="text-red-400 text-sm font-bold">⚠ Your affiliate commissions are currently frozen by admin. Please contact support.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl overflow-x-auto"
        style={{ background: CARD, border: '1px solid rgba(255,255,255,0.07)' }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex-shrink-0"
              style={{
                background: active ? `${ORANGE}15` : 'transparent',
                color: active ? ORANGE : 'rgba(255,255,255,0.4)',
                border: active ? `1px solid ${ORANGE}30` : '1px solid transparent',
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