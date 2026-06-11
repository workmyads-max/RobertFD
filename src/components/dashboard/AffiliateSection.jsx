import React from 'react';
import { motion } from 'framer-motion';
import { Users, DollarSign, TrendingUp, Star, Zap, Award, ArrowRight, Shield } from 'lucide-react';

export default function AffiliateSection({ onNavigate }) {
  const stats = [
    { label: 'Total Paid to Affiliates', value: '$847K+', color: '#10b981' },
    { label: 'Active Affiliates', value: '2,840+', color: '#FF5C00' },
    { label: 'Avg Monthly Earnings', value: '$3,200', color: '#CCFF00' },
    { label: 'Max Commission Tier', value: '25%', color: '#a78bfa' },
  ];

  const tiers = [
    { traders: '0–9', rate: '7%', label: 'Starter', color: '#60a5fa' },
    { traders: '10+', rate: '11%', label: 'Silver IB', color: '#a78bfa' },
    { traders: '25+', rate: '17%', label: 'Gold IB', color: '#fbbf24' },
    { traders: '50+', rate: '25%', label: 'Platinum IB', color: '#FF5C00' },
  ];

  const examples = [
    {
      scenario: 'Challenge Sale',
      amount: '$517',
      commission: '+$41.36',
      rate: '8%',
      color: '#FF5C00',
      desc: '$100K challenge → You earn $41.36 instantly',
    },
    {
      scenario: 'Funded Payout',
      amount: '$10K profit',
      commission: '+$2,500',
      rate: '25%',
      color: '#CCFF00',
      desc: 'Trader withdraws $10K → You earn $2,500',
    },
    {
      scenario: 'Level 2 Passive',
      amount: '$350',
      commission: '+$7.00',
      rate: '2%',
      color: '#60a5fa',
      desc: 'Sub-referral buys → You earn passively',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative rounded-3xl overflow-hidden mt-8"
      style={{
        background: 'rgba(255,92,0,0.04)',
        border: '1px solid rgba(255,92,0,0.15)',
      }}
    >
      {/* Background glow */}
      <div
        className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-[140px] opacity-[0.06]"
        style={{ background: 'radial-gradient(circle, rgba(255,92,0,0.12), transparent)' }}
      />

      <div className="relative z-10 px-8 sm:px-10 py-12 sm:py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5"
            style={{ background: 'rgba(255,92,0,0.12)', border: '1px solid rgba(255,92,0,0.25)' }}>
            <Star className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-mono text-primary uppercase tracking-widest">
              Institutional Partner Program
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
            Build Your <span className="gradient-text">Passive Empire</span>
          </h2>
          <p className="text-sm sm:text-base text-white/45 max-w-2xl mx-auto leading-relaxed">
            Multi-level commissions. Dynamic payout rewards. The most advanced affiliate ecosystem in prop trading.
          </p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-12">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl p-4 sm:p-5 text-center"
              style={{ background: `${s.color}09`, border: `1px solid ${s.color}25` }}
            >
              <div className="text-2xl sm:text-3xl font-black mb-1" style={{ color: s.color }}>
                {s.value}
              </div>
              <div className="text-[10px] sm:text-xs text-white/40 font-mono">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Earning examples */}
        <div className="mb-12">
          <h3 className="text-xl sm:text-2xl font-black text-center mb-8">
            Real <span className="text-primary">Earning Examples</span>
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {examples.map((card, i) => (
              <motion.div
                key={card.scenario}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl p-5 relative overflow-hidden"
                style={{
                  background: `${card.color}09`,
                  border: `1px solid ${card.color}25`,
                  boxShadow: `0 0 30px ${card.color}0a`,
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-1"
                  style={{ background: `linear-gradient(90deg, ${card.color}, ${card.color}60)` }} />
                <div className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: card.color }}>
                  {card.scenario}
                </div>
                <div className="text-xs text-white/45 mb-3">{card.desc}</div>
                <div className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div>
                    <div className="text-[9px] font-mono text-white/30">Source</div>
                    <div className="text-sm font-bold text-white">{card.amount}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] font-mono text-white/30">You Earn</div>
                    <div className="text-lg font-black" style={{ color: card.color }}>{card.commission}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* IB Scaling tiers */}
        <div className="mb-12">
          <div className="text-center mb-6">
            <h3 className="text-xl sm:text-2xl font-black mb-2">
              Dynamic <span className="text-primary">IB Scaling</span>
            </h3>
            <p className="text-xs text-white/40">More funded traders = higher payout reward rate</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {tiers.map((t, i) => (
              <motion.div
                key={t.traders}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl p-5 text-center relative overflow-hidden"
                style={{ background: `${t.color}08`, border: `1px solid ${t.color}30` }}
              >
                <div className="absolute top-0 left-0 right-0 h-0.5"
                  style={{ background: `linear-gradient(90deg, transparent, ${t.color}, transparent)` }} />
                <div className="text-[9px] font-mono text-white/40 mb-2">{t.traders} traders</div>
                <div className="text-3xl sm:text-4xl font-black mb-1" style={{ color: t.color }}>{t.rate}</div>
                <div className="text-xs font-bold text-white">{t.label}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Multi-level structure */}
        <div className="rounded-2xl p-6 sm:p-8 mb-10"
          style={{ background: 'rgba(255,92,0,0.06)', border: '1px solid rgba(255,92,0,0.2)' }}>
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
            <div>
              <div className="text-[10px] font-mono text-primary uppercase tracking-widest mb-3">
                3-Level Structure
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white mb-3">
                Multi-Level Commission Tree
              </h3>
              <p className="text-xs sm:text-sm text-white/40 leading-relaxed mb-5">
                Build a deep network and earn from 3 levels of referrals automatically.
              </p>
              <div className="space-y-2">
                {[
                  { lvl: 'Level 1', rate: '8%', label: 'Direct referrals', color: '#FF5C00' },
                  { lvl: 'Level 2', rate: '2%', label: 'Sub-referrals', color: '#60a5fa' },
                  { lvl: 'Level 3', rate: '1%', label: 'Depth 3', color: '#a78bfa' },
                ].map(l => (
                  <div key={l.lvl} className="flex items-center gap-3 rounded-xl p-3"
                    style={{ background: `${l.color}0a`, border: `1px solid ${l.color}20` }}>
                    <div className="w-12 h-8 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0"
                      style={{ background: `${l.color}20`, color: l.color }}>{l.rate}</div>
                    <div>
                      <div className="text-xs font-bold text-white">{l.lvl}</div>
                      <div className="text-[10px] text-white/40">{l.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <div className="rounded-2xl p-6"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(204,255,0,0.15)', border: '1px solid rgba(204,255,0,0.3)' }}>
                    <Shield className="w-5 h-5" style={{ color: '#CCFF00' }} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Free to Join</div>
                    <div className="text-xs text-white/40">No minimum requirements</div>
                  </div>
                </div>
                <div className="space-y-2">
                  {['Instant dashboard access', 'Real-time tracking', 'Automated payouts'].map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-white/60">
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
            className="inline-flex items-center gap-3 px-10 py-4 rounded-full text-sm font-bold text-white transition-all group relative hover:scale-105"
            style={{
              background: 'linear-gradient(135deg,#FF5C00,#FF8A3D)',
              boxShadow: '0 8px 32px rgba(255,92,0,0.4)',
            }}
          >
            <Users className="w-5 h-5" />
            <span>Become an Affiliate Partner</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}