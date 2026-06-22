import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user's recent paid orders
        const orders = await base44.entities.Order.filter({
            email: user.email,
            payment_status: 'paid',
        }, '-created_date', 1);

        if (orders.length === 0) {
            return Response.json({ created: false });
        }

        const order = orders[0];
        
        // Check if notification already exists for this order
        const existingNotifications = await base44.entities.Notification.filter({
            user_email: user.email,
            message: `Your payment for ${order.challenge_type} $${order.account_size.toLocaleString()} challenge has been verified. Your account is being provisioned.`,
        });

        if (existingNotifications.length > 0) {
            return Response.json({ created: false });
        }

        // Create payment approval notification — USER-SPECIFIC, never a global broadcast.
        // type='announcement' (not 'system' which is reserved for global-only alerts).
        // target='challenge' (scoped to the account owner, not 'all').
        // user_email is ALWAYS set so only the owner sees it — privacy: no cross-user leakage.
        await base44.asServiceRole.entities.Notification.create({
            user_email: user.email.toLowerCase().trim(),
            title: 'Payment Approved — Challenge Account Ready',
            message: `Your payment for ${order.challenge_type} $${order.account_size.toLocaleString()} challenge has been verified. Your account is being provisioned.`,
            type: 'announcement',
            priority: 'high',
            display_mode: 'popup',
            is_active: true,
            target: 'challenge',
            created_date: new Date().toISOString(),
        });

        return Response.json({ created: true, notification: order });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});