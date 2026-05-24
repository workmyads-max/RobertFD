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
    const performSync = async () => {
      try {
        setSyncing(true);
        setSyncError(null);
        
        // Call the on-demand sync function
        const response = await base44.functions.invoke('syncUserAccountOnLogin', {});
        
        if (response.data.success) {
          setLastSync({
            timestamp: new Date(),
            syncedCount: response.data.synced,
            results: response.data.results,
          });
          console.log(`[Sync] Synced ${response.data.synced} accounts`);
        }
      } catch (error) {
        setSyncError(error.message);
        console.error('[Sync] Error:', error);
      } finally {
        setSyncing(false);
      }
    };

    // Only sync once when dashboard loads
    performSync();
  }, []);

  return { syncing, lastSync, syncError };
}