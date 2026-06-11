import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Plus, BarChart3, Key, CalendarDays, Info, Check, X,
  TrendingUp, TrendingDown, Activity, Shield, Target, Clock,
  Zap, Award, RefreshCw, ChevronRight, ChevronUp, ChevronDown
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import CredentialsModal from './CredentialsModal';
import LiveTradeFeed from '../overview/LiveTradeFeed';
import PerformanceMetrics from '../overview/PerformanceMetrics';
import ProgressTimeline from '../overview/ProgressTimeline';
import CurrentResultsChart from '../overview/CurrentResultsChart.jsx';
import ChallengeDetailSidebar from '../overview/ChallengeDetailSidebar';

function fmt(n, d = 2) { return (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }); }

function useCopyText() {
  const [copied, setCopied] = useState(null);
  const copy = (val, key) => { navigator.clipboard.writeText(val).catch(() => {}); setCopied(key); setTimeout(() => setCopied(null), 1800); };
  return { copied, copy };
}

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

function CardHeader({ children, className = '' }) {
  return (
    <div className={`flex items-center justify-between px-5 py-4 border-b ${className}`}
      style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
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

function fmtTime(t) {
  if (!t) return '—';
  const ms = Date.now() - new Date(t).getTime();
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  return `${String(h).padStart(2,'0')}:${String(m % 60).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;
}

function useResetCountdown() {
  const [countdown, setCountdown] = useState('');
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const next = new Date(now);
      next.setUTCHours(23, 0, 0, 0);
      if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
      const diff = next - now;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);
  return countdown;
}

// ─── Active Account Card ─────────────────────────────────────────────────────
function ActiveAccountCard({ account, onNavigate, liveEquity, liveUnrealizedPnl, setShowCredentials }) {
  const { copied, copy } = useCopyText();
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

  const metrics = [
    { label: "Today's P&L", value: `${todayPnl >= 0 ? '+' : ''}$${fmt(todayPnl)}`, color: todayPnl >= 0 ? '#10b981' : '#ef4444', icon: todayPnl >= 0 ? TrendingUp : TrendingDown },
    { label: 'Live Equity', value: `$${fmt(equity)}`, color: '#60a5fa', icon: Activity },
    { label: 'Unrealized PnL', value: `${unrealizedPnl >= 0 ? '+' : ''}$${fmt(unrealizedPnl)}`, color: unrealizedPnl >= 0 ? '#10b981' : '#ef4444', icon: Zap },
  ];

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
          View Credentials
        </button>
        <button onClick={() => onNavigate?.('accounts')}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: '#94a3b8' }}>
          <CalendarDays className="w-3.5 h-3.5" />
          Account Metrics
        </button>
        <button onClick={() => onNavigate?.('accounts')}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold ml-auto transition-all hover:opacity-90"
          style={{ background: 'rgba(255,92,0,0.12)', border: '1px solid rgba(255,92,0,0.25)', color: '#FF5C00' }}>
          Full Detail <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-3">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="px-5 py-4 text-center relative"
              style={{ borderRight: i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-white/35 mb-2">
                <Icon className="w-3 h-3" /> {m.label}
              </div>
              <div className="text-xl font-black tracking-tight" style={{ color: m.color }}>{m.value}</div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Statistics Panel ─────────────────────────────────────────────────────────
function StatRow({ label, value, valueColor, bar, barPct }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
      <div className="flex items-center gap-2">
        <div className="w-1 h-1 rounded-full bg-white/20" />
        <span className="text-xs text-white/45">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {bar && (
          <div className="w-16 h-1 rounded-full overflow-hidden hidden sm:block" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full" style={{ width: `${Math.min(barPct, 100)}%`, background: valueColor || '#FF5C00' }} />
          </div>
        )}
        <span className="text-xs font-bold font-mono" style={{ color: valueColor || '#f1f5f9' }}>{value}</span>
      </div>
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

  const stats = [
    { label: 'Equity', value: `$${fmt(equity)}`, color: equity >= accountSize ? '#10b981' : '#ef4444', bar: true, barPct: (equity / accountSize) * 50 },
    { label: 'Balance', value: `$${fmt(balance)}`, color: '#60a5fa' },
    { label: 'Win Rate', value: winRate > 0 ? `${winRate.toFixed(1)}%` : '0%', color: winRate >= 50 ? '#10b981' : '#f59e0b', bar: true, barPct: winRate },
    { label: 'Avg. Profit', value: avgWin > 0 ? `+$${fmt(avgWin)}` : '—', color: '#10b981' },
    { label: 'Avg. Loss', value: avgLoss > 0 ? `-$${fmt(avgLoss)}` : '—', color: '#ef4444' },
    { label: 'Total Trades', value: totalTrades || '0', color: '#f1f5f9' },
    { label: 'Lots Traded', value: totalLots > 0 ? totalLots.toFixed(2) : '0', color: '#f1f5f9' },
    { label: 'Total P&L', value: totalPnl >= 0 ? `+$${fmt(totalPnl)}` : `-$${fmt(Math.abs(totalPnl))}`, color: totalPnl >= 0 ? '#10b981' : '#ef4444' },
    { label: 'Avg. RRR', value: rrrAvg > 0 ? rrrAvg.toFixed(2) : '—', color: '#f1f5f9' },
    { label: 'Expectancy', value: expectancy !== 0 ? `${expectancy >= 0 ? '+' : ''}$${fmt(expectancy)}` : '—', color: expectancy >= 0 ? '#10b981' : '#ef4444' },
    { label: 'Profit Factor', value: profitFactor > 0 ? profitFactor.toFixed(2) : '—', color: profitFactor >= 1.5 ? '#10b981' : profitFactor >= 1 ? '#f59e0b' : '#ef4444' },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(96,165,250,0.1)' }}>
            <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <span className="text-sm font-bold text-foreground">Statistics</span>
        </div>
        <SectionLabel>Synced from MT5</SectionLabel>
      </CardHeader>
      <div className="px-5 py-2">
        {stats.map(s => <StatRow key={s.label} label={s.label} value={s.value} valueColor={s.color} bar={s.bar} barPct={s.barPct} />)}
      </div>
    </Card>
  );
}

// ─── Daily Summary ────────────────────────────────────────────────────────────
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
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.1)' }}>
            <CalendarDays className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <span className="text-sm font-bold text-foreground">Daily Summary</span>
        </div>
        <SectionLabel>From MT5 records</SectionLabel>
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

// ─── Discipline Gauge ─────────────────────────────────────────────────────────
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

function DisciplinePanel({ account, tradeRecords }) {
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
  const dailyStartBalance = account?.daily_start_balance || accountSize;
  const dailyLossAmt = equity - dailyStartBalance;

  const profitTargetPct = account?.profit_target_progress ?? Math.max(0, ((equity - accountSize) / accountSize) * 100);
  const dailyAllowance = dailyStartBalance * (dailyDDLimit / 100);
  const dailyLossUsedAmt = Math.max(0, dailyStartBalance - equity);
  const todayPermittedLossRemaining = Math.max(0, dailyAllowance - dailyLossUsedAmt);
  const maxDDAllowance = accountSize * (maxDDLimit / 100);
  const maxLossUsedAmt = Math.max(0, accountSize - equity);
  const maxPermittedLossRemaining = Math.max(0, maxDDAllowance - maxLossUsedAmt);

  const objectives = [
    { label: `Min ${minDays} Trading Days`, result: `${tradingDays} / ${minDays}`, pass: tradingDays >= minDays, pct: Math.min((tradingDays / minDays) * 100, 100), icon: CalendarDays },
    { label: `Max Daily Loss`, result: `-$${fmt(Math.max(0, dailyStartBalance - equity))} (${dailyDDUsed.toFixed(1)}%)`, pass: dailyDDUsed < dailyDDLimit, danger: dailyDDUsed >= dailyDDLimit, pct: Math.min((dailyDDUsed / dailyDDLimit) * 100, 100), icon: Shield },
    { label: `Max Overall Loss`, result: `-$${fmt(Math.max(0, accountSize - equity))} (${maxDDUsed.toFixed(1)}%)`, pass: maxDDUsed < maxDDLimit, danger: maxDDUsed >= maxDDLimit, pct: Math.min((maxDDUsed / maxDDLimit) * 100, 100), icon: Shield },
    { label: `Profit Target`, result: `$${fmt(Math.max(0, equity - accountSize))} (${profitTargetPct.toFixed(1)}%)`, pass: profitTargetPct >= profitTarget, pct: Math.min((profitTargetPct / profitTarget) * 100, 100), icon: Target },
  ];

  const scores = [
    tradingDays >= minDays ? 100 : Math.round((tradingDays / minDays) * 60),
    dailyDDUsed < dailyDDLimit * 0.5 ? 100 : dailyDDUsed < dailyDDLimit ? 60 : 0,
    maxDDUsed < maxDDLimit * 0.5 ? 100 : maxDDUsed < maxDDLimit ? 60 : 0,
    profitTargetPct >= profitTarget ? 100 : Math.round((profitTargetPct / profitTarget) * 60),
  ];
  const disciplineScore = Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);

  const countdown = useResetCountdown();

  const bottomCards = [
    {
      label: "Today's Permitted Loss",
      value: `$${fmt(todayPermittedLossRemaining)}`,
      sub: `${dailyDDLimit}% daily DD limit`,
      color: todayPermittedLossRemaining < dailyAllowance * 0.3 ? '#ef4444' : '#FF5C00',
      icon: Shield,
      tooltip: (
        <>
          <p className="text-sm leading-snug mb-2">Your remaining daily loss buffer relative to today's starting equity.</p>
          <p className="text-xs font-semibold" style={{ color: '#FF5C00' }}>Resets in {countdown}</p>
        </>
      ),
    },
    {
      label: 'Max Permitted Loss',
      value: `$${fmt(maxPermittedLossRemaining)}`,
      sub: `${maxDDLimit}% max drawdown`,
      color: maxPermittedLossRemaining < accountSize * maxDDLimit / 100 * 0.3 ? '#ef4444' : '#FF5C00',
      icon: Activity,
      tooltip: <p className="text-sm leading-snug">Your total remaining loss buffer relative to the original account size.</p>,
    },
    {
      label: "Today's P&L",
      value: `${dailyLossAmt >= 0 ? '+' : ''}$${fmt(dailyLossAmt)}`,
      sub: `From today's starting equity`,
      color: dailyLossAmt > 0 ? '#10b981' : dailyLossAmt < 0 ? '#ef4444' : '#94a3b8',
      icon: TrendingUp,
      tooltip: <p className="text-sm leading-snug">Closed and floating P&L since today's session started.</p>,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,92,0,0.1)' }}>
            <Award className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-sm font-bold text-foreground">Trading Stats & Objectives</span>
        </div>
      </CardHeader>

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
              const Icon = obj.icon;
              const barColor = obj.danger ? '#ef4444' : obj.pass ? '#10b981' : '#f59e0b';
              return (
                <div key={obj.label} className="rounded-xl p-3.5" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${obj.pass ? 'rgba(16,185,129,0.15)' : obj.danger ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)'}` }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5" style={{ color: barColor }} />
                      <span className="text-xs font-semibold text-white/70">{obj.label}</span>
                    </div>
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

      <div className="grid grid-cols-3">
        {bottomCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="px-4 py-5 text-center relative transition-colors hover:bg-white/[0.02]"
              style={{ borderRight: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
              <div className="flex items-center justify-center gap-1.5 text-[10px] font-semibold text-white/35 mb-2">
                <Icon className="w-3 h-3" />
                {s.label}
                <InfoTooltip>{s.tooltip}</InfoTooltip>
              </div>
              <div className="text-2xl font-black tracking-tight" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[10px] text-white/25 mt-1 font-mono">{s.sub}</div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Account History ─────────────────────────────────────────────────────────
const HISTORY_TABS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'passed', label: 'Passed' },
  { id: 'failed', label: 'Failed' },
];

function AccountHistorySection({ accounts }) {
  const [tab, setTab] = useState('all');
  const filtered = tab === 'all' ? accounts : accounts.filter(a => a.status === tab);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,92,0,0.12)' }}>
            <CalendarDays className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-sm font-bold text-foreground">Account History</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
            style={{ background: 'rgba(255,255,255,0.07)', color: '#94a3b8' }}>{accounts.length}</span>
        </div>
      </CardHeader>
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
        ) : filtered.map((acc, i) => {
          const sc = acc.status === 'active' ? { label: 'Active', color: '#10b981' }
            : acc.status === 'passed' ? { label: 'Passed', color: '#60a5fa' }
            : acc.status === 'funded' ? { label: 'Funded', color: '#FF5C00' }
            : { label: 'Not Passed', color: '#ef4444' };
          const cLabel = acc.challenge_type === 'two-step' ? '2-Step' : acc.challenge_type === 'instant' ? 'Instant' : 'Inst. Light';
          return (
            <div key={acc.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-white/[0.02] border-b last:border-0"
              style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${sc.color}12`, border: `1px solid ${sc.color}25` }}>
                  <span className="text-[8px] font-black" style={{ color: sc.color }}>{sc.label.slice(0, 2).toUpperCase()}</span>
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground font-mono">{cLabel} · {acc.mt_login || acc.account_id}</div>
                  <div className="text-[10px] text-white/35">${(acc.account_size || 0).toLocaleString()} · {(acc.phase || 'phase1').replace('phase', 'Phase ')}</div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold"
                style={{ background: `${sc.color}15`, color: sc.color, border: `1px solid ${sc.color}30` }}>
                {sc.label}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Main AccountOverview ─────────────────────────────────────────────────────
export default function AccountOverview({ onStartChallenge, onNavigate }) {
  const queryClient = useQueryClient();
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showCredentials, setShowCredentials] = useState(false);
  const [error, setError] = useState(null);

  // All hooks must be called unconditionally at the top
  useEffect(() => {
    try {
      const unsub = base44.entities.ChallengeAccount.subscribe((event) => {
        if (event.type === 'update' || event.type === 'create') {
          queryClient.setQueryData(['challenge-accounts'], (old = []) =>
            event.type === 'create' ? [event.data, ...old] : old.map(a => a.id === event.id ? event.data : a)
          );
        }
      });
      return unsub;
    } catch (err) {
      console.error('Subscription error:', err);
    }
  }, [queryClient]);

  const { data: accounts = [], isLoading, error: accountsError } = useQuery({
    queryKey: ['challenge-accounts'],
    queryFn: () => base44.entities.ChallengeAccount.list('-created_date', 50),
    refetchInterval: 5000, staleTime: 3000,
  });

  const activeAccounts = accounts?.filter(a => ['active', 'funded', 'passed'].includes(a.status)) || [];
  const account = selectedAccount
    ? (accounts?.find(a => a.id === selectedAccount.id) || selectedAccount)
    : (activeAccounts[0] || null);

  const { data: tradeRecords = [], error: tradeError } = useQuery({
    queryKey: ['trade-records-overview', account?.account_id],
    queryFn: () => base44.entities.TradeRecord.filter({ account_id: account?.account_id }),
    enabled: !!account?.account_id,
    refetchInterval: 5000, staleTime: 3000,
  });

  const { data: livePositionsData, error: positionsError } = useQuery({
    queryKey: ['live-positions-overview', account?.account_id],
    queryFn: async () => {
      try {
        const res = await base44.functions.invoke('getLivePositions', { account_id: account?.account_id });
        return res?.data?.positions || [];
      } catch (err) {
        console.error('Failed to fetch live positions:', err);
        return [];
      }
    },
    enabled: !!account?.account_id,
    refetchInterval: 5000, staleTime: 3000,
  });

  // Error handling after all hooks
  if (accountsError) {
    console.error('Failed to load accounts:', accountsError);
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

  if (isLoading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

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

      <ActiveAccountCard account={account} onNavigate={onNavigate} liveEquity={liveEquity} liveUnrealizedPnl={liveUnrealizedPnl} setShowCredentials={setShowCredentials} />

      <LiveTradeFeed account={account} trades={tradeRecords} onRefresh={() => queryClient.invalidateQueries({ queryKey: ['trade-records-overview', account?.account_id] })} />

      {/* Current Results + Challenge Detail */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <CurrentResultsChart account={account} trades={tradeRecords} />
        </div>
        <ChallengeDetailSidebar account={account} />
      </div>

      {/* Performance Metrics + Progress Timeline */}
      <div className="grid lg:grid-cols-2 gap-4">
        <PerformanceMetrics account={account} trades={tradeRecords} />
        <ProgressTimeline account={account} />
      </div>

      {/* Statistics + Daily Summary */}
      <div className="grid md:grid-cols-2 gap-4">
        <StatisticsPanel account={account} tradeRecords={tradeRecords} />
        <DailySummaryPanel tradeRecords={tradeRecords} />
      </div>

      <DisciplinePanel account={account} tradeRecords={tradeRecords} />

      <AccountHistorySection accounts={accounts} />

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