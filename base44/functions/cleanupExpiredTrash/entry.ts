/**
 * cleanupExpiredTrash — Daily cleanup for the Trash Account feature.
 *
 * For every ChallengeAccount with is_trashed=true and trashed_at older than
 * 14 days, permanently deletes its frozen TradeRecord snapshot and marks
 * history_expired=true so the Trash page shows "History expired — older than
 * 14 days" instead of trades. The account summary itself is retained.
 *
 * Idempotent: accounts already history_expired=true are skipped.
 * Authorized via admin session OR scheduler secret token.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const RETENTION_DAYS = 14;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // ── Authorization: admin session OR scheduler secret token ───────────────
    const schedulerToken = req.headers.get('X-Scheduler-Token');
    const expectedToken = Deno.env.get('SCHEDULER_SECRET_TOKEN');
    let authorized = false;
    try {
      const u = await base44.auth.me();
      if (u && u.role === 'admin') authorized = true;
    } catch { /* no session */ }
    if (!authorized && schedulerToken && expectedToken && schedulerToken === expectedToken) {
      authorized = true;
    }
    if (!authorized) {
      return Response.json({ error: 'Forbidden: admin or scheduler token required' }, { status: 403 });
    }

    const now = Date.now();
    const cutoff = now - RETENTION_DAYS * MS_PER_DAY;

    const trashed = await base44.asServiceRole.entities.ChallengeAccount.filter({ is_trashed: true });
    const expired = trashed.filter(a =>
      !a.history_expired &&
      a.trashed_at &&
      new Date(a.trashed_at).getTime() < cutoff
    );

    const results = [];
    for (const acc of expired) {
      try {
        // Delete the frozen TradeRecord snapshot for this account
        const recs = await base44.asServiceRole.entities.TradeRecord.filter({ account_id: acc.account_id });
        let deletedCount = 0;
        for (const r of recs) {
          try {
            await base44.asServiceRole.entities.TradeRecord.delete(r.id);
            deletedCount++;
          } catch (e) {
            // continue deleting the rest
          }
        }
        // Mark the account summary as history-expired (keep the summary itself)
        await base44.asServiceRole.entities.ChallengeAccount.update(acc.id, { history_expired: true });
        results.push({ account_id: acc.account_id, deleted_records: deletedCount, ok: true });
      } catch (e) {
        results.push({ account_id: acc.account_id, ok: false, error: e.message });
      }
    }

    return Response.json({
      success: true,
      expired_count: results.filter(r => r.ok).length,
      results,
    });
  } catch (error) {
    console.error('[cleanupExpiredTrash] error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});