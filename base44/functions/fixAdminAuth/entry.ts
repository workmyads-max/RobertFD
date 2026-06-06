/**
 * fixAdminAuth — Creates or updates admin user workmyads@gmail.com
 * Sets password to Admin@Thai9, full admin role, no OTP required.
 * Call this once from dashboard: functions > fixAdminAuth > Test
 */
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

async function hashPassword(password, existingSalt = null) {
  const encoder = new TextEncoder();
  const saltBytes = existingSalt
    ? Uint8Array.from(existingSalt.match(/.{2}/g).map(b => parseInt(b, 16)))
    : crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(saltBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  const data = encoder.encode(saltHex + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${saltHex}:${hashHex}`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;
    const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const ADMIN_EMAIL = 'workmyads@gmail.com';
    const ADMIN_PASSWORD = 'Admin@Thai9';
    const ADMIN_FULL_NAME = 'Platform Admin';
    const ADMIN_USERNAME = 'admin_workmyads';

    const password_hash = await hashPassword(ADMIN_PASSWORD);

    // ── Step 1: Handle Supabase auth user ──────────────────────────
    const { data: listData } = await adminSupabase.auth.admin.listUsers({ perPage: 1000, page: 1 });
    const existingAuthUser = listData?.users?.find(u => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase());

    let authUserId;

    if (existingAuthUser) {
      authUserId = existingAuthUser.id;
      await adminSupabase.auth.admin.updateUserById(authUserId, {
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: ADMIN_FULL_NAME, username: ADMIN_USERNAME, role: 'admin' },
        app_metadata: { role: 'admin' },
      });
      console.log('Updated existing auth user:', authUserId);
    } else {
      const { data: createData, error: createError } = await adminSupabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: ADMIN_FULL_NAME, username: ADMIN_USERNAME, role: 'admin' },
        app_metadata: { role: 'admin' },
      });
      if (createError) {
        return Response.json({ error: 'Failed to create auth user: ' + createError.message }, { status: 500 });
      }
      authUserId = createData.user.id;
      console.log('Created new auth user:', authUserId);
    }

    // ── Step 2: Handle UserAccount entity ──────────────────────────
    const existingAccounts = await sr.entities.UserAccount.filter({ email: ADMIN_EMAIL.toLowerCase() });
    const existingAccount = existingAccounts[0];

    if (existingAccount) {
      await sr.entities.UserAccount.update(existingAccount.id, {
        full_name: ADMIN_FULL_NAME,
        username: ADMIN_USERNAME,
        password_hash,
        is_verified: true,
        is_active: true,
        role: 'admin',
        login_attempts: 0,
        locked_until: null,
        otp_code: null,
        otp_expires_at: null,
        otp_type: null,
        auth_user_id: authUserId,
      });
      console.log('Updated UserAccount entity for', ADMIN_EMAIL);
    } else {
      await sr.entities.UserAccount.create({
        email: ADMIN_EMAIL.toLowerCase(),
        username: ADMIN_USERNAME,
        full_name: ADMIN_FULL_NAME,
        password_hash,
        is_verified: true,
        is_active: true,
        role: 'admin',
        login_attempts: 0,
        auth_user_id: authUserId,
      });
      console.log('Created UserAccount entity for', ADMIN_EMAIL);
    }

    // ── Step 3: Test sign-in ────────────────────────────────────────
    const { data: signInData, error: signInError } = await adminSupabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    if (signInError) {
      return Response.json({
        warning: 'Account set up but test sign-in failed: ' + signInError.message,
        authUserId,
      });
    }

    return Response.json({
      success: true,
      message: 'Admin user created/updated successfully. Login works without OTP.',
      email: ADMIN_EMAIL,
      authUserId,
      role: 'admin',
      session_valid: !!signInData?.session?.access_token,
    });

  } catch (error) {
    console.error('fixAdminAuth error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});