'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Shield, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import ThemeToggle from '@/components/security-trainer/ThemeToggle';
import LanguageSwitcher from '@/components/landing/LanguageSwitcher';

export default function LandingHeader() {
  const t = useTranslations('landing.header');
  const ta = useTranslations('landing.ariaLabels');
  const locale = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-border/50 bg-background/80 sticky top-0 z-40 w-full border-b backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href={`/${locale}`} className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-violet-700">
            <Shield className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <span className="text-foreground text-xl font-bold">
            CyberSec{' '}
            <span className="bg-gradient-to-r from-violet-500 to-emerald-500 bg-clip-text text-transparent">Lab</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label={ta('mainNav')}>
          <a
            href="#how-it-works"
            className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
          >
            {t('howItWorks')}
          </a>
          <a
            href="#features"
            className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
          >
            {t('features')}
          </a>
          <a href="#faq" className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">
            {t('faq')}
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden lg:block">
            <LanguageSwitcher variant="header" />
          </div>
          <ThemeToggle />
          <Link href={`/${locale}/register`}>
            <Button size="sm" className="hidden bg-violet-600 text-white hover:bg-violet-700 sm:inline-flex">
              {t('register')}
            </Button>
          </Link>
          <Link href={`/${locale}/login`}>
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
              {t('login')}
            </Button>
          </Link>
          <button
            type="button"
            className="p-2 md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={ta('toggleMenu')}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          className="border-border/50 bg-background/95 space-y-3 border-t px-4 py-4 backdrop-blur-xl md:hidden"
          role="navigation"
          aria-label={ta('mobileNav')}
        >
          <a
            href="#how-it-works"
            className="text-muted-foreground hover:text-foreground block py-2 text-sm font-medium"
          >
            {t('howItWorks')}
          </a>
          <a href="#features" className="text-muted-foreground hover:text-foreground block py-2 text-sm font-medium">
            {t('features')}
          </a>
          <a href="#faq" className="text-muted-foreground hover:text-foreground block py-2 text-sm font-medium">
            {t('faq')}
          </a>
          <div className="sm:hidden">
            <LanguageSwitcher variant="header" />
          </div>
          <Link href={`/${locale}/register`}>
            <Button size="sm" className="w-full bg-violet-600 text-white hover:bg-violet-700">
              {t('register')}
            </Button>
          </Link>
          <Link href={`/${locale}/login`}>
            <Button variant="outline" size="sm" className="w-full">
              {t('login')}
            </Button>
          </Link>
        </div>
      )}
    </header>
  );
}
