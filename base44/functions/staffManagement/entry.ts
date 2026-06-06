/**
 * staffManagement — Institutional RBAC backend
 * Handles: staff CRUD, role management, permission checks, activity logging
 * All sensitive operations validated server-side via service role.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const ALL_PERMISSIONS = [
  'manage_users', 'manage_challenges', 'manage_payouts', 'manage_kyc',
  'manage_risk', 'manage_affiliates', 'manage_support', 'manage_notifications',
  'manage_settings', 'manage_payments', 'manage_coupons', 'manage_staff', 'manage_audit_logs'
];

const ROLE_PERMISSION_MAP = {
  owner: ALL_PERMISSIONS,
  super_admin: ALL_PERMISSIONS,
  admin: ALL_PERMISSIONS.filter(p => p !== 'manage_staff'),
  risk_manager: ['manage_risk', 'manage_users'],
  finance_team: ['manage_payouts', 'manage_payments'],
  support_team: ['manage_support'],
  kyc_team: ['manage_kyc'],
  affiliate_manager: ['manage_affiliates', 'manage_coupons'],
};

function getAdminSupabase() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

async function getStaffPermissions(sr, userEmail) {
  const members = await sr.entities.StaffMember.filter({ user_email: userEmail });
  const member = members[0];
  if (!member) return null;
  if (!member.is_active || member.is_suspended) return [];
  // If custom permissions set on member, use those; else use role defaults
  if (member.permissions && member.permissions.length > 0) return member.permissions;
  if (member.role_name === 'custom' && member.custom_role_id) {
    const roles = await sr.entities.StaffRole.filter({ id: member.custom_role_id });
    return roles[0]?.permissions || [];
  }
  return ROLE_PERMISSION_MAP[member.role_name] || [];
}

// Resolves caller identity + permissions in one batched fetch — call once per request
async function resolveCallerContext(sr, userEmail) {
  const [accounts, members] = await Promise.all([
    sr.entities.UserAccount.filter({ email: userEmail }),
    sr.entities.StaffMember.filter({ user_email: userEmail }),
  ]);
  const account = accounts[0];
  const member = members[0];
  const isClassicAdmin = account?.role === 'admin';

  let permissions = [];
  if (isClassicAdmin) {
    permissions = ALL_PERMISSIONS;
  } else if (member) {
    if (!member.is_active || member.is_suspended) {
      permissions = [];
    } else if (member.permissions && member.permissions.length > 0) {
      permissions = member.permissions;
    } else if (member.role_name === 'custom' && member.custom_role_id) {
      const roles = await sr.entities.StaffRole.filter({ id: member.custom_role_id });
      permissions = roles[0]?.permissions || [];
    } else {
      permissions = ROLE_PERMISSION_MAP[member.role_name] || [];
    }
  }

  return { isClassicAdmin, permissions, member, account };
}

function hasPermission(ctx, permission) {
  if (ctx.isClassicAdmin) return true;
  if (!ctx.member) return false;
  return ctx.permissions.includes(permission);
}

async function logActivity(sr, data) {
  await sr.entities.StaffActivityLog.create({
    staff_email: data.staff_email,
    staff_name: data.staff_name || '',
    role_name: data.role_name || '',
    action: data.action,
    action_category: data.action_category || 'system',
    target_entity: data.target_entity || null,
    target_id: data.target_id || null,
    target_user_email: data.target_user_email || null,
    details: data.details || {},
    ip_address: data.ip_address || null,
    user_agent: data.user_agent || null,
    status: data.status || 'success',
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const ipAddress = req.headers.get('x-forwarded-for') || 'Unknown';
    const userAgent = req.headers.get('user-agent') || 'Unknown';

    const body = await req.json();
    const { action } = body;

    // Resolve caller permissions ONCE per request — eliminates repeated DB reads
    const ctx = await resolveCallerContext(sr, user.email);

    // ─── GET STAFF LIST ────────────────────────────────────────────
    if (action === 'get_staff') {
      if (!hasPermission(ctx, 'manage_staff')) return Response.json({ error: 'Insufficient permissions' }, { status: 403 });
      const staff = await sr.entities.StaffMember.list('-created_date', 200);
      return Response.json({ success: true, staff });
    }

    // ─── GET PERMISSIONS FOR CURRENT USER ──────────────────────────
    if (action === 'get_my_permissions') {
      return Response.json({
        success: true,
        permissions: ctx.permissions,
        role: ctx.isClassicAdmin ? 'admin' : (ctx.member?.role_name || 'none'),
        is_classic_admin: ctx.isClassicAdmin,
        member: ctx.member || null,
      });
    }

    // ─── INVITE STAFF ──────────────────────────────────────────────
    if (action === 'invite_staff') {
      if (!hasPermission(ctx, 'manage_staff')) return Response.json({ error: 'Insufficient permissions' }, { status: 403 });

      const { email, full_name, role_name, permissions } = body;
      if (!email || !role_name) return Response.json({ error: 'Email and role required' }, { status: 400 });

      const existing = await sr.entities.StaffMember.filter({ user_email: email.toLowerCase() });
      if (existing.length > 0) return Response.json({ error: 'Staff member already exists' }, { status: 409 });

      // Create Supabase auth user
      const adminSupabase = getAdminSupabase();
      const tempPassword = 'Staff_' + Math.random().toString(36).slice(-10) + '!';
      const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
        email: email.toLowerCase(),
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name, role: role_name },
        app_metadata: { role: role_name, is_staff: true },
      });
      if (authError) return Response.json({ error: authError.message }, { status: 400 });

      // Create UserAccount if not exists
      const existingAccounts = await sr.entities.UserAccount.filter({ email: email.toLowerCase() });
      if (existingAccounts.length === 0) {
        await sr.entities.UserAccount.create({
          email: email.toLowerCase(), full_name, role: role_name === 'owner' || role_name === 'super_admin' || role_name === 'admin' ? 'admin' : 'user',
          is_verified: true, is_active: true, password_hash: 'staff_sso',
          auth_user_id: authData.user.id,
        });
      }

      // Create StaffMember record
      const member = await sr.entities.StaffMember.create({
        user_email: email.toLowerCase(), full_name,
        role_name, permissions: permissions || [],
        is_active: true, is_suspended: false,
        invited_by: user.email, auth_user_id: authData.user.id,
      });

      await logActivity(sr, {
        staff_email: user.email, action: 'invite_staff', action_category: 'staff',
        target_user_email: email, details: { role_name, full_name },
        ip_address: ipAddress, user_agent: userAgent,
      });

      // Send welcome email
      try {
        await sr.functions.invoke('emailService', {
          action: 'send_notification', to: email, type: 'registration',
          data: { name: full_name, email, role: role_name, temp_password: tempPassword },
        });
      } catch (_) {}

      return Response.json({ success: true, member, temp_password: tempPassword });
    }

    // ─── UPDATE STAFF ──────────────────────────────────────────────
    if (action === 'update_staff') {
      if (!hasPermission(ctx, 'manage_staff')) return Response.json({ error: 'Insufficient permissions' }, { status: 403 });

      const { member_id, updates } = body;
      const member = await sr.entities.StaffMember.update(member_id, updates);

      await logActivity(sr, {
        staff_email: user.email, action: 'update_staff', action_category: 'staff',
        target_id: member_id, details: updates, ip_address: ipAddress, user_agent: userAgent,
      });
      return Response.json({ success: true, member });
    }

    // ─── SUSPEND STAFF ─────────────────────────────────────────────
    if (action === 'suspend_staff') {
      if (!hasPermission(ctx, 'manage_staff')) return Response.json({ error: 'Insufficient permissions' }, { status: 403 });

      const { member_id, reason, target_email } = body;

      // Disable in Supabase auth
      const adminSupabase = getAdminSupabase();
      const members = await sr.entities.StaffMember.filter({ id: member_id });
      if (members[0]?.auth_user_id) {
        await adminSupabase.auth.admin.updateUserById(members[0].auth_user_id, { ban_duration: '876600h' });
      }

      await sr.entities.StaffMember.update(member_id, {
        is_suspended: true, suspended_reason: reason, suspended_at: new Date().toISOString(), is_active: false,
      });

      await logActivity(sr, {
        staff_email: user.email, action: 'suspend_staff', action_category: 'staff',
        target_id: member_id, target_user_email: target_email, details: { reason },
        ip_address: ipAddress, user_agent: userAgent,
      });
      return Response.json({ success: true });
    }

    // ─── REACTIVATE STAFF ──────────────────────────────────────────
    if (action === 'reactivate_staff') {
      if (!hasPermission(ctx, 'manage_staff')) return Response.json({ error: 'Insufficient permissions' }, { status: 403 });

      const { member_id, target_email } = body;
      const adminSupabase = getAdminSupabase();
      const members = await sr.entities.StaffMember.filter({ id: member_id });
      if (members[0]?.auth_user_id) {
        await adminSupabase.auth.admin.updateUserById(members[0].auth_user_id, { ban_duration: 'none' });
      }
      await sr.entities.StaffMember.update(member_id, { is_suspended: false, is_active: true, suspended_reason: null });

      await logActivity(sr, {
        staff_email: user.email, action: 'reactivate_staff', action_category: 'staff',
        target_id: member_id, target_user_email: target_email, ip_address: ipAddress,
      });
      return Response.json({ success: true });
    }

    // ─── DELETE STAFF ──────────────────────────────────────────────
    if (action === 'delete_staff') {
      if (!hasPermission(ctx, 'manage_staff')) return Response.json({ error: 'Insufficient permissions' }, { status: 403 });

      const { member_id, target_email, auth_user_id } = body;
      const adminSupabase = getAdminSupabase();
      if (auth_user_id) await adminSupabase.auth.admin.deleteUser(auth_user_id);
      await sr.entities.StaffMember.delete(member_id);

      await logActivity(sr, {
        staff_email: user.email, action: 'delete_staff', action_category: 'staff',
        target_user_email: target_email, ip_address: ipAddress,
      });
      return Response.json({ success: true });
    }

    // ─── RESET PASSWORD ────────────────────────────────────────────
    if (action === 'reset_staff_password') {
      if (!hasPermission(ctx, 'manage_staff')) return Response.json({ error: 'Insufficient permissions' }, { status: 403 });

      const { auth_user_id, target_email } = body;
      const newPassword = 'Reset_' + Math.random().toString(36).slice(-10) + '!';
      const adminSupabase = getAdminSupabase();
      await adminSupabase.auth.admin.updateUserById(auth_user_id, { password: newPassword });

      await logActivity(sr, {
        staff_email: user.email, action: 'reset_staff_password', action_category: 'staff',
        target_user_email: target_email, ip_address: ipAddress,
      });
      return Response.json({ success: true, new_password: newPassword });
    }

    // ─── GET ROLES ─────────────────────────────────────────────────
    if (action === 'get_roles') {
      const roles = await sr.entities.StaffRole.list('role_key', 100);
      return Response.json({ success: true, roles });
    }

    // ─── CREATE ROLE ───────────────────────────────────────────────
    if (action === 'create_role') {
      if (!hasPermission(ctx, 'manage_staff')) return Response.json({ error: 'Insufficient permissions' }, { status: 403 });

      const { role_key, role_name, description, permissions, color } = body;
      const role = await sr.entities.StaffRole.create({
        role_key, role_name, description, permissions: permissions || [],
        is_system_role: false, color: color || '#8b5cf6', created_by: user.email,
      });

      await logActivity(sr, {
        staff_email: user.email, action: 'create_role', action_category: 'staff',
        details: { role_key, role_name, permissions }, ip_address: ipAddress,
      });
      return Response.json({ success: true, role });
    }

    // ─── UPDATE ROLE ───────────────────────────────────────────────
    if (action === 'update_role') {
      if (!hasPermission(ctx, 'manage_staff')) return Response.json({ error: 'Insufficient permissions' }, { status: 403 });

      const { role_id, updates } = body;

      // Privilege ceiling: cannot grant permissions the caller does not have
      // Uses already-resolved ctx — no extra DB reads needed
      if (updates.permissions && !ctx.isClassicAdmin) {
        const forbidden = updates.permissions.filter(p => !ctx.permissions.includes(p));
        if (forbidden.length > 0) {
          return Response.json({
            error: `Cannot grant permissions you do not hold: ${forbidden.join(', ')}`
          }, { status: 403 });
        }
      }

      const role = await sr.entities.StaffRole.update(role_id, updates);

      await logActivity(sr, {
        staff_email: user.email, action: 'update_role', action_category: 'staff',
        target_id: role_id, details: updates, ip_address: ipAddress,
      });
      return Response.json({ success: true, role });
    }

    // ─── DELETE ROLE ───────────────────────────────────────────────
    if (action === 'delete_role') {
      if (!hasPermission(ctx, 'manage_staff')) return Response.json({ error: 'Insufficient permissions' }, { status: 403 });

      const { role_id } = body;
      const roles = await sr.entities.StaffRole.filter({ id: role_id });
      if (roles[0]?.is_system_role) return Response.json({ error: 'System roles cannot be deleted' }, { status: 400 });
      await sr.entities.StaffRole.delete(role_id);

      await logActivity(sr, {
        staff_email: user.email, action: 'delete_role', action_category: 'staff',
        target_id: role_id, ip_address: ipAddress,
      });
      return Response.json({ success: true });
    }

    // ─── GET ACTIVITY LOGS ─────────────────────────────────────────
    if (action === 'get_activity_logs') {
      if (!hasPermission(ctx, 'manage_audit_logs')) return Response.json({ error: 'Insufficient permissions' }, { status: 403 });

      const logs = await sr.entities.StaffActivityLog.list('-created_date', body.limit || 100);
      return Response.json({ success: true, logs });
    }

    // ─── LOG ACTIVITY (called from other admin actions) ────────────
    if (action === 'log_activity') {
      await logActivity(sr, { ...body.log, ip_address: ipAddress, user_agent: userAgent });
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });

  } catch (error) {
    console.error('staffManagement error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});