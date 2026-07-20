// Pre-launch launch datetime (UTC).
// KEEP IN SYNC with src/lib/launchConfig.js (frontend gate uses that copy).
export const LAUNCH_DATETIME = '2026-08-03T00:00:00Z';

export function isLaunched(nowMs = Date.now()) {
  return nowMs >= new Date(LAUNCH_DATETIME).getTime();
}