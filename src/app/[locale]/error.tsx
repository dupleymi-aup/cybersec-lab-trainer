'use client';

import { useTranslations } from 'next-intl';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function LocaleError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('errors');

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20">
          <AlertTriangle className="h-10 w-10 text-red-400" />
        </div>
        <h1 className="text-foreground mb-2 text-2xl font-bold">{t('serverError')}</h1>
        <p className="text-muted-foreground mb-8 text-sm">{t('serverErrorDescription')}</p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-violet-700"
        >
          <RefreshCw size={16} />
          {t('tryAgain')}
        </button>
      </div>
    </div>
  );
}
