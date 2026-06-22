/**
 * trackReferralClick — Increments referral_clicks on an AffiliateProfile.
 *
 * AffiliateProfile.update is admin-only, so this must run via service role.
 * Public endpoint: called when a visitor opens any page with ?ref=CODE.
 *
 * Payload: { referral_code }
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;

    // CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
    }

    const body = await req.json().catch(() => ({}));
    const { referral_code } = body || {};

    if (!referral_code) {
      return Response.json({ error: 'referral_code is required' }, { status: 400 });
    }

    const profiles = await sr.entities.AffiliateProfile.filter({ referral_code });
    if (!profiles || profiles.length === 0) {
      // No profile yet — silently ignore so the link doesn't break for brand-new affiliates
      return Response.json({ success: true, tracked: false, reason: 'No affiliate profile found for code' });
    }

    const profile = profiles[0];
    await sr.entities.AffiliateProfile.update(profile.id, {
      referral_clicks: (profile.referral_clicks || 0) + 1,
    });

    return Response.json({ success: true, tracked: true, clicks: (profile.referral_clicks || 0) + 1 });
  } catch (error) {
    console.error('trackReferralClick error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});