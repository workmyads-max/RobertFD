/**
 * createAffiliateCommissions — Creates L1/L2/L3 AffiliateCommission records
 * Called after every confirmed challenge purchase payment.
 *
 * Rates — in priority order:
 *   1. Affiliate's custom_l1/l2/l3_rate (set by admin)
 *   2. AffiliateSettings global_config l1/l2/l3_rate
 *   3. Hardcoded defaults: L1=8%, L2=2%, L3=1%
 *
 * Also syncs: total_referrals → conversions counter on affiliate profile
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;

    // ── SECURITY: Multi-layer authorization ───────────────────────────────────
    const schedulerToken = req.headers.get('X-Scheduler-Token');
    const expectedToken = Deno.env.get('SCHEDULER_SECRET_TOKEN');
    
    let authorized = false;
    try {
      const user = await base44.auth.me();
      if (user && user.role === 'admin') authorized = true;
    } catch { /* No user session */ }
    
    if (!authorized && schedulerToken && expectedToken && schedulerToken === expectedToken) {
      authorized = true;
    }
    
    if (!authorized) {
      return Response.json({ 
        error: 'Forbidden: Admin authentication or valid scheduler token required',
        code: 'UNAUTHORIZED_ACCESS'
      }, { status: 403 });
    }

    const body = await req.json();
    const { user_email, order_id, order_price, challenge_type, account_size } = body;

    if (!user_email || !order_price) {
      return Response.json({ error: 'user_email and order_price required' }, { status: 400 });
    }

    // Fetch the buyer's affiliate profile to find their referral chain
    const buyerProfiles = await sr.entities.AffiliateProfile.filter({ user_email });
    const buyerProfile = buyerProfiles[0];

    if (!buyerProfile?.referred_by_email) {
      return Response.json({ success: true, commissions_created: 0, reason: 'No referral chain for this user' });
    }

    // IDEMPOTENCY: Check if commissions already exist for this order_id
    if (order_id) {
      const existingComms = await sr.entities.AffiliateCommission.filter({ order_id });
      if (existingComms.length > 0) {
        console.log(`[createAffiliateCommissions] Commissions already exist for order_id=${order_id} — skipping duplicate`);
        return Response.json({ success: true, commissions_created: 0, reason: 'Duplicate: commissions already created for this order_id', order_id });
      }
    }

    // Read global rates from AffiliateSettings
    const settingsList = await sr.entities.AffiliateSettings.filter({ setting_key: 'global_config' });
    const settings = settingsList[0];
    const DEFAULT_L1 = settings?.l1_rate ?? 8;
    const DEFAULT_L2 = settings?.l2_rate ?? 2;
    const DEFAULT_L3 = settings?.l3_rate ?? 1;

    // Build referral chain: buyer → L1 sponsor → L2 sponsor → L3 sponsor
    // For each level, check if the affiliate has custom rates
    const chain = [
      { level: 1, email: buyerProfile.referred_by_email },
    ];

    // L2: referrer's referrer
    const l1Profiles = await sr.entities.AffiliateProfile.filter({ user_email: buyerProfile.referred_by_email });
    const l1Profile = l1Profiles[0];
    if (l1Profile?.referred_by_email) {
      chain.push({ level: 2, email: l1Profile.referred_by_email });

      // L3: depth 3
      const l2Profiles = await sr.entities.AffiliateProfile.filter({ user_email: l1Profile.referred_by_email });
      const l2Profile = l2Profiles[0];
      if (l2Profile?.referred_by_email) {
        chain.push({ level: 3, email: l2Profile.referred_by_email });
      }
    }

    let created = 0;
    for (const { level, email } of chain) {
      // Fetch THIS affiliate's profile to check for custom rates
      const affProfiles = await sr.entities.AffiliateProfile.filter({ user_email: email });
      const affProfile = affProfiles[0];

      // Determine rate: custom > global > hardcoded default
      let rate;
      if (level === 1) {
        rate = affProfile?.custom_l1_rate ?? DEFAULT_L1;
      } else if (level === 2) {
        rate = affProfile?.custom_l2_rate ?? DEFAULT_L2;
      } else {
        rate = affProfile?.custom_l3_rate ?? DEFAULT_L3;
      }

      const commissionAmount = parseFloat(((order_price * rate) / 100).toFixed(2));
      if (commissionAmount <= 0) continue;

      await sr.entities.AffiliateCommission.create({
        affiliate_email: email,
        referred_email: user_email,
        commission_type: 'challenge_purchase',
        level,
        source_amount: order_price,
        commission_rate: rate,
        commission_amount: commissionAmount,
        order_id: order_id || '',
        status: 'pending',
        notes: `L${level} commission: ${rate}% of $${order_price} (${challenge_type} $${account_size})${affProfile?.custom_l1_rate || affProfile?.custom_l2_rate || affProfile?.custom_l3_rate ? ' [custom rate]' : ''}`,
      });

      // Update affiliate profile totals
      if (affProfile) {
        await sr.entities.AffiliateProfile.update(affProfile.id, {
          total_earned: parseFloat(((affProfile.total_earned || 0) + commissionAmount).toFixed(2)),
          total_pending: parseFloat(((affProfile.total_pending || 0) + commissionAmount).toFixed(2)),
          total_purchase_commissions: parseFloat(((affProfile.total_purchase_commissions || 0) + commissionAmount).toFixed(2)),
          conversions: (affProfile.conversions || 0) + 1,
        });
      }
      created++;
    }

    console.log(`[createAffiliateCommissions] Created ${created} commissions for order_id=${order_id}`);
    return Response.json({ success: true, commissions_created: created, levels: chain.map(c => c.level) });
  } catch (error) {
    console.error('createAffiliateCommissions error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});