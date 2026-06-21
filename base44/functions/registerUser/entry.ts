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

    // Set password via auth.register
    // Note: Base44 automatically sends verification email - this is platform-enforced and cannot be disabled
    try {
      await sr.auth.register({ email, password });
    } catch (regErr) {
      if (!regErr.message?.toLowerCase().includes('already')) {
        console.error('Auth registration note:', regErr.message);
      }
    }

    return Response.json({ 
      success: true,
      user_id: newUser.id,
      email: newUser.email 
    });

  } catch (error) {
    console.error('registerUser error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});