/**
 * LiveDDGuard — Realtime MT5 equity monitoring display layer.
 *
 * ARCHITECTURE (server-side enforcement):
 *   - Polls mt5RealtimeSync every 1s for near-instant breach detection
 *   - mt5RealtimeSync performs ALL breach detection and enforcement server-side:
 *       → Updates ChallengeAccount (status=failed, breach flags)
 *       → Creates RiskFlag + Notification
 *       → Disables MT5 account broker-side
 *   - Frontend NEVER makes the breach decision — only responds to server result
 *   - On breach response: invalidates cache + fires onBreach for modal display
 *   - On no-breach: updates local cache with live equity for dashboard display
 *
 * Scope: display and cache management only.
 * Enforcement: mt5RealtimeSync (backend) exclusively.
 * Statistics: scheduledMTSync (backend) exclusively.
 *
 * NOTE: 1s polling with per-account in-flight guard ensures no overlapping calls.
 * The global checkingRef lock is intentionally removed so accounts are checked
 * independently — a slow response on one account does NOT delay others.
 */
import React, { useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const POLL_INTERVAL_MS = 1000; // 1 second — near-instant floating loss breach detection

export default function LiveDDGuard({ onBreach }) {
  const queryClient = useQueryClient();
  const intervalRef = useRef(null);
  const breachedRef = useRef(new Set()); // accounts already breached this session
  const inFlightRef = useRef(new Set()); // per-account in-flight guard (prevents overlap)

  const { data: currentUser } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
    staleTime: 60000,
  });

  const { data: allAccounts = [] } = useQuery({
    queryKey: ['challenge-accounts', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      // Use service-role backend function with case-insensitive email matching
      const res = await base44.functions.invoke('getUserAccounts', {});
      return res?.data?.accounts || [];
    },
    enabled: !!currentUser?.email,
    staleTime: 30000,
    placeholderData: (prev) => prev ?? [],
  });

  const normalizedEmail = (currentUser?.email || '').toLowerCase().trim();

  // Only monitor active, non-breached, MT5 accounts belonging to this user
  // NOTE: platform field may be 'mt5', 'xtrading', or other legacy values — all use MT5
  const monitorableAccounts = allAccounts.filter(a =>
    normalizedEmail &&
    (a.user_email || '').toLowerCase().trim() === normalizedEmail &&
    a.mt_login && // must have MT5 login
    ['active', 'funded', 'passed'].includes(a.status) &&
    !a.dd_breach_detected &&
    a.status !== 'failed' &&
    !breachedRef.current.has(a.account_id)
  );

  const checkEquityNow = useCallback(() => {
    if (!currentUser?.email || monitorableAccounts.length === 0) return;

    // Per-account independent checks — slow response on one never blocks others
    monitorableAccounts.forEach(async (acc) => {
      if (inFlightRef.current.has(acc.account_id)) return; // skip if already in-flight

      inFlightRef.current.add(acc.account_id);
      try {
        const response = await base44.functions.invoke('mt5RealtimeSync', {
          account_id: acc.account_id,
          mt_login: acc.mt_login,
        });

        const data = response?.data;
        if (!data?.success) return;

        if (data.breach_detected) {
          // ── BREACH: server already wrote all enforcement atomically ──────
          breachedRef.current.add(acc.account_id);
          queryClient.invalidateQueries({ queryKey: ['challenge-accounts', currentUser.email] });

          if (onBreach && !data.already_breached) {
            onBreach({
              account_id:   acc.account_id,
              account_size: acc.account_size,
              breach_type:  data.breach_type,
              breach_value: data.breach_value,
              equity:       data.equity,
              balance:      data.balance,
            });
          }

        } else if (!data.skipped) {
          // ── NO BREACH: update local cache with live equity + live DD values for display ───
          queryClient.setQueryData(['challenge-accounts', currentUser.email], (old) => {
            if (!Array.isArray(old)) return old;
            return old.map(a => {
              if (a.account_id !== acc.account_id) return a;
              const updates = { ...a, balance: data.balance, equity: data.equity };
              // Update live DD values so Trading Objectives reflect real-time data
              if (data.live_daily_dd != null) updates.daily_drawdown_used = data.live_daily_dd;
              if (data.live_overall_dd != null) updates.max_drawdown_used = Math.max(a.max_drawdown_used || 0, data.live_overall_dd);
              if (data.profit_target_progress != null) updates.profit_target_progress = data.profit_target_progress;
              return updates;
            });
          });
        }

      } catch (err) {
        console.warn(`[LiveDDGuard] Poll failed for ${acc.account_id}:`, err.message);
      } finally {
        inFlightRef.current.delete(acc.account_id);
      }
    });
  }, [monitorableAccounts, queryClient, onBreach, currentUser?.email]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (monitorableAccounts.length === 0 || !currentUser?.email) return;

    checkEquityNow(); // immediate first check
    intervalRef.current = setInterval(checkEquityNow, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [monitorableAccounts.length, checkEquityNow, currentUser?.email]);

  return null;
}