import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2, XCircle, AlertTriangle, RefreshCw, ChevronDown, ChevronUp,
  BarChart3, Calendar, Clock, History, ArrowUpRight, ArrowDownRight, Lock,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { filterRealTrades } from '@/hooks/useAccountTrades';

const RETENTION_DAYS = 14;

function daysLeft(trashedAt) {
  if (!trashedAt) return null;
  const ms = new Date(trashedAt).getTime() + RETENTION_DAYS * 86400000 - Date.now();
  return Math.max(0, Math.ceil(ms / 86400000));
}

function isHistoryExpired(acc) {
  if (acc?.history_expired) return true;
  const left = daysLeft(acc?.trashed_at);
  return left !== null && left <= 0;
}

function statusBadge(acc) {
  if (acc.status === 'failed') return { label: 'Failed', color: '#ef4444', Icon: XCircle };
  if (acc.phase_review_status === 'rejected' || acc.funded_review_status === 'rejected') {
    return { label: 'Rejected', color: '#ef4444', Icon: XCircle };
  }
  if (acc.trash_reason === 'superseded' || acc.phase_review_status === 'approved' || acc.funded_review_status === 'approved') {
    return { label: 'Passed (Approved)', color: '#10b981', Icon: BarChart3 };
  }
  return { label: acc.status || 'Trashed', color: '#f59e0b', Icon: AlertTriangle };
}

function FrozenTradeList({ trades }) {
  if (!trades.length) {
    return (
      <div className="py-8 text-center text-sm text-white/30">
        No closed trades in this account's snapshot.
      </div>
    );
  }
  return (
    <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
      {trades.map((t, i) => {
        const isBuy = t.type === 'BUY';
        const pnl = t.pnl || 0;
        const profit = pnl >= 0;
        return (
          <div key={t.trade_id || i} className="grid items-center px-4 py-3"
            style={{ gridTemplateColumns: '32px 1fr 1fr 1fr' }}>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isBuy ? 'bg-emerald-400/15' : 'bg-red-400/15'}`}>
              {isBuy ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" /> : <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />}
            </div>
            <div className="text-xs font-mono text-white/70">
              {t.open_time ? new Date(t.open_time).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
            </div>
            <div className="text-sm font-bold text-white">{t.symbol || '—'}</div>
            <div className={`text-right text-sm font-bold font-mono ${profit ? 'text-emerald-400' : 'text-red-400'}`}>
              {profit ? '+' : ''}${Math.abs(pnl).toFixed(2)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function TrashAccounts({ onStartChallenge }) {
  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['trash-accounts', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const all = await base44.entities.ChallengeAccount.filter({ user_email: user.email, is_trashed: true });
      return Array.isArray(all) ? all : [];
    },
    enabled: !!user?.email,
    placeholderData: (prev) => prev,
  });

  const sorted = [...accounts].sort((a, b) =>
    new Date(b.trashed_at || b.updated_date || 0).getTime() - new Date(a.trashed_at || a.updated_date || 0).getTime()
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
            <Trash2 className="w-6 h-6 text-red-400" /> Trash Account
          </h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">
            Closed challenge accounts — frozen historical snapshot
          </p>
        </div>
        <div className="px-4 py-2 rounded-xl text-xs font-mono"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
          {accounts.length} trashed account{accounts.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* 14-day retention notice */}
      <div className="flex items-start gap-3 p-4 rounded-2xl mb-6"
        style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)' }}>
        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-bold text-amber-400 mb-1">History retained for 14 days</div>
          <div className="text-xs text-muted-foreground leading-relaxed">
            Trading history is available for 14 days only and will be deleted after that. These accounts
            are no longer synced from MT5 — the data below is a read-only frozen snapshot captured when
            the account reached its terminal state.
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
        </div>
      ) : sorted.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-16 text-center"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}>
          <Trash2 className="w-12 h-12 text-white/15 mx-auto mb-4" />
          <div className="text-lg font-black text-foreground mb-2">No Trashed Accounts</div>
          <div className="text-sm text-muted-foreground">Closed or expired challenge accounts will appear here.</div>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {sorted.map(acc => (
            <TrashAccountCardLazy key={acc.id} acc={acc} onStartChallenge={onStartChallenge} />
          ))}
        </div>
      )}
    </div>
  );
}

// Lazy-load each card's frozen trades only when expanded — avoids fetching
// every trashed account's TradeRecords up front.
function TrashAccountCardLazy({ acc, onStartChallenge }) {
  const [expanded, setExpanded] = useState(false);

  const { data: trades = [], isLoading: tradesLoading } = useQuery({
    queryKey: ['trash-trades', acc.account_id],
    queryFn: async () => {
      if (!acc.account_id) return [];
      const recs = await base44.entities.TradeRecord.filter({ account_id: acc.account_id });
      return Array.isArray(recs) ? recs : [];
    },
    enabled: expanded && !isHistoryExpired(acc),
    staleTime: Infinity, // frozen snapshot — never refetch
  });

  return (
    <TrashAccountCard
      acc={acc}
      trades={trades}
      tradesLoading={tradesLoading}
      expanded={expanded}
      setExpanded={setExpanded}
      onStartChallenge={onStartChallenge}
    />
  );
}

function TrashAccountCard({ acc, trades, tradesLoading, expanded, setExpanded, onStartChallenge }) {
  const badge = statusBadge(acc);
  const BadgeIcon = badge.Icon;
  const left = daysLeft(acc.trashed_at);
  const expired = isHistoryExpired(acc);

  const realTrades = useMemo(() => filterRealTrades(trades, acc), [trades, acc]);
  const totalPnl = realTrades.reduce((s, t) => s + (t.pnl || 0), 0);
  const wins = realTrades.filter(t => (t.pnl || 0) > 0).length;
  const winRate = realTrades.length > 0 ? Math.round((wins / realTrades.length) * 100) : (acc.win_rate || 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.18)' }}
    >
      <div className="h-1 w-full" style={{ background: '#ef4444', opacity: 0.5 }} />
      <button onClick={() => setExpanded(!expanded)}
        className="w-full p-5 text-left hover:bg-white/[0.02] transition-colors">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-base font-black text-foreground font-mono truncate">{acc.account_id}</span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5"
                style={{ background: `${badge.color}1a`, color: badge.color, border: `1px solid ${badge.color}40` }}>
                <BadgeIcon className="w-3 h-3" /> {badge.label}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono text-muted-foreground"
                style={{ background: 'rgba(255,255,255,0.05)' }}>
                {acc.phase?.replace('phase', 'Phase ')}
              </span>
            </div>
            <div className="text-xs font-mono text-muted-foreground">
              {acc.challenge_type === 'two-step' ? 'Two-Step' : acc.challenge_type === 'instant' ? 'Instant' : 'Instant Light'}
              {' · '}${(acc.account_size || 0).toLocaleString()}
              {' · '}{acc.account_type}
              {' · '}{acc.leverage}
            </div>
            <div className="text-[10px] font-mono text-muted-foreground/70 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Trashed {acc.trashed_at ? new Date(acc.trashed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
              {left !== null && !expired && <span className="ml-1 text-amber-400">· {left} day{left !== 1 ? 's' : ''} left</span>}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-xl font-black text-red-400">
              {(acc.pnl || 0) >= 0 ? '+' : ''}${(acc.pnl || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] font-mono text-muted-foreground">Final P&L</div>
          </div>
        </div>

        <div className="mt-3 flex items-start gap-2 text-[11px] text-amber-300/80">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>Trading history is available for 14 days only and will be deleted after that.</span>
        </div>
      </button>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-5 pb-4">
        {[
          { label: 'Total Trades', value: acc.total_trades || realTrades.length },
          { label: 'Win Rate', value: `${winRate}%` },
          { label: 'Trading Days', value: acc.trading_days || 0 },
          { label: 'Max DD', value: `${(acc.max_drawdown_used || 0).toFixed(2)}%` },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-3 text-center"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-[9px] font-mono text-muted-foreground uppercase mb-1">{s.label}</div>
            <div className="text-sm font-bold text-foreground">{s.value}</div>
          </div>
        ))}
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <History className="w-4 h-4 text-red-400" /> Frozen Trade History
                </div>
                <span className="flex items-center gap-1 text-[10px] font-mono text-white/40">
                  <Lock className="w-3 h-3" /> READ-ONLY SNAPSHOT
                </span>
              </div>

              {expired ? (
                <div className="py-8 text-center text-sm text-white/40">
                  History expired — older than 14 days
                </div>
              ) : tradesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <div className="grid gap-0 px-4 py-2 border-b text-[11px] text-white/35 font-medium"
                    style={{ borderColor: 'rgba(255,255,255,0.05)', gridTemplateColumns: '32px 1fr 1fr 1fr' }}>
                    <div /><div>Open</div><div>Symbol</div><div className="text-right">PnL</div>
                  </div>
                  <FrozenTradeList trades={realTrades} />
                  {realTrades.length > 0 && (
                    <div className="flex flex-wrap items-center gap-4 px-4 py-3 text-xs font-mono text-white/35"
                      style={{ background: 'rgba(0,0,0,0.15)' }}>
                      <span>{realTrades.length} trades</span>
                      <span className="text-emerald-400">{wins} wins</span>
                      <span className="text-red-400">{realTrades.length - wins} losses</span>
                      <span className={totalPnl >= 0 ? 'text-emerald-400 ml-auto' : 'text-red-400 ml-auto'}>
                        Total: {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-3 px-5 py-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <button onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-xs font-bold text-white/60 hover:text-white transition-colors">
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {expanded ? 'Hide history' : 'View frozen history'}
        </button>
        <button onClick={onStartChallenge}
          className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:scale-105"
          style={{ background: 'linear-gradient(90deg,#FF5C00,#FF7A2F)', boxShadow: '0 4px 12px rgba(255,92,0,0.25)' }}>
          <RefreshCw className="w-3.5 h-3.5" /> New Challenge
        </button>
      </div>
    </motion.div>
  );
}