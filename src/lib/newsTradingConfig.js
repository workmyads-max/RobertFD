/**
 * News Trading Rule Configuration
 * ─────────────────────────────────
 * SINGLE SOURCE OF TRUTH for:
 *   1. What makes an event "restricted" (currently impact = High)
 *   2. The blackout window (2 min before → 2 min after)
 *   3. The rule text shown to users
 *   4. Currency flag emojis
 *
 * The Economic Calendar page, the News Alerts Bar, and any future news-window
 * enforcement logic all import from here — change a value once, it applies everywhere.
 */

// ── What makes an event "restricted" ────────────────────────────────────────
// The impact level that triggers the news-trading restriction.
// Change this to 'Medium' to also restrict medium-impact events, etc.
export const RESTRICTED_IMPACT_LEVEL = 'High';

// ── Blackout window ─────────────────────────────────────────────────────────
// Number of minutes BEFORE a restricted news event during which trading is blocked.
export const NEWS_BLACKOUT_BEFORE_MINUTES = 2;

// Number of minutes AFTER a restricted news event during which trading is blocked.
export const NEWS_BLACKOUT_AFTER_MINUTES = 2;

// ── Rule text (FTMO style) ──────────────────────────────────────────────────
export const NEWS_TRADING_RULE_TEXT =
  'Restricted events: You may not open or close trades (including pending orders, SL/TP) ' +
  `from ${NEWS_BLACKOUT_BEFORE_MINUTES} minutes before to ${NEWS_BLACKOUT_AFTER_MINUTES} minutes after ` +
  `a ${RESTRICTED_IMPACT_LEVEL}-impact (restricted) news event on the affected instrument/currency.`;

// ── Core logic functions ────────────────────────────────────────────────────

/**
 * Returns true if the given event is a "restricted" event (news-trading rule applies).
 * Currently: impact === 'High'. This is the single definition used everywhere.
 */
export function isRestrictedEvent(event) {
  return (event?.impact || '') === RESTRICTED_IMPACT_LEVEL;
}

/**
 * Returns the { start, end } window (in milliseconds since epoch) during which
 * trading is restricted for the given event.
 */
export function getRestrictedWindow(event) {
  if (!event?.event_time) return null;
  const eventMs = new Date(event.event_time).getTime();
  return {
    start: eventMs - NEWS_BLACKOUT_BEFORE_MINUTES * 60000,
    end:   eventMs + NEWS_BLACKOUT_AFTER_MINUTES * 60000,
  };
}

/**
 * Returns true if `nowMs` (or Date.now() if omitted) falls within the restricted
 * window for the given event.
 */
export function isInRestrictedWindow(event, nowMs = Date.now()) {
  const win = getRestrictedWindow(event);
  if (!win) return false;
  return nowMs >= win.start && nowMs <= win.end;
}

// ── Currency flag emojis ────────────────────────────────────────────────────
export const CURRENCY_FLAGS = {
  USD: '🇺🇸',
  EUR: '🇪🇺',
  GBP: '🇬🇧',
  CAD: '🇨🇦',
  JPY: '🇯🇵',
  AUD: '🇦🇺',
  NZD: '🇳🇿',
  CHF: '🇨🇭',
  CNY: '🇨🇳',
};

export function getCurrencyFlag(currency) {
  return CURRENCY_FLAGS[currency] || '🏳️';
}