/**
 * adminListAllUsers — Admin-only endpoint that returns ALL users via the
 * service role, bypassing the built-in User entity security that restricts
 * listing to the app owner only. This ensures any admin (role='admin') can
 * see all users in the admin panel, not just the original app owner.
 *
 * AUTHORIZATION:
 *   - Classic admin (User.role === 'admin') → allowed
 *   - Staff with an admin-level role (owner/super_admin/admin) → allowed
 *   - Everyone else → 403
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const ADMIN_LEVEL_STAFF_ROLES = new Set(['owner', 'super_admin', 'admin']);

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let authorized = user.role === 'admin';

    if (!authorized) {
      try {
        const staffRes = await base44.asServiceRole.functions.invoke('staffManagement', { action: 'get_my_permissions' });
        const staffRole = staffRes?.data?.role || staffRes?.role;
        if (staffRole && ADMIN_LEVEL_STAFF_ROLES.has(staffRole)) {
          authorized = true;
        }
      } catch { /* not a staff member */ }
    }

    if (!authorized) {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const users = await base44.asServiceRole.entities.User.list('-created_date', 500);

    // Strip sensitive fields
    const safeUsers = users.map(u => ({
      id: u.id,
      email: u.email,
      full_name: u.full_name,
      role: u.role,
      display_name: u.display_name,
      avatar_url: u.avatar_url,
      profile_photo_url: u.profile_photo_url,
      phone: u.phone,
      country: u.country,
      email_verified: u.email_verified,
      created_date: u.created_date,
    }));

    return Response.json({ users: safeUsers, count: safeUsers.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}