import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NumberFlow from '@number-flow/react';
import { ArrowRight, Check, CheckCheck, Zap, Shield, TrendingUp, Clock, BarChart2, AlertTriangle, Target, Calendar, Ban, Moon, TrendingDown, Users, Wallet, Loader2 } from 'lucide-react';
import TermsModal from '../checkout/TermsModal';
import ChallengeCard from './ChallengeCard';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const ACCOUNT_TYPES = {
  standard: {
    label: 'Standard', leverage: '1:100',
    features: [
      { text: '1:100 Leverage', ok: true },
      { text: 'News trading restricted', ok: false },
      { text: 'No overnight holding', ok: false },
      { text: 'Aggressive scaling model', ok: true },
    ],
  },
  swing: {
    label: 'Swing', leverage: '1:30',
    features: [
      { text: '1:30 Leverage', ok: true },
      { text: 'News trading ALLOWED', ok: true },
      { text: 'Overnight holding ALLOWED', ok: true },
      { text: 'Weekend holding ALLOWED', ok: true },
    ],
  },
};

function formatSize(n) {
  if (n >= 1000000) return `$${n / 1000000}M`;
  if (n >= 1000) return `$${n / 1000}K`;
  return `$${n}`;
}

export default function ChallengeMarketplace({ onProceedToCheckout }) {
  const [challengeType, setChallengeType] = useState('two-step');
  const [accountType, setAccountType] = useState('standard');
  const [platform, setPlatform] = useState('match_trader');

  const { data: allPlans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['challenge-plans'],
    queryFn: () => base44.entities.ChallengePlan.list('sort_order', 100),
  });

  const plans = allPlans.filter(p =>
    p.type === challengeType &&
    p.account_type === accountType &&
    p.is_visible !== false &&
    p.is_active !== false
  );

  const { data: platformSettings = [] } = useQuery({
    queryKey: ['platform-settings-trading'],
    queryFn: () => base44.entities.PlatformSettings.filter({ category: 'trading' }),
  });
  const enabledPlatforms = Object.fromEntries(
    platformSettings.map(s => [s.setting_key, s.is_enabled !== false])
  );
  const [selected, setSelected] = useState(null);
  const [pendingOrder, setPendingOrder] = useState(null); // order waiting for terms acceptance
  const [showTerms, setShowTerms] = useState(false);

  const PLATFORMS = [
    { id: 'match_trader', label: 'Match Trader', desc: 'Institutional platform — recommended', available: enabledPlatforms.match_trader !== false, icon: '📊' },
    { id: 'xtrading', label: 'XTrading', desc: 'Built-in simulated terminal', available: enabledPlatforms.xtrading !== false, icon: '⚡' },
    { id: 'mt5', label: 'MetaTrader 5', desc: 'Industry standard platform', available: enabledPlatforms.mt5 !== false, icon: '📈' },
    { id: 'tradelocker', label: 'TradeLocker', desc: 'Next-gen prop firm platform', available: enabledPlatforms.tradelocker !== false, icon: '🔓' },
  ];

  const accCfg = ACCOUNT_TYPES[accountType];

  const handleSelect = (plan) => {
    const availablePlatform = PLATFORMS.find(p => p.id === platform);
    if (!availablePlatform?.available) return;
    setSelected(plan);
    const leverage = accountType === 'standard' ? plan.leverage_standard : plan.leverage_swing;
    const order = {
      challenge_type: challengeType,
      account_type: accountType,
      account_size: plan.size,
      leverage,
      price: plan.price,
      final_price: plan.price,
      platform,
    };
    setPendingOrder(order);
    setShowTerms(true);
  };

  const handleTermsAccept = () => {
    setShowTerms(false);
    if (pendingOrder) {
      onProceedToCheckout(pendingOrder);
      setPendingOrder(null);
    }
  };

  const handleTermsDecline = () => {
    setShowTerms(false);
    setSelected(null);
    setPendingOrder(null);
  };

  const CHALLENGE_RULES = [
    { icon: TrendingDown, color: '#ef4444', title: 'Daily Drawdown', body: 'Max 5% loss per trading day. Resets at 3:00 AM GMT+4 daily.' },
    { icon: AlertTriangle, color: '#f59e0b', title: 'Maximum Drawdown', body: 'Total equity must never fall more than 10% below starting balance. This does NOT reset.' },
    { icon: Target, color: '#10b981', title: 'Profit Target', body: 'Phase 1: 10% target. Phase 2: 5% target. Instant: maintain profitable operation.' },
    { icon: Calendar, color: '#6366f1', title: 'Min Trading Days', body: 'Trade on at least 4 different calendar days per phase to qualify.' },
    { icon: Ban, color: '#ef4444', title: 'News Trading', body: '1:100 accounts may not hold during high-impact news (NFP, FOMC, CPI). 1:30 swing accounts are exempt.' },
    { icon: Moon, color: '#8b5cf6', title: 'Overnight / Weekend', body: '1:100 accounts cannot hold past Friday 21:00 GMT. Swing (1:30) accounts may hold overnight and over weekends.' },
    { icon: TrendingUp, color: '#FF5C00', title: 'Consistency Rule', body: 'No single trade may make up more than 50% of total profits. Consistent lot sizing required.' },
    { icon: Users, color: '#0ea5e9', title: 'Prohibited Activities', body: 'No tick scalping, arbitrage, copy trading (without approval), HFT, or price manipulation tools.' },
    { icon: Shield, color: '#10b981', title: 'Account Security', body: 'Credentials are personal and non-transferable. Account sharing or selling = immediate termination.' },
    { icon: Wallet, color: '#FF5C00', title: 'Payout Policy', body: '80% profit split for funded accounts. KYC required. Min 1 profitable cycle before withdrawal.' },
  ];

  return (
    <div>
      {/* Terms Modal */}
      <TermsModal
        open={showTerms}
        onAccept={handleTermsAccept}
        onClose={handleTermsDecline}
      />

      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
          style={{ background: 'rgba(255,92,0,0.1)', border: '1px solid rgba(255,92,0,0.2)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-mono text-primary uppercase tracking-widest">Challenge Marketplace</span>
        </div>
        <h1 className="text-3xl font-black text-foreground mb-2">
          Choose Your <span className="text-primary">Capital Tier</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Institutional funding from $5K to $200K. Select your challenge type and account model.
        </p>
      </div>

      {/* Challenge type toggle */}
      <div className="flex flex-wrap gap-2 mb-6">
        <div className="inline-flex rounded-xl p-1" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {[
            { id: 'two-step', label: '⚡ Two-Step Challenge' },
            { id: 'instant', label: '🚀 Instant Funding' },
            { id: 'instant_light', label: '💡 Instant Light' },
          ].map(t => (
            <button key={t.id} onClick={() => { setChallengeType(t.id); setSelected(null); }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                challengeType === t.id ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
        {challengeType === 'instant_light' && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono"
            style={{ background: 'rgba(204,255,0,0.08)', border: '1px solid rgba(204,255,0,0.2)', color: '#CCFF00' }}>
            ⬇ 50% cheaper · Trailing DD Protection
          </div>
        )}
      </div>

      {/* Platform selector */}
      <div className="mb-6">
        <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">Trading Platform</div>
        <div className="flex flex-wrap gap-3">
          {PLATFORMS.map(p => (
            <button key={p.id} onClick={() => p.available && setPlatform(p.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${!p.available ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}`}
              style={{
                background: platform === p.id ? 'rgba(255,92,0,0.1)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${platform === p.id ? 'rgba(255,92,0,0.45)' : 'rgba(255,255,255,0.09)'}`,
              }}>
              <span className="text-lg">{p.icon}</span>
              <div className="text-left">
                <div className={`text-xs font-bold ${platform === p.id ? 'text-primary' : 'text-foreground'}`}>{p.label}</div>
                <div className="text-[10px] font-mono text-muted-foreground">{p.desc}</div>
              </div>
              {platform === p.id && <div className="w-2 h-2 rounded-full bg-primary ml-1" />}
              {!p.available && <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-mono" style={{ background: 'rgba(255,255,255,0.06)', color: '#888' }}>SOON</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Account type */}
      <div className="grid md:grid-cols-2 gap-4 max-w-xl mb-8">
        {Object.entries(ACCOUNT_TYPES).map(([key, cfg]) => (
          <motion.button key={key} onClick={() => setAccountType(key)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="rounded-xl p-4 text-left transition-all"
            style={{
              background: accountType === key ? 'rgba(255,92,0,0.08)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${accountType === key ? 'rgba(255,92,0,0.5)' : 'rgba(255,255,255,0.08)'}`,
            }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: accountType === key ? 'rgba(255,92,0,0.2)' : 'rgba(255,255,255,0.06)' }}>
                {key === 'standard'
                  ? <Zap className={`w-4 h-4 ${accountType === key ? 'text-primary' : 'text-muted-foreground'}`} />
                  : <Shield className={`w-4 h-4 ${accountType === key ? 'text-primary' : 'text-muted-foreground'}`} />}
              </div>
              <div className="flex-1">
                <div className={`text-sm font-bold ${accountType === key ? 'text-primary' : 'text-foreground'}`}>{cfg.label}</div>
                <div className="text-[10px] font-mono text-muted-foreground">{cfg.leverage} leverage</div>
              </div>
              {accountType === key && (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            <div className="space-y-1">
              {cfg.features.map(f => (
                <div key={f.text} className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${f.ok ? 'bg-emerald-400' : 'bg-red-400/60'}`} />
                  <span className={`text-[11px] ${f.ok ? 'text-foreground' : 'text-muted-foreground'}`}>{f.text}</span>
                </div>
              ))}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Plans grid */}
      {plansLoading ? (
        <div className="flex justify-center py-16 mb-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${challengeType}-${accountType}`}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="grid gap-6 mb-12 md:grid-cols-3"
          >
            {plans.map((plan, i) => {
              const isPopular = !!plan.is_popular;
              let badge = null;
              let badgeColor = '';
              
              if (isPopular) {
                badge = '🔥 Most Popular';
                badgeColor = 'bg-orange-500/90';
              } else if (plan.type === 'instant_light') {
                badge = '50% Cheaper - Trading Go';
                badgeColor = 'bg-accent/90';
              }

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, type: 'spring', stiffness: 200, damping: 22 }}
                >
                  <ChallengeCard
                    plan={plan}
                    badge={badge}
                    badgeColor={badgeColor}
                    onSelect={() => handleSelect(plan)}
                  />
                </motion.div>
              );
            })}
            {plans.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground text-sm">
                No active plans for this challenge type and account model.
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Quick highlights */}
      <div className="rounded-2xl p-5 grid md:grid-cols-3 gap-5 mb-10"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        {[
          { icon: TrendingUp, title: 'Profit Split', desc: 'Up to 80% profit split. Scaling plan available on all funded accounts.' },
          { icon: Clock, title: 'Payout Schedule', desc: 'Request payouts every 14 days. Processed within 24-48 hours.' },
          { icon: BarChart2, title: 'Trading Rules', desc: `${accCfg.label}: ${accCfg.leverage} leverage. ${accountType === 'swing' ? 'News & overnight trading allowed.' : 'Standard trading model.'}` },
        ].map(f => {
          const Icon = f.icon;
          return (
            <div key={f.title} className="flex gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="text-sm font-bold text-foreground mb-0.5">{f.title}</div>
                <div className="text-xs text-muted-foreground leading-relaxed">{f.desc}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full Challenge Rules */}
      <div className="mb-2">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,92,0,0.12)' }}>
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-black text-foreground">Challenge Rules</h2>
            <p className="text-xs text-muted-foreground font-mono">Understand all rules before purchasing — violations result in termination without refund.</p>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        {CHALLENGE_RULES.map((rule, i) => {
          const Icon = rule.icon;
          return (
            <motion.div
              key={rule.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="rounded-2xl p-5 flex gap-4"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${rule.color}22`,
                boxShadow: `0 0 20px ${rule.color}08`,
              }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: `${rule.color}15`, border: `1px solid ${rule.color}30` }}>
                <Icon className="w-5 h-5" style={{ color: rule.color }} />
              </div>
              <div>
                <div className="text-sm font-bold text-foreground mb-1">{rule.title}</div>
                <div className="text-xs text-muted-foreground leading-relaxed">{rule.body}</div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}