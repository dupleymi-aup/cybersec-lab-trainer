"use client";

import {Shield, Menu, X, Zap, BookOpen, Award, Users, MessageSquare} from "lucide-react";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import {useState, useEffect, useMemo} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {useTranslations} from "next-intl";
import ThemeToggle from "@/components/security-trainer/ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";

export default function LandingHeader() {
  const t = useTranslations("landing.header");
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  const navItems = useMemo(() => [
    { href: "#how-it-works", label: t("howItWorks.title"), icon: Zap },
    { href: "#features", label: t("features.titleShort") || t("features.title"), icon: BookOpen },
    { href: "#reviews", label: t("reviews.badge"), icon: MessageSquare },
    { href: "#faq", label: "FAQ", icon: Award },
    { href: "/about", label: t("about.title") || "О проекте", icon: Users, isPage: true },
  ], [t]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      const sections = ["how-it-works", "features", "reviews", "faq"];
      const current = sections.find(id => {
        const element = document.getElementById(id);
        if (element) {
          const rect = element.getBoundingClientRect();
          return rect.top <= 100 && rect.bottom >= 100;
        }
        return false;
      });
      setActiveSection(current || "");
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-40 w-full transition-all duration-300 ${
      scrolled 
        ? "border-b border-border/50 bg-background/95 backdrop-blur-xl shadow-lg shadow-violet-600/5" 
        : "border-b border-border/30 bg-background/80 backdrop-blur-xl"
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-violet-600 to-violet-700 rounded-xl shadow-lg shadow-violet-600/20 group-hover:shadow-violet-600/40 transition-all duration-300 group-hover:scale-105">
              <Shield className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <span className="text-xl font-bold text-foreground">
                CyberSec{" "}
                <span className="bg-gradient-to-r from-violet-500 to-emerald-500 bg-clip-text text-transparent">
                  Lab
                </span>
              </span>
              <p className="text-[9px] text-muted-foreground -mt-0.5">{t("subtitle") || "Тренажёр по ИБ"}</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.href.slice(1);
              const Component = item.isPage ? Link : "a";
              const props = item.isPage ? { href: item.href } : { href: item.href };
              return (
                <Component
                  key={item.href}
                  {...props}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive 
                      ? "text-violet-600 dark:text-violet-400 bg-violet-600/10" 
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    }
                  `}
                >
                  <Icon size={14} className={isActive ? "text-violet-600 dark:text-violet-400" : ""} />
                  {item.label}
                </Component>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            <LanguageSwitcher variant="dashboard" />
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-foreground hover:bg-accent">
                {t("login") || "Войти"}
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 text-white shadow-lg shadow-violet-600/20 hover:shadow-violet-600/40 transition-all duration-300">
                {t("register") || "Регистрация"}
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="lg:hidden p-2 rounded-lg hover:bg-accent transition-colors" 
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40 lg:hidden"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="lg:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl px-4 py-4 space-y-3 z-50"
            >
              {/* Mobile Nav Items */}
              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const Component = item.isPage ? Link : "a";
                  const props = item.isPage ? { href: item.href } : { href: item.href };
                  return (
                    <Component
                      key={item.href}
                      {...props}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                    >
                      <Icon size={16} />
                      {item.label}
                    </Component>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-border/50 space-y-3">
                <div className="flex items-center gap-2">
                  <LanguageSwitcher variant="dashboard" />
                  <ThemeToggle />
                </div>
                <Link href="/login" onClick={() => setMenuOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full">
                    {t("login") || "Войти"}
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setMenuOpen(false)}>
                  <Button size="sm" className="w-full bg-gradient-to-r from-violet-600 to-violet-700 text-white">
                    {t("register") || "Регистрация"}
                  </Button>
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
