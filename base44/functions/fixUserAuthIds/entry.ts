/**
 * fixUserAuthIds — Admin utility to manually set auth_user_id for specific accounts.
 * Usage: invoke with {email: "user@email.com", auth_user_id: "supabase-user-id"}
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { email, auth_user_id } = body;

    if (!email || !auth_user_id) {
      return Response.json({ error: 'email and auth_user_id are required' }, { status: 400 });
    }

    const accounts = await base44.asServiceRole.entities.UserAccount.filter({ email });
    const account = accounts[0];
    
    if (!account) {
      return Response.json({ error: `No account found for ${email}` }, { status: 404 });
    }

    await base44.asServiceRole.entities.UserAccount.update(account.id, {
      auth_user_id,
    });

    return Response.json({
      success: true,
      email,
      auth_user_id,
      message: 'Account linked successfully',
    });

  } catch (error) {
    console.error('fixUserAuthIds error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});