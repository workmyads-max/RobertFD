import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;
    const { email, code, otp_id } = await req.json();

    if (!code) {
      return Response.json({ error: 'Code required' }, { status: 400 });
    }

    // Get OTP record - support lookup by email or otp_id
    let otpRecord;
    if (otp_id) {
      const otpRecords = await sr.entities.OTP.filter({ id: otp_id });
      if (otpRecords.length === 0) {
        return Response.json({ error: 'Invalid OTP' }, { status: 400 });
      }
      otpRecord = otpRecords[0];
    } else if (email) {
      // Find latest unverified OTP for this email
      const otpRecords = await sr.entities.OTP.filter({ 
        email, 
        type: 'registration',
        verified: false 
      });
      if (otpRecords.length === 0) {
        return Response.json({ error: 'No pending verification found' }, { status: 400 });
      }
      // Get the most recent one
      otpRecord = otpRecords.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      )[0];
    } else {
      return Response.json({ error: 'Email or OTP ID required' }, { status: 400 });
    }

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