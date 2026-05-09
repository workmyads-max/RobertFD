import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Target, Zap } from 'lucide-react';

export default function PerformanceInsights({ accounts }) {
  const data = useMemo(() => {
    if (!accounts.length) return null;

    const allTrades = accounts.reduce((acc, a) => {
      return {
        totalTrades: acc.totalTrades + (a.total_trades || 0),
        winRate: acc.winRate + (a.win_rate || 0),
        totalPnl: acc.totalPnl + (a.pnl || 0),
        maxDD: Math.max(acc.maxDD, a.max_drawdown_used || 0),
      };
    }, { totalTrades: 0, winRate: 0, totalPnl: 0, maxDD: 0 });

    const avgWinRate = accounts.length > 0 ? allTrades.winRate / accounts.length : 0;
    const avgProfit = accounts.length > 0 ? allTrades.totalPnl / accounts.length : 0;
    
    // Risk-Reward Ratio (simplified: profit / max drawdown risk)
    const rrRatio = allTrades.maxDD > 0 ? (avgProfit / (allTrades.maxDD || 1)).toFixed(2) : 0;

    // Generate mock equity curve data for visualization
    const equityData = Array.from({ length: 12 }, (_, i) => ({
      month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
      equity: 100000 + Math.sin(i / 3) * 15000 + i * 2000 + (Math.random() * 5000 - 2500),
      profit: i * 500 + Math.random() * 2000,
    }));

    // Win/Loss ratio
    const winCount = Math.round((avgWinRate / 100) * allTrades.totalTrades);
    const lossCount = allTrades.totalTrades - winCount;

    return {
      avgWinRate: avgWinRate.toFixed(1),
      avgProfit,
      rrRatio,
      totalTrades: allTrades.totalTrades,
      winCount,
      lossCount,
      equityData,
      maxDD: allTrades.maxDD.toFixed(2),
    };
  }, [accounts]);

  if (!data) return null;

  const StatMetric = ({ label, value, icon: Icon, color, subtext, i }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.1 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="rounded-2xl p-6 relative overflow-hidden cursor-pointer group"
      style={{
        background: `linear-gradient(135deg, ${color}15, ${color}08)`,
        border: `1px solid ${color}30`,
        boxShadow: `0 8px 24px ${color}10`,
      }}>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at top right, ${color}20, transparent)`,
        }} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-mono text-muted-foreground/70 uppercase tracking-widest">{label}</span>
          <motion.div whileHover={{ scale: 1.15, rotate: 10 }} className="p-3 rounded-lg" style={{ background: `${color}20` }}>
            <Icon className="w-5 h-5" style={{ color }} />
          </motion.div>
        </div>
        <motion.div
          key={value}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-black text-foreground mb-2"
          style={{
            backgroundImage: `linear-gradient(135deg, ${color}, ${color}cc)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
          {value}
        </motion.div>
        {subtext && <p className="text-xs text-muted-foreground/80">{subtext}</p>}
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Top Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        <StatMetric 
          label="Win Rate" 
          value={`${data.avgWinRate}%`} 
          icon={TrendingUp} 
          color="#10b981"
          subtext={`${data.winCount} wins / ${data.lossCount} losses`}
          i={0}
        />
        <StatMetric 
          label="Avg Profit" 
          value={`$${Math.abs(data.avgProfit).toLocaleString('en-US', { maximumFractionDigits: 0 })}`} 
          icon={Target} 
          color={data.avgProfit >= 0 ? '#FF5C00' : '#ef4444'}
          subtext={data.avgProfit >= 0 ? 'Per Account' : 'Loss per Account'}
          i={1}
        />
        <StatMetric 
          label="Risk-Reward Ratio" 
          value={`${data.rrRatio}:1`} 
          icon={Zap} 
          color="#60a5fa"
          subtext={`Max DD: ${data.maxDD}%`}
          i={2}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-3 md:gap-4">
        {/* Equity Curve */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl p-4 md:p-6"
          style={{
            background: 'linear-gradient(135deg, rgba(96,165,250,0.1), rgba(96,165,250,0.03))',
            border: '1px solid rgba(96,165,250,0.25)',
            boxShadow: '0 8px 32px rgba(96,165,250,0.08)',
          }}>
          <h3 className="text-sm font-black text-foreground mb-4">Equity Curve</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.equityData}>
              <defs>
                <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" style={{ fontSize: '11px' }} />
              <YAxis stroke="rgba(255,255,255,0.3)" style={{ fontSize: '11px' }} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(10,10,15,0.95)',
                  border: '1px solid rgba(96,165,250,0.3)',
                  borderRadius: '12px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                }}
                formatter={(value) => `$${value.toFixed(0)}`}
                labelStyle={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}
              />
              <Line type="monotone" dataKey="equity" stroke="#60a5fa" strokeWidth={3} dot={false} isAnimationActive />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Win/Loss Pie */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl p-4 md:p-6"
          style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.03))',
            border: '1px solid rgba(16,185,129,0.25)',
            boxShadow: '0 8px 32px rgba(16,185,129,0.08)',
          }}>
          <h3 className="text-sm font-black text-foreground mb-4">Win/Loss Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Wins', value: data.winCount, fill: '#10b981' },
                  { name: 'Losses', value: data.lossCount, fill: '#ef4444' },
                ]}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
                animationEasing="ease-out">
                <Cell fill="#10b981" />
                <Cell fill="#ef4444" />
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'rgba(10,10,15,0.95)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                }}
                formatter={(value) => `${value} trades`}
                labelStyle={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-6 text-xs font-mono mt-4">
            <div className="text-center">
              <div className="text-emerald-400 font-black text-lg">{data.winCount}</div>
              <div className="text-muted-foreground/70">Wins</div>
            </div>
            <div className="w-px h-8" style={{ background: 'rgba(255,255,255,0.1)' }} />
            <div className="text-center">
              <div className="text-red-400 font-black text-lg">{data.lossCount}</div>
              <div className="text-muted-foreground/70">Losses</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Profit Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl p-4 md:p-6"
        style={{
          background: 'linear-gradient(135deg, rgba(255,92,0,0.1), rgba(204,255,0,0.03))',
          border: '1px solid rgba(255,92,0,0.25)',
          boxShadow: '0 8px 32px rgba(255,92,0,0.08)',
        }}>
        <h3 className="text-sm font-black text-foreground mb-4">Profit Trend</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.equityData.slice(-6)}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" style={{ fontSize: '11px' }} />
            <YAxis stroke="rgba(255,255,255,0.3)" style={{ fontSize: '11px' }} />
            <Tooltip
              contentStyle={{
                background: 'rgba(10,10,15,0.95)',
                border: '1px solid rgba(255,92,0,0.3)',
                borderRadius: '12px',
              }}
              formatter={(value) => `$${value.toFixed(0)}`}
              labelStyle={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}
            />
            <Bar dataKey="profit" fill="url(#profitGradient)" radius={[8, 8, 0, 0]} animationDuration={800} />
            <defs>
              <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF5C00" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#FF5C00" stopOpacity={0.3} />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}