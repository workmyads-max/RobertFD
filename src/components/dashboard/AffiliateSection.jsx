import React from 'react';
import { ArrowRight, Shield, Zap, Award, Users, TrendingUp, DollarSign, Network } from 'lucide-react';
import LivePayouts from './LivePayouts';

export default function AffiliateSection({ onNavigate }) {
  const stats = [
    { label: 'Total Paid', value: '$847K+', icon: DollarSign, color: '#10b981' },
    { label: 'Active Partners', value: '2,840+', icon: Users, color: '#f97316' },
    { label: 'Avg Monthly', value: '$3,200', icon: TrendingUp, color: '#eab308' },
    { label: 'Top Rate', value: '25%', icon: Award, color: '#a855f7' },
  ];

  const tiers = [
    { traders: '0-9', rate: '7%', label: 'Starter', color: '#3b82f6' },
    { traders: '10-24', rate: '11%', label: 'Silver', color: '#94a3b8' },
    { traders: '25-49', rate: '17%', label: 'Gold', color: '#fbbf24' },
    { traders: '50+', rate: '25%', label: 'Platinum', color: '#f97316' },
  ];

  const examples = [
    { scenario: 'Challenge Purchase', amount: '$517', commission: '+$41.36', rate: '8%', color: '#f97316', icon: Zap },
    { scenario: 'Funded Payout', amount: '$10,000', commission: '+$2,500', rate: '25%', color: '#10b981', icon: Award },
    { scenario: 'Level 2 Referral', amount: '$350', commission: '+$7.00', rate: '2%', color: '#3b82f6', icon: Network },
  ];

  return (
    <div className="mt-12 space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-3"
          style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.15)' }}>
          <TrendingUp className="w-3.5 h-3.5" style={{ color: '#f97316' }} />
          <span className="text-[10px] font-semibold text-orange-400 uppercase tracking-wider">Partner Program</span>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Affiliate Program</h2>
        <p className="text-sm text-gray-400 max-w-xl mx-auto">
          Earn competitive commissions on challenge purchases and funded trader payouts
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl p-4 border text-center"
              style={{ background: '#0f0f11', borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="flex items-center justify-center gap-1.5 mb-2">
                <Icon className="w-3.5 h-3.5" style={{ color: s.color }} />
                <span className="text-[10px] text-gray-400 font-medium">{s.label}</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            </div>
          );
        })}
      </div>

      {/* Tiers */}
      <div>
        <div className="text-center mb-4">
          <h3 className="text-sm font-semibold text-white mb-1">Commission Tiers</h3>
          <p className="text-xs text-gray-500">Scale your earnings as your network grows</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {tiers.map((t) => (
            <div key={t.traders} className="rounded-xl p-4 border text-center"
              style={{ background: '#0f0f11', borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="text-[10px] text-gray-500 font-medium mb-1.5">{t.traders} traders</div>
              <div className="text-3xl font-bold mb-1" style={{ color: t.color }}>{t.rate}</div>
              <div className="text-xs font-semibold text-white">{t.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Examples */}
      <div>
        <h3 className="text-sm font-semibold text-center text-white mb-4">How You Earn</h3>
        <div className="grid md:grid-cols-3 gap-3">
          {examples.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.scenario} className="rounded-xl p-4 border"
                style={{ background: '#0f0f11', borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${card.color}10`, border: `1px solid ${card.color}20` }}>
                    <Icon className="w-4 h-4" style={{ color: card.color }} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white truncate">{card.scenario}</div>
                    <div className="text-[10px] text-gray-500">{card.rate} rate</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg"
                  style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <div className="text-[9px] text-gray-500 mb-0.5">Amount</div>
                    <div className="text-xs font-semibold text-white">{card.amount}</div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-600" />
                  <div className="text-right">
                    <div className="text-[9px] text-gray-500 mb-0.5">You Earn</div>
                    <div className="text-base font-bold" style={{ color: card.color }}>{card.commission}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Multi-Level */}
      <div className="rounded-xl p-4 border"
        style={{ background: '#0a0a0a', borderColor: '#2a2a2a' }}>
        <div className="grid lg:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}>
                <TrendingUp className="w-3.5 h-3.5" style={{ color: '#f97316' }} />
              </div>
              <div>
                <div className="text-[9px] font-semibold text-orange-500 uppercase">3-Level Structure</div>
                <h3 className="text-sm font-semibold text-white">Multi-Level Commissions</h3>
              </div>
            </div>
            <p className="text-xs text-gray-400 mb-3">Earn from three levels of referrals. Build depth, earn passively.</p>
            <div className="space-y-1.5">
              {[
                { lvl: 'Level 1', rate: '8%', label: 'Direct referrals', color: '#f97316' },
                { lvl: 'Level 2', rate: '2%', label: 'Sub-referrals', color: '#3b82f6' },
                { lvl: 'Level 3', rate: '1%', label: 'Third level', color: '#a855f7' },
              ].map((l) => (
                <div key={l.lvl} className="flex items-center gap-2.5 rounded-lg p-2 border"
                  style={{ background: '#111113', borderColor: '#27272a' }}>
                  <div className="w-11 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0"
                    style={{ background: `${l.color}15`, border: `1px solid ${l.color}25`, color: l.color }}>{l.rate}</div>
                  <div>
                    <div className="text-xs font-medium text-white">{l.lvl}</div>
                    <div className="text-[10px] text-gray-500">{l.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-stretch">
            <div className="rounded-lg p-4 w-full border flex flex-col"
              style={{ background: '#111113', borderColor: '#27272a' }}>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <Shield className="w-4 h-4" style={{ color: '#10b981' }} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Free to Join</div>
                  <div className="text-xs text-gray-500">No minimum requirements</div>
                </div>
              </div>
              <div className="space-y-2 mt-auto">
                {['Instant dashboard access', 'Real-time tracking', 'Automated payouts'].map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#f97316' }} />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <button onClick={() => onNavigate?.('affiliate')}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-white transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)', boxShadow: '0 4px 14px rgba(249,115,22,0.35)' }}>
          <Users className="w-4 h-4" />
          Access Affiliate Dashboard
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Live Payouts Section */}
      <LivePayouts />
    </div>
  );
}