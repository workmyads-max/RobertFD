import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Hook: Sync user's MT5/Match Trader accounts on dashboard load
 * Only triggers if user has active challenge accounts
 * Zero automation credits - on-demand only
 */
export function useSyncOnLogin() {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [syncError, setSyncError] = useState(null);

  useEffect(() => {
    const SYNC_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes
    const SYNC_KEY = 'xf_last_sync';

    const performSync = async () => {
      // Skip if synced within the last 10 minutes in this browser session
      // DD enforcement is server-side (automatedDDBreach runs every 15 min regardless)
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
  }, []);

  return { syncing, lastSync, syncError };
}