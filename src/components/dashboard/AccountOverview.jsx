import React, { useState, useEffect } from 'react';
import { BarChart3, Plus, Info } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCustomAuth } from '@/lib/CustomAuthContext';
import CredentialsModal from './CredentialsModal';
import AccountSelector from '../overview/AccountSelector';
import ChallengeHeaderCard from '../overview/ChallengeHeaderCard';
import LiveTradeFeed from '../overview/LiveTradeFeed';
import CurrentResultsChart from '../overview/CurrentResultsChart';
import ChallengeDetailSidebar from '../overview/ChallengeDetailSidebar';
import PerformanceMetrics from '../overview/PerformanceMetrics';
import ProgressTimeline from '../overview/ProgressTimeline';
import { StatisticsPanel, DailySummaryPanel } from '../overview/StatisticsDailySummary';
import TradingStatsObjectives from '../overview/TradingStatsObjectives';
import AccountHistorySection from '../overview/AccountHistorySection';

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

      {/* Account Selector */}
      {activeAccounts.length > 0 && (
        <AccountSelector
          accounts={activeAccounts}
          selectedAccount={account}
          onSelect={setSelectedAccount}
        />
      )}

      {/* Challenge Header Card */}
      <ChallengeHeaderCard
        account={account}
        liveEquity={liveEquity}
        liveUnrealizedPnl={liveUnrealizedPnl}
        setShowCredentials={setShowCredentials}
        onNavigate={onNavigate}
      />

      {/* Live Trade Feed */}
      <LiveTradeFeed
        account={account}
        trades={tradeRecords}
        onRefresh={() => queryClient.invalidateQueries({ queryKey: ['trade-records-overview', account?.account_id] })}
      />

      {/* Current Results + Challenge Info */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <CurrentResultsChart account={account} trades={tradeRecords} />
        </div>
        <ChallengeDetailSidebar account={account} />
      </div>

      {/* Performance + Timeline */}
      <div className="grid lg:grid-cols-2 gap-4">
        <PerformanceMetrics account={account} trades={tradeRecords} />
        <ProgressTimeline account={account} />
      </div>

      {/* Statistics + Daily Summary */}
      <div className="grid md:grid-cols-2 gap-4">
        <StatisticsPanel account={account} tradeRecords={tradeRecords} />
        <DailySummaryPanel tradeRecords={tradeRecords} />
      </div>

      {/* Trading Stats & Objectives */}
      <TradingStatsObjectives account={account} tradeRecords={tradeRecords} />

      {/* Account History */}
      <AccountHistorySection
        accounts={accounts}
        onSelectAccount={(acc) => {
          setSelectedAccount(acc);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Disclaimer */}
      <div className="rounded-2xl px-5 py-3.5 flex items-start gap-3"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <Info className="w-4 h-4 text-white/20 shrink-0 mt-0.5" />
        <p className="text-[11px] text-white/30 leading-relaxed">
          Account Metrics values are informative only. Real-time trading data can be verified directly in the MT5 platform.
        </p>
      </div>

      {/* Credentials Modal */}
      {showCredentials && (
        <CredentialsModal
          account={account}
          onClose={() => setShowCredentials(false)}
        />
      )}
    </div>
  );
}