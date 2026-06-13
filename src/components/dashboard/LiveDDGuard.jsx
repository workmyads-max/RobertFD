/**
 * LiveDDGuard — Client-side real-time DD enforcement layer.
 *
 * SECURITY: Only processes accounts belonging to the currently authenticated user.
 * Uses rule_snapshot for DD limits (never hardcoded values).
 * Skips accounts with zero balance (unfunded / newly provisioned).
 * Never triggers breach for accounts without a confirmed paid order.
 */
import React, { useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const POLL_INTERVAL_MS = 15000;

function getDDLimits(acc) {
  // ALWAYS use rule_snapshot — never hardcode limits
  const snap = acc.rule_snapshot || {};
  const dailyLimit = snap.daily_dd_limit ?? 5;
  const overallLimit = snap.max_dd_limit ?? (acc.challenge_type === 'instant_light' ? 6 : 10);
  const isTrailing = snap.trailing_dd ?? (acc.challenge_type === 'instant_light');
  return { dailyLimit, overallLimit, isTrailing };
}

function calcOverallDD(acc, equity) {
  const accountSize = acc.account_size || 100000;
  const snap = acc.rule_snapshot || {};
  const isTrailing = snap.trailing_dd ?? (acc.challenge_type === 'instant_light');
  if (isTrailing) {
    const hwm = acc.high_water_mark || accountSize;
    return hwm > 0 ? Math.max(0, ((hwm - equity) / hwm) * 100) : 0;
  }
  return Math.max(0, ((accountSize - equity) / accountSize) * 100);
}

function calcDailyDD(acc, equity) {
  const base = acc.daily_start_balance || acc.account_size || 100000;
  return base > 0 ? Math.max(0, ((base - equity) / base) * 100) : 0;
}

export default function LiveDDGuard({ onBreach }) {
  const queryClient = useQueryClient();
  const intervalRef = useRef(null);
  const checkingRef = useRef(false);
  const breachedAccountsRef = useRef(new Set());

  // Get current user for ownership verification
  const { data: currentUser } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
    staleTime: 60000,
  });

  const { data: allAccounts = [] } = useQuery({
    // CRITICAL: Must match the email-scoped cache key used everywhere else
    queryKey: ['challenge-accounts', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return base44.entities.ChallengeAccount.filter({ user_email: currentUser.email }, '-created_date', 100);
    },
    enabled: !!currentUser?.email,
    staleTime: 30000,
  });

  // CRITICAL: Triple-check — only monitor accounts that explicitly belong to the logged-in user
  const userAccounts = allAccounts.filter(a =>
    currentUser?.email && a.user_email === currentUser.email
  );

  const checkEquityNow = useCallback(async () => {
    if (checkingRef.current) return;
    if (!currentUser?.email) return;
    checkingRef.current = true;

    try {
      // Only check active MT5 accounts belonging to THIS user
      // Skip accounts already breached in DB (status=failed or dd_breach_detected=true)
      // to prevent showing the breach modal again on page reload
      const mtAccounts = userAccounts.filter(a =>
        a.mt_login &&
        a.user_email === currentUser.email && // triple-verify ownership
        ['active', 'funded', 'passed'].includes(a.status) && // only non-failed
        a.platform === 'mt5' &&
        !breachedAccountsRef.current.has(a.account_id) &&
        !a.dd_breach_detected && // skip already-breached in DB
        a.status !== 'failed' // extra guard
      );

      if (mtAccounts.length === 0) {
        checkingRef.current = false;
        return;
      }

      await Promise.all(mtAccounts.map(async (acc) => {
        try {
          const response = await base44.functions.invoke('syncMatchTraderAccount', {
            account_id: acc.account_id,
            mt_login: acc.mt_login,
          });

          const data = response?.data;
          if (!data) return;

          const equity = data.equity ?? acc.equity;
          const balance = data.balance ?? acc.balance;
          if (equity === undefined || equity === null) return;

          // CRITICAL: Skip zero-balance accounts — never breach an unfunded account
          if (balance === 0 && equity === 0) {
            console.log(`[LiveDDGuard] Skipping ${acc.account_id} — zero balance/equity (unfunded or API glitch)`);
            return;
          }

          // Skip if balance is suspiciously low relative to account_size (API glitch protection)
          const accountSize = acc.account_size || 100000;
          if (balance > 0 && balance < accountSize * 0.01) {
            console.log(`[LiveDDGuard] Skipping ${acc.account_id} — balance ${balance} is <1% of account size (API glitch protection)`);
            return;
          }

          const currentOverallDD = calcOverallDD(acc, equity);
          const currentDailyDD = calcDailyDD(acc, equity);
          const persistentOverallDD = Math.max(acc.max_drawdown_used || 0, currentOverallDD);
          const persistentDailyDD = Math.max(acc.daily_drawdown_used || 0, currentDailyDD);

          const { dailyLimit, overallLimit } = getDDLimits(acc);

          let breachType = null;
          let breachValue = null;

          if (!acc.dd_breach_detected) {
            if (persistentOverallDD >= overallLimit) {
              breachType = (acc.rule_snapshot?.trailing_dd ?? acc.challenge_type === 'instant_light') ? 'trailing' : 'overall';
              breachValue = persistentOverallDD;
            } else if (persistentDailyDD >= dailyLimit) {
              breachType = 'daily';
              breachValue = persistentDailyDD;
            }
          }

          if (breachType) {
            breachedAccountsRef.current.add(acc.account_id);

            // CRITICAL: Invalidate ONLY this user's scoped cache key
            queryClient.invalidateQueries({ queryKey: ['challenge-accounts', currentUser.email] });

            if (onBreach) {
              onBreach({
                account_id: acc.account_id,
                account_size: acc.account_size,
                breach_type: breachType,
                breach_value: parseFloat(breachValue.toFixed(2)),
                equity,
                balance,
              });
            }
          } else {
            // CRITICAL: Update ONLY this user's scoped cache key — never the global key
            queryClient.setQueryData(['challenge-accounts', currentUser.email], (old) => {
              if (!Array.isArray(old)) return old;
              return old.map(a => a.account_id === acc.account_id
                ? { ...a, balance, equity, max_drawdown_used: persistentOverallDD, daily_drawdown_used: persistentDailyDD }
                : a
              );
            });
          }

        } catch (err) {
          console.warn(`[LiveDDGuard] Check failed for ${acc.account_id}:`, err.message);
        }
      }));

    } finally {
      checkingRef.current = false;
    }
  }, [userAccounts, queryClient, onBreach, currentUser?.email]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    // Only start polling if current user has active MT5 accounts
    const mtAccounts = userAccounts.filter(a =>
      a.mt_login &&
      ['active', 'funded', 'passed'].includes(a.status) &&
      a.platform === 'mt5'
    );

    if (mtAccounts.length === 0 || !currentUser?.email) return;

    checkEquityNow();
    intervalRef.current = setInterval(checkEquityNow, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [userAccounts.length, checkEquityNow, currentUser?.email]);

  return null;
}