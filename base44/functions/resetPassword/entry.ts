import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Hash password using Web Crypto API (same as customAuth)
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const salt = 'ff_salt_2026_';
  const data = encoder.encode(salt + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { email, newPassword } = await req.json();
    
    if (!email || !newPassword) {
      return Response.json({ error: 'Email and newPassword required' }, { status: 400 });
    }

    const passwordHash = await hashPassword(newPassword);
    
    const accounts = await base44.asServiceRole.entities.UserAccount.filter({ email });
    if (accounts.length === 0) {
      return Response.json({ error: 'Account not found' }, { status: 404 });
    }

    await base44.asServiceRole.entities.UserAccount.update(accounts[0].id, {
      password_hash: passwordHash,
      login_attempts: 0,
      locked_until: null,
    });

    return Response.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});