/**
 * setPasswordForUser — Utility to set password hash for existing user
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

    // Find user
    const users = await sr.entities.User.filter({ email });
    if (users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    // Update user with password hash
    await sr.entities.User.update(users[0].id, { password_hash: passwordHash });

    console.log('[setPasswordForUser] Password set for:', email);

    return Response.json({ 
      success: true,
      user_id: users[0].id,
      email: users[0].email
    });

  } catch (error) {
    console.error('setPasswordForUser error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});