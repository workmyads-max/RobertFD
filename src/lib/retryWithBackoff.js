/**
 * retryWithBackoff — Retry a promise on HTTP 429 (rate limit) with
 * exponential backoff + jitter. Non-429 errors throw immediately.
 *
 * Usage:
 *   import { retryWithBackoff } from '@/lib/retryWithBackoff';
 *   const res = await retryWithBackoff(() => base44.functions.invoke('fn', payload));
 */
export async function retryWithBackoff(fn, { retries = 3, baseDelay = 800 } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const status = err?.response?.status;
      // Only retry on 429; all other errors surface immediately
      if (status !== 429 || attempt === retries) throw err;
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 400;
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastError;
}