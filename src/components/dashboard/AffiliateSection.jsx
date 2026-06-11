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
    <div className="mt-12">
      {/* Affiliate Program Banner */}
      <div className="relative rounded-2xl overflow-hidden"
        style={{ background: '#CCFF00', border: '1px solid rgba(0,0,0,0.1)' }}>
        {/* Ribbon */}
        <div className="absolute top-0 right-0 z-10">
          <div className="px-4 py-2 text-[10px] font-bold text-white uppercase tracking-wider"
            style={{ 
              background: '#FF4500',
              clipPath: 'polygon(10% 0%, 100% 0%, 100% 100%, 0% 100%)',
              borderRadius: '0 0 0 8px'
            }}>
            Partner Program
          </div>
        </div>

        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5" style={{ color: '#1a1a1a' }} />
              <h2 className="text-xl font-bold text-black">Affiliate Program</h2>
            </div>
            <p className="text-sm text-gray-700 max-w-xl mx-auto">
              Earn competitive commissions on challenge purchases and funded trader payouts
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="rounded-xl p-4 text-center"
                  style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(0,0,0,0.05)' }}>
                  <div className="flex items-center justify-center gap-1.5 mb-2">
                    <Icon className="w-3.5 h-3.5" style={{ color: s.color }} />
                    <span className="text-[10px] font-medium text-gray-800">{s.label}</span>
                  </div>
                  <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
                </div>
              );
            })}
          </div>

          {/* Tiers */}
          <div className="mb-6">
            <div className="text-center mb-4">
              <h3 className="text-sm font-bold text-black mb-1">Commission Tiers</h3>
              <p className="text-xs text-gray-600">Scale your earnings as your network grows</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {tiers.map((t) => (
                <div key={t.traders} className="rounded-xl p-4 border text-center"
                  style={{ background: 'rgba(255,255,255,0.4)', borderColor: 'rgba(0,0,0,0.08)' }}>
                  <div className="text-[10px] text-gray-700 font-medium mb-1.5">{t.traders} traders</div>
                  <div className="text-3xl font-bold mb-1" style={{ color: t.color }}>{t.rate}</div>
                  <div className="text-xs font-bold text-black">{t.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Examples */}
          <div>
            <h3 className="text-sm font-bold text-center text-black mb-4">How You Earn</h3>
            <div className="grid md:grid-cols-3 gap-3">
              {examples.map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.scenario} className="rounded-xl p-4"
                    style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(0,0,0,0.06)' }}>
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(0,0,0,0.08)', border: `1px solid ${card.color}30` }}>
                        <Icon className="w-4 h-4" style={{ color: card.color }} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-black truncate">{card.scenario}</div>
                        <div className="text-[10px] text-gray-600">{card.rate} rate</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg"
                      style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,0,0,0.05)' }}>
                      <div>
                        <div className="text-[9px] text-gray-600 mb-0.5">Amount</div>
                        <div className="text-xs font-bold text-black">{card.amount}</div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
                      <div className="text-right">
                        <div className="text-[9px] text-gray-600 mb-0.5">You Earn</div>
                        <div className="text-base font-bold" style={{ color: card.color }}>{card.commission}</div>
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
        style={{ background: '#CCFF00', border: '1px solid rgba(0,0,0,0.1)' }}>
        {/* Ribbon */}
        <div className="absolute top-0 right-0 z-10">
          <div className="px-4 py-2 text-[10px] font-bold text-white uppercase tracking-wider"
            style={{ 
              background: '#FF4500',
              clipPath: 'polygon(10% 0%, 100% 0%, 100% 100%, 0% 100%)',
              borderRadius: '0 0 0 8px'
            }}>
            Partners Only
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 p-6">
          {/* Left Column */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.08)' }}>
                <TrendingUp className="w-5 h-5" style={{ color: '#1a1a1a' }} />
              </div>
              <div>
                <div className="text-[9px] font-bold text-gray-600 uppercase tracking-wider">3-Level Structure</div>
                <h3 className="text-lg font-bold text-black">Multi-Level Commissions</h3>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-4">Earn from three levels of referrals. Build depth, earn passively.</p>
            <div className="space-y-2">
              {[
                { lvl: 'Level 1', rate: '8%', label: 'Direct referrals', color: '#FF4500' },
                { lvl: 'Level 2', rate: '2%', label: 'Sub-referrals', color: '#3b82f6' },
                { lvl: 'Level 3', rate: '1%', label: 'Third level', color: '#a855f7' },
              ].map((l) => (
                <div key={l.lvl} className="flex items-center gap-3 rounded-lg p-2.5"
                  style={{ background: 'rgba(255,255,255,0.5)' }}>
                  <div className="w-12 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{ background: l.color, color: '#fff' }}>{l.rate}</div>
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
            <div className="rounded-xl p-5"
              style={{ background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(0,0,0,0.05)' }}>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.08)' }}>
                  <Shield className="w-5 h-5" style={{ color: '#1a1a1a' }} />
                </div>
                <div>
                  <div className="text-base font-bold text-black">Free to Join</div>
                  <div className="text-xs text-gray-700">No minimum requirements</div>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                {['Instant dashboard access', 'Real-time tracking', 'Automated payouts'].map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-800">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#FF4500' }} />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => onNavigate?.('affiliate')}
                className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
                style={{ background: '#FF4500', boxShadow: '0 4px 14px rgba(255,69,0,0.35)' }}>
                Join Affiliate Program →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center mt-6">
        <button onClick={() => onNavigate?.('affiliate')}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
          style={{ background: '#FF4500', boxShadow: '0 4px 16px rgba(255,69,0,0.35)' }}>
          <Users className="w-4 h-4" />
          Access Your Affiliate Dashboard
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}