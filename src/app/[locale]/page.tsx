'use client';

import dynamic from 'next/dynamic';
import LandingHeader from '@/components/landing/LandingHeader';
import HeroSection from '@/components/landing/HeroSection';
import StatsSection from '@/components/landing/StatsSection';
import LanguageSwitcher from '@/components/landing/LanguageSwitcher';

const HowItWorksSection = dynamic(() => import('@/components/landing/HowItWorksSection'), { ssr: false });
const FeaturesSection = dynamic(() => import('@/components/landing/FeaturesSection'), { ssr: false });
const DemoModulesSection = dynamic(() => import('@/components/landing/DemoModulesSection'), { ssr: false });
const ReviewsSection = dynamic(() => import('@/components/landing/ReviewsSection'), { ssr: false });
const CTASection = dynamic(() => import('@/components/landing/CTASection'), { ssr: false });
const FAQSection = dynamic(() => import('@/components/landing/FAQSection'), { ssr: false });
const LandingFooter = dynamic(() => import('@/components/landing/LandingFooter'), { ssr: false });

export default function LandingPage() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <LanguageSwitcher />
      <main id="main-content">
        <LandingHeader />
        <HeroSection />
        <StatsSection />
        <HowItWorksSection />
        <FeaturesSection />
        <DemoModulesSection />
        <ReviewsSection />
        <CTASection />
        <FAQSection />
        <LandingFooter />
      </main>
    </div>
  );
}
