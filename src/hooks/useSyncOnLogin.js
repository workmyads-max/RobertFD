import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Hook: Sync user's MT5 accounts on dashboard load + every 30s interval
 * Uses Tritech API — login-based queries, no group dependency
 */
export function useSyncOnLogin() {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [syncError, setSyncError] = useState(null);

  useEffect(() => {
    const SYNC_COOLDOWN_MS = 30 * 1000; // 30 seconds between syncs
    const SYNC_KEY = 'xf_last_sync';

    const performSync = async () => {
      const lastSyncTime = sessionStorage.getItem(SYNC_KEY);
      if (lastSyncTime && Date.now() - parseInt(lastSyncTime, 10) < SYNC_COOLDOWN_MS) {
        return;
      }

      try {
        setSyncing(true);
        setSyncError(null);
        
        const response = await base44.functions.invoke('syncUserAccountOnLogin', {});
        
        if (response.data.success) {
          sessionStorage.setItem(SYNC_KEY, String(Date.now()));
          setLastSync({
            timestamp: new Date(),
            syncedCount: response.data.synced,
            results: response.data.results,
          });
        }
      } catch (error) {
        setSyncError(error.message);
        console.error('[Sync] Error:', error);
      } finally {
        setSyncing(false);
      }
    };

    performSync();

    // Re-sync every 30 seconds while dashboard is open
    const interval = setInterval(performSync, 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { syncing, lastSync, syncError };
}