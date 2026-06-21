/**
 * createUserWithPassword — Create user account with password hash
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import bcrypt from 'npm:bcryptjs@2.4.3';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;

    const { email, password, fullName } = await req.json();

    if (!email || !password) {
      return Response.json({ error: 'Email and password required' }, { status: 400 });
    }

    // Check if user already exists
    const existingUsers = await sr.entities.User.filter({ email });
    if (existingUsers.length > 0) {
      return Response.json({ error: 'User already exists', user_id: existingUsers[0].id }, { status: 400 });
    }

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    // Create user
    const newUser = await sr.entities.User.create({
      email,
      full_name: fullName || email.split('@')[0],
      role: 'user',
      password_hash: passwordHash,
    });

    console.log('[createUserWithPassword] User created:', newUser.id);

    return Response.json({ 
      success: true,
      user_id: newUser.id,
      email: newUser.email
    });

  } catch (error) {
    console.error('createUserWithPassword error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});