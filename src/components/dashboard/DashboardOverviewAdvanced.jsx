import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Target, Activity, Award, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

function StatCard({ label, value, sub, icon: Icon }) {
  return (
    <div className="rounded-xl p-5" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'hsl(var(--muted))' }}>
          <Icon className="w-4 h-4 text-foreground" />
        </div>
      </div>
      <div className="text-2xl font-semibold text-foreground">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

export default function DashboardOverviewAdvanced({ user, onStartChallenge, onNavigate }) {
  const { data: accounts = [] } = useQuery({
    queryKey: ['challenge-accounts'],
    queryFn: () => base44.entities.ChallengeAccount.list('-created_date', 50),
    refetchInterval: 15000,
  });

  const { data: pendingOrders = [] } = useQuery({
    queryKey: ['my-pending-orders'],
    queryFn: () => base44.entities.Order.filter({ email: user?.email }),
    enabled: !!user?.email,
  });

  const activeAccounts = accounts.filter(a => a.status === 'active' || a.status === 'funded' || a.status === 'passed');
  const pendingActivation = pendingOrders.filter(o => o.payment_status === 'awaiting_confirmation' || o.payment_status === 'pending');

  const totalBalance = activeAccounts.reduce((s, a) => s + (a.balance || a.account_size || 0), 0);
  const totalPnl = activeAccounts.reduce((s, a) => s + (a.pnl || 0), 0);
  const avgWinRate = activeAccounts.length ? activeAccounts.reduce((s, a) => s + (a.win_rate || 0), 0) / activeAccounts.length : 0;
  const primaryAccount = activeAccounts[0];

  const hasAccounts = activeAccounts.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your accounts</p>
        </div>
        <button onClick={onStartChallenge}
          className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
          style={{ background: 'hsl(var(--primary))' }}>
          <Plus className="w-4 h-4 inline mr-1.5" />
          New Challenge
        </button>
      </div>

      {/* Pending Activation */}
      {pendingActivation.length > 0 && (
        <div className="rounded-xl p-4" style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
          <div className="text-sm font-medium text-foreground">{pendingActivation.length} order{pendingActivation.length > 1 ? 's' : ''} pending activation</div>
          <div className="text-xs text-muted-foreground mt-0.5">Activated within 24 hours</div>
        </div>
      )}

      {!hasAccounts && pendingActivation.length === 0 ? (
        <div className="rounded-xl p-12 text-center" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
          <div className="text-lg font-semibold text-foreground mb-2">No active accounts</div>
          <div className="text-sm text-muted-foreground mb-6">Start your first challenge to begin trading</div>
          <button onClick={onStartChallenge}
            className="px-6 py-2.5 text-sm font-medium text-white rounded-lg"
            style={{ background: 'hsl(var(--primary))' }}>
            Browse Challenges
          </button>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Balance" value={`$${(totalBalance || 0).toLocaleString()}`} sub={`${activeAccounts.length} account${activeAccounts.length !== 1 ? 's' : ''}`} icon={Award} />
            <StatCard label="Total P&L" value={`${totalPnl >= 0 ? '+' : ''}$${totalPnl.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} sub={totalPnl >= 0 ? 'Profit' : 'Loss'} icon={TrendingUp} />
            <StatCard label="Avg Win Rate" value={`${avgWinRate.toFixed(1)}%`} sub="Winning trades" icon={Target} />
            <StatCard label="Active Accounts" value={activeAccounts.length} sub="Trading" icon={Activity} />
          </div>

          {/* Primary Account Progress */}
          {primaryAccount && (
            <div className="rounded-xl p-6" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-sm font-medium text-foreground">Challenge Progress</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    ${(primaryAccount.account_size || 0).toLocaleString()} • {primaryAccount.challenge_type}
                  </div>
                </div>
                <div className="text-sm font-medium text-foreground capitalize">{primaryAccount.status}</div>
              </div>

              <div className="space-y-4">
                {[
                  { label: 'Profit Target', current: primaryAccount.profit_target_progress || 0, target: primaryAccount.challenge_type === 'instant' ? 8 : (primaryAccount.phase === 'phase2' ? 5 : 10) },
                  { label: 'Daily Drawdown', current: primaryAccount.daily_drawdown_used || 0, target: 5 },
                  { label: 'Max Drawdown', current: primaryAccount.max_drawdown_used || 0, target: 10 },
                ].map((p) => {
                  const pct = Math.min((p.current / p.target) * 100, 100);
                  return (
                    <div key={p.label}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-foreground">{p.label}</span>
                        <span className="text-xs font-medium text-muted-foreground">{p.current.toFixed(2)}% / {p.target}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: 'hsl(var(--primary))' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}