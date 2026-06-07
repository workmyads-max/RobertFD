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
      {/* Terms Modal */}
      <TermsModal
        open={showTerms}
        onAccept={handleTermsAccept}
        onClose={handleTermsDecline}
      />

      {/* Header */}
       <div className="mb-6 sm:mb-8">
         <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-3 sm:mb-4"
           style={{ background: 'rgba(255,92,0,0.1)', border: '1px solid rgba(255,92,0,0.2)' }}>
           <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
           <span className="text-[10px] sm:text-xs font-mono text-primary uppercase tracking-widest">Challenge Marketplace</span>
         </div>
         <h1 className="text-2xl sm:text-3xl font-black text-foreground mb-2">
           Choose Your <span className="text-primary">Capital Tier</span>
         </h1>
         <p className="text-xs sm:text-sm text-muted-foreground">
           Institutional funding from $5K to $200K. Select your challenge type and account model.
         </p>
       </div>

      {/* Challenge type toggle */}
      <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
        <div className="inline-flex rounded-xl p-1 flex-wrap gap-1 sm:flex-nowrap" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {[
            { id: 'two-step', label: '⚡ Two-Step' },
            { id: 'instant', label: '🚀 Instant' },
            { id: 'instant_light', label: '💡 Light' },
          ].map(t => (
            <button key={t.id} onClick={() => { setChallengeType(t.id); setSelected(null); }}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                challengeType === t.id ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
        {challengeType === 'instant_light' && (
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-[10px] sm:text-xs font-mono"
            style={{ background: 'rgba(204,255,0,0.08)', border: '1px solid rgba(204,255,0,0.2)', color: '#CCFF00' }}>
            50% OFF
          </div>
        )}
      </div>

      {/* Platform selector — always visible */}
      <div className="mb-4 sm:mb-6">
        <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">Trading Platform</div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {PLATFORMS.map(p => {
            const isSelected = platform === p.id;
            return (
              <button key={p.id} onClick={() => setPlatform(p.id)}
                className="relative flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-4 rounded-2xl transition-all duration-200 hover:scale-[1.02] group"
                style={{
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(0,102,204,0.18) 0%, rgba(0,60,120,0.12) 100%)'
                    : 'rgba(255,255,255,0.03)',
                  border: `1.5px solid ${isSelected ? 'rgba(0,122,255,0.55)' : 'rgba(255,255,255,0.08)'}`,
                  boxShadow: isSelected ? '0 0 24px rgba(0,102,204,0.18), inset 0 1px 0 rgba(255,255,255,0.06)' : 'none',
                }}>
                {/* MT5 Official Logo SVG */}
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #0066CC 0%, #004499 60%, #002266 100%)',
                    boxShadow: isSelected ? '0 4px 16px rgba(0,102,204,0.4)' : '0 2px 8px rgba(0,0,0,0.3)',
                  }}>
                  <svg viewBox="0 0 40 40" className="w-7 h-7 sm:w-8 sm:h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* MT5 Logo — stylized M + chart bars */}
                    <rect width="40" height="40" rx="8" fill="url(#mt5grad)" />
                    <defs>
                      <linearGradient id="mt5grad" x1="0" y1="0" x2="40" y2="40">
                        <stop offset="0%" stopColor="#1a8cff" />
                        <stop offset="100%" stopColor="#003399" />
                      </linearGradient>
                    </defs>
                    {/* Bars */}
                    <rect x="6" y="22" width="5" height="11" rx="1.5" fill="rgba(255,255,255,0.5)" />
                    <rect x="13" y="16" width="5" height="17" rx="1.5" fill="rgba(255,255,255,0.7)" />
                    <rect x="20" y="10" width="5" height="23" rx="1.5" fill="white" />
                    <rect x="27" y="14" width="5" height="19" rx="1.5" fill="rgba(255,255,255,0.7)" />
                    {/* MT text */}
                    <text x="5" y="9" fontSize="7" fontWeight="800" fill="white" fontFamily="Arial" letterSpacing="0.5">MT5</text>
                  </svg>
                </div>

                <div className="text-left min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className={`text-sm sm:text-base font-bold tracking-tight ${isSelected ? 'text-white' : 'text-foreground'}`}>
                      {p.label}
                    </div>
                    {isSelected && (
                      <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider"
                        style={{ background: 'rgba(0,122,255,0.25)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.3)' }}>
                        Selected
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-mono mt-0.5" style={{ color: isSelected ? 'rgba(147,197,253,0.8)' : 'rgba(255,255,255,0.35)' }}>
                    {p.desc}
                  </div>
                </div>

                {/* Selected indicator dot */}
                {isSelected && (
                  <div className="flex-shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-400" style={{ boxShadow: '0 0 8px rgba(96,165,250,0.8)' }} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Account type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-full mb-6 sm:mb-8">
        {Object.entries(ACCOUNT_TYPES).map(([key, cfg]) => (
          <motion.button key={key} onClick={() => setAccountType(key)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="rounded-xl p-3 sm:p-4 text-left transition-all"
            style={{
              background: accountType === key ? 'rgba(255,92,0,0.08)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${accountType === key ? 'rgba(255,92,0,0.5)' : 'rgba(255,255,255,0.08)'}`,
            }}>
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: accountType === key ? 'rgba(255,92,0,0.2)' : 'rgba(255,255,255,0.06)' }}>
                {key === 'standard'
                  ? <Zap className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${accountType === key ? 'text-primary' : 'text-muted-foreground'}`} />
                  : <Shield className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${accountType === key ? 'text-primary' : 'text-muted-foreground'}`} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-xs sm:text-sm font-bold truncate ${accountType === key ? 'text-primary' : 'text-foreground'}`}>{cfg.label}</div>
                <div className="text-[9px] sm:text-[10px] font-mono text-muted-foreground truncate">{cfg.leverage} leverage</div>
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
                  <span className={`text-[10px] sm:text-[11px] ${f.ok ? 'text-foreground' : 'text-muted-foreground'} truncate`}>{f.text}</span>
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
            className="grid gap-4 sm:gap-6 mb-8 sm:mb-12 grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
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
            {plans.length === 0 && !plansLoading && (
              <div className="col-span-full text-center py-12 text-muted-foreground text-sm">
                {allPlans.length === 0
                  ? 'Loading challenge plans...'
                  : `No plans available for ${challengeType.replace('-', ' ')} ${accountType} accounts.`
                }
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Quick highlights */}
      <div className="rounded-2xl p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5 mb-8 sm:mb-10"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        {[
          { icon: TrendingUp, title: 'Profit Split', desc: 'Up to 80% profit split. Scaling plan available on all funded accounts.' },
          { icon: Clock, title: 'Payout Schedule', desc: 'Request payouts every 14 days. Processed within 24-48 hours.' },
          { icon: BarChart2, title: 'Trading Rules', desc: `${accCfg.label}: ${accCfg.leverage} leverage. ${accountType === 'swing' ? 'News & overnight trading allowed.' : 'Standard trading model.'}` },
        ].map(f => {
          const Icon = f.icon;
          return (
            <div key={f.title} className="flex gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-bold text-foreground mb-0.5">{f.title}</div>
                <div className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">{f.desc}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Challenge Rules — single institutional card */}
      <div className="rounded-xl overflow-hidden mb-8"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>

        {/* Header */}
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

        {/* Table header */}
        <div className="hidden md:grid grid-cols-[2rem_10rem_1fr_5rem] gap-4 px-5 py-2 border-b"
          style={{ borderColor: 'hsl(var(--border))', background: 'rgba(255,255,255,0.02)' }}>
          <div />
          <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Rule</div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Description</div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 text-right">Category</div>
        </div>

        {/* Rows */}
        {CHALLENGE_RULES.map((rule, i) => {
          const Icon = rule.icon;
          const category = i < 3 ? 'Risk' : i < 6 ? 'Conduct' : 'Security';
          const categoryColor = i < 3 ? '#f59e0b' : i < 6 ? '#60a5fa' : '#10b981';
          return (
            <div key={rule.title}
              className="grid grid-cols-1 md:grid-cols-[2rem_10rem_1fr_5rem] gap-x-4 gap-y-1 items-start px-5 py-3.5 border-b hover:bg-white/[0.015] transition-colors"
              style={{ borderColor: 'hsl(var(--border))' }}>
              {/* Icon */}
              <div className="hidden md:flex items-center justify-center w-6 h-6 rounded flex-shrink-0 mt-0.5"
                style={{ background: 'rgba(255,255,255,0.05)' }}>
                <Icon className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              {/* Title */}
              <div className="flex items-center gap-2 md:block">
                <Icon className="md:hidden w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-sm font-medium text-foreground">{rule.title}</span>
              </div>
              {/* Body */}
              <div className="text-xs text-muted-foreground leading-relaxed pl-5 md:pl-0">{rule.body}</div>
              {/* Category */}
              <div className="hidden md:flex justify-end">
                <span className="text-[10px] font-medium px-2 py-0.5 rounded"
                  style={{ color: categoryColor, background: `${categoryColor}12`, border: `1px solid ${categoryColor}20` }}>
                  {category}
                </span>
              </div>
            </div>
          );
        })}

        {/* Footer */}
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