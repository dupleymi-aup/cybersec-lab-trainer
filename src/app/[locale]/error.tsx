'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { logger } from '@/lib/logger';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations('errors');

  useEffect(() => {
    logger.error('Application error', { error });
  }, [error]);

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="max-w-md text-center">
        <div className="mb-8 inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-red-600 to-red-700 shadow-2xl shadow-red-600/30">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" x2="12" y1="8" y2="12" />
            <line x1="12" x2="12.01" y1="16" y2="16" />
          </svg>
        </div>
        <h1 className="text-foreground mb-3 text-4xl font-bold">{t('serverError')}</h1>
        <p className="text-foreground mb-6">{t('serverErrorDescription')}</p>
        <button
          onClick={reset}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-600/25 transition-all hover:scale-105 hover:bg-violet-700"
        >
          {t('tryAgain')}
        </button>
      </div>
    </div>
  );
}
