/**
 * registerUser — Creates a Base44 user account via service role.
 * Called AFTER custom OTP verification is complete.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;

    const { email, password, firstName, lastName, country, otp_id } = await req.json();

    if (!email || !password || !otp_id) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Verify OTP was marked as verified
    const otpRecords = await sr.entities.OTP.filter({ id: otp_id });
    if (!otpRecords.length) {
      return Response.json({ error: 'Invalid OTP session' }, { status: 400 });
    }
    const otpRecord = otpRecords[0];

    if (!otpRecord.verified) {
      return Response.json({ error: 'OTP not verified' }, { status: 400 });
    }

    if (otpRecord.email !== email) {
      return Response.json({ error: 'Email mismatch' }, { status: 400 });
    }

    // 2. Register via Base44 (this is the standard way — same as frontend auth.register)
    // Using service role so it doesn't require a user session
    try {
      await sr.auth.register({ email, password });
    } catch (regErr) {
      const msg = regErr.message?.toLowerCase() || '';
      if (!msg.includes('already') && !msg.includes('exist') && !msg.includes('registered')) {
        return Response.json({ error: regErr.message }, { status: 400 });
      }
      // User already exists — that's fine, they may be retrying
    }

    // 3. Update profile fields via User entity (service role can do this)
    try {
      const users = await sr.entities.User.filter({ email });
      if (users.length > 0) {
        const fullName = [firstName, lastName].filter(Boolean).join(' ');
        await sr.entities.User.update(users[0].id, {
          ...(fullName && { full_name: fullName }),
          ...(country && { country }),
        });
      }
    } catch (profileErr) {
      console.error('Profile update (non-blocking):', profileErr.message);
    }

    return Response.json({ success: true });

  } catch (error) {
    console.error('registerUser error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});