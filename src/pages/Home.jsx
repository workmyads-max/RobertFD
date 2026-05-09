import React from 'react';
import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import TrustBar from '../components/landing/TrustBar';
import SliderSection from '../components/landing/SliderSection';
import DashboardPreview from '../components/landing/DashboardPreview';
import ChallengeTypes from '../components/landing/ChallengeTypes';
import PricingSection from '../components/landing/PricingSection';
import ChallengeRules from '../components/landing/ChallengeRules';
import RulesSection from '../components/landing/RulesSection';
import PlatformsSection from '../components/landing/PlatformsSection';
import MobileAppShowcase from '../components/landing/MobileAppShowcase';
import WhyChooseUs from '../components/landing/WhyChooseUs';
import LivePayouts from '../components/landing/LivePayouts';
import Leaderboard from '../components/landing/Leaderboard';
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
  return (
    <div className="min-h-screen bg-background text-foreground font-inter">
      <PromoPopup mascotImage={IMAGES.mascot} />
      <Navbar />
      <HeroSection heroImage={IMAGES.hero} />
      <TrustBar />
      <SliderSection images={[IMAGES.trading, IMAGES.dashboard, IMAGES.infrastructure]} />
      <DashboardPreview dashImage={IMAGES.dashboard} />
      <ChallengeTypes />
      <PricingSection />
      <ChallengeRules />
      <RulesSection />
      <PlatformsSection mobileImage={IMAGES.mobile} />
      <MobileAppShowcase />
      <WhyChooseUs />
      <LivePayouts />
      <Leaderboard />
      <AffiliateSection />
      <FAQSection />
      <AboutSection aboutImage={IMAGES.singapore} />
      <LiveChat />
      <Footer />
    </div>
  );
}