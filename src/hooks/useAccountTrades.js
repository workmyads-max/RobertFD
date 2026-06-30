import { useEffect, useRef, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * isPseudoRecord - Detect MT5 balance/deposit initialization pseudo-records.
 *
 * These are NOT real trades - they're balance-credit rows the MT5 bridge writes
 * on account provisioning. They pollute Closed Trades, win-rate, total trades,
 * and P&L aggregations. Characteristics:
 *   - symbol is empty ("") or whitespace-only
 *   - pnl equals (or very near) the account starting balance
 *   - open_time === close_time (zero-duration)
 *   - type is often empty/"DEPOSIT"/"BALANCE"
 *
 * Excluding them everywhere gives accurate stats for every account & phase.
 */
export function isPseudoRecord(trade, account) {
  if (!trade) return true;
  const sym = (trade.symbol || '').toString().trim();
  if (!sym) return true;
  const type = (trade.type || '').toString().toUpperCase();
  if (type === 'DEPOSIT' || type === 'BALANCE' || type === 'CREDIT') return true;
  // Zero-duration + a balance-sized pnl is a deposit pseudo-record
  const ot = trade.open_time;
  const ct = trade.close_time;
  if (ot && ct && String(ot) === String(ct)) {
    const size = account?.account_size || 0;
    const pnl = Number(trade.pnl) || 0;
    if (size > 0 && Math.abs(pnl - size) < 1) return true;
    // Also flag any zero-duration row with an empty symbol (defensive)
    if (!sym) return true;
  }
  return false;
}

/**
 * filterRealTrades - keep only genuine closed trades for an account.
 * Memo-friendly: returns a fresh array excluding pseudo-records.
 */
export function filterRealTrades(trades, account) {
  if (!Array.isArray(trades)) return [];
  return trades.filter(t => !isPseudoRecord(t, account));
}

/**
 * useAccountTrades - resilient loader for an account's closed trades.
 *
 * Guarantees:
 *   1. Waits until account_id is available before fetching.
 *   2. Re-fetches automatically when account_id changes (phase progression,
 *      account switch).
 *   3. NEVER blanks already-loaded data on a transient error or empty refetch -
 *      it keeps the last good result and retries. Empty state only shows when
 *      the account genuinely has zero real records.
 *   4. Excludes MT5 deposit pseudo-records from returned trades.
 *   5. Loading state always resolves (never hangs forever).
 */
export function useAccountTrades(account, { intervalMs = 60000, pageSize = 500 } = {}) {
  const accountId = account?.account_id || null;
  const [trades, setTrades] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const lastGoodRef = useRef([]);      // survives transient empties/errors
  const loadedForRef = useRef(null);   // which account_id we last loaded for
  const inFlightRef = useRef(false);
  const cancelledRef = useRef(false);

  const fetchNow = useCallback(async () => {
    if (!accountId || inFlightRef.current || cancelledRef.current) return;
    inFlightRef.current = true;
    // Only show the full-page spinner on the very first load for this account
    const firstLoad = loadedForRef.current !== accountId;
    if (firstLoad) setIsLoading(true);
    try {
      const res = await base44.functions.invoke('getClosedTrades', {
        account_id: accountId,
        page_size: pageSize,
      });
      if (cancelledRef.current) return;
      const raw = Array.isArray(res?.data?.trades) ? res.data.trades : [];
      const real = filterRealTrades(raw, account);
      // Reject empty results that would wipe known-good data: only accept an
      // empty result if we've never loaded data for this account before.
      if (real.length > 0 || loadedForRef.current !== accountId) {
        setTrades(real);
        lastGoodRef.current = real;
        loadedForRef.current = accountId;
        setError(null);
      }
      // else: keep showing lastGoodRef data (transient empty ignored)
    } catch (e) {
      if (cancelledRef.current) return;
      console.warn(`[useAccountTrades] fetch failed for ${accountId}:`, e?.message || e);
      setError(e);
      // Do NOT clear trades - keep last good data. First-load with no prior
      // data shows the empty state via the empty array default.
    } finally {
      inFlightRef.current = false;
      if (loadedForRef.current === accountId || loadedForRef.current === null) {
        setIsLoading(false);
      }
    }
  }, [accountId, account, pageSize]);

  // Initial + on-account-change fetch
  useEffect(() => {
    cancelledRef.current = false;
    if (!accountId) {
      // No account yet - reset cleanly
      setTrades([]);
      lastGoodRef.current = [];
      loadedForRef.current = null;
      setIsLoading(false);
      return;
    }
    // When switching to a different account, clear stale data so we don't show
    // the previous account's trades while the new one loads.
    if (loadedForRef.current !== accountId) {
      setTrades([]);
      lastGoodRef.current = [];
      setIsLoading(true);
    }
    fetchNow();
    return () => { cancelledRef.current = true; };
  }, [accountId, fetchNow]);

  // Background polling - never blanks on transient empties/errors (fetchNow guards)
  useEffect(() => {
    if (!accountId) return;
    const iv = setInterval(() => { fetchNow(); }, intervalMs);
    return () => clearInterval(iv);
  }, [accountId, intervalMs, fetchNow]);

  return { trades, isLoading, error, refetch: fetchNow };
}