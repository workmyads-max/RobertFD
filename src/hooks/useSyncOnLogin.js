/**
 * useSyncOnLogin — ARCHIVED (MT5 Sync Consolidation, Priority 10)
 *
 * scheduledMTSync is the SOLE MT5 synchronization engine (runs every 5 min via automation).
 * This hook is a permanent no-op stub to preserve API compatibility.
 */
export function useSyncOnLogin() {
  return { syncing: false, lastSync: null, syncError: null };
}