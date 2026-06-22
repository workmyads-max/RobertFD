/**
 * processAffiliateAttribution — Called after a user successfully registers & verifies.
 * Creates the new user's AffiliateProfile (with referred_by_code/referred_by_email)
 * and increments the referrer's total_referrals counter.
 *
 * AffiliateProfile.create permission = authenticated (user can create their own).
 * AffiliateProfile.update permission = admin — so the referrer counter increment
 * MUST happen here via service role.
 *
 * Payload: { user_email, referral_code (referrer's code), new_referral_code (optional) }
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;

    // Require an authenticated user (the newly registered user themselves)
    let user;
    try {
      user = await base44.auth.me();
    } catch { /* not authenticated */ }

    const body = await req.json().catch(() => ({}));
    const { user_email, referral_code, new_referral_code } = body || {};

    // Allow either the authenticated self or a service-role call (e.g. scheduled) — but
    // require the user_email to match the authenticated user when present.
    if (!user_email) {
      return Response.json({ error: 'user_email is required' }, { status: 400 });
    }
    if (user && user.email && user.email.toLowerCase() !== String(user_email).toLowerCase() && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: user_email must match authenticated user' }, { status: 403 });
    }

    // Idempotency — if the user already has an AffiliateProfile, do nothing
    const existing = await sr.entities.AffiliateProfile.filter({ user_email });
    if (existing && existing.length > 0) {
      return Response.json({ success: true, already_existed: true, profile_id: existing[0].id });
    }

    // Generate a unique referral code for the new user
    let code = new_referral_code;
    if (!code) {
      code = 'RF' + Math.random().toString(36).slice(2, 8).toUpperCase();
      // Ensure uniqueness
      let attempts = 0;
      while (attempts < 5) {
        const clash = await sr.entities.AffiliateProfile.filter({ referral_code: code });
        if (!clash || clash.length === 0) break;
        code = 'RF' + Math.random().toString(36).slice(2, 8).toUpperCase();
        attempts++;
      }
    }

    let referred_by_email = '';
    let referrerProfile = null;

    if (referral_code) {
      const referrers = await sr.entities.AffiliateProfile.filter({ referral_code });
      if (referrers && referrers.length > 0) {
        referrerProfile = referrers[0];
        referred_by_email = referrerProfile.user_email || '';
      }
    }

    // Create the new user's affiliate profile
    const profile = await sr.entities.AffiliateProfile.create({
      user_email,
      referral_code: code,
      referred_by_code: referral_code || '',
      referred_by_email,
      tier: 'standard',
      level: 1,
      total_earned: 0,
      total_pending: 0,
      total_paid: 0,
      total_purchase_commissions: 0,
      total_payout_commissions: 0,
      referral_clicks: 0,
      total_referrals: 0,
      active_funded_traders: 0,
      conversions: 0,
      is_active: true,
      is_frozen: false,
    });

    // Increment referrer's total_referrals (admin-only update — must use service role)
    if (referrerProfile) {
      await sr.entities.AffiliateProfile.update(referrerProfile.id, {
        total_referrals: (referrerProfile.total_referrals || 0) + 1,
      });
    }

    return Response.json({
      success: true,
      profile_id: profile.id,
      referral_code: code,
      referred_by_email,
      referrer_incremented: !!referrerProfile,
    });
  } catch (error) {
    console.error('processAffiliateAttribution error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});