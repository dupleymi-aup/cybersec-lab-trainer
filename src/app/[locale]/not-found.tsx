'use client';
import Link from 'next/link';
import { Shield, ArrowLeft, Home } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

export default function NotFound() {
  const t = useTranslations('errors');
  const locale = useLocale();

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative max-w-md text-center">
        <div className="mb-8 inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-600 to-violet-700 shadow-2xl shadow-violet-600/30">
          <Shield className="h-10 w-10 text-white" aria-hidden="true" />
        </div>

        <h1 className="text-foreground mb-2 text-8xl font-bold">404</h1>
        <p className="text-foreground mb-3 text-2xl font-semibold">{t('notFound')}</p>
        <p className="text-muted-foreground mx-auto mb-10 max-w-sm">{t('notFoundDescription')}</p>

        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-600/25 transition-all hover:scale-105 hover:bg-violet-700"
          >
            <Home className="h-5 w-5" aria-hidden="true" />
            {t('goHome')}
          </Link>
          <button
            onClick={() => window.history.back()}
            className="bg-secondary hover:bg-secondary/80 border-border text-secondary-foreground inline-flex items-center justify-center gap-2 rounded-xl border px-6 py-3 font-semibold transition-all hover:scale-105"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            {t('goBack')}
          </button>
        </div>
      </div>
    </div>
  );
}
