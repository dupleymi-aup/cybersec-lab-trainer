'use client';

import { useTranslations } from 'next-intl';
import { Shield, Mail, BookOpen, GraduationCap, Lock } from 'lucide-react';

function GitHubIcon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...props}>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}
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
                <GitHubIcon className="h-5 w-5" aria-hidden="true" />
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
