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
      const res = await base44.functions.invoke('getChallengePlans', {});
      const data = res?.data?.plans || res?.plans || [];
      return Array.isArray(data) ? data : [];
    },
    staleTime: 60000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const plans = allPlans
    .filter(p => {
      const typeMatch = p.type === challengeType;
      const accountMatch = (p.account_type || 'standard') === accountType;
      const visible = p.is_visible !== false;
      return typeMatch && accountMatch && visible;
    })
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
    // Build rule snapshot from live plan at moment of selection
    const ruleSnapshot = {
      daily_dd_limit: plan.daily_dd,
      max_dd_limit: plan.max_dd,
      trailing_dd: plan.type === 'instant_light',
      phase1_target: plan.phase1_target,
      phase2_target: plan.phase2_target,
      min_trading_days: plan.min_trading_days ?? 4,
      leverage,
      max_lots: plan.max_lots,
      weekend_holding: plan.weekend_holding,
      overnight_holding: plan.overnight_holding,
      news_trading: plan.news_trading,
      hedging: plan.hedging,
      profit_split: plan.profit_split,
    };
    const order = {
      challenge_type: challengeType,
      account_type: accountType,
      account_size: plan.size,
      leverage,
      price: plan.price,
      final_price: plan.price,
      platform,
      rule_snapshot: ruleSnapshot,
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

  // Build rules dynamically from the selected/first displayed plan's DB values
  const displayPlan = plans[0] || null;
  const CHALLENGE_RULES = displayPlan ? [
    { icon: TrendingDown, color: '#ef4444', title: 'Daily Drawdown', body: `Max ${displayPlan.daily_dd}% loss per trading day. Resets at 3:00 AM GMT+4 daily.` },
    { icon: AlertTriangle, color: '#f59e0b', title: 'Maximum Drawdown', body: `Total equity must never fall more than ${displayPlan.max_dd}% below starting balance. This does NOT reset.` },
    { icon: Target, color: '#10b981', title: 'Profit Target', body: displayPlan.type === 'two-step'
      ? `Phase 1: ${displayPlan.phase1_target}% target. Phase 2: ${displayPlan.phase2_target}% target.`
      : `Target: ${displayPlan.phase1_target}%. Maintain profitable operation.` },
    { icon: Calendar, color: '#6366f1', title: 'Min Trading Days', body: 'Trade on at least 4 different calendar days per phase to qualify.' },
    { icon: Ban, color: '#ef4444', title: 'News Trading', body: displayPlan.news_trading
      ? 'News trading is ALLOWED on this account type.'
      : 'Positions may not be held during high-impact news events (NFP, FOMC, CPI).' },
    { icon: Moon, color: '#8b5cf6', title: 'Overnight / Weekend', body: [
        displayPlan.overnight_holding ? 'Overnight holding ALLOWED.' : 'No overnight holding.',
        displayPlan.weekend_holding ? 'Weekend holding ALLOWED.' : 'Positions must be closed before Friday 21:00 GMT.',
      ].join(' ') },
    { icon: TrendingUp, color: '#FF5C00', title: 'Max Lots', body: `Maximum position size: ${displayPlan.max_lots} lots per trade.` },
    { icon: Users, color: '#0ea5e9', title: 'Prohibited Activities', body: 'No tick scalping, arbitrage, copy trading (without approval), HFT, or price manipulation tools.' },
    { icon: Shield, color: '#10b981', title: 'Account Security', body: 'Credentials are personal and non-transferable. Account sharing or selling = immediate termination.' },
    { icon: Wallet, color: '#FF5C00', title: 'Payout Policy', body: `${displayPlan.profit_split}% profit split for funded accounts. KYC required. Min 1 profitable cycle before withdrawal.` },
  ] : [];

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <TermsModal open={showTerms} onAccept={handleTermsAccept} onClose={handleTermsDecline} />

      {/* Header */}
      <div className="mb-8 sm:mb-12">
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl mb-4"
          style={{ background: 'linear-gradient(135deg, rgba(255,92,0,0.15), rgba(255,92,0,0.08))', border: '1px solid rgba(255,92,0,0.25)', boxShadow: '0 4px 20px rgba(255,92,0,0.1)' }}>
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-[11px] sm:text-xs font-bold text-primary uppercase tracking-wider">Challenge Marketplace</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-foreground mb-3 tracking-tight">
          Choose Your <span className="text-primary">Capital Tier</span>
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
          Institutional funding from $5K to $200K. Select your challenge type, account model, and start your professional trading journey.
        </p>
      </div>

      {/* Challenge type toggle */}
      <div className="mb-6 sm:mb-8">
        <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Challenge Type</div>
        <div className="inline-flex rounded-2xl p-1.5 flex-wrap gap-2 sm:flex-nowrap"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' }}>
          {[
            { id: 'two-step', label: '⚡ Two-Step', desc: '2 phases' },
            { id: 'instant', label: '🚀 Instant', desc: '1 phase' },
            { id: 'instant_light', label: '💡 Light', desc: 'Simplified' },
          ].map(t => {
            const isSelected = challengeType === t.id;
            return (
              <button
                key={t.id}
                onClick={() => { setChallengeType(t.id); setSelected(null); }}
                className={`relative px-4 sm:px-5 py-3 rounded-xl text-left transition-all duration-200 min-w-[100px] sm:min-w-[120px] ${
                  isSelected ? 'text-white' : 'text-muted-foreground hover:text-foreground'
                }`}
                style={isSelected ? {
                  background: 'linear-gradient(135deg, #FF5C00, #FF7A2F)',
                  boxShadow: '0 4px 16px rgba(255,92,0,0.3)',
                } : {}}>
                <div className="text-sm sm:text-base font-bold">{t.label}</div>
                <div className={`text-[9px] sm:text-[10px] ${isSelected ? 'text-white/80' : 'text-muted-foreground'}`}>{t.desc}</div>
                {t.id === 'instant_light' && (
                  <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-md text-[8px] font-black"
                    style={{ background: '#CCFF00', color: '#000000', border: '1px solid rgba(255,255,255,0.3)' }}>
                    -50%
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Platform selector */}
      <div className="mb-6 sm:mb-8">
        <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Trading Platform</div>
        <div className="flex flex-wrap gap-3">
          {PLATFORMS.map(p => {
            const isSelected = platform === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setPlatform(p.id)}
                className="group relative flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 hover:scale-[1.02] w-full sm:w-auto"
                style={{
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(255,92,0,0.12), rgba(255,92,0,0.06))'
                    : 'rgba(255,255,255,0.03)',
                  border: `1.5px solid ${isSelected ? 'rgba(255,92,0,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  boxShadow: isSelected ? '0 4px 20px rgba(255,92,0,0.15)' : 'none',
                }}>
                <div className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <img
                    src="https://media.base44.com/images/public/69ff44f98e27baf8957d0676/5fd49743c_image.png"
                    alt="MetaTrader 5"
                    className="w-14 h-14 object-contain transition-transform group-hover:scale-110"
                  />
                </div>
                <div className="text-left min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className={`text-base font-bold tracking-tight ${isSelected ? 'text-white' : 'text-foreground'}`}>
                      {p.label}
                    </div>
                    {isSelected && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider"
                        style={{ background: 'linear-gradient(135deg, #FF5C00, #FF7A2F)', color: '#ffffff' }}>
                        Selected
                      </span>
                    )}
                  </div>
                  <div className={`text-[11px] ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                    {p.desc}
                  </div>
                </div>
                {isSelected && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #FF5C00, #FF7A2F)', boxShadow: '0 2px 12px rgba(255,92,0,0.4)' }}>
                    <Check className="w-4 h-4 text-white" strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Account type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mb-8 sm:mb-10">
        {Object.entries(ACCOUNT_TYPES).map(([key, cfg]) => {
          const isSelected = accountType === key;
          return (
            <motion.button
              key={key}
              onClick={() => setAccountType(key)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="rounded-2xl p-5 text-left transition-all duration-300"
              style={{
                background: isSelected
                  ? 'linear-gradient(135deg, rgba(255,92,0,0.15), rgba(255,92,0,0.08))'
                  : 'rgba(255,255,255,0.03)',
                border: `1.5px solid ${isSelected ? 'rgba(255,92,0,0.4)' : 'rgba(255,255,255,0.08)'}`,
                boxShadow: isSelected ? '0 4px 20px rgba(255,92,0,0.1)' : 'none',
              }}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: isSelected
                        ? 'linear-gradient(135deg, #FF5C00, #FF7A2F)'
                        : 'rgba(255,255,255,0.06)',
                      boxShadow: isSelected ? '0 2px 12px rgba(255,92,0,0.4)' : 'none',
                    }}>
                    {key === 'standard'
                      ? <Zap className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-muted-foreground'}`} />
                      : <Shield className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-muted-foreground'}`} />}
                  </div>
                  <div>
                    <div className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-foreground'}`}>{cfg.label}</div>
                    <div className={`text-[10px] font-mono ${isSelected ? 'text-white/70' : 'text-muted-foreground'}`}>{cfg.leverage} leverage</div>
                  </div>
                </div>
                {isSelected && (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #FF5C00, #FF7A2F)', boxShadow: '0 2px 12px rgba(255,92,0,0.4)' }}>
                    <Check className="w-4 h-4 text-white" strokeWidth={3} />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                {cfg.features.map(f => (
                  <div key={f.text} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${f.ok ? 'bg-emerald-400' : 'bg-red-400'}`}
                      style={{ boxShadow: f.ok ? '0 0 8px rgba(52,211,153,0.5)' : 'none' }} />
                    <span className={`text-xs ${f.ok ? 'text-foreground' : 'text-muted-foreground'}`}>{f.text}</span>
                  </div>
                ))}
              </div>
            </motion.button>
          );
        })}
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
                badge = '50% Cheaper';
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
                  ? 'No challenge plans found in database. Please add plans via Admin → Challenges.'
                  : (
                    <div>
                      <div className="mb-2">No plans match current filters.</div>
                      <div className="text-xs font-mono opacity-60">
                        Total plans: {allPlans.length} | Filter: type={challengeType}, account_type={accountType}<br/>
                        Plan types in DB: {[...new Set(allPlans.map(p => p.type))].join(', ')}<br/>
                        Account types in DB: {[...new Set(allPlans.map(p => p.account_type || 'standard'))].join(', ')}
                      </div>
                    </div>
                  )
                }
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Quick highlights */}
      <div className="rounded-3xl p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-10 sm:mb-12"
        style={{
          background: 'linear-gradient(135deg, rgba(255,92,0,0.08), rgba(255,92,0,0.03))',
          border: '1.5px solid rgba(255,92,0,0.2)',
          boxShadow: '0 4px 30px rgba(255,92,0,0.1)',
        }}>
        {[
          { icon: TrendingUp, title: 'Profit Split', desc: 'Up to 80% profit split. Scaling plan available on all funded accounts.' },
          { icon: Clock, title: 'Payout Schedule', desc: 'Request payouts every 14 days. Processed within 24-48 hours.' },
          { icon: BarChart2, title: 'Trading Rules', desc: `${accCfg.label}: ${accCfg.leverage} leverage. ${accountType === 'swing' ? 'News & overnight trading allowed.' : 'Standard trading model.'}` },
        ].map((f, i) => {
          const Icon = f.icon;
          return (
            <div key={f.title} className="flex gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,92,0,0.2), rgba(255,92,0,0.1))',
                  border: '1px solid rgba(255,92,0,0.3)',
                  boxShadow: '0 2px 12px rgba(255,92,0,0.2)',
                }}>
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-foreground mb-1">{f.title}</div>
                <div className="text-xs text-muted-foreground leading-relaxed">{f.desc}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Challenge Rules */}
      <div className="rounded-3xl overflow-hidden mb-8"
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1.5px solid rgba(255,255,255,0.1)',
          boxShadow: '0 4px 30px rgba(0,0,0,0.3)',
        }}>
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div>
            <div className="text-base font-bold text-foreground">Challenge Rules</div>
            <div className="text-xs text-muted-foreground mt-1">Read carefully — violations result in immediate termination</div>
          </div>
          <span className="px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider"
            style={{
              background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.1))',
              color: '#f87171',
              border: '1px solid rgba(239,68,68,0.3)',
              boxShadow: '0 2px 12px rgba(239,68,68,0.15)',
            }}>
            Binding
          </span>
        </div>
        <div className="divide-y" style={{ divideColor: 'rgba(255,255,255,0.05)' }}>
          {CHALLENGE_RULES.map((rule, i) => {
            const Icon = rule.icon;
            const category = i < 3 ? 'Risk' : i < 6 ? 'Conduct' : 'Security';
            const categoryColor = i < 3 ? '#f59e0b' : i < 6 ? '#60a5fa' : '#10b981';
            return (
              <div key={rule.title} className="px-6 py-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <Icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="text-sm font-bold text-foreground">{rule.title}</div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider hidden sm:inline-block"
                        style={{ color: categoryColor, background: `${categoryColor}12`, border: `1px solid ${categoryColor}25` }}>
                        {category}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground leading-relaxed">{rule.body}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="px-6 py-4 flex items-center gap-3"
          style={{ background: 'rgba(239,68,68,0.05)', borderTop: '1px solid rgba(239,68,68,0.15)' }}>
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span className="text-xs text-muted-foreground">
            Purchasing a challenge constitutes full acceptance of all rules listed above.
          </span>
        </div>
      </div>
    </div>
  );
}