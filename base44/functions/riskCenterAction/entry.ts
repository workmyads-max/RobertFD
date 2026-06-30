/**
 * riskCenterAction — Logs admin manual actions to RiskAuditLog.
 *
 * HARD RULE: This function NEVER auto-breaches/fails/suspends. It only:
 *  1. Logs the admin's deliberate manual action to RiskAuditLog
 *  2. For "fail_account" / "suspend_account" / "mark_false_positive" /
 *     "mark_reviewed", updates the ChallengeAccount status/can_trade flag
 *     as an explicit admin decision (NOT automatic).
 *  3. For "add_note", stores the note in behavioral_fingerprint.
 *
 * Every action is a deliberate admin decision, fully audited.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { action, account_id, reason, note } = body;

    const validActions = ['fail_account', 'suspend_account', 'mark_reviewed', 'mark_false_positive', 'add_note', 'contact_user'];
    if (!validActions.includes(action)) {
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Find the target account
    const accounts = await base44.asServiceRole.entities.ChallengeAccount.filter({ account_id });
    const acc = accounts[0];
    if (!acc) return Response.json({ error: 'Account not found' }, { status: 404 });

    let actionCategory = 'risk_scan';
    let updates = {};
    let details = { reason, note };

    if (action === 'fail_account') {
      actionCategory = 'account_termination';
      updates = { status: 'failed', can_trade: false };
    } else if (action === 'suspend_account') {
      actionCategory = 'account_suspension';
      updates = { can_trade: false };
    } else if (action === 'mark_reviewed') {
      actionCategory = 'risk_scan';
      updates = { risk_flags: [] };
    } else if (action === 'mark_false_positive') {
      actionCategory = 'risk_scan';
      updates = { risk_flags: [], risk_score: 0, risk_level: 'low' };
    } else if (action === 'add_note') {
      actionCategory = 'risk_scan';
      const existing = acc.behavioral_fingerprint || {};
      const notes = existing.admin_notes || [];
      notes.push({ text: note || reason, admin: user.email, at: new Date().toISOString() });
      updates = { behavioral_fingerprint: { ...existing, admin_notes: notes } };
    } else if (action === 'contact_user') {
      actionCategory = 'risk_scan';
      details.contact_log = true;
    }

    // Apply the update (manual admin decision, NOT automatic)
    if (Object.keys(updates).length > 0) {
      await base44.asServiceRole.entities.ChallengeAccount.update(acc.id, updates);
    }

    // Log to RiskAuditLog
    await base44.asServiceRole.entities.RiskAuditLog.create({
      admin_email: user.email,
      action,
      action_category: actionCategory,
      target_account: account_id,
      target_user_email: acc.user_email,
      reason: reason || note || '',
      details,
      risk_score_before: acc.risk_score || 0,
      risk_score_after: updates.risk_score !== undefined ? updates.risk_score : acc.risk_score || 0,
      timestamp: new Date().toISOString(),
    });

    return Response.json({ success: true, action, account_id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});