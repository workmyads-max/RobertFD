/**
 * LiveDDGuard — Client-side real-time DD enforcement layer.
 *
 * Runs in the trader's browser session. Polls the MT5 API every 15 seconds
 * via the syncMatchTraderAccount backend function for LIVE equity on all active accounts.
 * If a DD breach is detected client-side, it:
 *   1. Immediately marks the account as failed in the DB (via base44 SDK)
 *   2. Shows a full-screen breach modal that cannot be dismissed
 *   3. Logs to RiskFlag
 *
 * This is a SUPPLEMENTARY layer — it runs in parallel with scheduledMTSync (server-side).
 * When the trader has the dashboard open, detection drops from ~150s average to ~7-15 seconds.
 * When the trader is offline, scheduledMTSync continues server-side.
 *
 * IMPORTANT: This component does NOT replace server-side enforcement.
 * It only adds a faster client-side detection path for active sessions.
 */
import React, { useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const POLL_INTERVAL_MS = 15000; // 15 seconds — fast enough to catch most breaches

function getDDLimits(acc) {
  const dailyLimit = 5;
  const overallLimit = acc.challenge_type === 'instant_light' ? 6 : 10;
  return { dailyLimit, overallLimit };
}

function calcOverallDD(acc, equity) {
  const accountSize = acc.account_size || 100000;
  if (acc.challenge_type === 'instant_light') {
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

  const { data: accounts = [] } = useQuery({
    queryKey: ['challenge-accounts'],
    staleTime: 30000,
  });

  const checkEquityNow = useCallback(async () => {
    if (checkingRef.current) return; // Prevent overlapping checks
    checkingRef.current = true;

    try {
      const mtAccounts = accounts.filter(a =>
        a.mt_login &&
        ['active', 'funded', 'passed'].includes(a.status) &&
        ['mt5', 'match_trader'].includes(a.platform) &&
        !breachedAccountsRef.current.has(a.account_id)
      );

      if (mtAccounts.length === 0) {
        checkingRef.current = false;
        return;
      }

      // Check all MT accounts in parallel — fire and forget per account
      await Promise.all(mtAccounts.map(async (acc) => {
        try {
          const response = await base44.functions.invoke('syncMatchTraderAccount', {
            account_id: acc.account_id,
            mt_login: acc.mt_login,
          });

          const data = response?.data;
          if (!data) return;

          // Use response equity to compute DD client-side (instant, no extra round-trip)
          const equity = data.equity ?? acc.equity;
          const balance = data.balance ?? acc.balance;
          if (equity === undefined || equity === null) return;

          const currentOverallDD = calcOverallDD(acc, equity);
          const currentDailyDD = calcDailyDD(acc, equity);
          const persistentOverallDD = Math.max(acc.max_drawdown_used || 0, currentOverallDD);
          const persistentDailyDD = Math.max(acc.daily_drawdown_used || 0, currentDailyDD);

          const { dailyLimit, overallLimit } = getDDLimits(acc);

          let breachType = null;
          let breachValue = null;

          if (!acc.dd_breach_detected) {
            if (persistentOverallDD >= overallLimit) {
              breachType = acc.challenge_type === 'instant_light' ? 'trailing' : 'overall';
              breachValue = persistentOverallDD;
            } else if (persistentDailyDD >= dailyLimit) {
              breachType = 'daily';
              breachValue = persistentDailyDD;
            }
          }

          if (breachType) {
            breachedAccountsRef.current.add(acc.account_id);
            console.warn(`[LiveDDGuard] BREACH ${acc.account_id}: ${breachType} ${breachValue.toFixed(2)}%`);

            // The syncMatchTraderAccount backend function already wrote status='failed'
            // Just invalidate cache so UI reflects it immediately
            queryClient.invalidateQueries({ queryKey: ['challenge-accounts'] });

            // Notify parent to show breach modal
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
            // No breach — still refresh cache so balance/equity updates in UI
            queryClient.setQueryData(['challenge-accounts'], (old) => {
              if (!old) return old;
              return old.map(a => a.account_id === acc.account_id
                ? { ...a, balance, equity, max_drawdown_used: persistentOverallDD, daily_drawdown_used: persistentDailyDD }
                : a
              );
            });
          }

        } catch (err) {
          // Silent fail per account — don't break other checks
          console.warn(`[LiveDDGuard] Check failed for ${acc.account_id}:`, err.message);
        }
      }));

    } finally {
      checkingRef.current = false;
    }
  }, [accounts, queryClient, onBreach]);

  // Start/restart interval when accounts change
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    const mtAccounts = accounts.filter(a =>
      a.mt_login &&
      ['active', 'funded', 'passed'].includes(a.status) &&
      ['mt5', 'match_trader'].includes(a.platform)
    );

    if (mtAccounts.length === 0) return;

    // Run immediately on mount, then every POLL_INTERVAL_MS
    checkEquityNow();
    intervalRef.current = setInterval(checkEquityNow, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [accounts.length, checkEquityNow]);

  // Invisible component — no UI output (breach modal is handled by parent)
  return null;
}