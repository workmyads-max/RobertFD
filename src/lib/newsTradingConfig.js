/**
 * News Trading Rule Configuration
 * ─────────────────────────────────
 * Single source of truth for the configurable news-trading blackout window.
 * Change these values to adjust the rule globally across the Economic Calendar
 * page and any future enforcement logic.
 */

// Number of minutes BEFORE a High-impact news event during which trading is restricted.
export const NEWS_BLACKOUT_BEFORE_MINUTES = 2;

// Number of minutes AFTER a High-impact news event during which trading is restricted.
export const NEWS_BLACKOUT_AFTER_MINUTES = 2;

// Full rule text shown to users in the Economic Calendar note box.
export const NEWS_TRADING_RULE_TEXT =
  'News Trading Rule: You may not open or close trades (including pending orders and SL/TP) ' +
  `from ${NEWS_BLACKOUT_BEFORE_MINUTES} minutes BEFORE to ${NEWS_BLACKOUT_AFTER_MINUTES} minutes AFTER ` +
  'a High-impact news event on the affected instrument/currency.';