import { useState, useEffect } from 'react';

/**
 * useNow - returns the current timestamp (ms), updated on an interval.
 * Pass intervalMs=1000 for a ticking countdown clock.
 * Uses a single timer regardless of how many components consume the value.
 */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(iv);
  }, [intervalMs]);
  return now;
}

/**
 * Formats a millisecond diff into a countdown string.
 * > 1 hour  → "1h 20m 15s"
 * ≤ 1 hour  → "20m 15s"
 * ≤ 1 min   → "45s"
 * ≤ 0       → null (expired)
 */
export function formatCountdown(diffMs) {
  if (diffMs <= 0) return null;
  const totalSec = Math.floor(diffMs / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n) => String(n).padStart(2, '0');
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  if (m > 0) return `${pad(m)}:${pad(s)}`;
  return `00:${pad(s)}`;
}