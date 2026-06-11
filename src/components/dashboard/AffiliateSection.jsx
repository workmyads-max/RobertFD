import React from 'react';
import { ArrowRight, Shield, Zap, Award, Users } from 'lucide-react';

export default function AffiliateSection({ onNavigate }) {
  const stats = [
    { label: 'Total Paid to Partners', value: '$847K+', color: '#22c55e' },
    { label: 'Active Partners', value: '2,840+', color: '#f97316' },
    { label: 'Avg Monthly Earnings', value: '$3,200', color: '#eab308' },
    { label: 'Top Commission Rate', value: '25%', color: '#a855f7' },
  ];

  const tiers = [
    { traders: '0-9', rate: '7%', label: 'Starter', color: '#3b82f6' },
    { traders: '10+', rate: '11%', label: 'Silver', color: '#a855f7' },
    { traders: '25+', rate: '17%', label: 'Gold', color: '#f97316' },
    { traders: '50+', rate: '25%', label: 'Platinum', color: '#f97316' },
  ];

  const examples = [
    {
      scenario: 'Challenge Purchase',
      amount: '$517',
      commission: '+$41.36',
      rate: '8%',
      color: '#f97316',
      icon: Zap,
      desc: 'When your referral buys a $100K challenge',
    },
    {
      scenario: 'Funded Trader Payout',
      amount: '$10K',
      commission: '+$2,500',
      rate: '25%',
      color: '#22c55e',
      icon: Award,
      desc: 'Platinum partners earn on trader profit withdrawals',
    },
    {
      scenario: 'Level 2 Referral',
      amount: '$350',
      commission: '+$7.00',
      rate: '2%',
      color: '#3b82f6',
      icon: Users,
      desc: 'Passive income from your network\'s referrals',
    },
  ];

  return (
    <div className="mt-8 space-y-6">
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-white mb-2">Affiliate Program</h2>
        <p className="text-sm text-gray-400 max-w-2xl mx-auto">
          Build your income stream by referring traders to our platform. Earn commissions on challenge sales and funded trader payouts.
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-lg p-5 border"
            style={{ background: '#18181b', borderColor: '#27272a' }}
          >
            <div className="text-3xl font-bold mb-2" style={{ color: s.color }}>
              {s.value}
            </div>
            <div className="text-xs text-gray-400 font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Commission Tiers */}
      <div>
        <div className="text-center mb-5">
          <h3 className="text-base font-semibold text-white mb-1">Commission Tiers</h3>
          <p className="text-xs text-gray-500">Your payout reward rate grows with active funded traders</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {tiers.map((t) => (
            <div
              key={t.traders}
              className="rounded-lg p-5 text-center border"
              style={{ background: '#18181b', borderColor: '#27272a' }}
            >
              <div className="text-xs text-gray-500 font-medium mb-2">{t.traders} traders</div>
              <div className="text-4xl font-bold mb-1" style={{ color: t.color }}>{t.rate}</div>
              <div className="text-sm font-medium text-white">{t.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* How You Earn */}
      <div>
        <h3 className="text-base font-semibold text-center text-white mb-5">How You Earn</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {examples.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.scenario}
                className="rounded-lg p-5 border"
                style={{ background: '#18181b', borderColor: '#27272a' }}
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0"
                    style={{ background: `${card.color}15` }}>
                    <Icon className="w-4 h-4" style={{ color: card.color }} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-white truncate">{card.scenario}</div>
                    <div className="text-[10px] text-gray-500">{card.rate} commission</div>
                  </div>
                </div>
                <div className="text-xs text-gray-400 mb-4 leading-relaxed">{card.desc}</div>
                <div className="flex items-center justify-between p-3 rounded-md"
                  style={{ background: '#111113', border: '1px solid #27272a' }}>
                  <div>
                    <div className="text-[9px] font-medium text-gray-500 mb-0.5">Amount</div>
                    <div className="text-sm font-semibold text-white">{card.amount}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
                  <div className="text-right">
                    <div className="text-[9px] font-medium text-gray-500 mb-0.5">You Earn</div>
                    <div className="text-base font-bold" style={{ color: card.color }}>{card.commission}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Multi-Level Commissions */}
      <div className="rounded-lg p-6 border"
        style={{ background: '#18181b', borderColor: '#3f2d29' }}>
        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <div className="text-[10px] font-semibold text-orange-500 uppercase tracking-wider mb-2">
              3-Level Structure
            </div>
            <h3 className="text-lg font-semibold text-white mb-3">
              Multi-Level Commissions
            </h3>
            <p className="text-sm text-gray-400 mb-5 leading-relaxed">
              Earn from three levels of referrals. Build depth, earn passively.
            </p>
            <div className="space-y-2">
              {[
                { lvl: 'Level 1', rate: '8%', label: 'Direct referrals', color: '#f97316' },
                { lvl: 'Level 2', rate: '2%', label: 'Sub-referrals', color: '#3b82f6' },
                { lvl: 'Level 3', rate: '1%', label: 'Third level', color: '#a855f7' },
              ].map((l) => (
                <div key={l.lvl} className="flex items-center gap-3 rounded-md p-3 border"
                  style={{ background: '#111113', borderColor: '#27272a' }}>
                  <div className="w-12 h-8 rounded-md flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{ background: `${l.color}15`, color: l.color }}>{l.rate}</div>
                  <div>
                    <div className="text-xs font-medium text-white">{l.lvl}</div>
                    <div className="text-[10px] text-gray-500">{l.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center">
            <div className="rounded-lg p-5 w-full border"
              style={{ background: '#111113', borderColor: '#27272a' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                  <Shield className="w-5 h-5" style={{ color: '#22c55e' }} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white">Free to Join</div>
                  <div className="text-xs text-gray-500">No minimum requirements</div>
                </div>
              </div>
              <div className="space-y-2">
                {['Instant dashboard access', 'Real-time tracking', 'Automated payouts'].map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <button
          onClick={() => onNavigate?.('affiliate')}
          className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          style={{
            background: '#f97316',
            boxShadow: '0 4px 14px rgba(249,115,22,0.3)',
          }}
        >
          <Users className="w-4 h-4" />
          <span>Access Your Affiliate Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}