import React, { useEffect } from 'react';
import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import TrustBar from '../components/landing/TrustBar';
import SliderSection from '../components/landing/SliderSection';
import DashboardPreview from '../components/landing/DashboardPreview';
import FundedShowcaseDemo from '../components/landing/FundedShowcaseDemo';
import ChallengeTypes from '../components/landing/ChallengeTypes';
import PricingSection from '../components/landing/PricingSection';
import RulesSection from '../components/landing/RulesSection';
import PlatformsSection from '../components/landing/PlatformsSection';
import MobileAppShowcase from '../components/landing/MobileAppShowcase';
import WhyChooseUs from '../components/landing/WhyChooseUs';
import LivePayouts from '../components/landing/LivePayouts';
import Leaderboard from '../components/landing/Leaderboard';
import HomeLeaderboard from '../components/landing/HomeLeaderboard';
import AffiliateSection from '../components/landing/AffiliateSection';
import FAQSection from '../components/landing/FAQSection';
import AboutSection from '../components/landing/AboutSection';
import PromoPopup from '../components/landing/PromoPopup';
import LiveChat from '../components/landing/LiveChat';
import Footer from '../components/landing/Footer';

const IMAGES = {
  hero: 'https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?w=1800&q=80&fit=crop',
  dashboard: 'https://media.base44.com/images/public/69ff44f98e27baf8957d0676/075fdda4e_generated_image.png',
  infrastructure: 'https://media.base44.com/images/public/69ff44f98e27baf8957d0676/680576437_generated_16455ac0.png',
  mobile: 'https://media.base44.com/images/public/69ff44f98e27baf8957d0676/4636aef08_generated_image.png',
  singapore: 'https://media.base44.com/images/public/69ff44f98e27baf8957d0676/bce196e7d_generated_bc3a5017.png',
  trading: 'https://media.base44.com/images/public/69ff44f98e27baf8957d0676/efd854044_generated_0307144f.png',
  mascot: 'https://media.base44.com/images/public/69ff44f98e27baf8957d0676/3b2ee3a7d_generated_image.png',
};

export default function Home() {
  // ── Cookie-based referral tracking ──────────────────────────────────────
  useEffect(() => {
    const refCode = new URLSearchParams(window.location.search).get('ref');
    if (refCode) {
      // Store in cookie with 30-day expiry (matches AffiliateSettings.cookie_days default)
      const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
      document.cookie = `xf_ref=${refCode}; expires=${expires}; path=/; SameSite=Lax`;
      // Clean URL without reload
      const url = new URL(window.location.href);
      url.searchParams.delete('ref');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground font-inter dark">
      <PromoPopup mascotImage={IMAGES.mascot} />
      <Navbar />
      <HeroSection heroImage={IMAGES.hero} />
      <TrustBar />
      <SliderSection images={[IMAGES.trading, IMAGES.dashboard, IMAGES.infrastructure]} />
      <section className="py-20 max-w-[1200px] mx-auto px-6">
        <div className="mb-12 text-center">
          <span className="text-xs font-mono text-primary uppercase tracking-widest">Funded Account Features</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mt-4 mb-4">
            Trade with Real Capital
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
            Experience the power of funded trading with live animations and real-time analytics
          </p>
        </div>
        <FundedShowcaseDemo />
      </section>
      <DashboardPreview dashImage={IMAGES.dashboard} />
      <ChallengeTypes />
      <PricingSection />
      <RulesSection />
      <PlatformsSection mobileImage={IMAGES.mobile} />
      <MobileAppShowcase />
      <WhyChooseUs />
      <LivePayouts />
      <section className="max-w-[1400px] mx-auto px-6 py-20">
        <HomeLeaderboard />
      </section>
      <AffiliateSection />
      <FAQSection />
      <AboutSection aboutImage={IMAGES.singapore} />
      <Footer />
    </div>
  );
}