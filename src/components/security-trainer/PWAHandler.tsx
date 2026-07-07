'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

export default function PWAHandler() {
  const t = useTranslations('errors');
  const tc = useTranslations('common');
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [showReload, setShowReload] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handler = () => {
        window.location.reload();
      };
      navigator.serviceWorker.addEventListener('controllerchange', handler);
      return () => {
        navigator.serviceWorker.removeEventListener('controllerchange', handler);
      };
    }
  }, []);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      let regRef: ServiceWorkerRegistration | null = null;
      let workerRef: ServiceWorker | null = null;

      const updateFoundHandler = () => {
        const newWorker = regRef?.installing;
        if (!newWorker) return;
        workerRef = newWorker;

        const stateChangeHandler = () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setWaitingWorker(newWorker);
            setShowReload(true);
          }
        };
        newWorker.addEventListener('statechange', stateChangeHandler);
      };

      navigator.serviceWorker.ready.then((reg) => {
        regRef = reg;
        reg.addEventListener('updatefound', updateFoundHandler);
      });

      return () => {
        if (regRef) regRef.removeEventListener('updatefound', updateFoundHandler);
        if (workerRef) {
          // Can't easily extract the handler, but the reference cleanup helps
          workerRef = null;
        }
        regRef = null;
      };
    }
  }, []);

  const handleReload = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
    setShowReload(false);
  };

  if (!showReload) return null;

  return (
    <div className="fixed right-4 bottom-4 z-50 flex max-w-sm items-center gap-3 rounded-lg bg-slate-900 p-4 text-white shadow-lg">
      <div className="flex-1">
        <p className="text-sm font-medium">{t('updateAvailable')}</p>
        <p className="text-xs text-slate-300">{t('updateDescription')}</p>
      </div>
      <Button
        size="sm"
        variant="ghost"
        className="h-8 w-8 p-0 text-slate-300 hover:text-white"
        onClick={() => setShowReload(false)}
      >
        <X size={16} />
      </Button>
      <Button size="sm" onClick={handleReload} className="bg-emerald-600 hover:bg-emerald-700">
        <RefreshCw size={14} className="mr-1" />
        {t('updateRefresh') || tc('refresh')}
      </Button>
    </div>
  );
}
