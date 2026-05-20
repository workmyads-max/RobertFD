/**
 * fixAdminAuth - Recreate missing auth user for admin account
 */
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;
    
    // Get admin account
    const accounts = await sr.entities.UserAccount.filter({ email: 'workmyads@gmail.com' });
    const account = accounts[0];
    
    if (!account) {
      return Response.json({ error: 'Admin account not found' }, { status: 404 });
    }
    
    console.log('Found admin account:', account.id, 'auth_user_id:', account.auth_user_id);
    
    // Find and delete any existing auth user with this email
    const { data: usersData } = await adminSupabase.auth.admin.listUsers({ perPage: 1000, page: 1 });
    const existingAuthUser = usersData?.users?.find(u => u.email?.toLowerCase() === 'workmyads@gmail.com');
    
    if (existingAuthUser) {
      await adminSupabase.auth.admin.deleteUser(existingAuthUser.id);
      console.log('Deleted existing auth user:', existingAuthUser.id);
    }
    
    // Also delete old auth_user_id if different
    if (account.auth_user_id && account.auth_user_id !== existingAuthUser?.id) {
      try {
        await adminSupabase.auth.admin.deleteUser(account.auth_user_id);
        console.log('Deleted old auth_user_id:', account.auth_user_id);
      } catch (e) {
        console.log('Old auth_user_id already deleted:', e.message);
      }
    }
    
    // Create new auth user
    const tempPassword = 'Admin@123';
    const { data: createData, error: createError } = await adminSupabase.auth.admin.createUser({
      email: 'workmyads@gmail.com',
      password: tempPassword,
      email_confirm: true,
      user_metadata: { 
        full_name: account.full_name, 
        username: account.username, 
        role: account.role,
      },
      app_metadata: { role: account.role },
    });
    
    if (createError) {
      console.error('Failed to create auth user:', createError.message);
      return Response.json({ error: 'Failed to create auth user: ' + createError.message }, { status: 500 });
    }
    
    // Update UserAccount with new auth_user_id
    await sr.entities.UserAccount.update(account.id, {
      auth_user_id: createData.user.id,
      password_hash: await hashPassword(tempPassword),
    });
    
    console.log('Successfully fixed admin auth. New auth_user_id:', createData.user.id);
    
    return Response.json({ 
      success: true, 
      message: 'Admin auth fixed successfully',
      new_auth_user_id: createData.user.id,
    });
    
  } catch (error) {
    console.error('fixAdminAuth error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function hashPassword(password, existingSalt = null) {
  const encoder = new TextEncoder();
  const saltBytes = existingSalt
    ? Uint8Array.from(existingSalt.match(/.{2}/g).map(b => parseInt(b, 16)))
    : crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(saltBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  const data = encoder.encode(saltHex + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${saltHex}:${hashHex}`;
}