import React from 'react';
import { motion } from 'framer-motion';
import { Star, Users, ArrowRight, Shield, Zap, Award } from 'lucide-react';

export default function AffiliateSection({ onNavigate }) {
  const stats = [
    { label: 'Total Paid to Partners', value: '$847K+', color: '#10b981' },
    { label: 'Active Partners', value: '2,840+', color: '#FF5C00' },
    { label: 'Avg Monthly Earnings', value: '$3,200', color: '#CCFF00' },
    { label: 'Top Commission Rate', value: '25%', color: '#a78bfa' },
  ];

  const tiers = [
    { traders: '0–9', rate: '7%', label: 'Starter', color: '#60a5fa' },
    { traders: '10+', rate: '11%', label: 'Silver', color: '#a78bfa' },
    { traders: '25+', rate: '17%', label: 'Gold', color: '#fbbf24' },
    { traders: '50+', rate: '25%', label: 'Platinum', color: '#FF5C00' },
  ];

  const examples = [
    {
      scenario: 'Challenge Purchase',
      amount: '$517',
      commission: '+$41.36',
      rate: '8%',
      color: '#FF5C00',
      icon: Zap,
      desc: 'When your referral buys a $100K challenge',
    },
    {
      scenario: 'Funded Trader Payout',
      amount: '$10K',
      commission: '+$2,500',
      rate: '25%',
      color: '#CCFF00',
      icon: Award,
      desc: 'Platinum partners earn on trader profit withdrawals',
    },
    {
      scenario: 'Level 2 Referral',
      amount: '$350',
      commission: '+$7.00',
      rate: '2%',
      color: '#60a5fa',
      icon: Users,
      desc: 'Passive income from your network\'s referrals',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative rounded-2xl overflow-hidden mt-8"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div className="px-6 sm:px-10 py-12 sm:py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
            style={{ background: 'rgba(255,92,0,0.08)', border: '1px solid rgba(255,92,0,0.15)' }}>
            <Star className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-medium text-primary uppercase tracking-wide">
              Partner Program
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
            Build Your Income Stream
          </h2>
          <p className="text-sm text-white/50 max-w-xl mx-auto leading-relaxed">
            Earn commissions on challenge sales and funded trader payouts with our multi-tier partner system.
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="rounded-xl p-5 text-center"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="text-2xl sm:text-3xl font-bold mb-1.5" style={{ color: s.color }}>
                {s.value}
              </div>
              <div className="text-xs text-white/50 font-medium">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Commission tiers */}
        <div className="mb-12">
          <div className="text-center mb-6">
            <h3 className="text-lg sm:text-xl font-semibold mb-2 text-white">
              Commission Tiers
            </h3>
            <p className="text-xs text-white/50">Your payout reward rate grows with active funded traders</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {tiers.map((t, i) => (
              <motion.div
                key={t.traders}
                initial={{ opacity: 0, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="rounded-xl p-5 text-center"
                style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${t.color}25` }}
              >
                <div className="text-[10px] font-medium text-white/50 mb-2">{t.traders} traders</div>
                <div className="text-3xl sm:text-4xl font-bold mb-1" style={{ color: t.color }}>{t.rate}</div>
                <div className="text-xs font-medium text-white/80">{t.label}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Earning examples */}
        <div className="mb-12">
          <h3 className="text-lg sm:text-xl font-semibold text-center mb-6 text-white">
            How You Earn
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {examples.map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.scenario}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-xl p-5"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: `${card.color}15` }}>
                      <Icon className="w-4 h-4" style={{ color: card.color }} />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-white">{card.scenario}</div>
                      <div className="text-[10px] text-white/40">{card.rate} commission</div>
                    </div>
                  </div>
                  <div className="text-xs text-white/50 mb-4 leading-relaxed">{card.desc}</div>
                  <div className="flex items-center justify-between p-3 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <div className="text-[9px] font-medium text-white/40 mb-0.5">Amount</div>
                      <div className="text-sm font-semibold text-white">{card.amount}</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-white/30" />
                    <div className="text-right">
                      <div className="text-[9px] font-medium text-white/40 mb-0.5">You Earn</div>
                      <div className="text-base font-bold" style={{ color: card.color }}>{card.commission}</div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Multi-level structure */}
        <div className="rounded-2xl p-6 sm:p-8 mb-10"
          style={{ background: 'rgba(255,92,0,0.06)', border: '1px solid rgba(255,92,0,0.2)' }}>
          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
            <div>
              <div className="text-[10px] font-mono text-primary uppercase tracking-widest mb-3">
                3-Level Structure
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
                Multi-Level Commissions
              </h3>
              <p className="text-xs sm:text-sm text-white/50 leading-relaxed mb-5">
                Earn from three levels of referrals. Build depth, earn passively.
              </p>
              <div className="space-y-2.5">
                {[
                  { lvl: 'Level 1', rate: '8%', label: 'Direct referrals', color: '#FF5C00' },
                  { lvl: 'Level 2', rate: '2%', label: 'Sub-referrals', color: '#60a5fa' },
                  { lvl: 'Level 3', rate: '1%', label: 'Third level', color: '#a78bfa' },
                ].map(l => (
                  <div key={l.lvl} className="flex items-center gap-3 rounded-lg p-3"
                    style={{ background: `${l.color}08`, border: `1px solid ${l.color}20` }}>
                    <div className="w-14 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0"
                      style={{ background: `${l.color}15`, color: l.color }}>{l.rate}</div>
                    <div>
                      <div className="text-xs font-medium text-white">{l.lvl}</div>
                      <div className="text-[10px] text-white/40">{l.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <div className="rounded-xl p-6"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(204,255,0,0.1)', border: '1px solid rgba(204,255,0,0.25)' }}>
                    <Shield className="w-5 h-5" style={{ color: '#CCFF00' }} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">Free to Join</div>
                    <div className="text-xs text-white/40">No minimum requirements</div>
                  </div>
                </div>
                <div className="space-y-2">
                  {['Instant dashboard access', 'Real-time tracking', 'Automated payouts'].map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-white/50">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
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
            className="inline-flex items-center gap-3 px-10 py-4 rounded-full text-sm font-bold text-white transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(135deg,#FF5C00,#FF8A3D)',
              boxShadow: '0 8px 32px rgba(255,92,0,0.4)',
            }}
          >
            <Users className="w-5 h-5" />
            <span>Become a Partner</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}