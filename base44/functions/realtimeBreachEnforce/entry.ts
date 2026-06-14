/**
 * realtimeBreachEnforce — ARCHIVED
 *
 * This function has been archived as of 2026-06-14.
 *
 * Reason: No active callers confirmed in production audit.
 * LiveDDGuard previously called this function but was updated to call
 * syncMatchTraderAccount (now mt5RealtimeSync) which performs all breach
 * enforcement server-side atomically.
 *
 * Replacement: mt5RealtimeSync handles all realtime breach enforcement.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (_req) => {
  return Response.json({
    error: 'Gone',
    message: 'realtimeBreachEnforce has been archived. Use mt5RealtimeSync for realtime breach enforcement.',
    replacement: 'mt5RealtimeSync',
    archived_at: '2026-06-14',
  }, { status: 410 });
});