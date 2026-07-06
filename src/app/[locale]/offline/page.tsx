'use client';

import { Shield, WifiOff, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

export default function OfflinePage() {
  const t = useTranslations('errors');
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    window.location.reload();
  };

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="relative mx-auto h-24 w-24">
          <div className="absolute inset-0 animate-ping rounded-full bg-blue-500/20" />
          <div className="bg-card border-border relative rounded-full border p-5 backdrop-blur">
            <WifiOff className="h-14 w-14 text-blue-400" />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-foreground text-3xl font-bold">{t('offline')}</h1>
          <p className="text-muted-foreground text-lg">{t('offlineDescription')}</p>
        </div>

        <div className="bg-card/50 border-border space-y-4 rounded-xl border p-6 backdrop-blur">
          <h2 className="text-foreground flex items-center justify-center gap-2 text-lg font-semibold">
            <Shield className="h-5 w-5 text-emerald-400" />
            {t('offlineCheckTitle')}
          </h2>
          <ul className="text-foreground space-y-2 text-left text-sm">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-blue-400">•</span>
              {t('offlineCheck1')}
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-blue-400">•</span>
              {t('offlineCheck2')}
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-blue-400">•</span>
              {t('offlineCheck3')}
            </li>
          </ul>
        </div>

        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white transition-colors duration-200 hover:bg-blue-700 disabled:bg-blue-600/50"
        >
          <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
          {isRetrying ? t('reconnecting') : t('tryAgain')}
        </button>

        <p className="text-muted-foreground text-xs">{t('offlineBrand')}</p>
      </div>
    </div>
  );
}
