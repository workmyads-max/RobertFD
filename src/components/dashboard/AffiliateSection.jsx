import React from 'react';
import { ArrowRight, Shield, Zap, Award, Users, TrendingUp, DollarSign, Network } from 'lucide-react';

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
    <div className="mt-12 space-y-6">
      {/* Affiliate Program Banner */}
      <div className="relative rounded-2xl overflow-hidden"
        style={{ background: '#CCFF00', border: '1px solid rgba(0,0,0,0.08)' }}>
        {/* Ribbon */}
        <div className="absolute top-0 right-0 z-10">
          <div className="px-5 py-2.5 text-[10px] font-bold text-white uppercase tracking-wider"
            style={{ 
              background: '#FF4500',
              clipPath: 'polygon(10% 0%, 100% 0%, 100% 100%, 0% 100%)',
              borderRadius: '0 0 0 10px'
            }}>
            Partner Program
          </div>
        </div>

        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.06)' }}>
                <TrendingUp className="w-5 h-5" style={{ color: '#1a1a1a' }} />
              </div>
              <h2 className="text-2xl font-bold text-black">Affiliate Program</h2>
            </div>
            <p className="text-sm text-gray-700 max-w-2xl mx-auto leading-relaxed">
              Earn competitive commissions on challenge purchases and funded trader payouts
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="rounded-xl p-5 text-center"
                  style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,0,0,0.04)' }}>
                  <div className="flex items-center justify-center gap-2 mb-2.5">
                    <Icon className="w-4 h-4" style={{ color: s.color }} />
                    <span className="text-[11px] font-semibold text-gray-800">{s.label}</span>
                  </div>
                  <div className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</div>
                </div>
              );
            })}
          </div>

          {/* Tiers */}
          <div className="mb-8">
            <div className="text-center mb-6">
              <h3 className="text-sm font-bold text-black mb-1.5">Commission Tiers</h3>
              <p className="text-xs text-gray-600">Scale your earnings as your network grows</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {tiers.map((t) => (
                <div key={t.traders} className="rounded-xl p-5 border text-center"
                  style={{ background: 'rgba(255,255,255,0.5)', borderColor: 'rgba(0,0,0,0.06)' }}>
                  <div className="text-[10px] text-gray-700 font-semibold mb-2">{t.traders} traders</div>
                  <div className="text-4xl font-bold mb-1.5" style={{ color: t.color }}>{t.rate}</div>
                  <div className="text-xs font-bold text-black">{t.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Examples */}
          <div>
            <h3 className="text-sm font-bold text-center text-black mb-6">How You Earn</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {examples.map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.scenario} className="rounded-xl p-5"
                    style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,0,0,0.05)' }}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(0,0,0,0.06)', border: `1px solid ${card.color}25` }}>
                        <Icon className="w-5 h-5" style={{ color: card.color }} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-black truncate">{card.scenario}</div>
                        <div className="text-[10px] text-gray-600">{card.rate} rate</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.04)' }}>
                      <div>
                        <div className="text-[9px] font-semibold text-gray-600 mb-1 uppercase tracking-wide">Amount</div>
                        <div className="text-sm font-bold text-black">{card.amount}</div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <div className="text-right">
                        <div className="text-[9px] font-semibold text-gray-600 mb-1 uppercase tracking-wide">You Earn</div>
                        <div className="text-lg font-bold" style={{ color: card.color }}>{card.commission}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Level Banner */}
      <div className="relative rounded-2xl overflow-hidden"
        style={{ background: '#CCFF00', border: '1px solid rgba(0,0,0,0.08)' }}>
        {/* Ribbon */}
        <div className="absolute top-0 right-0 z-10">
          <div className="px-5 py-2.5 text-[10px] font-bold text-white uppercase tracking-wider"
            style={{ 
              background: '#FF4500',
              clipPath: 'polygon(10% 0%, 100% 0%, 100% 100%, 0% 100%)',
              borderRadius: '0 0 0 10px'
            }}>
            Partners Only
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 p-8">
          {/* Left Column */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.06)' }}>
                <TrendingUp className="w-6 h-6" style={{ color: '#1a1a1a' }} />
              </div>
              <div>
                <div className="text-[9px] font-bold text-gray-600 uppercase tracking-wider">3-Level Structure</div>
                <h3 className="text-lg font-bold text-black">Multi-Level Commissions</h3>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-5 leading-relaxed">Earn from three levels of referrals. Build depth, earn passively.</p>
            <div className="space-y-2.5">
              {[
                { lvl: 'Level 1', rate: '8%', label: 'Direct referrals', color: '#FF4500' },
                { lvl: 'Level 2', rate: '2%', label: 'Sub-referrals', color: '#3b82f6' },
                { lvl: 'Level 3', rate: '1%', label: 'Third level', color: '#a855f7' },
              ].map((l) => (
                <div key={l.lvl} className="flex items-center gap-3.5 rounded-xl p-3"
                  style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,0,0,0.05)' }}>
                  <div className="w-14 h-9 rounded-lg flex items-center justify-center font-bold text-base flex-shrink-0"
                    style={{ background: l.color, color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>{l.rate}</div>
                  <div>
                    <div className="text-sm font-bold text-black">{l.lvl}</div>
                    <div className="text-[11px] text-gray-600">{l.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - CTA */}
          <div className="flex flex-col justify-center">
            <div className="rounded-xl p-6"
              style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(0,0,0,0.06)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.06)' }}>
                  <Shield className="w-6 h-6" style={{ color: '#1a1a1a' }} />
                </div>
                <div>
                  <div className="text-base font-bold text-black">Free to Join</div>
                  <div className="text-xs text-gray-700">No minimum requirements</div>
                </div>
              </div>
              <div className="space-y-3 mb-6">
                {['Instant dashboard access', 'Real-time tracking', 'Automated payouts'].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-gray-800">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: '#FF4500' }} />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => onNavigate?.('affiliate')}
                className="w-full py-4.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
                style={{ background: '#FF4500', boxShadow: '0 4px 18px rgba(255,69,0,0.35)' }}>
                Access Your Affiliate Dashboard →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}