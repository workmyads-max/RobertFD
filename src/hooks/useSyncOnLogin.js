/**
 * useSyncOnLogin — ARCHIVED (MT5 Sync Consolidation, Priority 2)
 *
 * scheduledMTSync is now the SOLE MT5 synchronization engine (runs every 5 min via automation).
 * This hook is a no-op stub that preserves the existing API surface so all consumers
 * (DashboardOverview, etc.) continue to compile without changes.
 *
 * syncing  — always false (no on-demand sync triggered)
 * lastSync — always null
 * syncError — always null
 */
export function useSyncOnLogin() {
  return { syncing: false, lastSync: null, syncError: null };
}