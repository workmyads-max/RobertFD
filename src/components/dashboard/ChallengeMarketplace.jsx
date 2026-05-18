import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, Zap, Shield, TrendingUp, Clock, BarChart2 } from 'lucide-react';
import TermsModal from '../checkout/TermsModal';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const TWO_STEP = [
  { size: 5000,   price: 49,   phase1Target: 10, phase2Target: 5, maxDD: 10, dailyDD: 5, leverage100: '1:100', leverage30: '1:30', split: '80%' },
  { size: 10000,  price: 89,   phase1Target: 10, phase2Target: 5, maxDD: 10, dailyDD: 5, leverage100: '1:100', leverage30: '1:30', split: '80%' },
  { size: 25000,  price: 235,  phase1Target: 10, phase2Target: 5, maxDD: 10, dailyDD: 5, leverage100: '1:100', leverage30: '1:30', split: '80%' },
  { size: 50000,  price: 349,  phase1Target: 10, phase2Target: 5, maxDD: 10, dailyDD: 5, leverage100: '1:100', leverage30: '1:30', split: '80%' },
  { size: 100000, price: 517,  phase1Target: 10, phase2Target: 5, maxDD: 10, dailyDD: 5, leverage100: '1:100', leverage30: '1:30', split: '80%', popular: true },
  { size: 200000, price: 1089, phase1Target: 10, phase2Target: 5, maxDD: 10, dailyDD: 5, leverage100: '1:100', leverage30: '1:30', split: '80%' },
];

const INSTANT = [
  { size: 10000,  price: 270,  target: 8, maxDD: 8, dailyDD: 4, leverage100: '1:100', leverage30: '1:30', split: '80%' },
  { size: 25000,  price: 607,  target: 8, maxDD: 8, dailyDD: 4, leverage100: '1:100', leverage30: '1:30', split: '80%' },
  { size: 50000,  price: 1350, target: 8, maxDD: 8, dailyDD: 4, leverage100: '1:100', leverage30: '1:30', split: '80%', popular: true },
  { size: 100000, price: 2430, target: 8, maxDD: 8, dailyDD: 4, leverage100: '1:100', leverage30: '1:30', split: '80%' },
  { size: 200000, price: 4850, target: 8, maxDD: 8, dailyDD: 4, leverage100: '1:100', leverage30: '1:30', split: '80%' },
];

const INSTANT_LIGHT = [
  { size: 25000,  price: 304,  maxDD: 10, dailyDD: 5, leverage100: '1:100', leverage30: '1:30', split: '80%', trailing: true },
  { size: 50000,  price: 675,  maxDD: 10, dailyDD: 5, leverage100: '1:100', leverage30: '1:30', split: '80%', popular: true, trailing: true },
  { size: 100000, price: 1215, maxDD: 10, dailyDD: 5, leverage100: '1:100', leverage30: '1:30', split: '80%', trailing: true },
];

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

const PRICES = {
  'two-step':      { 5000: 49, 10000: 89, 25000: 235, 50000: 349, 100000: 517, 200000: 1089 },
  'instant':       { 10000: 270, 25000: 607, 50000: 1350, 100000: 2430, 200000: 4850 },
  'instant_light': { 25000: 304, 50000: 675, 100000: 1215 },
};

export default function ChallengeMarketplace({ onProceedToCheckout }) {
  const [challengeType, setChallengeType] = useState('two-step');
  const [accountType, setAccountType] = useState('standard');
  const [platform, setPlatform] = useState('match_trader');

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
    { id: 'mt5', label: 'MetaTrader 5', desc: 'Industry standard platform', available: enabledPlatforms.mt5 !== false, icon: '📈' },
    { id: 'tradelocker', label: 'TradeLocker', desc: 'Next-gen prop firm platform', available: enabledPlatforms.tradelocker !== false, icon: '🔓' },
  ];

  const plans = challengeType === 'two-step' ? TWO_STEP : challengeType === 'instant_light' ? INSTANT_LIGHT : INSTANT;
  const accCfg = ACCOUNT_TYPES[accountType];

  const handleSelect = (plan) => {
    const availablePlatform = PLATFORMS.find(p => p.id === platform);
    if (!availablePlatform?.available) return;
    setSelected(plan);
    const leverage = accountType === 'standard' ? plan.leverage100 : plan.leverage30;
    const order = {
      challenge_type: challengeType,
      account_type: accountType,
      account_size: plan.size,
      leverage,
      price: PRICES[challengeType]?.[plan.size] || plan.price,
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

  return (
    <div>
      {/* Terms Modal */}
      <AnimatePresence>
        {showTerms && (
          <TermsModal
            order={pendingOrder}
            onAccept={handleTermsAccept}
            onDecline={handleTermsDecline}
          />
        )}
      </AnimatePresence>

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
      <AnimatePresence mode="wait">
        <motion.div key={challengeType}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className={`grid gap-4 mb-8 ${challengeType === 'two-step' ? 'md:grid-cols-3 xl:grid-cols-6' : 'md:grid-cols-3 xl:grid-cols-5'}`}>
          {plans.map((plan, i) => {
            const leverage = accountType === 'standard' ? plan.leverage100 : plan.leverage30;
            const isSelected = selected?.size === plan.size;
            return (
              <motion.div key={plan.size}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="relative rounded-2xl overflow-hidden"
                style={{
                  background: plan.popular ? 'rgba(20,10,4,0.98)' : 'rgba(14,14,16,0.8)',
                  border: `1px solid ${isSelected ? 'rgba(204,255,0,0.5)' : plan.popular ? 'rgba(255,92,0,0.5)' : 'rgba(255,255,255,0.08)'}`,
                  boxShadow: plan.popular ? '0 0 30px rgba(255,92,0,0.12)' : isSelected ? '0 0 20px rgba(204,255,0,0.1)' : 'none',
                }}>
                <div className="h-0.5 w-full" style={{ background: isSelected ? 'linear-gradient(90deg,#CCFF00,#aadd00)' : plan.popular ? 'linear-gradient(90deg,#FF5C00,#FF8A3D)' : 'rgba(255,255,255,0.08)' }} />

                {plan.popular && !isSelected && (
                  <div className="absolute top-0 left-0 right-0 flex justify-center">
                    <div className="px-3 py-0.5 rounded-b-lg text-[10px] font-black text-white"
                      style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)' }}>MOST POPULAR</div>
                  </div>
                )}

                <div className="p-4 pt-5">
                  <div className="text-center mb-4">
                    <div className="text-xl font-black text-foreground mb-0.5">{formatSize(plan.size)}</div>
                    <div className="text-[10px] font-mono text-muted-foreground mb-2">
                      {challengeType === 'two-step' ? 'Two-Step' : challengeType === 'instant_light' ? 'Instant Light' : 'Instant'} · {accCfg.label}
                    </div>
                    <div className="text-lg font-black text-primary">${plan.price}</div>
                  </div>

                  <div className="space-y-1.5 mb-4">
                    {[
                      challengeType === 'two-step' && { label: 'P1 Target', value: `${plan.phase1Target}%` },
                      challengeType === 'two-step' && { label: 'P2 Target', value: `${plan.phase2Target}%` },
                      (challengeType === 'instant' || challengeType === 'instant_light') && { label: 'No Target', value: '✓ Direct' },
                      challengeType === 'instant_light' && { label: 'Trailing DD', value: '✓ Active' },
                      { label: 'Max DD', value: `${plan.maxDD}%` },
                      { label: 'Daily DD', value: `${plan.dailyDD}%` },
                      { label: 'Leverage', value: leverage },
                      { label: 'Split', value: plan.split },
                    ].filter(Boolean).map(({ label, value }) => (
                      <div key={label} className="flex justify-between text-[11px]">
                        <span className="text-muted-foreground font-mono">{label}</span>
                        <span className="text-foreground font-semibold">{value}</span>
                      </div>
                    ))}
                  </div>

                  <button onClick={() => handleSelect(plan)}
                    className="w-full py-2.5 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] flex items-center justify-center gap-1.5"
                    style={isSelected
                      ? { background: 'rgba(204,255,0,0.15)', color: '#CCFF00', border: '1px solid rgba(204,255,0,0.4)' }
                      : plan.popular
                      ? { background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)', color: 'white', boxShadow: '0 4px 16px rgba(255,92,0,0.3)' }
                      : { background: 'rgba(255,255,255,0.07)', color: 'hsl(var(--foreground))', border: '1px solid rgba(255,255,255,0.12)' }
                    }>
                    {isSelected ? '✓ Selected — Loading...' : <>Select <ArrowRight className="w-3 h-3" /></>}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Rules summary */}
      <div className="rounded-2xl p-5 grid md:grid-cols-3 gap-5"
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
    </div>
  );
}