import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
    try {
        console.log('[getUserAccounts] === REQUEST RECEIVED ===');
        console.log('[getUserAccounts] Request URL:', req.url);
        console.log('[getUserAccounts] Request Method:', req.method);
        console.log('[getUserAccounts] Authorization Header:', req.headers.get('Authorization')?.slice(0, 50) + '...');
        console.log('[getUserAccounts] Cookies:', req.headers.get('Cookie')?.slice(0, 100) + '...');
        
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        console.log('[getUserAccounts] Auth result - User:', user ? { id: user.id, email: user.email, user_metadata: user.user_metadata } : 'NULL');

        if (!user) {
            console.error('[getUserAccounts] UNAUTHORIZED - No user found from auth.me()');
            return Response.json({ 
                error: 'Unauthorized - No session found',
                debug: {
                    hasAuthHeader: !!req.headers.get('Authorization'),
                    hasCookies: !!req.headers.get('Cookie')
                }
            }, { status: 401 });
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
        if (accounts.length > 0) {
            console.log('[getUserAccounts] First account:', {
                id: accounts[0].id,
                user_email: accounts[0].user_email,
                account_size: accounts[0].account_size,
                status: accounts[0].status
            });
        }
        
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
            stack: error.stack,
            success: false 
        }, { status: 500 });
    }
});