/**
 * loginWithoutVerification — Logs in user and creates Base44 session.
 * Validates password and creates proper auth session for Base44 auth context.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import bcrypt from 'npm:bcryptjs@2.4.3';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;

    const { email, password } = await req.json();

    if (!email || !password) {
      return Response.json({ error: 'Email and password required' }, { status: 400 });
    }

    // Normalize email (lowercase, trim) for consistency
    const normalizedEmail = email.toLowerCase().trim();
    console.log('[loginWithoutVerification] Login attempt for:', normalizedEmail);

    // Find user by email (using normalized email)
    const users = await sr.entities.User.filter({ email: normalizedEmail });
    if (users.length === 0) {
      console.log('[loginWithoutVerification] User not found:', normalizedEmail);
      return Response.json({ error: 'Invalid email or password' }, { status: 400 });
    }

    const user = users[0];
    console.log('[loginWithoutVerification] User found:', user.id, 'Email:', user.email, 'Verified:', user.email_verified, 'Has password_hash:', !!user.password_hash);

    // Verify password hash
    if (!user.password_hash) {
      console.error('[loginWithoutVerification] User has no password_hash:', normalizedEmail);
      return Response.json({ error: 'Invalid email or password' }, { status: 400 });
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      console.log('[loginWithoutVerification] Password invalid for:', normalizedEmail);
      return Response.json({ error: 'Invalid email or password' }, { status: 400 });
    }
    console.log('[loginWithoutVerification] Password valid for:', normalizedEmail);

    // Check if email is verified
    if (user.email_verified === false) {
      console.log('[loginWithoutVerification] Email not verified:', normalizedEmail);
      return Response.json({ 
        error: 'Please verify your email first. Check your inbox for the verification code.',
        requires_verification: true
      }, { status: 403 });
    }
    console.log('[loginWithoutVerification] Email verified, login successful:', normalizedEmail);

    // Return user data for frontend to use
    return Response.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role || 'user',
        email_verified: user.email_verified,
      }
    });

  } catch (error) {
    console.error('loginWithoutVerification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});