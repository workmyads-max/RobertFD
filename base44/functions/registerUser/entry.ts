/**
 * registerUser — Creates a user account WITHOUT email verification.
 * Uses service role to bypass Base44's automatic verification flow.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;

    const { email, password, firstName, lastName, country } = await req.json();

    if (!email || !password) {
      return Response.json({ error: 'Email and password required' }, { status: 400 });
    }

    // Check if user already exists
    const existingUsers = await sr.entities.User.filter({ email });
    if (existingUsers.length > 0) {
      return Response.json({ error: 'Email already registered' }, { status: 400 });
    }

    // Create user directly via User entity (service role bypasses verification)
    const fullName = [firstName, lastName].filter(Boolean).join(' ');
    const newUser = await sr.entities.User.create({
      email,
      full_name: fullName,
      first_name: firstName,
      last_name: lastName,
      ...(country && { country }),
      role: 'user',
    });

    // Generate and send OTP via custom email (Resend)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    
    // Store OTP
    await sr.entities.OTP.create({
      email,
      type: 'registration',
      code: otp,
      expires_at: otpExpiresAt,
      verified: false,
      attempts: 0,
    });

    // Send OTP email via Resend (using emailService function)
    try {
      await sr.functions.invoke('emailService', {
        action: 'send_otp',
        to: email,
        code: otp,
        name: firstName || 'Trader',
        purpose: 'registration'
      });
    } catch (emailErr) {
      console.error('OTP email failed:', emailErr.message);
    }

    return Response.json({ 
      success: true,
      user_id: newUser.id,
      email: newUser.email,
      requires_otp: true,
      message: 'Account created. Please check your email for verification code.'
    });

  } catch (error) {
    console.error('registerUser error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});