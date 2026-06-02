"use client";

import {useTranslations} from "next-intl";
import {useLocale} from "next-intl";


import LandingHeader from "@/components/landing/LandingHeader";
import HeroSection from "@/components/landing/HeroSection";
import StatsSection from "@/components/landing/StatsSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import DemoModulesSection from "@/components/landing/DemoModulesSection";
import ReviewsSection from "@/components/landing/ReviewsSection";
import CTASection from "@/components/landing/CTASection";
import FAQSection from "@/components/landing/FAQSection";
import LandingFooter from "@/components/landing/LandingFooter";
import LanguageSwitcher from "@/components/landing/LanguageSwitcher";

export default function LandingPage() {
  const _t = useTranslations("landing");
  const _locale = useLocale();
  return (
    <div className="min-h-screen bg-background text-foreground">
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
