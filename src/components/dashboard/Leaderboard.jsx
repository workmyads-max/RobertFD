import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, TrendingUp, Users, Globe, Medal, Crown, Star, Sparkles, Zap, Award } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import confetti from 'canvas-confetti';

// ── Country flag emoji helper ─────────────────────────────────────────────────
const FLAG = code => {
  if (!code) return '🌍';
  const c = code.toUpperCase();
  try {
    return String.fromCodePoint(...[...c].map(ch => 0x1F1E6 + ch.charCodeAt(0) - 65));
  } catch { return '🌍'; }
};

// ── Country name map ──────────────────────────────────────────────────────────
const COUNTRY_NAMES = {
  US: 'United States', GB: 'United Kingdom', AE: 'UAE', SG: 'Singapore', AU: 'Australia',
  CA: 'Canada', DE: 'Germany', FR: 'France', JP: 'Japan', IN: 'India', PK: 'Pakistan',
  NG: 'Nigeria', ZA: 'South Africa', BR: 'Brazil', MX: 'Mexico', TH: 'Thailand',
  ID: 'Indonesia', MY: 'Malaysia', PH: 'Philippines', EG: 'Egypt', SA: 'Saudi Arabia',
  TR: 'Turkey', IT: 'Italy', ES: 'Spain', NL: 'Netherlands', SE: 'Sweden', NZ: 'New Zealand',
  KE: 'Kenya', GH: 'Ghana', AO: 'Angola', RO: 'Romania', HU: 'Hungary',
};

// ── Medal config ──────────────────────────────────────────────────────────────
const MEDALS = {
  1: { color: '#FFD700', glow: 'rgba(255,215,0,0.35)', bg: 'rgba(255,215,0,0.08)', border: 'rgba(255,215,0,0.35)', label: '1ST' },
  2: { color: '#C0C0C0', glow: 'rgba(192,192,192,0.25)', bg: 'rgba(192,192,192,0.06)', border: 'rgba(192,192,192,0.25)', label: '2ND' },
  3: { color: '#CD7F32', glow: 'rgba(205,127,50,0.25)', bg: 'rgba(205,127,50,0.06)', border: 'rgba(205,127,50,0.25)', label: '3RD' },
};

// ── Podium (top 3 big cards) ──────────────────────────────────────────────────
function PodiumCard({ trader, rank, onCelebrate }) {
  const m = MEDALS[rank];
  const profitRatio = ((trader.pnl || 0) / (trader.account_size || 1)) * 100;
  const heights = { 1: 'h-56', 2: 'h-44', 3: 'h-40' };
  const orders = { 1: 'order-2', 2: 'order-1', 3: 'order-3' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.1, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => onCelebrate(rank)}
      className={`${orders[rank]} cursor-pointer flex flex-col items-center`}
    >
      {/* Crown for #1 */}
      {rank === 1 && (
        <motion.div
          animate={{ y: [-3, 3, -3], rotate: [-5, 5, -5] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="text-3xl mb-1"
        >
          👑
        </motion.div>
      )}

      {/* Card */}
      <motion.div
        whileHover={{ scale: 1.04, y: -4 }}
        whileTap={{ scale: 0.97 }}
        className={`relative w-full rounded-2xl p-5 flex flex-col items-center ${heights[rank]}`}
        style={{
          background: `linear-gradient(160deg, ${m.bg}, rgba(8,12,22,0.97))`,
          border: `1px solid ${m.border}`,
          boxShadow: `0 0 40px ${m.glow}, inset 0 0 20px ${m.bg}`,
        }}
      >
        {/* Shimmer line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl"
          style={{ background: `linear-gradient(90deg, transparent, ${m.color}, transparent)` }} />

        {/* Rank badge */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[9px] font-black"
          style={{ background: m.color, color: '#000' }}>
          {m.label}
        </div>

        {/* Avatar */}
        <div className="mt-3 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black mb-3 relative flex-shrink-0"
          style={{ background: `${m.color}22`, border: `2px solid ${m.color}60`, boxShadow: `0 0 20px ${m.glow}` }}>
          {FLAG(trader.country)}
          {rank === 1 && (
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-2xl"
              style={{ background: m.color, opacity: 0.1 }}
            />
          )}
        </div>

        {/* Name */}
        <div className="text-sm font-black text-white truncate max-w-full">{trader.username || 'Trader'}</div>
        <div className="text-[10px] font-mono mb-2" style={{ color: m.color }}>
          {COUNTRY_NAMES[trader.country?.toUpperCase()] || trader.country || 'Global'}
        </div>

        {/* Profit */}
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          className="text-xl font-black"
          style={{ color: m.color, textShadow: `0 0 16px ${m.glow}` }}
        >
          +{profitRatio.toFixed(1)}%
        </motion.div>
        <div className="text-[10px] font-mono text-white/30">
          ${(trader.pnl || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })} profit
        </div>

        {/* Account size */}
        <div className="mt-auto pt-2 border-t w-full text-center"
          style={{ borderColor: `${m.color}25` }}>
          <span className="text-[10px] font-mono text-white/30">${(trader.account_size || 0).toLocaleString()} account</span>
        </div>
      </motion.div>

      {/* Podium base */}
      <div className="w-full mt-1 rounded-b-lg flex items-center justify-center py-1.5"
        style={{ background: `${m.color}18`, border: `1px solid ${m.color}25`, borderTop: 'none' }}>
        <span className="text-[9px] font-mono" style={{ color: m.color }}>{rank === 1 ? '🏆 CHAMPION' : rank === 2 ? '🥈 RUNNER-UP' : '🥉 3RD PLACE'}</span>
      </div>
    </motion.div>
  );
}

// ── Country tab bar ───────────────────────────────────────────────────────────
function CountryTabs({ countries, active, onChange }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      <button
        onClick={() => onChange('all')}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-mono transition-all"
        style={{
          background: active === 'all' ? 'rgba(255,92,0,0.18)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${active === 'all' ? 'rgba(255,92,0,0.5)' : 'rgba(255,255,255,0.08)'}`,
          color: active === 'all' ? '#FF5C00' : 'rgba(255,255,255,0.4)',
        }}
      >
        <Globe className="w-3 h-3" /> All Countries
      </button>
      {countries.map(c => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-mono transition-all"
          style={{
            background: active === c ? 'rgba(255,92,0,0.15)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${active === c ? 'rgba(255,92,0,0.4)' : 'rgba(255,255,255,0.07)'}`,
            color: active === c ? '#FF5C00' : 'rgba(255,255,255,0.35)',
          }}
        >
          <span>{FLAG(c)}</span>
          <span>{COUNTRY_NAMES[c] || c}</span>
        </button>
      ))}
    </div>
  );
}

// ── Row entry ─────────────────────────────────────────────────────────────────
function LeaderRow({ trader, rank }) {
  const m = MEDALS[rank] || { color: 'rgba(255,255,255,0.3)', glow: 'none', bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.06)' };
  const profitRatio = ((trader.pnl || 0) / (trader.account_size || 1)) * 100;
  const challengeLabel = trader.challenge_type === 'instant_light' ? 'Instant Light' : trader.challenge_type === 'instant' ? 'Instant' : 'Funded';

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(rank * 0.04, 0.5) }}
      whileHover={{ x: 3 }}
      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all border"
      style={{ background: m.bg, border: `1px solid ${m.border}` }}
    >
      {/* Rank */}
      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0"
        style={{ background: `${m.color}18`, color: m.color, border: `1px solid ${m.color}40` }}>
        {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `#${rank}`}
      </div>

      {/* Flag + name */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-xl flex-shrink-0">{FLAG(trader.country)}</span>
        <div className="min-w-0">
          <div className="text-sm font-bold text-white truncate">{trader.username || 'Trader'}</div>
          <div className="text-[10px] font-mono text-white/30">{COUNTRY_NAMES[trader.country?.toUpperCase()] || 'Global'}</div>
        </div>
      </div>

      {/* Challenge type badge */}
      <div className="hidden sm:flex flex-shrink-0">
        <span className="px-2 py-0.5 rounded-full text-[9px] font-black"
          style={{
            background: trader.status === 'funded' ? 'rgba(204,255,0,0.1)' : 'rgba(255,92,0,0.1)',
            border: `1px solid ${trader.status === 'funded' ? 'rgba(204,255,0,0.3)' : 'rgba(255,92,0,0.3)'}`,
            color: trader.status === 'funded' ? '#CCFF00' : '#FF5C00',
          }}>
          {challengeLabel}
        </span>
      </div>

      {/* Account size */}
      <div className="hidden md:flex flex-col items-end flex-shrink-0">
        <span className="text-[10px] text-white/25 font-mono">Account</span>
        <span className="text-sm font-bold text-white">${(trader.account_size || 0).toLocaleString()}</span>
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

      {/* Win rate */}
      <div className="hidden lg:flex flex-col items-end flex-shrink-0">
        <span className="text-[10px] text-white/25 font-mono">Win %</span>
        <span className="text-sm font-bold text-white">{(trader.win_rate || 0).toFixed(0)}%</span>
      </div>
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Leaderboard() {
  const [country, setCountry] = useState('all');

  // Fetch funded + instant (final accounts only — status=funded, or instant accounts status=active/funded)
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

  // Unique countries
  const countries = [...new Set(sorted.map(t => t.country?.toUpperCase()).filter(Boolean))].slice(0, 12);

  const filtered = country === 'all' ? sorted : sorted.filter(t => t.country?.toUpperCase() === country);

  const top3 = filtered.slice(0, 3);
  const rest = filtered.slice(3, 50);

  const fireCelebration = (rank) => {
    if (rank !== 1) return;
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.5 }, colors: ['#FFD700', '#FF5C00', '#CCFF00', '#fff'] });
  };

  const totalCapital = sorted.reduce((s, t) => s + (t.account_size || 0), 0);
  const avgProfit = sorted.length > 0 ? sorted.reduce((s, t) => s + t.profitRatio, 0) / sorted.length : 0;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 3, repeat: Infinity }}>
              <Trophy className="w-7 h-7 text-yellow-400" />
            </motion.div>
            Funded Leaderboard
          </h1>
          <p className="text-xs font-mono text-white/30 mt-1">Live funded & instant account performance rankings</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono text-emerald-400">LIVE</span>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Funded Traders', value: sorted.length, icon: Users, color: '#FF5C00' },
          { label: 'Avg Profit', value: `${avgProfit.toFixed(1)}%`, icon: TrendingUp, color: '#10b981' },
          { label: 'Top Trader', value: sorted[0]?.username || '—', icon: Crown, color: '#FFD700' },
          { label: 'Total Capital', value: totalCapital >= 1e6 ? `$${(totalCapital / 1e6).toFixed(1)}M` : `$${(totalCapital / 1e3).toFixed(0)}K`, icon: Trophy, color: '#a78bfa' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl p-4 border"
              style={{ background: `${s.color}08`, border: `1px solid ${s.color}22` }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-mono uppercase text-white/30">{s.label}</span>
                <Icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <div className="text-lg font-black text-white truncate">{s.value}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Country filter */}
      {countries.length > 0 && (
        <CountryTabs countries={countries} active={country} onChange={setCountry} />
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
            {country !== 'all' ? `No funded traders from ${COUNTRY_NAMES[country] || country} yet` : 'Complete a challenge to appear here'}
          </div>
        </motion.div>
      ) : (
        <>
          {/* Podium */}
          {top3.length >= 1 && (
            <div>
              <div className="text-[9px] font-mono uppercase tracking-widest text-white/25 mb-4 flex items-center gap-2">
                <Crown className="w-3 h-3 text-yellow-400" /> Top Performers
              </div>
              <div className="grid grid-cols-3 gap-3 max-w-2xl mx-auto">
                {top3.map((t, i) => (
                  <PodiumCard key={t.id} trader={t} rank={i + 1} onCelebrate={fireCelebration} />
                ))}
              </div>
            </div>
          )}

          {/* Rest of leaderboard */}
          {rest.length > 0 && (
            <div>
              <div className="text-[9px] font-mono uppercase tracking-widest text-white/25 mb-3 flex items-center gap-2">
                <Medal className="w-3 h-3 text-primary" /> Rankings #4–{Math.min(rest.length + 3, 50)}
              </div>
              <div className="space-y-1.5">
                {rest.map((t, i) => (
                  <LeaderRow key={t.id} trader={t} rank={i + 4} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Footer note */}
      <div className="text-center text-[10px] font-mono text-white/20 pt-2">
        Rankings based on profit % = (total P&L / account size) × 100 · Updated every 30 seconds
      </div>
    </div>
  );
}