/**
 * Buy 2 Get 1 Free — shared helpers
 * Used by marketplace, checkout, popup, and backend provisioning.
 */

export const DEFAULT_B2G1_TIERS = [
  { buy_size: 25000, free_size: 10000 },
  { buy_size: 50000, free_size: 25000 },
  { buy_size: 100000, free_size: 50000 },
  { buy_size: 200000, free_size: 100000 },
];

export function getFreeSize(buySize, tierMapping = DEFAULT_B2G1_TIERS) {
  const tier = tierMapping.find(t => t.buy_size === Number(buySize));
  return tier ? tier.free_size : null;
}

export function isEligibleSize(size, tierMapping = DEFAULT_B2G1_TIERS) {
  return tierMapping.some(t => t.buy_size === Number(size));
}

export function formatSize(n) {
  if (n >= 1000000) return `$${n / 1000000}M`;
  if (n >= 1000) return `$${n / 1000}K`;
  return `$${n}`;
}