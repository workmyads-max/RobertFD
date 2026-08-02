/**
 * adminResetPassword — Admin-only: reset a user's auth password directly.
 * Requires admin auth. Uses service-role auth.updateUser.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { secrets } from 'base44:runtime';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const body = await req.json();
    const { email, newPassword } = body;
    if (!email || !newPassword) {
      return Response.json({ error: 'email and newPassword are required' }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const sr = base44.asServiceRole;
    const users = await sr.entities.User.filter({ email: email.toLowerCase() });
    if (users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const targetUser = users[0];

    // Try service-role auth update first
    try {
      await sr.auth.updateUser(targetUser.id, { password: newPassword });
      return Response.json({ success: true, message: 'Password reset successfully', email: targetUser.email });
    } catch (e) {
      console.warn('[adminResetPassword] sr.auth.updateUser failed, trying Supabase admin API:', e.message);
    }

    // Fallback: Supabase admin API
    const supabaseUrl = secrets.get('SUPABASE_URL');
    const supabaseKey = secrets.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseKey) {
      return Response.json({ error: 'Supabase credentials not configured' }, { status: 500 });
    }

    console.log('[adminResetPassword] Supabase URL value:', supabaseUrl || 'EMPTY');
    console.log('[adminResetPassword] Supabase Key length:', supabaseKey ? supabaseKey.length : 0);
    console.log('[adminResetPassword] Target user ID:', targetUser.id);

    const updateRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${targetUser.id}`, {
      method: 'PUT',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: newPassword }),
    });

    const responseText = await updateRes.text();
    console.log('[adminResetPassword] Supabase response status:', updateRes.status);
    console.log('[adminResetPassword] Supabase response body:', responseText);

    if (!updateRes.ok) {
      let errData = {};
      try { errData = JSON.parse(responseText); } catch {}
      return Response.json({ error: 'Failed to reset password via Supabase', details: errData, status: updateRes.status, rawError: responseText }, { status: 500 });
    }

    return Response.json({ success: true, message: 'Password reset successfully via Supabase admin API', email: targetUser.email });
  } catch (error) {
    console.error('[adminResetPassword] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}