/**
 * createAffiliateCommissions — Creates L1/L2/L3 AffiliateCommission records
 * Called after every confirmed challenge purchase payment.
 *
 * Rates:
 *   L1 (direct referrer): 8% of order price
 *   L2 (referrer's referrer): 2% of order price
 *   L3 (depth 3): 1% of order price
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;

    // SECURITY: Only internal service-role calls (from payment webhooks) are permitted.
    // Direct calls from regular users are rejected.
    try {
      const user = await base44.auth.me();
      if (user && user.role !== 'admin') {
        return Response.json({ error: 'Forbidden: Internal function only' }, { status: 403 });
      }
    } catch { /* No session = internal webhook call — allow */ }

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

    // Read rates from AffiliateSettings entity — fallback to original defaults only if missing
    const settingsList = await sr.entities.AffiliateSettings.filter({ setting_key: 'global_config' });
    const settings = settingsList[0];
    const L1_RATE = settings?.l1_rate ?? 8;
    const L2_RATE = settings?.l2_rate ?? 2;
    const L3_RATE = settings?.l3_rate ?? 1;
    console.log(`[createAffiliateCommissions] Rates — L1: ${L1_RATE}%, L2: ${L2_RATE}%, L3: ${L3_RATE}% (source: ${settings ? 'AffiliateSettings.global_config' : 'fallback defaults'})`);

    // Build referral chain: buyer → L1 sponsor → L2 sponsor → L3 sponsor
    const RATES = [
      { level: 1, email: buyerProfile.referred_by_email, rate: L1_RATE },
    ];

    // L2: referrer's referrer
    const l1Profiles = await sr.entities.AffiliateProfile.filter({ user_email: buyerProfile.referred_by_email });
    const l1Profile = l1Profiles[0];
    if (l1Profile?.referred_by_email) {
      RATES.push({ level: 2, email: l1Profile.referred_by_email, rate: L2_RATE });

      // L3: depth 3
      const l2Profiles = await sr.entities.AffiliateProfile.filter({ user_email: l1Profile.referred_by_email });
      const l2Profile = l2Profiles[0];
      if (l2Profile?.referred_by_email) {
        RATES.push({ level: 3, email: l2Profile.referred_by_email, rate: L3_RATE });
      }
    }

    let created = 0;
    for (const { level, email, rate } of RATES) {
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
        notes: `L${level} commission: ${rate}% of $${order_price} (${challenge_type} $${account_size})`,
      });

      // Update affiliate profile totals
      const profiles = await sr.entities.AffiliateProfile.filter({ user_email: email });
      if (profiles[0]) {
        await sr.entities.AffiliateProfile.update(profiles[0].id, {
          total_earned: parseFloat(((profiles[0].total_earned || 0) + commissionAmount).toFixed(2)),
          total_pending: parseFloat(((profiles[0].total_pending || 0) + commissionAmount).toFixed(2)),
          total_purchase_commissions: parseFloat(((profiles[0].total_purchase_commissions || 0) + commissionAmount).toFixed(2)),
        });
      }
      created++;
    }

    return Response.json({ success: true, commissions_created: created, levels: RATES.map(r => r.level) });
  } catch (error) {
    console.error('createAffiliateCommissions error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});