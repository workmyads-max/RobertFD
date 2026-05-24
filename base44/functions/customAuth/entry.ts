import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Secure password hashing with per-user random salt using Web Crypto API
// Format: salt:hash (both hex-encoded)
async function hashPassword(password, existingSalt = null) {
  const encoder = new TextEncoder();
  // Generate a random 16-byte salt if not provided
  const saltBytes = existingSalt
    ? Uint8Array.from(existingSalt.match(/.{2}/g).map(b => parseInt(b, 16)))
    : crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(saltBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  const data = encoder.encode(saltHex + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `${saltHex}:${hashHex}`;
}

async function verifyPassword(password, storedHash) {
  // Support legacy static-salt hashes (no colon separator)
  if (!storedHash.includes(':')) {
    const encoder = new TextEncoder();
    const data = encoder.encode('ff_salt_2026_' + password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const computed = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return computed === storedHash;
  }
  const [saltHex] = storedHash.split(':');
  const newHash = await hashPassword(password, saltHex);
  return newHash === storedHash;
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateToken() {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function sendEmail(base44, to, type, data) {
  try {
    // Use the new emailService function for better tracking
    await base44.functions.invoke('emailService', {
      action: 'send_notification',
      to,
      type,
      data
    });
  } catch (e) {
    console.error('Email send failed:', e.message);
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action } = body;

    // ─── REGISTER ───────────────────────────────────────────────
    if (action === 'register') {
      const { email, username, full_name, password } = body;

      if (!email || !username || !full_name || !password) {
        return Response.json({ error: 'All fields are required.' }, { status: 400 });
      }
      if (password.length < 8) {
        return Response.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
      }

      // Check duplicate email
      const existing = await base44.asServiceRole.entities.UserAccount.filter({ email: email.toLowerCase() });
      if (existing.length > 0) {
        const existingAccount = existing[0];
        // If already verified, reject
        if (existingAccount.is_verified) {
          return Response.json({ error: 'This email is already registered.' }, { status: 409 });
        }
        // If unverified, allow re-registration: update the existing account with new details
        const password_hash = await hashPassword(password);
        const otp_code = generateOTP();
        const otp_expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();

        await base44.asServiceRole.entities.UserAccount.update(existingAccount.id, {
          username: username.toLowerCase(),
          full_name,
          password_hash,
          otp_code,
          otp_expires_at,
          otp_type: 'registration',
          otp_sent_at: new Date().toISOString(),
        });

        await sendEmail(base44, email, 'otp', { name: full_name, code: otp_code, purpose: 'Email Verification' });
        return Response.json({ success: true, userId: existingAccount.id, message: 'OTP sent to email.' });
      }

      // Check duplicate username
      const existingUsername = await base44.asServiceRole.entities.UserAccount.filter({ username: username.toLowerCase() });
      if (existingUsername.length > 0) {
        return Response.json({ error: 'This username is already taken.' }, { status: 409 });
      }

      const password_hash = await hashPassword(password);
      const otp_code = generateOTP();
      const otp_expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      const account = await base44.asServiceRole.entities.UserAccount.create({
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        full_name,
        password_hash,
        is_verified: false,
        is_active: true,
        role: 'user',
        otp_code,
        otp_expires_at,
        otp_type: 'registration',
        otp_sent_at: new Date().toISOString(),
        login_attempts: 0,
      });

      // Try sending email (may fail if email provider not configured)
      await sendEmail(base44, email, 'otp', {
        name: full_name,
        code: otp_code,
        purpose: 'Email Verification',
      });

      return Response.json({ success: true, userId: account.id, message: 'OTP sent to email.' });
    }

    // ─── VERIFY REGISTRATION OTP ─────────────────────────────────
    if (action === 'verify_registration') {
      const { userId, otp } = body;

      const accounts = await base44.asServiceRole.entities.UserAccount.filter({ id: userId });
      const account = accounts[0];

      if (!account) {
        return Response.json({ error: 'Account not found.' }, { status: 404 });
      }
      if (account.is_verified) {
        return Response.json({ error: 'Account already verified.' }, { status: 400 });
      }
      if (account.otp_type !== 'registration') {
        return Response.json({ error: 'Invalid OTP type.' }, { status: 400 });
      }
      if (new Date() > new Date(account.otp_expires_at)) {
        return Response.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 });
      }
      // Track OTP attempts to prevent brute-force
      const regAttempts = (account.login_attempts || 0) + 1;
      if (account.otp_code !== otp) {
        await base44.asServiceRole.entities.UserAccount.update(account.id, { login_attempts: regAttempts });
        if (regAttempts >= 5) {
          await base44.asServiceRole.entities.UserAccount.update(account.id, {
            locked_until: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          });
          return Response.json({ error: 'Too many failed attempts. Account locked for 15 minutes.' }, { status: 429 });
        }
        return Response.json({ error: `Invalid OTP code. ${5 - regAttempts} attempt(s) remaining.` }, { status: 400 });
      }

      await base44.asServiceRole.entities.UserAccount.update(account.id, {
        is_verified: true,
        otp_code: null,
        otp_expires_at: null,
        otp_type: null,
      });

      // Send welcome email
      await sendEmail(base44, account.email, 'registration', {
        name: account.full_name,
        email: account.email,
        role: 'Trader',
      });

      const sessionToken = generateToken();
      return Response.json({
        success: true,
        token: sessionToken,
        user: {
          id: account.id,
          email: account.email,
          username: account.username,
          full_name: account.full_name,
          role: account.role,
          is_verified: true,
        }
      });
    }

    // ─── LOGIN ───────────────────────────────────────────────────
    if (action === 'login') {
      const { email, password } = body;

      if (!email || !password) {
        return Response.json({ error: 'Email and password are required.' }, { status: 400 });
      }

      const accounts = await base44.asServiceRole.entities.UserAccount.filter({ email: email.toLowerCase() });
      const account = accounts[0];

      if (!account) {
        return Response.json({ error: 'Invalid email or password.' }, { status: 401 });
      }

      // Check account lock
      if (account.locked_until && new Date() < new Date(account.locked_until)) {
        const mins = Math.ceil((new Date(account.locked_until) - new Date()) / 60000);
        return Response.json({ error: `Account locked. Try again in ${mins} minute(s).` }, { status: 429 });
      }

      const valid = await verifyPassword(password, account.password_hash);
      if (!valid) {
        const attempts = (account.login_attempts || 0) + 1;
        const updates = { login_attempts: attempts };
        if (attempts >= 5) {
          updates.locked_until = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        }
        await base44.asServiceRole.entities.UserAccount.update(account.id, updates);
        return Response.json({ error: 'Invalid email or password.' }, { status: 401 });
      }

      if (!account.is_verified) {
        return Response.json({ error: 'Please verify your email first.', needsVerification: true, userId: account.id }, { status: 403 });
      }

      // Reset failed attempts
      const otp_code = generateOTP();
      const otp_expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      await base44.asServiceRole.entities.UserAccount.update(account.id, {
        login_attempts: 0,
        locked_until: null,
        otp_code,
        otp_expires_at,
        otp_type: 'login',
        otp_sent_at: new Date().toISOString(),
      });

      // Send login OTP
      await sendEmail(base44, account.email, 'otp', {
        name: account.full_name,
        code: otp_code,
        purpose: 'Login Verification',
      });

      return Response.json({ success: true, userId: account.id, message: 'OTP sent to your email.' });
    }

    // ─── VERIFY LOGIN OTP ────────────────────────────────────────
    if (action === 'verify_login') {
      const { userId, otp } = body;
      const ipAddress = req.headers.get('x-forwarded-for') || 'Unknown';
      const userAgent = req.headers.get('user-agent') || 'Unknown';

      const accounts = await base44.asServiceRole.entities.UserAccount.filter({ id: userId });
      const account = accounts[0];

      if (!account) return Response.json({ error: 'Account not found.' }, { status: 404 });
      if (account.otp_type !== 'login') return Response.json({ error: 'Invalid OTP type.' }, { status: 400 });
      if (new Date() > new Date(account.otp_expires_at)) {
        return Response.json({ error: 'OTP has expired. Please try logging in again.' }, { status: 400 });
      }
      // Track OTP attempts to prevent brute-force
      const loginAttempts = (account.login_attempts || 0) + 1;
      if (account.otp_code !== otp) {
        await base44.asServiceRole.entities.UserAccount.update(account.id, { login_attempts: loginAttempts });
        if (loginAttempts >= 5) {
          await base44.asServiceRole.entities.UserAccount.update(account.id, {
            locked_until: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
            otp_code: null, otp_expires_at: null, otp_type: null,
          });
          return Response.json({ error: 'Too many failed OTP attempts. Please log in again.' }, { status: 429 });
        }
        return Response.json({ error: `Invalid OTP code. ${5 - loginAttempts} attempt(s) remaining.` }, { status: 400 });
      }

      await base44.asServiceRole.entities.UserAccount.update(account.id, {
        otp_code: null,
        otp_expires_at: null,
        otp_type: null,
        last_login_at: new Date().toISOString(),
      });

      const sessionToken = generateToken();
      const tokenHash = await hashPassword(sessionToken); // store hash, never raw token
      const sessionExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

      // Store session token hash for validation/revocation
      await base44.asServiceRole.entities.UserSession.create({
        user_id: account.id,
        token_hash: tokenHash,
        expires_at: sessionExpires,
        ip_address: ipAddress,
        user_agent: userAgent.substring(0, 200),
        is_revoked: false,
      });

      // Send login alert email (non-blocking)
      sendEmail(base44, account.email, 'login_alert', {
        name: account.full_name,
        time: new Date().toLocaleString('en-US', { timeZone: 'Asia/Dubai' }),
        ip: ipAddress,
        device: userAgent.substring(0, 80),
      }).catch(e => console.error('Login alert email failed:', e));
      return Response.json({
        success: true,
        token: sessionToken,
        user: {
          id: account.id,
          email: account.email,
          username: account.username,
          full_name: account.full_name,
          role: account.role,
          is_verified: true,
        }
      });
    }

    // ─── RESEND OTP ──────────────────────────────────────────────
    if (action === 'resend_otp') {
      const { userId } = body;

      const accounts = await base44.asServiceRole.entities.UserAccount.filter({ id: userId });
      const account = accounts[0];
      if (!account) return Response.json({ error: 'Account not found.' }, { status: 404 });

      // Rate limit: 60 seconds between resends
      if (account.otp_sent_at && new Date() - new Date(account.otp_sent_at) < 60000) {
        return Response.json({ error: 'Please wait 60 seconds before requesting another OTP.' }, { status: 429 });
      }

      const otp_code = generateOTP();
      const otp_expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      await base44.asServiceRole.entities.UserAccount.update(account.id, {
        otp_code,
        otp_expires_at,
        otp_sent_at: new Date().toISOString(),
      });

      await sendEmail(base44, account.email, 'otp', {
        name: account.full_name,
        code: otp_code,
        purpose: account.otp_type === 'registration' ? 'Email Verification' : 'Login Verification',
      });

      return Response.json({ success: true, message: 'New OTP sent.' });
    }

    // ─── GET USER BY TOKEN (validates session token) ────────────
    if (action === 'get_me') {
      const { userId, token } = body;
      if (!userId) return Response.json({ error: 'Not authenticated.' }, { status: 401 });

      // If token provided, validate it against stored session
      if (token) {
        const sessions = await base44.asServiceRole.entities.UserSession.filter({
          user_id: userId, is_revoked: false,
        });
        const now = new Date();
        let validSession = null;
        for (const s of sessions) {
          if (new Date(s.expires_at) > now) {
            const isMatch = await verifyPassword(token, s.token_hash);
            if (isMatch) { validSession = s; break; }
          }
        }
        if (!validSession) {
          return Response.json({ error: 'Session expired or invalid. Please log in again.' }, { status: 401 });
        }
      }

      const accounts = await base44.asServiceRole.entities.UserAccount.filter({ id: userId });
      const account = accounts[0];
      if (!account) return Response.json({ error: 'User not found.' }, { status: 404 });

      return Response.json({
        user: {
          id: account.id,
          email: account.email,
          username: account.username,
          full_name: account.full_name,
          role: account.role,
          is_verified: account.is_verified,
          last_login_at: account.last_login_at,
        }
      });
    }

    // ─── LOGOUT (revoke session token) ──────────────────────────
    if (action === 'logout') {
      const { userId, token } = body;
      if (userId && token) {
        const sessions = await base44.asServiceRole.entities.UserSession.filter({
          user_id: userId, is_revoked: false,
        });
        for (const s of sessions) {
          const isMatch = await verifyPassword(token, s.token_hash);
          if (isMatch) {
            await base44.asServiceRole.entities.UserSession.update(s.id, { is_revoked: true });
            break;
          }
        }
      }
      return Response.json({ success: true, message: 'Logged out.' });
    }

    return Response.json({ error: 'Unknown action.' }, { status: 400 });

  } catch (error) {
    console.error('customAuth error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});