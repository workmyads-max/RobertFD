import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, Users, DollarSign, TrendingUp, Star, Zap, Award, ChevronRight, Shield } from 'lucide-react';

function AnimatedCounter({ target, prefix = '', suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = React.useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = 16;
    const increment = target / (duration / step);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {start = target;clearInterval(timer);}
      setCount(Math.round(start));
    }, step);
    return () => clearInterval(timer);
  }, [inView, target, duration]);

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

const FLOW_STEPS = [
{
  step: '01', icon: Users, color: '#FF5C00',
  title: 'Invite Traders',
  desc: 'Share your unique referral link. Your network joins XFunded Trader.'
},
{
  step: '02', icon: Zap, color: '#60a5fa',
  title: 'Trader Buys Challenge',
  desc: 'Instantly earn 8% direct commission on every challenge purchase.',
  earn: '8% Commission'
},
{
  step: '03', icon: Award, color: '#CCFF00',
  title: 'Trader Gets Funded',
  desc: 'When your referral receives a profit payout — you earn a bonus too.',
  earn: 'Up to 25% Reward'
},
{
  step: '04', icon: TrendingUp, color: '#10b981',
  title: 'Scale Your Income',
  desc: 'More funded traders = higher payout reward tier. Scale infinitely.',
  earn: 'Unlimited'
}];


const TIERS = [
{ traders: '0–9', rate: '7%', label: 'Starter', color: '#60a5fa', bg: 'rgba(96,165,250,0.08)' },
{ traders: '10+', rate: '11%', label: 'Silver IB', color: '#a78bfa', bg: 'rgba(167,139,250,0.08)' },
{ traders: '25+', rate: '17%', label: 'Gold IB', color: '#fbbf24', bg: 'rgba(251,191,36,0.08)' },
{ traders: '50+', rate: '25%', label: 'Platinum IB', color: '#FF5C00', bg: 'rgba(255,92,0,0.08)' }];


const EXAMPLE_CARDS = [
{
  scenario: 'Challenge Sale',
  amount: '$517',
  commission: '+$41.36',
  rate: '8%',
  color: '#FF5C00',
  icon: Zap,
  desc: '$100K challenge purchase → You earn $41.36 instantly'
},
{
  scenario: 'Funded Payout Reward',
  amount: '$10,000 profit',
  commission: '+$2,500',
  rate: '25%',
  color: '#CCFF00',
  icon: Award,
  desc: 'Trader withdraws $10K → Platinum IB earns $2,500'
},
{
  scenario: 'Level 2 Passive',
  amount: '$350 challenge',
  commission: '+$7.00',
  rate: '2%',
  color: '#60a5fa',
  icon: Users,
  desc: 'Your referral\'s referral buys → You earn passively'
}];


export default function AffiliateSection() {
  return (
    <section id="affiliate" className="relative py-32 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[140px] opacity-8"
        style={{ background: 'radial-gradient(circle, rgba(255,92,0,0.08), transparent)' }} />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px] opacity-8"
        style={{ background: 'radial-gradient(circle, rgba(204,255,0,0.06), transparent)' }} />
      </div>

      <div className="max-w-[1400px] mx-auto px-6 relative z-10">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
          style={{ background: 'rgba(255,92,0,0.1)', border: '1px solid rgba(255,92,0,0.25)' }}>
            <Star className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-mono text-primary uppercase tracking-widest">Institutional Partner Program</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black mb-6 leading-none">
            Build Your{' '}
            <span className="gradient-text">Passive Empire</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Multi-level commissions. Dynamic payout rewards. Institutional IB system.
            The most advanced affiliate ecosystem in prop trading.
          </p>
        </motion.div>

        {/* Stats bar */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20">
          {[
          { label: 'Total Paid to Affiliates', value: 847000, prefix: '$', suffix: '+', color: '#10b981' },
          { label: 'Active Affiliates', value: 2840, prefix: '', suffix: '+', color: '#FF5C00' },
          { label: 'Average Monthly Earnings', value: 3200, prefix: '$', suffix: '', color: '#CCFF00' },
          { label: 'Max Commission Tier', value: 25, prefix: '', suffix: '%', color: '#a78bfa' }].
          map((s, i) =>
          <motion.div key={s.label} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }} transition={{ delay: i * 0.1 }}
          className="rounded-2xl p-6 text-center"
          style={{ background: `${s.color}09`, border: `1px solid ${s.color}25` }}>
              <div className="text-3xl font-black mb-1" style={{ color: s.color }}>
                <AnimatedCounter target={s.value} prefix={s.prefix} suffix={s.suffix} />
              </div>
              <div className="text-xs text-muted-foreground font-mono">{s.label}</div>
            </motion.div>
          )}
        </motion.div>

        {/* How it works flow */}
        <div className="mb-20">
          <motion.h3 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="text-2xl font-black text-center mb-12">
            How It <span className="text-primary">Works</span>
          </motion.h3>
          <div className="grid md:grid-cols-4 gap-4">
            {FLOW_STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div key={step.step}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="relative rounded-2xl p-6"
                style={{ background: `${step.color}08`, border: `1px solid ${step.color}20` }}>
                  {i < FLOW_STEPS.length - 1 &&
                  <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 z-10">
                      <ChevronRight className="w-4 h-4 text-white/20" />
                    </div>
                  }
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: `${step.color}18`, border: `1px solid ${step.color}35` }}>
                    <Icon className="w-6 h-6" style={{ color: step.color }} />
                  </div>
                  <div className="text-[10px] font-mono mb-1" style={{ color: step.color }}>STEP {step.step}</div>
                  <div className="text-base font-black text-foreground mb-2">{step.title}</div>
                  <div className="text-xs text-muted-foreground leading-relaxed mb-3">{step.desc}</div>
                  {step.earn &&
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold"
                  style={{ background: `${step.color}15`, color: step.color, border: `1px solid ${step.color}30` }}>
                      <DollarSign className="w-3 h-3" /> {step.earn}
                    </div>
                  }
                </motion.div>);

            })}
          </div>
        </div>

        {/* Payout reward scaling */}
        <div className="mb-20">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="text-center mb-12">
            <h3 className="text-2xl font-black mb-3">Dynamic <span className="text-primary">IB Scaling</span></h3>
            <p className="text-sm text-muted-foreground">More active funded traders = higher payout reward rate. Grows automatically.</p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {TIERS.map((t, i) =>
            <motion.div key={t.traders}
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.08 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="rounded-2xl p-6 text-center relative overflow-hidden"
            style={{ background: t.bg, border: `1px solid ${t.color}30` }}>
                <div className="absolute top-0 left-0 right-0 h-0.5"
              style={{ background: `linear-gradient(90deg, transparent, ${t.color}, transparent)` }} />
                <div className="text-[10px] font-mono text-muted-foreground mb-1">{t.traders} live traders</div>
                <div className="text-4xl font-black mb-2" style={{ color: t.color }}>{t.rate}</div>
                <div className="text-sm font-bold text-foreground">{t.label}</div>
                <div className="text-[10px] text-muted-foreground mt-1">payout reward</div>
              </motion.div>
            )}
          </div>
          <div className="mt-4 rounded-xl p-4 text-center text-xs text-muted-foreground"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <span className="text-primary font-semibold">Example:</span> Trader earns $10,000 profit.
            Platinum IB (50+ live) earns <span className="text-emerald-400 font-bold">$2,500 extra reward</span> on top of their challenge sale commissions.
          </div>
        </div>

        {/* Example earnings cards */}
        <div className="mb-20">
          <motion.h3 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="text-2xl font-black text-center mb-12">
            Real <span className="text-primary">Earning Examples</span>
          </motion.h3>
          <div className="grid md:grid-cols-3 gap-6">
            {EXAMPLE_CARDS.map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div key={card.scenario}
                initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="rounded-2xl p-6 relative overflow-hidden"
                style={{ background: `${card.color}09`, border: `1px solid ${card.color}25`, boxShadow: `0 0 30px ${card.color}0a` }}>
                  <div className="absolute top-0 left-0 right-0 h-1"
                  style={{ background: `linear-gradient(90deg, ${card.color}, ${card.color}60)` }} />
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${card.color}18`, border: `1px solid ${card.color}30` }}>
                      <Icon className="w-5 h-5" style={{ color: card.color }} />
                    </div>
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-widest" style={{ color: card.color }}>{card.scenario}</div>
                      <div className="text-xs font-bold text-foreground">{card.rate} rate</div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground mb-4">{card.desc}</div>
                  <div className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div>
                      <div className="text-[10px] font-mono text-muted-foreground">Source</div>
                      <div className="text-sm font-bold text-foreground">{card.amount}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <div className="text-right">
                      <div className="text-[10px] font-mono text-muted-foreground">You Earn</div>
                      <div className="text-xl font-black" style={{ color: card.color }}>{card.commission}</div>
                    </div>
                  </div>
                </motion.div>);

            })}
          </div>
        </div>

        {/* Multi-level structure */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="rounded-3xl p-8 md:p-12 mb-20 relative overflow-hidden"
        style={{ background: 'rgba(255,92,0,0.05)', border: '1px solid rgba(255,92,0,0.2)' }}>
          <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at top left, rgba(255,92,0,0.07), transparent 60%)' }} />
          <div className="grid md:grid-cols-2 gap-10 relative z-10">
            <div>
              <div className="text-[10px] font-mono text-primary uppercase tracking-widest mb-3">3-Level Structure</div>
              <h3 className="text-3xl font-black text-foreground mb-4">Multi-Level <br />Commission Tree</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Build a deep network and earn from 3 levels of referrals.
                Your Level 1 refers others — you earn from them too, automatically.
              </p>
              <a href="/dashboard" className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-sm font-bold text-white transition-all group"
              style={{ background: 'linear-gradient(90deg,#FF5C00,#cc4900)', boxShadow: '0 4px 24px rgba(255,92,0,0.4)' }}>
                Start Earning Now
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
            <div className="flex flex-col gap-3">
              {[
              { lvl: 'Level 1', rate: '8%', label: 'Direct referrals', color: '#FF5C00', example: 'You → Trader buys $517 challenge → $41.36' },
              { lvl: 'Level 2', rate: '2%', label: 'Sub-referrals', color: '#60a5fa', example: 'Your referral → their referral buys → You earn' },
              { lvl: 'Level 3', rate: '1%', label: 'Depth 3', color: '#a78bfa', example: '3rd generation → still earns for you' }].
              map((l) =>
              <div key={l.lvl} className="flex items-center gap-4 rounded-xl p-4"
              style={{ background: `${l.color}0a`, border: `1px solid ${l.color}20` }}>
                  <div className="w-14 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                style={{ background: `${l.color}20`, color: l.color }}>{l.rate}</div>
                  <div>
                    <div className="text-xs font-bold text-foreground">{l.lvl} — {l.label}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">{l.example}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 hidden"
          style={{ background: 'rgba(204,255,0,0.08)', border: '1px solid rgba(204,255,0,0.2)' }}>
            <Shield className="w-3 h-3" style={{ color: '#CCFF00' }} />
            <span className="text-[11px] font-mono" style={{ color: '#CCFF00' }}>Instant dashboard access · Real-time tracking · Automated payouts</span>
          </div>
          <h3 className="text-3xl font-black text-foreground mb-4">
            Join the <span className="text-primary">Partner Network</span>
          </h3>
          <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
            Free to join. No minimum requirements. Start building passive income today.
          </p>
          <a href="/dashboard" className="inline-flex items-center gap-2 px-10 py-5 rounded-full text-base font-bold text-white transition-all group relative"
          style={{ background: 'linear-gradient(135deg,#FF5C00,#FF8A3D)', boxShadow: '0 8px 32px rgba(255,92,0,0.4)' }}>
            <span className="absolute inset-0 rounded-full animate-pulse opacity-20"
            style={{ background: 'linear-gradient(135deg,#FF5C00,#FF8A3D)' }} />
            <Users className="w-5 h-5 relative z-10" />
            <span className="relative z-10">Become an Affiliate Partner</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
          </a>
        </motion.div>

      </div>
    </section>);

}