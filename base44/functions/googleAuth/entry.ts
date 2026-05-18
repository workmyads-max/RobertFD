import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { OAuth2Client } from 'npm:google-auth-library@^9.0.0';

const oauth2Client = new OAuth2Client(
  Deno.env.get('GOOGLE_CLIENT_ID'),
  Deno.env.get('GOOGLE_CLIENT_SECRET'),
  'postmessage'
);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get authorization code from request
    const { code } = await req.json();
    if (!code) {
      return Response.json({ error: 'Authorization code required' }, { status: 400 });
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get Google user info
    const googleUser = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    }).then(r => r.json());

    // Check if user exists with this Google ID
    const existingUsers = await base44.entities.User.filter({ google_id: googleUser.sub });
    
    if (existingUsers.length > 0) {
      // Link to existing account
      return Response.json({ 
        success: true, 
        google_id: googleUser.sub,
        email: googleUser.email,
        linked: true 
      });
    }

    // Check if user email matches current user
    const currentUser = await base44.auth.me();
    if (currentUser && currentUser.email === googleUser.email) {
      // Link Google to current account
      await base44.auth.updateMe({
        google_linked: true,
        google_id: googleUser.sub
      });
      return Response.json({ 
        success: true, 
        google_id: googleUser.sub,
        email: googleUser.email,
        linked: true 
      });
    }

    // Return info for new registration
    return Response.json({ 
      success: true,
      google_id: googleUser.sub,
      email: googleUser.email,
      name: googleUser.name,
      picture: googleUser.picture,
      linked: false 
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});