import React from 'react';
import FirstTimePromoBanner from '@/components/dashboard/FirstTimePromoBanner';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

/**
 * Renders the First-Time Discount banner when active.
 * The Buy 2 Get 1 Free banner is rendered separately in FundedDashboard
 * (below the progress timeline, above Three Paths to Funded).
 */
export default function PromoCarousel({ onStartChallenge }) {
  const { data: promoSettings = [] } = useQuery({
    queryKey: ['promo-settings-carousel'],
    queryFn: () => base44.entities.PromotionSettings.filter({ setting_key: 'global' }),
    staleTime: 60000,
  });
  const firstTimeActive = promoSettings[0]?.is_first_time_discount_active !== false;

  if (!firstTimeActive) return null;

  return <FirstTimePromoBanner onStartChallenge={onStartChallenge} />;
}