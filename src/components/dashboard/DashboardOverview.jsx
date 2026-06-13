import React, { useEffect, useState } from 'react';
import { Plus, Clock, Zap } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useSyncOnLogin } from '@/hooks/useSyncOnLogin';
import ThreePathsToFunded from './ThreePathsToFunded';



export default function DashboardOverview({ user, onStartChallenge, onNavigate }) {
  const location = useUserLocation();
  const { syncing, lastSync, syncError } = useSyncOnLogin();
  const queryClient = useQueryClient();
  const [lastRealtime, setLastRealtime] = useState(null);

  const { data: accounts = [] } = useQuery({
    queryKey: ['challenge-accounts'],
    // CRITICAL: Filter by user email — never list all accounts globally
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.ChallengeAccount.filter({ user_email: user.email }, '-created_date', 100);
    },
    enabled: !!user?.email,
    refetchInterval: 15 * 1000,
    staleTime: 10 * 1000,
  });

  // Real-time subscription — only update records belonging to this user
  useEffect(() => {
    if (!user?.email) return;
    const unsub = base44.entities.ChallengeAccount.subscribe((event) => {
      if (event.type === 'update' || event.type === 'create') {
        // CRITICAL: Only accept events for accounts belonging to the current user
        if (event.data?.user_email && event.data.user_email !== user.email) return;
        queryClient.setQueryData(['challenge-accounts'], (old = []) => {
          if (event.type === 'create') return [event.data, ...old];
          return old.map(a => a.id === event.id ? event.data : a);
        });
        setLastRealtime(new Date());
      }
    });
    return unsub;
  }, [queryClient, user?.email]);

  const { data: pendingOrders = [] } = useQuery({
    queryKey: ['my-pending-orders'],
    queryFn: () => base44.entities.Order.filter({ email: user?.email }),
    enabled: !!user?.email,
    staleTime: 30 * 1000,
  });

  const activeAccounts = accounts.filter(a => a.status === 'active' || a.status === 'funded' || a.status === 'passed');
  const pendingActivation = pendingOrders.filter(o => o.payment_status === 'awaiting_confirmation' || o.payment_status === 'pending');

  const hasAccounts = activeAccounts.length > 0;

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
          {/* Active Account area placeholder */}
          <div className="rounded-xl border py-12 text-center" style={{ borderColor: 'hsl(var(--border))' }}>
            <div className="text-sm text-muted-foreground">Active Account Overview</div>
          </div>

          {/* Three Paths to Funded Trading */}
          <ThreePathsToFunded onNavigate={onNavigate} />
        </>
      )}
    </div>
  );
}