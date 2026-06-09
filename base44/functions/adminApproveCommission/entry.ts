/**
 * adminApproveCommission — Backend-secured commission status update
 *
 * Validates:
 * 1. Admin role
 * 2. Prevents marking 'paid' a commission already 'paid' (duplicate payout)
 * 3. Audit trail
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json();
    const { commission_id, new_status } = body;

    if (!commission_id || !new_status) {
      return Response.json({ error: 'commission_id and new_status required' }, { status: 400 });
    }

    const validStatuses = ['pending', 'approved', 'paid', 'rejected'];
    if (!validStatuses.includes(new_status)) {
      return Response.json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
    }

    const sr = base44.asServiceRole;
    let commission;
    try {
      commission = await sr.entities.AffiliateCommission.get(commission_id);
    } catch {
      return Response.json({ error: 'Commission not found' }, { status: 404 });
    }
    if (!commission) return Response.json({ error: 'Commission not found' }, { status: 404 });

    // Duplicate payout protection
    if (commission.status === 'paid' && new_status === 'paid') {
      return Response.json({ error: 'Commission is already paid — cannot pay twice' }, { status: 409 });
    }
    if (commission.status === 'paid' && new_status !== 'rejected') {
      return Response.json({ error: 'Cannot change status of an already-paid commission' }, { status: 409 });
    }

    await sr.entities.AffiliateCommission.update(commission.id, {
      status: new_status,
      approved_by: user.email,
      paid_at: new_status === 'paid' ? new Date().toISOString() : commission.paid_at,
    });

    // Audit trail
    await sr.entities.StaffActivityLog.create({
      staff_email: user.email,
      staff_name: user.full_name || user.email,
      role_name: user.role,
      action: `commission_${new_status}`,
      action_category: 'affiliates',
      target_entity: 'AffiliateCommission',
      target_id: commission.id,
      target_user_email: commission.affiliate_email,
      details: {
        commission_id: commission.id,
        old_status: commission.status,
        new_status,
        commission_amount: commission.commission_amount,
        commission_type: commission.commission_type,
      },
      status: 'success',
    });

    return Response.json({ success: true, commission_id: commission.id, new_status });
  } catch (error) {
    console.error('adminApproveCommission error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});