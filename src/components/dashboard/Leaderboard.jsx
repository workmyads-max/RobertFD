import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, TrendingUp, Users, Globe, Medal, Crown, Star, Zap, Filter, Radio } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import confetti from 'canvas-confetti';

const FLAG = code => {
  if (!code) return '🌍';
  const c = code.toUpperCase();
  try { return String.fromCodePoint(...[...c].map(ch => 0x1F1E6 + ch.charCodeAt(0) - 65)); }
  catch { return '🌍'; }
};

const COUNTRY_NAMES = {
  US: 'United States', GB: 'United Kingdom', AE: 'UAE', SG: 'Singapore', AU: 'Australia',
  CA: 'Canada', DE: 'Germany', FR: 'France', JP: 'Japan', IN: 'India', PK: 'Pakistan',
  NG: 'Nigeria', ZA: 'South Africa', BR: 'Brazil', MX: 'Mexico', TH: 'Thailand',
  ID: 'Indonesia', MY: 'Malaysia', PH: 'Philippines', EG: 'Egypt', SA: 'Saudi Arabia',
  TR: 'Turkey', IT: 'Italy', ES: 'Spain', NL: 'Netherlands', SE: 'Sweden', NZ: 'New Zealand',
  KE: 'Kenya', GH: 'Ghana', AO: 'Angola', RO: 'Romania', HU: 'Hungary',
};

const MEDALS = {
  1: { color: '#FFD700', glow: 'rgba(255,215,0,0.35)', bg: 'rgba(255,215,0,0.08)', border: 'rgba(255,215,0,0.35)', label: '1ST', emoji: '🥇', title: '🏆 CHAMPION' },
  2: { color: '#C0C0C0', glow: 'rgba(192,192,192,0.25)', bg: 'rgba(192,192,192,0.06)', border: 'rgba(192,192,192,0.25)', label: '2ND', emoji: '🥈', title: '🥈 RUNNER-UP' },
  3: { color: '#CD7F32', glow: 'rgba(205,127,50,0.25)', bg: 'rgba(205,127,50,0.06)', border: 'rgba(205,127,50,0.25)', label: '3RD', emoji: '🥉', title: '🥉 3RD PLACE' },
};

const ACCOUNT_SIZE_FILTERS = [
  { label: 'All Sizes', value: 0 },
  { label: '$10K', value: 10000 },
  { label: '$25K', value: 25000 },
  { label: '$50K', value: 50000 },
  { label: '$100K', value: 100000 },
  { label: '$200K', value: 200000 },
];

const PLATFORM_COLORS = {
  match_trader: { color: '#60a5fa', label: 'Match Trader' },
  xtrading: { color: '#FF5C00', label: 'XTrading' },
  mt5: { color: '#10b981', label: 'MT5' },
  tradelocker: { color: '#a78bfa', label: 'TradeLocker' },
};

// ── Podium card ───────────────────────────────────────────────────────────────
function PodiumCard({ trader, rank, onCelebrate }) {
  const m = MEDALS[rank];
  const profitRatio = ((trader.pnl || 0) / (trader.account_size || 1)) * 100;
  const heights = { 1: 'h-64', 2: 'h-52', 3: 'h-48' };
  const orders = { 1: 'order-2', 2: 'order-1', 3: 'order-3' };
  const plt = PLATFORM_COLORS[trader.platform] || PLATFORM_COLORS.xtrading;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.1, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => onCelebrate(rank)}
      className={`${orders[rank]} cursor-pointer flex flex-col items-center`}
    >
      {rank === 1 && (
        <motion.div animate={{ y: [-3, 3, -3], rotate: [-5, 5, -5] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} className="text-3xl mb-1">
          👑
        </motion.div>
      )}

      <motion.div whileHover={{ scale: 1.04, y: -4 }} whileTap={{ scale: 0.97 }}
        className={`relative w-full rounded-2xl p-5 flex flex-col items-center ${heights[rank]}`}
        style={{ background: `linear-gradient(160deg, ${m.bg}, rgba(8,12,22,0.98))`, border: `1px solid ${m.border}`, boxShadow: `0 0 50px ${m.glow}, inset 0 0 20px ${m.bg}` }}>

        <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl"
          style={{ background: `linear-gradient(90deg, transparent, ${m.color}, transparent)` }} />

        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[9px] font-black"
          style={{ background: m.color, color: '#000' }}>{m.label}</div>

        <div className="mt-3 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black mb-2 relative flex-shrink-0"
          style={{ background: `${m.color}22`, border: `2px solid ${m.color}60`, boxShadow: `0 0 24px ${m.glow}` }}>
          {FLAG(trader.country)}
          {rank === 1 && (
            <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }} transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-2xl" style={{ background: m.color, opacity: 0.1 }} />
          )}
        </div>

        <div className="text-sm font-black text-white truncate max-w-full">{trader.username || 'Trader'}</div>
        <div className="text-[10px] font-mono mb-1" style={{ color: m.color }}>
          {COUNTRY_NAMES[trader.country?.toUpperCase()] || trader.country || 'Global'}
        </div>
        <div className="text-[9px] font-mono mb-2 px-2 py-0.5 rounded-full" style={{ background: `${plt.color}18`, color: plt.color }}>{plt.label}</div>

        <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2.5, repeat: Infinity }}
          className="text-2xl font-black" style={{ color: m.color, textShadow: `0 0 16px ${m.glow}` }}>
          +{profitRatio.toFixed(1)}%
        </motion.div>
        <div className="text-[10px] font-mono text-white/30">${(trader.pnl || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })} profit</div>

        <div className="mt-auto pt-2 border-t w-full text-center" style={{ borderColor: `${m.color}25` }}>
          <span className="text-[10px] font-mono text-white/30">${(trader.account_size || 0).toLocaleString()} account</span>
        </div>
      </motion.div>

      <div className="w-full mt-1 rounded-b-lg flex items-center justify-center py-1.5"
        style={{ background: `${m.color}18`, border: `1px solid ${m.color}25`, borderTop: 'none' }}>
        <span className="text-[9px] font-mono" style={{ color: m.color }}>{m.title}</span>
      </div>
    </motion.div>
  );
}

// ── Leaderboard row ───────────────────────────────────────────────────────────
function LeaderRow({ trader, rank }) {
  const m = MEDALS[rank] || { color: 'rgba(255,255,255,0.25)', glow: 'none', bg: 'rgba(255,255,255,0.02)', border: 'rgba(255,255,255,0.06)' };
  const profitRatio = ((trader.pnl || 0) / (trader.account_size || 1)) * 100;
  const challengeLabel = { 'instant_light': 'Instant Light', 'instant': 'Instant', 'two-step': 'Two-Step' }[trader.challenge_type] || 'Funded';
  const plt = PLATFORM_COLORS[trader.platform] || PLATFORM_COLORS.xtrading;

  return (
    <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(rank * 0.03, 0.4) }}
      whileHover={{ x: 3, background: 'rgba(255,255,255,0.04)' }}
      className="flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all"
      style={{ background: m.bg, border: `1px solid ${m.border}` }}>

      {/* Rank */}
      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0"
        style={{ background: `${m.color}18`, color: m.color, border: `1px solid ${m.color}35` }}>
        {rank <= 3 ? m.emoji : `#${rank}`}
      </div>

      {/* Flag + name */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-xl flex-shrink-0">{FLAG(trader.country)}</span>
        <div className="min-w-0">
          <div className="text-sm font-bold text-white truncate">{trader.username || 'Trader'}</div>
          <div className="text-[10px] font-mono text-white/30">{COUNTRY_NAMES[trader.country?.toUpperCase()] || 'Global'}</div>
        </div>
      </div>

      {/* Platform */}
      <div className="hidden md:block flex-shrink-0">
        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ background: `${plt.color}15`, color: plt.color, border: `1px solid ${plt.color}25` }}>
          {plt.label}
        </span>
      </div>

      {/* Challenge type */}
      <div className="hidden sm:block flex-shrink-0">
        <span className="px-2 py-0.5 rounded-full text-[9px] font-black"
          style={{ background: trader.status === 'funded' ? 'rgba(204,255,0,0.1)' : 'rgba(255,92,0,0.1)', border: `1px solid ${trader.status === 'funded' ? 'rgba(204,255,0,0.3)' : 'rgba(255,92,0,0.3)'}`, color: trader.status === 'funded' ? '#CCFF00' : '#FF5C00' }}>
          {challengeLabel}
        </span>
      </div>

      {/* Account size */}
      <div className="hidden md:flex flex-col items-end flex-shrink-0">
        <span className="text-[10px] text-white/25 font-mono">Account</span>
        <span className="text-sm font-bold text-white">${(trader.account_size || 0).toLocaleString()}</span>
      </div>

      {/* Win rate */}
      <div className="hidden lg:flex flex-col items-end flex-shrink-0">
        <span className="text-[10px] text-white/25 font-mono">Win %</span>
        <span className="text-sm font-bold text-white">{(trader.win_rate || 0).toFixed(0)}%</span>
      </div>

      {/* Profit % */}
      <div className="flex flex-col items-end flex-shrink-0">
        <span className="text-[10px] text-white/25 font-mono">Profit</span>
        <span className="text-sm font-black" style={{ color: profitRatio >= 0 ? '#10b981' : '#ef4444' }}>
          {profitRatio >= 0 ? '+' : ''}{profitRatio.toFixed(1)}%
        </span>
      </div>

      {/* P&L */}
      <div className="flex flex-col items-end flex-shrink-0">
        <span className="text-[10px] text-white/25 font-mono">P&L</span>
        <span className="text-sm font-bold" style={{ color: (trader.pnl || 0) >= 0 ? '#10b981' : '#ef4444' }}>
          {(trader.pnl || 0) >= 0 ? '+' : ''}${Math.abs(trader.pnl || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
        </span>
      </div>
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Leaderboard() {
  const [country, setCountry] = useState('all');
  const [sizeFilter, setSizeFilter] = useState(0);

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['leaderboard-accounts'],
    queryFn: async () => {
      const [funded, instant, instantLight] = await Promise.all([
        base44.entities.ChallengeAccount.filter({ status: 'funded' }, '-pnl', 200),
        base44.entities.ChallengeAccount.filter({ status: 'active', challenge_type: 'instant' }, '-pnl', 100),
        base44.entities.ChallengeAccount.filter({ status: 'active', challenge_type: 'instant_light' }, '-pnl', 100),
      ]);
      return [...funded, ...instant, ...instantLight];
    },
    refetchInterval: 30000,
  });

  const sorted = [...accounts]
    .filter(a => (a.pnl || 0) > 0)
    .map(a => ({
      ...a,
      username: a.login_credentials || `Trader_${(a.account_id || a.id || '').slice(-4)}`,
      profitRatio: ((a.pnl || 0) / (a.account_size || 1)) * 100,
    }))
    .sort((x, y) => y.profitRatio - x.profitRatio);

  // Apply filters
  const afterSize = sizeFilter === 0 ? sorted : sorted.filter(t => t.account_size === sizeFilter);
  const filtered = country === 'all' ? afterSize : afterSize.filter(t => t.country?.toUpperCase() === country);

  const countries = [...new Set(sorted.map(t => t.country?.toUpperCase()).filter(Boolean))].slice(0, 12);
  const top3 = filtered.slice(0, 3);
  const rest = filtered.slice(3, 50);

  const fireCelebration = (rank) => {
    if (rank !== 1) return;
    confetti({ particleCount: 140, spread: 80, origin: { y: 0.5 }, colors: ['#FFD700', '#FF5C00', '#CCFF00', '#fff'] });
  };

  const totalCapital = sorted.reduce((s, t) => s + (t.account_size || 0), 0);
  const avgProfit = sorted.length > 0 ? sorted.reduce((s, t) => s + t.profitRatio, 0) / sorted.length : 0;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-2"
            style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.2)' }}>
            <Radio className="w-3 h-3 text-yellow-400 animate-pulse" />
            <span className="text-[10px] font-mono text-yellow-400 uppercase tracking-widest">Live Rankings</span>
          </div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 3, repeat: Infinity }}>
              <Trophy className="w-8 h-8 text-yellow-400" />
            </motion.div>
            Funded Leaderboard
          </h1>
          <p className="text-xs font-mono text-white/30 mt-1">Institutional performance rankings · Real backend data only</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981' }}>
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          LIVE · Auto-refresh 30s
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Funded Traders', value: sorted.length, icon: Users, color: '#FF5C00' },
          { label: 'Avg Profit %', value: `${avgProfit.toFixed(1)}%`, icon: TrendingUp, color: '#10b981' },
          { label: 'Top Trader', value: sorted[0]?.username || '—', icon: Crown, color: '#FFD700', truncate: true },
          { label: 'Total Capital', value: totalCapital >= 1e6 ? `$${(totalCapital / 1e6).toFixed(1)}M` : `$${(totalCapital / 1e3).toFixed(0)}K`, icon: Trophy, color: '#a78bfa' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="rounded-2xl p-4 relative overflow-hidden"
              style={{ background: `${s.color}08`, border: `1px solid ${s.color}22` }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-mono uppercase text-white/30">{s.label}</span>
                <Icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <div className={`text-lg font-black text-white ${s.truncate ? 'truncate' : ''}`}>{s.value}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Account size filter */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-white/30 mr-1">
          <Filter className="w-3 h-3" /> Size:
        </div>
        {ACCOUNT_SIZE_FILTERS.map(f => (
          <button key={f.value} onClick={() => setSizeFilter(f.value)}
            className="px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all"
            style={{
              background: sizeFilter === f.value ? 'rgba(255,92,0,0.18)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${sizeFilter === f.value ? 'rgba(255,92,0,0.5)' : 'rgba(255,255,255,0.08)'}`,
              color: sizeFilter === f.value ? '#FF5C00' : 'rgba(255,255,255,0.4)',
            }}>{f.label}</button>
        ))}
      </div>

      {/* Country filter */}
      {countries.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => setCountry('all')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-mono transition-all"
            style={{ background: country === 'all' ? 'rgba(255,92,0,0.18)' : 'rgba(255,255,255,0.04)', border: `1px solid ${country === 'all' ? 'rgba(255,92,0,0.5)' : 'rgba(255,255,255,0.08)'}`, color: country === 'all' ? '#FF5C00' : 'rgba(255,255,255,0.4)' }}>
            <Globe className="w-3 h-3" /> All Countries
          </button>
          {countries.map(c => (
            <button key={c} onClick={() => setCountry(c)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-mono transition-all"
              style={{ background: country === c ? 'rgba(255,92,0,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${country === c ? 'rgba(255,92,0,0.4)' : 'rgba(255,255,255,0.07)'}`, color: country === c ? '#FF5C00' : 'rgba(255,255,255,0.35)' }}>
              <span>{FLAG(c)}</span><span>{COUNTRY_NAMES[c] || c}</span>
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="py-20 flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-yellow-400 border-t-transparent animate-spin" />
          <span className="text-xs font-mono text-white/30">Loading rankings…</span>
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="py-20 text-center rounded-2xl border border-dashed border-white/10">
          <Trophy className="w-12 h-12 text-white/10 mx-auto mb-3" />
          <div className="text-base font-bold text-white/40">No traders ranked yet</div>
          <div className="text-xs font-mono text-white/20 mt-1">
            {sizeFilter > 0 ? `No funded traders with $${sizeFilter.toLocaleString()} account` : country !== 'all' ? `No funded traders from ${COUNTRY_NAMES[country] || country} yet` : 'Complete a challenge to appear here'}
          </div>
        </motion.div>
      ) : (
        <>
          {/* Podium */}
          {top3.length >= 1 && (
            <div>
              <div className="text-[9px] font-mono uppercase tracking-widest text-white/25 mb-4 flex items-center gap-2">
                <Crown className="w-3 h-3 text-yellow-400" /> Top Performers — All data from live backend
              </div>
              <div className="grid grid-cols-3 gap-3 max-w-2xl mx-auto">
                {top3.map((t, i) => <PodiumCard key={t.id} trader={t} rank={i + 1} onCelebrate={fireCelebration} />)}
              </div>
            </div>
          )}

          {/* Rest */}
          {rest.length > 0 && (
            <div>
              <div className="text-[9px] font-mono uppercase tracking-widest text-white/25 mb-3 flex items-center gap-2">
                <Medal className="w-3 h-3 text-primary" /> Rankings #4–{Math.min(rest.length + 3, 50)}
              </div>
              <div className="space-y-1.5">
                {rest.map((t, i) => <LeaderRow key={t.id} trader={t} rank={i + 4} />)}
              </div>
            </div>
          )}
        </>
      )}

      <div className="text-center text-[10px] font-mono text-white/20 pt-2 pb-4">
        Rankings: profit % = (P&L ÷ account size) × 100 · Funded & active accounts only · No fake or demo data
      </div>
    </div>
  );
}