import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const DEFAULT_TIERS = [
  { buy_size: 25000, free_size: 10000 },
  { buy_size: 50000, free_size: 25000 },
  { buy_size: 100000, free_size: 50000 },
  { buy_size: 200000, free_size: 100000 },
];

/**
 * Public endpoint — returns Buy 2 Get 1 Free promo settings.
 * Used by the home-page popup (unauthenticated) and the checkout flow.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;

    const settings = await sr.entities.PromotionSettings.filter({ setting_key: 'b2g1_promo' });
    const s = settings[0] || {};

    return Response.json({
      success: true,
      settings: {
        b2g1_enabled: s.b2g1_enabled ?? false,
        b2g1_headline: s.b2g1_headline || 'BUY 2 CHALLENGES, GET 1 FREE',
        b2g1_subline: s.b2g1_subline || 'Buy two challenges of the same size and automatically receive a third, smaller account on us — added to your order at no cost.',
        b2g1_cta_label: s.b2g1_cta_label || 'Shop Challenges',
        b2g1_badge_text: s.b2g1_badge_text || 'LIMITED OFFER',
        b2g1_tier_mapping: s.b2g1_tier_mapping?.length ? s.b2g1_tier_mapping : DEFAULT_TIERS,
      },
    });
  } catch (error) {
    return Response.json({
      success: true,
      settings: {
        b2g1_enabled: false,
        b2g1_headline: 'BUY 2 CHALLENGES, GET 1 FREE',
        b2g1_subline: 'Buy two challenges of the same size and automatically receive a third, smaller account on us.',
        b2g1_cta_label: 'Shop Challenges',
        b2g1_badge_text: 'LIMITED OFFER',
        b2g1_tier_mapping: DEFAULT_TIERS,
      },
    });
  }
});