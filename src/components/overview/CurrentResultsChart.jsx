import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine, AreaChart, Area } from 'recharts';
import { Target, DollarSign } from 'lucide-react';

function fmt(n, d = 2) { return (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }); }

// Build chart data from trade records
function buildChartData(trades, accountSize) {
  const closedTrades = trades.filter(t => t.status === 'closed' && t.close_time && t.pnl != null)
    .sort((a, b) => new Date(a.close_time) - new Date(b.close_time));

  if (closedTrades.length === 0) {
    return [{ label: 'Start', balance: accountSize, equity: accountSize }];
  }

  const data = [{ label: 'Start', balance: accountSize, equity: accountSize }];
  let runningBalance = accountSize;
  let runningEquity = accountSize;

  closedTrades.forEach((t, i) => {
    runningBalance = parseFloat((runningBalance + (t.pnl || 0)).toFixed(2));
    runningEquity = runningBalance; // For closed trades, equity = balance
    data.push({
      label: `T${i + 1}`,
      balance: runningBalance,
      equity: runningEquity,
    });
  });

  return data;
}

function CurrentResultsChart({ account, trades }) {
  const [showObjectives, setShowObjectives] = useState(true);
  const [pnlMode, setPnlMode] = useState('absolute'); // 'absolute' | 'percentage'

  const accountSize = account?.account_size || 100000;
  const balance = account?.balance || accountSize;
  const equity = account?.equity || balance;
  const unrealizedPnl = equity - balance;

  const chartData = useMemo(() => buildChartData(trades, accountSize), [trades, accountSize]);

  const rules = account?.rule_snapshot || {};
  const profitTarget = account?.phase === 'phase2' ? (rules.phase2_target || 5) : (rules.phase1_target || 10);
  const targetAmount = accountSize * (profitTarget / 100);

  const metrics = [
    { label: 'Balance', value: `$${fmt(balance)}`, icon: DollarSign, color: '#60a5fa' },
    { label: 'Equity', value: `$${fmt(equity)}`, icon: Target, color: equity >= balance ? '#10b981' : '#ef4444' },
    { label: 'Unrealized PnL', value: `${unrealizedPnl >= 0 ? '+' : ''}$${fmt(unrealizedPnl)}`, color: unrealizedPnl >= 0 ? '#10b981' : '#ef4444' },
  ];

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}>
      <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(96,165,250,0.1)' }}>
              <Target className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <span className="text-sm font-bold text-foreground">Current Results</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowObjectives(!showObjectives)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                showObjectives
                  ? 'bg-primary/20 text-primary'
                  : 'bg-white/5 text-white/40 hover:text-white/60'
              }`}
            >
              {showObjectives ? 'On' : 'Off'}
            </button>
            <select
              value={pnlMode}
              onChange={(e) => setPnlMode(e.target.value)}
              className="h-7 px-2 rounded-lg text-[10px] font-semibold bg-white/5 text-white/40 border border-white/10 focus:outline-none focus:border-primary/30"
            >
              <option value="absolute">Absolute</option>
              <option value="percentage">Percentage</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-5">
        {/* Metrics */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="rounded-xl p-3"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-3 h-3" style={{ color: m.color }} />
                  <span className="text-[9px] font-semibold text-white/40">{m.label}</span>
                </div>
                <div className="text-lg font-black font-mono" style={{ color: m.color }}>{m.value}</div>
              </div>
            );
          })}
        </div>

        {/* Chart */}
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
              {showObjectives && (
                <ReferenceLine
                  y={accountSize + targetAmount}
                  stroke="#FF5C00"
                  strokeDasharray="4 3"
                  label={{ value: 'Target', fill: '#FF5C00', fontSize: 10, fontFamily: 'monospace' }}
                />
              )}
              <ReferenceLine y={accountSize} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                hide
                domain={['auto', 'auto']}
              />
              <RechartsTooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload;
                  return (
                    <div className="px-3 py-2 rounded-xl text-[10px] font-mono shadow-xl"
                      style={{
                        background: 'rgba(6,10,22,0.98)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}>
                      <div className="text-white/40 mb-1">{p.label}</div>
                      <div className="text-blue-400 font-bold">Balance: ${fmt(p.balance)}</div>
                      <div className="text-emerald-400 font-bold">Equity: ${fmt(p.equity)}</div>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="balance"
                stroke="#60a5fa"
                strokeWidth={2}
                fill="rgba(96,165,250,0.1)"
                dot={false}
                activeDot={{ r: 4, fill: '#60a5fa', stroke: 'rgba(96,165,250,0.3)', strokeWidth: 6 }}
              />
              <Area
                type="monotone"
                dataKey="equity"
                stroke="#10b981"
                strokeWidth={2}
                fill="rgba(16,185,129,0.1)"
                dot={false}
                activeDot={{ r: 4, fill: '#10b981', stroke: 'rgba(16,185,129,0.3)', strokeWidth: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default CurrentResultsChart;
export { CurrentResultsChart };