import React from 'react';
import { ArrowRight, Shield, Zap, Award, Users, TrendingUp, DollarSign, Network } from 'lucide-react';

export default function AffiliateSection({ onNavigate }) {
  const stats = [
    { label: 'Total Paid to Partners', value: '$847K+', color: '#10b981', sub: 'and growing' },
    { label: 'Active Partners', value: '2,840+', color: '#f97316', sub: 'worldwide' },
    { label: 'Avg Monthly Earnings', value: '$3,200', color: '#eab308', sub: 'per partner' },
    { label: 'Top Commission Rate', value: '25%', color: '#a855f7', sub: 'payout reward' },
  ];

  const tiers = [
    { traders: '0-9', rate: '7%', label: 'Starter', color: '#3b82f6', desc: 'Perfect start' },
    { traders: '10-24', rate: '11%', label: 'Silver', color: '#94a3b8', desc: 'Growing strong' },
    { traders: '25-49', rate: '17%', label: 'Gold', color: '#fbbf24', desc: 'Serious income' },
    { traders: '50+', rate: '25%', label: 'Platinum', color: '#f97316', desc: 'Maximum rewards' },
  ];

  const examples = [
    {
      scenario: 'Challenge Purchase',
      amount: '$517',
      commission: '+$41.36',
      rate: '8%',
      color: '#f97316',
      icon: Zap,
      desc: 'Earn instantly when your referral purchases any challenge',
    },
    {
      scenario: 'Funded Trader Payout',
      amount: '$10,000',
      commission: '+$2,500',
      rate: '25%',
      color: '#10b981',
      icon: Award,
      desc: 'Recurring revenue from funded trader profit splits',
    },
    {
      scenario: 'Level 2 Referral',
      amount: '$350',
      commission: '+$7.00',
      rate: '2%',
      color: '#3b82f6',
      icon: Network,
      desc: 'Build depth and earn from your network growth',
    },
  ];

  return (
    <div className="mt-12 space-y-10">
      {/* Header */}
      <div className="text-center mb-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4"
          style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}>
          <TrendingUp className="w-3.5 h-3.5" style={{ color: '#f97316' }} />
          <span className="text-[10px] font-semibold text-orange-400 uppercase tracking-wider">Partner Program</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">Affiliate Program</h2>
        <p className="text-sm text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Build a sustainable income stream by referring traders. Earn competitive commissions on challenge purchases and funded trader payouts.
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className="group rounded-2xl p-5 border transition-all duration-500 hover:border-white/15 hover:shadow-lg hover:shadow-black/20"
            style={{ 
              background: 'linear-gradient(145deg, #0f0f11, #0a0a0c)',
              borderColor: 'rgba(255,255,255,0.08)',
              animationDelay: `${i * 100}ms`
            }}
          >
            <div className="text-3xl font-bold mb-2 tracking-tight" style={{ color: s.color }}>
              {s.value}
            </div>
            <div className="text-xs text-gray-300 font-medium mb-0.5">{s.label}</div>
            <div className="text-[10px] text-gray-500">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Commission Tiers */}
      <div>
        <div className="text-center mb-7">
          <h3 className="text-base font-semibold text-white mb-2">Commission Tiers</h3>
          <p className="text-xs text-gray-500">Scale your earnings as your network grows</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {tiers.map((t, i) => (
            <div
              key={t.traders}
              className="group rounded-2xl p-6 text-center border transition-all duration-500 hover:border-white/15 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-1"
              style={{ 
                background: 'linear-gradient(145deg, #0f0f11, #0a0a0c)',
                borderColor: 'rgba(255,255,255,0.08)',
                animationDelay: `${i * 100}ms`
              }}
            >
              <div className="text-[10px] text-gray-500 font-semibold mb-2 uppercase tracking-wider">{t.traders} traders</div>
              <div className="text-4xl font-bold mb-2 tracking-tight" style={{ color: t.color }}>{t.rate}</div>
              <div className="text-sm font-semibold text-white mb-1">{t.label}</div>
              <div className="text-[10px] text-gray-500">{t.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* How You Earn */}
      <div>
        <h3 className="text-base font-semibold text-center text-white mb-7">How You Earn</h3>
        <div className="grid md:grid-cols-3 gap-5">
          {examples.map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={card.scenario}
                className="group rounded-2xl p-6 border transition-all duration-500 hover:border-white/15 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-1"
                style={{ 
                  background: 'linear-gradient(145deg, #0f0f11, #0a0a0c)',
                  borderColor: 'rgba(255,255,255,0.08)',
                  animationDelay: `${i * 100}ms`
                }}
              >
                <div className="flex items-center gap-3.5 mb-5">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
                    style={{ background: `${card.color}12`, border: `1px solid ${card.color}25` }}>
                    <Icon className="w-5.5 h-5.5" style={{ color: card.color }} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{card.scenario}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{card.rate} commission rate</div>
                  </div>
                </div>
                <div className="text-xs text-gray-400 mb-6 leading-relaxed">{card.desc}</div>
                <div className="flex items-center justify-between p-4 rounded-xl transition-all duration-300 group-hover:bg-white/[0.03]"
                  style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <div className="text-[9px] font-medium text-gray-500 mb-1 uppercase tracking-wide">Amount</div>
                    <div className="text-sm font-semibold text-white">{card.amount}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-600 flex-shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
                  <div className="text-right">
                    <div className="text-[9px] font-medium text-gray-500 mb-1 uppercase tracking-wide">You Earn</div>
                    <div className="text-lg font-bold tracking-tight" style={{ color: card.color }}>{card.commission}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Multi-Level Commissions */}
      <div className="rounded-xl p-5 border"
        style={{ 
          background: '#0a0a0a',
          borderColor: '#2a2a2a'
        }}>
        <div className="grid lg:grid-cols-2 gap-5">
          <div>
            <div className="flex items-center gap-2 mb-3.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}>
                <TrendingUp className="w-3.5 h-3.5" style={{ color: '#f97316' }} />
              </div>
              <div>
                <div className="text-[9px] font-semibold text-orange-500 uppercase tracking-wider mb-0.5">
                  3-Level Structure
                </div>
                <h3 className="text-sm font-semibold text-white">
                  Multi-Level Commissions
                </h3>
              </div>
            </div>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              Earn from three levels of referrals. Build depth, earn passively.
            </p>
            <div className="space-y-2">
              {[
                { lvl: 'Level 1', rate: '8%', label: 'Direct referrals', color: '#f97316' },
                { lvl: 'Level 2', rate: '2%', label: 'Sub-referrals', color: '#3b82f6' },
                { lvl: 'Level 3', rate: '1%', label: 'Third level', color: '#a855f7' },
              ].map((l, i) => (
                <div key={l.lvl} className="flex items-center gap-2.5 rounded-lg p-2.5 border"
                  style={{ background: '#111113', borderColor: '#27272a' }}>
                  <div className="w-12 h-8 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0"
                    style={{ background: `${l.color}15`, border: `1px solid ${l.color}25`, color: l.color }}>{l.rate}</div>
                  <div>
                    <div className="text-xs font-medium text-white">{l.lvl}</div>
                    <div className="text-[10px] text-gray-500">{l.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-start">
            <div className="rounded-lg p-4 w-full border"
              style={{ background: '#111113', borderColor: '#27272a' }}>
              <div className="flex items-center gap-2.5 mb-3.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <Shield className="w-4 h-4" style={{ color: '#10b981' }} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white">Free to Join</div>
                  <div className="text-xs text-gray-500">No minimum requirements</div>
                </div>
              </div>
              <div className="space-y-2">
                {['Instant dashboard access', 'Real-time tracking', 'Automated payouts'].map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#f97316' }} />
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center pt-3">
        <button
          onClick={() => onNavigate?.('affiliate')}
          className="group inline-flex items-center gap-2.5 px-9 py-4 rounded-xl text-sm font-semibold text-white transition-all duration-500 hover:shadow-2xl hover:shadow-orange-500/20 hover:-translate-y-1"
          style={{
            background: 'linear-gradient(135deg, #f97316, #fb923c)',
            boxShadow: '0 4px 16px rgba(249,115,22,0.4)',
          }}
        >
          <Users className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
          <span>Access Your Affiliate Dashboard</span>
          <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
}