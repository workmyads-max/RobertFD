import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;
    const { email, code, otp_id } = await req.json();

    console.log('[verifyOTP] Received:', { email, code, otp_id });

    if (!code) {
      return Response.json({ error: 'Code required' }, { status: 400 });
    }

    // Get OTP record - support lookup by email or otp_id
    let otpRecord;
    if (otp_id) {
      console.log('[verifyOTP] Looking up by ID:', otp_id);
      const otpRecords = await sr.entities.OTP.filter({ id: otp_id });
      if (otpRecords.length === 0) {
        console.log('[verifyOTP] No OTP found with ID');
        return Response.json({ error: 'Invalid OTP' }, { status: 400 });
      }
      otpRecord = otpRecords[0];
    } else if (email) {
      console.log('[verifyOTP] Looking up by email:', email);
      // Find latest unverified OTP for this email
      const allOtps = await sr.entities.OTP.list();
      const otpRecords = allOtps.filter(o => 
        o.email === email && 
        o.type === 'registration' && 
        o.verified === false
      );
      console.log('[verifyOTP] Found OTPs:', otpRecords.length);
      if (otpRecords.length === 0) {
        return Response.json({ error: 'No pending verification found' }, { status: 400 });
      }
      // Get the most recent one
      otpRecord = otpRecords.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      )[0];
      console.log('[verifyOTP] Using OTP:', otpRecord.id);
    } else {
      return Response.json({ error: 'Email or OTP ID required' }, { status: 400 });
    }

    console.log('[verifyOTP] Checking OTP:', { 
      verified: otpRecord.verified, 
      expires_at: otpRecord.expires_at,
      attempts: otpRecord.attempts 
    });

    // Check if already verified
    if (otpRecord.verified) {
      console.log('[verifyOTP] Already verified');
      return Response.json({ error: 'OTP already used' }, { status: 400 });
    }

    // Check expiration
    const now = new Date();
    const expires = new Date(otpRecord.expires_at);
    console.log('[verifyOTP] Expiration check:', { now: now.toISOString(), expires: expires.toISOString() });
    if (expires < now) {
      console.log('[verifyOTP] OTP expired');
      return Response.json({ error: 'OTP expired' }, { status: 400 });
    }

    // Check attempts
    if ((otpRecord.attempts || 0) >= 5) {
      console.log('[verifyOTP] Too many attempts');
      return Response.json({ error: 'Too many failed attempts' }, { status: 400 });
    }

    // Verify code
    console.log('[verifyOTP] Comparing codes:', { stored: otpRecord.code, provided: code });
    if (otpRecord.code !== code) {
      await sr.entities.OTP.update(otpRecord.id, { attempts: (otpRecord.attempts || 0) + 1 });
      console.log('[verifyOTP] Invalid code');
      return Response.json({ error: 'Invalid code' }, { status: 400 });
    }

    // Mark as verified
    console.log('[verifyOTP] Marking as verified');
    await sr.entities.OTP.update(otpRecord.id, { verified: true });

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