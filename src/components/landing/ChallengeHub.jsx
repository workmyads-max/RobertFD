import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  Layers, Rocket, Zap, Target, TrendingDown, Gauge, Clock,
  CalendarClock, RefreshCw, Award, ArrowRight, Star, DollarSign,
} from 'lucide-react';

// ── Challenge type definitions (rules mirror the ChallengePlan entity) ──────────
const TYPES = [
  {
    id: 'two-step', label: '2-Step', sub: 'Standard 2-Phase', icon: Layers,
    splitPct: 80, firstTarget: 10,
    rows: [
      { label: 'Profit Target', icon: Target, kind: 'phases', phases: [10, 5] },
      { label: 'Max Daily Loss', icon: TrendingDown, kind: 'pct', pct: 5 },
      { label: 'Max Loss', icon: TrendingDown, kind: 'pct', pct: 10 },
      { label: 'Min Trading Days', icon: Clock, kind: 'static', value: '4 days' },
      { label: 'Trading Period', icon: CalendarClock, kind: 'static', value: 'Unlimited' },
      { label: 'Refund', icon: RefreshCw, kind: 'static', value: 'Yes · 100%', good: true },
      { label: 'Reward Split', icon: Award, kind: 'static', value: 'Up to 80%' },
    ],
  },
  {
    id: 'one_step', label: '1-Step', sub: 'Single Phase · 90% Split', icon: Rocket,
    splitPct: 90, firstTarget: 8,
    rows: [
      { label: 'Profit Target', icon: Target, kind: 'pct', pct: 8 },
      { label: 'Max Daily Loss', icon: TrendingDown, kind: 'pct', pct: 4 },
      { label: 'Max Loss (Trailing)', icon: TrendingDown, kind: 'pct', pct: 8 },
      { label: 'Best Day Rule', icon: Gauge, kind: 'static', value: '50%' },
      { label: 'Min Trading Days', icon: Clock, kind: 'static', value: 'None', good: true },
      { label: 'Trading Period', icon: CalendarClock, kind: 'static', value: 'Unlimited' },
      { label: 'Reward Split', icon: Award, kind: 'static', value: 'Up to 90%' },
    ],
  },
  {
    id: 'instant_account', label: 'Instant', sub: 'Buffer Zone · Dynamic Rules', icon: Zap,
    splitPct: 80, firstTarget: 5,
    rows: [
      { label: 'Buffer Zone Target', icon: Target, kind: 'pct', pct: 5 },
      { label: 'Max Daily Loss', icon: TrendingDown, kind: 'pct', pct: 4 },
      { label: 'Max Loss', icon: TrendingDown, kind: 'pct', pct: 8 },
      { label: 'Consistency Rule', icon: Gauge, kind: 'static', value: '35%' },
      { label: 'Min Profitable Days', icon: Clock, kind: 'static', value: '7 days' },
      { label: 'Trading Period', icon: CalendarClock, kind: 'static', value: 'Unlimited' },
      { label: 'Reward Split', icon: Award, kind: 'static', value: 'Up to 80%' },
    ],
  },
];

// Fallback pricing if the live fetch is empty - [size, price, popular?]
const FALLBACK = {
  'two-step': [[5000, 49], [10000, 89], [25000, 235], [50000, 349], [100000, 517, true], [200000, 1089]],
  'one_step': [[5000, 59], [10000, 109], [25000, 279, true], [50000, 419], [100000, 619], [200000, 1299]],
  'instant_account': [[25000, 607], [50000, 1350, true], [100000, 2430], [200000, 4850]],
};

const money = (n) => '$' + Math.round(n).toLocaleString('en-US');
const sizeLabel = (s) => '$' + s.toLocaleString('en-US');

function cellValue(row, size, showNumbers) {
  if (row.kind === 'static') return { text: row.value, good: row.good };
  if (row.kind === 'pct') {
    return { text: showNumbers ? money(size * row.pct / 100) : `${row.pct}%` };
  }
  if (row.kind === 'phases') {
    const [p1, p2] = row.phases;
    return {
      text: showNumbers
        ? `${money(size * p1 / 100)} / ${money(size * p2 / 100)}`
        : `${p1}% / ${p2}%`,
    };
  }
  return { text: '-' };
}

export default function ChallengeHub() {
  const navigate = useNavigate();
  const [activeType, setActiveType] = useState('two-step');
  const [showNumbers, setShowNumbers] = useState(false);

  const { data: plans = [] } = useQuery({
    queryKey: ['challenge-hub-plans'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getChallengePlans', {});
      return res?.data?.plans || [];
    },
    staleTime: 60000,
  });

  const config = TYPES.find((t) => t.id === activeType);

  // Build the size columns for the active type from live data (fallback to constants)
  const columns = useMemo(() => {
    const live = plans
      .filter((p) => p.type === activeType && p.account_type === 'standard' && p.is_active && p.is_visible)
      .map((p) => ({ size: p.size, price: p.price, popular: p.is_popular }));
    const source = live.length ? live : (FALLBACK[activeType] || []).map(([size, price, popular]) => ({ size, price, popular: !!popular }));
    return source.sort((a, b) => a.size - b.size);
  }, [plans, activeType]);

  const goCheckout = (size) => navigate(`/challenges?type=${activeType}&size=${size}`);

  return (
    <section id="challenge" className="relative py-20 md:py-28 overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,92,0,0.10), transparent 70%)', filter: 'blur(40px)' }} />

      <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="text-center mb-10">
          <span className="text-xs font-mono text-primary uppercase tracking-widest">Choose Your Plan</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mt-4 mb-4 text-white">
            Choose Your Challenge
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
            Pick your funding path and capital - transparent objectives, no hidden rules.
          </p>
        </motion.div>

        {/* Type toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex flex-wrap justify-center gap-1.5 p-1.5 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {TYPES.map((t) => {
              const Icon = t.icon;
              const active = activeType === t.id;
              return (
                <button key={t.id} onClick={() => setActiveType(t.id)}
                  className="relative flex items-center gap-2.5 px-4 sm:px-5 py-2.5 rounded-xl transition-colors"
                  style={{ color: active ? '#fff' : 'rgba(255,255,255,0.5)' }}>
                  {active && (
                    <motion.div layoutId="hub-type-pill" className="absolute inset-0 rounded-xl"
                      style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)', boxShadow: '0 4px 16px rgba(255,92,0,0.3)' }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }} />
                  )}
                  <Icon className="relative w-4 h-4" />
                  <span className="relative text-left leading-tight">
                    <span className="block text-sm font-bold">{t.label}</span>
                    <span className="block text-[10px] opacity-70">{t.sub}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Show numbers toggle */}
        <div className="flex justify-end mb-4">
          <button onClick={() => setShowNumbers((v) => !v)}
            className="flex items-center gap-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
            <span className={`relative w-9 h-5 rounded-full transition-colors ${showNumbers ? 'bg-primary' : 'bg-white/10'}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${showNumbers ? 'left-[18px]' : 'left-0.5'}`} />
            </span>
            Show $ Values
          </button>
        </div>

        {/* Matrix */}
        <AnimatePresence mode="wait">
          <motion.div key={activeType}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(14,14,18,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[640px]">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 text-left px-5 py-5 align-bottom"
                      style={{ background: 'rgba(14,14,18,0.95)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Trading Objectives</span>
                    </th>
                    {columns.map((c) => (
                      <th key={c.size} className="px-4 py-5 text-center relative"
                        style={{
                          borderBottom: '1px solid rgba(255,255,255,0.07)',
                          borderLeft: '1px solid rgba(255,255,255,0.04)',
                          background: c.popular ? 'rgba(255,92,0,0.05)' : 'transparent',
                        }}>
                        {c.popular && (
                          <span className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2.5 py-0.5 rounded-full whitespace-nowrap"
                            style={{ background: 'linear-gradient(90deg,#FF5C00,#FF8A3D)', boxShadow: '0 2px 10px rgba(255,92,0,0.4)' }}>
                            <Star className="w-2.5 h-2.5 text-white fill-white" />
                            <span className="text-[9px] font-black text-white uppercase tracking-wider">Best Value</span>
                          </span>
                        )}
                        <div className={`text-[10px] font-mono uppercase tracking-wider text-muted-foreground ${c.popular ? 'mt-3' : ''}`}>Account</div>
                        <div className="text-lg font-black text-white mt-0.5">{sizeLabel(c.size)}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {config.rows.map((row, ri) => {
                    const RowIcon = row.icon;
                    return (
                      <tr key={row.label}>
                        <td className="sticky left-0 z-10 px-5 py-3.5"
                          style={{ background: 'rgba(14,14,18,0.95)', borderBottom: ri < config.rows.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                          <div className="flex items-center gap-2.5 whitespace-nowrap">
                            <RowIcon className="w-3.5 h-3.5 text-primary/70 flex-shrink-0" />
                            <span className="text-xs font-medium text-foreground">{row.label}</span>
                          </div>
                        </td>
                        {columns.map((c) => {
                          const v = cellValue(row, c.size, showNumbers);
                          return (
                            <td key={c.size} className="px-4 py-3.5 text-center"
                              style={{
                                borderBottom: ri < config.rows.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                borderLeft: '1px solid rgba(255,255,255,0.04)',
                                background: c.popular ? 'rgba(255,92,0,0.04)' : 'transparent',
                              }}>
                              <span className={`text-xs font-bold ${v.good ? 'text-emerald-400' : 'text-foreground'}`}>{v.text}</span>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  {/* Price + CTA row */}
                  <tr>
                    <td className="sticky left-0 z-10 px-5 py-5"
                      style={{ background: 'rgba(14,14,18,0.95)', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                      <span className="text-[10px] text-muted-foreground leading-tight block">One-time<br />refundable fee from</span>
                    </td>
                    {columns.map((c) => (
                      <td key={c.size} className="px-3 py-5 text-center"
                        style={{
                          borderTop: '1px solid rgba(255,255,255,0.07)',
                          borderLeft: '1px solid rgba(255,255,255,0.04)',
                          background: c.popular ? 'rgba(255,92,0,0.04)' : 'transparent',
                        }}>
                        <div className="text-base font-black text-white mb-2.5">{money(c.price)}</div>
                        <button onClick={() => goCheckout(c.size)}
                          className="w-full py-2 rounded-lg text-xs font-bold transition-all hover:opacity-90 active:scale-95 flex items-center justify-center gap-1"
                          style={c.popular
                            ? { background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)', color: '#fff', boxShadow: '0 4px 14px rgba(255,92,0,0.3)' }
                            : { background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
                          Start now <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    ))}
                  </tr>
                  {/* Avg reward row */}
                  <tr>
                    <td className="sticky left-0 z-10 px-5 py-3"
                      style={{ background: 'rgba(14,14,18,0.95)' }}>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <DollarSign className="w-3 h-3" /> Est. Reward
                      </span>
                    </td>
                    {columns.map((c) => {
                      const est = c.size * (config.firstTarget / 100) * (config.splitPct / 100);
                      return (
                        <td key={c.size} className="px-3 py-3 text-center"
                          style={{ borderLeft: '1px solid rgba(255,255,255,0.04)' }}>
                          <div className="rounded-lg py-1.5" style={{ background: 'rgba(255,255,255,0.03)' }}>
                            <div className="text-xs font-black text-emerald-400">{money(est)}</div>
                            <div className="text-[9px] text-muted-foreground">Avg. Reward</div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                </tfoot>
              </table>
            </div>
          </motion.div>
        </AnimatePresence>

        <p className="text-center text-xs text-muted-foreground max-w-3xl mx-auto leading-relaxed mt-8">
          Leverage varies by account size and instrument. Estimated reward is illustrative, based on the first profit
          target and reward split. Reward split applies to simulation funded accounts only.
        </p>
      </div>
    </section>
  );
}