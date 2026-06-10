import React, { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, BarChart3, Award, Plus, Clock, ChevronRight, Activity, Zap } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useSyncOnLogin } from '@/hooks/useSyncOnLogin';

function KpiPanel({ label, value, sub, trend, trendLabel }) {
  const isPos = trend >= 0;
  return (
    <div className="flex flex-col justify-between p-4 sm:p-6 border-b lg:border-b-0 border-r even:border-r-0 lg:even:border-r last:border-r-0" style={{ borderColor: 'hsl(var(--border))' }}>
      <div className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2 sm:mb-3">{label}</div>
      <div className="text-xl sm:text-3xl font-semibold text-foreground tracking-tight mb-1 sm:mb-2">{value}</div>
      <div className="flex items-center gap-2 flex-wrap">
        {trendLabel && (
          <span className={`text-xs font-medium ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
            {isPos ? '↑' : '↓'} <span className="hidden sm:inline">{trendLabel}</span>
          </span>
        )}
        {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
      </div>
    </div>
  );
}

function ObjectiveRow({ label, current, target, color, passed, danger }) {
  const pct = Math.min((current / target) * 100, 100);
  const status = passed ? 'On Track' : danger ? 'At Risk' : 'Active';
  const statusColor = passed ? 'text-emerald-400' : danger ? 'text-red-400' : 'text-muted-foreground';
  return (
    <div className="py-4 border-b last:border-b-0" style={{ borderColor: 'hsl(var(--border))' }}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium text-foreground">{label}</div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-foreground">{current.toFixed(2)}%<span className="text-muted-foreground"> / {target}%</span></span>
          <span className={`text-xs font-medium ${statusColor} hidden sm:inline`}>{status}</span>
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function DashboardOverview({ user, onStartChallenge, onNavigate }) {
  const location = useUserLocation();
  const { syncing, lastSync, syncError } = useSyncOnLogin();
  const queryClient = useQueryClient();
  const [lastRealtime, setLastRealtime] = useState(null);

  const { data: accounts = [] } = useQuery({
    queryKey: ['challenge-accounts'],
    queryFn: () => base44.entities.ChallengeAccount.list('-created_date', 50),
    refetchInterval: 15 * 1000,   // poll every 15s as fallback
    staleTime: 10 * 1000,
  });

  // Real-time subscription — instantly updates when sync writes new data
  useEffect(() => {
    const unsub = base44.entities.ChallengeAccount.subscribe((event) => {
      if (event.type === 'update' || event.type === 'create') {
        queryClient.setQueryData(['challenge-accounts'], (old = []) => {
          if (event.type === 'create') return [event.data, ...old];
          return old.map(a => a.id === event.id ? event.data : a);
        });
        setLastRealtime(new Date());
      }
    });
    return unsub;
  }, [queryClient]);

  const { data: pendingOrders = [] } = useQuery({
    queryKey: ['my-pending-orders'],
    queryFn: () => base44.entities.Order.filter({ email: user?.email }),
    enabled: !!user?.email,
    staleTime: 30 * 1000,
  });

  const activeAccounts = accounts.filter(a => a.status === 'active' || a.status === 'funded' || a.status === 'passed');
  const pendingActivation = pendingOrders.filter(o => o.payment_status === 'awaiting_confirmation' || o.payment_status === 'pending');

  const totalBalance = activeAccounts.reduce((s, a) => s + (a.balance || a.account_size || 0), 0);
  const totalEquity  = activeAccounts.reduce((s, a) => s + (a.equity  || a.balance || a.account_size || 0), 0);
  const totalPnl = activeAccounts.reduce((s, a) => s + (a.pnl || 0), 0);
  // Open position floating PnL = equity - balance (updated every 15s via sync + realtime)
  const openPnl = parseFloat((totalEquity - totalBalance).toFixed(2));
  const avgWinRate = activeAccounts.length
    ? activeAccounts.reduce((s, a) => s + (a.win_rate || 0), 0) / activeAccounts.length : 0;
  const worstDD = activeAccounts.length
    ? Math.max(...activeAccounts.map(a => a.daily_drawdown_used || 0)) : 0;

  const hasAccounts = activeAccounts.length > 0;
  const primaryAccount = activeAccounts[0];
  // Read limits from rule_snapshot — NOT hardcoded
  const snap = primaryAccount?.rule_snapshot || {};
  const dailyDDLimit = snap.daily_dd_limit ?? 5;
  const maxDDLimit = snap.max_dd_limit ?? 10;
  const profitTarget = primaryAccount?.phase === 'phase2'
    ? (snap.phase2_target ?? 5)
    : (snap.phase1_target ?? (primaryAccount?.challenge_type === 'instant' ? 8 : 10));

  const quickActions = [
    { label: 'Request Payout', page: 'withdrawals' },
    { label: 'View Analytics', page: 'analytics' },
    { label: 'Trading Journal', page: 'journal' },
    { label: 'Economic Calendar', page: 'calendar' },
  ];

  return (
    <div className="space-y-8">

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Welcome back, {user?.full_name?.split(' ')[0] || 'Trader'}
          </h1>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
            {!location.loading && (
              <>
                <span className="opacity-30">·</span>
                <span>{location.flag} {location.country}</span>
              </>
            )}
            {syncing && <><span className="opacity-30">·</span><span className="text-primary">Syncing…</span></>}
            {lastRealtime && <><span className="opacity-30">·</span><span className="text-emerald-400 flex items-center gap-1"><Zap className="w-3 h-3" />Live {lastRealtime.toLocaleTimeString()}</span></>}
            {!lastRealtime && lastSync && <><span className="opacity-30">·</span><span className="text-emerald-400">Synced {lastSync.timestamp.toLocaleTimeString()}</span></>}
            {syncError && <><span className="opacity-30">·</span><span className="text-red-400">Sync error</span></>}
          </div>
        </div>
        <button
          onClick={onStartChallenge}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: '#FF5C00' }}>
          <Plus className="w-4 h-4" /> New Challenge
        </button>
      </div>

      {/* Pending notice */}
      {pendingActivation.length > 0 && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-lg border text-sm"
          style={{ background: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.2)' }}>
          <Clock className="w-4 h-4 text-yellow-400 flex-shrink-0" />
          <span className="text-yellow-400 font-medium">{pendingActivation.length} order{pendingActivation.length > 1 ? 's' : ''} pending approval.</span>
          <span className="text-muted-foreground">Account will activate within 1–24 hours.</span>
        </div>
      )}

      {/* Empty state */}
      {!hasAccounts && pendingActivation.length === 0 && (
        <div className="rounded-xl border border-dashed py-20 flex flex-col items-center justify-center text-center"
          style={{ borderColor: 'hsl(var(--border))' }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
            style={{ background: 'rgba(255,92,0,0.1)', border: '1px solid rgba(255,92,0,0.2)' }}>
            <Plus className="w-5 h-5 text-primary" />
          </div>
          <div className="text-base font-semibold text-foreground mb-2">No active accounts</div>
          <div className="text-sm text-muted-foreground mb-6 max-w-sm">
            Purchase a challenge to access the trading terminal, analytics, and funded capital.
          </div>
          <button onClick={onStartChallenge}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-opacity"
            style={{ background: '#FF5C00' }}>
            <Plus className="w-4 h-4" /> Browse Challenge Plans
          </button>
        </div>
      )}

      {hasAccounts && (
        <>
          {/* KPI strip — institutional proportions */}
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'hsl(var(--border))' }}>
            <div className="grid grid-cols-2 lg:grid-cols-4" style={{ borderColor: 'hsl(var(--border))' }}>
              <KpiPanel
                label="Total Balance"
                value={`$${totalBalance.toLocaleString()}`}
                sub={`${activeAccounts.length} account${activeAccounts.length > 1 ? 's' : ''}`}
                trend={0}
              />
              <KpiPanel
                label="Total P&L"
                value={`${totalPnl >= 0 ? '+' : ''}$${Math.abs(totalPnl).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                sub={openPnl !== 0 ? `Open: ${openPnl >= 0 ? '+' : ''}$${Math.abs(openPnl).toFixed(2)}` : 'No open positions'}
                trendLabel={totalPnl >= 0 ? 'Profitable' : 'Loss'}
                trend={totalPnl}
              />
              <KpiPanel
                label="Avg Win Rate"
                value={`${avgWinRate.toFixed(1)}%`}
                sub={`across ${activeAccounts.length} account${activeAccounts.length > 1 ? 's' : ''}`}
                trend={avgWinRate - 50}
                trendLabel={avgWinRate >= 50 ? 'Above break-even' : 'Below break-even'}
              />
              <KpiPanel
                label="Peak Daily DD"
                value={`${worstDD.toFixed(2)}%`}
                sub={`of ${dailyDDLimit}% limit`}
                trend={-(worstDD)}
                trendLabel={worstDD > dailyDDLimit * 0.7 ? 'Approaching limit' : 'Within range'}
              />
              {/* dailyDDLimit and maxDDLimit read from primaryAccount.rule_snapshot */}
            </div>
          </div>

          {/* Main 2-col layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left — objectives + equity */}
            <div className="col-span-1 lg:col-span-2 space-y-6">

              {/* Trading Objectives */}
              <div className="rounded-xl border" style={{ borderColor: 'hsl(var(--border))' }}>
                <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
                  <div>
                    <div className="text-sm font-semibold text-foreground">Trading Objectives</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {primaryAccount?.phase?.replace('phase', 'Phase ')} — {primaryAccount?.challenge_type === 'two-step' ? 'Two-Step' : 'Instant'} — ${(primaryAccount?.account_size || 0).toLocaleString()}
                    </div>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded font-medium capitalize"
                    style={{ background: 'rgba(255,92,0,0.1)', color: '#FF5C00' }}>
                    {primaryAccount?.status}
                  </span>
                </div>
                <div className="px-6 py-2">
                  <ObjectiveRow
                    label="Profit Target"
                    current={primaryAccount?.profit_target_progress || 0}
                    target={profitTarget}
                    color="#FF5C00"
                    passed={(primaryAccount?.profit_target_progress || 0) >= profitTarget}
                    danger={false}
                  />
                  <ObjectiveRow
                    label="Daily Drawdown"
                    current={primaryAccount?.daily_drawdown_used || 0}
                    target={dailyDDLimit}
                    color="#10b981"
                    passed={(primaryAccount?.daily_drawdown_used || 0) < dailyDDLimit}
                    danger={(primaryAccount?.daily_drawdown_used || 0) > dailyDDLimit * 0.8}
                  />
                  <ObjectiveRow
                    label="Max Drawdown"
                    current={primaryAccount?.max_drawdown_used || 0}
                    target={maxDDLimit}
                    color="#10b981"
                    passed={(primaryAccount?.max_drawdown_used || 0) < maxDDLimit}
                    danger={(primaryAccount?.max_drawdown_used || 0) > maxDDLimit * 0.7}
                  />
                </div>
              </div>

              {/* Equity placeholder */}
              <div className="rounded-xl border" style={{ borderColor: 'hsl(var(--border))' }}>
                <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
                  <div>
                    <div className="text-sm font-semibold text-foreground">Portfolio Equity</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Aggregate balance across all accounts</div>
                  </div>
                  <span className={`text-lg font-semibold ${totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {totalPnl >= 0 ? '+' : ''}${totalPnl.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="px-6 py-6">
                  {totalPnl === 0 ? (
                    <div className="flex items-center justify-center h-20 rounded-lg border border-dashed"
                      style={{ borderColor: 'hsl(var(--border))' }}>
                      <span className="text-xs text-muted-foreground">No trading activity yet — open the terminal to start</span>
                    </div>
                  ) : (
                    <svg viewBox="0 0 600 80" className="w-full h-20">
                      <line x1="0" y1="40" x2="600" y2={totalPnl >= 0 ? '15' : '65'} stroke={totalPnl >= 0 ? '#10b981' : '#ef4444'} strokeWidth="1.5" strokeDasharray="0" />
                    </svg>
                  )}
                </div>
              </div>
            </div>

            {/* Right — account summary + quick nav */}
            <div className="space-y-6">

              {/* Account summary */}
              <div className="rounded-xl border" style={{ borderColor: 'hsl(var(--border))' }}>
                <div className="px-5 py-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
                  <div className="text-sm font-semibold text-foreground">Primary Account</div>
                </div>
                <div className="divide-y" style={{ borderColor: 'hsl(var(--border))' }}>
                  {(() => {
                    const bal = primaryAccount?.balance || primaryAccount?.account_size || 0;
                    const eq  = primaryAccount?.equity  || bal;
                    const floatingPnl = parseFloat((eq - bal).toFixed(2));
                    return [
                      { label: 'Account ID', value: primaryAccount?.account_id || '—' },
                      { label: 'Balance', value: `$${bal.toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
                      { label: 'Equity', value: `$${eq.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: eq >= bal ? 'text-emerald-400' : 'text-red-400' },
                      { label: 'Floating P&L', value: `${floatingPnl >= 0 ? '+' : ''}$${Math.abs(floatingPnl).toFixed(2)}`, color: floatingPnl > 0 ? 'text-emerald-400' : floatingPnl < 0 ? 'text-red-400' : 'text-muted-foreground' },
                      { label: 'Phase', value: primaryAccount?.phase?.replace('phase', 'Phase ') || '—' },
                      { label: 'Leverage', value: primaryAccount?.leverage || '1:100' },
                    ];
                  })().map(r => (
                    <div key={r.label} className="flex items-center justify-between px-5 py-3">
                      <span className="text-xs text-muted-foreground">{r.label}</span>
                      <span className={`text-xs font-medium ${r.color || 'text-foreground'}`}>{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick navigation */}
              <div className="rounded-xl border" style={{ borderColor: 'hsl(var(--border))' }}>
                <div className="px-5 py-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
                  <div className="text-sm font-semibold text-foreground">Quick Navigation</div>
                </div>
                <div className="divide-y" style={{ borderColor: 'hsl(var(--border))' }}>
                  {quickActions.map(a => (
                    <button key={a.label} onClick={() => onNavigate?.(a.page)}
                      className="w-full flex items-center justify-between px-5 py-3.5 text-left transition-colors hover:bg-white/[0.03] group">
                      <span className="text-sm text-foreground">{a.label}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                    </button>
                  ))}
                  <button onClick={onStartChallenge}
                    className="w-full flex items-center justify-between px-5 py-3.5 text-left transition-colors hover:bg-white/[0.03] group">
                    <span className="text-sm text-primary font-medium">Buy New Challenge</span>
                    <ChevronRight className="w-3.5 h-3.5 text-primary/40 group-hover:text-primary transition-colors" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}