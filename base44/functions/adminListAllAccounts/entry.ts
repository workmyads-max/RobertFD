/**
 * adminListAllAccounts — Admin/staff-only endpoint that returns ALL challenge
 * accounts (and optionally related aggregates) using the service role, bypassing
 * the per-user RLS read filter that enforces user-side data isolation.
 *
 * WHY THIS EXISTS:
 *   ChallengeAccount (and other user-owned entities) carry an RLS read filter
 *   (user_email = {{user.email}}) so normal users only see their own records.
 *   That same filter must NOT block admins/staff from seeing every user's
 *   records in the Admin Control Center, Risk Center, and management pages.
 *   This function uses base44.asServiceRole (which bypasses RLS) and is gated
 *   to admin/staff callers only — so admin visibility is guaranteed regardless
 *   of RLS behavior, while user-side privacy stays fully intact.
 *
 * AUTHORIZATION:
 *   - Classic admin (User.role === 'admin') → allowed
 *   - Staff with an admin-level role (owner/super_admin/admin) → allowed
 *   - Everyone else → 403
 *
 * WHAT IT DOES:
 *   - Returns all ChallengeAccount records (sorted by created_date desc, capped)
 *   - Optionally returns counts/summaries the Admin Dashboard needs
 *   - NEVER takes any enforcement action — read-only audit/admin view
 *
 * What it does NOT do:
 *   - Touch auth, payments, MT5 sync, or user-side data
 *   - Modify any account status / can_trade / risk fields
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const ADMIN_LEVEL_STAFF_ROLES = new Set(['owner', 'super_admin', 'admin']);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Classic admin shortcut
    let authorized = user.role === 'admin';

    // Staff role check (non-blocking — only if not already a classic admin)
    if (!authorized) {
      try {
        const staffRes = await base44.asServiceRole.functions.invoke('staffManagement', { action: 'get_my_permissions' });
        const staffRole = staffRes?.data?.role || staffRes?.role;
        if (staffRole && ADMIN_LEVEL_STAFF_ROLES.has(staffRole)) {
          authorized = true;
        }
      } catch { /* not a staff member or staffManagement unavailable */ }
    }

    if (!authorized) {
      return Response.json({ error: 'Forbidden: Admin or staff access required' }, { status: 403 });
    }

    const sr = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const limit = Math.min(parseInt(body.limit || 500, 10), 1000);
    const includeSummary = body.include_summary === true;

    // Service role bypasses RLS — returns ALL users' accounts
    const accounts = await sr.entities.ChallengeAccount.list('-created_date', limit);

    if (!includeSummary) {
      return Response.json({ success: true, accounts, total: accounts.length });
    }

    // Admin Dashboard summary aggregates + risk-center datasets (all via service role)
    const [orders, withdrawals, tickets, kycs, riskFlags, deviceLogs] = await Promise.all([
      sr.entities.Order.list('-created_date', 500),
      sr.entities.WithdrawalRequest.list('-created_date', 500),
      sr.entities.SupportTicket.list('-created_date', 500),
      sr.entities.KYCVerification.list('-created_date', 500),
      sr.entities.RiskFlag.filter({ status: 'active' }),
      sr.entities.DeviceLog.list('-created_date', 500),
    ]);

    return Response.json({
      success: true,
      accounts,
      total: accounts.length,
      // Risk Center datasets (admin-only, audit)
      risk_flags: riskFlags,
      kyc_verifications: kycs,
      device_logs: deviceLogs,
      summary: {
        total_accounts: accounts.length,
        active_accounts: accounts.filter(a => a.status === 'active' || a.status === 'funded').length,
        pending_accounts: accounts.filter(a => a.status === 'pending').length,
        passed_accounts: accounts.filter(a => a.status === 'passed').length,
        failed_accounts: accounts.filter(a => a.status === 'failed').length,
        pending_withdrawals: withdrawals.filter(w => w.status === 'pending').length,
        open_tickets: tickets.filter(t => t.status === 'open').length,
        pending_orders: orders.filter(o => o.payment_status === 'pending' || o.payment_status === 'awaiting_confirmation').length,
        confirmed_orders: orders.filter(o => o.payment_status === 'confirmed').length,
        total_revenue: orders.filter(o => o.payment_status === 'confirmed').reduce((s, o) => s + (o.price || 0), 0),
      },
    });
  } catch (error) {
    console.error('adminListAllAccounts error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});