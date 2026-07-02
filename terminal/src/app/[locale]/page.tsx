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
import ScreenshotsGallery from "@/components/landing/ScreenshotsGallery";
import TechnologiesSection from "@/components/landing/TechnologiesSection";
import ForWhoSection from "@/components/landing/ForWhoSection";
import LearningPathSection from "@/components/learning/LearningPathSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import PartnersSection from "@/components/landing/PartnersSection";
import CTASection from "@/components/landing/CTASection";
import FAQSection from "@/components/landing/FAQSection";
import SecurityTopicsSection from "@/components/landing/SecurityTopicsSection";
import CertificationSection from "@/components/landing/CertificationSection";
import GettingStartedSection from "@/components/landing/GettingStartedSection";
import LandingFooter from "@/components/landing/LandingFooter";

export default function LandingPage() {
  const _t = useTranslations("landing");
  const _locale = useLocale();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main id="main-content">
        <LandingHeader />
        <HeroSection />
        <StatsSection />
        <SecurityTopicsSection />
        <HowItWorksSection />
        <FeaturesSection />
        <TechnologiesSection />
        <LearningPathSection />
        <GettingStartedSection />
        <ForWhoSection />
        <CertificationSection />
        <TestimonialsSection />
        <PartnersSection />
        <DemoModulesSection />
        <ReviewsSection />
        <ScreenshotsGallery />
        <CTASection />
        <FAQSection />
        <LandingFooter />
      </main>
    </div>
  );
}
