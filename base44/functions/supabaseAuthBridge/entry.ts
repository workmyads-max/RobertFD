/**
 * supabaseAuthBridge — v3
 * REGISTRATION: No OTP. Account created and verified immediately.
 * LOGIN: No OTP. Session returned directly after password check.
 * WITHDRAWAL OTP: Handled separately via sendOTP / verifyOTP functions.
 * FORGOT PASSWORD: OTP still used (password reset only).
 */
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

function getAdminClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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

async function verifyPassword(password, storedHash) {
  if (!storedHash) return false;
  if (!storedHash.includes(':')) {
    const encoder = new TextEncoder();
    const data = encoder.encode('ff_salt_2026_' + password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const computed = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    return computed === storedHash;
  }
  const [saltHex] = storedHash.split(':');
  const recomputed = await hashPassword(password, saltHex);
  return recomputed === storedHash;
}

async function sendEmailNonBlocking(sr, to, type, data) {
  try {
    await sr.functions.invoke('emailService', { action: 'send_notification', to, type, data });
  } catch (e) {
    console.error('Email failed (non-blocking):', e.message);
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;
    const adminSupabase = getAdminClient();
    const body = await req.json();
    const { action } = body;

    // ─── REGISTER (no OTP — immediate account creation) ────────────
    if (action === 'register') {
      const { email, username, full_name, password } = body;
      if (!email || !username || !full_name || !password) {
        return Response.json({ error: 'All fields are required.' }, { status: 400 });
      }
      if (password.length < 8) {
        return Response.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
      }

      // Check registration enabled setting
      const regSettings = await sr.entities.PlatformSettings.filter({ setting_key: 'registration_enabled' });
      if (regSettings.length > 0 && regSettings[0].is_enabled === false) {
        return Response.json({ error: 'Registrations are currently disabled.' }, { status: 403 });
      }

      // Check duplicate email
      const existingAccounts = await sr.entities.UserAccount.filter({ email: email.toLowerCase() });
      const existingAccount = existingAccounts[0];
      if (existingAccount && existingAccount.is_verified) {
        return Response.json({ error: 'Account already exists with this email.' }, { status: 409 });
      }

      // Check username taken
      const existingUsername = await sr.entities.UserAccount.filter({ username: username.toLowerCase() });
      if (existingUsername.length > 0 && (!existingAccount || existingUsername[0].id !== existingAccount?.id)) {
        return Response.json({ error: 'This username is already taken.' }, { status: 409 });
      }

      const password_hash = await hashPassword(password);

      // Create or update Supabase auth user
      let authUserId;

      // Try to create auth user
      const { data: createData, error: createError } = await adminSupabase.auth.admin.createUser({
        email: email.toLowerCase(),
        password,
        email_confirm: true, // immediately confirmed — no OTP needed
        user_metadata: { full_name, username: username.toLowerCase(), role: 'user' },
        app_metadata: { role: 'user' },
      });

      if (createError && createError.status === 409) {
        // Email already exists in Supabase auth — find it and update
        const { data: listData } = await adminSupabase.auth.admin.listUsers({ perPage: 1000, page: 1 });
        const conflictUser = listData?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
        if (conflictUser) {
          authUserId = conflictUser.id;
          await adminSupabase.auth.admin.updateUserById(authUserId, {
            password,
            email_confirm: true,
            user_metadata: { full_name, username: username.toLowerCase(), role: 'user' },
            app_metadata: { role: 'user' },
          });
        } else {
          return Response.json({ error: 'Registration failed. Please try again.' }, { status: 400 });
        }
      } else if (createError) {
        console.error('createUser error:', createError.message);
        return Response.json({ error: 'Registration failed. Please try a different email.' }, { status: 400 });
      } else {
        authUserId = createData.user.id;
      }

      // Delete old unverified UserAccount entity if exists
      if (existingAccount) {
        await sr.entities.UserAccount.delete(existingAccount.id);
      }

      // Create fresh UserAccount entity — already verified
      await sr.entities.UserAccount.create({
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        full_name,
        password_hash,
        is_verified: true,
        is_active: true,
        role: 'user',
        login_attempts: 0,
        auth_user_id: authUserId,
      });

      // Sign in immediately to create session
      const { data: signInData, error: signInError } = await adminSupabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      });

      if (signInError) {
        console.error('Auto sign-in after register failed:', signInError.message);
        return Response.json({ error: 'Account created but auto-login failed. Please log in manually.' }, { status: 200 });
      }

      // Send welcome email non-blocking
      sendEmailNonBlocking(sr, email.toLowerCase(), 'registration', {
        name: full_name, email: email.toLowerCase(), role: 'Trader',
      });

      return Response.json({
        success: true,
        session: {
          access_token: signInData.session.access_token,
          refresh_token: signInData.session.refresh_token,
        },
        user: {
          id: authUserId,
          email: email.toLowerCase(),
          username: username.toLowerCase(),
          full_name,
          role: 'user',
          is_verified: true,
        },
      });
    }

    // ─── LOGIN (no OTP — session returned directly) ────────────────
    if (action === 'login') {
      const { email, password } = body;
      if (!email || !password) return Response.json({ error: 'Email and password are required.' }, { status: 400 });

      const accounts = await sr.entities.UserAccount.filter({ email: email.toLowerCase() });
      const account = accounts[0];
      if (!account) return Response.json({ error: 'Invalid email or password.' }, { status: 401 });

      if (account.locked_until && new Date() < new Date(account.locked_until)) {
        const mins = Math.ceil((new Date(account.locked_until) - new Date()) / 60000);
        return Response.json({ error: `Account locked. Try again in ${mins} minute(s).` }, { status: 429 });
      }

      if (!account.is_active) {
        return Response.json({ error: 'Your account has been suspended. Please contact support.' }, { status: 403 });
      }

      const valid = await verifyPassword(password, account.password_hash);
      if (!valid) {
        const attempts = (account.login_attempts || 0) + 1;
        const updates = { login_attempts: attempts };
        if (attempts >= 5) updates.locked_until = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        await sr.entities.UserAccount.update(account.id, updates);
        return Response.json({ error: 'Invalid email or password.' }, { status: 401 });
      }

      // Mark verified if not already (handles legacy accounts)
      if (!account.is_verified) {
        await sr.entities.UserAccount.update(account.id, { is_verified: true });
      }

      // Ensure auth user exists and get session
      const authUserId = account.auth_user_id;
      if (!authUserId) {
        return Response.json({ error: 'Account setup incomplete. Please contact support.' }, { status: 500 });
      }

      // Update the Supabase auth user with the actual submitted password so signIn works
      const { error: updateErr } = await adminSupabase.auth.admin.updateUserById(authUserId, {
        password,
        email_confirm: true,
        user_metadata: { full_name: account.full_name, username: account.username, role: account.role || 'user' },
        app_metadata: { role: account.role || 'user' },
      });

      if (updateErr) {
        console.error('updateUserById failed:', updateErr.message);
        return Response.json({ error: 'Login failed. Please try again.' }, { status: 500 });
      }

      const { data: signInData, error: signInError } = await adminSupabase.auth.signInWithPassword({
        email: account.email,
        password,
      });

      if (signInError) {
        console.error('signInWithPassword failed:', signInError.message);
        return Response.json({ error: 'Login failed. Please try again.' }, { status: 500 });
      }

      // Reset failed attempts, update last login
      await sr.entities.UserAccount.update(account.id, {
        login_attempts: 0,
        locked_until: null,
        last_login_at: new Date().toISOString(),
        otp_code: null,
        otp_expires_at: null,
        otp_type: null,
      });

      return Response.json({
        success: true,
        email: account.email,
        userId: account.id,
        session: {
          access_token: signInData.session.access_token,
          refresh_token: signInData.session.refresh_token,
        },
        user: {
          id: account.id,
          email: account.email,
          username: account.username,
          full_name: account.full_name,
          role: account.role,
          is_verified: true,
        },
      });
    }

    // ─── FORGOT PASSWORD (OTP still required for password reset) ───
    if (action === 'forgot_password') {
      const { email } = body;
      if (!email) return Response.json({ error: 'Email is required.' }, { status: 400 });

      const accounts = await sr.entities.UserAccount.filter({ email: email.toLowerCase() });
      const account = accounts[0];
      if (!account) return Response.json({ success: true, message: 'If this email exists, an OTP has been sent.' });

      const otp_code = generateOTP();
      const otp_expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      await sr.entities.UserAccount.update(account.id, {
        otp_code, otp_expires_at, otp_type: 'password_reset', otp_sent_at: new Date().toISOString(),
      });

      await sendEmailNonBlocking(sr, account.email, 'otp', {
        name: account.full_name || 'Trader', code: otp_code, purpose: 'Password Reset',
      });
      return Response.json({ success: true, userId: account.id, message: 'OTP sent to email.' });
    }

    // ─── RESET PASSWORD WITH OTP ───────────────────────────────────
    if (action === 'reset_password_otp') {
      const { userId, otp, newPassword } = body;
      if (!userId || !otp || !newPassword) return Response.json({ error: 'All fields required.' }, { status: 400 });
      if (newPassword.length < 8) return Response.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });

      const accounts = await sr.entities.UserAccount.filter({ id: userId });
      const account = accounts[0];
      if (!account) return Response.json({ error: 'Account not found.' }, { status: 404 });
      if (account.otp_type !== 'password_reset') return Response.json({ error: 'Invalid OTP type.' }, { status: 400 });
      if (new Date() > new Date(account.otp_expires_at)) return Response.json({ error: 'OTP expired. Please request a new one.' }, { status: 400 });
      if (account.otp_code !== otp) return Response.json({ error: 'Invalid OTP code.' }, { status: 400 });

      const password_hash = await hashPassword(newPassword);
      await sr.entities.UserAccount.update(account.id, {
        password_hash, otp_code: null, otp_expires_at: null, otp_type: null,
        login_attempts: 0, locked_until: null,
      });

      if (account.auth_user_id) {
        await adminSupabase.auth.admin.updateUserById(account.auth_user_id, { password: newPassword });
      }

      return Response.json({ success: true, message: 'Password reset successfully. You can now log in.' });
    }

    // ─── RESEND OTP (only for password_reset type) ─────────────────
    if (action === 'resend_otp') {
      const { userId } = body;
      const accounts = await sr.entities.UserAccount.filter({ id: userId });
      const account = accounts[0];
      if (!account) return Response.json({ error: 'Account not found.' }, { status: 404 });
      if (account.otp_sent_at && new Date() - new Date(account.otp_sent_at) < 60000) {
        return Response.json({ error: 'Please wait 60 seconds before requesting another OTP.' }, { status: 429 });
      }
      const otp_code = generateOTP();
      const otp_expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      await sr.entities.UserAccount.update(account.id, {
        otp_code, otp_expires_at, otp_sent_at: new Date().toISOString(),
      });
      await sendEmailNonBlocking(sr, account.email, 'otp', {
        name: account.full_name, code: otp_code, purpose: 'Password Reset',
      });
      return Response.json({ success: true, message: 'New OTP sent.' });
    }

    return Response.json({ error: 'Unknown action.' }, { status: 400 });

  } catch (error) {
    console.error('supabaseAuthBridge error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});