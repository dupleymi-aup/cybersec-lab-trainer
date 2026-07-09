'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Shield, Home, ArrowLeft } from 'lucide-react';

export default function LocaleNotFound() {
  const t = useTranslations('errors');
  const locale = useLocale();

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
          <Shield className="h-10 w-10 text-slate-400" />
        </div>
        <h1 className="text-foreground mb-2 text-4xl font-bold">404</h1>
        <h2 className="text-foreground mb-2 text-xl font-semibold">{t('notFound')}</h2>
        <p className="text-muted-foreground mb-8 text-sm">{t('notFoundDescription')}</p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-violet-700"
          >
            <Home size={16} />
            {t('goHome')}
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 rounded-lg border px-6 py-2.5 text-sm font-medium transition hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft size={16} />
            {t('goBack')}
          </button>
        </div>
      </div>
    </div>
  );
}
