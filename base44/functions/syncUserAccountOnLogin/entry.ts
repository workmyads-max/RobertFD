/**
 * syncUserAccountOnLogin — ARCHIVED
 *
 * This function has been decommissioned as part of MT5 Sync Consolidation (Priority 2).
 * scheduledMTSync is now the SOLE authoritative MT5 synchronization engine.
 *
 * This function remains deployed but is a no-op to prevent 404 errors from any
 * lingering callers. It will be fully deleted in the next cleanup phase.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    console.log(`[syncUserAccountOnLogin] ARCHIVED — called by ${user.email}. scheduledMTSync is the authoritative sync engine.`);

    return Response.json({
      success: true,
      archived: true,
      message: 'syncUserAccountOnLogin is archived. MT5 sync is handled exclusively by scheduledMTSync (runs every 5 minutes).',
      synced: 0,
      results: [],
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});