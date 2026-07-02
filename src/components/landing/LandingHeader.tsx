"use client";

import { useTranslations, useLocale } from "next-intl";
import { Shield, Menu, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import ThemeToggle from "@/components/security-trainer/ThemeToggle";

export default function LandingHeader() {
  const t = useTranslations("landing.header");
  const locale = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        <Link href={`/${locale}`} className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-violet-600 to-violet-700 rounded-xl">
            <Shield className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <span className="text-xl font-bold text-foreground">
            CyberSec{" "}
            <span className="bg-gradient-to-r from-violet-500 to-emerald-500 bg-clip-text text-transparent">
              Lab
            </span>
          </span>
        </Link>

        <nav
          className="hidden md:flex items-center gap-6"
          aria-label="Main navigation"
        >
          <a
            href="#how-it-works"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("dashboard")}
          </a>
          <a
            href="#features"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("register")}
          </a>
          <a
            href="#faq"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("login")}
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href={`/${locale}/register`}>
            <Button
              size="sm"
              className="bg-violet-600 hover:bg-violet-700 text-white hidden sm:inline-flex"
            >
              {t("register")}
            </Button>
          </Link>
          <Link href={`/${locale}/login`}>
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
              {t("login")}
            </Button>
          </Link>
          <button
            className="md:hidden p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl px-4 py-4 space-y-3"
          role="navigation"
          aria-label="Mobile navigation"
        >
          <a
            href="#how-it-works"
            className="block text-sm font-medium text-muted-foreground hover:text-foreground py-2"
          >
            {t("dashboard")}
          </a>
          <Link href={`/${locale}/register`}>
            <Button
              size="sm"
              className="w-full bg-violet-600 hover:bg-violet-700 text-white"
            >
              {t("register")}
            </Button>
          </Link>
          <Link href={`/${locale}/login`}>
            <Button variant="outline" size="sm" className="w-full">
              {t("login")}
            </Button>
          </Link>
        </div>
      )}
    </header>
  );
}
