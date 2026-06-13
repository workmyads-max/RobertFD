/**
 * debugAccountQuery — traces the exact auth context and data source
 * for ChallengeAccount queries on both desktop and mobile.
 * 
 * Call from FundedDashboard debug overlay to get raw evidence.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // 1. Raw request headers (auth evidence)
  const headers = {};
  for (const [k, v] of req.headers.entries()) {
    if (k.toLowerCase().includes('auth') || k.toLowerCase().includes('token') || k.toLowerCase().includes('cookie') || k.toLowerCase().includes('user')) {
      headers[k] = v.slice(0, 60) + (v.length > 60 ? '...' : '');
    }
  }

  // 2. Body params
  let body = {};
  try { body = await req.json(); } catch (_) {}

  const userEmail = body.user_email || null;

  // 3. Who is the caller from Base44's perspective?
  let b44User = null;
  let b44AuthError = null;
  try {
    b44User = await base44.auth.me();
  } catch (e) {
    b44AuthError = e.message;
  }

  // 4. Query ChallengeAccount as the calling user (user-scoped)
  let userScopedAccounts = [];
  let userScopedError = null;
  try {
    userScopedAccounts = await base44.entities.ChallengeAccount.list();
  } catch (e) {
    userScopedError = e.message;
  }

  // 5. Query ChallengeAccount as service role (admin)
  let serviceRoleAccounts = [];
  let serviceRoleError = null;
  try {
    const all = await base44.asServiceRole.entities.ChallengeAccount.list('-created_date', 200);
    // Filter to the target email
    serviceRoleAccounts = userEmail
      ? all.filter(a => a.user_email === userEmail)
      : all.slice(0, 20);
  } catch (e) {
    serviceRoleError = e.message;
  }

  // 6. Query by user_email filter via service role
  let filteredByEmail = [];
  let filteredError = null;
  try {
    if (userEmail) {
      filteredByEmail = await base44.asServiceRole.entities.ChallengeAccount.filter({ user_email: userEmail });
    }
  } catch (e) {
    filteredError = e.message;
  }

  return Response.json({
    timestamp: new Date().toISOString(),
    request_headers_auth: headers,
    body_received: body,

    base44_auth: {
      user: b44User ? {
        id: b44User.id,
        email: b44User.email,
        role: b44User.role,
      } : null,
      error: b44AuthError,
      authenticated: !!b44User,
    },

    user_scoped_query: {
      count: userScopedAccounts.length,
      error: userScopedError,
      sample: userScopedAccounts.slice(0, 3).map(a => ({
        id: a.id,
        account_id: a.account_id,
        user_email: a.user_email,
        status: a.status,
        created_by_id: a.created_by_id,
      })),
    },

    service_role_query: {
      count: serviceRoleAccounts.length,
      error: serviceRoleError,
      sample: serviceRoleAccounts.slice(0, 6).map(a => ({
        id: a.id,
        account_id: a.account_id,
        user_email: a.user_email,
        status: a.status,
        created_by_id: a.created_by_id,
      })),
    },

    filtered_by_email_query: {
      email_used: userEmail,
      count: filteredByEmail.length,
      error: filteredError,
      records: filteredByEmail.map(a => ({
        id: a.id,
        account_id: a.account_id,
        user_email: a.user_email,
        status: a.status,
        created_by_id: a.created_by_id,
      })),
    },

    verdict: {
      user_can_see_own_accounts: userScopedAccounts.length > 0,
      service_role_finds_accounts: serviceRoleAccounts.length > 0,
      email_filter_finds_accounts: filteredByEmail.length > 0,
      base44_user_authenticated: !!b44User,
      root_cause_hypothesis: !b44User
        ? 'UNAUTHENTICATED: No Base44 token in request — entity permissions block read'
        : userScopedAccounts.length === 0 && serviceRoleAccounts.length > 0
        ? 'RLS/PERMISSION: Base44 user authenticated but user-scoped query returns 0 — check entity read permission vs created_by_id'
        : userScopedAccounts.length > 0
        ? 'OK: User-scoped query works — issue is frontend-only'
        : 'UNKNOWN: Both user-scoped and service-role return 0 — data may not exist for this email',
    }
  });
});