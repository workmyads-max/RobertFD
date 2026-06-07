import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NumberFlow from '@number-flow/react';
import { Check, Zap, Shield, TrendingUp, Clock, BarChart2, AlertTriangle, Target, Calendar, Ban, Moon, TrendingDown, Users, Wallet, Loader2 } from 'lucide-react';
import TermsModal from '../checkout/TermsModal';
import ChallengeCard from './ChallengeCard';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useFeatureVisibility } from '@/hooks/useFeatureVisibility';

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
  const { isEnabled } = useFeatureVisibility();
  const [challengeType, setChallengeType] = useState('two-step');
  const [accountType, setAccountType] = useState('standard');
  const [platform, setPlatform] = useState('mt5');

  const { data: allPlans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['challenge-plans-all'],
    queryFn: async () => {
      const data = await base44.entities.ChallengePlan.list('sort_order', 200);
      return Array.isArray(data) ? data : [];
    },
    staleTime: 30 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const plans = allPlans
    .filter(p =>
      p.type === challengeType &&
      p.account_type === accountType &&
      p.is_visible !== false
    )
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  const { data: platformSettings = [] } = useQuery({
    queryKey: ['platform-settings-trading'],
    queryFn: () => base44.entities.PlatformSettings.filter({ category: 'trading' }),
  });
  const enabledPlatforms = Object.fromEntries(
    platformSettings.map(s => [s.setting_key, s.is_enabled !== false])
  );
  const [selected, setSelected] = useState(null);
  const [pendingOrder, setPendingOrder] = useState(null);
  const [showTerms, setShowTerms] = useState(false);

  // Only show platforms that are enabled — MT5-only mode: others are hidden completely
  const PLATFORMS = [
    { id: 'mt5', label: 'MetaTrader 5', desc: 'Industry standard platform', available: true, icon: '📈' },
  ].filter(p => p.available);

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
    <div className="w-full max-w-full overflow-x-hidden">
      <TermsModal open={showTerms} onAccept={handleTermsAccept} onClose={handleTermsDecline} />

      {/* Header */}
      <div className="mb-8 sm:mb-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/30 mb-2">Challenge Marketplace</p>
        <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight mb-2">
          Choose your <span className="text-primary">account size</span>
        </h1>
        <p className="text-sm text-white/40">
          Funded capital from $5K to $200K. Pass the challenge, keep up to 80% of profits.
        </p>
      </div>

      {/* Step 1 — Challenge Type */}
      <div className="mb-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/25 mb-3">Challenge Type</p>
        <div className="inline-flex rounded-xl p-1 gap-0.5"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {[
            { id: 'two-step', label: 'Two-Step' },
            { id: 'instant', label: 'Instant' },
            { id: 'instant_light', label: 'Light' },
          ].map(t => (
            <button key={t.id}
              onClick={() => { setChallengeType(t.id); setSelected(null); }}
              className="px-4 sm:px-5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
              style={{
                background: challengeType === t.id ? 'rgba(255,92,0,0.15)' : 'transparent',
                border: challengeType === t.id ? '1px solid rgba(255,92,0,0.3)' : '1px solid transparent',
                color: challengeType === t.id ? '#FF7A2F' : 'rgba(255,255,255,0.4)',
              }}>
              {t.label}
              {t.id === 'instant_light' && challengeType === 'instant_light' && (
                <span className="ml-2 text-[10px] font-semibold" style={{ color: '#CCFF00' }}>50% OFF</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Step 2 — Platform */}
      <div className="mb-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/25 mb-3">Trading Platform</p>
        <div className="flex flex-wrap gap-3">
          {PLATFORMS.map(p => {
            const isSelected = platform === p.id;
            return (
              <button key={p.id} onClick={() => setPlatform(p.id)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                style={{
                  background: isSelected ? 'rgba(0,102,204,0.1)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isSelected ? 'rgba(0,122,255,0.35)' : 'rgba(255,255,255,0.07)'}`,
                }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #1a8cff, #003399)' }}>
                  <svg viewBox="0 0 40 40" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="mt5grad2" x1="0" y1="0" x2="40" y2="40">
                        <stop offset="0%" stopColor="#1a8cff" />
                        <stop offset="100%" stopColor="#003399" />
                      </linearGradient>
                    </defs>
                    <rect x="6" y="22" width="5" height="11" rx="1.5" fill="rgba(255,255,255,0.5)" />
                    <rect x="13" y="16" width="5" height="17" rx="1.5" fill="rgba(255,255,255,0.7)" />
                    <rect x="20" y="10" width="5" height="23" rx="1.5" fill="white" />
                    <rect x="27" y="14" width="5" height="19" rx="1.5" fill="rgba(255,255,255,0.7)" />
                    <text x="5" y="9" fontSize="7" fontWeight="800" fill="white" fontFamily="Arial" letterSpacing="0.5">MT5</text>
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium" style={{ color: isSelected ? '#93c5fd' : 'rgba(255,255,255,0.7)' }}>{p.label}</div>
                  <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{p.desc}</div>
                </div>
                {isSelected && (
                  <div className="ml-2 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 3 — Account Model */}
      <div className="mb-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/25 mb-3">Account Model</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
          {Object.entries(ACCOUNT_TYPES).map(([key, cfg]) => {
            const isActive = accountType === key;
            return (
              <button key={key} onClick={() => setAccountType(key)}
                className="rounded-xl p-4 text-left transition-all"
                style={{
                  background: isActive ? 'rgba(255,92,0,0.07)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isActive ? 'rgba(255,92,0,0.25)' : 'rgba(255,255,255,0.07)'}`,
                }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: isActive ? 'rgba(255,92,0,0.15)' : 'rgba(255,255,255,0.05)' }}>
                      {key === 'standard'
                        ? <Zap className="w-3.5 h-3.5" style={{ color: isActive ? '#FF5C00' : 'rgba(255,255,255,0.4)' }} />
                        : <Shield className="w-3.5 h-3.5" style={{ color: isActive ? '#FF5C00' : 'rgba(255,255,255,0.4)' }} />}
                    </div>
                    <div>
                      <div className="text-sm font-semibold" style={{ color: isActive ? '#FF7A2F' : 'rgba(255,255,255,0.8)' }}>{cfg.label}</div>
                      <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{cfg.leverage} leverage</div>
                    </div>
                  </div>
                  {isActive && (
                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: '#FF5C00' }}>
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  {cfg.features.map(f => (
                    <div key={f.text} className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full flex-shrink-0"
                        style={{ background: f.ok ? '#10b981' : 'rgba(255,255,255,0.15)' }} />
                      <span className="text-[11px]"
                        style={{ color: f.ok ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)' }}>
                        {f.text}
                      </span>
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Plans grid */}
      {plansLoading ? (
        <div className="flex justify-center py-16 mb-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${challengeType}-${accountType}`}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="grid gap-3 sm:gap-4 mb-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          >
            {plans.map((plan, i) => {
              const isPopular = !!plan.is_popular;
              let badge = null;
              let badgeColor = '';
              if (isPopular) {
                badge = 'Most Popular';
                badgeColor = 'bg-orange-500/90';
              } else if (plan.type === 'instant_light') {
                badge = '50% Cheaper';
                badgeColor = 'bg-accent/90';
              }
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
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
            {plans.length === 0 && !plansLoading && (
              <div className="col-span-full text-center py-12 text-white/25 text-sm">
                {allPlans.length === 0
                  ? 'Loading challenge plans...'
                  : `No plans available for ${challengeType.replace('-', ' ')} ${accountType} accounts.`
                }
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Platform highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px mb-10 rounded-xl overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.06)' }}>
        {[
          { icon: TrendingUp, title: 'Up to 80% Profit Split', desc: 'Scaling plan available on all funded accounts.' },
          { icon: Clock, title: 'Bi-weekly Payouts', desc: 'Request every 14 days. Processed within 24–48 hours.' },
          { icon: BarChart2, title: `${accCfg.label} Account`, desc: `${accCfg.leverage} leverage. ${accountType === 'swing' ? 'News & overnight trading allowed.' : 'Standard trading model.'}` },
        ].map(f => {
          const Icon = f.icon;
          return (
            <div key={f.title} className="flex items-start gap-3 px-5 py-4"
              style={{ background: 'hsl(var(--card))' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: 'rgba(255,92,0,0.08)', border: '1px solid rgba(255,92,0,0.15)' }}>
                <Icon className="w-3.5 h-3.5 text-primary" />
              </div>
              <div>
                <div className="text-sm font-medium text-white/80 mb-0.5">{f.title}</div>
                <div className="text-xs text-white/35 leading-relaxed">{f.desc}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Challenge Rules */}
      <div className="rounded-xl overflow-hidden mb-8"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
          <div>
            <div className="text-sm font-semibold text-foreground">Challenge Rules</div>
            <div className="text-xs text-muted-foreground mt-0.5">Read carefully — violations result in immediate termination</div>
          </div>
          <span className="text-xs font-medium px-2.5 py-1 rounded"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.18)' }}>
            Binding
          </span>
        </div>
        <div className="hidden md:grid grid-cols-[2rem_10rem_1fr_5rem] gap-4 px-5 py-2 border-b"
          style={{ borderColor: 'hsl(var(--border))', background: 'rgba(255,255,255,0.02)' }}>
          <div />
          <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Rule</div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Description</div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 text-right">Category</div>
        </div>
        {CHALLENGE_RULES.map((rule, i) => {
          const Icon = rule.icon;
          const category = i < 3 ? 'Risk' : i < 6 ? 'Conduct' : 'Security';
          const categoryColor = i < 3 ? '#f59e0b' : i < 6 ? '#60a5fa' : '#10b981';
          return (
            <div key={rule.title}
              className="grid grid-cols-1 md:grid-cols-[2rem_10rem_1fr_5rem] gap-x-4 gap-y-1 items-start px-5 py-3.5 border-b hover:bg-white/[0.015] transition-colors"
              style={{ borderColor: 'hsl(var(--border))' }}>
              <div className="hidden md:flex items-center justify-center w-6 h-6 rounded flex-shrink-0 mt-0.5"
                style={{ background: 'rgba(255,255,255,0.05)' }}>
                <Icon className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <div className="flex items-center gap-2 md:block">
                <Icon className="md:hidden w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-sm font-medium text-foreground">{rule.title}</span>
              </div>
              <div className="text-xs text-muted-foreground leading-relaxed pl-5 md:pl-0">{rule.body}</div>
              <div className="hidden md:flex justify-end">
                <span className="text-[10px] font-medium px-2 py-0.5 rounded"
                  style={{ color: categoryColor, background: `${categoryColor}12`, border: `1px solid ${categoryColor}20` }}>
                  {category}
                </span>
              </div>
            </div>
          );
        })}
        <div className="px-5 py-3 flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.01)' }}>
          <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />
          <span className="text-xs text-muted-foreground/50">
            Purchasing a challenge constitutes full acceptance of all rules listed above.
          </span>
        </div>
      </div>
    </div>
  );
}