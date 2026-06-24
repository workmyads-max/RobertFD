/**
 * markTrashedAccounts — Detects ChallengeAccounts that have reached a terminal
 * state and freezes them as Trash snapshots:
 *   - status = "failed", OR
 *   - phase_review_status = "rejected" OR funded_review_status = "rejected", OR
 *   - passed + admin-approved AND superseded by a newer active/funded account
 *     for the same user (phase_review_status/funded_review_status = "approved"
 *     and the user already has a newer account that replaced it).
 *
 * For each newly-trashed account:
 *   - sets is_trashed = true
 *   - sets trashed_at = now (ISO)
 *   - sets trash_reason
 *   - leaves balance/pnl/win_rate/total_trades/etc. untouched (frozen snapshot)
 *   - TradeRecords remain in the DB (read-only snapshot) — cleanup is daily.
 *
 * Idempotent: accounts already is_trashed=true are skipped.
 * Safe to run from a scheduled automation (admin token) or an admin session.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

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

    const allAccounts = await base44.asServiceRole.entities.ChallengeAccount.list('-created_date', 1000);

    // Group accounts by user to detect superseded accounts
    const byUser = new Map();
    for (const a of allAccounts) {
      if (!a.user_email) continue;
      if (!byUser.has(a.user_email)) byUser.set(a.user_email, []);
      byUser.get(a.user_email).push(a);
    }

    const nowIso = new Date().toISOString();
    const toTrash = [];

    for (const a of allAccounts) {
      if (a.is_trashed) continue;          // already trashed — skip
      if (!a.user_email) continue;

      let reason = null;

      // 1. Failed
      if (a.status === 'failed') {
        reason = 'failed';
      }
      // 2. Rejected on review
      else if (a.phase_review_status === 'rejected' || a.funded_review_status === 'rejected') {
        reason = 'rejected';
      }
      // 3. Passed + approved AND superseded by a newer active/funded account
      else {
        const approved = a.phase_review_status === 'approved' || a.funded_review_status === 'approved';
        if (approved) {
          const userAccounts = byUser.get(a.user_email) || [];
          const aCreated = a.created_date ? new Date(a.created_date).getTime() : 0;
          const superseded = userAccounts.some(b =>
            b.id !== a.id &&
            !b.is_trashed &&
            ['active', 'funded'].includes(b.status) &&
            (b.created_date ? new Date(b.created_date).getTime() : 0) > aCreated &&
            (b.previous_account_id === a.account_id || a.new_account_id === b.account_id)
          );
          if (superseded) reason = 'superseded';
        }
      }

      if (reason) toTrash.push({ account: a, reason });
    }

    // Apply updates
    const results = [];
    for (const { account, reason } of toTrash) {
      try {
        await base44.asServiceRole.entities.ChallengeAccount.update(account.id, {
          is_trashed: true,
          trashed_at: nowIso,
          trash_reason: reason,
        });
        results.push({ account_id: account.account_id, reason, ok: true });
      } catch (e) {
        results.push({ account_id: account.account_id, reason, ok: false, error: e.message });
      }
    }

    return Response.json({
      success: true,
      trashed_count: results.filter(r => r.ok).length,
      results,
    });
  } catch (error) {
    console.error('[markTrashedAccounts] error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});