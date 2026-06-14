/**
 * supabaseAuthBridge — v4 (Base44 Auth Only)
 *
 * REMOVED: login, register — handled entirely by base44.auth.loginViaEmailPassword() and base44.auth.register()
 * REMOVED: Supabase JWT session creation — no more persistSession ghost tokens
 * REMOVED: UserAccount dependency for password reset — now uses Base44 OTP entity directly
 *
 * KEPT: forgot_password, reset_password_otp, resend_otp
 *   These store OTP in the Base44 OTP entity and reset the Base44 Auth password
 *   via base44.auth.adminUpdateUserPassword() (service role).
 *
 * STRATEGY for password reset that actually works:
 *   1. User submits email → generate OTP → store in OTP entity → send email
 *   2. User submits OTP + new password → validate OTP → look up Base44 user by email
 *      → call base44 service-role user update to change their Base44 password
 *   3. OTP entity record is cleared after use
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
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
    const body = await req.json();
    const { action } = body;

    // ─── FORGOT PASSWORD ─────────────────────────────────────────────
    // Accepts any email. Stores OTP in OTP entity (not UserAccount).
    // Safe for ALL users regardless of how they registered.
    if (action === 'forgot_password') {
      const { email } = body;
      if (!email) return Response.json({ error: 'Email is required.' }, { status: 400 });

      // Find the Base44 user by email using service role
      const users = await sr.entities.User.filter({ email: email.toLowerCase() });
      // Always return success to prevent email enumeration
      if (users.length === 0) {
        return Response.json({ success: true, message: 'If this email exists, a reset code has been sent.' });
      }
      const user = users[0];

      // Clean up any existing unexpired OTP for this email
      const existingOTPs = await sr.entities.OTP.filter({ email: email.toLowerCase(), type: 'security' });
      await Promise.all(existingOTPs.map(o => sr.entities.OTP.delete(o.id).catch(() => {})));

      const otp_code = generateOTP();
      const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      // Store OTP in OTP entity (Base44 native, not UserAccount)
      const otpRecord = await sr.entities.OTP.create({
        email: email.toLowerCase(),
        type: 'security',
        code: otp_code,
        expires_at,
        verified: false,
        attempts: 0,
      });

      await sendEmailNonBlocking(sr, email.toLowerCase(), 'otp', {
        name: user.full_name || 'Trader',
        code: otp_code,
        purpose: 'Password Reset',
      });

      return Response.json({
        success: true,
        otpId: otpRecord.id,
        message: 'If this email exists, a reset code has been sent.',
      });
    }

    // ─── RESET PASSWORD WITH OTP ─────────────────────────────────────
    // Validates OTP, then uses Base44 service-role to update the user's password.
    // This is the ONLY path that now handles password resets.
    if (action === 'reset_password_otp') {
      const { otpId, otp, newPassword } = body;
      if (!otpId || !otp || !newPassword) {
        return Response.json({ error: 'All fields are required.' }, { status: 400 });
      }
      if (newPassword.length < 8) {
        return Response.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
      }

      // Load the OTP record
      const otpRecords = await sr.entities.OTP.filter({ id: otpId });
      const otpRecord = otpRecords[0];
      if (!otpRecord) return Response.json({ error: 'Reset session expired. Please start again.' }, { status: 404 });
      if (otpRecord.type !== 'security') return Response.json({ error: 'Invalid reset session.' }, { status: 400 });
      if (new Date() > new Date(otpRecord.expires_at)) {
        await sr.entities.OTP.delete(otpRecord.id).catch(() => {});
        return Response.json({ error: 'Reset code expired. Please request a new one.' }, { status: 400 });
      }

      // Enforce max attempts
      const attempts = (otpRecord.attempts || 0) + 1;
      if (otpRecord.code !== otp) {
        if (attempts >= 5) {
          await sr.entities.OTP.delete(otpRecord.id).catch(() => {});
          return Response.json({ error: 'Too many failed attempts. Please start again.' }, { status: 429 });
        }
        await sr.entities.OTP.update(otpRecord.id, { attempts });
        return Response.json({ error: `Invalid code. ${5 - attempts} attempt(s) remaining.` }, { status: 400 });
      }

      // OTP is valid — find the user
      const users = await sr.entities.User.filter({ email: otpRecord.email });
      if (users.length === 0) {
        return Response.json({ error: 'User not found.' }, { status: 404 });
      }
      const user = users[0];

      // Update Base44 Auth password via service role
      // base44.asServiceRole.auth provides admin-level user management
      await sr.auth.updateUser(user.id, { password: newPassword });

      // Clean up OTP record
      await sr.entities.OTP.delete(otpRecord.id).catch(() => {});

      return Response.json({ success: true, message: 'Password reset successfully. You can now sign in.' });
    }

    // ─── RESEND OTP ──────────────────────────────────────────────────
    if (action === 'resend_otp') {
      const { otpId } = body;
      if (!otpId) return Response.json({ error: 'OTP session ID is required.' }, { status: 400 });

      const otpRecords = await sr.entities.OTP.filter({ id: otpId });
      const otpRecord = otpRecords[0];
      if (!otpRecord) return Response.json({ error: 'Reset session not found. Please start again.' }, { status: 404 });

      // Rate limit: 60 seconds between resends
      const lastSent = new Date(otpRecord.updated_date || otpRecord.created_date);
      if (Date.now() - lastSent.getTime() < 60000) {
        return Response.json({ error: 'Please wait 60 seconds before requesting another code.' }, { status: 429 });
      }

      const new_code = generateOTP();
      const new_expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      await sr.entities.OTP.update(otpRecord.id, {
        code: new_code,
        expires_at: new_expires_at,
        attempts: 0,
      });

      // Get user's name for the email
      const users = await sr.entities.User.filter({ email: otpRecord.email });
      const userName = users[0]?.full_name || 'Trader';

      await sendEmailNonBlocking(sr, otpRecord.email, 'otp', {
        name: userName,
        code: new_code,
        purpose: 'Password Reset',
      });

      return Response.json({ success: true, message: 'New reset code sent.' });
    }

    return Response.json({ error: 'Unknown action.' }, { status: 400 });

  } catch (error) {
    console.error('supabaseAuthBridge error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});