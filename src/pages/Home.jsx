import React from 'react';
import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import SliderSection from '../components/landing/SliderSection';
import ChallengeTypes from '../components/landing/ChallengeTypes';
import PricingSection from '../components/landing/PricingSection';
import RulesSection from '../components/landing/RulesSection';
import PlatformsSection from '../components/landing/PlatformsSection';
import WhyChooseUs from '../components/landing/WhyChooseUs';
import LivePayouts from '../components/landing/LivePayouts';
import Leaderboard from '../components/landing/Leaderboard';
import AffiliateSection from '../components/landing/AffiliateSection';
import FAQSection from '../components/landing/FAQSection';
import AboutSection from '../components/landing/AboutSection';
import LiveChat from '../components/landing/LiveChat';
import Footer from '../components/landing/Footer';

const IMAGES = {
  hero: 'https://media.base44.com/images/public/69ff44f98e27baf8957d0676/9f7dc99e1_generated_b6779f22.png',
  dashboard: 'https://media.base44.com/images/public/69ff44f98e27baf8957d0676/738f56026_generated_d2f76dc8.png',
  infrastructure: 'https://media.base44.com/images/public/69ff44f98e27baf8957d0676/680576437_generated_16455ac0.png',
  mobile: 'https://media.base44.com/images/public/69ff44f98e27baf8957d0676/b8afb295b_generated_03e7dedf.png',
  singapore: 'https://media.base44.com/images/public/69ff44f98e27baf8957d0676/bce196e7d_generated_bc3a5017.png',
  trading: 'https://media.base44.com/images/public/69ff44f98e27baf8957d0676/efd854044_generated_0307144f.png',
};

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground font-inter">
      <Navbar />
      <HeroSection heroImage={IMAGES.hero} />
      <SliderSection images={[IMAGES.trading, IMAGES.dashboard, IMAGES.infrastructure]} />
      <ChallengeTypes />
      <PricingSection />
      <RulesSection />
      <PlatformsSection mobileImage={IMAGES.mobile} />
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