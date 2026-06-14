/**
 * syncUserAccountOnLogin — ARCHIVED (MT5 Sync Consolidation, Priority 10)
 * scheduledMTSync is the SOLE MT5 sync writer (runs every 5 min via automation).
 * This endpoint is a no-op to prevent breaking legacy callers.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    return Response.json({
      success: true,
      archived: true,
      message: 'syncUserAccountOnLogin is archived. MT5 sync runs automatically via scheduledMTSync every 5 minutes.',
    });
  } catch {
    return Response.json({ success: false, archived: true });
  }
});