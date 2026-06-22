/**
 * referralUtils.js — Shared referral attribution helpers.
 *
 * Flow:
 *   1. Any page with ?ref=CODE → captureReferralCode() stores it in localStorage
 *      with a 30-day expiry (matches AffiliateSettings.cookie_days default) and
 *      fires a non-blocking trackReferralClick backend call.
 *   2. On successful registration + verification, getStoredReferralCode() is read
 *      and passed to processAffiliateAttribution to create the affiliate profile
 *      chain and increment the referrer's counters.
 *   3. The stored code is cleared once consumed.
 */

const STORAGE_KEY = 'xf_ref_code';
const STORAGE_TS_KEY = 'xf_ref_ts';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Capture ?ref=CODE from the current URL into localStorage with a 30-day expiry.
 * Also fires a non-blocking click-tracking call to the backend.
 * Safe to call on any page; no-ops if no ref param present.
 */
export function captureReferralCode() {
  try {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    if (!refCode) return;

    const normalized = refCode.trim().toUpperCase();
    localStorage.setItem(STORAGE_KEY, normalized);
    localStorage.setItem(STORAGE_TS_KEY, String(Date.now()));

    // Clean the URL so the code doesn't linger in the address bar / history
    const url = new URL(window.location.href);
    url.searchParams.delete('ref');
    window.history.replaceState({}, '', url.toString());

    // Fire-and-forget click tracking (non-blocking)
    trackReferralClick(normalized).catch((e) => {
      console.warn('[referral] click track failed (non-blocking):', e?.message || e);
    });
  } catch (e) {
    console.warn('[referral] captureReferralCode failed:', e?.message || e);
  }
}

/**
 * Read the stored referral code if it's still within its 30-day expiry.
 * Returns the code string or '' if none/expired.
 */
export function getStoredReferralCode() {
  try {
    const code = localStorage.getItem(STORAGE_KEY);
    if (!code) return '';
    const ts = parseInt(localStorage.getItem(STORAGE_TS_KEY) || '0', 10);
    if (!ts || Date.now() - ts > THIRTY_DAYS_MS) {
      // Expired — clean up
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_TS_KEY);
      return '';
    }
    return code;
  } catch {
    return '';
  }
}

/**
 * Clear the stored referral code after it's been consumed.
 */
export function clearStoredReferralCode() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_TS_KEY);
  } catch { /* noop */ }
}

/**
 * Fire-and-forget call to the trackReferralClick backend function.
 */
async function trackReferralClick(referralCode) {
  const { base44 } = await import('@/api/base44Client');
  await base44.functions.invoke('trackReferralClick', { referral_code: referralCode });
}

/**
 * Process affiliate attribution after successful registration + verification.
 * Creates the user's AffiliateProfile and increments the referrer's counters.
 * Non-blocking — failures are logged but don't break auth flow.
 */
export async function processAffiliateAttribution(userEmail, referralCode) {
  if (!userEmail) return { success: false, reason: 'no email' };
  if (!referralCode) return { success: false, reason: 'no referral code' };

  try {
    const { base44 } = await import('@/api/base44Client');
    const res = await base44.functions.invoke('processAffiliateAttribution', {
      user_email: userEmail.toLowerCase().trim(),
      referral_code: referralCode,
    });
    return res.data || { success: true };
  } catch (e) {
    console.error('[referral] processAffiliateAttribution failed:', e?.message || e);
    return { success: false, error: e?.message || String(e) };
  }
}