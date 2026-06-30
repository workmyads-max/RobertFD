import { useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { filterRealTrades } from './useAccountTrades';

/**
 * useAccountTradeData - CENTRALIZED trade-data loader for Account Overview.
 *
 * This is the SINGLE source of truth for ALL trade-derived sections:
 *   - Closed Trades section
 *   - Live Trade Feed (closed toggle, DB-backed)
 *   - Daily Summary
 *   - Statistics
 *   - Performance Metrics
 *   - useAccountStats
 *
 * Guarantees:
 *   1. Waits until account.account_id is resolved before fetching.
 *   2. Re-fetches automatically when the selected account changes.
 *   3. NEVER blanks already-loaded data on a transient error or empty refetch -
 *      keeps the last good result (keepPreviousData). Empty state only shows
 *      when the account genuinely has zero matching records.
 *   4. Excludes MT5 deposit/balance pseudo-records uniformly across ALL derived data.
 *   5. Works identically for every account status - active, passed, under-review, funded.
 *   6. mt_login-scoped: the backend function filters by the account's CURRENT mt_login,
 *      ensuring per-MT5-account data isolation (Phase 1 trades never leak into Phase 2).
 *
 * Uses the getAccountTradeRecords backend function (service role, case-insensitive
 * ownership, mt_login-scoped) to bypass RLS exact-match issues and ensure
 * per-MT5-account data isolation.
 *
 * @param {object|null} account - The selected ChallengeAccount object
 * @param {object} options - { refetchIntervalMs: 10000 }
 * @returns {{ allTrades, closedTrades, openTrades, isLoading, refetch }}
 */
export function useAccountTradeData(account, { refetchIntervalMs = 10000 } = {}) {
  const accountId = account?.account_id || null;
  const mtLogin = account?.mt_login || null;

  const { data: rawTrades = [], isLoading, refetch } = useQuery({
    // Include mt_login in the query key so switching between accounts with
    // different mt_logins properly refetches (no stale cache leakage).
    queryKey: ['account-trade-data', accountId, mtLogin],
    queryFn: async () => {
      if (!accountId) return [];
      const res = await base44.functions.invoke('getAccountTradeRecords', { account_id: accountId });
      return Array.isArray(res?.data?.trades) ? res.data.trades : [];
    },
    enabled: !!accountId,
    refetchInterval: refetchIntervalMs,
    staleTime: 5000,
    placeholderData: keepPreviousData, // NEVER blank on transient refetch
  });

  // Exclude MT5 deposit/balance pseudo-records uniformly
  const allTrades = useMemo(
    () => filterRealTrades(rawTrades, account),
    [rawTrades, account]
  );

  // Derive closed trades - sorted newest-first by close_time
  const closedTrades = useMemo(
    () => allTrades
      .filter(t => t.status === 'closed')
      .sort((a, b) => new Date(b.close_time || 0).getTime() - new Date(a.close_time || 0).getTime()),
    [allTrades]
  );

  // Derive open trades (DB-backed; supplemented by live MT5 positions in the UI)
  const openTrades = useMemo(
    () => allTrades.filter(t => t.status === 'open' || t.status === 'pending'),
    [allTrades]
  );

  return { allTrades, closedTrades, openTrades, isLoading, refetch };
}