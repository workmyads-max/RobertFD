import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Simple hash using Web Crypto API
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const salt = 'ff_salt_2026_'; // static salt prefix
  const data = encoder.encode(salt + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password, hash) {
  const computed = await hashPassword(password);
  return computed === hash;
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
    const subjectMap = {
      registration: '🎉 Welcome to XFunded Trader',
      otp: '🔐 Your Verification Code - XFunded Trader',
      login_alert: '🔐 New Login to Your Account',
    };

    let body = '';
    if (type === 'otp') {
      body = `
        <div style="font-family:sans-serif;background:#0a0b10;color:#fff;padding:40px;max-width:600px;margin:0 auto;border-radius:16px;">
          <div style="text-align:center;margin-bottom:30px;">
            <div style="width:60px;height:60px;background:linear-gradient(135deg,#FF5C00,#cc4900);border-radius:16px;display:inline-flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:#fff;margin-bottom:16px;">XF</div>
            <h1 style="color:#FF5C00;font-size:24px;margin:0;">XFunded Trader</h1>
          </div>
          <h2 style="color:#fff;text-align:center;">Your Verification Code</h2>
          <p style="color:rgba(255,255,255,0.6);text-align:center;">Hi ${data.name || 'Trader'}, here is your ${data.purpose || 'verification'} code:</p>
          <div style="background:rgba(255,92,0,0.1);border:2px solid rgba(255,92,0,0.4);border-radius:16px;padding:32px;text-align:center;margin:24px 0;">
            <div style="font-size:48px;font-weight:900;letter-spacing:12px;color:#FF5C00;">${data.code}</div>
            <div style="color:rgba(255,255,255,0.4);font-size:13px;margin-top:12px;">Valid for 10 minutes</div>
          </div>
          <p style="color:rgba(255,255,255,0.4);text-align:center;font-size:12px;">If you did not request this code, please ignore this email.</p>
        </div>
      `;
    } else if (type === 'registration') {
      body = `
        <div style="font-family:sans-serif;background:#0a0b10;color:#fff;padding:40px;max-width:600px;margin:0 auto;border-radius:16px;">
          <h2 style="color:#FF5C00;">Welcome to Funded Firms, ${data.name || 'Trader'}!</h2>
          <p style="color:rgba(255,255,255,0.7);">Your account has been verified and is now active. Start your trading challenge today!</p>
        </div>
      `;
    } else if (type === 'login_alert') {
      body = `
        <div style="font-family:sans-serif;background:#0a0b10;color:#fff;padding:40px;max-width:600px;margin:0 auto;border-radius:16px;">
          <h2 style="color:#FF5C00;">New Login Alert</h2>
          <p style="color:rgba(255,255,255,0.7);">Hi ${data.name || 'Trader'}, your account was accessed at ${data.time}.</p>
          <p style="color:rgba(255,255,255,0.5);">IP: ${data.ip} | Device: ${data.device}</p>
        </div>
      `;
    }

    await base44.asServiceRole.integrations.Core.SendEmail({
      to,
      subject: subjectMap[type] || 'XFunded Trader Notification',
      body,
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
        return Response.json({ error: 'This email is already registered.' }, { status: 409 });
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

      // Return OTP in response as fallback so user can complete registration even if email fails
      return Response.json({ success: true, userId: account.id, message: 'OTP sent to email.', dev_otp: otp_code });
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
      if (account.otp_code !== otp) {
        return Response.json({ error: 'Invalid OTP code.' }, { status: 400 });
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
      if (account.otp_code !== otp) {
        return Response.json({ error: 'Invalid OTP code.' }, { status: 400 });
      }

      await base44.asServiceRole.entities.UserAccount.update(account.id, {
        otp_code: null,
        otp_expires_at: null,
        otp_type: null,
        last_login_at: new Date().toISOString(),
      });

      // Send login alert email
      await sendEmail(base44, account.email, 'login_alert', {
        name: account.full_name,
        time: new Date().toLocaleString('en-US', { timeZone: 'Asia/Dubai' }),
        ip: ipAddress,
        device: userAgent.substring(0, 80),
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

    // ─── GET USER BY TOKEN ───────────────────────────────────────
    if (action === 'get_me') {
      const { userId } = body;
      if (!userId) return Response.json({ error: 'Not authenticated.' }, { status: 401 });

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

    return Response.json({ error: 'Unknown action.' }, { status: 400 });

  } catch (error) {
    console.error('customAuth error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});