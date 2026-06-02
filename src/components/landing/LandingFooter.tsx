"use client";

import {useTranslations} from "next-intl";
import {Shield, Github, Mail, BookOpen, GraduationCap, Lock} from "lucide-react";
import Link from "next/link";

export default function LandingFooter() {
  const t = useTranslations("landing.footer");
  const sections = t.raw("sections") as Record<string, { title: string; links: string[] }>;
  return (
    <footer className="bg-background border-t border-border/50">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-violet-600 to-violet-700 rounded-xl">
                <Shield className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <span className="text-xl font-bold text-foreground">
                CyberSec{" "}
                <span className="bg-gradient-to-r from-violet-500 to-emerald-500 bg-clip-text text-transparent">Lab</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6 max-w-sm">{t("description")}</p>
            <div className="flex gap-3">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent hover:bg-accent/80 text-muted-foreground hover:text-foreground transition-all" aria-label="GitHub">
                <Github className="w-5 h-5" aria-hidden="true" />
              </a>
              <a href="mailto:contact@cyberseclab.ru" className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent hover:bg-accent/80 text-muted-foreground hover:text-foreground transition-all" aria-label="Email">
                <Mail className="w-5 h-5" aria-hidden="true" />
              </a>
            </div>
          </div>
          <nav aria-label="Footer navigation" className="lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-8 col-span-full">
            {Object.values(sections).map((section) => (
              <div key={section.title}>
                <h4 className="text-foreground font-semibold mb-4">{section.title}</h4>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link}>
                      <span className="text-muted-foreground text-sm">{link}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="border-t border-border mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-muted-foreground text-sm">{t("copyright").replace("{year}", String(new Date().getFullYear()))}</p>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-muted-foreground text-sm"><BookOpen className="w-4 h-4" aria-hidden="true" /><span>{t("statsModules")}</span></div>
              <div className="flex items-center gap-2 text-muted-foreground text-sm"><GraduationCap className="w-4 h-4" aria-hidden="true" /><span>{t("statsStudents")}</span></div>
              <div className="flex items-center gap-2 text-muted-foreground text-sm"><Lock className="w-4 h-4" aria-hidden="true" /><span>{t("statsQuizzes")}</span></div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
