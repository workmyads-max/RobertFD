import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, BarChart3, Key, CalendarDays, Info, Check, X,
  TrendingUp, TrendingDown, Activity, Shield, Target, Clock,
  Zap, Award, RefreshCw, ChevronRight, Download, FileText,
  DollarSign, Wallet, ShoppingCart
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCustomAuth } from '@/lib/CustomAuthContext';
import CredentialsModal from './CredentialsModal';
import LiveTradeFeed from '../overview/LiveTradeFeed';
import PerformanceMetrics from '../overview/PerformanceMetrics';
import ProgressTimeline from '../overview/ProgressTimeline';
import CurrentResultsChart from '../overview/CurrentResultsChart';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

function fmt(n, d = 2) { return (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }); }

function Card({ children, className = '', accent = false }) {
  return (
    <div className={`rounded-2xl overflow-hidden ${className}`}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: accent ? '1px solid rgba(255,92,0,0.25)' : '1px solid rgba(255,255,255,0.07)',
        boxShadow: accent ? '0 0 30px rgba(255,92,0,0.06)' : 'none',
      }}>
      {children}
    </div>
  );
}

function CardHeader({ children, className = '', icon: Icon, iconBg = 'rgba(255,92,0,0.1)', iconColor = '#FF5C00', title, badge }) {
  return (
    <div className={`flex items-center justify-between px-5 py-4 border-b ${className}`}
      style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
      <div className="flex items-center gap-2.5">
        {Icon && (
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: iconBg }}>
            <Icon className="w-3.5 h-3.5" style={{ color: iconColor }} />
          </div>
        )}
        <span className="text-sm font-bold text-foreground">{title}</span>
        {badge && (
          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
            style={{ background: 'rgba(255,255,255,0.07)', color: '#94a3b8' }}>
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function SectionLabel({ children }) {
  return <span className="text-[11px] font-bold uppercase tracking-widest text-white/30">{children}</span>;
}

function InfoTooltip({ children }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex items-center cursor-pointer">
      <Info className="w-3.5 h-3.5 text-white/30 hover:text-white/60 transition-colors" onClick={() => setShow(v => !v)} />
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 text-center rounded-2xl px-4 py-3 text-sm shadow-2xl"
            style={{ background: 'rgba(15,16,30,0.98)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', backdropFilter: 'blur(20px)' }}
          >
            {children}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0"
              style={{ borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid rgba(15,16,30,0.98)' }} />
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

function ChallengeHeaderCard({ account, liveEquity, liveUnrealizedPnl, setShowCredentials, onNavigate }) {
  if (!account) return null;

  const balance = account.balance ?? account.account_size ?? 0;
  const equity = liveEquity ?? (account.equity ?? balance);
  const unrealizedPnl = liveUnrealizedPnl ?? (equity - balance);
  const todayPnl = account.daily_pnl ?? 0;
  const challengeLabel = account.challenge_type === 'two-step' ? '2-Step Challenge'
    : account.challenge_type === 'instant' ? 'Instant Funding' : 'Instant Light';
  const statusLabel = account.status === 'active' ? 'Active' : account.status === 'passed' ? 'Passed'
    : account.status === 'funded' ? 'Funded' : account.status;
  const statusColor = account.status === 'active' ? '#10b981' : account.status === 'funded' ? '#FF5C00'
    : account.status === 'passed' ? '#60a5fa' : '#94a3b8';
  const phase = (account.phase || 'phase1').replace('phase', 'Phase ');
  const progressPct = Math.min((account.profit_target_progress || 0) / (account.rule_snapshot?.phase1_target || 10) * 100, 100);
  const endDate = account.provisioned_at
    ? new Date(new Date(account.provisioned_at).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  return (
    <Card accent>
      <div className="px-5 pt-5 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide"
                style={{ background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}35` }}>
                ● {statusLabel}
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md"
                style={{ background: 'rgba(255,92,0,0.12)', color: '#FF5C00', border: '1px solid rgba(255,92,0,0.2)' }}>
                {phase}
              </span>
            </div>
            <div className="text-lg font-black text-white tracking-tight">{challengeLabel}</div>
            <div className="text-xs font-mono text-white/40 mt-0.5">MT5 Login: {account.mt_login || '—'} · {account.leverage || '1:100'} leverage</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-white/30 mb-0.5">Account Size</div>
            <div className="text-2xl font-black text-white">${(account.account_size || 0).toLocaleString()}</div>
            <div className="text-[10px] text-white/30 mt-0.5 font-mono">Exp: {endDate}</div>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-[10px] font-semibold mb-1.5">
            <span className="text-white/40">Profit Target Progress</span>
            <span style={{ color: '#FF5C00' }}>{progressPct.toFixed(1)}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <motion.div className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              style={{ background: 'linear-gradient(90deg, #FF5C00, #FF8A3D)' }} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-t border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <button
          onClick={() => setShowCredentials?.(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all"
          style={{ background: 'rgba(255,92,0,0.12)', border: '1px solid rgba(255,92,0,0.25)', color: '#FF5C00' }}>
          <Key className="w-3.5 h-3.5" />
          Copy Credentials
        </button>
        <button onClick={() => onNavigate?.('accounts')}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: '#94a3b8' }}>
          <CalendarDays className="w-3.5 h-3.5" />
          Account MetriX
        </button>
        <button onClick={() => onNavigate?.('account-overview')}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold ml-auto transition-all hover:opacity-90"
          style={{ background: 'rgba(255,92,0,0.12)', border: '1px solid rgba(255,92,0,0.25)', color: '#FF5C00' }}>
          Full Detail <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-3">
        <div className="px-5 py-4 text-center relative" style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-white/35 mb-2">
            {todayPnl >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            Today's PnL
          </div>
          <div className="text-xl font-black tracking-tight" style={{ color: todayPnl >= 0 ? '#10b981' : '#ef4444' }}>
            {todayPnl >= 0 ? '+' : ''}${fmt(todayPnl)}
          </div>
        </div>
        <div className="px-5 py-4 text-center relative" style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-white/35 mb-2">
            <Activity className="w-3 h-3" />
            Live Equity
          </div>
          <div className="text-xl font-black tracking-tight" style={{ color: '#60a5fa' }}>
            ${fmt(equity)}
          </div>
        </div>
        <div className="px-5 py-4 text-center relative">
          <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-white/35 mb-2">
            <Zap className="w-3 h-3" />
            Unrealized PnL
          </div>
          <div className="text-xl font-black tracking-tight" style={{ color: unrealizedPnl >= 0 ? '#10b981' : '#ef4444' }}>
            {unrealizedPnl >= 0 ? '+' : ''}${fmt(unrealizedPnl)}
          </div>
        </div>
      </div>
    </Card>
  );
}

function ChallengeInfoPanel({ account }) {
  if (!account) return null;

  const rules = account?.rule_snapshot || {};
  const statusColor = account.status === 'active' ? '#10b981'
    : account.status === 'passed' ? '#60a5fa'
    : account.status === 'funded' ? '#FF5C00'
    : '#ef4444';

  const startDate = account.provisioned_at
    ? new Date(account.provisioned_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  const endDate = account.provisioned_at
    ? new Date(new Date(account.provisioned_at).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  const challengeLabel = account.challenge_type === 'two-step' ? '2-Step Challenge'
    : account.challenge_type === 'instant' ? 'Instant Funding'
    : 'Instant Light';

  const details = [
    { label: 'Result', value: account.status === 'passed' ? 'Passed' : account.status === 'active' ? 'In Progress' : account.status, color: statusColor },
    { label: 'Status', value: account.status === 'active' ? 'Active' : account.status, color: statusColor },
    { label: 'Challenge ID', value: account.mt_login || account.account_id?.slice(0, 12), color: '#f1f5f9' },
    { label: 'Start Date', value: startDate, color: '#f1f5f9' },
    { label: 'End Date', value: endDate, color: '#f1f5f9' },
    { label: 'Account Size', value: `$${fmt(account.account_size)}`, color: '#10b981' },
    { label: 'Account Type', value: account.account_type === 'swing' ? 'Swing' : 'Standard', color: '#f1f5f9' },
    { label: 'Platform', value: (account.platform || 'MT5').toUpperCase(), color: '#f1f5f9' },
  ];

  return (
    <Card>
      <CardHeader icon={FileText} iconBg="rgba(255,92,0,0.1)" iconColor="#FF5C00" title={challengeLabel} />
      <div className="p-5">
        <div className="space-y-3">
          {details.map((d) => (
            <div key={d.label} className="flex items-center justify-between">
              <span className="text-xs text-white/40">{d.label}</span>
              <span className="text-xs font-bold font-mono" style={{ color: d.color }}>{d.value}</span>
            </div>
          ))}
        </div>

        <button className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all"
          style={{
            background: 'rgba(255,92,0,0.12)',
            border: '1px solid rgba(255,92,0,0.25)',
            color: '#FF5C00',
          }}>
          <Download className="w-3.5 h-3.5" />
          Download MT5 Platform
        </button>
      </div>
    </Card>
  );
}

function DisciplineGauge({ score }) {
  const r = 68, cx = 100, cy = 95;
  const circ = Math.PI * r;
  const dash = (Math.min(Math.max(score, 0), 100) / 100) * circ;
  const color = score < 30 ? '#ef4444' : score < 80 ? '#f59e0b' : '#10b981';
  const label = score < 30 ? 'Poor' : score < 80 ? 'Average' : 'Excellent';

  return (
    <div className="flex flex-col items-center">
      <svg width="200" height="115" viewBox="0 0 200 115">
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity="0.6" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" strokeLinecap="round" />
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke="url(#gaugeGrad)" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: 'stroke-dasharray 1.4s cubic-bezier(0.22,1,0.36,1)', filter: `drop-shadow(0 0 8px ${color}66)` }} />
        {[0, 25, 50, 75, 100].map(v => {
          const angle = Math.PI * (v / 100);
          const tx = cx - r * Math.cos(angle);
          const ty = cy - r * Math.sin(angle);
          const lx = cx - (r + 16) * Math.cos(angle);
          const ly = cy - (r + 16) * Math.sin(angle);
          return (
            <g key={v}>
              <circle cx={tx} cy={ty} r="2" fill="rgba(255,255,255,0.2)" />
              <text x={lx} y={ly + 3} textAnchor="middle" fontSize="7.5" fill="rgba(255,255,255,0.3)" fontFamily="monospace">{v}</text>
            </g>
          );
        })}
        <text x={cx} y={cy - 14} textAnchor="middle" fontSize="28" fontWeight="900" fill={color} fontFamily="monospace"
          style={{ filter: `drop-shadow(0 0 10px ${color}80)` }}>{score}%</text>
        <text x={cx} y={cy + 7} textAnchor="middle" fontSize="11" fill={color} fontWeight="700" letterSpacing="1">{label.toUpperCase()}</text>
      </svg>
    </div>
  );
}

function TradingStatsObjectives({ account, tradeRecords }) {
  const snap = account?.rule_snapshot || {};
  const accountSize = account?.account_size || 100000;
  const balance = account?.balance || accountSize;
  const equity = account?.equity || balance;

  const dailyDDLimit = snap.daily_dd_limit ?? 5;
  const maxDDLimit = snap.max_dd_limit ?? 10;
  const profitTarget = account?.phase === 'phase2' ? (snap.phase2_target ?? 5) : (snap.phase1_target ?? 10);
  const minDays = snap.min_trading_days ?? 4;

  const tradingDaySet = new Set();
  tradeRecords.filter(t => t.status === 'closed' && t.close_time).forEach(t => {
    const d = new Date(t.close_time);
    const bangkokOffset = 7 * 60;
    const localDate = new Date(d.getTime() + (bangkokOffset + d.getTimezoneOffset()) * 60000);
    tradingDaySet.add(localDate.toISOString().split('T')[0]);
  });
  const tradingDays = tradingDaySet.size;

  const dailyDDUsed = account?.daily_drawdown_used || 0;
  const maxDDUsed = account?.max_drawdown_used || 0;

  const profitTargetPct = account?.profit_target_progress ?? Math.max(0, ((equity - accountSize) / accountSize) * 100);

  const objectives = [
    { label: `Min ${minDays} Trading Days`, result: `${tradingDays} / ${minDays}`, pass: tradingDays >= minDays, pct: Math.min((tradingDays / minDays) * 100, 100) },
    { label: `Max Daily Loss`, result: `-$${fmt(Math.max(0, dailyDDUsed))} (${dailyDDUsed.toFixed(1)}%)`, pass: dailyDDUsed < dailyDDLimit, danger: dailyDDUsed >= dailyDDLimit, pct: Math.min((dailyDDUsed / dailyDDLimit) * 100, 100) },
    { label: `Max Overall Loss`, result: `-$${fmt(Math.max(0, maxDDUsed))} (${maxDDUsed.toFixed(1)}%)`, pass: maxDDUsed < maxDDLimit, danger: maxDDUsed >= maxDDLimit, pct: Math.min((maxDDUsed / maxDDLimit) * 100, 100) },
    { label: `Profit Target`, result: `$${fmt(Math.max(0, equity - accountSize))} (${profitTargetPct.toFixed(1)}%)`, pass: profitTargetPct >= profitTarget, pct: Math.min((profitTargetPct / profitTarget) * 100, 100) },
  ];

  const scores = [
    tradingDays >= minDays ? 100 : Math.round((tradingDays / minDays) * 60),
    dailyDDUsed < dailyDDLimit * 0.5 ? 100 : dailyDDUsed < dailyDDLimit ? 60 : 0,
    maxDDUsed < maxDDLimit * 0.5 ? 100 : maxDDUsed < maxDDLimit ? 60 : 0,
    profitTargetPct >= profitTarget ? 100 : Math.round((profitTargetPct / profitTarget) * 60),
  ];
  const disciplineScore = Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);

  return (
    <Card>
      <CardHeader icon={Award} iconBg="rgba(255,92,0,0.1)" iconColor="#FF5C00" title="Trading Stats & Objectives" />
      
      <div className="grid md:grid-cols-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="p-5 border-b md:border-b-0 md:border-r" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-foreground">Discipline Score</span>
            <div className="flex items-center gap-3 text-[10px] text-white/35">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Poor</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />Avg</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />Great</span>
            </div>
          </div>
          <DisciplineGauge score={disciplineScore} />
          <div className="mt-4 space-y-2.5">
            {[
              { label: 'Trading Days', score: scores[0] },
              { label: 'Daily DD', score: scores[1] },
              { label: 'Max DD', score: scores[2] },
              { label: 'Profit Target', score: scores[3] },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-3 text-xs">
                <span className="text-white/40 w-24 shrink-0">{s.label}</span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <motion.div className="h-full rounded-full"
                    initial={{ width: 0 }} animate={{ width: `${s.score}%` }}
                    transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                    style={{ background: s.score >= 80 ? '#10b981' : s.score >= 30 ? '#f59e0b' : '#ef4444' }} />
                </div>
                <span className="font-mono font-bold w-8 text-right text-[11px]"
                  style={{ color: s.score >= 80 ? '#10b981' : s.score >= 30 ? '#f59e0b' : '#ef4444' }}>
                  {s.score}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5">
          <div className="text-sm font-bold text-foreground mb-4">Trading Objectives</div>
          <div className="space-y-3">
            {objectives.map(obj => {
              const barColor = obj.danger ? '#ef4444' : obj.pass ? '#10b981' : '#f59e0b';
              return (
                <div key={obj.label} className="rounded-xl p-3.5" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${obj.pass ? 'rgba(16,185,129,0.15)' : obj.danger ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)'}` }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-white/70">{obj.label}</span>
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${obj.pass ? 'bg-emerald-500' : obj.danger ? 'bg-red-500' : 'bg-white/10'}`}>
                      {obj.pass ? <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                        : <X className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <motion.div className="h-full rounded-full"
                        initial={{ width: 0 }} animate={{ width: `${obj.pct}%` }}
                        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                        style={{ background: barColor }} />
                    </div>
                    <span className="text-[11px] font-mono font-bold shrink-0" style={{ color: obj.danger ? '#ef4444' : 'rgba(255,255,255,0.5)' }}>{obj.result}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}

function StatRow({ label, value, valueColor }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
      <span className="text-xs text-white/45">{label}</span>
      <span className="text-xs font-bold font-mono" style={{ color: valueColor || '#f1f5f9' }}>{value}</span>
    </div>
  );
}

function StatisticsPanel({ account, tradeRecords }) {
  const balance = account?.balance || account?.account_size || 0;
  const equity = account?.equity || balance;
  const accountSize = account?.account_size || 100000;
  const closedTrades = tradeRecords.filter(t => t.status === 'closed');
  const wins = closedTrades.filter(t => (t.pnl || 0) > 0);
  const losses = closedTrades.filter(t => (t.pnl || 0) < 0);
  const avgWin = wins.length ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : 0;
  const avgLoss = losses.length ? Math.abs(losses.reduce((s, t) => s + t.pnl, 0) / losses.length) : 0;
  const totalLots = closedTrades.reduce((s, t) => s + (t.lots || 0), 0);
  const profitFactor = avgLoss > 0 && wins.length > 0 ? (avgWin * wins.length) / (avgLoss * losses.length) : 0;
  const rrrAvg = avgLoss > 0 ? avgWin / avgLoss : 0;
  const expectancy = closedTrades.length > 0 ? (wins.length / closedTrades.length * avgWin - losses.length / closedTrades.length * avgLoss) : 0;
  const winRate = account?.win_rate || (closedTrades.length ? wins.length / closedTrades.length * 100 : 0);
  const totalTrades = account?.total_trades || closedTrades.length;
  const totalPnl = balance - accountSize;

  return (
    <Card>
      <CardHeader icon={BarChart3} iconBg="rgba(96,165,250,0.1)" iconColor="#60a5fa" title="Statistics">
        <SectionLabel>Synchronized From MT5</SectionLabel>
      </CardHeader>
      <div className="px-5 py-2">
        <StatRow label="Equity" value={`$${fmt(equity)}`} valueColor={equity >= accountSize ? '#10b981' : '#ef4444'} />
        <StatRow label="Balance" value={`$${fmt(balance)}`} valueColor="#60a5fa" />
        <StatRow label="Win Rate" value={winRate > 0 ? `${winRate.toFixed(1)}%` : '0%'} valueColor={winRate >= 50 ? '#10b981' : '#f59e0b'} />
        <StatRow label="Average Profit" value={avgWin > 0 ? `+$${fmt(avgWin)}` : '—'} valueColor="#10b981" />
        <StatRow label="Average Loss" value={avgLoss > 0 ? `-$${fmt(avgLoss)}` : '—'} valueColor="#ef4444" />
        <StatRow label="Total Trades" value={totalTrades || '0'} valueColor="#f1f5f9" />
        <StatRow label="Lots Traded" value={totalLots > 0 ? totalLots.toFixed(2) : '0'} valueColor="#f1f5f9" />
        <StatRow label="Total PnL" value={totalPnl >= 0 ? `+$${fmt(totalPnl)}` : `-$${fmt(Math.abs(totalPnl))}`} valueColor={totalPnl >= 0 ? '#10b981' : '#ef4444'} />
        <StatRow label="Average RRR" value={rrrAvg > 0 ? rrrAvg.toFixed(2) : '—'} valueColor="#f1f5f9" />
        <StatRow label="Expectancy" value={expectancy !== 0 ? `${expectancy >= 0 ? '+' : ''}$${fmt(expectancy)}` : '—'} valueColor={expectancy >= 0 ? '#10b981' : '#ef4444'} />
        <StatRow label="Profit Factor" value={profitFactor > 0 ? profitFactor.toFixed(2) : '—'} valueColor={profitFactor >= 1.5 ? '#10b981' : profitFactor >= 1 ? '#f59e0b' : '#ef4444'} />
      </div>
    </Card>
  );
}

function DailySummaryPanel({ tradeRecords }) {
  const rows = useMemo(() => {
    const byDay = {};
    tradeRecords.filter(t => t.status === 'closed' && t.close_time).forEach(t => {
      const day = (t.close_time || '').split('T')[0] || (t.close_time || '').split(' ')[0];
      if (!day) return;
      if (!byDay[day]) byDay[day] = { trades: 0, lots: 0, pnl: 0 };
      byDay[day].trades++;
      byDay[day].lots += t.lots || 0;
      byDay[day].pnl += t.pnl || 0;
    });
    return Object.entries(byDay).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 20)
      .map(([day, d]) => ({ day, trades: d.trades, lots: d.lots.toFixed(2), pnl: d.pnl }));
  }, [tradeRecords]);

  return (
    <Card>
      <CardHeader icon={CalendarDays} iconBg="rgba(16,185,129,0.1)" iconColor="#10b981" title="Daily Summary">
        <SectionLabel>From MT5 Records</SectionLabel>
      </CardHeader>
      {rows.length === 0 ? (
        <div className="py-12 text-center text-sm text-white/30">No closed trades yet</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {['Date', 'Trades', 'Lots', 'Result'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-white/30">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.day} className="border-b hover:bg-white/[0.02] transition-colors" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  <td className="px-5 py-3 font-mono text-white/50 text-[11px]">
                    {new Date(r.day).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3 text-foreground font-semibold">{r.trades}</td>
                  <td className="px-5 py-3 font-mono text-white/50">{r.lots}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono ${r.pnl >= 0 ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>
                      {r.pnl >= 0 ? '+' : ''}${fmt(r.pnl)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

const HISTORY_TABS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'passed', label: 'Passed' },
  { id: 'failed', label: 'Failed' },
];

function AccountHistorySection({ accounts, onSelectAccount }) {
  const [tab, setTab] = useState('all');
  const filtered = tab === 'all' ? accounts : accounts.filter(a => a.status === tab);

  return (
    <Card>
      <CardHeader icon={CalendarDays} iconBg="rgba(255,92,0,0.12)" iconColor="#FF5C00" title="Account History" badge={accounts.length} />
      <div className="flex gap-0 border-b overflow-x-auto" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        {HISTORY_TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-5 py-3 text-xs font-semibold whitespace-nowrap transition-all relative ${tab === t.id ? 'text-primary' : 'text-white/35 hover:text-white/60'}`}>
            {t.label}
            {tab === t.id && <motion.div layoutId="tab-line" className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-primary" />}
          </button>
        ))}
      </div>
      <div>
        {filtered.length === 0 ? (
          <div className="py-10 text-center text-sm text-white/30">No accounts found</div>
        ) : filtered.map((acc) => {
          const sc = acc.status === 'active' ? { label: 'Active', color: '#10b981' }
            : acc.status === 'passed' ? { label: 'Passed', color: '#60a5fa' }
            : acc.status === 'funded' ? { label: 'Funded', color: '#FF5C00' }
            : { label: 'Not Passed', color: '#ef4444' };
          const cLabel = acc.challenge_type === 'two-step' ? '2-Step' : acc.challenge_type === 'instant' ? 'Instant' : 'Inst. Light';
          return (
            <button key={acc.id} onClick={() => onSelectAccount?.(acc)}
              className="w-full flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-white/[0.02] border-b last:border-0"
              style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${sc.color}12`, border: `1px solid ${sc.color}25` }}>
                  <span className="text-[8px] font-black" style={{ color: sc.color }}>{sc.label.slice(0, 2).toUpperCase()}</span>
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold text-foreground font-mono">{cLabel} · {acc.mt_login || acc.account_id}</div>
                  <div className="text-[10px] text-white/35">${(acc.account_size || 0).toLocaleString()} · {(acc.phase || 'phase1').replace('phase', 'Phase ')}</div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold"
                style={{ background: `${sc.color}15`, color: sc.color, border: `1px solid ${sc.color}30` }}>
                {sc.label}
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

export default function AccountOverview({ onStartChallenge, onNavigate }) {
  const queryClient = useQueryClient();
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showCredentials, setShowCredentials] = useState(false);
  const { user, loading: authLoading } = useCustomAuth();

  useEffect(() => {
    const unsub = base44.entities.ChallengeAccount.subscribe((event) => {
      if (event.type === 'update' || event.type === 'create') {
        queryClient.setQueryData(['challenge-accounts'], (old = []) =>
          event.type === 'create' ? [event.data, ...old] : old.map(a => a.id === event.id ? event.data : a)
        );
      }
    });
    return unsub;
  }, [queryClient]);

  const { data: accounts = [], isLoading, error: accountsError } = useQuery({
    queryKey: ['challenge-accounts'],
    queryFn: async () => {
      const result = await base44.entities.ChallengeAccount.list('-created_date', 50);
      return result;
    },
    refetchInterval: 5000, staleTime: 3000,
    enabled: !!user,
  });

  const activeAccounts = accounts?.filter(a => ['active', 'funded', 'passed'].includes(a.status)) || [];
  const account = selectedAccount
    ? (accounts?.find(a => a.id === selectedAccount.id) || selectedAccount)
    : (activeAccounts[0] || null);

  const { data: tradeRecords = [] } = useQuery({
    queryKey: ['trade-records-overview', account?.account_id],
    queryFn: async () => {
      if (!account?.account_id) return [];
      return await base44.entities.TradeRecord.filter({ account_id: account.account_id });
    },
    enabled: !!account?.account_id,
    refetchInterval: 5000, staleTime: 3000,
  });

  const { data: livePositionsData = [] } = useQuery({
    queryKey: ['live-positions-overview', account?.account_id],
    queryFn: async () => {
      if (!account?.account_id) return [];
      try {
        const res = await base44.functions.invoke('getLivePositions', { account_id: account.account_id });
        return res?.data?.positions || [];
      } catch (err) {
        return [];
      }
    },
    enabled: !!account?.account_id,
    refetchInterval: 5000, staleTime: 3000,
  });

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  if (accountsError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-xl font-bold text-red-400 mb-4">Failed to load accounts</div>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-primary rounded-lg text-sm font-bold">Reload</button>
      </div>
    );
  }

  const livePositions = livePositionsData || [];
  const liveUnrealizedPnl = (livePositions || []).reduce((s, p) => s + (p.pnl || 0), 0);
  const liveEquity = livePositions?.length > 0
    ? (account?.balance || account?.account_size || 0) + liveUnrealizedPnl
    : (account?.equity || account?.balance || account?.account_size || 0);

  if (!account) return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
        style={{ background: 'rgba(255,92,0,0.06)', border: '1px solid rgba(255,92,0,0.15)' }}>
        <BarChart3 className="w-9 h-9 text-primary/40" />
      </div>
      <div className="text-2xl font-black text-foreground mb-2">No Active Accounts</div>
      <div className="text-sm text-white/40 mb-8 max-w-sm leading-relaxed">Purchase a challenge to unlock the full institutional account overview.</div>
      <button onClick={onStartChallenge}
        className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold text-white hover:scale-105 transition-all"
        style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)', boxShadow: '0 6px 24px rgba(255,92,0,0.3)' }}>
        <Plus className="w-4 h-4" /> Start New Challenge
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Active Accounts Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-sm font-bold text-foreground">Active Accounts</span>
          {activeAccounts.length > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(255,92,0,0.1)', color: '#FF5C00', border: '1px solid rgba(255,92,0,0.2)' }}>
              {activeAccounts.length}
            </span>
          )}
        </div>
      </div>

      {/* Account Switcher */}
      {activeAccounts.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {activeAccounts.map(a => (
            <button key={a.id} onClick={() => setSelectedAccount(a)}
              className="flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-mono transition-all"
              style={{
                background: account?.id === a.id ? 'rgba(255,92,0,0.1)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${account?.id === a.id ? 'rgba(255,92,0,0.35)' : 'rgba(255,255,255,0.07)'}`,
                color: account?.id === a.id ? '#FF5C00' : '#94a3b8',
              }}>
              <div className="font-black">{a.account_id}</div>
              <div className="text-[10px] opacity-60 mt-0.5">${(a.account_size || 0).toLocaleString()}</div>
            </button>
          ))}
        </div>
      )}

      {/* Section 1: Challenge Header Card */}
      <ChallengeHeaderCard 
        account={account} 
        liveEquity={liveEquity} 
        liveUnrealizedPnl={liveUnrealizedPnl} 
        setShowCredentials={setShowCredentials}
        onNavigate={onNavigate}
      />

      {/* Section 2: Current Results + Challenge Info Panel */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <CurrentResultsChart account={account} trades={tradeRecords} />
        </div>
        <ChallengeInfoPanel account={account} />
      </div>

      {/* Section 3: Live Trade Feed */}
      <LiveTradeFeed account={account} trades={tradeRecords} onRefresh={() => queryClient.invalidateQueries({ queryKey: ['trade-records-overview', account?.account_id] })} />

      {/* Section 4 & 5: Performance Metrics + Progress Timeline */}
      <div className="grid lg:grid-cols-2 gap-4">
        <PerformanceMetrics account={account} trades={tradeRecords} />
        <ProgressTimeline account={account} />
      </div>

      {/* Section 6: Statistics + Daily Summary */}
      <div className="grid md:grid-cols-2 gap-4">
        <StatisticsPanel account={account} tradeRecords={tradeRecords} />
        <DailySummaryPanel tradeRecords={tradeRecords} />
      </div>

      {/* Section 7 & 8: Trading Stats & Objectives */}
      <TradingStatsObjectives account={account} tradeRecords={tradeRecords} />

      {/* Section 9: Account History */}
      <AccountHistorySection accounts={accounts} onSelectAccount={setSelectedAccount} />

      {/* Disclaimer */}
      <div className="rounded-2xl px-5 py-3.5 flex items-center gap-3"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <Info className="w-4 h-4 text-white/20 shrink-0" />
        <p className="text-[11px] text-white/30 leading-relaxed">
          Account Metrics values are informative only. Real-time trading data can be verified directly in the MT5 platform.
        </p>
      </div>

      {showCredentials && (
        <CredentialsModal
          account={account}
          onClose={() => setShowCredentials(false)}
        />
      )}
    </div>
  );
}