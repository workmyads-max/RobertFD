import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { user_email, account_id, reason } = await req.json();

    // Create notification
    await base44.asServiceRole.entities.Notification.create({
      user_email,
      title: '⚠️ Risk Warning - Account Review',
      message: `Your account ${account_id} has been flagged for risk review. ${reason || 'Our automated systems detected unusual trading patterns.'} Please contact support if you believe this is an error.`,
      type: 'system',
      priority: 'high',
      display_mode: 'popup',
      is_active: true,
      target: 'challenge'
    });

    // Log the action
    await base44.asServiceRole.entities.RiskAuditLog.create({
      admin_email: user.email,
      action: 'Risk Warning Sent',
      action_category: 'behavioral_analysis',
      target_account: account_id,
      target_user_email: user_email,
      reason: reason || 'Automated risk detection',
      timestamp: new Date().toISOString()
    });

    return Response.json({ success: true, message: 'Warning sent' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});