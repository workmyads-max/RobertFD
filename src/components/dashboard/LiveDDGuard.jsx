/**
 * LiveDDGuard — FTMO-grade realtime DD enforcement layer.
 *
 * Architecture:
 *   - Polls syncMatchTraderAccount every 5s for live MT5 equity (read-only)
 *   - On breach: calls realtimeBreachEnforce (backend writes breach + disables MT5 + RiskFlag + Notification)
 *   - Never writes TradeRecords, statistics, or account fields directly
 *   - Uses rule_snapshot for all DD limits (never hardcoded)
 *   - Skips zero-balance, unfunded, and already-breached accounts
 *
 * Scope: realtime enforcement only.
 * Statistics updates: scheduledMTSync only (every 5 min).
 */
import React, { useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const POLL_INTERVAL_MS = 5000; // 5 seconds — realtime enforcement

export default function LiveDDGuard({ onBreach }) {
  const queryClient = useQueryClient();
  const intervalRef = useRef(null);
  const checkingRef = useRef(false);
  const breachedAccountsRef = useRef(new Set());
  const enforcingRef = useRef(new Set()); // prevent duplicate breach calls in-flight

  const { data: currentUser } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
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

  // Only monitor accounts belonging to this user that are active and not already breached
  const monitorableAccounts = allAccounts.filter(a =>
    currentUser?.email &&
    a.user_email === currentUser.email &&
    a.mt_login &&
    ['active', 'funded', 'passed'].includes(a.status) &&
    a.platform === 'mt5' &&
    !a.dd_breach_detected &&
    a.status !== 'failed' &&
    !breachedAccountsRef.current.has(a.account_id)
  );

  const getDDLimits = useCallback((acc) => {
    const snap = acc.rule_snapshot || {};
    const dailyLimit   = snap.daily_dd_limit ?? 5;
    const overallLimit = snap.max_dd_limit ?? (acc.challenge_type === 'instant_light' ? 6 : 10);
    return { dailyLimit, overallLimit };
  }, []);

  const checkEquityNow = useCallback(async () => {
    if (checkingRef.current) return;
    if (!currentUser?.email || monitorableAccounts.length === 0) return;
    checkingRef.current = true;

    try {
      await Promise.all(monitorableAccounts.map(async (acc) => {
        if (enforcingRef.current.has(acc.account_id)) return; // breach call already in-flight

        try {
          const response = await base44.functions.invoke('syncMatchTraderAccount', {
            account_id: acc.account_id,
            mt_login: acc.mt_login,
          });

          const data = response?.data;
          if (!data || !data.success) return;

          const { balance, equity, live_overall_dd, live_daily_dd } = data;

          // ── GLITCH PROTECTION ──────────────────────────────────────────────
          if (!equity || !balance) return;
          if (balance === 0 && equity === 0) return; // unfunded / API glitch
          const accountSize = acc.account_size || 100000;
          if (balance > 0 && balance < accountSize * 0.01) return; // API glitch protection

          // ── USE PERSISTENT DD FROM DB + LIVE VALUE (take the max) ─────────
          // persistent values from DB ensure DD never decreases between syncs
          const persistentOverallDD = Math.max(acc.max_drawdown_used || 0, live_overall_dd || 0);
          const persistentDailyDD   = Math.max(acc.daily_drawdown_used || 0, live_daily_dd || 0);

          const { dailyLimit, overallLimit } = getDDLimits(acc);

          // ── BREACH DETECTION ──────────────────────────────────────────────
          let breachType = null;
          let breachValue = null;

          if (persistentOverallDD >= overallLimit) {
            breachType  = data.is_trailing ? 'trailing' : 'overall';
            breachValue = persistentOverallDD;
          } else if (persistentDailyDD >= dailyLimit) {
            breachType  = 'daily';
            breachValue = persistentDailyDD;
          }

          if (breachType) {
            // Guard: only enforce once per account per session
            breachedAccountsRef.current.add(acc.account_id);
            enforcingRef.current.add(acc.account_id);

            // ── BACKEND ENFORCEMENT — single authoritative write ───────────
            // realtimeBreachEnforce writes: status=failed, breach flags, RiskFlag, Notification, MT5 disable
            base44.functions.invoke('realtimeBreachEnforce', {
              account_id:   acc.account_id,
              breach_type:  breachType,
              breach_value: parseFloat(breachValue.toFixed(2)),
              equity,
              balance,
            }).then(() => {
              // Invalidate cache so dashboard reflects failed status immediately
              queryClient.invalidateQueries({ queryKey: ['challenge-accounts', currentUser.email] });
            }).catch((err) => {
              console.warn(`[LiveDDGuard] realtimeBreachEnforce failed for ${acc.account_id}:`, err.message);
              // Still show the modal locally even if backend call failed temporarily
            }).finally(() => {
              enforcingRef.current.delete(acc.account_id);
            });

            // ── SHOW BREACH MODAL IMMEDIATELY — don't wait for backend ─────
            if (onBreach) {
              onBreach({
                account_id:   acc.account_id,
                account_size: acc.account_size,
                breach_type:  breachType,
                breach_value: parseFloat(breachValue.toFixed(2)),
                equity,
                balance,
              });
            }

          } else {
            // No breach — update local cache with live equity for display only
            // (balance/equity for UI display; persistent DD values are managed by scheduledMTSync)
            queryClient.setQueryData(['challenge-accounts', currentUser.email], (old) => {
              if (!Array.isArray(old)) return old;
              return old.map(a => a.account_id === acc.account_id
                ? { ...a, balance, equity }
                : a
              );
            });
          }

        } catch (err) {
          // Non-fatal: log and continue with other accounts
          console.warn(`[LiveDDGuard] Equity check failed for ${acc.account_id}:`, err.message);
        }
      }));

    } finally {
      checkingRef.current = false;
    }
  }, [monitorableAccounts, queryClient, onBreach, currentUser?.email, getDDLimits]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (monitorableAccounts.length === 0 || !currentUser?.email) return;

    // Initial check immediately, then every 5s
    checkEquityNow();
    intervalRef.current = setInterval(checkEquityNow, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [monitorableAccounts.length, checkEquityNow, currentUser?.email]);

  return null;
}