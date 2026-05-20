/**
 * supabaseAuthBridge — Public auth endpoint.
 * Uses asServiceRole for all operations so no user JWT is needed.
 * This allows unauthenticated users (login/register pages) to call this function.
 */
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

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

async function sendOTPEmail(sr, to, name, code, purpose) {
  try {
    await sr.functions.invoke('emailService', {
      action: 'send_notification',
      to,
      type: 'otp',
      data: { name, code, purpose },
    });
  } catch (e) {
    console.error('OTP email failed:', e.message);
  }
}

Deno.serve(async (req) => {
  try {
    // createClientFromRequest is fine — we use asServiceRole for all ops
    // so no user JWT is required (works for unauthenticated login/register calls)
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole; // shorthand — all entity/function calls go through service role
    const adminSupabase = getAdminClient();
    const body = await req.json();
    const { action } = body;

    // ─── REGISTER ─────────────────────────────────────────────────
    if (action === 'register') {
      const { email, username, full_name, password } = body;
      if (!email || !username || !full_name || !password) {
        return Response.json({ error: 'All fields are required.' }, { status: 400 });
      }
      if (password.length < 8) {
        return Response.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
      }

      // Use getUserByEmail (admin) — simpler and avoids pagination issues
      let existingUser = null;
      try {
        const { data: euData } = await adminSupabase.auth.admin.listUsers({ perPage: 1000, page: 1 });
        existingUser = euData?.users?.find(u => u.email === email.toLowerCase()) || null;
        console.log('existingUser lookup:', existingUser?.id, existingUser?.email);
      } catch(e) {
        console.log('listUsers failed, continuing as new user:', e.message);
      }

      const otp_code = generateOTP();
      const otp_expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const password_hash = await hashPassword(password);

      // Check username taken
      const existingUsername = await sr.entities.UserAccount.filter({ username: username.toLowerCase() });
      if (existingUsername.length > 0) {
        return Response.json({ error: 'This username is already taken.' }, { status: 409 });
      }

      // Check UserAccount entity for existing email
      const existingAccounts = await sr.entities.UserAccount.filter({ email: email.toLowerCase() });
      const existingAccount = existingAccounts[0];
      if (existingAccount?.is_verified) {
        return Response.json({ error: 'This email is already registered.' }, { status: 409 });
      }

      let authUserId;

      if (existingUser) {
        // Auth user exists but unconfirmed — update it
        if (existingUser.email_confirmed_at) {
          return Response.json({ error: 'This email is already registered.' }, { status: 409 });
        }
        await adminSupabase.auth.admin.updateUserById(existingUser.id, {
          password,
          user_metadata: { full_name, username: username.toLowerCase(), role: 'user', otp_code, otp_expires_at, otp_type: 'registration' },
        });
        authUserId = existingUser.id;
      } else {
        // Try to create new auth user
        const { data: createData, error: createError } = await adminSupabase.auth.admin.createUser({
          email: email.toLowerCase(),
          password,
          email_confirm: false,
          user_metadata: { full_name, username: username.toLowerCase(), role: 'user', otp_code, otp_expires_at, otp_type: 'registration' },
          app_metadata: { role: 'user' },
        });
        if (createError) {
          console.error('createUser error:', createError.message);
          return Response.json({ error: 'Registration failed. Please try a different email.' }, { status: 400 });
        }
        authUserId = createData.user.id;
      }

      // Upsert UserAccount entity with auth_user_id
      if (existingAccount) {
        await sr.entities.UserAccount.update(existingAccount.id, {
          username: username.toLowerCase(), full_name, password_hash,
          otp_code, otp_expires_at, otp_type: 'registration', otp_sent_at: new Date().toISOString(),
          auth_user_id: authUserId,
        });
      } else {
        await sr.entities.UserAccount.create({
          email: email.toLowerCase(), username: username.toLowerCase(), full_name, password_hash,
          is_verified: false, is_active: true, role: 'user',
          otp_code, otp_expires_at, otp_type: 'registration',
          otp_sent_at: new Date().toISOString(), login_attempts: 0,
          auth_user_id: authUserId,
        });
      }

      await sendOTPEmail(sr, email, full_name, otp_code, 'Email Verification');
      return Response.json({ success: true, userId: authUserId, message: 'OTP sent to email.' });
    }

    // ─── VERIFY REGISTRATION OTP ───────────────────────────────────
    if (action === 'verify_registration') {
      const { userId, otp } = body;

      const { data: { user: authUser }, error } = await adminSupabase.auth.admin.getUserById(userId);
      if (error || !authUser) return Response.json({ error: 'Account not found.' }, { status: 404 });

      const meta = authUser.user_metadata || {};
      if (authUser.email_confirmed_at) return Response.json({ error: 'Account already verified.' }, { status: 400 });
      if (!meta.otp_code || meta.otp_type !== 'registration') return Response.json({ error: 'Invalid OTP type.' }, { status: 400 });
      if (new Date() > new Date(meta.otp_expires_at)) return Response.json({ error: 'OTP expired. Request a new one.' }, { status: 400 });
      if (meta.otp_code !== otp) return Response.json({ error: 'Invalid OTP code.' }, { status: 400 });

      await adminSupabase.auth.admin.updateUserById(userId, {
        email_confirm: true,
        user_metadata: { ...meta, otp_code: null, otp_expires_at: null, otp_type: null },
      });

      const accounts = await sr.entities.UserAccount.filter({ email: authUser.email });
      if (accounts[0]) {
        await sr.entities.UserAccount.update(accounts[0].id, {
          is_verified: true, otp_code: null, otp_expires_at: null, otp_type: null,
        });
      }

      try {
        await sr.functions.invoke('emailService', {
          action: 'send_notification', to: authUser.email, type: 'registration',
          data: { name: meta.full_name, email: authUser.email, role: 'Trader' },
        });
      } catch (_) {}

      return Response.json({
        success: true,
        autoSignIn: true,
        user: {
          id: authUser.id,
          email: authUser.email,
          username: meta.username,
          full_name: meta.full_name,
          role: meta.role || 'user',
        },
      });
    }

    // ─── LOGIN ─────────────────────────────────────────────────────
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

      const valid = await verifyPassword(password, account.password_hash);
      if (!valid) {
        const attempts = (account.login_attempts || 0) + 1;
        const updates = { login_attempts: attempts };
        if (attempts >= 5) updates.locked_until = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        await sr.entities.UserAccount.update(account.id, updates);
        return Response.json({ error: 'Invalid email or password.' }, { status: 401 });
      }
      if (!account.is_verified) {
        return Response.json({ error: 'Please verify your email first.', needsVerification: true, userId: account.id }, { status: 403 });
      }

      const otp_code = generateOTP();
      const otp_expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      await sr.entities.UserAccount.update(account.id, {
        login_attempts: 0, locked_until: null, otp_code, otp_expires_at, otp_type: 'login', otp_sent_at: new Date().toISOString(),
      });

      await sendOTPEmail(sr, account.email, account.full_name, otp_code, 'Login Verification');
      return Response.json({ success: true, userId: account.id, email: account.email, message: 'OTP sent.' });
    }

    // ─── VERIFY LOGIN OTP ──────────────────────────────────────────
    if (action === 'verify_login') {
      const { userId, otp } = body;
      const ipAddress = req.headers.get('x-forwarded-for') || 'Unknown';
      const userAgent = req.headers.get('user-agent') || 'Unknown';

      console.log('verify_login request:', { userId, otp, timestamp: new Date().toISOString() });
      
      const accounts = await sr.entities.UserAccount.filter({ id: userId });
      const account = accounts[0];
      console.log('Account lookup result:', { found: !!account, accountEmail: account?.email, otp_type: account?.otp_type, otp_expires: account?.otp_expires_at, otp_code: account?.otp_code });
      
      if (!account) return Response.json({ error: 'Account not found.' }, { status: 404 });
      if (account.otp_type !== 'login') return Response.json({ error: 'Invalid OTP type. Please log in again.' }, { status: 400 });
      if (new Date() > new Date(account.otp_expires_at)) return Response.json({ error: 'OTP expired. Please log in again.' }, { status: 400 });
      if (account.otp_code !== otp) return Response.json({ error: 'Invalid OTP code.' }, { status: 400 });

      const authUserId = account.auth_user_id;
      console.log('Attempting to create session for auth_user_id:', authUserId);
      
      if (!authUserId) {
        return Response.json({ error: 'Account setup incomplete. Please contact support.' }, { status: 500 });
      }

      // Non-blocking login alert
      sr.functions.invoke('emailService', {
        action: 'send_notification', to: account.email, type: 'login_alert',
        data: { name: account.full_name, time: new Date().toLocaleString('en-US', { timeZone: 'Asia/Dubai' }), ip: ipAddress, device: userAgent.substring(0, 80) },
      }).catch(() => {});

      // Use generateLink from admin namespace for existing users - this creates a recovery link
      const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
        type: 'recovery',
        email: account.email,
        options: {
          redirectTo: `${Deno.env.get('BASE44_APP_URL')}/dashboard`,
        },
      });

      if (linkError) {
        console.error('GenerateLink error:', linkError.message);
        return Response.json({ error: 'Failed to create session. Please contact support.' }, { status: 500 });
      }

      // Extract tokens from the recovery link
      const url = new URL(linkData.properties.action_link);
      const hashParams = new URLSearchParams(url.hash.substring(1));
      const access_token = hashParams.get('access_token');
      const refresh_token = hashParams.get('refresh_token');

      if (!access_token || !refresh_token) {
        console.error('Failed to extract tokens from recovery link');
        return Response.json({ error: 'Failed to create session. Please contact support.' }, { status: 500 });
      }

      // Clear OTP only after successful session creation
      await sr.entities.UserAccount.update(account.id, {
        otp_code: null, otp_expires_at: null, otp_type: null, last_login_at: new Date().toISOString(),
      });

      return Response.json({
        success: true,
        email: account.email,
        session: { access_token, refresh_token },
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

    // ─── RESEND OTP ────────────────────────────────────────────────
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
      await sendOTPEmail(sr, account.email, account.full_name, otp_code,
        account.otp_type === 'registration' ? 'Email Verification' : 'Login Verification');
      return Response.json({ success: true, message: 'New OTP sent.' });
    }

    return Response.json({ error: 'Unknown action.' }, { status: 400 });

  } catch (error) {
    console.error('supabaseAuthBridge error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});