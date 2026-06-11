import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userEmail = user.email || user.user_metadata?.email;
        
        if (!userEmail) {
            console.error('[getUserAccounts] No email found for user:', user.id);
            return Response.json({ error: 'User email not found' }, { status: 400 });
        }

        console.log('[getUserAccounts] Fetching accounts for email:', userEmail);
        
        // Use service role to bypass RLS, but filter by user_email
        const accounts = await base44.asServiceRole.entities.ChallengeAccount.filter({ 
            user_email: userEmail 
        });

        console.log('[getUserAccounts] Found accounts:', accounts.length);
        
        return Response.json({ 
            success: true, 
            accounts,
            count: accounts.length,
            user_email: userEmail
        });
    } catch (error) {
        console.error('[getUserAccounts] Error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});