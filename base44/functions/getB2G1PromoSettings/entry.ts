/**
 * getB2G1PromoSettings — Public function to fetch Buy 2 Get 1 Free promo settings.
 * Works for unauthenticated visitors (home page popup).
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;

    const settingsList = await sr.entities.PromotionSettings.filter({ setting_key: 'b2g1_promo' });
    const settings = settingsList[0];

    if (!settings) {
      // Return defaults if no settings record exists yet
      return Response.json({
        success: true,
        settings: {
          b2g1_enabled: false,
          b2g1_headline: 'BUY 2 CHALLENGES, GET 1 FREE',
          b2g1_subline: 'Buy two challenges of the same size and automatically receive a third, smaller account on us — added to your order at no cost.',
          b2g1_cta_label: 'Shop Challenges',
          b2g1_badge_text: 'LIMITED OFFER',
          b2g1_tier_mapping: [
            { buy_size: 25000, free_size: 10000 },
            { buy_size: 50000, free_size: 25000 },
            { buy_size: 100000, free_size: 50000 },
            { buy_size: 200000, free_size: 100000 },
          ],
        },
      });
    }

    return Response.json({
      success: true,
      settings: {
        b2g1_enabled: settings.b2g1_enabled ?? false,
        b2g1_headline: settings.b2g1_headline || 'BUY 2 CHALLENGES, GET 1 FREE',
        b2g1_subline: settings.b2g1_subline || '',
        b2g1_cta_label: settings.b2g1_cta_label || 'Shop Challenges',
        b2g1_badge_text: settings.b2g1_badge_text || 'LIMITED OFFER',
        b2g1_tier_mapping: settings.b2g1_tier_mapping || [],
      },
    });
  } catch (error) {
    console.error('[getB2G1PromoSettings] Error:', error.message);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});