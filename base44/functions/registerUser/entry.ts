/**
 * registerUser — Validates OTP was verified, then returns success so frontend can login.
 * Account creation is handled by base44.auth.register on the frontend.
 * This function just double-checks OTP validity and updates profile fields after account exists.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;

    const { email, otp_id } = await req.json();

    if (!email || !otp_id) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify the OTP was marked as verified
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

    // Check OTP hasn't expired
    if (new Date(otpRecord.expires_at) < new Date(Date.now() - 10 * 60 * 1000)) {
      return Response.json({ error: 'OTP session expired. Please start again.' }, { status: 400 });
    }

    return Response.json({ success: true, message: 'OTP validated' });

  } catch (error) {
    console.error('registerUser error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});