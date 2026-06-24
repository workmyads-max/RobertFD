import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Settings, DollarSign, BarChart3, Shield,
  Edit3, Save, X, TrendingUp, Wallet
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const GLOBAL_DEFAULTS = {
  l1_rate: 8, l2_rate: 2, l3_rate: 1,
  payout_tier_0_rate: 7, payout_tier_10_rate: 11,
  payout_tier_25_rate: 17, payout_tier_50_rate: 25,
  min_withdrawal: 50, withdrawal_fee: 0,
};

const WD_STATUS = {
  pending: { color: '#f59e0b', label: 'Pending' },
  approved: { color: '#60a5fa', label: 'Approved' },
  processing: { color: '#a78bfa', label: 'Processing' },
  paid: { color: '#10b981', label: 'Paid' },
  rejected: { color: '#ef4444', label: 'Rejected' },
};

function RateInput({ label, value, onChange, suffix = '%', color = '#FF5C00' }) {
  return (
    <div>
      <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest block mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input type="number" value={value} onChange={e => onChange(parseFloat(e.target.value))} step="0.5" min="0" max="100"
          className="w-full px-3 py-2 rounded-xl text-sm font-mono text-foreground outline-none"
          style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${color}30` }} />
        <span className="text-sm font-bold" style={{ color }}>{suffix}</span>
      </div>
    </div>
  );
}

export default function AdminAffiliate() {
  const [activeTab, setActiveTab] = useState('settings');
  const [settings, setSettings] = useState(GLOBAL_DEFAULTS);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [customRates, setCustomRates] = useState({});
  const qc = useQueryClient();

  const { data: profiles = [] } = useQuery({
    queryKey: ['all-affiliate-profiles'],
    queryFn: () => base44.entities.AffiliateProfile.list('-total_earned', 100),
  });

  const { data: commissions = [] } = useQuery({
    queryKey: ['all-commissions'],
    queryFn: () => base44.entities.AffiliateCommission.list('-created_date', 200),
  });

  const { data: affiliateWithdrawals = [] } = useQuery({
    queryKey: ['affiliate-withdrawals-admin'],
    queryFn: () => base44.entities.WithdrawalRequest.filter({ account_id: 'affiliate' }, '-created_date', 100),
  });

  const { data: globalSettings = [] } = useQuery({
    queryKey: ['affiliate-settings'],
    queryFn: async () => {
      const s = await base44.entities.AffiliateSettings.filter({ setting_key: 'global_config' });
      if (s.length > 0) { setSettings({ ...GLOBAL_DEFAULTS, ...s[0] }); }
      return s;
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AffiliateProfile.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['all-affiliate-profiles']); setEditingProfile(null); },
  });

  const updateCommissionMutation = useMutation({
    mutationFn: ({ id, new_status }) =>
      base44.functions.invoke('adminApproveCommission', { commission_id: id, new_status }),
    onSuccess: () => qc.invalidateQueries(['all-commissions']),
  });

  // Affiliate payout requests are approved/rejected via the same backend function
  // as trader payouts — it detects account_id='affiliate', pays 100% (no profit
  // split) minus the 5% fee, and settles the covered commissions as paid.
  const affiliateWithdrawalMutation = useMutation({
    mutationFn: async ({ id, action }) => {
      const res = await base44.functions.invoke('adminApproveWithdrawal', {
        withdrawal_id: id,
        ...(action === 'reject' ? { action: 'reject' } : {}),
      });
      if (res.data?.error) throw new Error(res.data.error);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries(['affiliate-withdrawals-admin']);
      qc.invalidateQueries(['all-commissions']);
      qc.invalidateQueries(['all-affiliate-profiles']);
    },
  });

  const saveSettings = async () => {
    const existing = globalSettings[0];
    if (existing) {
      await base44.entities.AffiliateSettings.update(existing.id, { ...settings });
    } else {
      await base44.entities.AffiliateSettings.create({ setting_key: 'global_config', ...settings });
    }
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
    qc.invalidateQueries(['affiliate-settings']);
  };

  const totalCommissions = commissions.reduce((s, c) => s + (c.commission_amount || 0), 0);
  const pendingPayout = commissions.filter(c => c.status === 'pending').reduce((s, c) => s + (c.commission_amount || 0), 0);
  const paidOut = commissions.filter(c => c.status === 'paid').reduce((s, c) => s + (c.commission_amount || 0), 0);
  const purchaseComm = commissions.filter(c => c.commission_type === 'challenge_purchase').reduce((s, c) => s + (c.commission_amount || 0), 0);
  const payoutComm = commissions.filter(c => c.commission_type === 'payout_reward').reduce((s, c) => s + (c.commission_amount || 0), 0);

  const TABS = [
    { id: 'settings', label: 'Global Settings', icon: Settings },
    { id: 'affiliates', label: 'Affiliates', icon: Users },
    { id: 'commissions', label: 'Commissions', icon: DollarSign },
    { id: 'withdrawals', label: 'Withdrawal Requests', icon: Wallet },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,92,0,0.15)' }}>
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-black text-foreground">Affiliate & IB Management</h2>
          <p className="text-xs text-muted-foreground font-mono">Enterprise partner program controls</p>
        </div>
      </div>

      {/* KPI bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total Affiliates', value: profiles.length, color: '#FF5C00', prefix: '' },
          { label: 'Total Commissions', value: totalCommissions, color: '#10b981', prefix: '$' },
          { label: 'Pending Payout', value: pendingPayout, color: '#f59e0b', prefix: '$' },
          { label: 'Purchase Comm.', value: purchaseComm, color: '#60a5fa', prefix: '$' },
          { label: 'Payout Rewards', value: payoutComm, color: '#CCFF00', prefix: '$' },
        ].map(k => (
          <div key={k.label} className="rounded-2xl p-4" style={{ background: `${k.color}0a`, border: `1px solid ${k.color}20` }}>
            <div className="text-[9px] font-mono uppercase tracking-widest mb-1 text-muted-foreground">{k.label}</div>
            <div className="text-lg font-black" style={{ color: k.color }}>
              {k.prefix}{typeof k.value === 'number' ? (k.prefix === '$' ? k.value.toFixed(2) : k.value) : k.value}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl overflow-x-auto"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap"
              style={{
                background: active ? 'rgba(255,92,0,0.15)' : 'transparent',
                color: active ? '#FF5C00' : 'hsl(var(--muted-foreground))',
                border: active ? '1px solid rgba(255,92,0,0.3)' : '1px solid transparent',
              }}>
              <Icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

          {/* GLOBAL SETTINGS */}
          {activeTab === 'settings' && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="text-sm font-bold mb-5 text-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" /> Commission Rates
                </div>
                <div className="space-y-4">
                  <RateInput label="Level 1 — Direct Sales" value={settings.l1_rate} onChange={v => setSettings(s => ({ ...s, l1_rate: v }))} color="#FF5C00" />
                  <RateInput label="Level 2" value={settings.l2_rate} onChange={v => setSettings(s => ({ ...s, l2_rate: v }))} color="#60a5fa" />
                  <RateInput label="Level 3" value={settings.l3_rate} onChange={v => setSettings(s => ({ ...s, l3_rate: v }))} color="#a78bfa" />
                </div>
              </div>

              <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="text-sm font-bold mb-5 text-foreground flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" /> Payout Reward Scaling
                </div>
                <div className="space-y-4">
                  <RateInput label="Tier 1 (0–9 live traders)" value={settings.payout_tier_0_rate} onChange={v => setSettings(s => ({ ...s, payout_tier_0_rate: v }))} color="#60a5fa" />
                  <RateInput label="Tier 2 (10+ live traders)" value={settings.payout_tier_10_rate} onChange={v => setSettings(s => ({ ...s, payout_tier_10_rate: v }))} color="#a78bfa" />
                  <RateInput label="Tier 3 (25+ live traders)" value={settings.payout_tier_25_rate} onChange={v => setSettings(s => ({ ...s, payout_tier_25_rate: v }))} color="#fbbf24" />
                  <RateInput label="Tier 4 (50+ live traders)" value={settings.payout_tier_50_rate} onChange={v => setSettings(s => ({ ...s, payout_tier_50_rate: v }))} color="#FF5C00" />
                </div>
              </div>

              <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="text-sm font-bold mb-5 text-foreground flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" /> Withdrawal Rules
                </div>
                <div className="space-y-4">
                  <RateInput label="Minimum Withdrawal (USD)" value={settings.min_withdrawal} onChange={v => setSettings(s => ({ ...s, min_withdrawal: v }))} suffix="$" color="#10b981" />
                  <RateInput label="Withdrawal Fee (USD)" value={settings.withdrawal_fee} onChange={v => setSettings(s => ({ ...s, withdrawal_fee: v }))} suffix="$" color="#f59e0b" />
                </div>
              </div>

              <div className="flex items-end">
                <button onClick={saveSettings}
                  className="w-full py-4 rounded-xl text-sm font-bold text-white transition-all"
                  style={{
                    background: settingsSaved ? 'rgba(16,185,129,0.3)' : 'linear-gradient(90deg,#FF5C00,#cc4900)',
                    border: settingsSaved ? '1px solid rgba(16,185,129,0.5)' : 'none',
                    boxShadow: '0 4px 20px rgba(255,92,0,0.3)'
                  }}>
                  {settingsSaved ? '✓ Settings Saved!' : 'Save Global Settings'}
                </button>
              </div>
            </div>
          )}

          {/* AFFILIATES */}
          {activeTab === 'affiliates' && (
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="px-5 py-3 border-b border-white/5 text-xs font-bold"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                All Affiliate Profiles ({profiles.length})
              </div>
              {profiles.map((p) => (
                <div key={p.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  {editingProfile?.id === p.id ? (
                    <div className="p-5 space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <RateInput label="L1 Rate %" value={customRates.custom_l1_rate ?? p.custom_l1_rate ?? ''} onChange={v => setCustomRates(r => ({ ...r, custom_l1_rate: v }))} color="#FF5C00" />
                        <RateInput label="L2 Rate %" value={customRates.custom_l2_rate ?? p.custom_l2_rate ?? ''} onChange={v => setCustomRates(r => ({ ...r, custom_l2_rate: v }))} color="#60a5fa" />
                        <RateInput label="L3 Rate %" value={customRates.custom_l3_rate ?? p.custom_l3_rate ?? ''} onChange={v => setCustomRates(r => ({ ...r, custom_l3_rate: v }))} color="#a78bfa" />
                        <RateInput label="Payout Rate %" value={customRates.custom_payout_rate ?? p.custom_payout_rate ?? ''} onChange={v => setCustomRates(r => ({ ...r, custom_payout_rate: v }))} color="#CCFF00" />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => updateProfileMutation.mutate({ id: p.id, data: customRates })}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white"
                          style={{ background: 'rgba(16,185,129,0.25)', border: '1px solid rgba(16,185,129,0.4)' }}>
                          <Save className="w-3 h-3" /> Save Custom Rates
                        </button>
                        <button onClick={() => setEditingProfile(null)}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                          <X className="w-3 h-3" /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 px-5 py-3.5 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-foreground truncate">{p.user_email}</div>
                        <div className="text-[10px] font-mono text-muted-foreground">
                          Code: <span className="text-primary">{p.referral_code}</span> · {p.total_referrals || 0} referrals · {p.active_funded_traders || 0} live traders
                          {p.custom_l1_rate && <span className="ml-2 text-amber-400">Custom: L1={p.custom_l1_rate}%</span>}
                          {p.is_frozen && <span className="ml-2 text-red-400">❄ FROZEN</span>}
                          {!p.is_active && <span className="ml-2 text-red-400">DISABLED</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right hidden md:block">
                          <div className="text-sm font-bold text-emerald-400">${(p.total_earned || 0).toFixed(2)}</div>
                          <div className="text-[10px] font-mono text-muted-foreground">earned</div>
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          <button onClick={() => { setEditingProfile(p); setCustomRates({}); }}
                            className="px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all"
                            style={{ background: 'rgba(255,92,0,0.1)', color: '#FF5C00', border: '1px solid rgba(255,92,0,0.2)' }}>
                            <Edit3 className="w-3 h-3 inline mr-1" />Custom Rates
                          </button>
                          <button onClick={() => updateProfileMutation.mutate({ id: p.id, data: { is_frozen: !p.is_frozen } })}
                            className="px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all"
                            style={{
                              background: p.is_frozen ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                              color: p.is_frozen ? '#10b981' : '#ef4444',
                              border: `1px solid ${p.is_frozen ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
                            }}>
                            {p.is_frozen ? '✓ Unfreeze' : '❄ Freeze'}
                          </button>
                          <button onClick={() => updateProfileMutation.mutate({ id: p.id, data: { is_active: !p.is_active } })}
                            className="px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all"
                            style={{
                              background: p.is_active ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                              color: p.is_active ? '#ef4444' : '#10b981',
                              border: `1px solid ${p.is_active ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`,
                            }}>
                            {p.is_active ? 'Disable' : 'Enable'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* COMMISSIONS */}
          {activeTab === 'commissions' && (
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="px-5 py-3 border-b border-white/5 text-xs font-bold"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                All Commission Records ({commissions.length})
              </div>
              {commissions.slice(0, 50).map((c, i) => (
                <div key={c.id || i} className="flex items-center gap-4 px-5 py-3.5 border-b border-white/[0.03] hover:bg-white/[0.02] flex-wrap transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-foreground">{c.affiliate_email}</div>
                    <div className="text-[10px] font-mono text-muted-foreground">
                      Referred: {c.referred_email} · L{c.level} · {c.commission_type === 'payout_reward' ? '🏆 Payout' : '💼 Purchase'}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-emerald-400">${(c.commission_amount || 0).toFixed(2)}</div>
                  <div className="flex gap-1 flex-wrap">
                    {['pending', 'approved', 'paid', 'rejected'].map(st => (
                      <button key={st} onClick={() => updateCommissionMutation.mutate({ id: c.id, new_status: st })}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold capitalize transition-all"
                        style={{
                          background: c.status === st
                            ? (st === 'paid' ? 'rgba(16,185,129,0.2)' : st === 'approved' ? 'rgba(96,165,250,0.2)' : st === 'rejected' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)')
                            : 'rgba(255,255,255,0.04)',
                          color: c.status === st
                            ? (st === 'paid' ? '#10b981' : st === 'approved' ? '#60a5fa' : st === 'rejected' ? '#ef4444' : '#f59e0b')
                            : 'hsl(var(--muted-foreground))',
                          border: '1px solid rgba(255,255,255,0.08)',
                        }}>{st}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* WITHDRAWAL REQUESTS */}
          {activeTab === 'withdrawals' && (
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="px-5 py-3 border-b border-white/5 text-xs font-bold flex items-center justify-between"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <span>Affiliate Payout Requests ({affiliateWithdrawals.length})</span>
                <span className="text-[10px] font-mono text-amber-400">
                  {affiliateWithdrawals.filter(w => w.status === 'pending').length} pending
                </span>
              </div>
              {affiliateWithdrawals.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">No affiliate withdrawal requests yet.</div>
              ) : affiliateWithdrawals.map((w) => {
                const st = WD_STATUS[w.status] || WD_STATUS.pending;
                const isFinal = w.status === 'approved' || w.status === 'paid' || w.status === 'rejected';
                const net = w.net_payout ?? ((w.amount || 0) - (w.withdrawal_fee || 0));
                return (
                  <div key={w.id} className="px-5 py-4 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-foreground">{w.user_email}</div>
                        <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                          {w.method?.replace(/_/g, ' ').toUpperCase()} · {new Date(w.created_date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-mono text-primary/80 truncate" title={w.wallet_address}>💳 {w.wallet_address || '—'}</span>
                          {w.wallet_address && (
                            <button onClick={() => navigator.clipboard.writeText(w.wallet_address).catch(() => {})}
                              className="text-[9px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-muted-foreground transition-colors">Copy</button>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-emerald-400">${(w.amount || 0).toFixed(2)}</div>
                        <div className="text-[10px] font-mono text-muted-foreground">
                          fee ${(w.withdrawal_fee || 0).toFixed(2)} · net ${net.toFixed(2)}
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold capitalize"
                        style={{ background: `${st.color}15`, color: st.color, border: `1px solid ${st.color}30` }}>
                        {st.label}
                      </span>
                      <div className="flex gap-1.5">
                        <button onClick={() => affiliateWithdrawalMutation.mutate({ id: w.id, action: 'approve' })}
                          disabled={isFinal || affiliateWithdrawalMutation.isPending}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all disabled:opacity-30"
                          style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
                          ✓ Approve &amp; Pay
                        </button>
                        <button onClick={() => affiliateWithdrawalMutation.mutate({ id: w.id, action: 'reject' })}
                          disabled={w.status === 'rejected' || w.status === 'paid' || affiliateWithdrawalMutation.isPending}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all disabled:opacity-30"
                          style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                          ✕ Reject
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="text-sm font-bold mb-5 text-foreground">Commission Breakdown</div>
                <div className="space-y-4">
                  {[
                    { label: 'Total Commissions Generated', value: totalCommissions, color: '#10b981' },
                    { label: 'Challenge Purchase Commissions', value: purchaseComm, color: '#FF5C00' },
                    { label: 'Funded Payout Rewards', value: payoutComm, color: '#CCFF00' },
                    { label: 'Pending Approval', value: pendingPayout, color: '#f59e0b' },
                    { label: 'Total Paid Out', value: paidOut, color: '#60a5fa' },
                  ].map(s => (
                    <div key={s.label} className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                      <span className="text-xs text-muted-foreground">{s.label}</span>
                      <span className="text-sm font-bold" style={{ color: s.color }}>${s.value.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="text-sm font-bold mb-5 text-foreground">Top Affiliates by Earnings</div>
                <div className="space-y-3">
                  {[...profiles].sort((a, b) => (b.total_earned || 0) - (a.total_earned || 0)).slice(0, 10).map((p, i) => (
                    <div key={p.id} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black"
                        style={{
                          background: i === 0 ? 'rgba(255,92,0,0.2)' : i === 1 ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)',
                          color: i === 0 ? '#FF5C00' : 'hsl(var(--muted-foreground))'
                        }}>
                        {i + 1}
                      </div>
                      <span className="flex-1 text-xs font-mono truncate text-foreground">{p.user_email}</span>
                      <span className="text-xs font-bold text-emerald-400">${(p.total_earned || 0).toFixed(2)}</span>
                    </div>
                  ))}
                  {profiles.length === 0 && (
                    <div className="text-sm text-muted-foreground text-center py-6">No affiliate data yet</div>
                  )}
                </div>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}