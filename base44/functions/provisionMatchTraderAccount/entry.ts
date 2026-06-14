/**
 * provisionMatchTraderAccount — ARCHIVED
 *
 * This function has been archived as of 2026-06-14.
 *
 * Reason: MatchTrader platform is not in production. All accounts use MT5 (Tritech).
 * All callers have been migrated to provisionMT5Account:
 *   - functions/confirmoWebhook       → now calls provisionMT5Account
 *   - functions/coinpaymentsWebhook   → now calls provisionMT5Account
 *   - functions/nowpaymentsWebhook    → now calls provisionMT5Account
 *
 * Replacement: provisionMT5Account
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (_req) => {
  return Response.json({
    error: 'Gone',
    message: 'provisionMatchTraderAccount has been archived. Use provisionMT5Account for all account provisioning.',
    replacement: 'provisionMT5Account',
    archived_at: '2026-06-14',
  }, { status: 410 });
});