import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Crown, Zap, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const FLAG = (code) => {
  if (!code) return '🌍';
  const c = code.toUpperCase();
  try {
    return String.fromCodePoint(...[...c].map((ch) => 0x1F1E6 + ch.charCodeAt(0) - 65));
  } catch {return '🌍';}
};

const COUNTRY_NAMES = {
  US: 'USA', GB: 'UK', AE: 'UAE', SG: 'Singapore', AU: 'Australia',
  CA: 'Canada', DE: 'Germany', FR: 'France', JP: 'Japan', IN: 'India',
  TH: 'Thailand', ID: 'Indonesia', MY: 'Malaysia', BR: 'Brazil', MX: 'Mexico',
  ZA: 'South Africa', KE: 'Kenya', NG: 'Nigeria', TR: 'Turkey', IT: 'Italy'
};

const MEDALS = {
  1: { color: '#FFD700', emoji: '🥇' },
  2: { color: '#C0C0C0', emoji: '🥈' },
  3: { color: '#CD7F32', emoji: '🥉' }
};

function TopTraderCard({ trader, rank }) {
  const m = MEDALS[rank];
  const profitRatio = (trader.pnl || 0) / (trader.account_size || 1) * 100;
  const heights = { 1: 'h-48', 2: 'h-44', 3: 'h-40' };
  const orders = { 1: 'order-2', 2: 'order-1', 3: 'order-3' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: rank * 0.1 }}
      className={`${orders[rank]} flex flex-col items-center`}>
      
      {rank === 1 &&
      <motion.div
        animate={{ y: [-4, 4, -4] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="text-3xl mb-2">
          👑
        </motion.div>
      }

      <motion.div
        whileHover={{ scale: 1.05 }}
        className={`relative w-full rounded-2xl p-5 flex flex-col items-center ${heights[rank]} border`}
        style={{
          background: `linear-gradient(160deg, ${m.color}12, rgba(8,12,22,0.8))`,
          border: `1px solid ${m.color}40`,
          boxShadow: `0 0 30px ${m.color}20`
        }}>
        
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-black"
        style={{ background: m.color, color: '#000' }}>
          {m.emoji}
        </div>

        <div className="mt-4 text-3xl flex-shrink-0">{FLAG(trader.country)}</div>
        
        <div className="text-sm font-bold text-white truncate mt-2">{trader.username || 'Trader'}</div>
        <div className="text-[9px] font-mono mb-2" style={{ color: m.color }}>
          {COUNTRY_NAMES[trader.country?.toUpperCase()] || trader.country || 'Global'}
        </div>

        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-lg font-black mt-auto"
          style={{ color: m.color }}>
          +{profitRatio.toFixed(1)}%
        </motion.div>
      </motion.div>
    </motion.div>);

}

function RankRow({ trader, rank }) {
  const profitRatio = (trader.pnl || 0) / (trader.account_size || 1) * 100;
  const m = rank <= 3 ? MEDALS[rank] : { color: 'rgba(255,255,255,0.3)', emoji: `#${rank}` };

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: Math.min(rank * 0.03, 0.3) }}
      className="flex items-center gap-3 px-4 py-3 rounded-xl border hover:border-white/20 transition-all"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
      
      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
      style={{ background: `${m.color}15`, color: m.color }}>
        {rank <= 3 ? m.emoji : `#${rank}`}
      </div>

      <div className="flex items-center gap-2 flex-1">
        <span className="text-lg flex-shrink-0">{FLAG(trader.country)}</span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-white truncate">{trader.username || 'Trader'}</div>
          <div className="text-[9px] font-mono text-white/30">{COUNTRY_NAMES[trader.country?.toUpperCase()] || 'Global'}</div>
        </div>
      </div>

      <div className="text-right flex-shrink-0">
        <div className="text-xs font-bold text-emerald-400">+{profitRatio.toFixed(1)}%</div>
        <div className="text-[9px] font-mono text-white/30">${(trader.pnl || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
      </div>
    </motion.div>);

}

export default function HomeLeaderboard() {
  const { data: accounts = [] } = useQuery({
    queryKey: ['home-leaderboard'],
    queryFn: async () => {
      const [funded, instant, instantLight] = await Promise.all([
      base44.entities.ChallengeAccount.filter({ status: 'funded' }, '-pnl', 100),
      base44.entities.ChallengeAccount.filter({ status: 'active', challenge_type: 'instant' }, '-pnl', 50),
      base44.entities.ChallengeAccount.filter({ status: 'active', challenge_type: 'instant_light' }, '-pnl', 50)]
      );
      return [...funded, ...instant, ...instantLight];
    },
    refetchInterval: 45000,
    staleTime: 30000
  });

  // Mask email for privacy: "john.doe@gmail.com" → "j***e"
  const maskName = (email) => {
    if (!email) return 'Trader';
    const local = email.split('@')[0];
    if (local.length <= 2) return local[0] + '***';
    return local[0] + '***' + local[local.length - 1];
  };

  const sorted = accounts.
  filter((a) => (a.pnl || 0) > 0).
  map((a) => ({
    ...a,
    username: maskName(a.user_email)
  })).
  sort((x, y) => (y.pnl || 0) / (y.account_size || 1) - (x.pnl || 0) / (x.account_size || 1)).
  slice(0, 15);

  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3, 12);

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <Trophy className="w-8 h-8 text-yellow-400" />
          <h2 className="text-4xl font-black text-white">Live Leaderboard</h2>
          
        </div>
        <p className="text-white/50 font-mono text-sm">Top funded traders ranked by profit performance</p>
      </motion.div>

      {sorted.length === 0 ?
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="py-20 text-center rounded-2xl border border-dashed border-white/10">
          <Trophy className="w-12 h-12 text-white/10 mx-auto mb-3" />
          <div className="text-white/40 font-bold">Rankings coming soon</div>
        </motion.div> :

      <>
          {/* Top 3 Podium */}
          {top3.length >= 1 &&
        <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto mb-8">
              {top3.map((t, i) =>
          <TopTraderCard key={t.id} trader={t} rank={i + 1} />
          )}
            </div>
        }

          {/* Rest of leaderboard */}
          {rest.length > 0 &&
        <div className="space-y-2 max-w-2xl mx-auto">
              <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs font-mono text-white/30 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Zap className="w-3 h-3" /> Rankings #{top3.length + 1}-{sorted.length}
              </motion.div>
              {rest.map((t, i) =>
          <RankRow key={t.id} trader={t} rank={i + top3.length + 1} />
          )}
            </div>
        }
        </>
      }

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center pt-4">
        <a href="/dashboard"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-white transition-all hover:scale-105"
        style={{ background: 'linear-gradient(135deg, #FF5C00, #ff8a3d)', boxShadow: '0 8px 24px rgba(255,92,0,0.3)' }}>
          <TrendingUp className="w-4 h-4" />
          Start Trading & Join Rankings
        </a>
      </motion.div>
    </div>);

}