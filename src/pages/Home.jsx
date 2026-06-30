import React, { useEffect } from 'react';
import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import TrustBar from '../components/landing/TrustBar';
import SliderSection from '../components/landing/SliderSection';
import DashboardPreview from '../components/landing/DashboardPreview';
import FundedShowcaseDemo from '../components/landing/FundedShowcaseDemo';
import ChallengeHub from '../components/landing/ChallengeHub';
import ChallengeExamples from '../components/landing/ChallengeExamples';
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
import { captureReferralCode } from '@/utils/referralUtils';

const IMAGES = {
  hero: 'https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?w=1800&q=80&fit=crop',
  dashboard: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80&fit=crop',
  infrastructure: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&q=80&fit=crop',
  mobile: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&q=80&fit=crop',
  singapore: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1200&q=80&fit=crop',
  trading: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7d29f?w=1200&q=80&fit=crop',
  mascot: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&q=80&fit=crop',
};

export default function Home() {
  // ── Referral tracking — capture ?ref=CODE into localStorage (30-day expiry)
  // and fire a non-blocking click-tracking backend call. Also kept in a cookie
  // for backward compatibility with any legacy reads.
  useEffect(() => {
    captureReferralCode();
    // Backward-compat cookie
    const refCode = new URLSearchParams(window.location.search).get('ref');
    if (refCode) {
      const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
      document.cookie = `xf_ref=${refCode}; expires=${expires}; path=/; SameSite=Lax`;
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
            Experience the power of funded trading with real-time analytics
          </p>
        </div>
        <FundedShowcaseDemo />
      </section>
      <ChallengeHub />
      <ChallengeExamples />
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