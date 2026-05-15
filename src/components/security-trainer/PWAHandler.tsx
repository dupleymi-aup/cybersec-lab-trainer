'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PWAHandler() {
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
    const handler = (reg: ServiceWorkerRegistration) => {
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setWaitingWorker(newWorker);
            setShowReload(true);
          }
        });
      });
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => handler(reg));
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
    <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white rounded-lg shadow-lg p-4 flex items-center gap-3 max-w-sm">
      <div className="flex-1">
        <p className="text-sm font-medium">Доступно обновление</p>
        <p className="text-xs text-slate-300">Обновите страницу для получения последней версии</p>
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
        Обновить
      </Button>
    </div>
  );
}
