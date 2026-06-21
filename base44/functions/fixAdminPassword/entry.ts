import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import bcrypt from 'npm:bcryptjs@2.4.3';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;

    // Find admin user
    const users = await sr.entities.User.filter({ email: 'workmyads@gmail.com' });
    
    if (users.length === 0) {
      return Response.json({ error: 'Admin user not found' }, { status: 404 });
    }

    const user = users[0];
    
    // Generate password hash for 'Admin@Thai9'
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync('Admin@Thai9', salt);
    
    // Update user with password hash
    await sr.entities.User.update(user.id, { password_hash: passwordHash });
    
    console.log('[fixAdminPassword] Password hash added for:', user.email);
    
    return Response.json({ 
      success: true, 
      message: 'Password hash added to admin account',
      user_id: user.id 
    });

  } catch (error) {
    console.error('fixAdminPassword error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});