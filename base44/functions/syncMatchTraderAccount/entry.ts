/**
 * syncMatchTraderAccount — ARCHIVED / RENAMED
 *
 * This function has been archived as of 2026-06-14.
 *
 * It contained zero MatchTrader code. All API calls targeted MT5 (Tritech).
 * Renamed to mt5RealtimeSync to accurately reflect its function.
 *
 * All callers have been updated:
 *   - components/dashboard/LiveDDGuard     → now calls mt5RealtimeSync
 *   - components/admin/AdminMatchTrader    → now calls mt5RealtimeSync
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (_req) => {
  return Response.json({
    error: 'Gone',
    message: 'syncMatchTraderAccount has been renamed to mt5RealtimeSync. Update all callers.',
    replacement: 'mt5RealtimeSync',
    archived_at: '2026-06-14',
  }, { status: 410 });
});