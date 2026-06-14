/**
 * LiveDDGuard — Realtime MT5 equity monitoring display layer.
 *
 * ARCHITECTURE (server-side enforcement):
 *   - Polls syncMatchTraderAccount every 5s (read-only from frontend perspective)
 *   - syncMatchTraderAccount performs ALL breach detection and enforcement server-side:
 *       → Updates ChallengeAccount (status=failed, breach flags)
 *       → Creates RiskFlag + Notification
 *       → Disables MT5 account broker-side
 *   - Frontend NEVER makes the breach decision — only responds to server result
 *   - On breach response: invalidates cache + fires onBreach for modal display
 *   - On no-breach: updates local cache with live equity for dashboard display
 *
 * Scope: display and cache management only.
 * Enforcement: syncMatchTraderAccount (backend) exclusively.
 * Statistics: scheduledMTSync (backend) exclusively.
 */
import React, { useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const POLL_INTERVAL_MS = 5000; // 5 seconds

export default function LiveDDGuard({ onBreach }) {
  const queryClient   = useQueryClient();
  const intervalRef   = useRef(null);
  const checkingRef   = useRef(false);
  const breachedRef   = useRef(new Set()); // accounts already breached this session
  const inFlightRef   = useRef(new Set()); // accounts with an in-flight enforcement call

  const { data: currentUser } = useQuery({
    queryKey: ['me'],
    queryFn:  () => base44.auth.me(),
    staleTime: 60000,
  });

  const { data: allAccounts = [] } = useQuery({
    queryKey: ['challenge-accounts', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return base44.entities.ChallengeAccount.filter({ user_email: currentUser.email }, '-created_date', 100);
    },
    enabled: !!currentUser?.email,
    staleTime: 30000,
  });

  // Only monitor active, non-breached, MT5 accounts belonging to this user
  const monitorableAccounts = allAccounts.filter(a =>
    currentUser?.email &&
    a.user_email === currentUser.email &&
    a.mt_login &&
    ['active', 'funded', 'passed'].includes(a.status) &&
    a.platform === 'mt5' &&
    !a.dd_breach_detected &&
    a.status !== 'failed' &&
    !breachedRef.current.has(a.account_id)
  );

  const checkEquityNow = useCallback(async () => {
    if (checkingRef.current) return;
    if (!currentUser?.email || monitorableAccounts.length === 0) return;
    checkingRef.current = true;

    try {
      await Promise.all(monitorableAccounts.map(async (acc) => {
        if (inFlightRef.current.has(acc.account_id)) return;

        try {
          inFlightRef.current.add(acc.account_id);

          const response = await base44.functions.invoke('syncMatchTraderAccount', {
            account_id: acc.account_id,
            mt_login:   acc.mt_login,
          });

          const data = response?.data;
          if (!data?.success) return;

          if (data.breach_detected) {
            // ── BREACH: server already wrote all enforcement atomically ──────
            // Mark locally so we stop polling this account
            breachedRef.current.add(acc.account_id);

            // Invalidate cache so all dashboard components reflect failed status
            queryClient.invalidateQueries({ queryKey: ['challenge-accounts', currentUser.email] });

            // Fire modal — data already persisted by server
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
            // ── NO BREACH: update local cache with live equity for display ───
            queryClient.setQueryData(['challenge-accounts', currentUser.email], (old) => {
              if (!Array.isArray(old)) return old;
              return old.map(a => a.account_id === acc.account_id
                ? { ...a, balance: data.balance, equity: data.equity }
                : a
              );
            });
          }

        } catch (err) {
          // Non-fatal — log silently and continue polling
          console.warn(`[LiveDDGuard] Poll failed for ${acc.account_id}:`, err.message);
        } finally {
          inFlightRef.current.delete(acc.account_id);
        }
      }));
    } finally {
      checkingRef.current = false;
    }
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