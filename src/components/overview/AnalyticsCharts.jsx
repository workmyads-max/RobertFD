import React from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function generateEquityCurve(account) {
  const size = account?.account_size || 100000;
  const pnl = account?.pnl || 0;
  const days = Math.max(account?.trading_days || 7, 7);
  const data = [];
  let equity = size;
  for (let i = 0; i <= days; i++) {
    const progress = i / days;
    equity = size + pnl * progress + (Math.random() - 0.45) * size * 0.003;
    data.push({ day: `D${i + 1}`, equity: parseFloat(equity.toFixed(2)) });
  }
  return data;
}

function generateDailyPnl(account) {
  const days = Math.max(account?.trading_days || 7, 7);
  const totalPnl = account?.pnl || 0;
  return Array.from({ length: days }, (_, i) => ({
    day: `D${i + 1}`,
    pnl: parseFloat(((totalPnl / days) + (Math.random() - 0.5) * 200).toFixed(2)),
  }));
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  return (
    <div className="px-3 py-2 rounded-lg text-[10px] font-mono"
      style={{ background: 'rgba(8,12,24,0.95)', border: '1px solid rgba(0,149,255,0.2)' }}>
      <div className="text-white/40 mb-1">{label}</div>
      <div className="font-bold" style={{ color: val >= 0 ? '#00f5a0' : '#ef4444' }}>
        {val >= 0 ? '+' : ''}${Math.abs(val).toFixed(2)}
      </div>
    </div>
  );
};

export default function AnalyticsCharts({ account }) {
  const equityData = generateEquityCurve(account);
  const dailyData = generateDailyPnl(account);

  return (
    <div className="space-y-4">
      {/* Equity Curve */}
      <div className="rounded-2xl p-5"
        style={{
          background: 'linear-gradient(135deg, rgba(8,12,24,0.95), rgba(12,18,35,0.95))',
          border: '1px solid rgba(0,149,255,0.1)',
        }}>
        <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
          <span className="w-1.5 h-4 rounded-full bg-blue-500 inline-block" />
          Equity Curve
        </h3>
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={equityData}>
            <defs>
              <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0095ff" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#0095ff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="equity" stroke="#0095ff" strokeWidth={2} fill="url(#equityGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Daily P&L */}
      <div className="rounded-2xl p-5"
        style={{
          background: 'linear-gradient(135deg, rgba(8,12,24,0.95), rgba(12,18,35,0.95))',
          border: '1px solid rgba(0,245,160,0.08)',
        }}>
        <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
          <span className="w-1.5 h-4 rounded-full bg-emerald-400 inline-block" />
          Daily P&L
        </h3>
        <ResponsiveContainer width="100%" height={100}>
          <BarChart data={dailyData}>
            <XAxis dataKey="day" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="pnl" radius={[3, 3, 0, 0]}
              fill="#00f5a0"
              label={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}