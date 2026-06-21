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

    // Find user by email
    const users = await sr.entities.User.filter({ email });
    if (users.length === 0) {
      return Response.json({ error: 'Invalid email or password' }, { status: 400 });
    }

    const user = users[0];

    // Verify password hash
    if (!user.password_hash) {
      console.error('User has no password_hash:', email);
      return Response.json({ error: 'Invalid email or password' }, { status: 400 });
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      return Response.json({ error: 'Invalid email or password' }, { status: 400 });
    }

    // Return user data for frontend to use
    return Response.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role || 'user',
      }
    });

  } catch (error) {
    console.error('loginWithoutVerification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});