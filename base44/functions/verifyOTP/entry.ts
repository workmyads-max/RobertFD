import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;
    const { otp_id, code } = await req.json();

    if (!otp_id || !code) {
      return Response.json({ error: 'OTP ID and code required' }, { status: 400 });
    }

    // Get OTP record (use service role since caller may not be authenticated yet)
    const otpRecords = await sr.entities.OTP.filter({ id: otp_id });
    if (otpRecords.length === 0) {
      return Response.json({ error: 'Invalid OTP' }, { status: 400 });
    }

    const otpRecord = otpRecords[0];

    // Check if already verified
    if (otpRecord.verified) {
      return Response.json({ error: 'OTP already used' }, { status: 400 });
    }

    // Check expiration
    if (new Date(otpRecord.expires_at) < new Date()) {
      return Response.json({ error: 'OTP expired' }, { status: 400 });
    }

    // Check attempts
    if (otpRecord.attempts >= 5) {
      return Response.json({ error: 'Too many failed attempts' }, { status: 400 });
    }

    // Verify code
    if (otpRecord.code !== code) {
      await sr.entities.OTP.update(otp_id, { attempts: (otpRecord.attempts || 0) + 1 });
      return Response.json({ error: 'Invalid code' }, { status: 400 });
    }

    // Mark as verified
    await sr.entities.OTP.update(otp_id, { verified: true });

    // Update user if phone verification
    if (otpRecord.type === 'phone_verification' && otpRecord.phone) {
      await base44.auth.updateMe({
        phone: otpRecord.phone,
        phone_verified: true
      });
    }

    return Response.json({ 
      success: true,
      message: 'Verification successful'
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});