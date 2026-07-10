'use client';

import { useTranslations } from 'next-intl';
import { Shield, Github, Mail, BookOpen, GraduationCap, Lock } from 'lucide-react';
import Link from 'next/link';

export default function LandingFooter() {
  const t = useTranslations('landing.footer');
  const sections = t.raw('sections') as Record<string, { title: string; links: string[] }>;
  return (
    <footer className="bg-background border-border/50 border-t">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Link href="/" className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-violet-700">
                <Shield className="h-5 w-5 text-white" aria-hidden="true" />
              </div>
              <span className="text-foreground text-xl font-bold">
                CyberSec{' '}
                <span className="bg-gradient-to-r from-violet-500 to-emerald-500 bg-clip-text text-transparent">
                  Lab
                </span>
              </span>
            </Link>
            <p className="text-muted-foreground mb-6 max-w-sm text-sm leading-relaxed">{t('description')}</p>
            <div className="flex gap-3">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-accent hover:bg-accent/80 text-muted-foreground hover:text-foreground flex h-10 w-10 items-center justify-center rounded-xl transition-all"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" aria-hidden="true" />
              </a>
              <a
                href="mailto:contact@cyberseclab.ru"
                className="bg-accent hover:bg-accent/80 text-muted-foreground hover:text-foreground flex h-10 w-10 items-center justify-center rounded-xl transition-all"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" aria-hidden="true" />
              </a>
            </div>
          </div>
          <nav
            aria-label="Footer navigation"
            className="col-span-full grid grid-cols-2 gap-8 md:grid-cols-4 lg:col-span-4"
          >
            {Object.values(sections).map((section) => (
              <div key={section.title}>
                <h4 className="text-foreground mb-4 font-semibold">{section.title}</h4>
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
        <div className="border-border mt-12 border-t pt-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-muted-foreground text-sm">
              {t('copyright', { year: new Date().getFullYear() })}
            </p>
            <div className="flex items-center gap-6">
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                <span>{t('statsModules')}</span>
              </div>
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <GraduationCap className="h-4 w-4" aria-hidden="true" />
                <span>{t('statsStudents')}</span>
              </div>
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Lock className="h-4 w-4" aria-hidden="true" />
                <span>{t('statsQuizzes')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
