'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WifiOff, RotateCcw, Shield } from 'lucide-react';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) {
    window.location.href = '/';
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="max-w-md w-full border-slate-200">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
            <WifiOff size={32} className="text-slate-400" />
          </div>
          <CardTitle className="text-xl">Нет подключения к интернету</CardTitle>
          <CardDescription>
            Проверьте соединение или попробуйте загрузить сохранённые материалы
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield size={20} className="text-amber-600 mt-0.5 shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Офлайн-режим</p>
                <p className="text-amber-700">
                  Квизы и теоретические материалы доступны без подключения к интернету.
                  Прогресс сохраняется локально и синхронизируется при восстановлении связи.
                </p>
              </div>
            </div>
          </div>
          <Button
            className="w-full"
            onClick={() => window.location.reload()}
          >
            <RotateCcw size={16} className="mr-2" />
            Попробовать снова
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
