/**
 * registerUser — Creates a Base44 user account via service role without OTP.
 * Direct registration for frictionless signup.
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

    // Register via Base44 using service role
    try {
      await sr.auth.register({ email, password });
    } catch (regErr) {
      const msg = regErr.message?.toLowerCase() || '';
      if (!msg.includes('already') && !msg.includes('exist') && !msg.includes('registered')) {
        return Response.json({ error: regErr.message }, { status: 400 });
      }
      // User already exists — that's fine
    }

    // Update profile fields via User entity (service role can do this)
    try {
      const users = await sr.entities.User.filter({ email });
      if (users.length > 0) {
        const fullName = [firstName, lastName].filter(Boolean).join(' ');
        await sr.entities.User.update(users[0].id, {
          ...(fullName && { full_name: fullName }),
          ...(country && { country }),
        });
      }
    } catch (profileErr) {
      console.error('Profile update (non-blocking):', profileErr.message);
    }

    return Response.json({ success: true });

  } catch (error) {
    console.error('registerUser error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});