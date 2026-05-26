'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import LandingHeader from '@/components/landing/LandingHeader';
import HeroSection from '@/components/landing/HeroSection';
import StatsSection from '@/components/landing/StatsSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import DemoModulesSection from '@/components/landing/DemoModulesSection';
import ReviewsSection from '@/components/landing/ReviewsSection';
import CTASection from '@/components/landing/CTASection';
import FAQSection from '@/components/landing/FAQSection';
import LandingFooter from '@/components/landing/LandingFooter';

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  // Redirect authenticated users to the app
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard-app');
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return null;
  }

  return (
    <div id="main-content" className="bg-slate-950">
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
    </div>
  );
}
