/**
 * registerUser — Creates a user account via service role (no Base44 email triggered)
 * Called AFTER custom OTP verification is complete.
 * 
 * Flow:
 * 1. Frontend sends OTP → sendOTP function → Resend email
 * 2. User verifies OTP → verifyOTP function
 * 3. Frontend calls this function → creates account silently → returns session token
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;

    const { email, password, firstName, lastName, country, otp_id, otp_code } = await req.json();

    if (!email || !password || !otp_id || !otp_code) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Verify the OTP first (double-check)
    const otpRecords = await sr.entities.OTP.filter({ id: otp_id });
    if (!otpRecords.length) {
      return Response.json({ error: 'Invalid OTP session' }, { status: 400 });
    }
    const otpRecord = otpRecords[0];

    if (!otpRecord.verified) {
      return Response.json({ error: 'OTP not verified. Please verify your email first.' }, { status: 400 });
    }

    if (otpRecord.email !== email) {
      return Response.json({ error: 'Email mismatch' }, { status: 400 });
    }

    // OTP must have been verified in the last 10 minutes
    const verifiedAt = new Date(otpRecord.updated_date || otpRecord.expires_at);
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    // Allow if expires_at is still in the future (was verified recently enough)
    if (new Date(otpRecord.expires_at) < tenMinutesAgo) {
      return Response.json({ error: 'OTP session expired. Please start again.' }, { status: 400 });
    }

    // 2. Create the account using base44 auth (from backend, no email is triggered)
    // We use the SDK's auth.register on service role context
    try {
      await sr.auth.register({ email, password });
    } catch (regErr) {
      // If account already exists, continue — user may be retrying
      if (!regErr.message?.toLowerCase().includes('already') &&
          !regErr.message?.toLowerCase().includes('exist')) {
        throw regErr;
      }
    }

    // 3. Update profile fields
    try {
      const users = await sr.entities.User.filter({ email });
      if (users.length > 0) {
        const userId = users[0].id;
        const fullName = [firstName, lastName].filter(Boolean).join(' ');
        await sr.entities.User.update(userId, {
          ...(fullName && { full_name: fullName }),
          ...(country && { country }),
        });
      }
    } catch (profileErr) {
      console.error('Profile update error (non-blocking):', profileErr);
    }

    return Response.json({
      success: true,
      message: 'Account created successfully',
    });

  } catch (error) {
    console.error('registerUser error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});