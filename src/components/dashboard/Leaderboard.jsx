import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Users, Globe, Medal } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const MEDAL_COLORS = {
  1: { bg: 'rgba(255, 215, 0, 0.1)', border: 'rgba(255, 215, 0, 0.3)', color: '#FFD700', icon: '🥇' },
  2: { bg: 'rgba(192, 192, 192, 0.1)', border: 'rgba(192, 192, 192, 0.3)', color: '#C0C0C0', icon: '🥈' },
  3: { bg: 'rgba(205, 127, 50, 0.1)', border: 'rgba(205, 127, 50, 0.3)', color: '#CD7F32', icon: '🥉' },
};

function LeaderboardRow({ trader, rank }) {
  const medal = MEDAL_COLORS[rank] || { bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.06)', color: '#888', icon: `#${rank}` };
  const profitRatio = ((trader.pnl || 0) / (trader.account_size || 1)) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
      whileHover={{ x: 4, scale: 1.01 }}
      className="flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all border"
      style={{ background: medal.bg, border: `1px solid ${medal.border}` }}>
      
      {/* Rank badge */}
      <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-black text-lg"
        style={{ background: medal.color + '20', color: medal.color, border: `2px solid ${medal.color}` }}>
        {medal.icon}
      </div>

      {/* Trader info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/60 to-accent/40 flex items-center justify-center text-xs font-black text-white">
            {trader.username?.charAt(0).toUpperCase() || 'T'}
          </div>
          <div>
            <div className="text-sm font-bold text-foreground truncate">{trader.username || 'Trader'}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Globe className="w-3 h-3" /> {trader.country || 'Global'}
            </div>
          </div>
        </div>
      </div>

      {/* Account size */}
      <div className="flex-shrink-0 text-center">
        <div className="text-[10px] font-mono text-muted-foreground mb-0.5 uppercase">Account</div>
        <div className="text-sm font-bold text-foreground">${(trader.account_size || 0).toLocaleString()}</div>
      </div>

      {/* Profit ratio */}
      <div className="flex-shrink-0 text-center">
        <div className="text-[10px] font-mono text-muted-foreground mb-0.5 uppercase">Profit</div>
        <motion.div className={`text-sm font-black ${profitRatio >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity }}>
          {profitRatio >= 0 ? '+' : ''}{profitRatio.toFixed(1)}%
        </motion.div>
      </div>

      {/* Total P&L */}
      <div className="flex-shrink-0 text-center">
        <div className="text-[10px] font-mono text-muted-foreground mb-0.5 uppercase">Total P&L</div>
        <div className={`text-sm font-bold ${(trader.pnl || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {(trader.pnl || 0) >= 0 ? '+' : ''}${(trader.pnl || 0).toLocaleString()}
        </div>
      </div>

      {/* Win rate */}
      <div className="flex-shrink-0 text-center">
        <div className="text-[10px] font-mono text-muted-foreground mb-0.5 uppercase">Win Rate</div>
        <div className="text-sm font-bold text-foreground">{(trader.win_rate || 0).toFixed(1)}%</div>
      </div>
    </motion.div>
  );
}

export default function Leaderboard() {
  const [timeframe, setTimeframe] = useState('all');

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['leaderboard-accounts'],
    queryFn: () => base44.entities.ChallengeAccount.filter({ status: 'funded' }, '-pnl', 100),
  });

  // Sort by profit ratio (P&L / Account Size)
  const sorted = [...accounts]
    .map(a => ({
      ...a,
      profitRatio: ((a.pnl || 0) / (a.account_size || 1)) * 100,
    }))
    .sort((x, y) => y.profitRatio - x.profitRatio)
    .slice(0, 50);

  const topTraders = sorted.slice(0, 10);
  const allTraders = sorted;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
            <Trophy className="w-6 h-6" style={{ color: '#FFD700' }} /> Leaderboard
          </h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">Top performing traders ranked by profit ratio</p>
        </div>
        <div className="flex gap-2">
          {['week', 'month', 'all'].map(tf => (
            <button key={tf} onClick={() => setTimeframe(tf)}
              className="px-4 py-2 rounded-xl text-xs font-mono capitalize transition-all"
              style={{
                background: timeframe === tf ? 'rgba(255,92,0,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${timeframe === tf ? 'rgba(255,92,0,0.4)' : 'rgba(255,255,255,0.08)'}`,
                color: timeframe === tf ? '#FF5C00' : 'hsl(var(--muted-foreground))',
              }}>
              {tf === 'all' ? 'All Time' : `This ${tf}`}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Traders', value: allTraders.length, icon: Users },
          { label: 'Avg Profit', value: `${(allTraders.reduce((s, t) => s + t.profitRatio, 0) / allTraders.length).toFixed(1)}%`, icon: TrendingUp },
          { label: 'Top Performer', value: `${allTraders[0]?.username || '—'}`, icon: Medal },
          { label: 'Total Capital', value: `$${(allTraders.reduce((s, t) => s + (t.account_size || 0), 0) / 1000000).toFixed(1)}M`, icon: Trophy },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl p-4 border"
              style={{
                background: 'linear-gradient(135deg, rgba(255,92,0,0.08), rgba(204,255,0,0.03))',
                border: '1px solid rgba(255,255,255,0.1)',
              }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-muted-foreground uppercase">{stat.label}</span>
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div className="text-lg font-black text-foreground">{stat.value}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Leaderboard table header */}
      <div className="mb-4">
        <div className="grid gap-0 rounded-xl overflow-hidden border border-white/5"
          style={{ background: 'rgba(255,255,255,0.02)' }}>
          
          {/* Column headers */}
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-4 py-3 border-b border-white/5"
            style={{ background: 'rgba(255,255,255,0.03)' }}>
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">Rank</span>
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">Trader</span>
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">Account Size</span>
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">Profit %</span>
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">Total P&L</span>
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">Win Rate</span>
          </div>

          {/* Rows */}
          {isLoading ? (
            <div className="py-12 text-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : allTraders.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">No funded traders yet</div>
          ) : (
            <div className="space-y-1 p-2">
              {allTraders.map((trader, idx) => (
                <LeaderboardRow key={trader.id || idx} trader={trader} rank={idx + 1} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="rounded-xl p-4 text-center text-xs text-muted-foreground"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        Rankings update in real-time based on account performance. Profit % = (Total P&L / Account Size) × 100
      </div>
    </div>
  );
}