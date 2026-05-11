import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Globe, TrendingUp, Crown, Medal, Star } from 'lucide-react';
import MiniRocket from './MiniRocket';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// ── Country helpers ───────────────────────────────────────────────────────────
const FLAG = code => {
  if (!code) return '🌍';
  const c = code.toUpperCase();
  try { return String.fromCodePoint(...[...c].map(ch => 0x1F1E6 + ch.charCodeAt(0) - 65)); }
  catch { return '🌍'; }
};
const COUNTRY_NAMES = {
  US:'United States', GB:'United Kingdom', AE:'UAE', SG:'Singapore', AU:'Australia',
  CA:'Canada', DE:'Germany', FR:'France', JP:'Japan', IN:'India', PK:'Pakistan',
  NG:'Nigeria', ZA:'South Africa', BR:'Brazil', TH:'Thailand', MY:'Malaysia',
};

// Sample fallback data for demo when no real accounts exist
const SAMPLE_TRADERS = [
  { username:'ALPHA_X',   country:'AE', account_size:100000, pnl:14800, win_rate:78, challenge_type:'funded',        status:'funded' },
  { username:'FURY_22',   country:'US', account_size:50000,  pnl:6200,  win_rate:74, challenge_type:'instant',       status:'active' },
  { username:'NOVA_PRO',  country:'GB', account_size:200000, pnl:24600, win_rate:71, challenge_type:'funded',        status:'funded' },
  { username:'BOLT_33',   country:'SG', account_size:25000,  pnl:2800,  win_rate:69, challenge_type:'instant_light', status:'active' },
  { username:'STORM_KE',  country:'NG', account_size:100000, pnl:10900, win_rate:67, challenge_type:'funded',        status:'funded' },
  { username:'EDGE_AU',   country:'AU', account_size:50000,  pnl:4400,  win_rate:65, challenge_type:'instant',       status:'active' },
  { username:'BLAZE_JP',  country:'JP', account_size:100000, pnl:6800,  win_rate:63, challenge_type:'funded',        status:'funded' },
  { username:'TITAN_IN',  country:'IN', account_size:25000,  pnl:1960,  win_rate:61, challenge_type:'instant',       status:'active' },
];

const MEDAL = {
  1: { color:'#FFD700', bg:'rgba(255,215,0,0.08)',   border:'rgba(255,215,0,0.3)',   icon:'🥇' },
  2: { color:'#C0C0C0', bg:'rgba(192,192,192,0.06)', border:'rgba(192,192,192,0.2)', icon:'🥈' },
  3: { color:'#CD7F32', bg:'rgba(205,127,50,0.06)',  border:'rgba(205,127,50,0.2)',  icon:'🥉' },
};

export default function Leaderboard() {
  const [activeCountry, setActiveCountry] = useState('all');

  const { data: accounts = [] } = useQuery({
    queryKey: ['landing-leaderboard'],
    queryFn: async () => {
      const [funded, instant, instantLight] = await Promise.all([
        base44.entities.ChallengeAccount.filter({ status: 'funded' }, '-pnl', 100),
        base44.entities.ChallengeAccount.filter({ status: 'active', challenge_type: 'instant' }, '-pnl', 50),
        base44.entities.ChallengeAccount.filter({ status: 'active', challenge_type: 'instant_light' }, '-pnl', 50),
      ]);
      return [...funded, ...instant, ...instantLight];
    },
    staleTime: 60000,
  });

  const realTraders = accounts
    .filter(a => (a.pnl || 0) > 0)
    .map(a => ({
      ...a,
      username: a.login_credentials || `Trader_${(a.account_id || a.id || '').slice(-4)}`,
      profitRatio: ((a.pnl || 0) / (a.account_size || 1)) * 100,
    }))
    .sort((x, y) => y.profitRatio - x.profitRatio)
    .slice(0, 20);

  // Use real data if available, else sample
  const baseList = realTraders.length >= 3
    ? realTraders
    : SAMPLE_TRADERS.map(t => ({ ...t, profitRatio: (t.pnl / t.account_size) * 100 })).sort((a, b) => b.profitRatio - a.profitRatio);

  const countries = [...new Set(baseList.map(t => t.country?.toUpperCase()).filter(Boolean))].slice(0, 8);
  const filtered = activeCountry === 'all' ? baseList : baseList.filter(t => t.country?.toUpperCase() === activeCountry);

  return (
    <section className="relative py-32 overflow-hidden">
      {/* Bg decorations */}
      <MiniRocket size={28} className="absolute right-8 top-20 opacity-15" rotate={-25} delay={0.1} />
      <MiniRocket size={18} className="absolute left-12 bottom-24 opacity-10" rotate={20} delay={0.4} />
      <div className="absolute top-0 left-0 right-0 h-px opacity-20" style={{ background: 'linear-gradient(90deg, transparent, #FF5C00, transparent)' }} />

      <div className="max-w-[1200px] mx-auto px-6">

        {/* Section heading */}
        <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} className="text-center mb-14">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-px flex-1 max-w-16 opacity-30" style={{ background:'linear-gradient(90deg, transparent, #FF5C00)' }} />
            <span className="text-xs font-mono text-primary uppercase tracking-widest">Top Performers</span>
            <div className="h-px flex-1 max-w-16 opacity-30" style={{ background:'linear-gradient(90deg, #FF5C00, transparent)' }} />
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Funded{' '}
            <span className="gradient-text">Leaderboard</span>
          </h2>
          <p className="text-muted-foreground text-base max-w-md mx-auto">
            The most profitable funded & instant traders — ranked live by profit percentage.
          </p>
        </motion.div>

        {/* Country filter pills */}
        {countries.length > 1 && (
          <motion.div initial={{ opacity:0 }} whileInView={{ opacity:1 }} viewport={{ once:true }}
            className="flex flex-wrap gap-2 justify-center mb-8">
            <button onClick={() => setActiveCountry('all')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono transition-all"
              style={{
                background: activeCountry === 'all' ? 'rgba(255,92,0,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${activeCountry === 'all' ? 'rgba(255,92,0,0.4)' : 'rgba(255,255,255,0.1)'}`,
                color: activeCountry === 'all' ? '#FF5C00' : 'rgba(255,255,255,0.4)',
              }}>
              <Globe className="w-3 h-3" /> All
            </button>
            {countries.map(c => (
              <button key={c} onClick={() => setActiveCountry(c)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono transition-all"
                style={{
                  background: activeCountry === c ? 'rgba(255,92,0,0.12)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${activeCountry === c ? 'rgba(255,92,0,0.35)' : 'rgba(255,255,255,0.07)'}`,
                  color: activeCountry === c ? '#FF5C00' : 'rgba(255,255,255,0.35)',
                }}>
                {FLAG(c)} {COUNTRY_NAMES[c] || c}
              </button>
            ))}
          </motion.div>
        )}

        {/* Table */}
        <motion.div initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
          className="glass rounded-2xl overflow-hidden">

          {/* Header row */}
          <div className="grid items-center px-5 py-3 border-b text-[9px] font-mono text-muted-foreground uppercase tracking-widest"
            style={{ gridTemplateColumns:'52px 1fr 80px 90px 90px 80px', borderColor:'rgba(255,255,255,0.06)', background:'rgba(255,255,255,0.02)' }}>
            <span>Rank</span>
            <span>Trader</span>
            <span className="text-center">Country</span>
            <span className="text-center">Account</span>
            <span className="text-center">Profit %</span>
            <span className="text-right">P&L</span>
          </div>

          {filtered.slice(0, 10).map((t, i) => {
            const rank = i + 1;
            const m = MEDAL[rank] || { color:'rgba(255,255,255,0.25)', bg:'transparent', border:'rgba(255,255,255,0.05)', icon:`#${rank}` };
            const profitRatio = t.profitRatio ?? ((t.pnl || 0) / (t.account_size || 1)) * 100;
            const challengeLabel = t.challenge_type === 'instant_light' ? 'Inst.Light' : t.challenge_type === 'instant' ? 'Instant' : 'Funded';
            return (
              <motion.div key={t.id || i}
                initial={{ opacity:0, x:-16 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }}
                transition={{ delay: i * 0.05 }}
                className="grid items-center px-5 py-4 border-b transition-all hover:bg-white/[0.02]"
                style={{ gridTemplateColumns:'52px 1fr 80px 90px 90px 80px', borderColor:'rgba(255,255,255,0.04)', background: rank <= 3 ? m.bg : 'transparent' }}>

                {/* Rank */}
                <div className="flex items-center gap-1">
                  <span className="text-lg">{typeof m.icon === 'string' ? m.icon : `#${rank}`}</span>
                </div>

                {/* Trader */}
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                    style={{ background: rank <= 3 ? `${m.color}18` : 'rgba(255,255,255,0.06)', border: rank <= 3 ? `1px solid ${m.color}40` : '1px solid rgba(255,255,255,0.08)' }}>
                    {FLAG(t.country)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-foreground truncate" style={{ color: rank === 1 ? m.color : undefined }}>
                      {t.username || 'Trader'}
                    </div>
                    <div className="text-[9px] font-mono text-muted-foreground">{challengeLabel}</div>
                  </div>
                </div>

                {/* Country */}
                <div className="text-center text-xs font-mono text-muted-foreground">
                  {COUNTRY_NAMES[t.country?.toUpperCase()] || t.country || '—'}
                </div>

                {/* Account size */}
                <div className="text-center text-sm font-bold text-foreground">
                  ${(t.account_size || 0).toLocaleString()}
                </div>

                {/* Profit % */}
                <div className="text-center">
                  <span className={`text-sm font-black ${profitRatio >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                    style={rank === 1 ? { color: m.color, textShadow: `0 0 12px ${m.color}60` } : {}}>
                    +{profitRatio.toFixed(1)}%
                  </span>
                </div>

                {/* P&L */}
                <div className="text-right text-sm font-bold text-primary">
                  +${(t.pnl || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </div>
              </motion.div>
            );
          })}

          {/* Footer note */}
          <div className="px-5 py-3 text-[9px] font-mono text-muted-foreground/40 text-center"
            style={{ background:'rgba(255,255,255,0.01)' }}>
            {realTraders.length >= 3 ? '● Live rankings from funded accounts' : '● Sample data — Rankings update as accounts are funded'}
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div initial={{ opacity:0 }} whileInView={{ opacity:1 }} viewport={{ once:true }}
          className="text-center mt-10">
          <p className="text-sm text-muted-foreground mb-4">Ready to join the leaderboard?</p>
          <motion.a href="/challenges" whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm text-white"
            style={{ background:'linear-gradient(135deg,rgba(255,92,0,0.85),rgba(255,140,60,0.7))', boxShadow:'0 8px 28px rgba(255,92,0,0.25)' }}>
            <Trophy className="w-4 h-4" /> Start Your Challenge
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}