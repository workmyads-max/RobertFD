import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronUp, RefreshCw, Copy, ChevronRight,
  Plus, BarChart3, Key, CalendarDays, Info, Check, X
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// ─── helpers ────────────────────────────────────────────────────────────────
function fmt(n, d = 2) { return (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }); }
function fmtTime(t) {
  if (!t) return '—';
  const ms = Date.now() - new Date(t).getTime();
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  return `${String(h).padStart(2,'0')}:${String(m % 60).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;
}
function useCopyText() {
  const [copied, setCopied] = useState(null);
  const copy = (val, key) => { navigator.clipboard.writeText(val).catch(() => {}); setCopied(key); setTimeout(() => setCopied(null), 1500); };
  return { copied, copy };
}

// ─── Active Account Card ─────────────────────────────────────────────────────
function ActiveAccountCard({ account, onNavigate }) {
  const { copied, copy } = useCopyText();
  if (!account) return null;
  const balance = account.balance || account.account_size || 0;
  const equity = account.equity || balance;
  const unrealizedPnl = equity - balance;
  const todayPnl = account.daily_pnl || 0;
  const challengeLabel = account.challenge_type === 'two-step' ? '2-Step' : account.challenge_type === 'instant' ? 'Instant' : 'Instant Light';
  const statusLabel = account.status === 'active' ? 'Ongoing' : account.status === 'passed' ? 'Passed' : account.status === 'funded' ? 'Funded' : account.status;
  const statusColor = account.status === 'active' ? '#10b981' : account.status === 'funded' ? '#FF5C00' : account.status === 'passed' ? '#60a5fa' : '#888';

  return (
    <div className="rounded-xl overflow-hidden mb-3" style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: `${statusColor}20`, color: statusColor, border: `1px solid ${statusColor}40` }}>{statusLabel}</span>
          <span className="text-sm font-bold text-foreground">{challengeLabel}: {account.mt_login || account.account_id}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Visible</span>
          <div className="w-9 h-5 rounded-full bg-primary flex items-center justify-end px-0.5 cursor-pointer"><div className="w-4 h-4 rounded-full bg-white shadow" /></div>
        </div>
      </div>

      {/* Balance row */}
      <div className="flex flex-wrap items-center gap-6 px-5 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <span className="text-xs font-mono text-muted-foreground">Balance: <strong className="text-foreground">${fmt(balance)}</strong></span>
        {account.provisioned_at && <span className="text-xs font-mono text-muted-foreground">End: <strong className="text-foreground">{new Date(new Date(account.provisioned_at).getTime() + 30*24*60*60*1000).toLocaleDateString('en-US', { day:'numeric', month:'short', year:'numeric' })}</strong></span>}
        <span className="text-xs font-mono text-muted-foreground">Status: <strong style={{ color: statusColor }}>{statusLabel}</strong></span>
        {/* progress bar */}
        <div className="flex-1 min-w-[80px]">
          <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min((account.profit_target_progress || 0) / (account.rule_snapshot?.phase1_target || 10) * 100, 100)}%` }} />
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <button onClick={() => copy(account.mt_login || '', 'login')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground border border-white/10 hover:bg-white/5 transition-colors">
          <Key className="w-3.5 h-3.5" />
          {copied === 'login' ? 'Copied!' : 'Credentials'}
        </button>
        <button onClick={() => onNavigate && onNavigate('accounts')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground border border-white/10 hover:bg-white/5 transition-colors">
          <CalendarDays className="w-3.5 h-3.5" />
          Account MetriX
        </button>
        <button onClick={() => onNavigate && onNavigate('accounts')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-foreground border border-white/20 hover:bg-white/5 transition-colors ml-auto">
          Detail <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-3 divide-x" style={{ divideColor: 'rgba(255,255,255,0.06)' }}>
        {[
          { label: "Today's profit", value: `$${fmt(todayPnl)}`, color: todayPnl >= 0 ? '#10b981' : '#ef4444' },
          { label: 'Equity', value: `$${fmt(equity)}`, color: '#10b981' },
          { label: 'Unrealized PnL', value: `${unrealizedPnl >= 0 ? '+' : ''}$${fmt(unrealizedPnl)}`, color: unrealizedPnl >= 0 ? '#10b981' : '#ef4444' },
        ].map(m => (
          <div key={m.label} className="px-5 py-4 text-center" style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="text-[10px] font-mono text-muted-foreground mb-2 flex items-center justify-center gap-1">{m.label} <Info className="w-3 h-3" /></div>
            <div className="text-xl font-black" style={{ color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── History section ─────────────────────────────────────────────────────────
const HISTORY_TABS = [
  { id: 'all', label: 'All Accounts' },
  { id: 'active', label: 'Active' },
  { id: 'passed', label: 'Passed' },
  { id: 'failed', label: 'Failed' },
];

function AccountHistorySection({ accounts }) {
  const [tab, setTab] = useState('all');
  const filtered = tab === 'all' ? accounts : accounts.filter(a => a.status === tab);

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-foreground">History</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>Show only visible</span>
          <div className="w-4 h-4 border border-white/20 rounded" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b overflow-x-auto" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        {HISTORY_TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${tab === t.id ? 'text-primary border-primary' : 'text-muted-foreground border-transparent hover:text-foreground'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Rows */}
      <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        {filtered.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">No accounts</div>
        ) : filtered.map(acc => {
          const sc = acc.status === 'active' ? { label: 'Ongoing', color: '#10b981' }
            : acc.status === 'passed' ? { label: 'Passed', color: '#60a5fa' }
            : acc.status === 'funded' ? { label: 'Funded', color: '#FF5C00' }
            : { label: 'Not passed', color: '#ef4444' };
          const cLabel = acc.challenge_type === 'two-step' ? '2-Step' : 'Instant';
          return (
            <div key={acc.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 hover:bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: `${sc.color}20`, color: sc.color, border: `1px solid ${sc.color}40` }}>{sc.label}</span>
                <span className="text-sm font-semibold font-mono text-foreground">{cLabel}: {acc.mt_login || acc.account_id}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Visible</span>
                <div className="w-8 h-4 rounded-full border border-white/20 cursor-pointer" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Statistics ──────────────────────────────────────────────────────────────
function StatBox({ label, value }) {
  return (
    <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-1 mb-1">{label} <Info className="w-3 h-3" /></div>
      <div className="text-base font-bold text-foreground">{value}</div>
    </div>
  );
}

function StatisticsPanel({ account, tradeRecords }) {
  const balance = account?.balance || account?.account_size || 0;
  const equity = account?.equity || balance;
  const closedTrades = tradeRecords.filter(t => t.status === 'closed');
  const wins = closedTrades.filter(t => (t.pnl || 0) > 0);
  const losses = closedTrades.filter(t => (t.pnl || 0) < 0);
  const winRate = closedTrades.length ? (wins.length / closedTrades.length * 100) : 0;
  const avgWin = wins.length ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : 0;
  const avgLoss = losses.length ? Math.abs(losses.reduce((s, t) => s + t.pnl, 0) / losses.length) : 0;
  const totalLots = closedTrades.reduce((s, t) => s + (t.lots || 0), 0);
  const profitFactor = avgLoss > 0 ? (avgWin * wins.length) / (avgLoss * losses.length) : 0;
  const rrrAvg = avgLoss > 0 ? avgWin / avgLoss : 0;
  const expectancy = closedTrades.length > 0 ? (wins.length / closedTrades.length * avgWin - losses.length / closedTrades.length * avgLoss) : 0;

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
      <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <span className="text-sm font-bold text-foreground">Statistics</span>
      </div>
      <div className="p-4 grid grid-cols-2 gap-2">
        <StatBox label="Equity" value={`$${fmt(equity)}`} />
        <StatBox label="Balance" value={`$${fmt(balance)}`} />
        <StatBox label="Win rate" value={winRate > 0 ? `${winRate.toFixed(1)}%` : '0'} />
        <StatBox label="Average profit" value={avgWin > 0 ? `$${fmt(avgWin)}` : '0'} />
        <StatBox label="Average loss" value={avgLoss > 0 ? `-$${fmt(avgLoss)}` : '0'} />
        <StatBox label="Number of trades" value={closedTrades.length || '0'} />
        <StatBox label="Lots" value={totalLots > 0 ? totalLots.toFixed(2) : '0'} />
        <StatBox label="Sharpe Ratio" value="—" />
        <StatBox label="Average RRR" value={rrrAvg > 0 ? rrrAvg.toFixed(2) : '0'} />
        <StatBox label="Expectancy" value={expectancy !== 0 ? `$${fmt(expectancy)}` : '0'} />
        <div className="col-span-2">
          <StatBox label="Profit factor" value={profitFactor > 0 ? profitFactor.toFixed(2) : '—'} />
        </div>
      </div>
    </div>
  );
}

// ─── Daily Summary ───────────────────────────────────────────────────────────
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
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
      <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <span className="text-sm font-bold text-foreground">Daily Summary</span>
        <Info className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
      {rows.length === 0 ? (
        <div className="px-5 py-12 text-center text-sm text-muted-foreground">No closed trades yet</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Date', 'Trades', 'Lots', 'Result'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.day} className="border-b hover:bg-white/[0.02]" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  <td className="px-4 py-2.5 font-mono text-muted-foreground">{new Date(r.day).toLocaleDateString('en-US', { day:'numeric', month:'short', year:'numeric' })}</td>
                  <td className="px-4 py-2.5 text-foreground">{r.trades}</td>
                  <td className="px-4 py-2.5 font-mono text-muted-foreground">{r.lots}</td>
                  <td className={`px-4 py-2.5 font-bold font-mono ${r.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {r.pnl >= 0 ? '+' : ''}${fmt(r.pnl)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Discipline Score (gauge) ─────────────────────────────────────────────────
function DisciplineGauge({ score }) {
  const r = 70, cx = 90, cy = 90;
  const circ = Math.PI * r; // half circle
  const pct = Math.min(score, 100) / 100;
  const dash = pct * circ;
  const color = score < 30 ? '#ef4444' : score < 80 ? '#f59e0b' : '#10b981';
  const label = score < 30 ? 'Poor' : score < 80 ? 'Average' : 'Excellent';

  return (
    <div className="flex flex-col items-center">
      <svg width="180" height="100" viewBox="0 0 180 100">
        {/* track */}
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" strokeLinecap="round" />
        {/* fill */}
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`} style={{ transition: 'stroke-dasharray 1s ease' }} />
        {/* labels */}
        {[0,30,50,80,100].map((v, i) => {
          const angle = Math.PI * (v / 100);
          const lx = cx - r * Math.cos(angle);
          const ly = cy - r * Math.sin(angle);
          return <text key={v} x={lx} y={ly - 6} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.4)">{v}%</text>;
        })}
        {/* center */}
        <text x={cx} y={cy - 10} textAnchor="middle" fontSize="20" fontWeight="bold" fill={color}>{score}%</text>
        <text x={cx} y={cy + 8} textAnchor="middle" fontSize="11" fill={color}>{label}</text>
      </svg>
    </div>
  );
}

function DisciplinePanel({ account, tradeRecords }) {
  const snap = account?.rule_snapshot || {};
  const tradingDays = account?.trading_days || 0;
  const minDays = 2;
  const dailyDDUsed = account?.daily_drawdown_used || 0;
  const maxDDUsed = account?.max_drawdown_used || 0;
  const dailyDDLimit = snap.daily_dd_limit ?? 5;
  const maxDDLimit = snap.max_dd_limit ?? 10;
  const profitTargetPct = account?.profit_target_progress || 0;
  const profitTarget = snap.phase1_target ?? 10;
  const balance = account?.balance || account?.account_size || 0;
  const accountSize = account?.account_size || 100000;

  // Score: weighted average of objectives passing
  const scores = [
    tradingDays >= minDays ? 100 : (tradingDays / minDays) * 50,
    dailyDDUsed < dailyDDLimit ? 100 : 0,
    maxDDUsed < maxDDLimit ? 100 : 0,
    profitTargetPct >= profitTarget ? 100 : (profitTargetPct / profitTarget) * 50,
  ];
  const disciplineScore = Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);

  const dailyPnl = account?.daily_pnl || 0;
  const totalPnl = balance - accountSize;
  const maxPermittedLoss = accountSize - accountSize * (maxDDLimit / 100);
  const todayPermittedLoss = (account?.daily_start_balance || accountSize) - (account?.daily_start_balance || accountSize) * (dailyDDLimit / 100);
  const todayProfit = dailyPnl;

  const objectives = [
    { label: `Minimum ${minDays} Trading Days`, result: tradingDays, pass: tradingDays >= minDays },
    { label: `Max Daily Loss: -$${fmt(accountSize * dailyDDLimit / 100, 0)}`, result: `${dailyPnl < 0 ? '' : '-'}$${fmt(Math.abs(dailyPnl))} (${Math.abs(dailyDDUsed).toFixed(1)}%)`, pass: dailyDDUsed < dailyDDLimit },
    { label: `Max Loss: -$${fmt(accountSize * maxDDLimit / 100, 0)}`, result: `${totalPnl < 0 ? '' : '-'}$${fmt(Math.abs(totalPnl < 0 ? totalPnl : 0))} (${Math.abs(maxDDUsed).toFixed(1)}%)`, pass: maxDDUsed < maxDDLimit },
    { label: `Profit Target: $${fmt(accountSize * profitTarget / 100, 0)}`, result: `$${fmt(Math.max(0, totalPnl))} (${profitTargetPct.toFixed(1)}%)`, pass: profitTargetPct >= profitTarget },
  ];

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
      <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <span className="text-sm font-bold text-foreground">Your stats</span>
      </div>
      <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        {/* Left: Discipline Score */}
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-foreground">Discipline Score</span>
            <Info className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="flex gap-4 text-[10px] mb-4 text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />0 – 30%</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />30 – 80%</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />80 – 100%</span>
          </div>
          <DisciplineGauge score={disciplineScore} />
        </div>

        {/* Right: Objectives */}
        <div className="p-5">
          <div className="text-sm font-bold text-foreground mb-4">Objectives</div>
          <div className="grid grid-cols-3 text-[10px] font-semibold text-muted-foreground uppercase mb-2">
            <span>Trading Objectives</span>
            <span className="text-center">Result</span>
            <span className="text-right">Summary</span>
          </div>
          <div className="space-y-2">
            {objectives.map(obj => (
              <div key={obj.label} className="grid grid-cols-3 items-center gap-2 py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <span className="text-xs text-primary font-medium">{obj.label}</span>
                <span className="text-xs font-mono text-foreground text-center">{obj.result}</span>
                <div className="flex justify-end">
                  <div className={`w-6 h-6 rounded flex items-center justify-center ${obj.pass ? 'bg-emerald-500' : 'bg-red-500'}`}>
                    {obj.pass ? <Check className="w-3.5 h-3.5 text-white" /> : <X className="w-3.5 h-3.5 text-white" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom stats */}
      <div className="grid grid-cols-3 divide-x border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        {[
          { label: "Today's permitted loss", value: `$${fmt(Math.max(0, todayPermittedLoss + todayProfit))}` },
          { label: 'Max permitted loss', value: `$${fmt(Math.max(0, balance - accountSize * (1 - maxDDLimit / 100)))}` },
          { label: "Today's profit", value: `$${fmt(todayProfit)}` },
        ].map(s => (
          <div key={s.label} className="px-5 py-4 text-center" style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1 mb-2">{s.label} <Info className="w-3 h-3" /></div>
            <div className="text-base font-bold text-foreground">{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Open Trades expandable ──────────────────────────────────────────────────
function OpenTradeRow({ trade, index }) {
  const [expanded, setExpanded] = useState(false);
  const [elapsed, setElapsed] = useState(fmtTime(trade.open_time));
  const isBuy = trade.type === 'BUY';
  const pnl = trade.pnl || 0;
  const pips = Math.abs(((trade.current_price || trade.entry || 0) - (trade.entry || 0)) * 10).toFixed(1);

  useEffect(() => {
    const iv = setInterval(() => setElapsed(fmtTime(trade.open_time)), 1000);
    return () => clearInterval(iv);
  }, [trade.open_time]);

  return (
    <>
      <tr className="border-b hover:bg-white/[0.02] transition-colors cursor-pointer"
        style={{ borderColor: 'rgba(255,255,255,0.05)' }}
        onClick={() => setExpanded(e => !e)}>
        <td className="px-4 py-3">
          <div className="text-xs font-mono text-muted-foreground">{(trade.ticket || trade.trade_id || String(index + 1)).slice(0, 9)}{(trade.ticket || trade.trade_id || '').length > 9 ? '…' : ''}</div>
          <div className={`text-xs font-bold flex items-center gap-1 ${isBuy ? 'text-emerald-400' : 'text-red-400'}`}>
            <span>{isBuy ? '↗' : '↘'}</span> {trade.type}
          </div>
        </td>
        <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
          {trade.open_time ? new Date(trade.open_time).toLocaleString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit' }) : '—'}
        </td>
        <td className="px-4 py-3 text-xs font-mono text-foreground">{trade.lots || 0}</td>
        <td className="px-4 py-3 text-xs font-mono font-bold text-foreground">{trade.symbol || '—'}</td>
        <td className="px-4 py-3">
          <div className={`px-3 py-1.5 rounded text-sm font-black font-mono text-center ${pnl >= 0 ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>
            {pnl >= 0 ? '+' : ''}${fmt(pnl)}
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="px-3 py-1.5 rounded text-xs font-mono text-center text-foreground bg-white/[0.06]">{pips}</div>
        </td>
        <td className="px-4 py-3">
          <div className="px-3 py-1.5 rounded text-xs font-mono text-center text-foreground bg-white/[0.06]">{elapsed}</div>
        </td>
        <td className="px-4 py-3 text-muted-foreground">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </td>
      </tr>

      <AnimatePresence>
        {expanded && (
          <tr key="details">
            <td colSpan={8} className="px-4 pb-4">
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="rounded-xl p-5 mt-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                {/* $ Price — real MT5 fields */}
                <div>
                  <div className="text-[10px] font-bold text-muted-foreground mb-2 flex items-center gap-1"><span>$</span> Price</div>
                  <div className="space-y-1.5 text-xs">
                    {[
                      ['Type', trade.type],
                      ['Open', trade.entry > 0 ? trade.entry.toFixed(5) : '—'],
                      ['Close', '—'],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-3"><span className="text-muted-foreground">{k}</span><span className={`font-mono ${k==='Type' ? (trade.type==='BUY' ? 'text-emerald-400' : 'text-red-400') : 'text-foreground'}`}>{v}</span></div>
                    ))}
                    <div className="pt-1 text-[10px] font-semibold text-muted-foreground">Current</div>
                    {[
                      ['Bid', trade.current_price > 0 ? trade.current_price.toFixed(5) : '—'],
                      ['Ask', '—'],
                      ['Spread', '—'],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-3"><span className="text-muted-foreground">{k}</span><span className="font-mono text-foreground">{v}</span></div>
                    ))}
                  </div>
                </div>
                {/* Trade Protection — real SL/TP from MT5 */}
                <div>
                  <div className="text-[10px] font-bold text-muted-foreground mb-2">Trade Protection</div>
                  <div className="space-y-1.5 text-xs">
                    {[
                      ['SL', trade.sl > 0 ? trade.sl.toFixed(5) : '—'],
                      ['SL Pips', '—'],
                      ['TP', trade.tp > 0 ? trade.tp.toFixed(5) : '—'],
                      ['TP Pips', '—'],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-3"><span className="text-muted-foreground">{k}</span><span className="font-mono text-foreground">{v}</span></div>
                    ))}
                  </div>
                </div>
                {/* Results — real profit + swap from MT5 */}
                <div>
                  <div className="text-[10px] font-bold text-muted-foreground mb-2">Results</div>
                  <div className="space-y-2 text-xs">
                    {[
                      ['Gross profit', pnl],
                      ['Swap', trade.swap || 0],
                      ['Comm.', 0],
                      ['Net profit', pnl + (trade.swap || 0)],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <div className="text-muted-foreground">{k}</div>
                        <div className={`font-mono font-bold ${v >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{v >= 0 ? '+' : ''}${fmt(v)}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Time — real open time from MT5 */}
                <div>
                  <div className="text-[10px] font-bold text-muted-foreground mb-2">Time</div>
                  <div className="space-y-2 text-xs">
                    <div>
                      <div className="text-muted-foreground">Open</div>
                      <div className="font-mono text-foreground leading-relaxed">{trade.open_time ? new Date(trade.open_time).toLocaleString('en-US', { month:'numeric', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit' }) : '—'}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Closed</div>
                      <div className="font-mono text-foreground">—</div>
                    </div>
                  </div>
                </div>
                {/* Trade Stats — MAE/MFE from entry vs current */}
                <div>
                  <div className="text-[10px] font-bold text-muted-foreground mb-2 flex items-center gap-1">Trade Stats <Info className="w-3 h-3" /></div>
                  <div className="space-y-1.5 text-xs">
                    {(() => {
                      const entry = trade.entry || 0;
                      const cur = trade.current_price || entry;
                      const isBuy = trade.type === 'BUY';
                      // MAE = worst excursion (max adverse), MFE = best excursion (max favorable)
                      // For open positions we estimate from entry vs current
                      const mae = isBuy ? Math.min(0, cur - entry) : Math.min(0, entry - cur);
                      const mfe = isBuy ? Math.max(0, cur - entry) : Math.max(0, entry - cur);
                      const pipSize = entry > 10 ? 0.0001 : 0.00001;
                      const maePip = pipSize > 0 ? (mae / pipSize).toFixed(1) : '—';
                      const mfePip = pipSize > 0 ? (mfe / pipSize).toFixed(1) : '—';
                      return [
                        ['MAE Pip', mae !== 0 ? maePip : '—'],
                        ['MAE', mae !== 0 ? (entry + mae).toFixed(5) : entry > 0 ? entry.toFixed(5) : '—'],
                        ['MFE Pip', mfe !== 0 ? mfePip : '—'],
                        ['MFE', mfe !== 0 ? (entry + mfe).toFixed(5) : cur > 0 ? cur.toFixed(5) : '—'],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-3"><span className="text-muted-foreground">{k}</span><span className="font-mono text-foreground">{v}</span></div>
                      ));
                    })()}
                  </div>
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  );
}

const PAGE_SIZE = 5;
function OpenTradesPanel({ account }) {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchPositions = async () => {
    if (!account?.account_id) return;
    setLoading(true);
    try {
      const res = await base44.functions.invoke('getLivePositions', { account_id: account.account_id });
      setPositions(res?.data?.positions || []);
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchPositions(); const iv = setInterval(fetchPositions, 15000); return () => clearInterval(iv); }, [account?.account_id]);

  const totalPages = Math.ceil(positions.length / PAGE_SIZE);
  const paginated = positions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm font-bold text-foreground">Live Trade Feed</span>
          {positions.length > 0 && (
            <span className={`text-sm font-black font-mono ${positions.reduce((s, p) => s + (p.pnl || 0), 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              Total PnL: {positions.reduce((s, p) => s + (p.pnl || 0), 0) >= 0 ? '+' : ''}${fmt(positions.reduce((s, p) => s + (p.pnl || 0), 0))}
            </span>
          )}
        </div>
        <button onClick={fetchPositions} disabled={loading} className="p-1.5 rounded hover:bg-white/5 text-muted-foreground transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && positions.length === 0 ? (
        <div className="flex items-center justify-center py-10"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : positions.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-muted-foreground">No open positions — refreshes every 15s from MT5</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Type', 'Open Time', 'Volume', 'Symbol', 'PnL', 'Pips', 'Duration', ''].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {paginated.map((t, i) => <OpenTradeRow key={t.ticket || t.trade_id || i} trade={t} index={(page - 1) * PAGE_SIZE + i} />)}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <span className="text-xs text-muted-foreground">Total open trades: <strong className="text-foreground">{positions.length}</strong></span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2 text-xs">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="w-7 h-7 rounded flex items-center justify-center border border-white/10 text-muted-foreground hover:text-foreground disabled:opacity-30">‹</button>
                <span className="text-muted-foreground">Page</span>
                <span className="px-2 py-0.5 rounded border border-white/20 text-foreground">{page}</span>
                <span className="text-muted-foreground">of {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="w-7 h-7 rounded flex items-center justify-center border border-white/10 text-muted-foreground hover:text-foreground disabled:opacity-30">›</button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main AccountOverview ─────────────────────────────────────────────────────
export default function AccountOverview({ onStartChallenge, onNavigate }) {
  const queryClient = useQueryClient();
  const [selectedAccount, setSelectedAccount] = useState(null);

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

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['challenge-accounts'],
    queryFn: () => base44.entities.ChallengeAccount.list('-created_date', 50),
    refetchInterval: 15000,
    staleTime: 10000,
  });

  const activeAccounts = accounts.filter(a => ['active', 'funded', 'passed'].includes(a.status));
  const account = selectedAccount || activeAccounts[0] || null;

  const { data: tradeRecords = [] } = useQuery({
    queryKey: ['trade-records-overview', account?.account_id],
    queryFn: () => base44.entities.TradeRecord.filter({ account_id: account.account_id }),
    enabled: !!account?.account_id,
    refetchInterval: 30000,
  });

  if (isLoading) return <div className="flex items-center justify-center py-24"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  if (!account) return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5"><BarChart3 className="w-8 h-8 text-primary/50" /></div>
      <div className="text-xl font-black text-foreground mb-2">No Active Accounts</div>
      <div className="text-sm text-muted-foreground mb-6 max-w-md">Purchase a challenge to unlock the full institutional overview.</div>
      <button onClick={onStartChallenge} className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold text-white hover:scale-105 transition-all" style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)', boxShadow: '0 4px 20px rgba(255,92,0,0.3)' }}>
        <Plus className="w-4 h-4" /> Start New Challenge
      </button>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Active accounts header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-sm font-bold text-foreground">Active accounts</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Show only visible</span>
          <div className="w-4 h-4 border border-white/20 rounded" />
        </div>
      </div>

      {/* Account selector (multi) */}
      {activeAccounts.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {activeAccounts.map(a => (
            <button key={a.id} onClick={() => setSelectedAccount(a)}
              className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-mono transition-all ${account?.id === a.id ? 'text-primary' : 'text-muted-foreground'}`}
              style={{ background: account?.id === a.id ? 'rgba(255,92,0,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${account?.id === a.id ? 'rgba(255,92,0,0.4)' : 'rgba(255,255,255,0.08)'}` }}>
              <div className="font-bold">{a.account_id}</div>
              <div className="text-[10px] opacity-60">${(a.account_size || 0).toLocaleString()}</div>
            </button>
          ))}
        </div>
      )}

      {/* Active Account Card */}
      <ActiveAccountCard account={account} onNavigate={onNavigate} />

      {/* History */}
      <AccountHistorySection accounts={accounts} />

      {/* Statistics + Daily Summary */}
      <div className="grid md:grid-cols-2 gap-5">
        <StatisticsPanel account={account} tradeRecords={tradeRecords} />
        <DailySummaryPanel tradeRecords={tradeRecords} />
      </div>

      {/* Discipline Score + Objectives */}
      <DisciplinePanel account={account} tradeRecords={tradeRecords} />

      {/* Open Trades */}
      <OpenTradesPanel account={account} />
    </div>
  );
}