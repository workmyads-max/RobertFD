// ── PRE-LAUNCH "COMING SOON" GATE ───────────────────────────────────────────────
// The public home/landing page shows a "Coming Soon" screen until this moment
// passes, then the normal home page appears automatically. Only the public
// "/" route is gated; login, dashboard, admin and all backend logic keep working.
//
// EDIT THIS VALUE to change the launch moment. Format: ISO 8601 (UTC).
export const LAUNCH_DATETIME = '2026-08-03T00:00:00Z';

export function getLaunchDate() {
  return new Date(LAUNCH_DATETIME);
}

export function isLaunched(nowMs = Date.now()) {
  return nowMs >= getLaunchDate().getTime();
}

// Friendly display string for the launch date
export function getLaunchLabel() {
  return getLaunchDate().toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  });
}