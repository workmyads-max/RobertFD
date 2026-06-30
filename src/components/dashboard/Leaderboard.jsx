import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, TrendingUp, Users, Globe, Medal, Crown, Filter, Radio, DollarSign, Target, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import confetti from 'canvas-confetti';

const FLAG = (rawCode) => {
  const code = resolveCountryCode(rawCode);
  if (!code) return '🌍';
  const c = code.toUpperCase();
  try { return String.fromCodePoint(...[...c].map(ch => 0x1F1E6 + ch.charCodeAt(0) - 65)); }
  catch { return '🌍'; }
};

// Resolve country display name from ISO code or full name
const COUNTRY_LABEL = (rawCode) => {
  const code = resolveCountryCode(rawCode);
  if (code) return COUNTRY_NAMES[code] || code;
  // It's a full name we don't have - return as-is
  return rawCode || 'Global';
};

const COUNTRY_NAMES = {
  US: 'United States', GB: 'United Kingdom', AE: 'UAE', SG: 'Singapore', AU: 'Australia',
  CA: 'Canada', DE: 'Germany', FR: 'France', JP: 'Japan', IN: 'India', PK: 'Pakistan',
  NG: 'Nigeria', ZA: 'South Africa', BR: 'Brazil', MX: 'Mexico', TH: 'Thailand',
  ID: 'Indonesia', MY: 'Malaysia', PH: 'Philippines', EG: 'Egypt', SA: 'Saudi Arabia',
  TR: 'Turkey', IT: 'Italy', ES: 'Spain', NL: 'Netherlands', SE: 'Sweden', NZ: 'New Zealand',
  KE: 'Kenya', GH: 'Ghana', AO: 'Angola', RO: 'Romania', HU: 'Hungary',
  VN: 'Vietnam', BD: 'Bangladesh', LK: 'Sri Lanka', NP: 'Nepal', BH: 'Bahrain',
  QA: 'Qatar', KW: 'Kuwait', OM: 'Oman', JO: 'Jordan', LB: 'Lebanon', MA: 'Morocco',
  DZ: 'Algeria', TN: 'Tunisia', LY: 'Libya', SD: 'Sudan', TZ: 'Tanzania', UG: 'Uganda',
  RW: 'Rwanda', CI: 'Ivory Coast', SN: 'Senegal', CM: 'Cameroon', ET: 'Ethiopia',
  ZM: 'Zambia', ZW: 'Zimbabwe', NA: 'Namibia', BW: 'Botswana', MZ: 'Mozambique',
  AR: 'Argentina', CL: 'Chile', CO: 'Colombia', PE: 'Peru', VE: 'Venezuela',
  EC: 'Ecuador', PY: 'Paraguay', UY: 'Uruguay', BO: 'Bolivia', DO: 'Dominican Republic',
  GT: 'Guatemala', HN: 'Honduras', SV: 'El Salvador', CR: 'Costa Rica', PA: 'Panama',
  KR: 'South Korea', CN: 'China', HK: 'Hong Kong', TW: 'Taiwan', KH: 'Cambodia',
  LA: 'Laos', MM: 'Myanmar', KZ: 'Kazakhstan', UZ: 'Uzbekistan', AZ: 'Azerbaijan',
  GE: 'Georgia', AM: 'Armenia', BY: 'Belarus', UA: 'Ukraine', PL: 'Poland',
  CZ: 'Czech Republic', SK: 'Slovakia', SI: 'Slovenia', HR: 'Croatia', RS: 'Serbia',
  BG: 'Bulgaria', GR: 'Greece', PT: 'Portugal', CH: 'Switzerland', AT: 'Austria',
  BE: 'Belgium', IE: 'Ireland', DK: 'Denmark', NO: 'Norway', FI: 'Finland',
  LT: 'Lithuania', LV: 'Latvia', EE: 'Estonia', IS: 'Iceland', LU: 'Luxembourg',
  MT: 'Malta', CY: 'Cyprus', RU: 'Russia', MD: 'Moldova', AL: 'Albania', BA: 'Bosnia',
};

// Reverse lookup: full country name → ISO code (for flag emoji generation)
const NAME_TO_CODE = Object.entries(COUNTRY_NAMES).reduce((acc, [code, name]) => {
  acc[name.toLowerCase()] = code;
  return acc;
}, {});

// Resolve a country value (ISO code or full name) to a 2-letter ISO code
function resolveCountryCode(val) {
  if (!val) return null;
  const v = String(val).trim();
  // Already a 2-letter code?
  if (/^[A-Za-z]{2}$/.test(v)) return v.toUpperCase();
  // Try reverse lookup by full name
  const code = NAME_TO_CODE[v.toLowerCase()];
  return code || null;
}

const MEDALS = {
  1: { color: '#FFD700', glow: 'rgba(255,215,0,0.5)', bg: 'rgba(255,215,0,0.09)', border: 'rgba(255,215,0,0.4)', label: '1ST', emoji: '🥇', title: '🏆 CHAMPION', crown: '👑' },
  2: { color: '#C0C0C0', glow: 'rgba(192,192,192,0.35)', bg: 'rgba(192,192,192,0.07)', border: 'rgba(192,192,192,0.3)', label: '2ND', emoji: '🥈', title: '🥈 RUNNER-UP', crown: '🎖' },
  3: { color: '#CD7F32', glow: 'rgba(205,127,50,0.35)', bg: 'rgba(205,127,50,0.07)', border: 'rgba(205,127,50,0.3)', label: '3RD', emoji: '🥉', title: '🥉 3RD PLACE', crown: '🎗' },
};

const ACCOUNT_SIZE_FILTERS = [
  { label: 'All', value: 0 },
  { label: '$10K', value: 10000 },
  { label: '$25K', value: 25000 },
  { label: '$50K', value: 50000 },
  { label: '$100K', value: 100000 },
  { label: '$200K', value: 200000 },
];

const PLATFORM_COLORS = {
  match_trader: { color: '#60a5fa', label: 'Match Trader' },
  xtrading:     { color: '#FF5C00', label: 'XTrading'     },
  mt5:          { color: '#10b981', label: 'MT5'          },
  tradelocker:  { color: '#a78bfa', label: 'TradeLocker'  },
};

// Mask email/name for privacy: "john.doe@gmail.com" → "j***e"
function maskTraderName(account) {
  if (account.user_email) {
    const local = account.user_email.split('@')[0];
    if (local.length <= 2) return local[0] + '***';
    return local[0] + '***' + local[local.length - 1];
  }
  return `Trader_${(account.account_id || account.id || '').slice(-4)}`;
}

// Consistency score: based on win_rate + trading_days + drawdown usage
function calcConsistency(account) {
  const wr = account.win_rate || 0;
  const days = Math.min(account.trading_days || 0, 30);
  const ddPenalty = Math.max(0, (account.max_drawdown_used || 0) - 3) * 3;
  const score = Math.min(100, Math.round((wr * 0.5) + (days / 30 * 30) + 20 - ddPenalty));
  return Math.max(0, score);
}

// ── Rank badge (clean, flat) ──────────────────────────────────────────────────
function RankBadge({ rank }) {
  const m = MEDALS[rank];
  if (!m) return (
    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
      style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.08)' }}>
      #{rank}
    </div>
  );
  return (
    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
      style={{ background: m.color, color: '#0a0a0a' }}>
      {rank}
    </div>
  );
}

// ── Podium card (clean, flat fintech style) ───────────────────────────────────
function PodiumCard({ trader, rank, onCelebrate }) {
  const m = MEDALS[rank];
  const profitRatio = ((trader.pnl || 0) / (trader.account_size || 1)) * 100;
  const consistency = calcConsistency(trader);
  const plt = PLATFORM_COLORS[trader.platform] || PLATFORM_COLORS.xtrading;
  const podiumH = { 1: 'min-h-[300px]', 2: 'min-h-[275px]', 3: 'min-h-[260px]' };
  const podiumOrder = { 1: 'order-2', 2: 'order-1', 3: 'order-3' };
  const consistencyColor = consistency >= 70 ? '#10b981' : consistency >= 40 ? '#f59e0b' : '#ef4444';
  const footerLabel = rank === 1 ? 'CHAMPION' : rank === 2 ? 'RUNNER-UP' : 'THIRD PLACE';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.08, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => onCelebrate(rank)}
      className={`${podiumOrder[rank]} cursor-pointer flex flex-col items-center w-full max-w-[230px]`}
    >
      {/* Rank pill - floats above card */}
      <div className="mb-3 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] font-bold tracking-wider z-10"
        style={{ background: m.color, color: '#0a0a0a' }}>
        {rank === 1 && <Crown className="w-3 h-3" strokeWidth={2.5} />}
        {m.label}
      </div>

      <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}
        className={`relative w-full rounded-2xl flex flex-col items-center ${podiumH[rank]}`}
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>

        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl" style={{ background: m.color }} />

        {/* Avatar */}
        <div className="mt-6 w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-3 flex-shrink-0"
          style={{ background: `${m.color}12`, border: `1px solid ${m.color}33` }}>
          {FLAG(trader.country)}
        </div>

        {/* Username */}
        <div className="text-sm font-bold text-white font-mono truncate max-w-full px-3">{trader.username}</div>

        {/* Region */}
        <div className="text-[10px] font-mono mt-0.5 mb-2.5" style={{ color: m.color }}>
          {COUNTRY_LABEL(trader.country)}
        </div>

        {/* Platform badge */}
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-semibold mb-5"
          style={{ background: `${plt.color}14`, color: plt.color, border: `1px solid ${plt.color}25` }}>
          {plt.label}
        </div>

        {/* Hero metric - gain % */}
        <div className="text-2xl font-bold tabular" style={{ color: m.color }}>
          +{profitRatio.toFixed(1)}%
        </div>
        <div className="text-[10px] font-mono text-white/40 mt-1">
          ${(trader.pnl || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })} profit
        </div>

        {/* Payout */}
        {trader.totalPayout > 0 && (
          <div className="text-[10px] font-mono mt-1.5" style={{ color: '#10b981' }}>
            ${trader.totalPayout.toLocaleString()} paid out
          </div>
        )}

        {/* Divider */}
        <div className="w-3/4 my-3.5 h-px" style={{ background: 'hsl(var(--border))' }} />

        {/* Consistency */}
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: consistencyColor }} />
          <span className="text-[10px] font-mono text-white/50">Consistency: {consistency}%</span>
        </div>

        {/* Account details */}
        <div className="text-[10px] font-mono text-white/35 mt-1.5">
          ${(trader.account_size || 0).toLocaleString()} · {trader.challengeLabel}
        </div>

        {/* Footer badge */}
        <div className="mt-auto pt-4 w-full px-4 pb-4">
          <div className="w-full py-2 rounded-lg flex items-center justify-center gap-1.5 text-[10px] font-bold tracking-wider"
            style={{ background: `${m.color}15`, color: m.color, border: `1px solid ${m.color}30` }}>
            {rank === 1 && <Trophy className="w-3 h-3" />}
            {footerLabel}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Leaderboard row ───────────────────────────────────────────────────────────
function LeaderRow({ trader, rank }) {
  const m = MEDALS[rank] || { color: 'rgba(255,255,255,0.2)', glow: 'none', bg: 'rgba(255,255,255,0.02)', border: 'rgba(255,255,255,0.06)', emoji: null };
  const profitRatio = ((trader.pnl || 0) / (trader.account_size || 1)) * 100;
  const consistency = calcConsistency(trader);
  const plt = PLATFORM_COLORS[trader.platform] || PLATFORM_COLORS.xtrading;
  const consistencyColor = consistency >= 70 ? '#10b981' : consistency >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <motion.div initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(rank * 0.025, 0.5) }}
      whileHover={{ x: 4 }}
      className="flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all cursor-default"
      style={{ background: m.bg, border: `1px solid ${m.border}` }}>

      {/* Animated rank badge */}
      <RankBadge rank={rank} />

      {/* Flag + name */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-xl flex-shrink-0">{FLAG(trader.country)}</span>
        <div className="min-w-0">
          <div className="text-sm font-bold text-white truncate">{trader.username}</div>
          <div className="text-[10px] font-mono text-white/30">{COUNTRY_LABEL(trader.country)}</div>
        </div>
      </div>

      {/* Platform */}
      <div className="hidden md:block flex-shrink-0">
        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold"
          style={{ background: `${plt.color}15`, color: plt.color, border: `1px solid ${plt.color}25` }}>
          {plt.label}
        </span>
      </div>

      {/* Challenge type */}
      <div className="hidden sm:block flex-shrink-0">
        <span className="px-2 py-0.5 rounded-full text-[9px] font-black"
          style={{ background: trader.status === 'funded' ? 'rgba(204,255,0,0.1)' : 'rgba(255,92,0,0.1)', border: `1px solid ${trader.status === 'funded' ? 'rgba(204,255,0,0.3)' : 'rgba(255,92,0,0.3)'}`, color: trader.status === 'funded' ? '#CCFF00' : '#FF5C00' }}>
          {trader.challengeLabel}
        </span>
      </div>

      {/* Account size */}
      <div className="hidden md:flex flex-col items-end flex-shrink-0">
        <span className="text-[10px] text-white/25 font-mono">Account</span>
        <span className="text-sm font-bold text-white">${(trader.account_size || 0).toLocaleString()}</span>
      </div>

      {/* Payout */}
      <div className="hidden lg:flex flex-col items-end flex-shrink-0">
        <span className="text-[10px] text-white/25 font-mono">Payout</span>
        <span className="text-sm font-bold" style={{ color: trader.totalPayout > 0 ? '#10b981' : 'rgba(255,255,255,0.2)' }}>
          {trader.totalPayout > 0 ? `$${trader.totalPayout.toLocaleString()}` : '-'}
        </span>
      </div>

      {/* Consistency */}
      <div className="hidden xl:flex flex-col items-end flex-shrink-0">
        <span className="text-[10px] text-white/25 font-mono">Consistency</span>
        <span className="text-sm font-bold" style={{ color: consistencyColor }}>{consistency}%</span>
      </div>

      {/* Win rate */}
      <div className="hidden lg:flex flex-col items-end flex-shrink-0">
        <span className="text-[10px] text-white/25 font-mono">Win Rate</span>
        <span className="text-sm font-bold text-white">{(trader.win_rate || 0).toFixed(0)}%</span>
      </div>

      {/* Profit % */}
      <div className="flex flex-col items-end flex-shrink-0">
        <span className="text-[10px] text-white/25 font-mono">Profit %</span>
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
  const [sortBy, setSortBy] = useState('profit');

  // Fetch ALL accounts + payouts via service-role backend function.
  // ChallengeAccount and WithdrawalRequest both have RLS that restricts
  // reads to the current user - direct entity queries can't see other
  // traders' data, so the leaderboard would only ever show yourself.
  const { data, isLoading: loadingAccounts } = useQuery({
    queryKey: ['leaderboard-data'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getLeaderboardData', {});
      return res?.data || { accounts: [], payoutMap: {}, totalPaidOut: 0 };
    },
    refetchInterval: 30000,
  });

  const accounts = data?.accounts || [];
  const payoutMap = data?.payoutMap || {};

  const CHALLENGE_LABELS = { 'instant_light': 'Instant Light', 'instant': 'Instant', 'two-step': 'Two-Step' };

  const sorted = useMemo(() => (
    [...accounts]
      .filter(a => sortBy === 'payout' ? (payoutMap[a.account_id] || 0) > 0 : (a.pnl || 0) > 0)
      .map(a => ({
        ...a,
        username: maskTraderName(a),
        profitRatio: ((a.pnl || 0) / (a.account_size || 1)) * 100,
        totalPayout: payoutMap[a.account_id] || 0,
        challengeLabel: CHALLENGE_LABELS[a.challenge_type] || 'Funded',
      }))
      .sort((x, y) => sortBy === 'payout' ? y.totalPayout - x.totalPayout : y.profitRatio - x.profitRatio)
  ), [accounts, payoutMap, sortBy]);

  const afterSize = sizeFilter === 0 ? sorted : sorted.filter(t => t.account_size === sizeFilter);
  const filtered = country === 'all' ? afterSize : afterSize.filter(t => resolveCountryCode(t.country) === country);

  const countries = [...new Set(sorted.map(t => resolveCountryCode(t.country)).filter(Boolean))].slice(0, 14);
  const top3 = filtered.slice(0, 3);
  const rest = filtered.slice(3, 50);

  const fireCelebration = (rank) => {
    if (rank !== 1) return;
    confetti({ particleCount: 160, spread: 90, origin: { y: 0.45 }, colors: ['#FFD700', '#FF5C00', '#CCFF00', '#fff', '#C0C0C0'] });
  };

  const totalCapital = sorted.reduce((s, t) => s + (t.account_size || 0), 0);
  const avgProfit = sorted.length > 0 ? sorted.reduce((s, t) => s + t.profitRatio, 0) / sorted.length : 0;
  const totalPaidOut = data?.totalPaidOut || sorted.reduce((s, t) => s + t.totalPayout, 0);

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
          <p className="text-xs font-mono text-white/30 mt-1">Institutional performance rankings · Real backend data · No fake traders</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981' }}>
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          LIVE · 30s refresh
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Funded Traders', value: sorted.length, icon: Users, color: '#FF5C00' },
          { label: 'Avg Profit %', value: `${avgProfit.toFixed(1)}%`, icon: TrendingUp, color: '#10b981' },
          { label: 'Total Paid Out', value: totalPaidOut >= 1e6 ? `$${(totalPaidOut/1e6).toFixed(1)}M` : `$${(totalPaidOut/1e3).toFixed(0)}K`, icon: DollarSign, color: '#CCFF00' },
          { label: 'Total Capital', value: totalCapital >= 1e6 ? `$${(totalCapital/1e6).toFixed(1)}M` : `$${(totalCapital/1e3).toFixed(0)}K`, icon: Trophy, color: '#a78bfa' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="rounded-2xl p-4" style={{ background: `${s.color}08`, border: `1px solid ${s.color}22` }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-mono uppercase text-white/30">{s.label}</span>
                <Icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <div className="text-lg font-black text-white">{s.value}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Sort toggle */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-white/30 mr-1">
          <Filter className="w-3 h-3" /> Sort by:
        </div>
        <button onClick={() => setSortBy('profit')}
          className="px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all"
          style={{
            background: sortBy === 'profit' ? 'rgba(255,92,0,0.18)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${sortBy === 'profit' ? 'rgba(255,92,0,0.5)' : 'rgba(255,255,255,0.08)'}`,
            color: sortBy === 'profit' ? '#FF5C00' : 'rgba(255,255,255,0.4)',
          }}>Top Profit %</button>
        <button onClick={() => setSortBy('payout')}
          className="px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all"
          style={{
            background: sortBy === 'payout' ? 'rgba(16,185,129,0.18)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${sortBy === 'payout' ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.08)'}`,
            color: sortBy === 'payout' ? '#10b981' : 'rgba(255,255,255,0.4)',
          }}>Top Payouts</button>
        <div className="w-px h-6 bg-white/10 mx-1 hidden sm:block" />
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-white/30 mr-1">
          <Filter className="w-3 h-3" /> Account Size:
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
              <span>{FLAG(c)}</span><span>{COUNTRY_LABEL(c)}</span>
            </button>
          ))}
        </div>
      )}

      {/* Table header for rows */}
      {filtered.length > 3 && (
        <div className="hidden lg:flex items-center gap-3 px-4 py-2 text-[9px] font-mono uppercase text-white/20 tracking-widest">
          <div className="w-10 flex-shrink-0">Rank</div>
          <div className="flex-1">Trader · Country</div>
          <div className="w-24 hidden md:block">Platform</div>
          <div className="w-20 hidden sm:block">Type</div>
          <div className="w-20 hidden md:block text-right">Account</div>
          <div className="w-20 hidden lg:block text-right">Payout</div>
          <div className="w-20 hidden xl:block text-right">Consistency</div>
          <div className="w-16 hidden lg:block text-right">Win %</div>
          <div className="w-16 text-right">Profit %</div>
          <div className="w-20 text-right">P&L</div>
        </div>
      )}

      {loadingAccounts ? (
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
            {sizeFilter > 0 ? `No funded traders with $${sizeFilter.toLocaleString()} account` : country !== 'all' ? `No funded traders from ${COUNTRY_LABEL(country)} yet` : 'Complete a funded challenge to appear here'}
          </div>
        </motion.div>
      ) : (
        <>
          {/* Podium */}
          {top3.length >= 1 && (
            <div>
              <div className="text-[9px] font-mono uppercase tracking-widest text-white/25 mb-5 flex items-center gap-2">
                <Crown className="w-3 h-3 text-yellow-400" /> Top Performers
              </div>
              <div className="flex flex-wrap justify-center items-end gap-4 max-w-2xl mx-auto">
                {top3.map((t, i) => <PodiumCard key={t.id} trader={t} rank={i + 1} onCelebrate={fireCelebration} />)}
              </div>
            </div>
          )}

          {/* Rest of rankings */}
          {rest.length > 0 && (
            <div>
              <div className="text-[9px] font-mono uppercase tracking-widest text-white/25 mb-3 flex items-center gap-2">
                <Medal className="w-3 h-3 text-primary" /> Rankings #4-{Math.min(rest.length + 3, 50)}
              </div>
              <div className="space-y-1.5">
                {rest.map((t, i) => <LeaderRow key={t.id} trader={t} rank={i + 4} />)}
              </div>
            </div>
          )}
        </>
      )}

      <div className="text-center text-[10px] font-mono text-white/15 pt-2 pb-4">
        Profit % = (P&L ÷ account size) × 100 · Funded & active real accounts only · Payout data from live withdrawal records
      </div>
    </div>
  );
}